import json,sys,hashlib,subprocess,time
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path.cwd(); tag=sys.argv[1]; out=ROOT/'_local/reports/stage41-closure-built'/tag;out.mkdir(parents=True,exist_ok=True)
server=subprocess.Popen([sys.executable,'-m','http.server','8765','--bind','127.0.0.1'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
rows=[];errors=[]
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,args=['--no-sandbox'])
  for sid,w,h,x,y,z,label in [(41,390,844,250,2564,.55,'stage41-closure')]:
   page=browser.new_page(viewport={'width':w,'height':h},device_scale_factor=1)
   page.on('pageerror',lambda e:errors.append(str(e)))
   page.goto('http://127.0.0.1:8765/HONRO.html',wait_until='domcontentloaded',timeout=180000)
   page.wait_for_function("document.documentElement.dataset.honroReady==='true' && window.HonroCampaignLoader && window.HonroAct4TerrainPreview",timeout=180000)
   page.evaluate('''async sid=>{const a=HonroApp;a.frame=()=>{};a.profile.settings.music=false;a.profile.settings.sound=false;
     await HonroCampaignLoader.ensureStage(sid);for(let n=1;n<sid;n++)a.profile.cleared[n]=true;
     for(const hero of Object.values(a.profile.heroes))hero.xp=HonroProgression.xpAt(HonroProgression.plan(sid).entryLevel);
     a.launch(sid);if(a.engine?.b.honroStage!==sid)throw Error('Campaign launch did not reach '+sid);for(let n=0;n<40&&a.dialogue;n++)HonroStory.finish(a);if(a.dialogue)throw Error('Entry dialogue not closed');a.turnNotice=null;a.close();HonroStoryFraming.clear(a.scene);}''',sid)
   page.wait_for_timeout(250)
   actual_height=page.locator('#battlecanvas').evaluate('(c)=>c.clientHeight')
   if actual_height!=h:
    page.set_viewport_size({'width':w,'height':h+(h-actual_height)})
    page.wait_for_timeout(100)
   result=page.evaluate('''q=>{const a=HonroApp,s=a.scene,b=a.engine.b;HonroStoryFraming.clear(s);Object.assign(s,{manual:true,time:2,storyTween:null,storyFrozen:false,goalFocus:null,cinematic:null,focusUntil:0,speakerUntil:0,x:q.x,y:q.y,scale:q.z});
     const st=HONRO_PROJECT.stages.find(t=>t.metadata?.stageId===q.sid);const physics=JSON.stringify({terrain:b.terrain,units:b.units,design:st.design,initialState:st.initialState,objectives:st.objectives});
     s.render(a.engine,0,'',.6,false,0);s.render(a.engine,0,'',.6,false,0);
     if(JSON.stringify({terrain:b.terrain,units:b.units,design:st.design,initialState:st.initialState,objectives:st.objectives})!==physics)throw Error('Physics changed during capture');
     return {camera:{x:s.x,y:s.y,scale:s.scale},canvas:[s.canvas.width,s.canvas.height],tide:b.honroAct4PreviewState?.tide,physics,stageSource:JSON.stringify(st),readability:HonroTerrainReadability.prepare(b).groups.map(g=>({id:g.id,segments:g.segments})),contacts:st.elements.filter(e=>e.assetId.includes('west-contact-plane')).map(e=>e.assetId),projectStage:st.id};}''',{'sid':sid,'x':x,'y':y,'z':z})
   assert result['canvas']==[w,h],result
   assert abs(result['camera']['x']-x)<1e-8 and abs(result['camera']['y']-y)<1e-8 and abs(result['camera']['scale']-z)<1e-8,result
   source=result.pop('stageSource');result['stageSourceSha256']=hashlib.sha256(source.encode()).hexdigest()
   physics=result.pop('physics');result['gameplaySha256']=hashlib.sha256(physics.encode()).hexdigest();result['stage']=sid;result['label']=label
   page.locator('#battlecanvas').screenshot(path=str(out/(label+'.png')));rows.append(result);page.close()
  browser.close()
finally:server.terminate();server.wait()
(out/'report.json').write_text(json.dumps({'scope':'Normal HTTP HONRO.html source, stock HonroCampaignLoader.ensureStage + HonroApp.launch, no injected project/art; normal entry dialogue completion, official tide initialization, requested exact canvas size via viewport resize, fixed diagnostic camera, not full play','rows':rows,'errors':errors},indent=2))
assert not errors,errors
assert rows[0]['stage']==41
print(tag,'HTTP launch capture passed')
