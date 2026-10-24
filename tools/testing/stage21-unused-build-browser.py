"""P0.3a: local cold startup requests, prepared current21 Continue/background pixels and Workshop common loading; normal App frame stays running."""
import base64,hashlib,json,sys,subprocess
from pathlib import Path
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT/'tests'))
from browser_support import launch,serve_game
OUT=ROOT/'_local/reports/stage21-unused-p03a';OUT.mkdir(parents=True,exist_ok=True);before='--before'in sys.argv;label='before'if before else 'after';manifest=json.loads((ROOT/'web/manifest.json').read_text());baseline=OUT/'before-manifest.json'
if not baseline.exists():baseline.write_bytes(subprocess.check_output(['git','show','46cb2b8d:web/manifest.json'],cwd=ROOT))
fixture=OUT/'stage21-profile.json'
if not fixture.exists():subprocess.run(['node','--input-type=module','-e',"""import{writeFile}from'node:fs/promises';import{appHarness,plain}from'./tests/app-regression-helpers.mjs';const h=await appHarness(),a=h.load(h.profileThrough(20));a.launch(21);h.finish(a);a.stopBattle();await writeFile('_local/reports/stage21-unused-p03a/stage21-profile.json',JSON.stringify(plain(a.profile)));"""],cwd=ROOT,check=True)
old=json.loads(baseline.read_text());target=[f for f in old['files']if 'HONRO_STAGE21_PAINTED'in f['path']];rows=[];errors=[]
def monitor(page):
 responses=[];page.on('pageerror',lambda e:errors.append(str(e)))
 def response(r):
  if urlparse(r.url).hostname=='127.0.0.1':responses.append({'path':urlparse(r.url).path.lstrip('/'),'bytes':int(r.headers.get('content-length',0)),'status':r.status})
 page.on('response',response);return responses

def checkpoint():
 (OUT/(label+'-partial.json')).write_text(json.dumps({'entry':manifest['gameEntry'],'rows':rows,'errors':errors},ensure_ascii=False,indent=2));print('completed',label,len(rows),flush=True)

def startup(responses):
 removed=[r for r in responses if any(r['path']==f['path']for f in target)]
 return {'requests':len(responses),'responseBodyBytes':sum(r['bytes']for r in responses),'removedDataRequests':removed,'responses':list(responses)}
with serve_game()as base,sync_playwright()as pw:
 browser=launch(pw)
 # Cold ordinary title, same local uncompressed HTTP server, fresh context. No save or network interception.
 c=browser.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True);p=c.new_page();responses=monitor(p);p.goto(base+'/HONRO.html');p.wait_for_function('window.HonroApp&&document.documentElement.dataset.honroReady',timeout=90000);p.wait_for_timeout(500);rows.append({'coldGameReadyPlus500ms':startup(responses)});checkpoint();state=p.evaluate('({data:typeof HONRO_STAGE21_PAINTED,provider:typeof HonroStage21Painted,pilots:typeof HONRO_PAINTED_PILOTS})');assert state==dict(data='object'if before else 'undefined',provider='undefined',pilots='object'),state;c.close()
 # Current21 snapshot is made with production App helpers; only camera/isolated background draw are prepared.
 c=browser.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True);c.add_init_script('localStorage.setItem("honro-first-act-profile-1",'+json.dumps((OUT/'stage21-profile.json').read_text())+');');p=c.new_page();monitor(p);p.goto(base+'/HONRO.html');p.wait_for_function('window.HonroApp&&document.documentElement.dataset.honroReady',timeout=90000);p.locator('[data-action=continue]').click();p.wait_for_function('HonroApp.engine?.b.honroStage===21&&HonroAuthoredFarArt.ready(21)&&!HonroApp.dialogue',timeout=90000);p.wait_for_timeout(400)
 draw=p.evaluate('''()=>{const a=HonroApp,b=a.engine.b,cv=document.createElement('canvas');cv.width=844;cv.height=390;const s=new HonroScene(cv);Object.assign(s,{x:1800,y:700,scale:.5,time:2,theme:a.scene.theme});s.background(cv.getContext('2d'),844,390,b);return{png:cv.toDataURL('image/png'),stage:b.honroStage,far:HonroAuthoredFarArt.keyFor(21),farReady:HonroAuthoredFarArt.ready(21),farErrors:HonroAuthoredFarArt.stats().errors,provider:typeof HonroStage21Painted,data:typeof HONRO_STAGE21_PAINTED,error:a.lastError||null}}''');png=base64.b64decode(draw.pop('png').split(',')[1]);(OUT/(label+'-stage21-background.png')).write_bytes(png);draw['backgroundSha256']=hashlib.sha256(png).hexdigest();assert draw['far']=='townSky'and draw['farReady']and not draw['farErrors']and not draw['error'];p.screenshot(path=str(OUT/(label+'-stage21-current.jpg')),type='jpeg',quality=83);rows.append({'currentStage21':draw});checkpoint();c.close()
 # Shared Workshop module list. No editor project or stage gameplay changes.
 c=browser.new_context(viewport={'width':1280,'height':800});p=c.new_page();responses=monitor(p);p.goto(base+'/HONRO_WORKSHOP.html');p.wait_for_function('window.HonroWorkshopAPI?.getRuntime()?.scene',timeout=90000);p.wait_for_timeout(500);rows.append({'coldWorkshopReadyPlus500ms':startup(responses)});checkpoint();editor=p.evaluate('({data:typeof HONRO_STAGE21_PAINTED,provider:typeof HonroStage21Painted,pilots:typeof HONRO_PAINTED_PILOTS})');assert editor==state,editor;rows.append({'workshopGlobals':editor});c.close();assert not errors,errors
 if not before:
  baseline=json.loads((OUT/'before.json').read_text());assert baseline['rows'][1]['currentStage21']['backgroundSha256']==draw['backgroundSha256'],'Current21 background pixels unchanged'
  for row in rows:
   for value in row.values():
    if isinstance(value,dict)and'removedDataRequests'in value:assert not value['removedDataRequests'],value
 report={'entry':manifest['gameEntry'],'rows':rows,'globals':state,'errors':errors,'scope':__doc__+' Network byte counts are observed Content-Length response body bytes on local uncompressed HTTP, not public compressed transfer/timing. Ready+500ms totals include prefetch variability. Stage21 snapshot/camera are prepared; no complete campaign, physical-device or public-site claim.'};(OUT/(label+'.json')).write_text(json.dumps(report,ensure_ascii=False,indent=2));browser.close();print(json.dumps({k:v for k,v in report.items()if k!='rows'},ensure_ascii=False));print('PASS',label,'cold Game/Workshop, current21 and background draw')
