"""Controller decision mocks, not gameplay/release evidence.

Extract the real functions without importing the browser runner (which starts
and seeds a battle at import). No game state or saved battle is loaded here.
Run: python -m unittest discover -s tools/act4-ci -p 'test_*.py' -v
"""
import ast
from pathlib import Path
from types import SimpleNamespace
import unittest

SOURCE = Path(__file__).with_name('stage31-fullplay.py').read_text()
TREE = ast.parse(SOURCE)


def assessment(**changes):
    return {**dict(needed=True, low=False, critical=False, exposed=True,
                   path={'dir': -1}), **changes}


def controller(readings, *, move_left=3318, best=True):
    readings = iter(readings)
    current = None
    events, keys = [], []
    live = dict(can=True, grounded=True, moveLeft=move_left, active='knight', x=6202)

    def survival():
        nonlocal current
        current = next(readings, current)
        return current

    def down(key):
        keys.append(('down', key))
        live['x'] -= 220

    keyboard = SimpleNamespace(down=down, up=lambda key: keys.append(('up', key)),
                               press=lambda key: keys.append(('press', key)))
    env = dict(survival=survival, state=lambda: dict(live),
               plan=lambda: {'best': best}, out=Path('/not-written'),
               record=lambda *args: events.append(args), capture=lambda **kw: None,
               p=SimpleNamespace(keyboard=keyboard, wait_for_timeout=lambda ms: None))
    functions = [n for n in ast.walk(TREE) if isinstance(n, ast.FunctionDef)
                 and n.name in ('survive', 'emergency_survival')]
    exec(compile(ast.Module(body=functions, type_ignores=[]), '<actual-controller>', 'exec'), env)
    return env, keys, events


class SurvivalPolicyTests(unittest.TestCase):
    def test_r10_retreat_ends_action_even_after_warning_clears(self):
        exposed = assessment()
        safe = assessment(needed=False, exposed=False, path=None)
        env, keys, events = controller([exposed, exposed, safe, safe])
        self.assertTrue(env['survive'](38))  # caller continues; no pursuit
        self.assertEqual(keys, [('down', 'ArrowLeft'), ('up', 'ArrowLeft'), ('press', 'f')])
        self.assertEqual(events[-1][0], 'survival-defend-38')

    def test_r13_r14_critical_hp_preempts_stance_even_with_valid_shot(self):
        for hp, exposed in [(408, False), (24, True)]:
            with self.subTest(hp=hp):
                q = assessment(low=True, critical=True, exposed=exposed, hp=hp, path=None)
                env, keys, _ = controller([q])
                self.assertTrue(env['emergency_survival'](q))
                self.assertTrue(env['survive'](50))
                self.assertEqual(keys, [('press', 'f')])

    def test_low_but_not_critical_preserves_safe_offense(self):
        q = assessment(low=True, critical=False, exposed=False)
        env, keys, _ = controller([q])
        self.assertFalse(env['emergency_survival'](q))
        self.assertFalse(env['survive'](1))
        self.assertEqual(keys, [])

    def test_retreat_is_bounded_to_sixteen_pulses(self):
        env, keys, _ = controller([assessment(critical=True)])
        self.assertTrue(env['survive'](1))
        self.assertEqual(sum(k[0] == 'down' for k in keys), 16)
        self.assertEqual(sum(k[0] == 'up' for k in keys), 16)
        self.assertEqual(keys[-1], ('press', 'f'))

    def test_no_movement_budget_defends_without_walking(self):
        env, keys, _ = controller([assessment(critical=True)], move_left=0)
        self.assertTrue(env['survive'](1))
        self.assertEqual(keys, [('press', 'f')])

    def test_emergency_checks_bracket_stance_and_pursuit_in_real_loop(self):
        checks = sorted(n.lineno for n in ast.walk(TREE) if isinstance(n, ast.If)
                        and 'emergency_survival(survival())' in ast.unparse(n.test))
        stance = SOURCE.index("  stance=p.evaluate(")
        facing = SOURCE.index("   desired_facing=")
        firing = SOURCE.index("   p.keyboard.press('Digit'+str(choice['idx']+1))")
        offsets = [sum(len(line) for line in SOURCE.splitlines(keepends=True)[:n-1]) for n in checks]
        self.assertEqual(len(checks), 2)
        self.assertLess(offsets[0], stance)
        self.assertLess(facing, offsets[1])
        self.assertLess(offsets[1], firing)
        for n in ast.walk(TREE):
            if isinstance(n, ast.If) and n.lineno in checks:
                self.assertTrue(any(isinstance(x, ast.Continue) for x in n.body))


if __name__ == '__main__':
    unittest.main()
