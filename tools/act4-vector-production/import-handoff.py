"""Compile the selected Act 4 handoff layers without importing gameplay data."""
import argparse
import copy
import hashlib
import importlib.util
import json
import xml.etree.ElementTree as ET
from pathlib import Path

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location("honro_svg", HERE.parent / "vector-production/import-svg.py")
importer = importlib.util.module_from_spec(spec)
spec.loader.exec_module(importer)

# Apply only the transferred changes on top of the current runtime art.
# The four coastline/cave contact layers retain the shipped body and joins.
LAYERS = {
    31: {"estuary-earth": ("SURFACE", ["BODY-estuary-earth"]),
         "boarding-wood": ("SURFACE", ["harbor-wood-material"])},
    32: {"body": ("BODY", ["BODY", "SURFACE"]),
         "west-house": ("REAR", ["@asset-west-house"]),
         "workshop": ("REAR", ["@asset-workshop"]),
         "shelter": ("REAR", ["@asset-shelter"])},
    33: {"tidal-contact": ("SURFACE", ["SURFACE"])},
    34: {"cliff-contact": ("SURFACE", ["SURFACE"])},
    35: {"body": ("BODY", ["BODY-rooted-earth", "SURFACE-source-contacts", "SURFACE-fallen-bamboo"]),
         "bamboo-west": ("REAR", ["REAR-noncolliding-bamboo-and-wall:0:6"]),
         "bamboo-east": ("REAR", ["REAR-noncolliding-bamboo-and-wall:6:12"]),
         "walls": ("REAR", ["REAR-noncolliding-bamboo-and-wall:12:15"])},
    36: {"body": ("BODY", ["BODY", "SURFACE"]),
         "village": ("REAR", ["REAR:0:4", "REAR:5:10"])},
    37: {"body": ("BODY", ["BODY", "RETAINING-WALL", "SURFACE"]),
         "road-props": ("REAR", ["REAR", "hoist"]),
         "railings": ("SURFACE", ["REAR-railing"]),
         "reeds": ("FORE", ["FORE"])},
    38: {"cave-contact": ("SURFACE", ["SURFACE"])},
    39: {"shore-contact": ("SURFACE", ["SURFACE"])},
    40: {"pier-braces": ("REAR", ["REAR-source-piers"])},
}


def tag(node):
    return node.tag.rsplit("}", 1)[-1]


def clean(node):
    """The selected SVG uses only empty nested editor defs and solid shapes."""
    node = copy.deepcopy(node)
    for parent in node.iter():
        for child in list(parent):
            if tag(child) == "defs" and len(child) == 0:
                parent.remove(child)
    return node


def compile_layer(name, layer, scene, nodes, registration, bounds):
    vb = scene.get("viewBox")
    assets = {node.get("id"): node for child in scene if tag(child) == "defs" for node in child}
    config = {
        "id": name, "semanticLayer": layer, "preserveCompounds": True,
        "bounds": dict(zip(("x", "y", "w", "h"), bounds)),
        "anchor": {"x": 0, "y": 0}, "foot": {"x": 0, "y": 0},
        "params": {"silhouetteUnderpaint": False},
    }
    symbols = {}

    def shape(node):
        t = tag(node)
        if t == "use":
            href = node.get("href") or node.get("{http://www.w3.org/1999/xlink}href")
            if not href or not href.startswith("#") or href[1:] not in assets:
                raise ValueError(f"Unknown SVG reference in {name}: {href}")
            if set(node.attrib) - {"href", "{http://www.w3.org/1999/xlink}href", "id", "transform"}:
                raise ValueError(f"Unsupported SVG use attributes in {name}")
            symbol = href[1:]
            if symbol not in symbols:
                symbols[symbol] = shape(assets[symbol])
            return {"tag": "use", "symbol": symbol,
                    "transform": importer.matrix(node.get("transform", ""))}
        if any(tag(child) == "use" for child in node.iter()):
            if t != "g" or set(node.attrib) - {"id", "transform"}:
                raise ValueError(f"Unsupported SVG use group in {name}")
            return {"tag": "g", "transform": importer.matrix(node.get("transform", "")),
                    "children": [shape(child) for child in node]}
        svg = ET.Element("svg", {"viewBox": vb})
        svg.append(clean(node))
        return importer.compile_svg(ET.tostring(svg), config)["vector"]["root"]

    # Use the importer for every solid geometry subtree, preserving compound
    # fill and source registration. Symbols keep repeated props as references.
    asset = importer.compile_svg(f'<svg viewBox="{vb}"/>', config)
    root = {"tag": "g", "transform": registration, "children": [shape(n) for n in nodes]}
    asset["vector"]["root"] = root
    if symbols:
        asset["vector"]["symbols"] = symbols
    asset["params"].pop("nodeCount")
    return asset


