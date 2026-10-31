"""Local built-HTML original estuary selection/screens, not a release gate.

Requires a current local build and Playwright/Chromium. The prepared stage and
frozen camera do not establish normal gameplay or production/art approval.
"""
import functools,hashlib,http.server,json,pathlib,threading
from playwright.sync_api import sync_playwright
root=pathlib.Path(__file__).resolve().parents[1];out=root/'_local/reports/act4-estuary-screen';out.mkdir(parents=True,exist_ok=True)
image=root/'shared/assets/environment/campaign-far/act4-estuary.webp';manifest=root/'web/manifest.json';built=json.loads(manifest.read_text());assets=[f for f in built['files'] if 'honro_authored_far-images-act4Estuary.' in f['path']];assert len(assets)==1,assets
asset=assets[0];expected_sha=hashlib.sha256(image.read_bytes()).hexdigest();assert expected_sha=='1ba81aae5bebeebd46cc094be2519797d67ef49a887d7aade45cb61b39878fff';assert asset['sha256']==expected_sha and hashlib.sha256((root/asset['path']).read_bytes()).hexdigest()==expected_sha
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(root)));threading.Thread(target=server.serve_forever,daemon=True).start()
try:
 rows=[]
 with sync_playwright() as p:
  browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
  for label,viewport in [('desktop',{'width':1440,'height':900}),('mobile',{'width':390,'height':844})]:
   page=browser.new_page(viewport=viewport);errors=[];requests=[];page.on('pageerror',lambda e:errors.append(str(e)));page.on('request',lambda request:requests.append(request.url));page.goto(f'http://127.0.0.1:{server.server_port}/HONRO.html');page.wait_for_function('!!window.HonroApp')
   meta=page.evaluate('''async()=>{await HonroCampaignLoader.ensureStage(31);const a=HonroApp;a.frame=()=>{};for(let n=1;n<=30;n++)a.profile.cleared[n]={visits:1,rounds:5};a.profile.recruited=['archer','mage','knight','occultist'];a.profile.party=[...a.profile.recruited];a.launch(31);a.close();a.dialogue=null;a.turnNotice=null;const b=a.engine.b;if(b.honroAct4PreviewState?.arrivalTour)b.honroAct4PreviewState.arrivalTour.active=false;Object.assign(a.scene,{manual:true,x:900,y:3650,scale:innerWidth<600?.42:.7,storyTween:null,storyFrame:null,cinematic:null,goalFocus:null});return {stage:b.honroStage,scene:{x:a.scene.x,y:a.scene.y,scale:a.scene.scale}}}''')
   page.wait_for_function('HonroAuthoredFarArt.ready(31,HonroApp.engine.b.honroPreviewFar,HonroApp.engine.b)',timeout=15000)
   frame=page.evaluate('''()=>{const a=HonroApp;a.close();a.dialogue=null;a.scene.render(a.engine,0,a.selected,.5,false,0);return {frames:HonroAuthoredFarArt.frames(a.scene,innerWidth,innerHeight,a.engine.b),stats:HonroAuthoredFarArt.stats()}}''')
   assert frame['frames'][0]['key']=='act4Estuary',(label,frame);assert any(url.endswith('/'+asset['path']) for url in requests),(label,asset['path']);assert not errors,errors
   path=out/f'{label}.png';page.screenshot(path=str(path));rows.append({'label':label,'viewport':viewport,'meta':meta,'frame':frame,'errors':errors,'screenshot':str(path)});page.close()
  browser.close()
 report={'scope':'Temporary local build; prepared stage entry, frozen camera, objective guide may cover view. Not release guard, ordinary campaign, terrain approval or deployment.','operationalSha256':expected_sha,'builtAsset':asset,'buildManifestSha256':hashlib.sha256(manifest.read_bytes()).hexdigest(),'rows':rows}
 (out/'result.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print('PASS local browser estuary selection/cache on desktop and mobile; screen review separate')
finally:server.shutdown()
