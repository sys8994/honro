"""11장 생산 브라우저 미술/성능 표본. 카메라 fixture이며 완주 증거는 아니다."""
import json,sys,shutil,subprocess,hashlib,os
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'tests'))
from story_browser_server import story_base_url
label=sys.argv[1]; group=sys.argv[2] if len(sys.argv)>2 else 'all'
out=ROOT/'game/docs/stage11-vector-art-20261022/evidence';out.mkdir(parents=True,exist_ok=True)
views=[
 ('overview',8000,7250,.115,1440,900,'focus1'),('west',3200,6650,.18,1440,900,'focus1'),
 ('central',7290,7080,.43,1440,900,'focus2'),('refuge',10350,8470,.5,1440,900,'focus2'),
 ('mobile-trace',11900,7850,.36,390,844,'focus3'),('max-refuge',10050,8680,-1,1440,900,'focus3'),('min-mobile',9000,7800,0,844,390,'focus3'),
 ('final-lower-route',11300,8100,.22,1440,900,'final'),('final-start',1450,6370,.45,1440,900,'final'),('final-east',14600,6100,.28,1440,900,'final')]
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 p=b.new_page(viewport={'width':1440,'height':900});errors=[];http=[]
 p.on('pageerror',lambda e:errors.append(str(e)));p.on('response',lambda r:http.append({'url':r.url,'status':r.status}) if r.status>=400 else None)
 p.goto(story_base_url()+'/HONRO.html');p.wait_for_function('window.HonroApp',timeout=90000)
 p.evaluate('''async()=>{await HonroCampaignLoader.ensureStage(11);const a=HonroApp;a.frame=()=>{};a.profile=HONRO_CORE.defaults();a.profile.recruited=['archer','mage','knight','occultist'];for(const cls of a.profile.recruited)a.profile.heroes[cls].xp=HonroProgression.xpAt(HonroProgression.plan(11).entryLevel);a.profile.settings.music=false;a.profile.settings.sound=false;a.stageId=11;a.stage=HONRO_CONTENT.stages[10];a.dialogue=null;a.mount(HonroMaps.createBattle(HONRO_PROJECT.stages[10],HONRO_PROJECT,a.profile));while(a.dialogue)HonroStory.finish(a);a.close();a.updateHUD(true);}''')
 p.wait_for_function('HonroAuthoredFarArt.ready(11)',timeout=90000)
 p.evaluate('''()=>{const a=HonroApp;Object.getPrototypeOf(a).frame.call(a,a.prev+16.667);while(a.dialogue)HonroStory.finish(a);HonroStory.tick(a,performance.now()+3000);a.dialogue=null;a.turnNotice=null;}''')
 rows=[]
 for name,x,y,z,w,h,g in views:
  if group=='preview' and name not in ['overview','central','mobile-trace','refuge']:continue
  if group not in ['all','preview'] and group!=g:continue
  p.set_viewport_size({'width':w,'height':h})
  p.wait_for_timeout(150)
  p.evaluate('HonroApp.scene.render(HonroApp.engine,0,"",.6,false,0)')
  row=p.evaluate('''v=>{const a=HonroApp,s=a.scene,b=a.engine.b;if(v.name.includes('trace')||v.name.includes('final')){for(const q of HonroAct2.steps(b))if(q.id!=='trace')HonroAct2.memory(b).done[q.id]=true;a.updateHUD(true);}const limits=HonroBounds.zoomLimits(v.w);Object.assign(s,{manual:true,x:v.x,y:v.y,scale:v.z<0?limits.max:v.z||limits.min,storyTween:null,cinematic:null,goalFocus:null,editorView:v.name==='overview',skillPreview:v.name==='overview'});const draw=()=>s.render(a.engine,0,'',.6,false,0),start=performance.now();draw();const coldMs=performance.now()-start;for(let n=0;n<8;n++)draw();const pre=s.renderCacheStats(),times=[];for(let n=0;n<40;n++){const t=performance.now();draw();times.push(performance.now()-t);}const post=s.renderCacheStats();times.sort((a,b)=>a-b);return{camera:[s.x,s.y,s.scale],viewport:[v.w,v.h],limits,coldMs,medianMs:times[20],p95Ms:times[37],cacheBefore:pre,cacheAfter:post,tileCount:s._domainTiles?.tiles?.size||0,phase:b.phase,current:HonroAct2.current(b)?.id};}''',{'name':name,'x':x,'y':y,'z':z,'w':w,'h':h})
  file=f'{label}-{name}.jpg';p.screenshot(path=str(out/file),type='jpeg',quality=84);assert (out/file).stat().st_size<1_000_000
  rows.append({'file':file,'group':g,**row});print(file,flush=True)
 evidence={'label':label,'sha':os.environ.get('HONRO_ART_SOURCE_SHA') or subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'workingTree':subprocess.check_output(['git','status','--porcelain'],cwd=ROOT,text=True),'materialSha256':hashlib.sha256((Path(os.environ.get('HONRO_ART_SOURCE_ROOT',str(ROOT)))/'shared/runtime/stage11-landscape-art.js').read_bytes()).hexdigest(),'scope':'Production Chromium Scene and HUD; frozen normal entry-level battle/camera/progression fixtures, not full combat completion or real mobile hardware. 40 synchronous warm render samples/view; no concurrent load.','rows':rows,'errors':errors,'httpFailures':http}
 (out/f'{label}-{group}.json').write_text(json.dumps(evidence,ensure_ascii=False,indent=2));b.close();assert not errors;assert not http
