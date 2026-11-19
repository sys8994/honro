import json,sys,hashlib,subprocess,time
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path.cwd(); tag=sys.argv[1]; out=ROOT/'_local/reports/stage33-integrated'/tag;out.mkdir(parents=True,exist_ok=True)
server=subprocess.Popen([sys.executable,'-m','http.server','8765','--bind','127.0.0.1'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
rows=[];errors=[]
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,args=['--no-sandbox'])
  for sid,w,h,x,y,z,label in [(33,390,844,-320,4848,390/6800,'exact-low'),(33,390,844,-320,2400,390/6800,'west-allowed'),(32,1331,763,1689.6,1900,.6,'control32'),(34,1331,763,6464,4336,1331/6800,'control34')]:
   page=browser.new_page(viewport={'width':w,'height':h},device_scale_factor=1)
   page.on('pageerror',lambda e:errors.append(str(e)))
   page.goto('http://127.0.0.1:8765/HONRO.html',wait_until='domcontentloaded',timeout=180000)
   page.wait_for_function('window.HonroApp && window.HONRO_PROJECT && window.HonroAct4TerrainPreview',timeout=180000)
   page.evaluate('''sid=>{const a=HonroApp;a.frame=()=>{};a.profile.settings.music=false;a.profile.settings.sound=false;
     a.launchMap(HONRO_PROJECT,'stage-'+sid,{story:false});a.dialogue=null;a.turnNotice=null;a.close();}''',sid)
   page.wait_for_timeout(250)
   result=page.evaluate('''q=>{const a=HonroApp,s=a.scene,b=a.engine.b;Object.assign(s,{manual:true,time:2,storyTween:null,goalFocus:null,x:q.x,y:q.y,scale:q.z});
     const st=HONRO_PROJECT.stages.find(t=>t.metadata?.stageId===q.sid);const physics=JSON.stringify({terrain:b.terrain,units:b.units,design:st.design,initialState:st.initialState,objectives:st.objectives});
     s.render(a.engine,0,'',.6,false,0);s.render(a.engine,0,'',.6,false,0);
     if(JSON.stringify({terrain:b.terrain,units:b.units,design:st.design,initialState:st.initialState,objectives:st.objectives})!==physics)throw Error('Physics changed during capture');
     return {camera:{x:s.x,y:s.y,scale:s.scale},canvas:[s.canvas.width,s.canvas.height],tide:b.honroAct4PreviewState?.tide,physics,contacts:st.elements.filter(e=>e.assetId.includes('west-contact-plane')).map(e=>e.assetId),projectStage:st.id};}''',{'sid':sid,'x':x,'y':y,'z':z})
   physics=result.pop('physics');result['gameplaySha256']=hashlib.sha256(physics.encode()).hexdigest();result['stage']=sid;result['label']=label
   page.locator('#battlecanvas').screenshot(path=str(out/(label+'.png')));rows.append(result);page.close()
  browser.close()
finally:server.terminate();server.wait()
(out/'report.json').write_text(json.dumps({'scope':'Normal HTTP HONRO.html source, stock HonroApp.launchMap, no injected project/art; fixed diagnostic camera, not full play','rows':rows,'errors':errors},indent=2))
assert not errors,errors
assert (len(rows[0]['contacts'])==2)==(tag=='integrated'),rows[0]
print(tag,'HTTP launch capture passed')
