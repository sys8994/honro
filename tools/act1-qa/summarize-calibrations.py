"""Keep post-cohort diagnostic revisions separate, including incomplete controls."""
import hashlib,json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'_local/reports/act1-gameplay-20261103'
design=json.loads((ROOT/'tools/act1-qa/plan.json').read_text())
registrations=['calibration-v2-registration.json','splitrescue-v3-registration.json','convoy-v4-registration.json','airborne-v5-registration.json','descent-v6-registration.json','landing-v7-registration.json']
rows=[]
for name in registrations:
 reg=json.loads((ROOT/'tools/act1-qa'/name).read_text())
 cases=reg.get('cases',[reg]);extra=reg.get('additionalDiagnosticAfterFirstOutcomes')
 if extra:cases=[*cases,extra]
 for c in cases:
  path=OUT/f"stage{c['stage']}-{c['policy']}-{c['seed']}"/'trace.json'
  row={k:c[k] for k in ('stage','seed','policy')};row.update(registration=name,trace=str(path.relative_to(ROOT)))
  if not path.exists():row['status']='MISSING_RESULT';rows.append(row);continue
  raw=path.read_bytes();d=json.loads(raw);b=d['final'];ops=[a for a in d['inputs'] if a.get('op')=='app-operation'];target=design['stages'][c['stage']-1]['design']['rounds']
  row.update(source=d['source'],sourceDirtyAtStart=d['sourceDirtyAtStart'],traceSha256=hashlib.sha256(raw).hexdigest(),runnerMatchesRegistration=d.get('runnerSha256')==reg['sourceHashes']['tools/act1-qa/legacy-controller.mjs'],operationMode=d.get('operationMode'),phase=b['phase'],round=b['round'],status='CONTROL_ERROR' if d.get('error') else 'WIN' if b['phase']=='won' else 'LOSS' if b['phase']=='lost' else 'INCOMPLETE',error=d.get('error'),roundTarget=target,successfulTrialRoundInTarget=(target[0]<=b['round']<=target[1]) if b['phase']=='won' else None,acceptedPlayerLaunches=sum(a.get('operation')=='fire' and a.get('accepted') is True for a in ops),acceptedJumpCommands=sum(a.get('operation')=='jump' and a.get('accepted') is True for a in ops),acceptedDropCommands=sum(a.get('operation')=='drop' and a.get('accepted') is True for a in ops),interactions=[{k:a.get(k) for k in ('round','actor','marker','accepted')} for a in ops if a.get('operation')=='interact'],survivingHeroes=sum(u['side']==0 and not u.get('summoned') and not u.get('dead') and u.get('hp',0)>0 for u in b['units']),pendingEvents=b['honroState'].get('pendingEvents',[]))
  rows.append(row)
result={'schema':'honro-separate-native-calibrations/v1','scope':'Post-cohort controller diagnostics, not pooled population/cohort or browser evidence. Frozen outcomes remain unchanged. A timing-band win is not all gameplay acceptance.','overallAcceptance':'FAIL_INCOMPLETE_OR_OUT_OF_RANGE','cases':rows}
(OUT/'calibration-measurements.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
for r in rows:print(r['stage'],r['policy'],r['status'],r.get('round'),r.get('acceptedPlayerLaunches'))
