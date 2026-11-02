"""Pure driver verdict regression; does not launch or claim a browser run."""
import ast
from pathlib import Path
import unittest

source = ast.parse(Path(__file__).with_name('browser-ui.py').read_text())
helper = next(n for n in source.body if isinstance(n, ast.FunctionDef) and n.name == 'aim_terminal')
namespace = {}
exec(compile(ast.Module(body=[helper], type_ignores=[]), 'browser-ui.py', 'exec'), namespace)
aim_terminal = namespace['aim_terminal']

class AimTerminalTests(unittest.TestCase):
 def test_authored_win_interrupts_aim_without_claiming_precision(self):
  aim = {'passed': False, 'contextChanges': ['phase', 'dialogue', 'x', 'health']}
  self.assertTrue(aim_terminal(aim, {'phase': 'won'}))
  self.assertFalse(aim['passed'])
 def test_loss_is_terminal_but_not_win(self):
  state = {'phase': 'lost'}
  self.assertTrue(aim_terminal({'passed': False}, state))
  self.assertNotEqual(state['phase'], 'won')
 def test_nonterminal_miss_still_fails(self):
  for phase in ['aim', 'review', 'flight']:
   with self.assertRaisesRegex(AssertionError, 'Aim precision failed'):
    aim_terminal({'passed': False}, {'phase': phase})
 def test_valid_aim_continues(self):
  self.assertFalse(aim_terminal({'passed': True}, {'phase': 'aim'}))

if __name__ == '__main__': unittest.main()
