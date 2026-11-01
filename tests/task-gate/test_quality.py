"""Synthetic protocol/reducer regression. These traces are NOT game play proof."""
import copy,importlib.util,json,sys,unittest
from pathlib import Path
root=Path(__file__).resolve().parents[2];sys.path.insert(0,str(root/'tools/quality-gate'))
import gate

def fixture(win=True):
 h={'id':'hero','team':'player','rank':'normal','hp':100,'maxHP':100,'x':100,'y':100,'height':40}
 units=[h]+[{'id':'enemy'+str(i),'team':'enemy','rank':'normal','hp':100,'maxHP':100,'x':500+50*i,'y':100,'height':40} for i in range(4)]
 events=[];position=[100,100];serial=0;hp=100
 def emit(type,**kw):
  if type=='damage':kw.update(critical=False,beforeShield=0,afterShield=0)
  events.append({'seq':len(events),'time':len(events)*.01,'type':type,**kw})
 def action(actor,kind,round):
  nonlocal serial;serial+=1;id='a'+str(serial);emit('action',actionId=id,actor=actor,kind=kind,round=round,accepted=True);return id
 emit('start',units=copy.deepcopy(units))
 for r in range(1,9):
  if r>1:emit('phase',side='player',round=r)
  a=action('hero','jump',r);to=[position[0]+20,position[1]-20];emit('movement',actionId=a,actor='hero',cause='jump',**{'from':position,'to':to});position=to;emit('landing',actionId=a,actor='hero',fromSupport='s'+str(r),toSupport='s'+str(r+1))
  if r<=4:
   a=action('hero','drop',r);to=[position[0]+20,position[1]+10];emit('movement',actionId=a,actor='hero',cause='drop',**{'from':position,'to':to});position=to;emit('landing',actionId=a,actor='hero',fromSupport='s'+str(r+1),toSupport='d'+str(r))
  emit('phase',side='enemy',round=r)
  for i in range(4):
   a=action('enemy'+str(i),'attack',r);emit('damage',actionId=a,target='hero',beforeHP=hp,afterHP=hp-25,maxHP=100);hp-=25
   if win or r!=8:emit('heal',target='hero',beforeHP=hp,afterHP=100);hp=100
 if win:
  emit('phase',side='player',round=9)
  for i in range(4):
   a=action('hero','attack',9);emit('damage',actionId=a,target='enemy'+str(i),beforeHP=100,afterHP=0,maxHP=100)
 emit('objective',state='complete' if win else 'incomplete',facts={'enemyAlive':0 if win else 4,'heroesAlive':1 if win else 0})
 emit('end',outcome='won' if win else 'lost',round=9 if win else 8)
 return events

