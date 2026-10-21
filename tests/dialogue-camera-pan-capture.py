"""Native compositor frames of the cliff establishing-shot → reverse-shot pan."""
import json,base64
from playwright.sync_api import sync_playwright
from browser_support import ROOT,launch
OUT=ROOT/'_local/reports/dialogue-camera-motion/pan';OUT.mkdir(parents=True,exist_ok=True)
for old in OUT.glob('*.png'):old.unlink()
with sync_playwright() as p:
 browser=launch(p);rows=[];errors=[]
 for device,size in [('desktop',{'width':1280,'height':800}),('mobile',{'width':390,'height':844})]:
  context=browser.new_context(viewport=size);page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)));page.goto('http://localhost:8014/HONRO.html');page.wait_for_function('window.HonroApp',timeout=120000)
  page.evaluate("""()=>{const a=HonroApp;a.profile=HONRO_TOOLS.fresh();a.profile.cleared[1]={};a.launch(2);}""");page.wait_for_function('HonroApp.engine?.b.honroStage===2&&HonroApp.dialogue');page.evaluate("""()=>{while(HonroApp.dialogue.index<3)HonroStory.next(HonroApp);}""");page.wait_for_timeout(650)
  cdp=context.new_cdp_session(page);native=[]
  def frame(event):
   native.append(event);cdp.send('Page.screencastFrameAck',{'sessionId':event['sessionId']})
  cdp.on('Page.screencastFrame',frame);cdp.send('Page.startScreencast',{'format':'jpeg','quality':72,'everyNthFrame':1});page.wait_for_timeout(120)
  boundary=page.evaluate("""()=>{const s=HonroApp.scene;window.panStart=performance.now();window.panEpoch=Date.now()/1000;window.panTrace=[];function take(t){panTrace.push({elapsed:t-panStart,x:s.x,y:s.y,scale:s.scale});if(t-panStart<800)requestAnimationFrame(take);}requestAnimationFrame(take);const before={x:s.x,y:s.y,scale:s.scale};document.querySelector('[data-action="dialogue-next"]').click();return{before,after:{x:s.x,y:s.y,scale:s.scale},epoch:panEpoch};}""");assert boundary['before']==boundary['after']
  page.wait_for_timeout(900);cdp.send('Page.stopScreencast');trace=page.evaluate('panTrace');frames=[]
  for i,event in enumerate(native):
   elapsed=(event['metadata']['timestamp']-boundary['epoch'])*1000
   name=f'{device}-{i:03}.jpg';(OUT/name).write_bytes(base64.b64decode(event['data']));camera=min(trace,key=lambda r:abs(r['elapsed']-elapsed));frames.append({'image':name,'elapsed':elapsed,'nearestCameraSample':camera})
  assert len(frames)>=5,(device,len(frames));rows.append({'device':device,'boundary':boundary,'frames':frames,'trace':trace});context.close()
 browser.close();assert not errors;(OUT/'frames.json').write_text(json.dumps({'sequences':rows,'errors':errors,'method':'Unedited Chrome compositor screencast frames; epoch timestamps and nearest requestAnimationFrame camera sample.'},ensure_ascii=False,indent=2));print('PASS native desktop/mobile pan frames',sum(len(s['frames'])for s in rows))
