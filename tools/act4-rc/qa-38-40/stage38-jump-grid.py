#!/usr/bin/env python3
"""Isolated diagnostic only: clone a real checkpoint and vary start/equipment.

This intentionally edits the diagnostic clone's actor coordinates, velocity,
movement budget and equipment. Never run it in an original gameplay context;
its trials cannot count as normal gameplay or victory evidence.
"""
import argparse, hashlib, json, time
from pathlib import Path
from playwright.sync_api import sync_playwright

p=argparse.ArgumentParser();p.add_argument('--url',required=True);p.add_argument('--profile',required=True);p.add_argument('--sha256',required=True);p.add_argument('--out',required=True);p.add_argument('--hold-ms',type=int,default=600,choices=(600,900,1300,1700));p.add_argument('--second-jump-ms',type=int,default=0,choices=(0,600,900,1300));a=p.parse_args()
raw=Path(a.profile).read_bytes();assert hashlib.sha256(raw).hexdigest()==a.sha256
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox']);ctx=browser.new_context(viewport={'width':1440,'height':900});page=ctx.new_page()
 page.goto(a.url,wait_until='domcontentloaded');page.wait_for_function('window.HonroApp&&window.HonroCampaignLoader',timeout=60000)
 page.locator('#file-import').set_input_files(str(Path(a.profile).resolve()));page.wait_for_timeout(5000)
 continuing=page.evaluate('()=>!!HonroApp.profile?.honroBattle')
 page.get_by_text('이어서 걷기' if continuing else '여정 이어가기',exact=True).click()
 page.wait_for_function("HonroApp.screen==='rest'||HonroApp.engine?.b?.honroStage===38",timeout=60000)
 if page.evaluate("HonroApp.screen==='rest'"):
  page.get_by_text('여정첩',exact=True).click();page.locator('[data-action=journey-select][data-id="38"]').click();page.wait_for_timeout(500);page.locator('[data-action=journey-travel][data-id="38"]').click()
 page.wait_for_function('HonroApp.engine?.b?.honroStage===38',timeout=60000);page.wait_for_timeout(1500)
 if page.evaluate('!!HonroApp.dialogue'):page.keyboard.press('Enter');page.wait_for_timeout(2000)
 print(json.dumps({'runtimeFoothold':page.evaluate("()=>({terrain:HonroApp.engine.b.terrain.some(t=>t.id==='qa38-east-foothold'),art:HonroApp.engine.b.honroElements.some(t=>t.id==='qa38-east-foothold-art')})")}),flush=True)
 result=[]
 for equipped in (True,False):
  for start in (4740,4780,4820):
   setup=page.evaluate('''({start,equipped})=>{let e=HonroApp.engine,u=e.unit('archer');if(e.active!==u)throw Error('archer not active');let floor=e.surface(start,2450,2700);if(!floor)throw Error('no original floor');u.x=start;u.y=floor.y;u.vx=0;u.vy=0;u.jumping=false;u.airborne=false;u.moveLeft=u.maxMove;delete u.platformDrop;u.equipmentIds=equipped?['itm_se_05','itm_co_11']:['itm_se_05'];window.__grid={frames:[],running:true};let t0=performance.now();function f(t){if(!window.__grid.running)return;let a=e.unit('archer'),g=e.grounded(a);if(window.__grid.frames.length<240)window.__grid.frames.push({ms:Math.round(t-t0),x:a.x,y:a.y,vy:a.vy,jumping:!!a.jumping,grounded:g});if(t-t0<6500)requestAnimationFrame(f);else window.__grid.running=false;}requestAnimationFrame(f);return {x:u.x,y:u.y,grounded:e.grounded(u),equipment:u.equipmentIds,surface:floor};}''',{'start':start,'equipped':equipped})
   assert setup['grounded'],setup
   # Actual simultaneous keyboard input, not an assigned trajectory or velocity.
   page.keyboard.down('Control');page.keyboard.down('ArrowRight');page.keyboard.up('Control');page.wait_for_timeout(a.hold_ms);page.keyboard.up('ArrowRight')
   try:
    # A real story dialogue pauses physics; close visible rows by ordinary UI
    # input in this diagnostic clone, then wait for actual landing.
    deadline=time.monotonic()+30
    while time.monotonic()<deadline:
     status=page.evaluate("()=>({dialogue:!!HonroApp.dialogue,ready:HonroApp.engine?.active?.id==='archer'&&HonroApp.engine.grounded(HonroApp.engine.active)&&HonroApp.canInput()})")
     if status['ready']:break
     if status['dialogue']:
      page.wait_for_timeout(700);page.locator('[data-action=dialogue-next]').click(timeout=10000)
     else:page.wait_for_timeout(300)
    else:raise TimeoutError('landing/input readiness exceeded 30 seconds')
   except Exception:
    state=page.evaluate("()=>{let a=HonroApp,e=a.engine,u=e.unit('archer');return {active:e.active?.id,x:u.x,y:u.y,vy:u.vy,jumping:u.jumping,grounded:e.grounded(u),can:a.canInput(),phase:e.b.phase,dialogue:!!a.dialogue,frames:window.__grid.frames}}")
    Path(a.out).write_text(json.dumps({'scope':'diagnostic clone only; timeout','inputSha256':a.sha256,'holdMs':a.hold_ms,'start':setup,'state':state},ensure_ascii=False,indent=2)+'\n');page.screenshot(path=str(Path(a.out).with_suffix('.png')));raise
   page.wait_for_timeout(1000)
   if equipped and start==4740:page.screenshot(path=str(Path(a.out).with_suffix('.png')))
   trace=page.evaluate('''()=>{window.__grid.running=false;let e=HonroApp.engine,u=e.unit('archer');return {frames:window.__grid.frames,final:{x:u.x,y:u.y,grounded:e.grounded(u),jumping:!!u.jumping,equipment:u.equipmentIds}}}''')
   frames=trace['frames'];second=None
   if equipped and a.second_jump_ms:
    page.keyboard.down('Control');page.keyboard.down('ArrowRight');page.keyboard.up('Control');page.wait_for_timeout(a.second_jump_ms);page.keyboard.up('ArrowRight')
    deadline=time.monotonic()+30
    while time.monotonic()<deadline:
     st=page.evaluate("()=>({dialogue:!!HonroApp.dialogue,ready:HonroApp.engine?.active?.id==='archer'&&HonroApp.engine.grounded(HonroApp.engine.active)&&HonroApp.canInput()})")
     if st['ready']:break
     if st['dialogue']:page.wait_for_timeout(700);page.locator('[data-action=dialogue-next]').click(timeout=10000)
     else:page.wait_for_timeout(300)
    else:raise TimeoutError('second jump landing exceeded 30 seconds')
    second=page.evaluate("()=>{const e=HonroApp.engine,u=e.unit('archer');return {x:u.x,y:u.y,grounded:e.grounded(u),equipment:u.equipmentIds}}")
   result.append({'start':setup,'frames':frames,'final':trace['final'],'minY':min(f['y'] for f in frames),'maxX':max(f['x'] for f in frames),'jumpObserved':any(f['jumping'] or not f['grounded'] for f in frames),'secondJump':second})
   print(json.dumps({'equipped':equipped,'start':start,'minY':result[-1]['minY'],'maxX':result[-1]['maxX'],'final':trace['final'],'jumpObserved':result[-1]['jumpObserved'],'secondJump':second},ensure_ascii=False),flush=True)
 Path(a.out).write_text(json.dumps({'scope':'isolated diagnostic clone only; positions, movement budget and equipment intentionally reset in clone; not normal play','inputSha256':a.sha256,'holdMs':a.hold_ms,'secondJumpMs':a.second_jump_ms,'trials':result},ensure_ascii=False,indent=2)+'\n')
 ctx.close();browser.close()
