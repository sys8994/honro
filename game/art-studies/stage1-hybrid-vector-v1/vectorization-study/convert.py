#!/usr/bin/env python3
"""Exactly two controlled offline traces of the approved balanced PNG.

Build-only: python -m pip install --target /tmp/honro-vectorization-tools vtracer==0.6.15
PYTHONPATH=/tmp/honro-vectorization-tools python path/to/convert.py
Pillow and numpy are authoring tools, never game/runtime dependencies.
No current CLI-only --simplify or --max-colors arguments are passed to the older Python API.
"""
from pathlib import Path
from tempfile import TemporaryDirectory
from importlib.metadata import version
import gzip
import hashlib
import inspect
import json
import re
import xml.etree.ElementTree as ET

import numpy as np
from PIL import Image
import vtracer

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[3]
SOURCE = REPO / 'game/docs/art-references/stage1-balanced-20261019/balanced.png'
PALETTE_SIZES = (24, 48)
# v0.6.15 filter_speckle is a side length: 14 * 14 = 196 source pixels.
# Spline segment subdivision threshold 10 px favors intermediate shapes over grain.
# This is the supported legacy fitting control, not v1.0's post-fit --simplify.
PARAMS = dict(
    colormode='color', hierarchical='stacked', mode='spline',
    filter_speckle=14, color_precision=8, layer_difference=1,
    corner_threshold=75, length_threshold=10.0, max_iterations=10,
    splice_threshold=60, path_precision=1,
)
NAMESPACE = 'http://www.w3.org/2000/svg'


def main():
    installed = version('vtracer')
    if installed != '0.6.15':
        raise RuntimeError(f'Expected inspected vtracer 0.6.15 API; got {installed}.')
    signature = inspect.signature(vtracer.convert_image_to_svg_py)
    if any(key not in signature.parameters for key in PARAMS):
        raise RuntimeError('Installed conversion API does not match the recorded parameters.')
    image = Image.open(SOURCE).convert('RGBA')
    rgba = np.asarray(image)
    # Palette training excludes all transparent pixels, so empty black RGB does not
    # consume a color or bias the palette. No blur, upscaling, dithering or new imagery.
    visible = rgba[:, :, 3] >= 128
    training = Image.fromarray(np.ascontiguousarray(rgba[:, :, :3][visible][None, :, :]))
    rgb_image = image.convert('RGB')
    rows = []
    with TemporaryDirectory(prefix='honro-vtracer-') as scratch:
        for count in PALETTE_SIZES:
            palette_image = training.quantize(
                colors=count, method=Image.Quantize.MEDIANCUT,
                dither=Image.Dither.NONE,
            )
            colors = np.array(palette_image.getpalette()[:count * 3], dtype=np.int32).reshape((-1, 3))
            quantized = rgb_image.quantize(palette=palette_image, dither=Image.Dither.NONE).convert('RGBA')
            quantized.putalpha(image.getchannel('A'))
            # Preserve source alpha in the tracing input. v0.6.15 emits transparent
            # vector exterior boundaries; antialiased PNG edge alpha is not retained
            # as per-pixel opacity in the final paths.
            trace_input = Path(scratch) / f'palette-{count}.png'
            quantized.save(trace_input)
            destination = HERE / f'balanced-{count}.svg'
            vtracer.convert_image_to_svg_py(str(trace_input), str(destination), **PARAMS)
            tree = ET.parse(destination)
            root = tree.getroot()
            root.set('viewBox', f'0 0 {image.width} {image.height}')
            root.set('role', 'img')
            root.set('aria-label', f'승인 숲길 원화 {count}색 벡터 표본')
            # Region merging can produce averaged colors. Snap fills back to the
            # same fixed input palette to keep the named 24/48 color constraint exact.
            for node in root.iter():
                fill = node.get('fill', '')
                if re.fullmatch(r'#[0-9a-fA-F]{6}', fill):
                    value = np.array([int(fill[k:k + 2], 16) for k in (1, 3, 5)], dtype=np.int32)
                    nearest = colors[np.argmin(np.sum((colors - value) ** 2, axis=1))]
                    node.set('fill', '#' + ''.join(f'{int(v):02x}' for v in nearest))
            ET.register_namespace('', NAMESPACE)
            svg = ET.tostring(root, encoding='unicode') + '\n'
            destination.write_text(svg)
            data = destination.read_bytes()
            paths = root.findall(f'.//{{{NAMESPACE}}}path')
            raster_references = [n for n in root.iter() if n.tag.rsplit('}', 1)[-1] == 'image']
            embedded_data = bool(re.search(r'(?:data:image|base64,)', svg, re.I))
            used_colors = sorted({node.get('fill') for node in root.iter() if node.get('fill', '').startswith('#')})
            # Cubic/node counts are informational, not art acceptance criteria.
            commands = {command: sum(len(re.findall(command, path.get('d', ''))) for path in paths)
                        for command in ('M', 'L', 'C', 'Q', 'Z')}
            row = dict(
                file=destination.name, palette_limit=count, actual_colors=len(used_colors),
                raw_bytes=len(data), gzip9_bytes=len(gzip.compress(data, compresslevel=9, mtime=0)),
                path_count=len(paths), commands=commands,
                raster_reference_count=len(raster_references), embedded_raster_data=embedded_data,
                palette=used_colors,
                size_assessment=('unsuitable: excessive complexity; no further combinations attempted'
                                 if len(paths) >= 10000 or len(data) >= 2000000 else
                                 'review intermediate forms and noise in comparison.png; counts alone are not art approval'),
            )
            rows.append(row)
            print(json.dumps(row, ensure_ascii=False), flush=True)
    report = dict(
        scope='Two fixed-palette offline asset samples only. No map/UI/runtime integration.',
        source=str(SOURCE.relative_to(REPO)), source_sha256=hashlib.sha256(SOURCE.read_bytes()).hexdigest(),
        source_size=list(image.size), vtracer_version=installed, pillow_version=Image.__version__,
        numpy_version=np.__version__, api_signature=str(signature), parameters=PARAMS,
        quantization='Visible-pixel MEDIANCUT training; fixed 24/48 RGB palettes; no dithering; input source alpha retained; final fills snapped to the same palette.',
        simplification='Supported v0.6.15 spline fitting and 10px subdivision threshold, 1 decimal path precision. No v1.0 CLI-only simplify parameter or post-fit simplifier claimed.',
        transparency='No opaque background or embedded image. Trace has transparent exterior; PNG antialiased edge alpha is represented by vector coverage, not a per-pixel alpha map.',
        candidates=rows,
    )
    (HERE / 'results.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')


if __name__ == '__main__':
    main()
