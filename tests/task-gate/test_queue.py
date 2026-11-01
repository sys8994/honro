"""Synthetic negative-path tests for the coordinator, not real quality passes."""
import importlib.util,json,sys,tempfile,unittest
from pathlib import Path
spec=importlib.util.spec_from_file_location('task_gate_queue',Path(__file__).resolve().parents[2]/'tools/task-gate/queue.py');q=importlib.util.module_from_spec(spec);spec.loader.exec_module(q)
WORKER='''import os,pathlib,sys
p=pathlib.Path(sys.argv[1]);p.write_text(str(os.environ['TASK_GATE_ATTEMPT']) if len(sys.argv)==2 else sys.argv[2])
'''
CHECK='''import os,json,pathlib,sys
h=json.loads(os.environ['TASK_GATE_ARTIFACTS']);v=pathlib.Path('value.txt').read_text();mode=sys.argv[2]
r={'schema':'task-gate-check-v1','criterion':sys.argv[1],'status':'pass' if v.isdigit() and int(v)>=3 else 'fail','artifacts':h,'observations':[{'actual':v,'target':'>=3','syntheticTest':True}]}
if mode=='fake':r={'passed':True}
if mode=='empty':r['observations']=[]
if mode=='stale':r['artifacts']={}
if mode=='missing':r['status']='unmeasured'
if mode=='review':r['status']='review_required'
if mode=='mutate':pathlib.Path('value.txt').write_text('999')
if mode=='rewrite':pathlib.Path('criteria.txt').write_text('target=0')
print(json.dumps(r))
'''
class Tests(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();self.root=Path(self.tmp.name);self.queue=self.root/'queue.json'
  for n,t in [('worker.py',WORKER),('check.py',CHECK),('criteria.txt','target=3')]: (self.root/n).write_text(t)
  self.s=q.load(self.queue)
 def tearDown(self):self.tmp.cleanup()
 def task(self,id='one',mode='normal',produce=True,max_attempts=3):
  checks=[{'id':k,'kind':k,'command':[sys.executable,'check.py',k,mode]} for k in ['quantitative','qualitative']]
  step={'id':'draft','artifacts':['value.txt'],'checks':checks,'max_attempts':max_attempts}
  if produce:step.update(produce=[sys.executable,'worker.py','value.txt'],repair=[sys.executable,'worker.py','value.txt'])
  return {'id':id,'source_message':'synthetic-user-test','plan':{'version':1,'locked_files':{n:q.file_hash(self.root/n) for n in ['check.py','criteria.txt']},'steps':[step]}}
 def enqueue(self,t):q.enqueue(self.s,t,self.root);q.save(self.queue,self.s)
 def runq(self):return q.run(self.s,self.root,lambda:q.save(self.queue,self.s),timeout=5)
 def test_repair_loop_no_skip(self):
  t=self.task();t['plan']['steps'].append({'id':'next','produce':[sys.executable,'worker.py','next.txt','3'],'checks':t['plan']['steps'][0]['checks'],'artifacts':['value.txt','next.txt'],'max_attempts':1});self.enqueue(t)
  self.assertTrue(self.runq());self.assertEqual(self.s['tasks'][0]['attempts']['draft'],3);self.assertTrue((self.root/'next.txt').exists())
 def test_failure_blocks_later_task(self):
  self.enqueue(self.task(max_attempts=2));t=self.task('two');t['plan']['steps'][0]['produce']=[sys.executable,'worker.py','forbidden.txt','3'];self.enqueue(t)
  self.assertFalse(self.runq());self.assertEqual(self.s['tasks'][1]['status'],'queued');self.assertFalse((self.root/'forbidden.txt').exists())
 def test_missing_artifact_blocks(self):self.enqueue(self.task(produce=False));self.assertFalse(self.runq())
 def test_missing_checks_rejected(self):
  t=self.task();t['plan']['steps'][0]['checks']=[]
  with self.assertRaises(q.GateError):self.enqueue(t)
 def test_missing_qualitative_rejected(self):
  t=self.task();t['plan']['steps'][0]['checks']=t['plan']['steps'][0]['checks'][:1]
  with self.assertRaises(q.GateError):self.enqueue(t)
 def test_manual_pass_rejected(self):self.enqueue(self.task(mode='fake'));self.assertFalse(self.runq())
 def test_unmeasured_rejected(self):self.enqueue(self.task(mode='missing'));self.assertFalse(self.runq())
 def test_review_required_rejected(self):self.enqueue(self.task(mode='review'));self.assertFalse(self.runq())
 def test_empty_evidence_rejected(self):self.enqueue(self.task(mode='empty'));self.assertFalse(self.runq())
 def test_stale_artifact_rejected(self):self.enqueue(self.task(mode='stale'));self.assertFalse(self.runq())
 def test_mutating_validator_rejected(self):self.enqueue(self.task(mode='mutate'));self.assertFalse(self.runq())
 def test_criterion_rewrite_rejected(self):self.enqueue(self.task(mode='rewrite'));self.assertFalse(self.runq())
 def test_criteria_changed_before_run(self):
  self.enqueue(self.task());(self.root/'criteria.txt').write_text('target=1');self.assertFalse(self.runq())
 def test_changed_plan_rejected(self):
  self.enqueue(self.task());self.s['tasks'][0]['plan']['steps'][0]['max_attempts']=99;self.assertFalse(self.runq())
 def test_status_tamper_detected(self):
  self.enqueue(self.task());s=json.loads(self.queue.read_text());s['tasks'][0]['status']='completed';self.queue.write_text(json.dumps(s))
  with self.assertRaises(q.GateError):q.load(self.queue)
 def test_done_without_receipts_blocked(self):
  self.enqueue(self.task());self.s['tasks'][0]['status']='completed';self.assertFalse(self.runq())
 def test_output_changed_after_pass_invalidates(self):
  self.enqueue(self.task());self.assertTrue(self.runq());(self.root/'value.txt').write_text('0');self.assertFalse(self.runq());self.assertEqual(self.s['tasks'][0]['status'],'blocked')
 def test_duplicate_task_rejected(self):
  self.enqueue(self.task())
  with self.assertRaises(q.GateError):self.enqueue(self.task())
 def test_path_escape_rejected(self):
  t=self.task();t['plan']['steps'][0]['artifacts']=['../escape'];self.enqueue(t);self.assertFalse(self.runq())
 def test_history_reload(self):
  self.enqueue(self.task());self.assertTrue(self.runq());loaded=q.load(self.queue);self.assertEqual(loaded['tasks'][0]['status'],'completed')
if __name__=='__main__':unittest.main(verbosity=2)
