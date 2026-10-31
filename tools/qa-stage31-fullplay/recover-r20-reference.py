import json,time,sys
from pathlib import Path
from playwright.sync_api import sync_playwright
out=Path('/workspace/honro/_local/reports/stage31-browser-fullplay');raw=(out/'tactical-v5-storage.json').read_text()
with sync_playwright() as w:
 b=w.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox']);p=b.new_page(viewport={'width':1440,'height':900});p.goto('http://127.0.0.1:8766/HONRO.html',wait_until='domcontentloaded');p.wait_for_function('window.HonroApp');p.evaluate('(v)=>localStorage.setItem("honro-first-act-profile-1",v)',raw);p.reload(wait_until='domcontentloaded');p.wait_for_function('window.HonroApp');p.get_by_text('이어서 걷기',exact=True).click();p.wait_for_function('HonroApp.engine?.b?.honroStage===31',timeout=60000);p.wait_for_timeout(1800)
 def state():return p.evaluate('''()=>{let a=HonroApp,e=a.engine,b=e.b,u=e.active,r=a.scene.canvas.getBoundingClientRect(),lo=a.scene.world(0,0),hi=a.scene.world(r.width,r.height);return {round:b.round,side:b.side,phase:b.phase,active:u?.id,x:u?.x,y:u?.y,hp:u?.hp,move:u?.moveLeft,angle:u?.angle,facing:u?.facing,drop:e.canDrop(),grounded:e.grounded(u),support:e.contactSurface(u.x,u.y-4,u.y+5)?.t?.id,scale:a.scene.scale,camera:{x:a.scene.x,y:a.scene.y},bounds:{lo,hi},enemies:b.units.filter(v=>v.side===1&&!v.dead&&v.x>=Math.min(lo.x,hi.x)&&v.x<=Math.max(lo.x,hi.x)&&v.y>=Math.min(lo.y,hi.y)&&v.y-v.h<=Math.max(lo.y,hi.y)).map(v=>({id:v.id,x:v.x,y:v.y,hp:v.hp})),remaining:b.units.filter(v=>v.side===1&&!v.dead).length,shots:b.shots,can:a.canInput(),dialogue:!!a.dialogue}}''')
 def snap(name):p.screenshot(path=str(out/('recovery-'+name+'.png')));print(json.dumps(state(),ensure_ascii=False),flush=True)
 snap('resume')
 for line in sys.stdin:
  try:
   z=line.strip().split();op=z[0]
   if op=='state':pass
   elif op=='wheel':p.mouse.move(float(z[1]),float(z[2]));p.mouse.wheel(0,float(z[3]));p.wait_for_timeout(700)
   elif op=='drag':p.mouse.move(float(z[1]),float(z[2]));p.mouse.down();p.mouse.move(float(z[3]),float(z[4]),steps=20);p.mouse.up();p.wait_for_timeout(700)
   elif op=='click':p.mouse.click(float(z[1]),float(z[2]));p.wait_for_timeout(700)
   elif op=='key':p.keyboard.press(z[1]);p.wait_for_timeout(int(z[2]) if len(z)>2 else 700)
   elif op=='hold':p.keyboard.down(z[1]);p.wait_for_timeout(int(z[2]));p.keyboard.up(z[1]);p.wait_for_timeout(int(z[3]) if len(z)>3 else 700)
   elif op=='wait':p.wait_for_timeout(int(z[1]))
   elif op=='save':p.keyboard.press('Escape');p.wait_for_timeout(300);p.screenshot(path=str(out/'recovery-pause.png'));print('buttons',p.locator('button:visible').all_text_contents(),flush=True)
   elif op=='stop':break
   snap(z[-1] if op=='snap' else 'latest')
  except Exception as e:print('ERROR',repr(e),flush=True)
 b.close()
