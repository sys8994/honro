"""Read-only exact-parent Git projection; emits only two Stage35 art owners and semantics."""
import hashlib
import json
import math
import os
from pathlib import Path
import subprocess
import sys

BASE = '71fb443675aed659a572b722a4337212e9d2f910'
TREE = 'c9f11d3a7458ecfcb390e460401f4b3298395858'
REF = 'refs/heads/qa/stage35-two-owner-71fb'
CARRIER = {'A\t.github/workflows/stage35-two-owner.yml', 'A\ttools/stage35-two-owner/extract.py'}
MANIFEST = 'web/manifest.json'
CAMPAIGN = 'web/data/campaign.fa9a5e8d3cb0a7e5.json'
MAP = 'web/data/chapter-35.95e0587691447674.json'
DESCRIPTOR = 'web/data/chapter-35-assets-parts.1e61927ac9e7ecf9.json'
PARTS = [
    {'path': 'web/data/chapter-35-assets-part-000.8baa2514a9adcafc.bin',
     'bytes': 4194304, 'sha256': '8baa2514a9adcafc0e22ea69b002251780129f55774907c716d11b432ece7be8'},
    {'path': 'web/data/chapter-35-assets-part-001.c9110d2e37b09922.bin',
     'bytes': 1785, 'sha256': 'c9110d2e37b09922d934f97da9624c91d52048b04beac33abbf3c42aadbc8fbe'},
]
AGG = {'bytes': 4196089, 'sha256': '470c7a97548805c2617a5722fe80d2f20892171ee30d6770f781b64b7e29aeb0'}
PINS = {
    MANIFEST: {'bytes': 6265038, 'sha256': 'c77a561f82a5f0748d1d4cfd4a675d5db9118ba2c53537c778fd9c77a12400c4'},
    CAMPAIGN: {'bytes': 54885, 'sha256': 'fa9a5e8d3cb0a7e54e7dd62130f61d93735f61fd4d56c9cb3b27874619ef4f3c'},
    MAP: {'bytes': 29954, 'sha256': '95e05876914476743dce0eaa28379ec15fec821f685cc74ae016fc73ad4e2c06'},
    DESCRIPTOR: {'bytes': 441, 'sha256': '1e61927ac9e7ecf976032ef1697147a18c5b4f90ca7348981ae879ab889f654a'},
    **{p['path']: {k: p[k] for k in ('bytes', 'sha256')} for p in PARTS},
}
OWNERS = {
    'approved35-near-geology': ('approved35:near-geology', [-700, 1450, 1, 0]),
    'approved35-forest-foundation': ('approved35:forest-foundation', [-6000, -5000, 1, 0]),
}
ROI = [2796, 3349, 3183, 3628]
SURVEY_TERRAINS = {'approved35-gully', 'approved35-gully-end-stair'}

def check(ok, reason):
    if not ok:
        raise ValueError(reason)

def git(*args):
    return subprocess.check_output(['git', *args])

