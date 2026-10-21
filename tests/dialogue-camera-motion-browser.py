"""Real renderer motion/retarget/resize checks, selected scene images, all-row policy list.
Chapter and scene states are inspection fixtures, not campaign completion evidence.
"""
import json, os, subprocess, importlib.util
from pathlib import Path
from playwright.sync_api import sync_playwright
from browser_support import ROOT, launch
spec=importlib.util.spec_from_file_location("framing_catalog",ROOT/"tests/story-framing-browser.py")
catalog=importlib.util.module_from_spec(spec);spec.loader.exec_module(catalog)
CATALOG,PREP=catalog.CATALOG,catalog.PREP

OUT=ROOT/'_local/reports/dialogue-camera-motion';OUT.mkdir(parents=True,exist_ok=True)
TRACE=r'''ms=>{window.cameraTrace=[];const until=performance.now()+ms;function take(t){const s=HonroApp.scene,r=s.storyFrameReport;cameraTrace.push({t,x:s.x,y:s.y,scale:s.scale,id:r?.id,target:r?.targetCamera});if(t<until)requestAnimationFrame(take);}requestAnimationFrame(take);}'''
SNAP=r'''()=>{const a=HonroApp,s=a.scene,r=s.storyFrameReport,{w,h}=s.size();return{index:a.dialogue?.index,text:a.dialogue?.lines[a.dialogue.index]?.[1],framing:r,viewport:{w,h},contained:!!r&&r.boxes.every(p=>{const x=(p.x-s.x)*s.scale+w/2,y=(p.y-s.y)*s.scale+h/2;return x>=r.rect.x-1&&y>=r.rect.y-1&&x+p.w*s.scale<=r.rect.x+r.rect.w+1&&y+p.h*s.scale<=r.rect.y+r.rect.h+1;}),overflow:document.documentElement.scrollWidth>innerWidth};}'''

