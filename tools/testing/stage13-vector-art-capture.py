"""Bounded Stage13 production-camera captures; no battle completion/FPS claim."""
import json,sys,shutil,hashlib,subprocess,os
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT/'tests'))
from story_browser_server import story_base_url
label=sys.argv[1];group=sys.argv[2] if len(sys.argv)>2 else 'preview'
out=ROOT/'_local/reports/stage13-vector-art'/label;out.mkdir(parents=True,exist_ok=True)
views=[('overview',4100,3450,.17,1440,900,'whole'),('entry',1760,3200,.5,1440,900,'detail'),('gate',4820,3800,.45,1440,900,'detail'),('inner',5800,4220,.5,1440,900,'detail'),('mason',2670,3380,.85,1440,900,'detail'),('mobile-gate',4440,3820,.55,390,844,'camera'),('mobile-mason',2450,3340,.5,390,844,'camera'),('max-gate',4450,3850,1.65,1440,900,'camera')]
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox','--disable-dev-shm-usage']);p=b.new_page(viewport={'width':1440,'height':900});errors=[];http=[]
 p.on('pageerror',lambda e:errors.append(str(e)));p.on('response',lambda r:http.append({'url':r.url,'status':r.status})if r.status>=400 else None)
 p.goto(story_base_url()+'/HONRO.html');p.wait_for_function('window.HonroApp',timeout=90000)
 p.evaluate('''async()=>{await HonroCampaignLoader.ensureStage(13);const a=HonroApp;a.frame=()=>{};a.profile=HONRO_CORE.defaults();a.profile.recruited=['archer','mage','knight','occultist'];for(const cls of a.profile.recruited)a.profile.heroes[cls].xp=HonroProgression.budget(13).start;a.profile.settings.music=false;a.profile.settings.sound=false;a.stageId=13;a.stage=HONRO_CONTENT.stages[12];a.dialogue=null;a.mount(HonroMaps.createBattle(HONRO_PROJECT.stages[12],HONRO_PROJECT,a.profile));while(a.dialogue)HonroStory.finish(a);a.close();a.updateHUD(true);}''')
 p.wait_for_function('HonroAuthoredFarArt.ready(13)',timeout=90000)
 p.evaluate('''()=>{const a=HonroApp;Object.getPrototypeOf(a).frame.call(a,a.prev+16.667);while(a.dialogue)HonroStory.finish(a);HonroStory.tick(a,performance.now()+3000);while(a.dialogue)HonroStory.finish(a);a.dialogue=null;}''')
 rows=[]
 for name,x,y,z,w,h,focus in views:
  if group=='preview' and name not in ['overview','entry','gate']:continue
  if group not in ['preview','all'] and group!=focus:continue
  p.set_viewport_size({'width':w,'height':h});p.wait_for_timeout(100)
  p.evaluate('HonroApp.scene.render(HonroApp.engine,0,"",.6,false,0)')
  row=p.evaluate('''v=>{const a=HonroApp,s=a.scene,b=a.engine.b;Object.assign(s,{manual:true,x:v.x,y:v.y,scale:v.z,time:10,storyTween:null,goalFocus:null,cinematic:null,editorView:v.name==='overview',skillPreview:v.name==='overview'});for(let i=0;i<3;i++)s.render(a.engine,0,'',.6,false,0);return{camera:[s.x,s.y,s.scale],viewport:[v.w,v.h],limits:HonroBounds.zoomLimits(v.w),phase:b.phase,objective:HonroAct2.current(b)?.id,far:HonroAuthoredFarArt.frames(s,v.w,v.h,b).map(x=>({key:x.key,alpha:x.alpha})),actors:b.units.filter(u=>u.side===0||u.id==='resident-1').map(u=>({id:u.id,x:u.x,y:u.y,hp:u.hp})),cache:s.renderCacheStats()};}''',dict(name=name,x=x,y=y,z=z,w=w,h=h))
  file=name+'.jpg';p.screenshot(path=str(out/file),type='jpeg',quality=86);assert(out/file).stat().st_size<1_000_000;rows.append({'file':file,'focus':focus,**row});print(str(out/file),flush=True)
 sources=['shared/data/campaign.json','shared/runtime/act2-spatial-art.js','shared/runtime/authored-far-art.js','web/manifest.json'];author=ROOT/'tools/environment/stage13-vector-finish.mjs'
 if author.exists():sources.append(str(author.relative_to(ROOT)))
 report={'sha':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'workingTree':subprocess.check_output(['git','status','--porcelain'],cwd=ROOT,text=True),'scope':'Production Scene with fixed new-stage legal-entry-level battle and camera fixtures. Actors/goal unchanged; not normal route completion, GPU timing or mobile device test.','rows':rows,'sourceHashes':{f:hashlib.sha256((ROOT/f).read_bytes()).hexdigest()for f in sources},'errors':errors,'httpFailures':http}
 (out/'capture.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');b.close();assert not errors;assert not http
