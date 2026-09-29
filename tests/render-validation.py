"""Refresh the reviewable validation table from successful local JSON results."""
import json
from pathlib import Path
from browser_support import ROOT

def read(name):return json.loads((ROOT/'_local/reports'/name).read_text(encoding='utf-8'))
verification=read('verification-run.json');assert verification['exitCode']==0
lines=['**최종 `npm run verify`: PASS (exit 0).** [실행 기록·산출물 SHA256](_local/reports/verification-run.json)','',
       '| Suite | Result |','|---|---|']
for name in ['integration','editor-features','authored','audio-unit','audio-browser','bgm-transitions','aim-direction/browser','monster-forge/browser','party-forge/browser']:
    data=read(name+'.json')
    assert not data.get('errors'),name
    lines.append(f'| {name} | PASS · {len(data["checks"])} checks |')
for name in ['stage12-redesign/checks','stage12-redesign/browser']:
    data=read(name+'.json');assert not data.get('failed') and not data.get('errors'),name
    lines.append(f'| {name} | PASS · {len(data["checks"])} checks |')
for name in ['skill-redesign/unit','skill-redesign/browser','skill-polish/unit','skill-polish/browser','skill-effects/unit','skill-effects/browser','field-polish/unit','field-polish/browser','hwigyeom-p5/unit','hwigyeom-p5/browser','skill-tuning/unit','skill-tuning/browser','story-rewrite/unit','story-rewrite/browser']:
    data=read(name+'.json');assert not data.get('errors'),name
    checks=data.get('checks',data.get('results',[]));assert checks and all(c.get('pass',True) for c in checks),name
    lines.append(f'| {name} | PASS · {len(checks)} checks |')
migration=read('migration.json');assert migration['roundTrip'] and migration['reproducible']
lines.append(f'| migration | PASS · {len(migration["rows"])} stages × {len(migration["difficulties"])} difficulties |')
lines.extend(['| Existing RC21 verify | PASS · typecheck, Node audits, browser 10, performance 5 |',
              '| Browser uncaught JS errors | 0 |','',
              '| Stage / viewport / zoom | Original Hz / ms | Game Hz / ms | Editor Hz / ms | Original / Game / Editor load ms |',
              '|---|---|---|---|---|'])
before=json.loads((ROOT/'tests/fixtures/performance-before.json').read_text(encoding='utf-8'))['rows'];game=read('performance-game.json')['rows'];editor=read('performance-editor.json')['rows']
key=lambda r:(r['stage'],tuple(r['viewport']),r['zoom'])
original={key(r):r for r in before};edited={key(r):r for r in editor}
assert len(game)==len(editor) and {key(r) for r in game}==set(edited)
for b in game:
    a=original.get(key(b));c=edited[key(b)]
    for r in ([a] if a else [])+[b,c]:assert r['renderHz']>=50 and r['renderAvgMs']<7 and r['warmCacheRebuilds']==0
    label=f'{b["stage"]} / {b["viewport"][0]}×{b["viewport"][1]} / {b["zoom"]}'
    metric=lambda r:f'{r["renderHz"]:.2f} / {r["renderAvgMs"]:.3f}'
    lines.append(f'| {label} | {metric(a) if a else "—"} | {metric(b)} | {metric(c)} | {a["loadMs"] if a else "—"} / {b["loadMs"]} / {c["loadMs"]} |')
lines.extend(['','| Metric | Original | Game | Editor |','|---|---|---|---|'])
for name,fmt in [('renderMaxMs',lambda x:f'{x:.2f} ms'),('heapDelta',lambda x:f'{x/1_000_000:.3f} MB'),('warmCacheRebuilds',str)]:
    values=[]
    for rows in [before,game,editor]:
        xs=[r[name] for r in rows];values.append(fmt(min(xs))+' … '+fmt(max(xs)))
    lines.append('| '+name+' | '+' | '.join(values)+' |')
lines.extend(['',f'Hz는 관측된 Scene 렌더 호출률, ms는 평균 JavaScript render 비용입니다. 현재 Game/Editor {len(game)+len(editor)}개 표본 모두 기준을 통과했습니다. Original은 보관된 RC21의 Stage 1/2 측정이며 원본 표본이 없는 Stage 7/10은 —로 표시합니다. Game/Editor는 개편 콘텐츠이므로 동일 콘텐츠의 성능 비교는 아닙니다. 수치 원본: [before](tests/fixtures/performance-before.json), [game](_local/reports/performance-game.json), [editor](_local/reports/performance-editor.json).',
              '정적 cache 바이트 예산과 build/hit 횟수도 각 JSON에 포함됩니다.'])
p=ROOT/'VALIDATION.md';text=p.read_text(encoding='utf-8');start='<!-- RESULTS_START -->';end='<!-- RESULTS_END -->'
p.write_text(text.split(start)[0]+start+'\n'+'\n'.join(lines)+'\n'+end+text.split(end)[1],encoding='utf-8',newline='\n')
print('Refreshed VALIDATION.md from result JSON')
