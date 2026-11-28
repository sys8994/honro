"""Compile the finite staggered Tiled chapter, including its exact shores and decks."""

import argparse
import math
import json
from pathlib import Path
from shapely.geometry import LineString, Point, Polygon, box
from shapely.ops import unary_union

ROOT = Path(__file__).resolve().parents[1]


def attrs(obj):
    return {p["name"]: p["value"] for p in obj.get("properties", [])}


def soften(points, closed, passes=2):
    for _ in range(passes):
        line = points + [points[0]] if closed else points
        new = [] if closed else [points[0]]
        for a, b in zip(line, line[1:]):
            new.extend(
                tuple(a[i] * t + b[i] * (1 - t) for i in (0, 1)) for t in (0.75, 0.25)
            )
        points = new if closed else new + [points[-1]]
    return points


def irregular_bank(points):
    boundary = Polygon(soften(points, True, 3)).exterior
    n = max(32, math.ceil(boundary.length / 8))
    samples = []
    for i in range(n):
        p = boundary.interpolate(i / n, normalized=True)
        x, y = p.x, p.y
        samples.append(
            (
                x
                + 2.1 * math.sin(y * 0.078 + x * 0.063)
                + 2.6 * math.sin(y * 0.038 - x * 0.057)
                + 0.8 * math.sin(y * 0.21),
                y + 0.9 * math.sin(x * 0.128 + y * 0.065),
            )
        )
    return Polygon(samples).simplify(0.45, preserve_topology=True)


def rings(shape):
    if shape.is_empty:
        return []
    polygons = [shape] if shape.geom_type == "Polygon" else list(shape.geoms)

    def points(ring):
        return [[round(x, 3), round(y, 3)] for x, y in list(ring.coords)[:-1]]

    return [
        [points(p.exterior), *[points(r) for r in p.interiors]]
        for p in polygons
        if p.geom_type == "Polygon" and p.area > 0.05
    ]


