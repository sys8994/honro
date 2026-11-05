"""Current Stage21 observed native-input snapshots in Chromium.
Snapshot injection/camera poses are fixtures. This is render and exact save/resume
coverage, never a browser combat completion claim. No public upload required.
"""
import hashlib,json,os,subprocess
from pathlib import Path
from playwright.sync_api import sync_playwright
from browser_support import ROOT,launch,serve_game
from stage21_source_preview import install_source_preview,source_preview_metadata
trace_path=ROOT/os.environ.get('HONRO_STAGE21_TRACE','_local/reports/stage21-current/clear-route/trace.json')
trace=json.loads(trace_path.read_text())
assert hashlib.sha256((ROOT/'shared/data/campaign.json').read_bytes()).hexdigest()==trace['source']['campaign']
out=ROOT/os.environ.get('HONRO_STAGE21_BROWSER_OUT','_local/reports/stage21-current/observed-browser');out.mkdir(parents=True,exist_ok=True)
rows=trace['snapshots']
selected={'cart':{'battle':trace['initial'],'label':'initial'},'moving':next(r for r in rows if 80<r['battle']['honroState']['act23v4']['city'].get('actors',{}).get('act3-resident',{}).get('distance',0)<900),'exit':next(r for r in rows if r['battle']['honroState']['act23v4']['done'].get('refuge-hold'))}
results=[];errors=[]
with serve_game() as base,sync_playwright() as pw:
 browser=launch(pw)
 for label,row in selected.items():
  page=browser.new_page(viewport={'width':1280,'height':800});install_source_preview(page);page.on('pageerror',lambda e:errors.append(str(e)));page.goto(base+'/HONRO.html');page.wait_for_function('!!globalThis.HonroApp')
  result=page.evaluate('''async p=>{await HonroCampaignLoader.ensureStage(21);const a=HonroApp;a.frame=()=>{};a.profile=p;a.continue();a.turnNotice=null;a.updateHUD(true);return{revision:a.engine.b.honroCampaignMapRevision,objective:document.querySelector('#objective-text').textContent,current:HonroAct23V4.current(a.engine.b)?.id,city:HonroAct23V4City.memory(a.engine.b)};}''',{**trace['profile'],'honroBattle':row['battle']})
  assert result['revision']==421
  before=page.evaluate('''()=>{HonroApp.stopBattle();return JSON.stringify(HonroApp.profile.honroBattle);}''')
  page.reload();page.wait_for_function('!!globalThis.HonroApp');page.evaluate('HonroApp.frame=()=>{}');page.evaluate('HonroApp.continue()');page.wait_for_function('HonroApp.screen==="battle"')
  after=page.evaluate('JSON.stringify(HonroApp.engine.b)');assert json.loads(before)==json.loads(after),(label,'saved battle changed')
  for form,w,h,z in [('desktop',1280,800,.75),('portrait',390,844,.75),('landscape',844,390,.65)]:
   page.set_viewport_size({'width':w,'height':h});page.evaluate('''p=>{const a=HonroApp,s=a.scene;a.turnNotice=null;a.updateHUD(true);s.manual=true;s.storyTween=null;s.cinematic=null;s.goalFocus=null;s.x=p.x;s.y=2530;s.scale=p.z;s.render(a.engine,0,a.selected,.6,false,0,true);}''',{'x':2000 if label=='cart' else 2400,'z':z});page.screenshot(path=str(out/(label+'-'+form+'.png')))
  results.append({'label':label,'sourceSnapshot':row['label'],'exactSaveResume':True,'result':result});page.close()
 browser.close()
assert not errors,errors
(out/'result.json').write_text(json.dumps({'traceSource':trace['source'],'servedSource':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'servedManifestSha256':hashlib.sha256((ROOT/'web/manifest.json').read_bytes()).hexdigest(),'sourcePreview':source_preview_metadata(),'scope':__doc__,'results':results,'errors':errors},ensure_ascii=False,indent=2))
print('PASS current Stage21 observed HUD, desktop/mobile rendering and exact battle save/resume',len(results))
