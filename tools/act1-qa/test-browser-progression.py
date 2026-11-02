"""Mocked post-win UI contract tests, not browser completion evidence."""
import copy
import tempfile
import unittest
from pathlib import Path
from browser_progression import CONTRACTS, assert_saved, assert_destination, finish_progression

TERMINAL={'phase':'won','round':12}
def snapshot(stage=5, screen='rest'):
 c=CONTRACTS[stage];roster=['archer','mage']+([c['recruit']] if c['recruit'] else [])
 return {'screen':screen,'dialogue':False,'modal':None,'done':True,'battleStage':c['stage'] if c['screen']=='battle' else None,
  'restStage':c['stage'],'phase':None,'can':True,'nextStage':c['stage'],'locked':False,'saveWarning':False,
  'persisted':{'cleared':{str(stage):{'visits':1,'rounds':12}},'recruited':roster,'party':roster[:],
   'heroes':{'archer':{'xp':100,'ranks':{'A01':1},'statTraining':0}},'loadouts':{'archer':['A01']},'equipment':{},
   'battleStage':c['stage'] if c['screen']=='battle' else None,'journey':{'stageId':c['stage']},'ending':None,'endingSeen':stage==10}}

class Locator:
 def __init__(self,page,selector):self.page=page;self.selector=selector
 @property
 def first(self):return self
 def count(self):return int(('dialogue-next' in self.selector and self.page.step==0) or ('result-continue' in self.selector and self.page.step==1 and self.page.stage!=10) or ('title-actions' in self.selector and self.page.step==3))
 def is_enabled(self):return True
 def wait_for(self,**kw):assert self.count()
 def get_attribute(self,key):return 'continue' if self.page.stage==1 else 'rest'
 def click(self):
  assert self.count();self.page.actions.append(self.selector)
  if self.page.step==1 and self.page.deferred:self.page.pending=2
  else:self.page.step={0:1,1:2,3:4}[self.page.step]

class Page:
 def __init__(self,stage=5,duplicate_reload=False,deferred=False):
  self.stage=stage;self.step=0;self.actions=[];self.keyboard=self;self.duplicate_reload=duplicate_reload;self.deferred=deferred;self.pending=0
 def evaluate(self,code):
  s=snapshot(self.stage,CONTRACTS[self.stage]['screen'])
  if self.step==0:s.update(screen='battle',dialogue=True);s['persisted']['cleared']={}
  if self.step==1:s.update(screen='act-ending' if self.stage==10 else 'battle',modal='result')
  if self.step==3:s.update(screen='title')
  if self.step>=3 and self.duplicate_reload:s['persisted']['heroes']['archer']['xp']+=100
  return copy.deepcopy(s)
 def locator(self,selector):return Locator(self,selector)
 def press(self,key):
  assert self.stage==10 and self.step==1 and key=='Enter';self.actions.append('ending-enter');self.step=2
 def wait_for_timeout(self,ms):
  if self.pending:
   self.pending-=1
   if not self.pending:self.step=2
 def wait_for_function(self,*args,**kwargs):pass
 def screenshot(self,**kwargs):self.actions.append(Path(kwargs['path']).name)
 def reload(self,**kwargs):self.actions.append('reload');self.step=3

class ProgressionTests(unittest.TestCase):
 def test_battle_win_without_persisted_clear_is_not_completion(self):
  s=snapshot();s['persisted']['cleared']={}
  with self.assertRaisesRegex(AssertionError,'not persisted'):assert_saved(s,5,TERMINAL,0)
 def test_loss_cannot_enter_postwin_actions(self):
  p=Page()
  with self.assertRaisesRegex(AssertionError,'legitimate battle win'):
   finish_progression(p,5,{'phase':'lost','round':12},0,Path('/tmp'),{},lambda:None)
  self.assertEqual(p.actions,[])
 def test_wrong_round_or_duplicate_settlement_fails(self):
  for field,value in [('rounds',13),('visits',2)]:
   s=snapshot();s['persisted']['cleared']['5'][field]=value
   with self.assertRaises(AssertionError):assert_saved(s,5,TERMINAL,0)
 def test_missing_recruit_or_wrong_rest_fails(self):
  s=snapshot();s['persisted']['recruited']=['archer','mage']
  with self.assertRaisesRegex(AssertionError,'recruit missing'):assert_destination(s,CONTRACTS[5])
  s=snapshot();s['restStage']=7
  with self.assertRaisesRegex(AssertionError,'destination stage'):assert_destination(s,CONTRACTS[5])
 def test_locked_save_is_not_pass(self):
  s=snapshot();s['locked']=True
  with self.assertRaisesRegex(AssertionError,'locked'):assert_saved(s,5,TERMINAL,0)
 def test_all_authored_routes_reload_without_duplicate_rewards(self):
  for stage in [1,5,10]:
   with self.subTest(stage=stage),tempfile.TemporaryDirectory() as out:
    p=Page(stage);r={};finish_progression(p,stage,TERMINAL,0,Path(out),r,lambda:None)
    self.assertTrue(r['passed']);self.assertIn('reload',p.actions)
    self.assertEqual(r['transition'],'act-ending' if stage==10 else 'result-continue')
    self.assertEqual(r['completion'],{'visits':1,'rounds':12})
 def test_pending_normal_campaign_load_does_not_double_click(self):
  with tempfile.TemporaryDirectory() as out:
   p=Page(5,deferred=True);r={};finish_progression(p,5,TERMINAL,0,Path(out),r,lambda:None)
   self.assertTrue(r['passed'])
   self.assertEqual(p.actions.count('[data-action="result-continue"]:visible'),1)
 def test_reload_duplicate_xp_fails(self):
  with tempfile.TemporaryDirectory() as out:
   with self.assertRaisesRegex(AssertionError,'Reload changed'):
    finish_progression(Page(5,True),5,TERMINAL,0,Path(out),{},lambda:None)

if __name__=='__main__':unittest.main()
