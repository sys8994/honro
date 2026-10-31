import json,time,hashlib,os
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[2];out=root/'_local/reports/stage31-browser-fullplay';out.mkdir(parents=True,exist_ok=True);profile=json.loads((root/'tests/fixtures/stage31-browser/support-entry-fixture.json').read_text())['profile'];events=[]
with sync_playwright() as w:
 b=w.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox']);p=b.new_page(viewport={'width':1440,'height':900});p.on('pageerror',lambda e:events.append({'pageerror':str(e)}));p.goto(os.environ.get('HONRO_QA_URL','http://127.0.0.1:8765')+'/HONRO.html');p.wait_for_function('window.HonroApp');p.evaluate('(v)=>localStorage.setItem("honro-first-act-profile-1",JSON.stringify(v))',profile);p.reload();p.wait_for_function('window.HonroApp');p.get_by_text('여정 이어가기',exact=True).click();p.wait_for_timeout(2500);p.get_by_text('스테이지 진입',exact=False).click();p.wait_for_function('HonroApp.engine?.b?.honroStage===31',timeout=60000);p.wait_for_timeout(3000)
 candidate=p.evaluate("async()=>{let c=await (await fetch('/candidate.json')).json(),s=HONRO_PROJECT.stages.find(x=>x.metadata?.stageId===31);return JSON.stringify(s)===JSON.stringify(c.stages.find(x=>x.metadata?.stageId===31))}");assert candidate,'loaded stage differs from candidate'
 def state(): return p.evaluate('''()=>{let a=HonroApp,b=a.engine.b,u=a.engine.active;return {screen:a.screen,round:b.round,phase:b.phase,side:b.side,active:u?.id,x:u?.x,y:u?.y,hp:u?.hp,move:u?.moveLeft,angle:u?.angle,dialogue:!!a.dialogue,modal:a.modal.className,can:a.canInput(),enemies:b.units.filter(v=>v.side===1&&!v.dead).length,shots:b.shots,seed:b.seed,rng:b.rng,boat:b.honroAct4PreviewState?.boat,heros:b.units.filter(v=>v.side===0).map(v=>({id:v.id,x:v.x,y:v.y,hp:v.hp,dead:v.dead}))}}''')
 def record(step):
  row={'step':step,'time':time.time(),'state':state(),'visibleText':p.locator('body').inner_text()[:1100]};events.append(row);print(json.dumps(row,ensure_ascii=False),flush=True)
 record('entry');assert state()['enemies']==34 and state()['round']==1; p.screenshot(path=str(out/'first-run-entry.png'))
 for i in range(12):
  s=state()
  if s['can']: break
  p.keyboard.press('Enter');p.wait_for_timeout(1200);record('enter-'+str(i))
 record('ready');p.screenshot(path=str(out/'first-run-ready.png'))
 if state()['can']:
  p.keyboard.down('ArrowRight');p.wait_for_timeout(1500);p.keyboard.up('ArrowRight');p.wait_for_timeout(500);record('move-right-1.5s');p.screenshot(path=str(out/'first-run-move.png'))
  p.keyboard.press('Control');p.wait_for_timeout(1100);record('jump');
  p.keyboard.down('ArrowUp');p.wait_for_timeout(500);p.keyboard.up('ArrowUp');p.keyboard.down('Space');p.wait_for_timeout(1000);p.keyboard.up('Space');p.wait_for_timeout(5000);record('first-shot');assert state()['shots']==1,'shot not accepted';p.screenshot(path=str(out/'first-run-shot.png'))
 (out/'first-run-inputs.json').write_text(json.dumps(events,ensure_ascii=False,indent=2)+'\n');b.close()
