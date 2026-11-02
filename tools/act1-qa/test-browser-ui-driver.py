"""Pure driver verdict regression; does not launch or claim a browser run."""
import ast
from pathlib import Path
import unittest
from types import SimpleNamespace

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

movement = next(n for n in source.body if isinstance(n, ast.FunctionDef) and n.name == 'drive_movement')
exec(compile(ast.Module(body=[movement], type_ignores=[]), 'browser-ui.py', 'exec'), namespace)

class MovementTests(unittest.TestCase):
 def page(self):
  self.events = []
  self.clock = 0
  def wait(ms):
   self.events.append(('wait', ms));self.clock += ms/1000
  keyboard=SimpleNamespace(down=lambda key:self.events.append(('down',key)),
                           up=lambda key:self.events.append(('up',key)),
                           press=lambda key:self.events.append(('press',key)))
  namespace['time']=SimpleNamespace(monotonic=lambda:self.clock)
  return SimpleNamespace(keyboard=keyboard, wait_for_timeout=wait)
 def state(self, x=0, grounded=False, **kw):
  return {'x':x,'y':0,'can':True,'active':'archer','moveLeft':100,'grounded':grounded,**kw}
 def test_jump_holds_axis_across_observation_frames(self):
  page=self.page();states=iter([self.state(10),self.state(20),self.state(30,True)])
  namespace['drive_movement'](page,lambda:next(states),{'op':'jump','x':30},self.state())
  self.assertEqual(self.events,[('press','Control'),('down','ArrowRight'),('wait',16),('wait',16),('up','ArrowRight')])
 def test_walk_waits_for_landing_before_next_command(self):
  page=self.page();states=iter([self.state(30),self.state(30,True)])
  namespace['drive_movement'](page,lambda:next(states),{'op':'walk','x':30},self.state())
  self.assertEqual(self.events,[('down','ArrowRight'),('up','ArrowRight'),('wait',16)])
 def test_observation_exception_releases_key(self):
  page=self.page()
  def observe():raise RuntimeError('observation failed')
  with self.assertRaises(RuntimeError):
   namespace['drive_movement'](page,observe,{'op':'jump','x':30},self.state())
  self.assertEqual(self.events[-1],('up','ArrowRight'))
 def test_terminal_state_releases_key_without_further_input(self):
  page=self.page()
  namespace['drive_movement'](page,lambda:self.state(can=False),{'op':'walk','x':30},self.state())
  self.assertEqual(self.events,[('down','ArrowRight'),('up','ArrowRight')])

if __name__ == '__main__': unittest.main()
