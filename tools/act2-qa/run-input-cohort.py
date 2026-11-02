"""Execute only preregistered canonical-RNG input robustness cases; retain failures."""
from pathlib import Path
import os,json,subprocess,sys,hashlib,datetime
ROOT=Path(__file__).resolve().parents[2];os.chdir(ROOT)
m=json.loads(Path('tests/fixtures/act2-gameplay/input-cohort-registration.json').read_text());lane=int(sys.argv[1]);assert lane in (0,1)
base=Path('_local/reports/act2-gameplay-20261103/input-cohort');base.mkdir(parents=True,exist_ok=True)
jobs=[(s,p,k) for s in m['stages'] for p in m['policies'] for k in m['inputSeeds']]
for index,(stage,policy,seed) in enumerate(jobs):
 if index%2!=lane:continue
 for f,expected in m['files'].items():assert hashlib.sha256(Path(f).read_bytes()).hexdigest()==expected,(f,'frozen source changed')
 for d,expected in m['sourceTrees'].items():
  assert subprocess.check_output(['git','rev-parse','HEAD:'+d],text=True).strip()==expected,(d,'runtime tree changed')
  subprocess.run(['git','diff','--exit-code','--',d],check=True,stdout=subprocess.DEVNULL)
 out=base/f'{stage}-{policy}-{seed}';assert not out.exists(),f'Never overwrite or silently rerun preregistered case {out}';out.mkdir()
 env={**os.environ,'HONRO_QA_OUT':str(out),'HONRO_QA_ROUND_LIMIT':str(m['roundObservationBound']),'HONRO_QA_ACTION_LIMIT':str(m['actionObservationBound'])}
 for key in ['HONRO_QA_RESUME','HONRO_QA_ENTRY_PROFILE']:env.pop(key,None)
 start=datetime.datetime.now(datetime.timezone.utc).isoformat();print('START',stage,policy,seed,flush=True)
 with (out/'stdout.log').open('w') as log:
  run=subprocess.run(['node','--expose-gc','--max-old-space-size=768','tests/act2-gameplay-cohort-20261103.mjs',str(stage),policy,str(seed)],env=env,stdout=log,stderr=subprocess.STDOUT)
 (out/'process.json').write_text(json.dumps({'start':start,'end':datetime.datetime.now(datetime.timezone.utc).isoformat(),'returncode':run.returncode,'terminalResultExists':(out/'result.json').exists(),'scope':'Exit status alone is not a game loss or clear'},indent=2));print('END',stage,policy,seed,run.returncode,flush=True)
