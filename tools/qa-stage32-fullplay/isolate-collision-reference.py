import json
from pathlib import Path
from playwright.sync_api import sync_playwright
raw=Path('/workspace/honro/_local/reports/stage32-browser-fullplay/stage32-round14-trap.json').read_text()
with sync_playwright() as w:
 b=w.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 for remove in ('none','approved32-upper-west-foundation','approved32-west-face'):
  p=b.new_page(viewport={'width':1440,'height':900});p.goto('http://127.0.0.1:8767/HONRO.html');p.wait_for_function('window.HonroApp');p.evaluate('(v)=>localStorage.setItem("honro-first-act-profile-1",v)',raw);p.reload();p.wait_for_function('window.HonroApp');p.get_by_text('이어서 걷기',exact=True).click();p.wait_for_function('HonroApp.engine?.b?.honroStage===32');p.wait_for_timeout(1800)
  if remove!='none':p.evaluate('''id=>{let e=HonroApp.engine,b=e.b;b.terrain=b.terrain.filter(t=>t.id!==id);b.sceneVersion++;e.invalidateTerrainCollisionIndex?.()}''',remove)
  def s():return p.evaluate('''()=>{const e=HonroApp.engine,u=e.active;return {id:u.id,x:u.x,y:u.y,hp:u.hp,grounded:e.grounded(u),surface:e.contactSurface(u.x,u.y-4,u.y+5)?.t?.id}}''')
  print(remove,'start',s(),flush=True)
  for i in range(3):
   p.keyboard.press('Control');p.wait_for_timeout(50);p.keyboard.down('ArrowRight');p.wait_for_timeout(130);p.keyboard.up('ArrowRight');p.wait_for_timeout(1500)
  print(remove,'climb',s(),flush=True);p.keyboard.down('ArrowRight');p.wait_for_timeout(1200);p.keyboard.up('ArrowRight');p.wait_for_timeout(1000);print(remove,'walk',s(),flush=True);p.close()
 b.close()
