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
 def test_locked_adapter_change_rejected(self):
  with tempfile.TemporaryDirectory() as d:
   root=Path(d);(root/'a.py').write_text('print(1)');config={'argv':[sys.executable,'a.py'],'lockedFiles':{'a.py':adapters.sha(root/'a.py')}};(root/'a.py').write_text('print(2)')
   with self.assertRaises(ValueError):adapters.execute(root,root,'protectedFeaturesAndSeams',config,{'id':40}, {},{})
if __name__=='__main__':unittest.main(verbosity=2)
