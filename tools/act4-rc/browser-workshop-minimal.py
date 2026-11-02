"""One browser, a 3.7KB validated map, and bounded, observable Playtest startup."""
import json,os,time
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[2];base=os.environ.get('HONRO_QA_BASE','http://127.0.0.1:8774');tag=os.environ.get('HONRO_QA_TAG','current');out=Path('/tmp/honro-workshop-min-'+tag+'.json');trace={'base':base,'steps':[],'console':[],'errors':[],'network':[],'frames':[]}
def log(label,data=None):
 trace['steps'].append({'t':round(time.monotonic(),3),'step':label,'data':data});out.write_text(json.dumps(trace,ensure_ascii=False,indent=2));print(label,json.dumps(data,ensure_ascii=False),flush=True)
with sync_playwright() as w:
 b=w.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox']);p=b.new_page(viewport={'width':1280,'height':800});p.set_default_timeout(10000)
 p.on('console',lambda m:trace['console'].append({'type':m.type,'text':m.text[:400],'location':m.location}));p.on('pageerror',lambda e:trace['errors'].append(str(e)));p.on('crash',lambda:trace['errors'].append('page crashed'));p.on('requestfailed',lambda r:trace['network'].append({'url':r.url,'failure':r.failure}));p.on('response',lambda r:trace['network'].append({'url':r.url,'status':r.status}) if r.status>=400 else None);p.on('framenavigated',lambda f:trace['frames'].append(f.url))
 try:
  p.goto(base+'/HONRO.html',wait_until='domcontentloaded');p.wait_for_function('window.HonroApp');f=json.loads((root/'tests/fixtures/act4-rc/support-entry-fixture.json').read_text())['profile'];p.evaluate('(v)=>localStorage.setItem("honro-first-act-profile-1",JSON.stringify(v))',f);before=p.evaluate("localStorage.getItem('honro-first-act-profile-1')")
  fixture=p.evaluate('''()=>{let s=HonroMaps.emptyStage('qa-small','QA small',2000,1200);s.terrains=[{id:'ground',type:'solid',baseMaterial:'rock',points:[{x:0,y:800},{x:2000,y:800},{x:2000,y:1200},{x:0,y:1200}],breakable:false}];s.units=[HonroUnits.record('archer','p-archer',400,800,'player'),HonroUnits.record('hound','hound',1600,800,'enemy')];s.anchors={start:{x:400,y:800},end:{x:1800,y:800}};let a={id:'qa-art',name:'QA',category:'rock',visual:[{type:'polygon',points:[{x:0,y:0},{x:20,y:0},{x:10,y:20}],fill:'#777',stroke:'#222'}],collision:[],anchor:{x:0,y:0},sockets:[],tags:[],params:{}};a.reference=HonroEnvironment.referenceForLegacyAsset(a);let p={schema:'honro-map',version:6,environmentVersion:HonroEnvironment.VERSION,name:'QA minimal',settings:{autosave:false},activeStageId:s.id,stages:[s],library:[a]};let errors=HonroMaps.validate(HonroMaps.normalize(p)).filter(x=>x.level==='err');if(!errors.length)localStorage.setItem('honro-workshop-v3',JSON.stringify(p));return {errors,size:JSON.stringify(p).length}}''');log('fixture',fixture);assert not fixture['errors'] and fixture['size']<5000
  p.goto(base+'/HONRO_WORKSHOP.html',wait_until='domcontentloaded');p.wait_for_function('window.HonroWorkshopAPI');log('workshop ready',p.evaluate('''()=>({stage:HonroWorkshopAPI.getProject().activeStageId,stages:HonroWorkshopAPI.getProject().stages.length,assets:HonroWorkshopAPI.getProject().library.length})'''))
  p.evaluate('''()=>{window.qaPlayStatus='pending';window.qaPlayError=null;try{Promise.resolve(HonroWorkshopAPI.startPlaytest('start')).then(()=>qaPlayStatus='resolved',e=>{qaPlayStatus='rejected';qaPlayError=String(e?.stack||e)})}catch(e){qaPlayStatus='threw';qaPlayError=String(e?.stack||e)}}''');log('play requested')
  for i in range(20):
   p.wait_for_timeout(1000);state=p.evaluate('''()=>{const f=document.getElementById('runtimeFrame'),w=f?.contentWindow;return {status:qaPlayStatus,error:qaPlayError,iframe:!!f,src:f?.src,document:w?.document?.readyState,app:!!w?.HonroApp,engine:!!w?.HonroApp?.engine,embedded:w?.HONRO_EMBEDDED,screen:w?.HonroApp?.screen,body:w?.document?.body?.innerText?.slice(0,250),toast:document.querySelector('#toast')?.textContent}}''');log('probe-'+str(i),state)
   if state['status']!='pending':break
  assert state['status']=='resolved' and state['engine'] and state['embedded'] is True,state
  frame=p.locator('#runtimeFrame').element_handle().content_frame();p.wait_for_timeout(500);assert p.evaluate("localStorage.getItem('honro-first-act-profile-1')")==before
  for _ in range(8):
   if not frame.evaluate('!!HonroApp.dialogue'):break
   frame.locator('body').press('Enter');p.wait_for_timeout(250)
  action_before=frame.evaluate("()=>({phase:HonroApp.engine.b.phase,side:HonroApp.engine.b.side,actor:HonroApp.engine.b.active})");frame.locator('body').press('f');p.wait_for_timeout(1200);action_after=frame.evaluate("()=>({phase:HonroApp.engine.b.phase,side:HonroApp.engine.b.side,actor:HonroApp.engine.b.active,acted:HonroApp.engine.b.units.find(u=>u.id==='p-archer')?.acted})");log('defend observed',{'before':action_before,'after':action_after});assert action_after['acted'] or action_after['phase']!='aim' or action_after['side']!=0;assert p.evaluate("localStorage.getItem('honro-first-act-profile-1')")==before;p.locator('#stopPlay').click();p.wait_for_timeout(500);assert p.evaluate("localStorage.getItem('honro-first-act-profile-1')")==before;log('PASS owner bytes unchanged after action and stop',{'errors':trace['errors']})
 except Exception as e:
  log('ERROR',repr(e));raise
 finally:
  out.write_text(json.dumps(trace,ensure_ascii=False,indent=2));b.close()
