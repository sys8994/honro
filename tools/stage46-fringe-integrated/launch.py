import hashlib,json,os
from pathlib import Path
from playwright.sync_api import sync_playwright
out=Path(os.environ["OUT"])
rows=[]
scenes=[(46,390,1000,100,3200,.55,'west-portrait'),(46,1440,900,100,3200,.55,'west-desktop'),(46,390,844,2048,4800,390/6800,'overview-portrait'),(42,390,844,2700,1200,.32,'stage42-control')]
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True)
 for mode,port in [('original',8884),('candidate',8885)]:
  for sid,w,h,x,y,z,label in scenes:
   page=browser.new_page(viewport={'width':w,'height':h},device_scale_factor=1)
   err=[];page.on('pageerror', lambda e:err.append(str(e)))
   page.goto(f'http://127.0.0.1:{port}/HONRO.html',wait_until='domcontentloaded',timeout=180000)
   page.wait_for_function("window.HonroApp && document.documentElement.dataset.honroReady === 'true'",timeout=180000)
   page.evaluate('''async sid=>{await HONRO_APP_READY;const a=HonroApp;a.frame=()=>{};a.profile.settings.music=false;a.profile.settings.sound=false;
     await HonroCampaignLoader.ensureStage(sid);for(let n=1;n<sid;n++)a.profile.cleared[n]=true;
     for(const hero of Object.values(a.profile.heroes))hero.xp=HonroProgression.xpAt(HonroProgression.plan(sid).entryLevel);
     a.launch(sid);if(a.engine?.b.honroStage!==sid)throw Error('Campaign launch did not reach '+sid);for(let n=0;a.dialogue&&n<12;n++)HonroStory.finish(a);
     if(a.dialogue)throw Error('intro still active');
     a.turnNotice=null;a.close();HonroStory.draw(a);HonroStoryFraming.clear(a.scene);}''',sid)
   result=page.evaluate('''q=>{const a=HonroApp,s=a.scene,b=a.engine.b;Object.assign(s,{manual:true,time:2,storyTween:null,storyFrozen:false,goalFocus:null,cinematic:null,focusUntil:0,speakerUntil:0,x:q.x,y:q.y,scale:q.z});
     const st=HONRO_PROJECT.stages.find(t=>t.metadata?.stageId===q.sid);const calc=()=>JSON.stringify({terrain:b.terrain,units:b.units,design:st.design,initialState:st.initialState,objectives:st.objectives});
     const physics=calc();
     s.render(a.engine,0,'',.6,false,0);s.render(a.engine,0,'',.6,false,0);
     if(calc()!==physics)throw Error('Physics changed during capture');
     return {camera:{x:s.x,y:s.y,scale:s.scale},canvas:[s.canvas.width,s.canvas.height],nUnits:b.units.length,physics,projectStage:st.id};}''',{'sid':sid,'x':x,'y':y,'z':z})
   physics=result.pop('physics');result['gameplaySha256']=hashlib.sha256(physics.encode()).hexdigest();result.update(stage=sid,label=label,mode=mode)
   assert not err,err
   page.locator('#battlecanvas').screenshot(path=str(out/f'live-{label}-{mode}.png'));rows.append(result);page.close()
 browser.close()
for x,y in zip(rows[:len(scenes)],rows[len(scenes):],strict=True):
 assert {k:v for k,v in x.items() if k!='mode'}=={k:v for k,v in y.items() if k!='mode'},(x,y)
(out/'launch-proof.json').write_text(json.dumps({'scope':'Normal built HTTP HONRO.html CampaignLoader.ensureStage and App.launch. Fixed diagnostic camera, not normal gameplay duration. Before/after only source runtime differs.','rows':rows},indent=2))