def fact(data):
    return {'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()}

def checked(data, expected, label):
    check(fact(data) == expected, f'Git bytes mismatch: {label}')
    return data

def scope():
    head = os.environ['GITHUB_SHA']
    check(os.environ.get('GITHUB_EVENT_NAME') == 'push' and
          os.environ.get('GITHUB_REPOSITORY') == 'sys8994/honro' and
          os.environ.get('GITHUB_REF') == REF, 'wrong GitHub execution scope')
    check(git('rev-list', '--parents', '-n1', 'HEAD').decode().split() == [head, BASE],
          'wrong sole Git parent')
    check(git('rev-parse', BASE + '^{tree}').decode().strip() == TREE, 'wrong release tree')
    check(git('rev-parse', BASE + ':' + MANIFEST).decode().strip() ==
          '30671da683f66f4d959ed617d1cfd79a0a1e3dbe', 'wrong manifest Git blob')
    check(not git('status', '--porcelain=v1', '-z'), 'dirty QA checkout')
    check(set(git('diff', '--name-status', '--no-renames', BASE, head).decode().splitlines())
          == CARRIER, 'carrier not exact add-only')
    return head

def decode_pool(data, expected=7):
    p = json.loads(data)
    check(type(p) is dict and set(p) == {'version', 'nodes', 'root'}
          and type(p['version']) is int and p['version'] == 1 and type(p['nodes']) is list,
          'invalid pinned JSON pool header')
    table = []
    def ref(v):
        if v is None or type(v) is bool:
            return v
        if type(v) is list:
            check(len(v) == 1 and type(v[0]) in (int, float) and math.isfinite(v[0])
                  and (type(v[0]) is not int or abs(v[0]) <= 9007199254740991),
                  'invalid JSON pool numeric literal')
            return v[0]
        check(type(v) is int and 0 <= v < len(table), 'non-backward JSON pool reference')
        return table[v]
    for n in p['nodes']:
        if type(n) is str:
            table.append(n)
            continue
        check(type(n) is list and n and type(n[0]) is int, 'invalid JSON pool node')
        if n[0] == 0:
            table.append([ref(x) for x in n[1:]])
        else:
            check(n[0] == 1 and len(n) % 2 == 1, 'invalid JSON pool tag/arity')
            obj = {}
            for a, b in zip(n[1::2], n[2::2]):
                k = ref(a)
                check(type(k) is str and k not in obj, 'invalid JSON pool object key')
                obj[k] = ref(b)
            table.append(obj)
    assets = ref(p['root'])
    check(type(assets) is list and len(assets) == expected and
          all(type(a) is dict and type(a.get('id')) is str for a in assets) and
          len({a['id'] for a in assets}) == len(assets), 'invalid stage-local owner list')
    return {a['id']: a for a in assets}

def materialize(descriptor, read):
    check(descriptor == {'$honroJsonParts': 1, **AGG, 'parts': PARTS},
          'not exact ordered Stage35 split descriptor')
    return checked(b''.join(read(p['path']) for p in PARTS), AGG, 'ordered Stage35 aggregate')

def project(stage, assets):
    check(stage.get('id') == 'stage-35' and stage.get('metadata') ==
          {'stageId': 35, 'campaign': True, 'act4Stage': 35} and
          [stage['width'], stage['height']] == [4608, 3072], 'wrong Stage35 map')
    check(stage['playBounds'] == {'left': 0, 'top': 0, 'right': 4608, 'bottom': 3072}
          and stage['terrainBounds'] == {'left': -6000, 'top': -24000, 'right': 11800, 'bottom': 30900}
          and ROI[1] > stage['playBounds']['bottom'], 'visual survey intersects changed domains')
    chosen = {}
    for key, (aid, tr) in OWNERS.items():
        es = [e for e in stage['elements'] if e.get('id') == key or e.get('assetId') == aid]
        check(len(es) == 1 and es[0]['id'] == key and es[0]['assetId'] == aid, 'ambiguous exact owner')
        e = es[0]
        check([e[n] for n in ('x', 'y', 'scale', 'rotation')] == tr and
              [e.get(n) for n in ('layer', 'nativeArtLayer', 'depthLayer')] ==
              ['structural-back', 'structure', 'L1'], 'owner transform or role drift')
        a = assets[aid]
        v = a.get('vector')
        check(a.get('collision') == [] and not a.get('interactionType') and
              type(v) is dict and v.get('version') == 1 and type(v.get('root')) is dict,
              'target is not a paint-only vector asset')
        chosen[key] = {'placement': e, 'asset': a}
    nearby = [t for t in stage['terrains'] if t.get('id') in SURVEY_TERRAINS]
    check(len(nearby) == 2, 'expected upper gully controls')
    r = ROI
    crossing = [t['id'] for t in stage['terrains'] if
                max(p['x'] for p in t['points']) >= r[0] and min(p['x'] for p in t['points']) <= r[2]
                and max(p['y'] for p in t['points']) >= r[1] and min(p['y'] for p in t['points']) <= r[3]]
    check(not crossing, 'found authored terrain inside signed nonplay survey')
    d = stage['design']['nativeArt']
    check(d.get('far') == 'act4FarBambooHandoff' and
          d.get('authoredWalkRim') is True and d.get('preservePalette') is True, 'kind or far layer drift')
    return {'scope': 'source-only; no art intent inference, rendering, or production update',
            'stage': stage['metadata'], 'size': [stage['width'], stage['height']],
            'playBounds': stage['playBounds'], 'terrainBounds': stage['terrainBounds'],
            'surveyWorldRect': ROI, 'surveyPhysicalBoundsIntersections': crossing,
            'farKey': d['far'], 'nearbyGullyControlTerrains': nearby,
            'owners': chosen}

def main(out):
    head = scope()
    def read(path):
        return checked(git('show', BASE + ':' + path), PINS[path], path)
    manifest = json.loads(read(MANIFEST))
    active = {a['path']: {k: a[k] for k in ('bytes', 'sha256')} for a in manifest['files']}
    check(len(active) == len(manifest['files']) == 809, 'unexpected active manifest population')
    check(manifest['project'] == CAMPAIGN and all(active.get(k) == v for k, v in PINS.items()
                                                 if k != MANIFEST), 'not exact active leaves')
    c = json.loads(read(CAMPAIGN))
    check(c['stages'][34] == MAP and c['stageLibraries'][34] == DESCRIPTOR and
          c['assetEncodings']['stageLibraries'][34] == 'json-pool-v1' and
          c['catalog'][34]['metadata']['stageId'] == 35, 'campaign does not activate pinned Stage35 graph')
    aggregate = materialize(json.loads(read(DESCRIPTOR)), read)
    output = project(json.loads(read(MAP)), decode_pool(aggregate))
    output['source'] = {'release': BASE, 'releaseTree': TREE, 'carrier': head,
                        'paths': PINS, 'orderedAggregate': AGG}
    check(out.is_dir() and not any(out.iterdir()), 'artifact output not a fresh unique directory')
    data = json.dumps(output, ensure_ascii=False, allow_nan=False, separators=(',', ':')).encode() + b'\n'
    (out / 'stage35-two-native-owners.json').write_bytes(data)
    print('Verified: exactly two active paint-only source owners; source-only artifact', fact(data))

if __name__ == '__main__':
    main(Path(sys.argv[1]))
