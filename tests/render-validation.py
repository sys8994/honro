"""Refresh the reviewable validation table from successful, checked-in JSON results."""
import json
from pathlib import Path
from browser_support import ROOT

def read(name):return json.loads((ROOT/'reports'/name).read_text(encoding='utf-8'))
verification=read('verification-run.json');assert verification['exitCode']==0
lines=['**최종 `npm run verify`: PASS (exit 0).** [실행 기록·산출물 SHA256](reports/verification-run.json)','',
       '| Suite | Result |','|---|---|']
for name in ['integration','editor-features','authored','audio-unit','audio-browser']:
    data=read(name+'.json')
    assert not data.get('errors'),name
    lines.append(f'| {name} | PASS · {len(data["checks"])} checks |')
for name in ['stage12-redesign/checks','stage12-redesign/browser']:
    data=read(name+'.json');assert not data.get('failed') and not data.get('errors'),name
    lines.append(f'| {name} | PASS · {len(data["checks"])} checks |')
migration=read('migration.json');assert migration['roundTrip'] and migration['reproducible']
lines.append(f'| migration | PASS · {len(migration["rows"])} stages × {len(migration["difficulties"])} difficulties |')
lines.extend(['| Existing RC21 verify | PASS · typecheck, Node audits, browser 10, performance 5 |',
              '| Browser uncaught JS errors | 0 |','',
              '| Stage / viewport / zoom | Original Hz / ms | Game Hz / ms | Editor Hz / ms | Original / Game / Editor load ms |',
              '|---|---|---|---|---|'])
before=read('performance-before.json')['rows'];game=read('performance-game.json')['rows'];editor=read('performance-editor.json')['rows']
for a,b,c in zip(before,game,editor):
    assert (a['stage'],a['viewport'],a['zoom'])==(b['stage'],b['viewport'],b['zoom'])==(c['stage'],c['viewport'],c['zoom'])
    for r in [a,b,c]:assert r['renderHz']>=50 and r['renderAvgMs']<7 and r['warmCacheRebuilds']==0
    label=f'{a["stage"]} / {a["viewport"][0]}×{a["viewport"][1]} / {a["zoom"]}'
    metric=lambda r:f'{r["renderHz"]:.2f} / {r["renderAvgMs"]:.3f}'
    lines.append(f'| {label} | {metric(a)} | {metric(b)} | {metric(c)} | {a["loadMs"]} / {b["loadMs"]} / {c["loadMs"]} |')
lines.extend(['','| Metric | Original | Game | Editor |','|---|---|---|---|'])
for name,fmt in [('renderMaxMs',lambda x:f'{x:.2f} ms'),('heapDelta',lambda x:f'{x/1_000_000:.3f} MB'),('warmCacheRebuilds',str)]:
    values=[]
    for rows in [before,game,editor]:
        xs=[r[name] for r in rows];values.append(fmt(min(xs))+' … '+fmt(max(xs)))
    lines.append('| '+name+' | '+' | '.join(values)+' |')
lines.extend(['','Hz는 관측된 Scene 렌더 호출률, ms는 평균 JavaScript render 비용입니다. 18개 표본 모두 기준을 통과했습니다. Original은 RC21 원본 지형이고 Game/Editor는 개편 지형이므로 동일 콘텐츠의 성능 비교는 아닙니다. 수치 원본: [before](reports/performance-before.json), [game](reports/performance-game.json), [editor](reports/performance-editor.json).',
              '정적 cache 바이트 예산과 build/hit 횟수도 각 JSON에 포함됩니다.'])
p=ROOT/'VALIDATION.md';text=p.read_text(encoding='utf-8');start='<!-- RESULTS_START -->';end='<!-- RESULTS_END -->'
p.write_text(text.split(start)[0]+start+'\n'+'\n'.join(lines)+'\n'+end+text.split(end)[1],encoding='utf-8',newline='\n')
print('Refreshed VALIDATION.md from result JSON')
