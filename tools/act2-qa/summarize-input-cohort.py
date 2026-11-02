"""Read-only finite registered-cohort summary; unfinished cases remain denominators."""
from pathlib import Path
import json,hashlib,statistics,html,subprocess
from collections import Counter
ROOT=Path(__file__).resolve().parents[2]
b=ROOT/'_local/reports/act2-gameplay-20261103/input-cohort'
m=json.loads((ROOT/'tests/fixtures/act2-gameplay/input-cohort-registration.json').read_text())
c=json.loads((ROOT/'tests/fixtures/act2-gameplay/criteria-v3.json').read_text())
criteria={s['id']:s['design'] for s in c['stages']}
rows=[]; groups=[]
for s in m['stages']:
 for p in m['policies']:
  cases=[]
  for seed in m['inputSeeds']:
   d=b/f'{s}-{p}-{seed}'; f=d/'result.json'
   r=json.loads(f.read_text()) if f.exists() else None
   row={'stage':s,'policy':p,'inputSeed':seed,'status':'pending','evidence':str(f.relative_to(ROOT))}
   if not r and (d/'process.json').exists():row['status']='process-interrupted'
   if r:
    settled=r.get('appOutcome',{}).get('done') and r.get('phase') in ('won','lost')
    row.update(status=r['phase'] if settled else 'unfinished',round=r['round'],kills=r['kills'],fallen=r['fallen'],damageTaken=r.get('hpDamageTaken'),damageDealt=r.get('hpDamageDealt'),skills=r.get('skills'),goals=r.get('done'),engineRngAtEntry=r.get('engineRngAtEntry'),sourceCommit=r.get('checkoutCommit'),runnerSha256=r.get('runnerSha256'),resultSha256=hashlib.sha256(f.read_bytes()).hexdigest(),externalWrites=r.get('externalWrites'),engineRecoveries=r.get('engineRecoveries'),legacyItemApi=r.get('legacyItemApi'),stopReason=r.get('stopReason'))
    t=json.loads((d/'terminal.json').read_text()); initial=json.loads((d/'initial.json').read_text()); actions=t['actions']; units=initial['battle']['units']
    assert initial['battle']['honroStage']==t['b']['honroStage']==s
    for doc in [r,initial['provenance'],t['provenance']]:
     assert doc['policy']==p and doc['seed']==seed
     for key in ['runnerSha256','checkoutCommit','projectSha256','stageSha256','geometrySha256','entryProfileSha256','engineRngAtEntry']:
      assert doc[key]==r[key],(d,key)
    assert not any('item' in a.get('op','').lower() for a in actions)
    if row['status']=='won':assert t['profile']['cleared'][str(s)]==r['appOutcome']['cleared'] and r['appOutcome']['cleared']['rounds']==r['round']
    for path,expected in m['sourceTrees'].items():assert subprocess.check_output(['git','rev-parse',r['checkoutCommit']+':'+path],cwd=ROOT,text=True).strip()==expected
    row['sourceHashes']={k:r[k] for k in ['projectSha256','stageSha256','geometrySha256','entryProfileSha256']}
    enemies=[u for u in units if u.get('side')==1 and not u.get('honroObjectiveTarget')]
    rank=lambda u: 'majorBoss' if u.get('boss') or u.get('honroBoss') or u.get('honroFinalBoss') else ('miniboss' if u.get('honroMidboss') else ('ordinaryElite' if u.get('elite') or u.get('honroAct2Elite') else 'ordinary'))
    row['initialEncounter']={'hostilesExcludingObjectives':len(enemies),'engineFlagRanks':dict(Counter(rank(u) for u in enemies)),'classes':dict(Counter(u.get('cls','unknown') for u in enemies)),'caveat':'Flags/classes are not validated distinct patterns or simultaneous combat.'}
    row['routeObservations']={'rawInputOperations':dict(Counter(a['op'] for a in actions)),'matchedLandings':sum(a['op']=='land' and a.get('matched',False) for a in actions),'visitedSupportIds':sorted({a['support'] for a in actions if a.get('support')}),'interactions':[a for a in actions if a['op']=='E'],'caveat':'Raw inputs/supports do not establish meaningful tactical elevation or mandatory route minima.'}
    row['spawnEvents']=t['births'];row['terminalSha256']=hashlib.sha256((d/'terminal.json').read_bytes()).hexdigest()
    row['roundTargetPass']=row['status']=='won' and criteria[s]['rounds'][0]<=row['round']<=criteria[s]['rounds'][1]
    row['ceilingPass']=row['status']=='won' and row['round']<=20
   rows.append(row);cases.append(row)
  n=len(cases);pending=sum(x['status']=='pending' for x in cases);wins=sum(x['status']=='won' for x in cases);losses=sum(x['status']=='lost' for x in cases);rounds=[x['round'] for x in cases if x['status']=='won']
  rate=100*wins/n if not pending else None
  groups.append({'stage':s,'policy':p,'registeredN':n,'pending':pending,'wins':wins,'deathTerminals':losses,'unfinished':n-pending-wins-losses,'finiteClearPercent':rate,'clearRateRequired':criteria[s]['clearRate'],'clearRateGate':'FAIL_INSUFFICIENT_FINITE_RESOLUTION' if not any(criteria[s]['clearRate'][0]<=100*k/n<=criteria[s]['clearRate'][1] for k in range(n+1)) else ('FAIL_PENDING' if pending else ('PASS' if criteria[s]['clearRate'][0]<=rate<=criteria[s]['clearRate'][1] else 'FAIL_OUT_OF_RANGE')),'processInterrupted':sum(x['status']=='process-interrupted' for x in cases),'successfulRounds':rounds,'successfulRoundMean':statistics.mean(rounds) if rounds else None,'successfulRoundMedian':statistics.median(rounds) if rounds else None,'roundTarget':criteria[s]['rounds'],'roundTargetPassN':sum(x.get('roundTargetPass',False) for x in cases),'ceilingPassN':sum(x.get('ceilingPass',False) for x in cases),'successfulTimingGate':'FAIL_PENDING' if pending else ('FAIL_NO_SUCCESSFUL_OBSERVATIONS' if not rounds else ('PASS' if all(criteria[s]['rounds'][0]<=v<=criteria[s]['rounds'][1] for v in rounds) else 'FAIL_OUT_OF_RANGE')),'hard20Gate':'FAIL_OBSERVED_OVER_20' if any(x.get('round',0)>20 for x in cases) else ('FAIL_PENDING' if pending else 'OBSERVED_WITHIN_BOUND'),'eventualCompletionBounds':[wins/n,(n-losses)/n] if not pending else None})
