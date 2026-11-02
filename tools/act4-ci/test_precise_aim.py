"""Deterministic controller-contract mocks, NOT real-browser/gameplay proof.

Run: python -m unittest discover -s tools/act4-ci -p test_precise_aim.py -v
"""
import copy
import unittest
from unittest.mock import patch

import precise_aim


BASE = dict(angle=50.05290641484714, active='archer', facing=1, round=4,
            x=315, y=2455.875, moveLeft=2680, can=True, grounded=True,
            side=0, phase='aim', shots=12, health=[{'id': 'archer', 'hp': 1674}])
TARGET = 48.765061


def q(angle=TARGET, **changes):
    return dict(copy.deepcopy(BASE), angle=angle, **changes)


class Page:
    def __init__(self, states, release_ok=True):
        self.states = iter(states)
        self.current = copy.deepcopy(BASE)
        self.mouse = self
        self.held = False
        self.downs = self.ups = 0
        self.moves = []
        self.now = 0
        self.release_ok = release_ok

    def state(self):
        self.current = next(self.states, self.current)
        if isinstance(self.current, Exception):
            raise self.current
        return copy.deepcopy(self.current)

    def locator(self, selector):
        assert selector == '#joystick'
        return self

    def bounding_box(self):
        return dict(x=0, y=0, width=120, height=120)

    def move(self, x, y):
        self.moves.append((x, y))

    def down(self):
        self.held = True
        self.downs += 1

    def up(self):
        self.held = False
        self.ups += 1

    def evaluate(self, script):
        assert script == precise_aim.RELEASED, 'Only read-only release observation allowed'
        return not self.held and (self.release_ok or self.ups == 0)

    def wait_for_timeout(self, ms):
        self.now += ms / 1000


class PreciseAimTests(unittest.TestCase):
    def run_controller(self, page):
        with patch.object(precise_aim.time, 'monotonic', side_effect=lambda: page.now):
            result = precise_aim.aim_with_joystick(page, TARGET, page.state)
        self.assertFalse(page.held)
        self.assertEqual(page.downs, page.ups)
        return result

    def test_release_drift_gets_bounded_normal_pointer_correction(self):
        # Recorded .10513-degree released miss; the mock provides a later
        # converged observation, not a simulation of browser input physics.
        page = Page([BASE, BASE, q(TARGET-.03), q(48.65993119790143),
                     q(48.65993119790143), q(48.65993119790143), q(TARGET-.02),
                     q(TARGET-.025), q(TARGET-.025)])
        r = self.run_controller(page)
        self.assertTrue(r['passed'])
        self.assertEqual(len(r['attempts']), 2)
        self.assertEqual(r['before'], BASE)
        self.assertTrue(all(a['released'] for a in r['attempts']))
        self.assertTrue(all(x == 60 for x, _ in page.moves))
        self.assertTrue(r['unchangedContext'])

    def test_any_observed_context_change_aborts_even_if_restored(self):
        for change in [dict(active='mage'), dict(facing=-1), dict(round=5),
                       dict(x=316), dict(y=2456), dict(moveLeft=2679),
                       dict(can=False), dict(grounded=False), dict(shots=13),
                       dict(health=[{'id': 'archer', 'hp': 1673}])]:
            with self.subTest(change=change):
                page = Page([BASE, BASE, q(TARGET, **change), q()])
                r = self.run_controller(page)
                self.assertFalse(r['passed'])
                self.assertFalse(r['unchangedContext'])
                self.assertEqual(page.downs, 1)
                self.assertEqual(page.now, 0)  # no settle/retry after invalidation

    def test_settle_context_change_cannot_retry(self):
        page = Page([BASE, BASE, q(), q(TARGET-.2), q(TARGET-.2, round=5)])
        r = self.run_controller(page)
        self.assertFalse(r['passed'])
        self.assertEqual(page.downs, 1)

    def test_repeated_release_drift_is_not_infinite_or_a_pass(self):
        states = [BASE]
        for _ in range(precise_aim.MAX_ATTEMPTS):
            states += [q(TARGET-.2), q(), q(TARGET-.2), q(TARGET-.2)]
        page = Page(states)
        r = self.run_controller(page)
        self.assertFalse(r['passed'])
        self.assertEqual(page.downs, 3)
        self.assertGreater(abs(r['actual']-TARGET), .1)

    def test_stalled_input_respects_shared_time_budget(self):
        page = Page([BASE])
        r = self.run_controller(page)
        self.assertFalse(r['passed'])
        self.assertLessEqual(page.now, precise_aim.TIME_BUDGET + .2)
        self.assertLessEqual(len(r['attempts']), 3)

    def test_unreleased_pointer_is_never_retried_or_passed(self):
        page = Page([BASE, BASE, q(), q()], release_ok=False)
        r = self.run_controller(page)
        self.assertFalse(r['passed'])
        self.assertFalse(r['released'])
        self.assertEqual(page.downs, 1)

    def test_observation_exception_still_releases_pointer(self):
        page = Page([BASE, BASE, RuntimeError('observation failed')])
        with self.assertRaisesRegex(RuntimeError, 'observation failed'):
            self.run_controller(page)
        self.assertFalse(page.held)
        self.assertEqual(page.ups, 1)

    def test_single_attempt_success_preserves_gate(self):
        page = Page([BASE, BASE, q(), q(TARGET+.09), q(TARGET+.09)])
        r = self.run_controller(page)
        self.assertTrue(r['passed'])
        self.assertEqual(page.downs, 1)
        self.assertTrue(r['released'])


if __name__ == '__main__':
    unittest.main()
