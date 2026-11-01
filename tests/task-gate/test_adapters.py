import json,sys,tempfile,unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[2]/'tools/quality-gate'))
import adapters
class Tests(unittest.TestCase):
 def test_numeric_art_bounds(self):
  m={'naturalLongStraightRatio':.2,'maxContourErrorPx':1,'maxProtectedErrorPx':.4,'lostProtectedFeatures':0,'visibleBadSeams':0};s={'design':{}}
  self.assertEqual(adapters.decision('protectedFeaturesAndSeams',m,s)['status'],'pass')
  for key,value in [('naturalLongStraightRatio',.3),('maxContourErrorPx',2),('maxProtectedErrorPx',.6),('lostProtectedFeatures',1),('visibleBadSeams',1)]:
   bad={**m,key:value};self.assertEqual(adapters.decision('protectedFeaturesAndSeams',bad,s)['status'],'fail')
 def test_nan_not_accepted(self):
  with self.assertRaises(ValueError):adapters.decision('protectedFeaturesAndSeams',{'naturalLongStraightRatio':float('nan')},{'design':{}})
 def test_unverified_review_not_accepted(self):
  with self.assertRaises(ValueError):adapters.decision('qualitativeArtAndTactics',{'authorityVerified':False},{'design':{}})
 def test_self_review_not_accepted(self):
  m={'authorityVerified':True,'authority':'test-only','verificationReference':'synthetic','reviewer':'same','producer':'same'}
  with self.assertRaises(ValueError):adapters.decision('qualitativeArtAndTactics',m,{'design':{}})
 def test_incomplete_rubric_not_accepted(self):
  m={'authorityVerified':True,'authority':'test-only','verificationReference':'synthetic','reviewer':'reviewer','producer':'maker','items':[]}
  with self.assertRaises(ValueError):adapters.decision('qualitativeArtAndTactics',m,{'design':{}})
 def test_arbitrary_pass_output_rejected(self):
  with tempfile.TemporaryDirectory() as d:
   root=Path(d);(root/'adapter.py').write_text('print(\'{"passed":true}\')');(root/'in.txt').write_text('actual input')
   config={'argv':[sys.executable,'adapter.py'],'lockedFiles':{'adapter.py':adapters.sha(root/'adapter.py')}}
   reg={'candidateDigest':'candidate','criteriaDigest':'criteria','adapters':{'protectedFeaturesAndSeams':{'registryDigest':adapters.hashlib.sha256(json.dumps(config,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'inputs':[{'role':'reference','path':'in.txt','sha256':adapters.sha(root/'in.txt')}]}}}
   with self.assertRaises(ValueError):adapters.execute(root,root,'protectedFeaturesAndSeams',config,{'id':40,'design':{}},reg,{})
 def test_macro_requires_frozen_deltas_not_merely_nonregression(self):
  m={'matchedGeneralPolicies':2,'missingStageCohorts':0,'act3CombatStageIds':list(range(21,31)),'act4CombatStageIds':list(range(31,41)),'act3GeneralStageIds':[21,22,23,24,28,30],'act4GeneralStageIds':[31,33,34,35,37,38],
  'act3GeneralClearRate':78.75,'act4GeneralClearRate':66.667,'act3AllCombatClearRate':77.25,'act4AllCombatClearRate':72,'act3GeneralEnemyActionsMedian':5,'act4GeneralEnemyActionsMedian':6,'act3AllEnemyActionsMean':4.5,'act4AllEnemyActionsMean':5.1,'act3GeneralAttackDamageMedian':22,'act4GeneralAttackDamageMedian':26,'act3AllAttackDamageMean':21.7,'act4AllAttackDamageMean':24.5,'act3AllRoundsMean':14.7,'act4AllRoundsMean':15.55,'act3AllRoundsMedian':14.5,'act4AllRoundsMedian':17.5}
  for act,count,stages in [(1,2,2),(2,4,4),(3,6,5),(4,10,7)]:m.update({f'act{act}Midbosses':count,f'act{act}MidbossStages':stages,f'act{act}VerifiedVerticalStages':4,f'act{act}VerifiedCombinedStages':4})
  self.assertEqual(adapters.decision('actDifficultyCurve',m,{'design':{}})['status'],'pass')
  for k,v in [('act4GeneralClearRate',78),('act4AllCombatClearRate',75),('act4GeneralEnemyActionsMedian',5.5),('act4GeneralAttackDamageMedian',24),('act4AllRoundsMean',14.7),('act4AllRoundsMedian',14.5)]:
   self.assertEqual(adapters.decision('actDifficultyCurve',{**m,k:v},{'design':{}})['status'],'fail',k)
 def test_combat_safety_cannot_pass_zero_test_coverage(self):
  with self.assertRaises(ValueError):adapters.decision('combatSafety',{'registeredThreatSituations':0},{'design':{}})
 def test_locked_adapter_change_rejected(self):
  with tempfile.TemporaryDirectory() as d:
   root=Path(d);(root/'a.py').write_text('print(1)');config={'argv':[sys.executable,'a.py'],'lockedFiles':{'a.py':adapters.sha(root/'a.py')}};(root/'a.py').write_text('print(2)')
   with self.assertRaises(ValueError):adapters.execute(root,root,'protectedFeaturesAndSeams',config,{'id':40}, {},{})
if __name__=='__main__':unittest.main(verbosity=2)
