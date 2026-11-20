import json,sys,hashlib,subprocess,time
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path.cwd(); tag=sys.argv[1]; out=ROOT/'_local/reports/stage3-source'/tag;out.mkdir(parents=True,exist_ok=True)
server=subprocess.Popen([sys.executable,'-m','http.server','8765','--bind','127.0.0.1'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
rows=[];errors=[]
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,args=['--no-sandbox'])
  for sid,w,h,x,y,z,label in [(3,1440,900,0,1517.505,.35,'west'),(3,1440,900,2865.01,1517.505,0.2094233527980705,'overview')]:
   page=browser.new_page(viewport={'width':w,'height':h},device_scale_factor=1)
   page.add_init_script("let seed=3910;Math.random=()=>((seed=(seed*1664525+1013904223)>>>0)/2**32);window.__qaImages=[];const d=Object.getOwnPropertyDescriptor(HTMLImageElement.prototype,'src');Object.defineProperty(HTMLImageElement.prototype,'src',{...d,set(v){window.__qaImages.push(this);d.set.call(this,v)}});")
   page.on('pageerror',lambda e:errors.append(str(e)))
   page.goto('http://127.0.0.1:8765/HONRO.html',wait_until='domcontentloaded',timeout=180000)
   page.wait_for_function("document.documentElement.dataset.honroReady==='true' && window.HonroCampaignLoader && window.HonroAct4TerrainPreview",timeout=180000)
   page.evaluate('''async sid=>{const a=HonroApp;a.frame=()=>{};a.profile.settings.music=false;a.profile.settings.sound=false;
     await HonroCampaignLoader.ensureStage(sid);for(let n=1;n<sid;n++)a.profile.cleared[n]=true;
     for(const hero of Object.values(a.profile.heroes))hero.xp=HonroProgression.xpAt(HonroProgression.plan(sid).entryLevel);
     a.launch(sid);if(a.engine?.b.honroStage!==sid)throw Error('Campaign launch did not reach '+sid);for(let n=0;n<40&&a.dialogue;n++)HonroStory.finish(a);if(a.dialogue)throw Error('Entry dialogue not closed');a.close();HonroStoryFraming.clear(a.scene);}''',sid)
   page.wait_for_timeout(1500)
   page.evaluate("()=>{const a=HonroApp;HonroStory.tick(a,performance.now());HonroStory.draw(a);if(document.getElementById('turn-banner')?.hidden===false)throw Error('Turn banner remains');}")
   actual_height=page.locator('#battlecanvas').evaluate('(c)=>c.clientHeight')
   if actual_height!=h:
    page.set_viewport_size({'width':w,'height':h+(h-actual_height)})
    page.wait_for_timeout(100)
   result=page.evaluate('''q=>{const a=HonroApp,s=a.scene,b=a.engine.b;HonroStoryFraming.clear(s);Object.assign(s,{manual:true,time:2,storyTween:null,storyFrozen:false,goalFocus:null,cinematic:null,focusUntil:0,speakerUntil:0,x:q.x,y:q.y,scale:q.z});
     const st=HONRO_PROJECT.stages.find(t=>t.metadata?.stageId===q.sid);const physics=JSON.stringify({terrain:b.terrain,units:b.units,design:st.design,initialState:st.initialState,objectives:st.objectives});
     s.render(a.engine,0,'',.6,false,0);s.render(a.engine,0,'',.6,false,0);
     if(JSON.stringify({terrain:b.terrain,units:b.units,design:st.design,initialState:st.initialState,objectives:st.objectives})!==physics)throw Error('Physics changed during capture');
     return {camera:{x:s.x,y:s.y,scale:s.scale},canvas:[s.canvas.width,s.canvas.height],tide:b.honroAct4PreviewState?.tide,physics,support:b.terrain,units:b.units.map(u=>({id:u.id,x:u.x,y:u.y,grounded:u.grounded})), owner:HONRO_PROJECT.library.find(v=>v.id==='act1-site:3:body')?.params, taperPresent:JSON.stringify(HONRO_PROJECT.library.find(v=>v.id==='act1-site:3:body')||{}).includes('C-375 684-380 700-393 718C-416 748-451 762-465 823'),projectStage:st.id};}''',{'sid':sid,'x':x,'y':y,'z':z})
   page.wait_for_function("window.__qaImages.every(i=>i.complete)",timeout=120000)
   page.evaluate("()=>{const a=HonroApp; a.scene.time=2;a.scene.render(a.engine,0,'',.6,false,0);a.scene.render(a.engine,0,'',.6,false,0);}")
   page.evaluate("""expected=>{const a=HonroApp,b=a.engine.b,st=HONRO_PROJECT.stages.find(t=>t.metadata?.stageId===a.engine.b.honroStage);if(JSON.stringify({terrain:b.terrain,units:b.units,design:st.design,initialState:st.initialState,objectives:st.objectives})!==expected)throw Error('Physics changed during image decode');}""",result['physics'])
   result['images']=page.evaluate("()=>window.__qaImages.map(i=>({src:i.src,complete:i.complete,width:i.naturalWidth}))")
   assert all(i['width']>0 for i in result['images']),result['images']
   assert result['canvas']==[w,h],result
   result['requestedCamera']={'x':x,'y':y,'scale':z}
   (out/(label+'-physics.json')).write_text(result['physics'])
   physics=result.pop('physics');result['gameplaySha256']=hashlib.sha256(physics.encode()).hexdigest();result['stage']=sid;result['label']=label
   page.locator('#battlecanvas').screenshot(path=str(out/(label+'.png')));rows.append(result);page.close()
  browser.close()
finally:server.terminate();server.wait()
(out/'report.json').write_text(json.dumps({'scope':'Normal HTTP HONRO.html source, stock HonroCampaignLoader.ensureStage + HonroApp.launch, no injected project/art; normal entry dialogue completion, requested exact canvas size via viewport resize, fixed diagnostic camera, not full play','rows':rows,'errors':errors},indent=2))
assert not errors,errors
assert all(r['taperPresent']==True for r in rows if r['stage']==3),rows
print(tag,'HTTP launch capture passed')
