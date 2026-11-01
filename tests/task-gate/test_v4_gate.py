"""Synthetic version/threshold regression, never actual gameplay evidence."""
import copy,pathlib,sys,tempfile,shutil,unittest
ROOT=pathlib.Path(__file__).resolve().parents[2];sys.path[:0]=[str(ROOT/'tools/quality-gate'),str(ROOT/'tests/task-gate')]
import gate,effective_criteria,adapters
from test_quality import cohort
class VersionedGate(unittest.TestCase):
 def test_projection_preserves_original_and_other_stage_designs(self):
  old=gate.criteria(ROOT,'v3');new=gate.criteria(ROOT,'v4')
  self.assertEqual(old['stages'][39]['design']['rounds'],[8,11]);self.assertEqual(new['stages'][39]['design']['rounds'],[18,20])
  for a,b in zip(old['stages'][:39],new['stages'][:39]):self.assertEqual(a['design'],b['design'])
  self.assertEqual(new['macro']['acts'][3]['minibossCount'],[11,13]);self.assertEqual(new['macro']['acts'][3]['minibossStages'],[8,8])
  self.assertEqual(new['stages'][30]['measurementClassification'],{'jumps':'reference','drops':'reference'})
 def test_old_protocol_cannot_be_reused(self):
  reg,traces=cohort()
  with self.assertRaises(gate.Invalid):gate.evaluate_stage(gate.criteria(ROOT,'v4')['stages'][39],reg,traces,'b'*64)
 def test_four_enemy_fixture_fails_new_frozen_requirements(self):
  reg,traces=cohort();reg['criteriaDigest']=gate.ACTIVE_DIGEST
  for t in traces.values():t['header']['criteriaDigest']=gate.ACTIVE_DIGEST
  r=gate.evaluate_stage(gate.criteria(ROOT,'v4')['stages'][39],reg,traces,'b'*64)
  self.assertFalse(r['releaseAllowed']);self.assertTrue(any(c['criterion']=='uniqueEnemyBudget' and c['status']=='fail' for c in r['checks']))
  self.assertTrue(any(c['criterion']=='simultaneousParticipants' and c['status']=='unmeasured' for c in r['checks']))
  self.assertFalse(any(c['criterion'] in ['jumps','drops'] for c in r['checks']));self.assertEqual(len(r['referenceChecks']),2)
  self.assertTrue(any(c['criterion']=='requiredElevationCoverage' and c['status']=='unmeasured' for c in r['checks']))
 def test_reference_count_change_does_not_waive_safety(self):
  reg,traces=cohort();stage=gate.criteria(ROOT,'v4')['stages'][30];reg['stage']=31;reg['criteriaDigest']=gate.ACTIVE_DIGEST
  for t in traces.values():t['header'].update(stage=31,criteriaDigest=gate.ACTIVE_DIGEST)
  r=gate.evaluate_stage(stage,reg,traces,'b'*64);self.assertFalse(r['releaseAllowed']);self.assertIn('combatSafety',[c['criterion'] for c in r['checks']])
 def test_reference_height_not_misclassified_but_required_span_preserved(self):
  stage=gate.criteria(ROOT,'v4')['stages'][35]
  m={'requiredSupports':4,'visitedRequiredSupports':4,'invalidContacts':0,'registeredActiveHeight':2252.8,'completeReachableGraphHeight':2252.8,'completeReachableGraphSupports':8,'registeredGraphSupports':8,'omittedReachableSupports':0,'supportedElevationSpan':550,'physicalDx':3000,'physicalDy':600}
  self.assertEqual(adapters.decision('requiredElevationCoverage',m,stage)['status'],'pass')
  cropped=copy.deepcopy(m);cropped['registeredActiveHeight']=2000
  with self.assertRaises(ValueError):adapters.decision('requiredElevationCoverage',cropped,stage)
  vertical=gate.criteria(ROOT,'v4')['stages'][36];m.update(registeredActiveHeight=1638.4,completeReachableGraphHeight=1638.4,supportedElevationSpan=1200,physicalDx=1000,physicalDy=1000)
  self.assertEqual(adapters.decision('requiredElevationCoverage',m,vertical)['status'],'fail','Do not erase the separate4400–5200 required route span')
 def test_finale_safety_cannot_be_omitted_by_registration(self):
  reg,traces=cohort();reg['criteriaDigest']=gate.ACTIVE_DIGEST
  for t in traces.values():t['header']['criteriaDigest']=gate.ACTIVE_DIGEST
  r=gate.evaluate_stage(gate.criteria(ROOT,'v4')['stages'][39],reg,traces,'b'*64)
  self.assertTrue(any(c['criterion']=='finaleReturnSafety' and c['status']=='unmeasured' for c in r['checks']))
  self.assertEqual(sum(c['criterion']=='majorBossBudget' for c in r['checks']),12)
  self.assertEqual(sum(c['criterion']=='minibossBudget' for c in r['checks']),12)
  self.assertTrue(any(c['criterion']=='majorBossDefeated' and c['status']=='fail' for c in r['checks']))
 def test_round_union_is_not_simultaneous(self):
  stage=gate.criteria(ROOT,'v4')['stages'][39]
  with self.assertRaises(ValueError):adapters.decision('simultaneousParticipants',{'definition':'round-union','registeredTrials':12,'coveredTrials':12,'successfulGeneralPeakMedian':9},stage)
 def test_return_violation_fails(self):
  stage=gate.criteria(ROOT,'v4')['stages'][39]
  m={'registeredTrials':12,'coveredTrials':12,'successfulTrials':7,'physicalReturnCoveredWins':7}
  for k in ['unobservedSafeReturnTransitions','enemyActionsAfterSafeReturn','enemySpawnsAfterSafeReturn','winsWithWrongResidentSurvival','winsWithWrongBoatResidents','winsWithWrongHighRouteResidents','winsWithWrongFinalAccounting','winsWithPendingRequiredSpawns']:m[k]=0
  self.assertEqual(adapters.decision('finaleReturnSafety',m,stage)['status'],'pass')
  for k in list(m)[4:]:
   bad=dict(m);bad[k]=1;self.assertEqual(adapters.decision('finaleReturnSafety',bad,stage)['status'],'fail',k)
 def test_projection_and_reducer_sources_are_bound(self):
  hashes=gate.gate_source_hashes(ROOT)
  for n in ['gate.py','effective_criteria.py','adapters.py','collect.py','protocols.json','adapter-registry.json']:self.assertIn('tools/quality-gate/'+n,hashes)
 def test_adapter_cannot_report_one_of_twelve_trials(self):
  reg,traces=cohort();m={'registeredTrials':1,'coveredTrials':1}
  with self.assertRaises(ValueError):adapters.verify_trial_coverage('simultaneousParticipants',m,reg,traces)
  m.update(registeredTrials=12,coveredTrials=12,traceDigests={k:gate.canonical(v) for k,v in traces.items()})
  adapters.verify_trial_coverage('simultaneousParticipants',m,reg,traces)
  m.update(successfulTrials=1,physicalReturnCoveredWins=1)
  with self.assertRaises(ValueError):adapters.verify_trial_coverage('finaleReturnSafety',m,reg,traces)
  m.update(successfulTrials=10,physicalReturnCoveredWins=10)
  adapters.verify_trial_coverage('finaleReturnSafety',m,reg,traces)
 def test_unknown_version_is_rejected(self):
  with self.assertRaises(gate.Invalid):gate.criteria(ROOT,'v99')
 def test_amendment_tampering_is_rejected(self):
  with tempfile.TemporaryDirectory() as d:
   root=pathlib.Path(d);dest=root/'tools/quality-gate';dest.mkdir(parents=True)
   shutil.copyfile(ROOT/'tools/quality-gate/criteria-v3.json.gz',dest/'criteria-v3.json.gz');(dest/'criteria-v4-amendment.json').write_text('{}')
   with self.assertRaises(ValueError):effective_criteria.load(root)
if __name__=='__main__':unittest.main()
