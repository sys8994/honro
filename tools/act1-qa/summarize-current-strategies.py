"""Finite preregistered App-strategy comparison; never an all-criteria pass."""
import hashlib,json,statistics
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'_local/reports/act1-gameplay-20261103'
plan=json.loads((ROOT/'tools/act1-qa/current-strategy-plan.json').read_text())
design=json.loads((ROOT/'tools/act1-qa/plan.json').read_text())
rows=[]
for case in plan['cases']:
 path=OUT/f"stage{case['stage']}-{case['policy']}-{case['seed']}"/'trace.json'
 row={**case,'trace':str(path.relative_to(ROOT))}
 if not path.exists():row['status']='MISSING_RESULT';rows.append(row);continue
 raw=path.read_bytes();d=json.loads(raw);f=d['final']
 control=path.with_name('controller.js')
 row.update(source=d['source'],traceSha256=hashlib.sha256(raw).hexdigest(),controllerSha256=hashlib.sha256(control.read_bytes()).hexdigest(),operationMode=d.get('operationMode'),round=f['round'],phase=f['phase'],error=d.get('error'),survivors=sum(u['side']==0 and not u.get('summoned') and not u.get('dead') and u.get('hp',0)>0 for u in f['units']),winnerReason=f.get('winnerReason'),protected=[{k:u.get(k) for k in ('id','hp','maxHp','dead')} for u in f['units'] if u['id']=='objective' or u['id'].startswith('resident-')])
 row['status']='CONTROL_ERROR' if d.get('error') else 'WIN' if f['phase']=='won' else 'LOSS' if f['phase']=='lost' else 'INCOMPLETE'
 row['appOperationCount']=sum(a.get('op')=='app-operation' for a in d.get('inputs',[]))
 row['registeredRunnerMatches']=d.get('runnerSha256')==plan['sourceHashes']['tools/act1-qa/legacy-controller.mjs']
 rows.append(row)
stages=[]
for stage in plan['policies']:
 cases=[r for r in rows if r['stage']==int(stage)];wins=[r['round'] for r in cases if r['status']=='WIN'];target=design['stages'][int(stage)-1]['design']['rounds'];median=statistics.median(wins) if wins else None
 stages.append({'stage':int(stage),'registeredCases':len(cases),'wins':len(wins),'losses':sum(r['status']=='LOSS' for r in cases),'missingOrInvalid':sum(r['status'] not in ('WIN','LOSS') for r in cases),'successfulMedian':median,'successfulMeanReference':statistics.mean(wins) if wins else None,'target':target,'medianInTarget':median is not None and target[0]<=median<=target[1],'observedOver20':sum(r.get('round',0)>20 for r in cases),'finiteClearFraction':len(wins)/len(cases) if all(r['status'] in ('WIN','LOSS') for r in cases) else None,'confirmedWinsOfRegistered':f'{len(wins)}/{len(cases)}','allEvidencePresent':all(r['status'] in ('WIN','LOSS') for r in cases),'scope':'Registered finite native App strategy comparison, not browser/continuous campaign/population evidence.'})
result={'schema':'honro-current-strategy-evidence/v1','registration':'tools/act1-qa/current-strategy-plan.json','stages':stages,'cases':rows,'acceptance':'FAIL_INCOMPLETE_OR_OUT_OF_RANGE','remaining':'Actual UI applicability, valid landings, complete enemy effective-action denominator and stage-specific/readability gates remain separate; a win never implies full acceptance.'}
(OUT/'current-strategy-measurements.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(stages,ensure_ascii=False,indent=2))
