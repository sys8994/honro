"""Normal browser Continue + movement for the natural Stage14 NPC reservation lock.
Candidate-source regression only, not a fresh chapter clear or final-art approval.
The unchanged native-produced saved profile is imported before gameplay; all live
changes use normal UI controls. Runtime inspection is read-only.
"""
import os,json,gzip,time,traceback
from pathlib import Path
from playwright.sync_api import sync_playwright
out=Path(os.environ.get('HONRO_QA_OUT','_local/reports/stage14-postfix-ui'));out.mkdir(parents=True,exist_ok=True)
fixture=Path('tests/fixtures/act2-gameplay/stage14-natural-settle-lock-terminal.json.gz');saved=json.loads(gzip.decompress(fixture.read_bytes()))
result={'passed':False,'scope':__doc__,'source':os.environ.get('GITHUB_SHA'),'fixture':str(fixture),'events':[],'errors':[]}
def save():(out/'result.json').write_text(json.dumps(result,ensure_ascii=False,indent=2))
with sync_playwright() as w:
 try:
  browser=w.chromium.launch(headless=True);p=browser.new_page(viewport={'width':1440,'height':960});p.on('pageerror',lambda e:result['errors'].append(str(e)))
  url=os.environ.get('HONRO_QA_URL','http://127.0.0.1:8870/HONRO.html');p.goto(url,wait_until='domcontentloaded');p.wait_for_function('window.HonroApp',timeout=60000)
  p.evaluate('v=>localStorage.setItem("honro-first-act-profile-1",JSON.stringify(v))',saved['profile']);p.reload(wait_until='domcontentloaded');p.wait_for_function('window.HonroApp');p.locator('.title-actions button.primary:visible').click();p.wait_for_function('HonroApp.engine?.b?.honroStage===14',timeout=60000)
  def state():return p.evaluate('''()=>{const a=HonroApp,e=a.engine,b=e.b,n=e.unit('14.gilchan');return{phase:b.phase,round:b.round,active:e.active?.id,can:a.canInput(),dialogue:!!a.dialogue,projectiles:b.projectiles.length,settleBusy:e.settleBusy(),npc:{x:n.x,y:n.y,hp:n.hp,fixed:n.fixed,jumping:n.jumping,airborne:n.airborne,vx:n.vx,vy:n.vy,grounded:e.grounded(n)},heroes:e.heroesAlive().map(u=>({id:u.id,x:u.x,y:u.y,hp:u.hp,acted:u.acted,moveLeft:u.moveLeft}))}}''')
  def record(op):result['events'].append({'op':op,'time':time.time(),'state':state()});save()
  def dialogue():
   nxt=p.locator('[data-action="dialogue-next"]:visible')
   if nxt.count() and nxt.first.is_enabled():nxt.first.click()
   elif state()['dialogue']:p.keyboard.press('Enter')
  record('continued-natural-save');initial=state();assert not initial['npc']['grounded'],'Initial body reservation must not fake terrain support';result['heroMovement']=[];p.screenshot(path=str(out/'initial.png'))
  until=time.monotonic()+100
  while time.monotonic()<until and not state()['can']:dialogue();p.wait_for_timeout(200)
  record('input-boundary');assert state()['can'],'No ordinary input boundary after candidate fix'
  for hero in ['p-archer','p-mage','p-knight']:
   if state()['dialogue']:dialogue()
   chip=p.locator('[data-action="select-hero"][data-id="'+hero+'"]:visible');assert chip.count(),'Missing ordinary hero selector';chip.click();p.wait_for_timeout(150);assert state()['active']==hero,'Hero cannot be selected at this boundary'
   record('selected-'+hero);before=next(u for u in state()['heroes'] if u['id']==hero);p.keyboard.down('ArrowLeft')
   try:p.wait_for_timeout(650)
   finally:p.keyboard.up('ArrowLeft')
   after=next(u for u in state()['heroes'] if u['id']==hero);delta={'id':hero,'dx':after['x']-before['x'],'dy':after['y']-before['y']};result['heroMovement'].append(delta);assert abs(delta['dx'])>=20,'Ordinary left input did not move blocking hero';record('moved-'+hero);p.screenshot(path=str(out/('moved-'+hero+'.png')))
  observed=False;until=time.monotonic()+30
  while time.monotonic()<until:
   s=state()
   if s['npc']['grounded'] and not s['npc'].get('jumping') and not s['npc'].get('airborne'):observed=True;break
   if s['dialogue']:dialogue()
   p.wait_for_timeout(100)
  record('npc-physical-settlement');result['observedGroundedAfterMoves']=observed;result['npcDisplacement']={'dx':state()['npc']['x']-initial['npc']['x'],'dy':state()['npc']['y']-initial['npc']['y']};result['passed']=observed and abs(result['npcDisplacement']['dy'])>5 and not result['errors'];p.screenshot(path=str(out/'terminal.png'));browser.close()
 except Exception:
  result['passed']=False
  result['exception']=traceback.format_exc()
  try:record('exception');p.screenshot(path=str(out/'failure.png'))
  except Exception:pass
 finally:save()
if not result['passed']:raise SystemExit(1)
