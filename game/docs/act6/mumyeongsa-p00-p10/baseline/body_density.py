"""Compare the clipped BODY bulk with the frozen Act 1 references."""
import argparse
import base64
from collections import Counter
import hashlib
import io
import json
from pathlib import Path
import subprocess

import numpy as np
from PIL import Image
from playwright.sync_api import sync_playwright
from scipy import ndimage

import browser as base
from cold_resume import storage_hash
from legacy54_live import resume
from native_b import finish_wall
from visual_edges import scene_context

SCRIPT = Path(__file__).with_suffix('.js').read_text()
REFERENCE = '9acde7427f3ebfce00f9ad3a9b943d030e2c352d'
REFERENCES = [
    ('01', '088719e10e63d482', '9868e01095bebbab67f6d4eea7dea14b1b9f64dc', 5400, 2200),
    ('02', 'ddddf53df4d749c6', '94bc93576e97e4154645361f8356b82be87c00ec', 4300, 3300),
]


def reference(number, tag, blob, width, height):
    path = f'web/data/chapter-{number}-assets.{tag}.json'
    obj = f'{REFERENCE}:{path}'
    assert subprocess.check_output(['git', 'rev-parse', obj], cwd=base.ROOT, text=True).strip() == blob
    wire = subprocess.check_output(['git', 'show', obj], cwd=base.ROOT)
    decode = """import {readFileSync} from 'node:fs';
import {unpackJson} from './shared/json-pool.mjs';
const p=JSON.parse(readFileSync(0,'utf8'));console.log(JSON.stringify(Array.isArray(p)?p:unpackJson(p)));
"""
    assets = json.loads(subprocess.check_output(['node', '--input-type=module', '-e', decode],
                                               input=wire, cwd=base.ROOT))
    body = next(a for a in assets if a['id'] == f'act1-traced:stage{number}-body-v2')
    return {'asset': body, 'play': dict(left=0, top=0, right=width, bottom=height), 'blob': blob}


def components(mask, points, outer, scale):
    labels, count = ndimage.label(mask >= 128)
    backdrop, total = ndimage.label(mask < 128, structure=np.ones((3, 3)))
    border = set(np.concatenate((backdrop[0], backdrop[-1], backdrop[:, 0], backdrop[:, -1])))
    holes = total - len(border - {0})
    areas = np.bincount(labels.ravel(), weights=mask.ravel() / (255 * scale**2))
    assigned = Counter()
    for x, y in points:
        i, j = int((x - outer['left']) * scale), int((y - outer['top']) * scale)
        assigned[int(labels[j, i]) if 0 <= j < labels.shape[0] and 0 <= i < labels.shape[1] else 0] += 1
    return {'components': count, 'holes': holes, 'outsideComponent': assigned[0],
            'largestComponents': [{'worldAreaAtAlpha128': round(areas[i], 2), 'endpoints': assigned[i]}
                                  for i in sorted(range(1, count + 1), key=lambda j: -areas[j])[:12]]}


def measure(page, path, name, source=None):
    result = []
    for index, scale in enumerate((1440 / 6800, 2880 / 6800), 1):
        sample = page.evaluate(SCRIPT, {'reference': source, 'scale': scale})
        raw = base64.b64decode(sample.pop('paint').split(',', 1)[1])
        alpha = Image.open(io.BytesIO(raw)).getchannel('A')
        destination = path / f'{name}-{index}x.png'
        alpha.save(destination)
        sample['mask'] = destination.name
        sample['maskSHA256'] = hashlib.sha256(destination.read_bytes()).hexdigest()
        if source:
            sample['frozenSourceBlob'] = source['blob']
        play, outer = sample['play'], sample['outer']
        x0, y0, x1, y1 = [round((play[k] - outer['left' if k in ('left', 'right') else 'top']) * scale)
                          for k in ('left', 'top', 'right', 'bottom')]
        original = np.asarray(alpha)
        for kind in ('play', 'outer'):
            points = [p for a in sample['rows'] for p in a[kind + 'Points']]
            mask = np.zeros_like(original) if kind == 'play' else original.copy()
            mask[y0:y1, x0:x1] = original[y0:y1, x0:x1] if kind == 'play' else 0
            area = mask.sum() / (255 * scale**2)
            sample[kind + 'Bulk'] = {'worldArea': round(area, 2), 'endpoints': len(points),
                'endpointsPerMillion': round(len(points) / area * 1_000_000, 2) if area else None,
                **components(mask, points, outer, scale)}
        for row in sample['rows']:
            for kind in ('play', 'outer'):
                row[kind + 'Endpoints'] = len(row.pop(kind + 'Points'))
        result.append(sample)
    return result


def run(browser, args):
    results = {}
    for stage, name, saved in [(53, '53', None), (54, '54-N', (args.b_proof, 'checkpoint54')),
                               (58, '58', (args.d_proof, 'checkpoint58'))]:
        with scene_context(browser, stage, saved) as context:
            page = context.new_page()
            resume(page, stage, True)
            before = storage_hash(base.saved_bytes(page))
            if stage == 54:
                finish_wall(page, {})
            results[name] = measure(page, args.out, name)
            assert before == storage_hash(base.saved_bytes(page))
            if stage == 53:
                for ref in REFERENCES:
                    number = ref[0]
                    results[f'act1-{number}'] = measure(page, args.out, f'act1-{number}', reference(*ref))
            (args.out / 'density-progress.json').write_text(json.dumps(results, ensure_ascii=False, indent=2) + '\n')
            print(name, 'BODY measured', results[name][0]['playBulk'], flush=True)
    return results


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--build', type=Path, required=True)
    parser.add_argument('--out', type=Path, required=True)
    parser.add_argument('--b-proof', type=Path, required=True)
    parser.add_argument('--d-proof', type=Path, required=True)
    args = parser.parse_args()
    base.ROOT = args.build.resolve()
    args.out.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as playwright:
        with playwright.chromium.launch(executable_path='/usr/bin/chromium',
                                        args=['--no-sandbox', '--disable-dev-shm-usage']) as browser:
            report = run(browser, args)
    data = {'reference': REFERENCE, 'alphaThreshold': 128, 'foregroundNeighbours': 4, 'backgroundNeighbours': 8,
            'rows': report}
    (args.out / 'density.json').write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
