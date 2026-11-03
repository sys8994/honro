"""No-network tests for the immutable normal-build provenance allowlist."""
import copy,importlib.util,json,tempfile,unittest
from pathlib import Path
from unittest.mock import patch
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('gate',ROOT/'tools/act2-qa/verify-stage17-generated.py');gate=importlib.util.module_from_spec(spec);spec.loader.exec_module(gate)
class ProvenanceTests(unittest.TestCase):
 def test_merged_gate_requires_exact_source_success_and_all_three_steps(self):
  source='a'*40;candidate='b'*40;run_id=123
  run={'head_sha':source,'status':'completed','conclusion':'success','path':'.github/workflows/act2-dialogue-integration.yml'}
  steps=['Retain actual latest publication then enforce normal build','Actual new arrival and normal first shot plus Stage17 entry/save','Preserve exact checked generated candidate, never master']
  jobs={'jobs':[{'steps':[{'name':s,'conclusion':'success'} for s in steps]}]}
  def invoke(r,j):
   with tempfile.TemporaryDirectory() as d,patch.object(gate,'api',side_effect=[r,j]):
    out=Path(d)/'receipt.json';gate.prerequisite(candidate,out,source,run_id);return json.loads(out.read_text())
  self.assertEqual(invoke(run,jobs)['artifact'],'act2-dialogue-integration-'+source)
  for change in [{'head_sha':'c'*40},{'conclusion':'failure'},{'status':'in_progress'},{'path':'.github/workflows/untrusted.yml'}]:
   with self.assertRaises(AssertionError):invoke({**run,**change},jobs)
  for index in range(3):
   bad=copy.deepcopy(jobs);bad['jobs'][0]['steps'][index]['conclusion']='skipped'
   with self.assertRaises(AssertionError):invoke(run,bad)
 def test_old_workflow_cannot_authorize_new_source(self):
  run={'head_sha':'a'*40,'status':'completed','conclusion':'success','path':'.github/workflows/act2-art-integration.yml'}
  with tempfile.TemporaryDirectory() as d,patch.object(gate,'api',return_value=run):
   with self.assertRaises(AssertionError):gate.prerequisite('b'*40,Path(d)/'r.json','a'*40,123)
if __name__=='__main__':unittest.main(verbosity=2)
