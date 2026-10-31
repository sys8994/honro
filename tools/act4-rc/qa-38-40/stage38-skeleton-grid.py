#!/usr/bin/env python3
"""Physics-only clone diagnostic; never counts as normal play or changes live save.

Imports a real checkpoint through UI, then deliberately adds a temporary solid
and resets archer position/movement in the clone. No NPC/HP/receipt is changed.
"""
import argparse,hashlib,json,time
from pathlib import Path
from playwright.sync_api import sync_playwright
p=argparse.ArgumentParser();p.add_argument('--url',required=True);p.add_argument('--profile',required=True);p.add_argument('--sha256',required=True);p.add_argument('--out',required=True);p.add_argument('--first',type=int,default=600);p.add_argument('--second',type=int,default=900);a=p.parse_args()
raw=Path(a.profile).read_bytes();assert hashlib.sha256(raw).hexdigest()==a.sha256
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox']);ctx=browser.new_context(viewport={'width':1440,'height':900});page=ctx.new_page();page.goto(a.url,wait_until='domcontentloaded');page.wait_for_function('window.HonroApp&&window.HonroCampaignLoader',timeout=60000)
 page.locator('#file-import').set_input_files(str(Path(a.profile).resolve()));page.wait_for_timeout(5000);page.get_by_text('이어서 걷기',exact=True).click();page.wait_for_function('HonroApp.engine?.b?.honroStage===38',timeout=60000);page.wait_for_timeout(1500)
 print(json.dumps(page.evaluate('''()=>{let e=HonroApp.engine;const p=[{x:4755,y:2659},{x:4755,y:2585},{x:4770,y:2555},{x:4830,y:2555},{x:4845,y:2585},{x:4845,y:2661}];let t={id:'qa38-skeleton-only',x:4755,y:2555,w:90,h:106,vertices:p,mat:'rock',hp:99999,maxHp:99999,route:true,indestructible:true,oneWay:false,surfaceKind:'rock',artSeed:1,honroWalkEdges:[1,2,3]};e.b.terrain.push(t);return {temporaryTerrain:t,originalTerrainCount:e.b.terrain.length-1,scope:'CLONE ONLY'} }''')),flush=True)
 def wait_ready():
  end=time.monotonic()+30
  while time.monotonic()<end:
   v=page.evaluate("()=>({dialogue:!!HonroApp.dialogue,ready:HonroApp.engine?.active?.id==='archer'&&HonroApp.engine.grounded(HonroApp.engine.active)&&HonroApp.canInput()})")
   if v['ready']:return
   if v['dialogue']:page.wait_for_timeout(700);page.locator('[data-action=dialogue-next]').click(timeout=10000)
   else:page.wait_for_timeout(300)
  raise TimeoutError('cannot reach grounded input state')
 def jump(ms):
  page.evaluate('''()=>{let e=HonroApp.engine;window.__samples=[];let end=performance.now()+5000;function f(t){let u=e.unit('archer');if(window.__samples.length<300)window.__samples.push({x:u.x,y:u.y,vy:u.vy,grounded:e.grounded(u),jumping:!!u.jumping});if(t<end)requestAnimationFrame(f)}requestAnimationFrame(f)}''')
  page.keyboard.down('Control');page.keyboard.down('ArrowRight');page.keyboard.up('Control');page.wait_for_timeout(ms);page.keyboard.up('ArrowRight');wait_ready()
  return page.evaluate('''()=>{let e=HonroApp.engine,u=e.unit('archer');return {x:u.x,y:u.y,grounded:e.grounded(u),equipment:u.equipmentIds,frames:window.__samples}}''')
 results=[]
 for x in (4600,4640,4680,4720,4740):
  start=page.evaluate('''x=>{let e=HonroApp.engine,u=e.unit('archer'),v=e.surface(x,2600,2700);if(!v)throw Error('missing initial support');u.x=x;u.y=v.y;u.vx=0;u.vy=0;u.jumping=false;u.airborne=false;u.moveLeft=u.maxMove;delete u.platformDrop;return{x:u.x,y:u.y,grounded:e.grounded(u),equipment:u.equipmentIds}}''',x);assert start['grounded'] and start['equipment']==['itm_se_05','itm_co_11'],start
  one=jump(a.first);two=jump(a.second);row={'start':start,'first':one,'second':two};results.append(row)
  print(json.dumps({'start':start,'first':{k:v for k,v in one.items() if k!='frames'},'second':{k:v for k,v in two.items() if k!='frames'}},ensure_ascii=False),flush=True)
 Path(a.out).write_text(json.dumps({'scope':'diagnostic clone only; temporary collision and actor resets','inputSha256':a.sha256,'firstHoldMs':a.first,'secondHoldMs':a.second,'results':results},ensure_ascii=False,indent=2)+'\n');ctx.close();browser.close()
