"""Focused current-runtime boarding regression from a recorded real R13 save.
Not a fresh battle, success-rate sample or natural 1-30 campaign proof.
"""
import os,json,lzma,hashlib
from pathlib import Path
from playwright.sync_api import sync_playwright
here=Path(__file__).resolve().parent;out=Path(os.environ['HONRO_CAPTURE_OUT']);out.mkdir(parents=True,exist_ok=True)
raw=lzma.decompress((here/'checkpoint.json.xz').read_bytes())
assert hashlib.sha256(raw).hexdigest()=='7a58b7fbe5dff81dbb630974e4b4112e10623f4aef74cdbd866ca07273af69ee'
source=out/'recorded-profile.json';source.write_bytes(raw)
commands=json.loads((here/'inputs.json').read_text())
result={'passed':False,'releaseApproved':False,'scope':'recorded R13 real checkpoint -> four-person boarding with current browser runtime',
        'sourceCommit':os.environ.get('GITHUB_SHA'),'checkpointSha256':hashlib.sha256(raw).hexdigest(),'observations':[],'errors':[]}
state_js='''()=>{const e=HonroApp.engine,b=e.b,q=b.honroAct4PreviewState;return {stage:b.honroStage,phase:b.phase,round:b.round,
 active:b.active,dialogue:!!HonroApp.dialogue,boat:q.boat,complete:!!q.complete,enemies:b.units.filter(u=>u.side===1&&!u.dead).length,
 heroes:b.units.filter(u=>u.side===0&&!u.summoned).map(u=>({id:u.id,x:u.x,y:u.y,hp:u.hp,dead:u.dead,grounded:e.grounded(u)}))}}'''
try:
 with sync_playwright() as w:
  browser=w.chromium.launch(headless=True);p=browser.new_page(viewport={'width':1440,'height':900})
  p.on('pageerror',lambda e:result['errors'].append(str(e)))
  p.goto(os.environ['HONRO_CAPTURE_URL'],wait_until='domcontentloaded');p.wait_for_function('window.HonroApp')
  p.locator('[data-action="settings"]').first.click();p.get_by_text('기록·관리',exact=False).click()
  p.get_by_text('JSON 기록 가져오기',exact=True).click();p.get_by_text('파일 선택',exact=True).click()
  p.locator('#file-import').set_input_files(str(source.resolve()))
  p.wait_for_function('HonroApp.profile?.honroBattle?.honroStage===31',timeout=60000)
  p.reload();p.wait_for_function('window.HonroApp');p.get_by_text('이어서 걷기',exact=True).click()
  p.wait_for_function('HonroApp.engine?.b?.honroStage===31',timeout=60000)
  first=p.evaluate(state_js);assert first['round']==13 and first['enemies']==0 and len(first['heroes'])==4,first
  result['initial']=first;p.screenshot(path=str(out/'initial.jpg'),type='jpeg',quality=88)
  def observe(label):
   v=p.evaluate(state_js);result['observations'].append({'step':label,'actual':v})
   assert all(h['hp']>0 and not h['dead'] for h in v['heroes']),v
   assert v['active']==hero, 'Unexpected actor handoff: '+str(v)
   return v
  def quiet():
   for _ in range(90):
    p.wait_for_timeout(600)
    if p.evaluate('!!HonroApp.dialogue'):
     p.keyboard.press('Enter');continue
    if p.evaluate("HonroApp.engine.b.phase==='won'||HonroApp.canInput()"):
     p.wait_for_timeout(400)
     if not p.evaluate('!!HonroApp.dialogue'):return
   raise TimeoutError('Dialogue/input gate did not settle')
  def actor():
   v=p.evaluate(state_js);return next(h for h in v['heroes'] if h['id']==v['active'])
  def landed():
   for _ in range(70):
    if actor()['grounded']:return
    if p.evaluate('!!HonroApp.dialogue'):quiet()
    p.wait_for_timeout(100)
   raise TimeoutError('Landing did not settle')
  def walk(x,jump=False):
   quiet();landed();before=actor();direction='ArrowRight' if x>before['x'] else 'ArrowLeft'
   p.keyboard.down(direction)
   if jump:p.keyboard.press('Control')
   try:
    for _ in range(65):
     p.wait_for_timeout(50);u=actor()
     if p.evaluate('!!HonroApp.dialogue'):break
     if (direction=='ArrowRight' and u['x']>=x-4) or (direction=='ArrowLeft' and u['x']<=x+4):break
   finally:p.keyboard.up(direction)
   landed();observe(('jump-to-' if jump else 'walk-to-')+str(x))
  def drop_to(y):
   for _ in range(5):
    quiet();landed()
    if actor()['y']>=y-5:return
    p.keyboard.press('Alt');p.wait_for_timeout(1700);landed();observe('drop-toward-'+str(y))
   assert actor()['y']>=y-5,actor()
  quiet()
  for _ in range(60):
   if p.evaluate(state_js)['boat']['phase']=='docked':break
   quiet();p.wait_for_timeout(500)
  assert p.evaluate(state_js)['boat']['phase']=='docked'
  for hero in ['archer','mage','knight','occultist']:
   quiet();p.locator('[data-action="select-hero"][data-id="'+hero+'"]').click();p.wait_for_timeout(500)
   assert p.evaluate(state_js)['active']==hero
   if hero in ['archer','mage']:
    walk(4815);walk(4900,True)
    if actor()['x']<4885:walk(4920,True)
    walk(5080);walk(5500);walk(5800);drop_to(2700);walk(6480)
   elif hero=='knight':drop_to(2700);walk(6480)
   else:walk(5500);walk(5950);drop_to(2700);walk(6480)
   drop_to(3366);u=actor()
   assert 6397.5<u['x']<6697.5 and abs(u['y']-3366)<5,u
   p.screenshot(path=str(out/('boarded-'+hero+'.jpg')),type='jpeg',quality=88)
  quiet();p.keyboard.press('e');p.wait_for_timeout(1500)
  for _ in range(40):
   if p.evaluate(state_js)['phase']=='won':break
   if p.evaluate('!!HonroApp.dialogue'):p.keyboard.press('Enter')
   p.wait_for_timeout(700)
  final=p.evaluate(state_js);result['final']=final;p.screenshot(path=str(out/'objective.jpg'),type='jpeg',quality=88)
  assert final['phase']=='won' and final['complete'] and final['boat']['phase']=='boarded',final
  assert final['round']==13 and not result['errors'],result['errors']
  result['passed']=True;browser.close()
finally:
 (out/'result.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
