"""Bake transparent isometric sprites, foreground rails and editable diamond tiles."""

from pathlib import Path
from PIL import Image, ImageDraw, ImageChops

base = Path(__file__).resolve().parents[1] / "assets"


def crop_sprite(sheet, col, row, columns, rows):
    w, h = sheet.size
    cell = sheet.crop(
        (
            round(w * col / columns),
            round(h * row / rows),
            round(w * (col + 1) / columns),
            round(h * (row + 1) / rows),
        )
    ).convert("RGBA")
    alpha = cell.getchannel("A")
    bounds = alpha.point(lambda x: 255 if x > 55 else 0).getbbox()
    if not bounds or min(alpha.getextrema()) != 0:
        raise ValueError("Expected an isolated cutout on transparency")
    cell.putalpha(alpha.point(lambda x: 0 if x < 18 else x))
    return cell.crop(bounds)


trees = Image.open(base / "source/isometric-pines-elevated.png")
for col, name in enumerate(["pine_a", "pine_b"]):
    pic = crop_sprite(trees, col, 0, 2, 1)
    pic.thumbnail((320, 320), Image.Resampling.LANCZOS)
    pic.save(base / "props" / (name + ".png"), optimize=True)
architecture = Image.open(base / "source/isometric-pass-structures.png")
for name, col, row in [
    ("bridge_ne", 0, 0),
    ("bridge_se", 1, 0),
    ("shrine", 0, 1),
    ("ruin_gate", 1, 1),
]:
    sprite = crop_sprite(architecture, col, row, 2, 2)
    sprite.thumbnail((384, 344), Image.Resampling.LANCZOS)
    sprite.save(base / "props" / (name + ".png"), optimize=True)
    if name.startswith("bridge"):
        # Front faces only. Depth sorting later divides the diagonal rail at each post.
        outline = (
            [(0.195, 0.75), (0.955, 0.163), (1, 0.125), (1, 1), (0, 1), (0, 0.91)]
            if name == "bridge_ne"
            else [
                (0, 0.18),
                (0.055, 0.14),
                (0.77, 0.70),
                (0.92, 0.79),
                (1, 0.79),
                (1, 1),
                (0, 1),
            ]
        )
        w, h = sprite.size
        mask = Image.new("L", (w, h))
        ImageDraw.Draw(mask).polygon(
            [(round(x * w), round(y * h)) for x, y in outline], fill=255
        )
        front = sprite.copy()
        front.putalpha(ImageChops.multiply(sprite.getchannel("A"), mask))
        front.save(base / "props" / (name + "-near.png"), optimize=True)
surfaces = Image.open(base / "source/isometric-pass-surfaces.png").convert("RGB")
w, h = surfaces.size
for name, col, row in [
    ("grass", 0, 0),
    ("path", 1, 0),
    ("water", 0, 1),
    ("gravel", 1, 1),
]:
    source = surfaces.crop(
        (
            col * w // 2 + 5,
            row * h // 2 + 5,
            (col + 1) * w // 2 - 5,
            (row + 1) * h // 2 - 5,
        )
    )
    source.thumbnail((320, 320), Image.Resampling.LANCZOS)
    source.save(base / "terrain" / (name + "_texture.png"), optimize=True)
for name in ["grass", "dirt", "path", "water", "rock"]:
    source = (
        Image.open(base / "terrain" / (name + "_texture.png"))
        .convert("RGBA")
        .resize((96, 48), Image.Resampling.LANCZOS)
    )
    mask = Image.new("L", (96, 48))
    ImageDraw.Draw(mask).polygon([(48, 0), (95, 24), (48, 47), (0, 24)], fill=255)
    source.putalpha(mask)
    source.save(base / "terrain" / (name + ".png"))
# Preserve the exact alpha sum. The lower silhouette contains wood or masonry;
# the high silhouette contains only branches/eaves that can cover a nearer actor.
for name, edge, high in [
    (
        "pine_a",
        [
            (0, 0.90),
            (0.23, 0.94),
            (0.43, 0.87),
            (0.50, 0.72),
            (0.55, 0.83),
            (0.66, 0.91),
            (0.84, 0.93),
            (1, 0.87),
        ],
        "crown",
    ),
    (
        "pine_b",
        [
            (0, 0.86),
            (0.22, 0.91),
            (0.40, 0.94),
            (0.48, 0.77),
            (0.56, 0.80),
            (0.64, 0.92),
            (0.81, 0.89),
            (1, 0.86),
        ],
        "crown",
    ),
    (
        "shrine",
        [
            (0, 0.40),
            (0.10, 0.47),
            (0.25, 0.417),
            (0.49, 0.57),
            (0.55, 0.575),
            (0.83, 0.456),
            (1, 0.347),
        ],
        "roof",
    ),
]:
    src = Image.open(base / "props" / (name + ".png")).convert("RGBA")
    w, h = src.size
    polygon = [(0, 0), (1, 0)] + list(reversed(edge))
    mask = Image.new("L", (w, h))
    ImageDraw.Draw(mask).polygon(
        [(round(x * w), round(y * h)) for x, y in polygon], fill=255
    )
    for label, stencil in [(high, mask), ("base", ImageChops.invert(mask))]:
        part = src.copy()
        part.putalpha(ImageChops.multiply(src.getchannel("A"), stencil))
        part.save(base / "props" / (name + "-" + label + ".png"), optimize=True)
