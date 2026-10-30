#!/usr/bin/env python3
"""Place an Act 4 roster on a built skeleton (stage.json + blueprint.json).

Placements are authored per stage as role clusters on real supports. Every
body is checked: on its support span, walkable slope, not inside another solid,
not overlapping a cover or another body. Writes <dir>/roster/stage.json.
"""
import json, math, sys
from pathlib import Path

KIND = {'guard': 'possessedGuard', 'bow': 'possessedArcher', 'bind': 'shade', 'arc': 'warden',
        'close': 'mourner', 'hound': 'hound', 'lantern': 'lantern', 'midboss': 'warden'}
MIDBOSS = {34: ('shelf', '턱포격체'), 39: ('net', '그물봉쇄체')}
NAMES = {33: '갯길 수위 사수', 35: '대군락 측격 지휘체', 37: '옹벽 관문 전위', 38: '해식굴 입구 견제체'}

def interp(top, x):
    for (x0, y0), (x1, y1) in zip(top, top[1:]):
        if x0 <= x <= x1:
            return y0 + (y1 - y0) * (x - x0) / ((x1 - x0) or 1)
    raise ValueError('off support x=%s' % x)

def inside(x, y, pts):
    hit = False
    for i in range(len(pts)):
        a, b = pts[i], pts[i - 1]
        if (a['y'] > y) != (b['y'] > y) and x < (b['x'] - a['x']) * (y - a['y']) / (b['y'] - a['y']) + a['x']:
            hit = not hit
    return hit

def place(n, skel, cells, active_limit=6, relocation=None):
    skel = Path(skel)
    stage = json.loads((skel / 'stage.json').read_text())
    bp = json.loads((skel / 'blueprint.json').read_text())
    sup = {s['id']: s for s in bp['surfaces']}
    units, enc, errors = [], [], []
    for ci, (cell, items) in enumerate(cells.items()):
        ids = []
        for i, (support, x, role, elite) in enumerate(items):
            uid = 'a4-%d-%s-%d' % (n, cell, i + 1)
            mid = role == 'midboss'
            r, h = (26, 106) if mid else (24, 104) if elite else (22, 96)
            top = sup[support]['top']
            try:
                y = interp(top, x)
                slope = abs(interp(top, x + r) - interp(top, x - r)) / (2 * r)
            except ValueError as e:
                errors.append('%s: %s' % (uid, e)); continue
            if x - r < top[0][0] or x + r > top[-1][0]:
                errors.append('%s: body off support span' % uid)
            if slope > 1.2:
                errors.append('%s: slope %.2f' % (uid, slope))
            for t in stage['terrains']:
                if t.get('oneWay') or t['id'] == 'pilot%d-%s' % (n, support):
                    continue
                if any(inside(x + dx, y + dy, t['points']) for dx in (-r + 3, 0, r - 3) for dy in (-h + 3, -h / 2, -4)):
                    errors.append('%s: body inside %s' % (uid, t['id']))
            for c in bp.get('covers', []):
                if x + r + 8 > c['x'] and x - r - 8 < c['x'] + c['w'] and y > c['y'] - c['h'] and y - h < c['y']:
                    errors.append('%s: overlaps cover %s' % (uid, c['id']))
            for u in units:
                if abs(u['x'] - x) < r + 40 and abs(u['y'] - y) < h:
                    errors.append('%s: too close to %s' % (uid, u['id']))
            so = {'elite': bool(elite), 'group': 100 + ci, 'awake': False, 'aggroUntil': 0, 'honroAct4WaterTrait': 'ground',
                  'honroEncounterSupport': 'pilot%d-%s' % (n, support), 'honroClaudeRole': role}
            rec = {'id': uid, 'kind': KIND[role], 'team': 'enemy', 'x': x, 'y': round(y, 2), 'facing': -1, 'encounterGroup': 'a4-%d-%s' % (n, cell), 'stageOverrides': so}
            if mid and n in MIDBOSS:
                key, name = MIDBOSS[n]
                rec['name'] = name
                rx, rs = relocation or (x, support)
                so.update({'name': name, 'honroPilotMidboss': key, 'honroMidboss': True, 'role': 'guard', 'boss': 0,
                           'honroPilotRelocation': {'x': rx, 'y': round(interp(sup[rs]['top'], rx), 2)}})
            elif mid:
                rec['name'] = NAMES.get(n, '정예 지휘체')
                so['name'] = rec['name']
                so.update({'honroMidboss': True, 'elite': True})
            units.append(rec)
            ids.append(uid)
        enc.append({'id': 'a4-%d-%s' % (n, cell), 'key': 'a4-%d-%s' % (n, cell), 'unitIds': ids, 'behavior': 'guard'})
    if errors:
        raise SystemExit('\n'.join(errors))
    stage['units'] = [u for u in stage['units'] if u['team'] != 'enemy'] + units
    stage['encounters'] = enc
    stage['initialState']['honroActiveLimit'] = active_limit
    out = skel / 'roster'
    out.mkdir(exist_ok=True)
    (out / 'stage.json').write_text(json.dumps(stage))
    (out / 'blueprint.json').write_text(json.dumps(bp))
    elites = sum(1 for u in units if u['stageOverrides']['elite'])
    mids = sum(1 for u in units if u['stageOverrides'].get('honroMidboss'))
    print(json.dumps({'stage': n, 'enemies': len(units), 'elites': elites, 'midbosses': mids, 'cells': {k: len(v) for k, v in cells.items()}}))
    return stage