def cohort():
 slots=[{'trialId':'t'+str(i),'seed':i%6,'policy':'p'+str(i//6),'profileDigest':'a'*64,'class':'general'} for i in range(12)]
 reg={'schema':'honro-cohort-v1','stage':40,'candidateDigest':'b'*64,'criteriaDigest':gate.PINNED_CRITERIA,'trials':slots,'objectiveFacts':{'enemyAlive':0,'heroesAlive':1},'supportIds':['s'+str(i) for i in range(1,10)]+['d'+str(i) for i in range(1,5)]}
 traces={s['trialId']:{'header':{'schema':'honro-events-v1',**{k:reg[k] for k in ['stage','candidateDigest','criteriaDigest']},**{k:s[k] for k in ['trialId','seed','policy','profileDigest']}},'events':fixture(i<10)} for i,s in enumerate(slots)}
 return reg,traces
class Tests(unittest.TestCase):
 def setUp(self):self.stage=gate.criteria(root)['stages'][39];self.reg,self.traces=cohort();self.slot=self.reg['trials'][0]
 def reduce(self,t=None):return gate.reduce_trace(t or self.traces['t0'],self.reg,self.slot)
 def test_real_original_preserved(self):self.assertEqual(self.stage['design']['rounds'],[8,11]);self.assertEqual(self.stage['design']['requiredEngagements'],[3,6])
 def test_all_40_scalar_range_bounds(self):
  for s in gate.criteria(root)['stages']:
   for k in ['rounds','clearRate','enemyActions','requiredEngagements','majorBossCount']:gate.bounds(s['design'][k])
 def test_reducer(self):
  r=self.reduce();self.assertEqual((r['rounds'],r['engaged'],r['enemyActions'],r['enemyAttackPctHP'],r['jumps'],r['drops']),(9,4,4,25,8,4))
 def test_missing_adapters_blocks(self):
  r=gate.evaluate_stage(self.stage,self.reg,self.traces,'b'*64);self.assertFalse(r['releaseAllowed']);self.assertEqual(sum(x['status']=='unmeasured' for x in r['checks']),5)
 def test_explicit_synthetic_adapter_positive_path(self):
  names=['requiredElevationCoverage','qualitativeArtAndTactics','protectedFeaturesAndSeams','actDifficultyCurve','combatSafety'];adapters={n:(lambda *args,n=n:{'criterion':n,'status':'pass','observations':[{'syntheticFixtureOnly':True}]}) for n in names}
  self.assertTrue(gate.evaluate_stage(self.stage,self.reg,self.traces,'b'*64,adapters)['releaseAllowed'])
 def test_handwritten_pass_rejected(self):
  with self.assertRaises(gate.Invalid):self.reduce({'passed':True,'rounds':9})
 def test_incomplete_trace_rejected(self):
  t=copy.deepcopy(self.traces['t0']);t['events'].pop()
  with self.assertRaises(gate.Invalid):self.reduce(t)
 def test_wrong_candidate_rejected(self):
  with self.assertRaises(gate.Invalid):gate.evaluate_stage(self.stage,self.reg,self.traces,'c'*64)
 def test_missing_loss_not_discardable(self):
  del self.traces['t11']
  with self.assertRaises(gate.Invalid):gate.evaluate_stage(self.stage,self.reg,self.traces,'b'*64)
 def test_duplicate_trials_rejected(self):
  self.reg['trials'][1]=self.reg['trials'][0]
  with self.assertRaises(gate.Invalid):gate.evaluate_stage(self.stage,self.reg,self.traces,'b'*64)
 def test_unregistered_profile_rejected(self):
  self.traces['t0']['header']['profileDigest']='c'*64
  with self.assertRaises(gate.Invalid):self.reduce()
 def test_duplicate_damage_rejected(self):
  t=copy.deepcopy(self.traces['t0']);index=next(i for i,e in enumerate(t['events']) if e['type']=='damage');t['events'].insert(index+1,copy.deepcopy(t['events'][index]))
  for i,e in enumerate(t['events']):e['seq']=i;e['time']=i*.01
  with self.assertRaises(gate.Invalid):self.reduce(t)
 def test_fake_objective_rejected(self):
  t=copy.deepcopy(self.traces['t0']);t['events'][-2]['facts']={}
  with self.assertRaises(gate.Invalid):self.reduce(t)
 def test_landing_needs_movement(self):
  t=copy.deepcopy(self.traces['t0']);t['events']=[e for e in t['events'] if e['type']!='movement']
  for i,e in enumerate(t['events']):e['seq']=i
  with self.assertRaises(gate.Invalid):self.reduce(t)
 def test_support_label_fabrication_rejected(self):
  t=copy.deepcopy(self.traces['t0']);next(e for e in t['events'] if e['type']=='landing')['toSupport']='imaginary'
  with self.assertRaises(gate.Invalid):self.reduce(t)
 def test_phase_omission_rejected(self):
  t=copy.deepcopy(self.traces['t0']);t['events']=[e for e in t['events'] if e['type']!='phase']
  for i,e in enumerate(t['events']):e['seq']=i
  with self.assertRaises(gate.Invalid):self.reduce(t)
 def test_zero_action_phases_count(self):
  t=copy.deepcopy(self.traces['t0']);skip={e['actionId'] for e in t['events'] if e['type']=='action' and e['actor'].startswith('enemy') and e['round']>1};t['events']=[e for e in t['events'] if e.get('actionId') not in skip and e['type']!='heal']
  # Use only one 25-HP hit on each of four phases? A separate no-damage fixture
  # keeps continuity while preserving eight explicit eligible zero-action phases.
  t['events']=[e for e in t['events'] if not(e['type']=='damage' and e['target']=='hero')]
  for i,e in enumerate(t['events']):e['seq']=i;e['time']=i*.01
  self.assertEqual(self.reduce(t)['enemyActions'],0)
 def test_skilled_cannot_inflate_general_rate(self):
  self.reg['trials'][0]['class']='skilled'
  with self.assertRaises(gate.Invalid):gate.evaluate_stage(self.stage,self.reg,self.traces,'b'*64)
if __name__=='__main__':unittest.main(verbosity=2)
