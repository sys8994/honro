"""Focused natural App rAF diagnostic / uninstrumented renderer A/B runner.
MODE=phase and MODE=alpha are separate runs; alpha data is never timing evidence.
MODE=measure uses only the existing App.frame sampler (no renderer/canvas wrappers).
"""
import hashlib,json,os,sys,subprocess
from pathlib import Path
from functools import partial
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from threading import Thread
ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT/'tests'))
from browser_support import launch
from playwright.sync_api import sync_playwright
BUILD=Path(os.environ.get('BUILD_ROOT',ROOT));OUT=ROOT/'_local/reports/occlusion-render-cost';OUT.mkdir(parents=True,exist_ok=True)
class Handler(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Handler,directory=str(BUILD)));Thread(target=server.serve_forever,daemon=True).start()
mode=os.environ.get('MODE','phase');rows=[]
with sync_playwright() as pw:
 browser=launch(pw)
 for state in os.environ.get('STATES','idle').split(','):
  ctx=browser.new_context(viewport={'width':1280,'height':800},device_scale_factor=1);p=ctx.new_page();errors=[];p.on('pageerror',lambda e:errors.append(str(e)))
  profile=json.loads((ROOT/'tests/fixtures/render-update-profile-20261022.json').read_text())
  p.add_init_script('localStorage.clear();localStorage.setItem("honro-first-act-profile-1",'+json.dumps(json.dumps(profile))+');let s=899411;Math.random=()=>((s=Math.imul(s,1664525)+1013904223>>>0)/4294967296);')
  p.goto(f'http://127.0.0.1:{server.server_port}/HONRO.html');p.wait_for_function('document.documentElement.dataset.honroReady')
  p.evaluate("HonroApp.showCamp('archer')");p.wait_for_function('()=>{const s=HonroSkillImages.status(),n=Object.values(HONRO_SKILL_ICON_MANIFEST.icons).filter(v=>v.status==="ready"&&v.url).length;return s.cached>=n&&!s.active&&!s.queued;}',timeout=30000)
  p.evaluate('HonroApp.launch(11)');p.wait_for_function('HonroApp.engine?.b.honroStage===11');p.wait_for_function('HonroAuthoredFarArt.ready(11)')
  p.evaluate('()=>{const a=HonroApp;while(a.dialogue)HonroStory.finish(a);}')
  p.wait_for_function('()=>{const a=HonroApp,n=document.getElementById("turn-banner");return a.canInput()&&!a.turnNotice&&(!n||n.hidden); }');p.wait_for_timeout(900)
  if state=='charge':p.evaluate('HonroApp.beginCharge()')
  elif state=='pan':p.evaluate('HonroApp.scene.manual=true')
  if mode=='measure':
   row=p.evaluate((ROOT/'tools/testing/render-update-sample.js').read_text(),{'state':state,'frames':int(os.environ.get('FRAMES','240')),'counters':False})
  else:
   source=(BUILD/'shared/runtime/renderer.js').read_text().split('        occludedUnitSilhouettes(',1)[1].split('        tacticalUnitMarkers(',1)[0].strip()
   row=p.evaluate((ROOT/'tools/testing/occlusion-probe.js').read_text(),{'mode':mode,'frames':int(os.environ.get('FRAMES','120')),'source':'occludedUnitSilhouettes('+source})
  row.update(state=state,errors=errors);rows.append(row)
  if os.environ.get('JPG')=='1':p.screenshot(path=str(OUT/(os.environ.get('RUN',mode)+'-'+state+'.jpg')),type='jpeg',quality=88)
  print(json.dumps({k:v for k,v in row.items() if k not in ['rows','phaseSamples','frameSamples','rafSamples']}),flush=True);assert not errors,errors;ctx.close()
 meta={'sourceCommit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=BUILD,text=True).strip(),'trackedTreeDirty':bool(subprocess.check_output(['git','status','--porcelain','--untracked-files=no'],cwd=BUILD,text=True).strip()),'rendererSha256':hashlib.sha256((BUILD/'shared/runtime/renderer.js').read_bytes()).hexdigest(),'manifestSha256':hashlib.sha256((BUILD/'web/manifest.json').read_bytes()).hexdigest(),'runnerSha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),'probeSha256':hashlib.sha256((ROOT/'tools/testing/occlusion-probe.js').read_bytes()).hexdigest(),'browser':browser.version,'viewport':[1280,800],'seed':899411,'rows':rows};browser.close()
server.shutdown();(OUT/(os.environ.get('RUN',mode)+'.json')).write_text(json.dumps(meta,indent=2))
