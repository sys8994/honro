#!/usr/bin/env python3
"""Plan gate for a redesigned Act4 stage (fails the build on any miss).
usage: gate.py N  -> checks layout vs design card + engine probe + trap sweep."""
import json, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
n = sys.argv[1]
card = json.load(open(ROOT / 'tools/act4-claude/cards.json'))[n]
L = json.load(open(ROOT / f'tools/act4-pilot/layouts/stage{n}-claude.json'))
D = ROOT / f'_local/reports/act4-pilot/stage{n}/claude'
S = {s['id']: s for s in L['surfaces']}
rows = []
def check(name, ok, got, want):
    rows.append((name, ok, got, want))
W, H = L['width'], L['height']
check('width', card['Wr'][0] <= W <= card['Wr'][1], W, card['Wr'])
check('height', card['Hr'][0] <= H <= card['Hr'][1], H, card['Hr'])
check('aspect W/H', card['aspect'][0] <= W / H <= card['aspect'][1], round(W / H, 3), card['aspect'])
walk = [s for s in L['surfaces'] if s['id'] != 'shore' or len(L['surfaces']) < 3]
# Boundary cliff walls (role contains 'cliff edge') are map edges, not platforms.
plat = [s for s in L['surfaces'] if 'cliff edge' not in s.get('role', '')]
check('supports (platforms)', card['supports'][0] <= len(plat) <= card['supports'][1], len(plat), card['supports'])
levels = sorted({int(sum(p[1] for p in s['top']) / len(s['top']) // 300) for s in L['surfaces']})
check('height bands', len(levels) >= card['bands'][0], len(levels), card['bands'])
main = L['routes'][0]['supports']
ys = [p[1] for sid in main for p in S[sid]['top']]
span = max(ys) - min(ys)
check('route altitude span', card['span'][0] <= span <= card['span'][1] + 400, round(span), card['span'])
check('routes', len(L['routes']) >= card['routes'], len(L['routes']), card['routes'])
for f, ids in card['features'].items():
    miss = [i for i in ids if i not in S and i not in [c['id'] for c in L.get('covers', [])] and i not in L.get('artFeatures', [])]
    check('feature: ' + f, not miss, 'missing ' + ','.join(miss) if miss else 'ok', 'present')
try:
    v = json.load(open(D / 'verification-summary.json'))
    e, b = v['edgeBodyChecks'], v['continuousBodyChecks']
    check('engine edges', e['passed'] == e['total'] > 0, f"{e['passed']}/{e['total']}", 'all')
    check('engine bodies', b['passed'] == b['total'] > 0, f"{b['passed']}/{b['total']}", 'all')
    check('routes completed', bool(v['routes']) and all(r['passed'] for r in v['routes']), sum(bool(r['passed']) for r in v['routes']), len(v['routes']))
    check('hp loss on route', bool(v['routes']) and all(r['hpLoss'] == 0 for r in v['routes']), max((r['hpLoss'] for r in v['routes']), default=None), 0)
except FileNotFoundError:
    check('engine probe', False, 'not run', 'run')
try:
    t = json.load(open(D / 'trap-sweep.json'))
    check('trap sweep', t['tested'] > 0 and not t['traps'], f"{t['tested']} tested; {len(t['traps'])} traps", 'tested > 0; 0 traps')
except FileNotFoundError:
    check('trap sweep', False, 'not run', 'run')
bad = [r for r in rows if not r[1]]
for name, ok, got, want in rows:
    print(('PASS ' if ok else 'FAIL ') + name.ljust(42), got, '| want', want)
(D / 'gate.json').write_text(json.dumps({'stage': n, 'pass': not bad, 'rows': rows}, ensure_ascii=False, indent=1))
sys.exit(1 if bad else 0)