def selected_nodes(scene, selectors):
    groups = {node.get("id"): node for node in scene if tag(node) != "defs"}
    uses = {node.get("href"): node for node in scene if tag(node) == "use"}
    for selector in selectors:
        if selector.startswith("@"):
            yield uses[f"#{selector[1:]}"]
        else:
            name, *indices = selector.split(":")
            group = copy.deepcopy(groups[name])
            if indices:
                group[:] = list(group)[int(indices[0]):int(indices[1])]
            yield group


def door_32(scene, registration):
    # Existing animation viewport in world coordinates. The exported leaf's
    # scene transform lands inside that same viewport at the current threshold.
    x, y, w, h = 2998, 674, 120, 193
    matrix = [*registration[:4], registration[4] - x, registration[5] - y]
    return compile_layer("act4-handoff:32:door", "REAR", scene,
                         selected_nodes(scene, ["@asset-door"]), matrix, (0, 0, w, h))


def door_36(scene, registration):
    # Invert the normal event landmark pose (scale .7) to paint in its local
    # coordinate space. The fall animation still owns rotation and offset.
    x, y, scale = 1463, 1254, .7
    matrix = [*(v / scale for v in registration[:4]), -x / scale, -y / scale]
    leaf = next(node for node in selected_nodes(scene, ["REAR:4:5"]))
    asset = compile_layer("act4-handoff:36:door", "REAR", scene, [leaf], matrix, (-90, -240, 180, 250))
    asset["params"]["act4DoorForeshortening"] = {"version": 1, "fallenScaleY": .25, "fallenOffsetY": 79}
    return asset



def layer_bounds(directory, scene, layer, registration, width, height):
    if directory.name != "32" or layer not in {"west-house", "workshop", "shelter"}:
        return (-width / 20, 0, width * 1.1, height)
    use = next(selected_nodes(scene, [f"@asset-{layer}"]))
    viewbox = ET.parse(directory / "components" / f"REAR-{layer}.svg").getroot().get("viewBox")
    x, y, w, h = map(float, viewbox.split())
    transform = importer.matrix(use.get("transform"))
    corners = []
    for px, py in ((x, y), (x+w, y), (x, y+h), (x+w, y+h)):
        cx, cy = (transform[0]*px + transform[2]*py + transform[4],
                  transform[1]*px + transform[3]*py + transform[5])
        a, b, c, d, tx, ty = registration
        corners.append((a*cx + c*cy + tx, b*cx + d*cy + ty))
    xs, ys = zip(*corners)
    return (min(xs), min(ys), max(xs)-min(xs), max(ys)-min(ys))

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("bundle", type=Path, help="Extracted HONRO_ACT4_HANDOFF directory")
    parser.add_argument("output", type=Path, help="Runtime asset output directory")
    args = parser.parse_args()
    args.output.mkdir(parents=True, exist_ok=True)
    for stage, layers in LAYERS.items():
        directory = args.bundle / "stages" / str(stage)
        source = (directory / "scene.svg").read_bytes()
        scene = ET.fromstring(source)
        reg = json.loads((directory / "stage-manifest.json").read_text(encoding="utf-8"))["coordinate_registration"]
        matrix = reg["canvas_to_source_world"]
        width, height = reg["source_world_size"]
        assets = [compile_layer(f"act4-handoff:{stage}:{name}", layer, scene, selected_nodes(scene, selectors),
                                matrix, layer_bounds(directory, scene, name, matrix, width, height))
                  for name, (layer, selectors) in layers.items()]
        if stage == 32:
            assets.append(door_32(scene, matrix))
        if stage == 36:
            assets.append(door_36(scene, matrix))
        record = {"sourceSha256": hashlib.sha256(source).hexdigest(),
                  "worldSize": [width, height], "registration": matrix, "assets": assets}
        output = args.output / f"{stage}.json"
        output.write_text(json.dumps(record, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
        print(stage, len(assets), output.stat().st_size, flush=True)


if __name__ == "__main__":
    main()