def compile_map(source):
    m = json.loads(source.read_text())
    cfg = attrs(m)
    if (
        m.get("orientation"),
        m.get("staggeraxis"),
        m.get("staggerindex"),
        m.get("infinite"),
    ) != ("staggered", "y", "odd", False):
        raise ValueError("Expected finite odd-row staggered diamond tiles")
    tw, th = m["tilewidth"], m["tileheight"]
    cols, rows = m["width"], m["height"]
    left, top = cfg["cropX"], cfg["cropY"]
    vw, vh = cfg["viewWidth"], cfg["viewHeight"]
    nx, ny, cell = cfg["navCols"], cfg["navRows"], cfg["worldCell"]
    sx, sy = vw / nx, vh / ny
    if tw != th * 2 or min(tw, th, cols, rows, nx, ny, cell, vw, vh) <= 0:
        raise ValueError("Invalid 2:1 field")
    extent = box(0, 0, vw, vh)
    gids = {}
    for ref in m["tilesets"]:
        ts = json.loads((source.parent / ref["source"]).read_text())
        for tile in ts["tiles"]:
            gids[ref["firstgid"] + tile["id"]] = attrs(tile)
    layers = {layer["name"]: layer for layer in m["layers"]}
    for layer in layers.values():
        if any(layer.get(k, 0) for k in ["x", "y", "offsetx", "offsety"]):
            raise ValueError("Unsupported offset on " + layer["name"])
    ground = layers["Ground"]
    grid = []
    water_tiles = []
    all_tiles = []
    if (ground["width"], ground["height"], len(ground["data"])) != (
        cols,
        rows,
        cols * rows,
    ):
        raise ValueError("Ground dimensions")
    for i, gid in enumerate(ground["data"]):
        tile = gids[gid]["terrain"]
        grid.append(tile)
        row, col = divmod(i, cols)
        x = (col + 0.5 + 0.5 * (row % 2)) * tw - left
        y = (row + 1) * th / 2 - top
        diamond = Polygon(
            [(x - tw / 2, y), (x, y - th / 2), (x + tw / 2, y), (x, y + th / 2)]
        )
        all_tiles.append(diamond)
        if tile == "water":
            water_tiles.append(diamond.buffer(-2).buffer(2, quad_segs=3))
    if extent.difference(unary_union(all_tiles)).area > 0.01:
        raise ValueError("Viewport has gaps outside authored diamond tiles")

    def pt(obj):
        return obj["x"] - left, obj["y"] - top

    def vertices(obj, kind):
        x, y = pt(obj)
        return [(x + p["x"], y + p["y"]) for p in obj[kind]]

    def anchor(obj):
        x, y = pt(obj)
        return {"x": round(x / sx, 6), "y": round(y / sy, 6)}

    def coords(points):
        return [[round(x, 3), round(y, 3)] for x, y in points]

    trails = []
    streams = []
    decks = {}
    foundations = {}
    for o in layers["Stream and trails"]["objects"]:
        kind = o.get("class") or o.get("type")
        if kind == "River":
            streams.append(irregular_bank(vertices(o, "polygon")))
        elif kind == "Trail":
            trails.append(
                {
                    "id": o["name"],
                    "width": attrs(o)["widthPx"],
                    "points": coords(soften(vertices(o, "polyline"), False)),
                }
            )
        else:
            raise ValueError("Unknown stream or trail " + o["name"])
    for o in layers["Bridge decks"]["objects"]:
        kind = o.get("class") or o.get("type")
        if kind == "Deck":
            points = vertices(o, "polyline")
            width = attrs(o)["widthPx"]
            decks[o["name"]] = (
                LineString(points).buffer(width / 2, cap_style=2),
                coords(points),
                width,
            )
        elif kind == "Foundation":
            foundations[o["name"]] = Polygon(vertices(o, "polygon"))
        else:
            raise ValueError("Unknown footprint " + o["name"])
    river = unary_union(streams + water_tiles).intersection(extent)
    water = river.difference(unary_union([d[0] for d in decks.values()]))
    objects = []
    for o in layers["Props"]["objects"] + layers["Ground decorations"]["objects"]:
        if o.get("rotation") or o["gid"] not in gids:
            raise ValueError("Rotate by authoring the sprite and footprint explicitly")
        a = {**gids[o["gid"]], **attrs(o)}
        name = a["asset"]
        ax, ay = a.get("anchorX", 0.5), a.get("anchorY", 1)
        if not (ROOT / "assets/props" / (name + ".png")).is_file():
            raise ValueError("Missing " + name)
        w, h = o["width"], o["height"]
        x, y = pt(o)
        item = dict(
            id=o["name"],
            asset=name,
            x=round((x - (0.5 - ax) * w) / sx, 6),
            y=round((y - (1 - ay) * h) / sy, 6),
            width=w,
            height=h,
            anchor=[ax, ay],
            radius=a.get("radius", 0.3),
            blocksMovement=a.get("blocksMovement", False),
            blocksProjectile=a.get("blocksProjectile", False),
        )
        if a.get("groundDecoration"):
            item["groundDecoration"] = True
        if item["id"] in decks:
            _, line, span = decks[item["id"]]
            item["deck"] = {"points": line, "width": span}
        if item["id"] in foundations:
            item["foundation"] = rings(foundations[item["id"]])[0][0]
        objects.append(item)
    ids = {o["id"] for o in objects}
    if len(ids) != len(objects) or not (set(decks) | set(foundations)) <= ids:
        raise ValueError("Unmatched footprint or duplicate prop")

    def grid_at(x, y):
        best = None
        row = round((y + top) * 2 / th - 1)
        for r in range(max(0, row - 1), min(rows, row + 2)):
            c = max(0, min(cols - 1, round((x + left) / tw - 0.5 - 0.5 * (r % 2))))
            dx = x - ((c + 0.5 + 0.5 * (r % 2)) * tw - left)
            dy = y - ((r + 1) * th / 2 - top)
            rec = (abs(dx) / tw + abs(dy) / th, grid[r * cols + c])
            if best is None or rec[0] < best[0]:
                best = rec
        return best[1]

    nav = []
    walk = []
    for y in range(ny):
        for x in range(nx):
            p = Point((x + 0.5) * sx, (y + 0.5) * sy)
            wet = water.covers(p)
            nav.append(
                "water" if wet else "path" if river.covers(p) else grid_at(p.x, p.y)
            )
            walk.append(not wet)
    anchor_objs = layers["Chapter 1"]["objects"]
    anchors = {
        o["name"]: anchor(o)
        for o in anchor_objs
        if o.get("point") and not o.get("rotation")
    }
    if len(anchors) != len(anchor_objs):
        raise ValueError("Invalid chapter anchor")
    spawn = next(
        anchor(o)
        for o in layers["Spawn and targets"]["objects"]
        if (o.get("class") or o.get("type")) == "Spawn"
    )
    return dict(
        width=nx,
        height=ny,
        tileWidth=sx,
        tileHeight=sy,
        cell=cell,
        terrain=nav,
        walkable=walk,
        objects=objects,
        spawn=spawn,
        targets=[],
        anchors=anchors,
        grid=dict(
            width=cols,
            height=rows,
            tileWidth=tw,
            tileHeight=th,
            offsetX=left,
            offsetY=top,
            materials=grid,
        ),
        river=rings(river),
        blockedWater=rings(water),
        trails=trails,
        meta=dict(title=cfg["title"], revision=3, source="editable/yeonmok.tmj"),
    )


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "source", nargs="?", type=Path, default=ROOT / "editable/yeonmok.tmj"
    )
    parser.add_argument("--output", type=Path, default=ROOT / "data/yeonmok.json")
    args = parser.parse_args()
    args.output.write_text(
        json.dumps(compile_map(args.source), ensure_ascii=False, separators=(",", ":"))
        + "\n"
    )
