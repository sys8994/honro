"""Run protected, preregistered gameplay collectors; do not import PASS summaries.
No drivers are selected from third-party text. Registry changes require review.
"""
import argparse,hashlib,json,os,subprocess
from pathlib import Path
from gate import ACTIVE_DIGEST as PINNED_CRITERIA,candidate_digest,canonical,need,gate_source_hashes

def fhash(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def local(root,name):
 p=(root/name).resolve();need(p.is_relative_to(root) and p!=root,'path outside registered root');return p

def collect(root,output):
 registry=json.loads((root/'tools/quality-gate/protocols.json').read_text());need(registry.get('schema')=='honro-protocol-registry-v1','bad protocol registry');candidate=candidate_digest(root);gate_code=gate_source_hashes(root);results=[]
 output.mkdir(parents=True,exist_ok=True)
 for stage in registry['requiredStages']:
  plan=registry['stages'].get(str(stage))
  if not plan:results.append({'stage':stage,'status':'blocked','reason':'No preregistered collector/protocol'});continue
  try:
   regpath=local(root,plan['registration']);need(fhash(regpath)==plan['registrationSha256'],'registration changed after lock');reg=json.loads(regpath.read_text());need(reg['stage']==stage and reg['candidateDigest']==candidate and reg['criteriaDigest']==PINNED_CRITERIA,'registration identity mismatch')
   driver=plan['driver'];files={n:local(root,n) for n in driver['lockedFiles']}
   need(driver['argv'][1] in files,'collector entry not locked')
   for n,p in files.items():need(fhash(p)==driver['lockedFiles'][n],'collector/dependency changed')
   directory=output/str(stage);traces=directory/'traces';traces.mkdir(parents=True,exist_ok=True);(directory/'registration.json').write_bytes(regpath.read_bytes())
   for slot in reg['trials']:
    need(slot['trialId'].isalnum() or all(c.isalnum() or c in '-_' for c in slot['trialId']),'unsafe trial id')
    target=traces/(slot['trialId']+'.json');need(not target.exists(),'stale trial file: start in a fresh collection directory')
    env={**os.environ,'HONRO_QA_REGISTRATION':str(regpath),'HONRO_QA_TRIAL':slot['trialId'],'HONRO_QA_TRACE_OUT':str(target),'HONRO_QA_CANDIDATE_DIGEST':candidate}
    proc=subprocess.run([driver['argv'][0],str(files[driver['argv'][1]]),*driver['argv'][2:]],cwd=root,env=env,capture_output=True,text=True,timeout=driver['timeoutSeconds'])
    (directory/(slot['trialId']+'.collector.log')).write_text(proc.stdout+'\n'+proc.stderr)
    need(proc.returncode==0 and target.is_file(),'collector failed; trial is missing, not silently excluded')
    trace=json.loads(target.read_text());need(set(trace)=={'header','events'} and trace['header'].get('schema')=='honro-events-v1','collector returned a summary instead of events')
    need(trace['header'].get('trialId')==slot['trialId'] and trace['header'].get('candidateDigest')==candidate,'collector trace identity mismatch')
   for n,p in files.items():need(fhash(p)==driver['lockedFiles'][n],'collector changed while running')
   need(candidate_digest(root)==candidate and fhash(regpath)==plan['registrationSha256'],'collector modified source/registration')
   need(gate_source_hashes(root)==gate_code,'gate/projection changed during collection')
   proof={'gateCode':gate_code,'schema':'honro-collection-v1','candidateDigest':candidate,'criteriaDigest':PINNED_CRITERIA,'registrationSha256':fhash(regpath),'collectorCode':driver['lockedFiles'],'workflowRun':os.environ.get('GITHUB_RUN_ID'),'workflowCommit':os.environ.get('GITHUB_SHA'),'files':{p.name:fhash(p) for p in sorted(traces.glob('*.json'))}}
   (directory/'collection.json').write_text(json.dumps(proof,indent=2));results.append({'stage':stage,'status':'collected','trials':len(proof['files'])})
  except Exception as exc:results.append({'stage':stage,'status':'blocked','reason':str(exc)})
 report={'schema':'honro-collection-report-v1','candidateDigest':candidate,'complete':all(r['status']=='collected' for r in results),'stages':results};(output/'collection-report.json').write_text(json.dumps(report,indent=2));return report
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--root',default='.');p.add_argument('--out',default='_local/quality-evidence');a=p.parse_args();r=collect(Path(a.root).resolve(),Path(a.root).resolve()/a.out);print(json.dumps(r,indent=2));raise SystemExit(0 if r['complete'] else 2)