def run():
 with sync_playwright() as p:
  browser=launch(p);ctx=browser.new_context(viewport={'width':1280,'height':800},has_touch=True);page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto('http://localhost:8014/HONRO.html');page.wait_for_function('window.HonroApp',timeout=120000)
  page.evaluate('''()=>{const p=HONRO_TOOLS.fresh();for(let i=1;i<=30;i++)p.cleared[i]={rounds:5};p.recruited=['archer','mage','knight','occultist'];p.party=p.recruited.slice();window.motionProfile=p;}''')
  profile=page.evaluate("motionProfile")
  def stage(sid):
   page.evaluate("p=>window.motionProfile=p",profile)
   page.evaluate('''id=>{const a=HonroApp;HonroStoryFraming.clear(a.scene);a.dialogue=null;a.engine=null;a.profile=JSON.parse(JSON.stringify(motionProfile));a.launch(id);}''',sid)
   page.wait_for_function('id=>HonroApp.engine?.b.honroStage===id&&HonroApp.dialogue',arg=sid,timeout=120000)
   seq=page.evaluate(CATALOG);page.evaluate('window.framingBase=JSON.parse(JSON.stringify(HonroApp.engine.b))');return seq
  rows=[];traces=[]
  for sid,key,label in [(1,'event-witness','cart'),(2,'entry','cliff'),(3,'entry','moving-arrival'),(10,'cooperationDefense','defense'),(19,'entry','act2'),(28,'entry','act3')]:
   seq=stage(sid);q=next(q for q in seq if q['key']==key)
   for device,size in [('desktop',{'width':1280,'height':800}),('mobile',{'width':390,'height':844})]:
    page.set_viewport_size(size);count=page.evaluate(PREP,q)
    for i in range(min(count,8)):
     page.evaluate(TRACE,600);page.wait_for_timeout(90)
     if i in (0,3):page.screenshot(path=str(OUT/f'{label}-{device}-{i:02}-moving.png'))
     page.wait_for_timeout(610);row=page.evaluate(SNAP);row.update(stage=sid,scene=key,device=device,image=f'{label}-{device}-{i:02}.png')
     page.screenshot(path=str(OUT/row['image']));rows.append(row);traces.append({'scene':label,'device':device,'page':i,'frames':page.evaluate('cameraTrace')})
     if i+1<min(count,8):page.locator('[data-action="dialogue-next"]').click()
   print(label,len([r for r in rows if r['stage']==sid]),'screens',flush=True)
  # Rapid page changes preserve the screen at the exact input boundary.
  seq=stage(2);page.evaluate(PREP,next(q for q in seq if q['key']=='entry'));page.wait_for_timeout(600);page.evaluate(TRACE,900);boundaries=[]
  for action in ['dialogue-next','dialogue-next','dialogue-prev','dialogue-next','dialogue-next']:
   boundary=page.evaluate('''action=>{const s=HonroApp.scene,before={x:s.x,y:s.y,scale:s.scale};document.querySelector(`[data-action="${action}"]`).click();return{action,before,after:{x:s.x,y:s.y,scale:s.scale}};}''',action)
   assert boundary['before']==boundary['after'],boundary;boundaries.append(boundary);page.wait_for_timeout(70)
  page.wait_for_timeout(650);rapid=page.evaluate(SNAP);assert rapid['contained'];traces.append({'scene':'rapid-next-back','boundaries':boundaries,'frames':page.evaluate('cameraTrace')})
  # Reflow retargets from the rendered frame, rather than applying a resize zoom.
  page.set_viewport_size({'width':900,'height':650});page.wait_for_timeout(600);assert page.evaluate(SNAP)['contained']
  page.emulate_media(reduced_motion='reduce');page.locator('[data-action="dialogue-next"]').click();page.wait_for_timeout(70);reduced=page.evaluate(SNAP);assert reduced['framing']['reducedMotion'];assert reduced['framing']['camera']==reduced['framing']['targetCamera'];page.emulate_media(reduced_motion='no-preference')
  saved=page.evaluate('''()=>{HonroStory.save(HonroApp);return{index:HonroApp.dialogue.index,camera:HonroApp.dialogue.lines[HonroApp.dialogue.index][2].camera};}''');page.reload();page.wait_for_function('window.HonroApp',timeout=120000);page.locator('[data-action="continue"]').click();page.wait_for_function('HonroApp.dialogue');page.wait_for_timeout(650);assert page.evaluate('HonroApp.dialogue.index')==saved['index'];assert page.evaluate('HonroApp.dialogue.lines[HonroApp.dialogue.index][2].camera')==saved['camera'];assert page.evaluate(SNAP)['contained']
  page.locator('[data-action="dialogue-skip"]').click();page.wait_for_timeout(550);assert page.evaluate('!HonroApp.dialogue&&!HonroApp.scene.storyFrame&&!HonroApp.scene.storyTween')
  if os.environ.get('HONRO_CAMERA_CATALOG')=='1':
   policies=[]
   for sid in range(1,31):
    for q in stage(sid):
     if q.get('excluded'):policies.append({'stage':sid,'sequence':q['key'],'excluded':q['excluded']});continue
     page.evaluate(PREP,q)
     lines=page.evaluate('''()=>HonroApp.dialogue?.lines.map(([who,text,meta={}],index)=>({index,who,text,camera:meta.camera,effectiveMax:Math.min(meta.camera?.maxScale||1,HonroStoryFraming.scaleLimits[meta.camera?.intent]||.8)}))||[]''')
     assert all(l.get('camera') and l['effectiveMax']<=.82 for l in lines),(sid,q['key']);policies.append({'stage':sid,'sequence':q['key'],'lines':lines})
   (OUT/'policy-catalog.json').write_text(json.dumps(policies,ensure_ascii=False,indent=2))
  failures=[r for r in rows if not r['contained'] or r['overflow'] or r['framing']['missing']]
  result={'source':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'rows':rows,'traces':traces,'failures':failures,'errors':errors,'checks':['native next/back retarget continuity','resize','reduced motion','Continue preserves row metadata','skip releases framing and playback camera'],'limits':['Inspection fixtures and viewport-emulated touch, not physical devices or normal campaign completion.']}
  (OUT/'checks.json').write_text(json.dumps(result,ensure_ascii=False,indent=2));browser.close();print('DONE',len(rows),'failures',len(failures),'errors',errors,flush=True)
  assert not failures and not errors
if __name__=='__main__':run()
