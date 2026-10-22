"""Separate RGBA/pose/state boundary checks, never performance evidence.
Uses final production build and the unchanged baseline occlusion method.
Scripted render fixtures exercise overlap/pose boundaries; not normal campaign play.
"""
import base64,hashlib,json,os,sys,subprocess
from pathlib import Path
from functools import partial
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from threading import Thread
ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT/'tests'))
from browser_support import launch
from playwright.sync_api import sync_playwright
from PIL import Image
OUT=ROOT/'_local/reports/occlusion-render-cost/boundaries';OUT.mkdir(parents=True,exist_ok=True)
BASE=Path(os.environ.get('BASE_ROOT','/workspace/honro-occlusion-baseline'))
source=(BASE/'shared/runtime/renderer.js').read_text().split('        occludedUnitSilhouettes(',1)[1].split('        tacticalUnitMarkers(',1)[0].strip()
class Handler(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Handler,directory=str(ROOT)));Thread(target=server.serve_forever,daemon=True).start()
with sync_playwright() as pw:
 browser=launch(pw);ctx=browser.new_context(viewport={'width':1280,'height':800},device_scale_factor=1);p=ctx.new_page();errors=[];p.on('pageerror',lambda e:errors.append(str(e)))
 profile=json.loads((ROOT/'tests/fixtures/render-update-profile-20261022.json').read_text())
 p.add_init_script('localStorage.clear();localStorage.setItem("honro-first-act-profile-1",'+json.dumps(json.dumps(profile))+');let s=899411;Math.random=()=>((s=Math.imul(s,1664525)+1013904223>>>0)/4294967296);')
 p.goto(f'http://127.0.0.1:{server.server_port}/HONRO.html');p.wait_for_function('document.documentElement.dataset.honroReady');p.evaluate('HonroApp.launch(11)');p.wait_for_function('HonroApp.engine?.b.honroStage===11');p.wait_for_function('HonroAuthoredFarArt.ready(11)')
 p.evaluate('()=>{const a=HonroApp;while(a.dialogue)HonroStory.finish(a);}')
 p.wait_for_function('()=>{const a=HonroApp,n=document.getElementById("turn-banner");return a.canInput()&&!a.turnNotice&&(!n||n.hidden); }');p.wait_for_timeout(900)
 p.evaluate('HonroApp.frame=()=>{}');p.evaluate('document.fonts.ready')
 result=p.evaluate((ROOT/'tools/testing/occlusion-boundaries.js').read_text(),{'baseline':'occludedUnitSilhouettes('+source})
 for row in result['cases']:
  if 'image' in row:
   png=base64.b64decode(row.pop('image').split(',')[1]);(OUT/(row['name']+'.png')).write_bytes(png)
   Image.open(OUT/(row['name']+'.png')).convert('RGB').save(OUT/(row['name']+'.jpg'),quality=88)
 result.update(errors=errors,browser=browser.version,sourceFiles={f:hashlib.sha256((ROOT/f).read_bytes()).hexdigest() for f in ['shared/runtime/renderer.js','shared/runtime/party-rig.js','shared/assets/rebuild-game-adapter.mjs']},trackedTreeDirty=bool(subprocess.check_output(['git','status','--porcelain','--untracked-files=no'],cwd=ROOT,text=True).strip()),sourceCommit=subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),baselineCommit=subprocess.check_output(['git','rev-parse','HEAD'],cwd=BASE,text=True).strip(),rendererSha256=hashlib.sha256((ROOT/'shared/runtime/renderer.js').read_bytes()).hexdigest(),manifestSha256=hashlib.sha256((ROOT/'web/manifest.json').read_bytes()).hexdigest(),checkerSha256=hashlib.sha256((ROOT/'tools/testing/occlusion-boundaries.js').read_bytes()).hexdigest())
 (OUT/'checks.json').write_text(json.dumps(result,indent=2));print(json.dumps(result,indent=2));assert result['passed'] and not errors
 browser.close()
server.shutdown()
