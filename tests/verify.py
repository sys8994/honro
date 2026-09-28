"""Capture npm's actual exit code and provenance without PowerShell stderr wrapping."""
import datetime,hashlib,json,os,subprocess,sys,time
from browser_support import ROOT

log=ROOT/'_local/logs/final-verify.log';log.parent.mkdir(parents=True,exist_ok=True)
command=['npm.cmd' if os.name=='nt' else 'npm','run','verify']
start=time.time()
with log.open('w',encoding='utf-8') as output:
    result=subprocess.run(command,cwd=ROOT,stdout=output,stderr=subprocess.STDOUT)
report={'command':'npm run verify','exitCode':result.returncode,
        'finishedUTC':datetime.datetime.now(datetime.timezone.utc).isoformat(),
        'durationSeconds':round(time.time()-start,2),
        'artifacts':{name:hashlib.sha256((ROOT/name).read_bytes()).hexdigest() for name in ['index.html','HONRO.html','HONRO_WORKSHOP.html']}}
(ROOT/'_local/reports/verification-run.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8',newline='\n')
print(json.dumps(report),flush=True)
sys.exit(result.returncode)
