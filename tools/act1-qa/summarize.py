"""Fail-closed partial evidence index. Never treats raw totals as fun approval."""
import json,glob,statistics,math,hashlib,html
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'_local/reports/act1-gameplay-20261103';PLAN=json.loads((ROOT/'tools/act1-qa/plan.json').read_text());rows=[]
def digest(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def normalize(stage,label,initial,final,damage,actions,path,cohort=False,seed=None,scope=None):
 if not final:return
 us={u['id']:u for u in initial.get('units',[])};allus={u['id']:u for u in final.get('units',[])};foes=[u for u in initial.get('units',[])if u.get('side')==1 and not u.get('honroObjectiveTarget')];hero=[u for u in initial.get('units',[])if u.get('side')==0 and not u.get('summoned')]
 taken=dealt=protected=0;engaged=set();normalpct=[]
 for d in damage:
  t=allus.get(d.get('target'),us.get(d.get('target'),{}));owner=allus.get(d.get('owner'),us.get(d.get('owner'),{}));v=d.get('loss',d.get('amount',d.get('hpLoss',0)))
  if t.get('side')==0:taken+=v
  if t.get('side')==2:protected+=v
  if t.get('side')==1 and owner.get('side')==0:dealt+=v;engaged.add(t.get('id'))
  if owner.get('side')==1 and t.get('side') in [0,2]:engaged.add(owner.get('id'))
  # Per-hit only: multi-hit action aggregation is not yet complete, cannot gate.
  if owner.get('side')==1 and t.get('side')==0 and not owner.get('elite') and owner.get('id')!='boss' and t.get('maxHp'):normalpct.append(v/t['maxHp']*100)
 kinds={}
 for u in foes:
  k=u.get('honroVariant',u.get('honroType',u.get('cls','unknown')));kinds[k]=kinds.get(k,0)+1
 playerfires=[a for a in actions if a.get('op',a.get('kind')) in ['fire','shot','fire-seal','fire-binding','fire-input'] and (not a.get('before') or str(a['before'].get('id','')).startswith('p-'))]
 round_=final.get('round');target=PLAN['stages'][stage-1]['design']['rounds']
 row={'stage':stage,'policy':label,'cohort':cohort,'inputErrorSeed':seed,'engineSeed':initial.get('seed'),'scope':scope,'evidence':str(path.relative_to(ROOT)),'sha256':digest(path),'phase':final.get('phase'),'round':round_,'roundTarget':target,'trialRoundInTarget':target[0]<=round_<=target[1] if round_ else None,'hard20Exceeded':round_>20 if round_ else None,'winnerReason':final.get('winnerReason'),'entry':{'difficulty':initial.get('difficulty'),'heroes':[{'cls':u['cls'],'level':u.get('level'),'hp':u.get('maxHp'),'loadout':u.get('loadout'),'ranks':u.get('ranks')}for u in hero]},'composition':{'initialEnemiesExcludingObjectiveTargets':len(foes),'initialElites':sum(bool(u.get('elite'))for u in foes),'archetypes':kinds,'initialObjectiveTargets':sum(bool(u.get('honroObjectiveTarget'))for u in initial.get('units',[]))},'observed':{'kills':sum(u.get('side')==1 and not u.get('honroObjectiveTarget') and (u.get('dead') or u.get('hp',1)<=0)for u in allus.values()),'survivingHeroes':sum(u.get('side')==0 and not u.get('summoned') and not u.get('dead') and u.get('hp',0)>0 for u in allus.values()),'playerFireCommands':len(playerfires),'partyHpDamage':taken,'protectedNpcHpDamage':protected,'damageToHostileSideIncludingTargets':dealt,'damageBackedEngagementLowerBound':len(engaged),'damageBackedEngagedIds':sorted(engaged),'normalEnemyHitPctHpDiagnostic':{'n':len(normalpct),'mean':statistics.mean(normalpct)if normalpct else None,'range':[min(normalpct),max(normalpct)]if normalpct else None}},'missingEssential':['validated enemy effective-action denominator incl zero phases','normal enemy damage per-action aggregation','accepted full required support graph and elevation ratio','valid jump/drop/landing attribution','stage-specific special metric comparison','readability and native UI scene review','human-independent tactics assessment'], 'acceptance':'FAIL_UNMEASURED'}
 rows.append(row)
for path in OUT.glob('stage*/trace.json'):
 p=json.loads(path.read_text());stage=p.get('stage');initial=p.get('initial');final=p.get('final')
 if stage and initial and final:normalize(stage,p.get('policy','legacy'),initial,final,p.get('damage',[]),p.get('inputs',[]),path,'cohort' in p.get('policy',''),p.get('inputErrorSeed',p.get('seed')),p.get('scope'))
for path in OUT.glob('stage*/combat.json'):
 p=json.loads(path.read_text());stage=int(path.parent.name.split('-')[0][5:]);normalize(stage,path.parent.name,p['initial'],p['battleEnd'],p.get('damage',[]),p.get('actions',[]),path,scope='Historical declared prior-victory profile, current Engine/App controller calibration; not campaign-continuous or real UI')
p=ROOT/'_local/reports/stage5-foundation-20261026/final-normal/trace.json'
if p.exists():
 d=json.loads(p.read_text());normalize(5,'observed-route-command-replay',d['initial'],d['final'],d['hits'],d['actions'],p,scope=d['scope'])
for folder in OUT.glob('stage8-*'):
 p=folder/'result.json';initial=folder/'initial.json';final=folder/'final-battle.json';trace=folder/'trace.json'
 if p.exists()and initial.exists()and final.exists():
  d=json.loads(trace.read_text());normalize(8,folder.name,json.loads(initial.read_text())['initial']['battle'],json.loads(final.read_text()),d['damage'],d['actions'],trace,scope='Current reward/recruit fixture, native input calibration')
def wilson(k,n):
 z=1.96;a=(k/n+z*z/(2*n))/(1+z*z/n);b=z*math.sqrt((k/n)*(1-k/n)/n+z*z/(4*n*n))/(1+z*z/n);return [100*(a-b),100*(a+b)]
groups=[]
for policy in sorted({r['policy']for r in rows if r['cohort']}):
 rs=[r for r in rows if r['policy']==policy and r['cohort']];wins=[r for r in rs if r['phase']=='won'];rounds=[r['round']for r in wins];n=len(rs);groups.append({'policy':policy,'n':n,'clears':len(wins),'clearRatePct':len(wins)/n*100,'humanClearRate':None,'uncertainty':'Fixed engine RNG, tool policy and tiny input errors do not establish a human-population confidence interval.','meanClearRounds':statistics.mean(rounds)if rounds else None,'medianClearRounds':statistics.median(rounds)if rounds else None,'clearRoundRange':[min(rounds),max(rounds)]if rounds else None,'hard20Exceedances':sum(r['hard20Exceeded']for r in rs),'engineSeedCount':len({r['engineSeed']for r in rs}),'seedScope':'input error seeds, canonical fixed game RNG','stageAcceptance':'FAIL_UNMEASURED'})
report={'schema':'honro-act1-gameplay-measurements/v1','candidateGameplay':'292c1122fcd75256c366ec15e815fb4adcfbd7b2','originalCriteria':PLAN['source'],'overall':'FAIL_INCOMPLETE','statement':'Native inputs and declared fixtures only unless separately linked to verified UI run. Clear is not fun approval. Failed controller calibration excluded from general-policy rate.','stages':[{'stage':i,'runs':sum(r['stage']==i for r in rows),'acceptance':'FAIL_UNMEASURED','requiredRounds':PLAN['stages'][i-1]['design']['rounds'],'requiredEngagements':PLAN['stages'][i-1]['design']['requiredEngagements']}for i in range(1,11)],'cohorts':groups,'runs':sorted(rows,key=lambda r:(r['stage'],r['policy'],r.get('inputErrorSeed')or 0))}
(OUT/'measurements.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
md=['# Act1 gameplay QA — incomplete / fail closed','',report['statement'],'','## Preregistered Stage1 cohort','', '| Policy | n | Clear | Mean / median / range R | Uncertainty |','|---|---:|---:|---|---|']
for g in groups:md.append(f"| {g['policy']} | {g['n']} | {g['clears']}/{g['n']} | {g['meanClearRounds']} / {g['medianClearRounds']} / {g['clearRoundRange']} | conditional input robustness only; no human CI |")
md+=['','## All diagnostic results (not pooled success rates)','', '| Stage | Policy | Outcome / R | Kills | Damage-backed engaged lower bound | Party / protected NPC HP loss |','|---|---|---|---:|---:|---|']
for r in report['runs']:
 if r['cohort']:continue
 o=r['observed'];md.append(f"| {r['stage']} | {r['policy']} | {r['phase']} / {r['round']} | {o['kills']} | {o['damageBackedEngagementLowerBound']} | {o['partyHpDamage']} / {o['protectedNpcHpDamage']} |")
md+=['','## Required limitations','- Original required/reference classification is in plan.json; total enemy counts and platform quotas are not automatic requirements.','- Trial outside target is not a multi-policy aggregate verdict. Any observed >20R is retained separately; no forced game-over or truncation into success.','- Stage9 objective fast path: fresh two receivers in R2, zero kills, queued waves preempted. This is a design-pressure gap against7–9R/10–16engagement targets, not a mandate to add kill-all or idle hold.','- Native stage1–7 inherited controller captions may say browser historically; this adapter supplied DOM/canvas doubles and no browser screenshots.','- Missing required measurements above keep every stage acceptance unmeasured/failed; no subjective fun score is asserted.']
(OUT/'REPORT.md').write_text('\n'.join(md)+'\n')
body='<h1>Act1 gameplay QA — incomplete</h1><p>Native actual inputs; not human fun or whole acceptance.</p><h2>Stage1 registered policy clear rounds</h2>'
for g in groups:body+=f'<p>{html.escape(g["policy"])} (n={g["n"]}) <span style="display:inline-block;background:#4c8c86;height:16px;width:{(g["meanClearRounds"]or 0)*24}px"></span> {g["meanClearRounds"]}R</p>'
body+='<pre>'+html.escape('\n'.join(md))+'</pre>'
(OUT/'REPORT.html').write_text('<!doctype html><meta charset="utf-8"><title>Act1 gameplay QA</title><style>body{font:15px system-ui;max-width:1300px;margin:40px auto;padding:20px;color:#243334;background:#f5f4ef}pre{white-space:pre-wrap;font:14px monospace;line-height:1.5}</style>'+body)
print('Measured runs',len(rows),'cohorts',len(groups),'overall FAIL_INCOMPLETE')
