"""Synthetic entry fixture; real UI, keyboard, camera and projectile pixels.
No scene/actor teleport or forced camera; not a clear, fun or device FPS proof.
"""
import json,traceback,time
from pathlib import Path
from playwright.sync_api import sync_playwright
out=Path('_local/reports/stage6-art-preview/input-review');out.mkdir(parents=True,exist_ok=True)
r={'scope':'Synthetic entry fixture, real UI/keyboard/normal camera; short input smoke only, not full gameplay or physical-device validation','views':[],'errors':[]}
fixture=json.loads(Path('tests/fixtures/act1-art/stage06-entry.json').read_text())
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,args=['--no-sandbox'])
  for label,width,height in [('desktop',1440,900),('mobile-portrait',390,844)]:
   page=browser.new_page(viewport={'width':width,'height':height});page.on('pageerror',lambda e:r['errors'].append(str(e)))
   page.goto('http://127.0.0.1:8870/HONRO.html',wait_until='domcontentloaded');page.wait_for_function('window.HonroApp',timeout=60000)
   page.evaluate('(v)=>localStorage.setItem("honro-first-act-profile-1",JSON.stringify(v))',fixture['profile']);page.reload(wait_until='domcontentloaded');page.wait_for_function('window.HonroApp',timeout=60000)
   page.get_by_role('button',name='여정 이어가기',exact=True).click();deadline=time.monotonic()+120
   while time.monotonic()<deadline:
    if page.evaluate('HonroApp.engine?.b?.honroStage===6 && HonroApp.canInput()'):break
    next_line=page.locator('[data-action="dialogue-next"]:visible');enter=page.locator('[data-action="journey-enter"]:visible')
    if next_line.count() and next_line.first.is_enabled():next_line.first.click()
    elif page.evaluate('!!HonroApp.dialogue'):page.keyboard.press('Enter')
    elif enter.count():enter.first.click()
    page.wait_for_timeout(300)
   page.wait_for_function('HonroApp.engine?.b?.honroStage===6 && HonroApp.canInput()',timeout=3000);page.wait_for_timeout(800)
   state='''()=>{const a=HonroApp,e=a.engine,b=e.b,u=e.active,s=a.scene,c=s.canvas.getBoundingClientRect(),screen=q=>q?{x:c.width/2+(q.x-s.x)*s.scale,y:c.height/2+(q.y-s.y)*s.scale}:null;const objective=b.units.find(v=>v.id==='objective');return {stage:b.honroStage,phase:b.phase,active:{id:u.id,x:u.x,y:u.y,angle:u.angle,grounded:e.grounded(u),screen:screen(u)},objective:objective&&{id:objective.id,x:objective.x,y:objective.y,screen:screen(objective)},camera:{x:s.x,y:s.y,scale:s.scale,manual:s.manual},canvas:{width:c.width,height:c.height},projectiles:b.projectiles.length,canInput:a.canInput()};}'''
   row={'label':label,'entry':page.evaluate(state)};page.screenshot(path=str(out/(label+'-entry.png')))
   row['deer']=page.evaluate('''()=>{const e=HonroApp.engine,b=e.b;return b.units.filter(u=>u.id==='foe-6'||u.id==='foe-6-cluster').map(u=>{const c=e.contactSurface(u.x,u.y-4,u.y+5),s=e.surface(u.x,u.y-3,u.y+3);return {id:u.id,name:u.name,x:u.x,y:u.y,grounded:e.grounded(u),contact:c?.t?.id||null,surface:s?.t?.id||null,gravity:u.gravity,flight:u.flying,traits:u.traits};});}''')
   page.keyboard.down('ArrowRight');page.wait_for_timeout(350);page.keyboard.up('ArrowRight');page.wait_for_timeout(250);row['moved']=page.evaluate(state);assert row['moved']['active']['x']>row['entry']['active']['x']+1,row
   page.wait_for_function('HonroApp.canInput()',timeout=10000);page.keyboard.down('ArrowUp');page.wait_for_timeout(400);page.keyboard.up('ArrowUp');row['aimed']=page.evaluate(state);page.screenshot(path=str(out/(label+'-aim.png')))
   page.keyboard.down('Space');page.wait_for_timeout(450);page.keyboard.up('Space');page.wait_for_function('HonroApp.engine.b.projectiles.length>0',timeout=5000);row['inFlight']=page.evaluate(state);page.screenshot(path=str(out/(label+'-projectile.png')));assert row['inFlight']['projectiles']>0,row
   row['documentWidth']=page.evaluate('document.documentElement.scrollWidth');r['views'].append(row);page.close()
  browser.close()
except Exception:r['error']=traceback.format_exc()
finally:(out/'result.json').write_text(json.dumps(r,ensure_ascii=False,indent=2));print(json.dumps(r,ensure_ascii=False),flush=True)
if r.get('error') or r['errors']:raise SystemExit(1)
