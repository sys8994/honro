"""UI camera samples in the isolated release preview; not visual approval."""
import json,os,pathlib
from playwright.sync_api import sync_playwright
root=pathlib.Path(__file__).resolve().parents[2];out=root/'_local/act4-rc/terrain-camera-v3';out.mkdir(parents=True,exist_ok=True)
fixture=json.loads((root/'tests/fixtures/act4-rc/support-entry-fixture.json').read_text())['profile'];rows=[]
url=os.environ.get('HONRO_QA_URL','http://127.0.0.1:8898')+'/HONRO.html'
with sync_playwright() as w:
 browser=w.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 for n in [int(v) for v in os.environ.get('HONRO_STAGES','31,32,33,34,35,36,37,38,39,40').split(',')]:
  p=browser.new_page(viewport={'width':1440,'height':900});errors=[];p.on('pageerror',lambda e:errors.append(str(e)))
  try:
   p.goto(url,wait_until='domcontentloaded');p.wait_for_function('window.HonroApp && window.HonroCampaignLoader');q=json.loads(json.dumps(fixture));q['cleared']={str(i):{'visits':1,'rounds':5,'stars':1,'shots':0} for i in range(1,n)};q['lastStage']=n;q['mapNode']=n;q.pop('honroBattle',None);p.evaluate('(v)=>localStorage.setItem("honro-first-act-profile-1",JSON.stringify(v))',q);p.reload(wait_until='domcontentloaded');p.wait_for_function('window.HonroApp && window.HonroCampaignLoader && window.HonroAct4PilotCombat && window.HONRO_ACT4_PILOT_COMBAT_REFERENCE');p.evaluate('''async n=>{await HonroCampaignLoader.ensureStage(n);HonroApp.launch(n)}''',n);p.wait_for_function('(n)=>HonroApp.engine?.b?.honroStage===n',arg=n,timeout=60000);p.wait_for_timeout(1500)
   stable=0
   for _ in range(100):
    q=p.evaluate("""()=>({dialogue:!!HonroApp.dialogue,tour:!!HonroApp.engine.b.honroAct4PreviewState?.arrivalTour?.active})""")
    if q['dialogue']:p.keyboard.press('Enter');stable=0
    elif q['tour']:stable=0
    else:stable+=1
    if stable>=4:break
    p.wait_for_timeout(500)
   if stable<4:raise RuntimeError('Entry dialogue or arrival tour remained active after bounded wait')
   def capture(label):
    o=p.evaluate('''()=>{const a=HonroApp,s=a.scene,r=s.canvas.getBoundingClientRect(),b=a.engine.b;return {x:s.x,y:s.y,scale:s.scale,min:HonroBounds.zoomLimits(r.width).min,width:r.width,height:r.height,worldWidth:b.worldW||b.width,worldHeight:b.worldH||b.height,left:s.x-r.width/(2*s.scale),right:s.x+r.width/(2*s.scale),dialogue:!!a.dialogue}}''');o['view']=label
    if o['dialogue']:raise RuntimeError('Dialogue opened during camera capture: '+label)
    if label.startswith('min-') and abs(o['scale']-o['min'])>.02:raise RuntimeError('Wheel did not reach actual minimum zoom: '+str(o))
    p.screenshot(path=str(out/f'stage{n}-{label}.png'));return o
   views=[capture('normal')]
   for label in ('min-left','min-right'):
    for attempt in range(4):
     # Natural dialogs may start during a pan; dismiss with normal input and
     # then repeat navigation instead of claiming the interrupted view.
     for _ in range(24):
      if not p.evaluate('!!HonroApp.dialogue'):break
      p.keyboard.press('Enter');p.wait_for_timeout(400)
     p.mouse.move(700,400);p.mouse.wheel(0,2200);p.wait_for_timeout(600)
     for _ in range(4):
      p.mouse.move(700,400);p.mouse.down();p.mouse.move(1300 if label=='min-left' else 100,400,steps=8);p.mouse.up();p.wait_for_timeout(100)
     p.wait_for_timeout(400)
     if p.evaluate('!!HonroApp.dialogue'):continue
     o=p.evaluate("""()=>{const s=HonroApp.scene,r=s.canvas.getBoundingClientRect(),b=HonroApp.engine.b;return {scale:s.scale,min:HonroBounds.zoomLimits(r.width).min,left:s.x-r.width/(2*s.scale),right:s.x+r.width/(2*s.scale),width:b.worldW||b.width}}""")
     if abs(o['scale']-o['min'])<=.02 and (o['left']<=0 if label=='min-left' else o['right']>=o['width']):
      views.append(capture(label));break
    else:raise RuntimeError('Camera/dialogue prevented requested view: '+label)
   rows.append({'stage':n,'views':views,'errors':errors});print(n,json.dumps(views),errors,flush=True)
  except Exception as e:rows.append({'stage':n,'error':str(e),'errors':errors});print(n,'FAILED',str(e),flush=True)
  finally:p.close();(out/'results.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2))
 browser.close()
if len(rows)!=len([v for v in os.environ.get('HONRO_STAGES','31,32,33,34,35,36,37,38,39,40').split(',')]) or any(v.get('error') or v.get('errors') for v in rows):raise SystemExit('Camera input audit incomplete; inspect results')
