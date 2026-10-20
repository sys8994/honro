"""Capture only the artwork under review; no engine step or gameplay tour.
Usage: python tools/environment/capture-vector-art-candidate.py TAG MODE
MODE representative | overview | mobile | rest. HONRO_OVERLAY=1 uses source overlays.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import subprocess,json,sys,os,hashlib
ROOT=Path(__file__).resolve().parents[2]
tag=sys.argv[1];mode=sys.argv[2] if len(sys.argv)>2 else 'representative'
out=ROOT/'_local/reports/vector-art-correction-v2'/tag;out.mkdir(parents=True,exist_ok=True)
source_hash=lambda:subprocess.check_output(['node','tools/release/art-review.mjs','hash'],cwd=ROOT,text=True).strip()
before_hash=source_hash();rows=[];errors=[]
views={1:[('normal',2400,2300,.6),('wide',3000,1900,.22)],3:[('normal',3100,1550,.65),('wide',2100,1450,.24)],18:[('normal',1200,6200,.5),('wide',6800,5800,.12)],21:[('normal',2277,2460,.6),('wide',4700,2600,.15)]}
if mode=='overview':views={n:[] for n in range(1,31)}
if mode=='mobile':views={1:[('mobile',2400,2140,.4)],3:[('mobile',3100,1400,.4)],18:[('mobile',700,5890,.35)],21:[('mobile',2277,2400,.35)]}
if mode=='rest':views={n:[] for n in [1,3,18,21]}
width,height=(390,844) if mode=='mobile' else (1440,960)
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage']);page=browser.new_page(viewport={'width':width,'height':height},device_scale_factor=1);page.on('pageerror',lambda e:errors.append(str(e)))
 if os.environ.get('HONRO_OVERLAY')=='1':
  overlay=json.loads(Path('/tmp/honro-terrain-overlay/manifest.json').read_text())
  for file,patched in overlay.items():page.route('**/'+file,lambda route,request,patched=patched:route.fulfill(status=200,content_type='text/javascript',body=Path(patched).read_text()))
 page.goto(os.environ.get('HONRO_CAPTURE_URL','http://127.0.0.1:8841/HONRO.html'));page.wait_for_function('window.HonroApp',timeout=120000)
 page.evaluate('''size=>{HonroApp.frame=()=>{};const c=document.createElement('canvas');c.id='terrain-view';c.width=size[0];c.height=size[1];c.style.cssText='position:fixed;inset:0;z-index:99999;width:'+size[0]+'px;height:'+size[1]+'px';document.body.append(c);window.terrainCanvas=c;}''',[width,height])
 for n,poses in views.items():
  if mode=='rest':
   page.evaluate('''n=>{document.getElementById('terrain-view')?.remove();HonroApp.debugRestStage=n;HonroApp.dialogue=null;HonroApp.profile.honroBattle=null;HonroRestJourney.showRest(HonroApp);HonroRestJourney.stopMotion(HonroApp);document.getElementById('dialogue-root')?.replaceChildren();HonroRestJourney.drawPeople(0);}''',n)
   page.wait_for_timeout(200);shot=out/f'stage{n:02d}-rest.png';page.screenshot(path=str(shot));rows.append({'id':f'{tag}-stage{n:02d}-rest','sourceHash':before_hash,'stage':n,'view':'rest','camera':{'x':800,'y':450,'scale':1},'viewport':{'width':width,'height':height},'screenshot':{'path':str(shot.relative_to(ROOT)),'sha256':hashlib.sha256(shot.read_bytes()).hexdigest()}});continue
  size=page.evaluate('''async n=>{const st=await HonroCampaignLoader.ensureStage(n),b=HonroMaps.createBattle(st,HONRO_PROJECT);HonroStageRules.sanitizeStageBattle(b);const e=new HONRO_CORE.Engine(b,()=>{},true),s=new HonroScene(terrainCanvas);Object.assign(s,{manual:true,time:2,skillPreview:true});window.terrainCurrent={b,e,s,before:JSON.stringify([b.terrain,b.units,b.honroMarkers,b.honroEvents,b.honroObjectives])};return{width:b.width,height:b.height};}''',n)
  if mode=='overview':poses=[('overview',size['width']/2,size['height']*.54,min((width-130)/(size['width']+700),(height-120)/(size['height']+700)))]
  for label,x,y,scale in poses:
   pose={'x':x,'y':y,'scale':scale}
   result=page.evaluate('''v=>{const {s,e,b}=terrainCurrent;Object.assign(s,v);s.render(e,0,'',.6,false,0);s.render(e,0,'',.6,false,0);return{art:HonroVectorCampaignArt.stats(b),pure:terrainCurrent.before===JSON.stringify([b.terrain,b.units,b.honroMarkers,b.honroEvents,b.honroObjectives])};}''',pose)
   page.wait_for_timeout(100);page.evaluate("terrainCurrent.s.render(terrainCurrent.e,0,'',.6,false,0)")
   shot=out/f'stage{n:02d}-{label}.png';page.locator('#terrain-view').screenshot(path=str(shot));rows.append({'id':f'{tag}-stage{n:02d}-{label}','sourceHash':before_hash,'stage':n,'view':label,'camera':pose,'viewport':{'width':width,'height':height},'screenshot':{'path':str(shot.relative_to(ROOT)),'sha256':hashlib.sha256(shot.read_bytes()).hexdigest()},**result});print(tag,n,label,result['pure'],flush=True)
  page.evaluate("()=>{for(const tile of terrainCurrent.s._domainTiles?.tiles.values()||[])tile.canvas.width=1;terrainCurrent.s._domainTiles?.tiles.clear();delete window.terrainCurrent;}")
 browser.close()
after_hash=source_hash();report={'version':1,'sourceHash':before_hash,'sourceHashAfter':after_hash,'mode':mode,'rows':rows,'errors':errors};(out/'captures.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
assert before_hash==after_hash,'source changed during capture';assert not errors,errors;assert all(r.get('pure',True) for r in rows),'render changed non-art battle state'
