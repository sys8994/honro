"""Short integration boundary check; frozen cameras and accelerated scene entry, not a full play."""
import hashlib, importlib.util, json, subprocess, sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT/'tests'))
from browser_support import launch, serve_game
from playwright.sync_api import sync_playwright
OUT=ROOT/'_local/reports/bgm-stage11-integration';OUT.mkdir(parents=True,exist_ok=True)
fixture=json.loads((ROOT/'tests/fixtures/stage11-approved-material-pixels.json').read_text())
spec=importlib.util.spec_from_file_location('material_probe',ROOT/'tools/testing/stage11-material-probe.py');probe=importlib.util.module_from_spec(spec);spec.loader.exec_module(probe)
catalog=json.loads((ROOT/'shared/data/bgm.json').read_text())
report={'scope':'Short real MP3 playback; fixed stage11 camera/pixels/cache counters. No engine-step combat clear, timing benchmark, whole-song listening or physical-device claim.','audio':[],'screens':[],'materialPixels':[],'cache':[]}
with serve_game() as base,sync_playwright() as p:
 b=launch(p);page=b.new_page(viewport={'width':1440,'height':900},device_scale_factor=1);errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(base+'/HONRO.html');page.wait_for_function('document.documentElement.dataset.honroReady');page.get_by_role('button',name='설정',exact=True).click()
 def song(index,label):
  page.wait_for_function('''v=>{const m=HonroApp.audio.music,l=document.getElementById('bgm-now-playing');return m.track===v.index&&m.current?.currentTime>.1&&!m.current.paused&&!m.outgoing&&!l.hidden&&l.textContent==='배경음 - '+v.title}''',arg={'index':index,'title':catalog[index]['title']})
  row=page.evaluate('''()=>({status:HonroApp.audio.music.status(),title:document.getElementById('bgm-now-playing').textContent,file:HonroApp.audio.music.current.currentSrc.split('/').pop(),readyState:HonroApp.audio.music.current.readyState})''');assert row['status']['playing']==1 and not row['status']['errors'];report['audio'].append({'case':label,**row})
 song(0,'title');page.locator('#modal .menu-close').click();page.evaluate('HonroApp.debugMode=true')
 for stage,index in [(1,1),(9,3),(10,3),(11,4),(21,1)]:
  page.evaluate('(s)=>HonroApp.launch(s)',stage);song(index,f'stage-{stage}')
  if stage==11:page.screenshot(path=str(OUT/'bgm-stage11-title.jpg'),type='jpeg',quality=88)
 page.close()
 # Production stage11 screenshots, with simulation held to the approved entry fixture.
 page=b.new_page(viewport={'width':1440,'height':900},device_scale_factor=1);page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(base+'/HONRO.html');page.wait_for_function('window.HonroApp');page.evaluate(probe.INIT);page.wait_for_function('HonroAuthoredFarArt.ready(11)')
 # Check only the approved six material-only pixels. No performance sample loops.
 page.evaluate((ROOT/'tools/testing/stage11-material-probe.js').read_text())
 for sample in fixture['views']:
  for zoom,expected in sample['hashes'].items():
   url=page.evaluate('v=>stage11MaterialProbe.materialPixels(v.view,v.zoom)',{'view':sample['view'],'zoom':float(zoom)})
   actual=hashlib.sha256(url.encode()).hexdigest();assert actual==expected,(sample['view']['name'],zoom,actual,expected)
   report['materialPixels'].append({'view':sample['view']['name'],'zoom':float(zoom),'sha256':actual,'matchesApproved':True})
 for name,x,y,z,w,h in [('overview',8000,7250,.115,1440,900),('central',7290,7080,.43,1440,900),('refuge',10350,8470,.5,1440,900),('mobile',11900,7850,.36,390,844)]:
  page.set_viewport_size({'width':w,'height':h});page.wait_for_timeout(100)
  page.evaluate('''v=>{const a=HonroApp,s=a.scene,b=a.engine.b;if(v.name==='mobile'){for(const q of HonroAct2.steps(b))if(q.id!=='trace')HonroAct2.memory(b).done[q.id]=true;a.updateHUD(true);}s.render(a.engine,0,'',.6,false,0);Object.assign(s,{manual:true,x:v.x,y:v.y,scale:v.z,storyTween:null,cinematic:null,goalFocus:null,editorView:v.name==='overview',skillPreview:v.name==='overview'});s.time=10;s.walkTime=0;s.weatherX=0;s.render(a.engine,0,'',.6,false,0);s.render(a.engine,0,'',.6,false,0);}''',{'name':name,'x':x,'y':y,'z':z})
  file=OUT/f'stage11-{name}.jpg';page.screenshot(path=str(file),type='jpeg',quality=88)
  report['screens'].append({'file':file.name,'viewport':[w,h],'camera':[x,y,z],'sha256':hashlib.sha256(file.read_bytes()).hexdigest()})
 # One warm normal-screen repeat per view, with counters only; no timing claims.
 page.set_viewport_size({'width':1440,'height':900})
 page.evaluate(probe.instrument((ROOT/'shared/runtime/stage11-landscape-art.js').read_text()))
 for view in probe.VIEWS:
  row=page.evaluate('''v=>{const a=HonroApp,s=a.scene;Object.assign(s,{x:v.x,y:v.y,scale:v.z,editorView:false,skillPreview:false});const draw=()=>{s.time=10;s.walkTime=0;s.weatherX=0;s.render(a.engine,0,'',.6,false,0)};draw();draw();const before=s.renderCacheStats();__s11Meter.reset();draw();const after=s.renderCacheStats();return {counts:__s11Meter.counts,domainTileBuilds:after.domainTileBuilds-before.domainTileBuilds,worldHits:after.worldHits-before.worldHits,screenHits:after.screenHits-before.screenHits}}''',view)
  assert row['counts']['materialCalls']==0 and row['domainTileBuilds']==0 and row['worldHits']>=1 and row['screenHits']>=2,row
  report['cache'].append({'view':view['name'],**row})
 page.close()
 editor=b.new_page();editor.goto(base+'/HONRO_WORKSHOP.html');editor.wait_for_function('window.HonroWorkshopAPI');editor.click('[data-tab="play"]');editor.wait_for_function('HonroWorkshopAPI.getPlayApp()?.engine')
 play=editor.frames[1];play.evaluate('if(HonroApp.dialogue)HonroStory.finish(HonroApp);HonroApp.turnNotice=null');play.locator('#battlecanvas').click(position={'x':300,'y':200});play.wait_for_function('HonroApp.audio.music.current?.currentTime>.1')
 editor.evaluate('window.oldMusic=HonroWorkshopAPI.getPlayApp().audio.music');editor.click('#stopPlay');assert editor.evaluate('oldMusic.current===null&&oldMusic.outgoing===null');report['workshopStop']=True
 assert not errors,errors;report['pageErrors']=errors;b.close()
report['sourceHead']=subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip();report['manifestSha256']=hashlib.sha256((ROOT/'web/manifest.json').read_bytes()).hexdigest()
report['sourceHashes']={f:hashlib.sha256((ROOT/f).read_bytes()).hexdigest() for f in ['shared/runtime/renderer.js','shared/runtime/main.js','shared/runtime/stage11-landscape-art.js','shared/data/campaign.json','shared/data/bgm.json','AGENTS.md']}
(OUT/'integration-browser.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'audioCases':len(report['audio']),'approvedMaterialPixels':len(report['materialPixels']),'warmCacheViews':len(report['cache']),'screens':[r['file'] for r in report['screens']],'workshopStop':True,'manifestSha256':report['manifestSha256']}))
