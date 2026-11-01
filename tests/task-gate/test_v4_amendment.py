import gzip,hashlib,json,pathlib,unittest
ROOT=pathlib.Path(__file__).resolve().parents[2]
class Amendment(unittest.TestCase):
 def test_frozen_target_not_backfilled_acceptance(self):
  j=json.loads((ROOT/'tools/quality-gate/criteria-v4-amendment.json').read_text())
  self.assertEqual(hashlib.sha256(gzip.decompress((ROOT/'tools/quality-gate/criteria-v3.json.gz').read_bytes())).hexdigest(),j['baseRawSha256'])
  r=j['stage40']['required'];self.assertEqual(r['uniqueEnemyBudget'],[42,42]);self.assertEqual(r['minibossCount'],[2,2]);self.assertEqual(r['majorBossCount'],[1,1]);self.assertEqual(r['rounds'],[18,20]);self.assertEqual(r['roundHardMax'],20)
  self.assertEqual(j['verticalCountAmendment']['referenceOnly'],['jumps','drops']);self.assertTrue(j['verticalCountAmendment']['requiredUnchanged']);self.assertTrue(j['implementationPending']);self.assertIn('integration-pending',j['status'])
if __name__=='__main__':unittest.main()
