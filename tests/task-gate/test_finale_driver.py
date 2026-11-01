"""Driver static invariants, not browser/play acceptance."""
import ast,pathlib,unittest
ROOT=pathlib.Path(__file__).resolve().parents[2]
class Driver(unittest.TestCase):
 def test_input_driver_keeps_real_actions_and_records_failures(self):
  s=(ROOT/'tools/act4-ci/finale40/play.py').read_text();ast.parse(s)
  for text in ["len(initial['foes'])==42","initial['major']==1","initial['minis']==2","releaseApproved","C.existenceMultiplier(C.attackForSkill(skill),v,u)","observe_warnings()","failure-storage.json.xz","p.keyboard.down('Space')"]:self.assertIn(text,s)
  for text in ["HonroApp.engine.fire(","HonroApp.engine.b.phase=",".hp=0","slice(0,4)"]:self.assertNotIn(text,s)
  ast.parse((ROOT/'tools/act4-ci/finale40/escort_inputs.py').read_text())
if __name__=='__main__':unittest.main()
