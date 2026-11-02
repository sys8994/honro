"""One serial diagnostic lane. Invalid/unfinished rows remain; never report a ratio."""
from pathlib import Path
import subprocess,os,json,time,hashlib
R=Path(__file__).resolve().parents[2];out=R/'_local/reports/released-app';out.mkdir(exist_ok=True)
waiting=out/'12-survival-hud-757356291/process.json'
while not waiting.exists():time.sleep(2)
cases=[(13,'survival'),(14,'survival'),(16,'objective'),(17,'objective'),(15,'height'),(11,'survival')]
for stage,policy in cases:
 label=f'{stage}-{policy}-hud-757356291';d=out/label
 if (d/'process.json').exists():continue # Never overwrite a finished/interrupted case.
 d.mkdir(exist_ok=True)
 tracked=['tests/act2-gameplay-app.mjs','tests/act2-gameplay-app-navigation.mjs','tests/app-regression-helpers.mjs','tools/act2-qa/player-operations.mjs','tools/act2-qa/pure-planning.mjs','tools/act2-qa/production-aim-preview.mjs']
 while subprocess.run(['git','diff','--quiet','--',*tracked],cwd=R).returncode:time.sleep(2)
 meta={'stage':stage,'policy':policy,'inputSeed':757356291,'source':subprocess.check_output(['git','rev-parse','HEAD'],cwd=R,text=True).strip(),'files':{f:hashlib.sha256((R/f).read_bytes()).hexdigest() for f in tracked},'kind':'selected breadth diagnostic, not finite-rate registration','roundBound':45,'wallSecondsBound':1200,'startedAt':time.time()}
 (d/'launch.json').write_text(json.dumps(meta,indent=2)+'\n')
 env={**os.environ,'HONRO_QA_OUT':str(d),'HONRO_QA_ROUND_LIMIT':'45'}
 if stage==11:env['HONRO_QA_ENTRY_PROFILE']=str(out/'stage11-current-entry-equipped/prepared-entry.json')
 print('START',label,meta['source'],flush=True)
 with (d/'process.log').open('w') as f:
  try:r=subprocess.run(['node','--expose-gc','--max-old-space-size=512','tests/act2-gameplay-app.mjs',str(stage),policy,'757356291'],cwd=R,env=env,stdout=f,stderr=subprocess.STDOUT,timeout=1200);code=r.returncode;status='process-complete'
  except subprocess.TimeoutExpired:code=124;status='process-timeout-not-death'
 receipt={**meta,'exitCode':code,'processStatus':status,'endedAt':time.time(),'resultExists':(d/'result.json').exists()};(d/'process.json').write_text(json.dumps(receipt,indent=2)+'\n');print('END',label,code,receipt['resultExists'],flush=True)
