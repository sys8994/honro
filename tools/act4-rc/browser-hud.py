import json,pathlib,os
from playwright.sync_api import sync_playwright
root=pathlib.Path(__file__).resolve().parents[2];fixture=json.loads((root/'tests/fixtures/act4-rc/support-entry-fixture.json').read_text())['profile'];out=root/'_local/act4-rc/hud';out.mkdir(parents=True,exist_ok=True)
with sync_playwright() as w:
 b=w.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox']);rows=[]
 for n in (7,33,39):
  for width,height in ((1440,900),(375,812),(844,390)):
   p=b.new_page(viewport={'width':width,'height':height});errors=[];p.on('pageerror',lambda e:errors.append(str(e)));p.goto(os.environ.get('HONRO_QA_URL','http://127.0.0.1:8772')+'/HONRO.html');p.wait_for_function('window.HonroApp && window.HonroCampaignLoader');q=json.loads(json.dumps(fixture));q['cleared']={str(i):{'visits':1,'rounds':5,'stars':1,'shots':0} for i in range(1,n)};q['lastStage']=n;q['mapNode']=n;q.pop('honroBattle',None);p.evaluate('(v)=>localStorage.setItem("honro-first-act-profile-1",JSON.stringify(v))',q);p.reload();p.wait_for_function('window.HonroApp && window.HonroAct4PilotCombat');p.evaluate('''async n=>{await HonroCampaignLoader.ensureStage(n);HonroApp.launch(n)}''',n);p.wait_for_function('(n)=>HonroApp.engine?.b?.honroStage===n',arg=n,timeout=60000)
   for _ in range(30):
    if not p.evaluate('!!HonroApp.dialogue'):p.wait_for_timeout(1200);break
    p.keyboard.press('Enter');p.wait_for_timeout(350)
   if n in (33,39):p.wait_for_selector('#act4-water-hud',timeout=20000)
   data=p.evaluate('''()=>{let rect=s=>{let e=document.querySelector(s);if(!e)return null;let r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,text:e.textContent,visible:getComputedStyle(e).visibility!=='hidden'}};return {hud:rect('#act4-water-hud'),title:rect('.battle-title-row'),heading:rect('.battle-stage-heading'),minimap:rect('#minimap-dock'),roster:rect('#allied-roster')}}''')
   def intersects(a,z):return bool(a and z and a['x']<z['x']+z['w'] and z['x']<a['x']+a['w'] and a['y']<z['y']+z['h'] and z['y']<a['y']+a['h'])
   h=data['hud'];assert data['title'] and data['heading'] and data['minimap'] and not errors,(n,width,errors,data)
   if n in (33,39):
    assert h and h['visible'] and h['w']>0 and h['h']>0 and 0<=h['x'] and h['x']+h['w']<=width and not intersects(h,data['minimap']) and not intersects(h,data['heading']) and not intersects(h,data['roster']),(n,width,data)
   else:assert h is None,(n,width,data)
   p.screenshot(path=str(out/f'{n}-{width}x{height}.png'));rows.append({'stage':n,'width':width,'height':height,'data':data,'errors':errors});print(n,width,height,'ok',h['text'] if h else 'no tide',flush=True);p.close()
 b.close();(out/'results.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2))