report={'scope':'Preregistered finite-policy input robustness, canonical fixed engine RNG, two aim-jitter streams per policy. Synthetic declared entry budgets. Not human probability, not independent random-engine draws. Unfinished at bound is not death. Successful-round statistics are conditional on success. Original clearRate denotes finite registered policy trial ratio, not human population rate. Policies are reported separately; no iid pooling or inferential binomial CI. Eventual completion bounds retain unfinished uncertainty.','criteriaSource':c['source'],'criteriaSha256':c['rawSha256'],'releaseApproved':False,'pending':sum(x['status']=='pending' for x in rows),'groups':groups,'cases':rows,'unmeasuredRequiredGates':['required engagement attribution','effective enemy action classifier','distinct miniboss telegraph/counterplay','meaningful landings/routes','normal-growth entry reference applicability','final integrated art/source replay','normal-browser complete gameplay','effective enemy damage-rate and normal-kill actions','macro difficulty curve','exclusive required miniboss counts','all applicable stage-special metrics and original classification (not enumerated as satisfied)']}
for g in groups:
 assert g['wins']+g['deathTerminals']+g['unfinished']+g['pending']==g['registeredN']
 assert g['roundTargetPassN']<=g['wins'] and g['ceilingPassN']<=g['wins']
for row in rows:
 if row['status'] not in ('pending','process-interrupted'):
  assert row['runnerSha256']==m['files']['tests/act2-gameplay-cohort-20261103.mjs']
  assert not row['externalWrites'] and not row['engineRecoveries']
  assert row['engineRngAtEntry']['seed']==row['engineRngAtEntry']['canonicalSeed']
  assert row['legacyItemApi']=='disabled; no Engine.item calls'
out=ROOT/'game/docs/act2-gameplay-20261103/input-cohort';out.mkdir(exist_ok=True)
(out/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
lines=['# Registered Act2 input cohort — not release approval','',report['scope'],'',f"Pending cases: {report['pending']}/18.",'','| Stage | Policy | Win / death / unfinished / pending | Finite clear | Required | Successful rounds | Target / ≤20 passed |','|---|---|---|---|---|---|---|']
for g in groups:lines.append(f"| {g['stage']} | {g['policy']} | {g['wins']} / {g['deathTerminals']} / {g['unfinished']} / {g['pending']} | {g['finiteClearPercent']}% | {g['clearRateRequired']}% | {g['successfulRounds']} | {g['roundTargetPassN']}/{g['registeredN']} / {g['ceilingPassN']}/{g['registeredN']} |")
lines+=['','N=2 per policy has insufficient finite-rate resolution for the original 70–85%/75–90% ranges; no acceptance-grade clear-rate conclusion is possible. No retrospective pooling. Successful-round targets and hard20 for all observed runs are separate; death within20 is not a successful-round-target failure. Pending evidence remains fail-closed. A clear above 20 rounds is retained as a clear AND timing failure.','', 'Missing required gates: '+', '.join(report['unmeasuredRequiredGates'])+'.']
(out/'REPORT.md').write_text('\n'.join(lines)+'\n')
(out/'index.html').write_text('<!doctype html><meta charset="utf-8"><title>Registered Act2 cohort</title><style>body{max-width:1200px;margin:40px auto;background:#17212b;color:#eee;font:16px system-ui}pre{white-space:pre-wrap}a{color:#9cdbff}</style><h1>Act2 registered input cohort</h1><a href="report.json">Actual cases and immutable evidence hashes</a><pre>'+html.escape('\n'.join(lines))+'</pre>')
print(json.dumps({'pending':report['pending'],'groups':groups}))
