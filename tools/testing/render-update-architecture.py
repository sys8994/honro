"""Focused production update ownership and timing. Chromium simulation, not hardware."""
import hashlib,json,os,sys,subprocess
from pathlib import Path
from functools import partial
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from threading import Thread
ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT/'tests'))
from browser_support import launch
from playwright.sync_api import sync_playwright
BUILD=Path(os.environ.get('BUILD_ROOT',ROOT));OUT=ROOT/'_local/reports/render-update';OUT.mkdir(parents=True,exist_ok=True)
class Handler(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Handler,directory=str(BUILD)));Thread(target=server.serve_forever,daemon=True).start()
rows=[]
with sync_playwright() as p:
 browser=launch(p)
 for state in os.environ.get('STATES','idle,charge,fire,pan,pause,preview,rest,journey,journey-zoom').split(','):
  ctx=browser.new_context(viewport={'width':int(os.environ.get('WIDTH','1280')),'height':int(os.environ.get('HEIGHT','800'))},device_scale_factor=1)
  page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  profile=json.loads((ROOT/'tests/fixtures/render-update-profile-20261022.json').read_text())
  page.add_init_script('localStorage.clear();localStorage.setItem("honro-first-act-profile-1",'+json.dumps(json.dumps(profile))+');let s=899411;Math.random=()=>((s=Math.imul(s,1664525)+1013904223>>>0)/4294967296);')
  page.goto(f'http://127.0.0.1:{server.server_port}/HONRO.html');page.wait_for_function('document.documentElement.dataset.honroReady')
  page.evaluate('HonroApp.launch(11)');page.wait_for_function('HonroApp.engine?.b.honroStage===11');page.wait_for_function('HonroAuthoredFarArt.ready(11)')
  page.evaluate('()=>{const a=HonroApp;while(a.dialogue)HonroStory.finish(a);a.turnNotice=null;}');page.wait_for_timeout(900)
  if state=='pause':page.evaluate('HonroApp.pause()')
  elif state=='charge':page.evaluate('HonroApp.beginCharge()')
  elif state=='fire':page.evaluate('HonroApp.beginCharge()');page.wait_for_timeout(450);page.evaluate('HonroApp.releaseCharge()')
  elif state=='preview':page.evaluate("HonroApp.showCamp('archer');HonroApp.talent('A01')");page.wait_for_function('HonroApp.preview?.canvas.isConnected');page.wait_for_timeout(600)
  elif state in ['rest','journey','journey-zoom']:
   page.evaluate('HonroRestJourney.showRest(HonroApp)')
   if state!='rest':page.evaluate('HonroApp.showMap()');page.wait_for_timeout(900)
  row=page.evaluate((ROOT/'tools/testing/render-update-sample.js').read_text(),{'state':state,'frames':int(os.environ.get('FRAMES','120')),'counters':os.environ.get('MODE','count')=='count'})
  row['errors']=errors;rows.append(row)
  if os.environ.get('JPG')=='1':page.screenshot(path=str(OUT/(os.environ.get('RUN','baseline')+'-'+state+'.jpg')),type='jpeg',quality=90)
  print(state,json.dumps({k:row[k] for k in ['frame','raf','mutations','methods','errors']}),flush=True);ctx.close()
 meta={'sourceCommit':os.environ.get('SOURCE_SHA',subprocess.check_output(['git','rev-parse','HEAD'],cwd=BUILD,text=True).strip()),'htmlSha256':hashlib.sha256((BUILD/'HONRO.html').read_bytes()).hexdigest(),'manifestSha256':hashlib.sha256((BUILD/'web/manifest.json').read_bytes()).hexdigest(),'browser':browser.version,'viewport':[int(os.environ.get('WIDTH','1280')),int(os.environ.get('HEIGHT','800'))],'seed':899411,'rows':rows};browser.close()
server.shutdown();(OUT/(os.environ.get('RUN','baseline')+'.json')).write_text(json.dumps(meta,indent=2))
