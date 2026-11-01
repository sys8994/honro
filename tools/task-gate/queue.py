"""Fail-closed, serial artifact workflow. Not a sandbox or tool-permission bypass.
Commands must be trusted, authorized local adapters. A gate cannot protect itself
from an administrator editing both code and policy: protect them independently.
"""
import argparse,fcntl,hashlib,json,os,subprocess,time
from pathlib import Path

class GateError(Exception):pass

def digest(x):return hashlib.sha256(json.dumps(x,sort_keys=True,separators=(',',':'),ensure_ascii=False).encode()).hexdigest()
def file_hash(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def need(v,msg):
 if not v:raise GateError(msg)
def artifact(root,relative):
 p=(root/relative).resolve();need(p.is_relative_to(root) and p!=root,'artifact outside workspace');return p
def snapshot(root,paths):
 need(paths and len(paths)==len(set(paths)),'missing/duplicate artifacts')
 return {p:file_hash(artifact(root,p)) for p in paths}
def validate_plan(plan,root):
 need(plan.get('version')==1 and plan.get('steps'),'invalid empty plan')
 ids=[]
 for step in plan['steps']:
  need(set(step)<={'id','produce','repair','checks','artifacts','max_attempts'},'unknown step field')
  ids.append(step['id']);need(step.get('checks') and step.get('artifacts'),'every step needs checks and artifacts')
  need(isinstance(step.get('max_attempts'),int) and 1<=step['max_attempts']<=100,'bounded attempt budget required')
  for check in step['checks']:
   need(check.get('kind') in ['quantitative','qualitative'],'check kind required')
   need(check.get('id') and isinstance(check.get('command'),list) and check['command'],'validator command required')
  need(len({c['id'] for c in step['checks']})==len(step['checks']),'duplicate checks')
  need({c['kind'] for c in step['checks']}=={'quantitative','qualitative'},'both quantitative and qualitative checks required')
 need(len(ids)==len(set(ids)),'duplicate steps')
 locked=plan.get('locked_files');need(isinstance(locked,dict) and locked,'lock criteria and validator sources')
 for p,h in locked.items():need(file_hash(artifact(root,p))==h,'locked source mismatch: '+p)
 for step in plan['steps']:
  for check in step['checks']:need(any(p in check['command'] for p in locked),'validator must execute a locked source file')
 return digest(plan)
def execute(root,command,env,timeout):
 need(isinstance(command,list) and all(isinstance(x,str) for x in command) and command,'invalid command')
 # No shell expansion, background job or implicit network/permission grants.
 return subprocess.run(command,cwd=root,env={**os.environ,**env},capture_output=True,text=True,timeout=timeout)
def save(path,state):
 state['state_hash']=digest({k:v for k,v in state.items() if k!='state_hash'});path.parent.mkdir(parents=True,exist_ok=True);tmp=path.with_suffix('.tmp');tmp.write_text(json.dumps(state,ensure_ascii=False,indent=2));os.replace(tmp,path)
def event(state,kind,**data):
 previous=state['events'][-1]['hash'] if state['events'] else None
 row={'at':time.time(),'kind':kind,'previous':previous,**data};row['hash']=digest(row);state['events'].append(row)
def load(path):
 if not path.exists():return {'version':1,'tasks':[],'events':[]}
 s=json.loads(path.read_text());need(s.get('version')==1,'bad queue version');need(s.get('state_hash')==digest({k:v for k,v in s.items() if k!='state_hash'}),'queue state edited outside runner');prev=None
 for row in s['events']:
  item={k:v for k,v in row.items() if k!='hash'};need(row['previous']==prev and digest(item)==row['hash'],'broken history');prev=row['hash']
 return s
def capture(state,task_id,source_message,request):
 need(task_id and source_message and request,'request and source are required')
 need(not any(t['id']==task_id for t in state['tasks']),'duplicate task')
 state['tasks'].append({'id':task_id,'source_message':source_message,'request':request,'status':'awaiting_plan','step':0,'attempts':{},'receipts':[]})
 event(state,'captured',task=task_id,source_message=source_message)
def bind_plan(state,task_id,plan,root):
 task=next(t for t in state['tasks'] if t['id']==task_id);need(task['status']=='awaiting_plan','criteria already frozen')
 h=validate_plan(plan,root);task.update(plan=plan,plan_hash=h,status='queued',attempt_limits={s['id']:s['max_attempts'] for s in plan['steps']})
 event(state,'plan-frozen',task=task_id,plan_hash=h)
def enqueue(state,task,root):
 need(task.get('id') and task.get('source_message'),'authenticated request reference required')
 need(not any(t['id']==task['id'] for t in state['tasks']),'duplicate task')
 h=validate_plan(task['plan'],root)
 state['tasks'].append({'id':task['id'],'source_message':task['source_message'],'plan':task['plan'],'plan_hash':h,'status':'queued','step':0,'attempts':{},'attempt_limits':{s['id']:s['max_attempts'] for s in task['plan']['steps']},'receipts':[]})
 event(state,'enqueued',task=task['id'],plan_hash=h)
def check_receipts(task,root):
 need(task['step']==len(task['receipts']),'stage counter without receipts')
 for receipt in task['receipts']:need(snapshot(root,list(receipt['artifacts']))==receipt['artifacts'],'earlier stage artifact changed; revise candidate, not past receipt')
def check_completed_history(state,root):
 for previous in state['tasks']:
  if previous['status']=='completed':
   need(validate_plan(previous['plan'],root)==previous['plan_hash'],'earlier task criteria or validator changed')
   check_receipts(previous,root)
def run(state,root,persist,timeout=120):
 for task in state['tasks']:
  if task['status']=='awaiting_plan':event(state,'waiting-for-criteria',task=task['id']);persist();return False
  need(task['status'] in ['queued','running','rework','blocked','completed'],'invalid task state')
  if task['status']=='completed':
   # Done is not accepted blindly after artifact or criterion changes.
   try:
    need(validate_plan(task['plan'],root)==task['plan_hash'],'plan changed')
    need(task['step']==len(task['plan']['steps']) and len(task['receipts'])==task['step'],'incomplete task marked done')
    need([r['step'] for r in task['receipts']]==[s['id'] for s in task['plan']['steps']],'receipt sequence mismatch')
    for receipt,step in zip(task['receipts'],task['plan']['steps']):
     need(receipt['plan_hash']==task['plan_hash'] and {x['id'] for x in receipt['checks']}=={x['id'] for x in step['checks']} and all(x['passed'] and x['result'].get('status')=='pass' for x in receipt['checks']),'invalid completion receipt')
    for receipt in task['receipts']:need(snapshot(root,list(receipt['artifacts']))==receipt['artifacts'],'completed artifact changed')
   except Exception as exc:task['status']='blocked';event(state,'invalidated',task=task['id'],reason=str(exc));persist();return False
   continue
  if task['status']=='blocked':return False
  try:
   need(validate_plan(task['plan'],root)==task['plan_hash'],'plan changed after registration')
   for receipt in task['receipts']:need(snapshot(root,list(receipt['artifacts']))==receipt['artifacts'],'earlier stage evidence stale')
   check_receipts(task,root)
   task['status']='running';persist()
   for index in range(task['step'],len(task['plan']['steps'])):
    step=task['plan']['steps'][index]
    while True:
     need(validate_plan(task['plan'],root)==task['plan_hash'],'criteria or validator changed')
     attempt=task['attempts'].get(step['id'],0)+1
     if attempt>task['attempt_limits'][step['id']]:raise GateError('repair budget exhausted; next task remains blocked')
     task['attempts'][step['id']]=attempt
     command=step.get('produce') if attempt==1 else step.get('repair')
     env={'TASK_GATE_TASK':task['id'],'TASK_GATE_STEP':step['id'],'TASK_GATE_ATTEMPT':str(attempt)}
     if command:
      proc=execute(root,command,env,timeout)
      event(state,'work',task=task['id'],step=step['id'],attempt=attempt,exit=proc.returncode,stdout=proc.stdout[-4000:],stderr=proc.stderr[-4000:])
      check_receipts(task,root);check_completed_history(state,root)
      if proc.returncode:task['status']='rework';persist();continue
     try:hashes=snapshot(root,step['artifacts'])
     except Exception as exc:event(state,'missing-artifact',task=task['id'],step=step['id'],reason=str(exc));task['status']='rework';persist();continue
     env['TASK_GATE_ARTIFACTS']=json.dumps(hashes,sort_keys=True);outcomes=[]
     for check in step['checks']:
      proc=execute(root,check['command'],env,timeout)
      try:
       result=json.loads(proc.stdout)
       need(set(result)=={'schema','criterion','status','artifacts','observations'},'invalid verdict schema')
       need(result['schema']=='task-gate-check-v1' and result['criterion']==check['id'],'wrong criterion')
       need(result['status'] in ['pass','fail','unmeasured','review_required'],'unknown verdict')
       need(result['artifacts']==hashes,'verdict for wrong/stale artifacts')
       need(isinstance(result['observations'],list) and result['observations'],'PASS without evidence')
       passed=proc.returncode==0 and result['status']=='pass'
      except Exception as exc:result={'status':'invalid','reason':str(exc)};passed=False
      outcomes.append({'id':check['id'],'kind':check['kind'],'passed':passed,'result':result,'exit':proc.returncode})
     need(snapshot(root,step['artifacts'])==hashes,'validator modified artifact')
     check_receipts(task,root);check_completed_history(state,root)
     need(validate_plan(task['plan'],root)==task['plan_hash'],'validator/worker changed fixed criteria')
     event(state,'checks',task=task['id'],step=step['id'],attempt=attempt,outcomes=outcomes)
     if all(c['passed'] for c in outcomes):
      receipt={'step':step['id'],'artifacts':hashes,'plan_hash':task['plan_hash'],'checks':outcomes}
      task['receipts'].append(receipt);task['step']=index+1;task['status']='running';persist();break
     task['status']='rework';persist()
     if not step.get('repair'):raise GateError('failed/unmeasured check and no authorized repair adapter')
   check_receipts(task,root);check_completed_history(state,root)
   task['status']='completed';event(state,'completed',task=task['id']);persist()
  except Exception as exc:
   task['status']='blocked';event(state,'blocked',task=task['id'],reason=str(exc));persist();return False
 return True

def retry(state,root,task_id,reason):
 need(reason and reason.strip(),'retry reason required')
 task=next(t for t in state['tasks'] if t['id']==task_id)
 need(task['status']=='blocked' and task['step']<len(task['plan']['steps']),'only blocked current work can retry')
 need(validate_plan(task['plan'],root)==task['plan_hash'],'cannot retry with changed criteria')
 check_receipts(task,root)
 step=task['plan']['steps'][task['step']];task['attempt_limits'][step['id']]=task['attempts'].get(step['id'],0)+step['max_attempts'];task['status']='rework'
 event(state,'retry',task=task_id,step=step['id'],reason=reason,new_attempt_limit=task['attempt_limits'][step['id']])
def main():
 p=argparse.ArgumentParser();p.add_argument('command',choices=['capture','plan','enqueue','run','status','retry']);p.add_argument('--queue',required=True);p.add_argument('--root',required=True);p.add_argument('--spec');p.add_argument('--source-message');p.add_argument('--request');p.add_argument('--task');p.add_argument('--reason');p.add_argument('--timeout',type=int,default=120);a=p.parse_args()
 root=Path(a.root).resolve();q=Path(a.queue).resolve();q.parent.mkdir(parents=True,exist_ok=True)
 with open(str(q)+'.lock','a') as lock:
  fcntl.flock(lock,fcntl.LOCK_EX);s=load(q)
  if a.command=='capture':capture(s,a.task,a.source_message,a.request);save(q,s)
  elif a.command=='plan':bind_plan(s,a.task,json.loads(Path(a.spec).read_text()),root);save(q,s)
  elif a.command=='enqueue':enqueue(s,json.loads(Path(a.spec).read_text()),root);save(q,s)
  elif a.command=='retry':retry(s,root,a.task,a.reason);save(q,s)
  elif a.command=='run':return 0 if run(s,root,lambda:save(q,s),a.timeout) else 2
  else:print(json.dumps([{'id':t['id'],'status':t['status'],'step':t['step'],'attempts':t['attempts']} for t in s['tasks']],ensure_ascii=False))
 return 0
if __name__=='__main__':raise SystemExit(main())
