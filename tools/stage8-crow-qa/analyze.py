"""Report actual late-crow participation; a spawn count is not a quality pass."""
import json,pathlib
root=pathlib.Path('_local/reports/monster-natural/stage8');out=pathlib.Path('_local/reports/stage8-crow-qa')
r=json.loads((root/'natural-result.json').read_text());t=json.loads((root/'trace.json').read_text());source='stage8-settled-crows';crow=[u for u in r['final']['units'] if u.get('honroSpawnSource')==source];ids={u['id'] for u in crow}
births=[b for b in t['births'] if b.get('source')==source];actions=[a for a in t['enemyActions'] if a['id'] in ids];exchange=[d for d in t['damage'] if d.get('owner') in ids or d.get('target') in ids]
proof={'scope':'One fixed-policy natural Stage8 browser run from legal prior-clear entry fixture; intermediate6b, not final integrated acceptance','terminal':r['result'],'warningHistory':r.get('waves',[]),'births':births,'crowActions':actions,'damageExchange':exchange,'finalCrowBodies':crow,'qualityStatus':'REQUIRES terrain/route/counterchoice and pixel review; admission/actions alone are insufficient','limits':['Programmatic exposed App inputs and deterministic App clock, not manual pointer-only play.','Round/observer captures are canvas-only; entry/terminal captures include HUD.']}
(out/'natural-pressure.json').write_text(json.dumps(proof,ensure_ascii=False,indent=2));print(json.dumps({k:proof[k] for k in ['terminal','births','crowActions','damageExchange','qualityStatus']},ensure_ascii=False))
assert len(crow)==3 and len(births)==3,'Natural route did not admit the entire repaired three-crow wave'
assert r['result']['phase'] in ['won','lost'],'Natural route stopped before a terminal gameplay outcome'
