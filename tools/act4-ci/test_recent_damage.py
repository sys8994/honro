"""Pure QA-controller regression tests, not gameplay/release evidence."""
import ast
import json
from pathlib import Path
import unittest
from recent_damage import RecentIncomingDamage


class RecentDamageTests(unittest.TestCase):
    def setUp(self):
        self.memory = RecentIncomingDamage()

    def read(self, serial, hp):
        return self.memory.observe(serial, [{'id': 'hero', 'hp': hp}])['hero']

    def test_two_quiet_enemy_responses_expire_old_peak(self):
        self.assertEqual(self.read(0, 1873), 0)
        self.assertEqual(self.read(1, 943), 930)
        self.assertEqual(self.read(2, 1018), 930)
        self.assertEqual(self.read(3, 1093), 0)

    def test_allied_actions_and_healing_do_not_age_memory(self):
        self.read(0, 1873)
        self.read(1, 943)
        for hp in [943, 943, 1018, 1018]:
            self.assertEqual(self.read(1, hp), 930)

    def test_new_damage_restarts_quiet_counter_and_preserves_peak(self):
        self.read(0, 2000)
        self.read(1, 1000)
        self.read(2, 1100)
        self.assertEqual(self.read(3, 1090), 1000)
        self.assertEqual(self.read(4, 1090), 1000)
        self.assertEqual(self.read(5, 1090), 0)

    def test_new_response_damage_is_kept_after_prior_expiry(self):
        for serial, hp in [(0, 2000), (1, 1000), (2, 1100), (3, 1200)]:
            self.read(serial, hp)
        self.assertEqual(self.read(4, 650), 550)

    def test_same_response_damage_resets_quiet_counter(self):
        self.read(0, 2000)
        self.read(1, 1000)
        self.read(2, 1100)
        self.assertEqual(self.read(2, 900), 1000)
        self.assertEqual(self.read(3, 900), 1000)
        self.assertEqual(self.read(4, 900), 0)

    def test_unobserved_response_gap_does_not_prove_quiet(self):
        self.read(0, 2000)
        self.read(1, 1000)
        self.assertEqual(self.read(4, 1200), 1000)
        self.assertEqual(self.read(5, 1200), 1000)
        self.assertEqual(self.read(6, 1200), 0)

    def test_memory_is_per_hero(self):
        self.memory.observe(0, [{'id': 'a', 'hp': 100}, {'id': 'b', 'hp': 100}])
        self.assertEqual(self.memory.observe(1, [{'id': 'a', 'hp': 30}, {'id': 'b', 'hp': 100}]), {'a': 70, 'b': 0})

    def test_response_serial_must_not_rewind(self):
        self.read(2, 100)
        with self.assertRaises(ValueError):
            self.read(1, 100)

    def test_actual_driver_uses_one_memory_for_survival_and_pursuit(self):
        source = Path(__file__).with_name('stage31-fullplay.py').read_text()
        ast.parse(source)
        self.assertIn("incomingDamage=damage_memory.observe(observed['enemyTeamEnds'],observed['health'])", source)
        self.assertIn("enemyTeamEnds:b.teamEnds[1]", source)
        self.assertIn("observedDamage*1.35", source)
        self.assertIn("u.maxHp*.35", source)
        self.assertIn("incomingDamage.get(hero['id'],0)*1.5", source)
        self.assertIn("if state()['round']>20", source)
        self.assertNotIn('previousHp', source)

    def test_original_r4_r8_r20_saved_health_trace(self):
        path = Path(__file__).resolve().parents[2] / 'tests/fixtures/act4-rc/observed-damage-41746180178.json'
        fixture = json.loads(path.read_text())
        self.assertEqual(len(fixture['sourceSnapshots']), 77)
        checkpoints = {}
        for record in fixture['observations']:
            peaks = self.memory.observe(record['enemyTeamEnds'], record['health'])
            checkpoints[record['file']] = {
                h['id']: (peaks[h['id']], h['hp'] + h['shield'] <= max(h['maxHp'] * .35, peaks[h['id']] * 1.35))
                for h in record['health']}
        self.assertEqual(checkpoints['0014.json']['occultist'], (930, True))
        self.assertEqual(checkpoints['0028.json']['occultist'], (0, False))
        self.assertEqual(checkpoints['0074.json']['mage'], (0, False))


if __name__ == '__main__':
    unittest.main()
