"""Focused natural App rAF diagnostic / uninstrumented renderer A/B runner.
MODE=phase and MODE=alpha are separate runs; alpha data is never timing evidence.
MODE=measure uses CDP timeline events with no production function wrappers.
"""
import gzip,hashlib,json,os,sys,subprocess,time
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
def measure(ctx,p,state,frames,name):
 cdp=ctx.new_cdp_session(p);done=[]
 cdp.on('Tracing.tracingComplete',lambda e:done.append(e))
 cdp.send('Tracing.start',{'categories':'devtools.timeline,blink.user_timing','transferMode':'ReturnAsStream'})
 raf=p.evaluate('''async ({state,frames})=>{const samples=[],longtasks=[];const observer=new PerformanceObserver(list=>{for(const e of list.getEntries())longtasks.push({at:e.startTime,ms:e.duration});});observer.observe({entryTypes:['longtask']});let last,n=0;performance.mark('occlusion-start');await new Promise(resolve=>{const next=t=>{if(last!==undefined)samples.push(t-last);last=t;if(state==='pan'){const s=HonroApp.scene;s.manual=true;s.x+=Math.sin(n*.13)*8;}if(++n<frames)requestAnimationFrame(next);else resolve();};requestAnimationFrame(next);});performance.mark('occlusion-end');await new Promise(r=>setTimeout(r,0));observer.disconnect();return {samples,longtasks};}''',{'state':state,'frames':frames})
 cdp.send('Tracing.end');deadline=time.monotonic()+15
 while not done and time.monotonic()<deadline:p.wait_for_timeout(50)
 assert done,'trace completion missing'
 stream=done[0]['stream'];chunks=[]
 while True:
  chunk=cdp.send('IO.read',{'handle':stream});chunks.append(chunk['data'])
  if chunk.get('eof'):break
 cdp.send('IO.close',{'handle':stream});raw=''.join(chunks);trace=json.loads(raw)['traceEvents'];tracefile=name+'-'+state+'-trace.json.gz'
 (OUT/tracefile).write_bytes(gzip.compress(raw.encode()))
 marks={e['name']:e['ts'] for e in trace if e['name'] in ['occlusion-start','occlusion-end']};start=marks['occlusion-start'];end=marks['occlusion-end']
 # FireAnimationFrame encloses exactly one registered callback. Distinguish
 # production App callbacks by their runtime module URL from our eval sampler.
 callbacks=[e for e in trace if e['name']=='FunctionCall' and e.get('ph')=='X' and '/web/runtime/' in e.get('args',{}).get('data',{}).get('url','') and start<=e['ts']<end]
 fires=[e for e in trace if e['name']=='FireAnimationFrame' and e.get('ph')=='X' and start<=e['ts']<end]
 app=[e for e in fires if any(e['pid']==f['pid'] and e['tid']==f['tid'] and e['ts']<=f['ts'] and f['ts']+f.get('dur',0)<=e['ts']+e.get('dur',0) for f in callbacks)]
 samples=[e['dur']/1000 for e in app]
 def stat(v):
  n=sorted(v);return {'n':len(n),'p50':n[len(n)//2] if n else 0,'p95':n[int(len(n)*.95)] if n else 0,'max':max(n,default=0),'total':sum(n)}
 assert frames-2<=len(samples)<=frames+2,(len(samples),frames,'unexpected production callback count')
 appCalls=[f for f in callbacks if any(e['pid']==f['pid'] and e['tid']==f['tid'] and e['ts']<=f['ts'] and f['ts']+f.get('dur',0)<=e['ts']+e.get('dur',0) for e in app)]
 assert len(set(e['args']['data']['url'] for e in appCalls))==1,'ambiguous runtime rAF callbacks'
 return {'state':state,'mode':'CDP-timeline-no-function-wrappers','frame':stat(samples),'raf':stat(raf['samples']),'frameSamples':samples,'rafSamples':raf['samples'],'longtasks':raf['longtasks'],'trace':tracefile,'traceSha256':hashlib.sha256((OUT/tracefile).read_bytes()).hexdigest(),'appCallbackURLs':list(set(e['args']['data']['url'] for e in appCalls)),'appCallbacks':len(app),'allAnimationCallbacks':len(fires),'icons':p.evaluate('HonroSkillImages.status()'),'final':p.evaluate('()=>({round:HonroApp.engine.b.round,phase:HonroApp.engine.b.phase,units:HonroApp.engine.b.units.length,charging:HonroApp.charging,power:HonroApp.power})')}
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
  if state=='charge':
   p.evaluate('HonroApp.beginCharge()');p.wait_for_timeout(5200)
  elif state=='pan':p.evaluate('HonroApp.scene.manual=true')
  if mode=='measure':
   row=measure(ctx,p,state,int(os.environ.get('FRAMES','240')),os.environ.get('RUN',mode))
  else:
   source=(BUILD/'shared/runtime/renderer.js').read_text().split('        occludedUnitSilhouettes(',1)[1].split('        tacticalUnitMarkers(',1)[0].strip()
   row=p.evaluate((ROOT/'tools/testing/occlusion-probe.js').read_text(),{'mode':mode,'frames':int(os.environ.get('FRAMES','120')),'source':'occludedUnitSilhouettes('+source})
  row.update(state=state,errors=errors);rows.append(row)
  if os.environ.get('JPG')=='1':p.screenshot(path=str(OUT/(os.environ.get('RUN',mode)+'-'+state+'.jpg')),type='jpeg',quality=88)
  print(json.dumps({k:v for k,v in row.items() if k not in ['rows','phaseSamples','frameSamples','rafSamples']}),flush=True);assert not errors,errors;ctx.close()
 meta={'sourceCommit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=BUILD,text=True).strip(),'trackedTreeDirty':bool(subprocess.check_output(['git','status','--porcelain','--untracked-files=no'],cwd=BUILD,text=True).strip()),'rendererSha256':hashlib.sha256((BUILD/'shared/runtime/renderer.js').read_bytes()).hexdigest(),'rigSha256':hashlib.sha256((BUILD/'shared/runtime/party-rig.js').read_bytes()).hexdigest(),'adapterSha256':hashlib.sha256((BUILD/'shared/assets/rebuild-game-adapter.mjs').read_bytes()).hexdigest(),'manifestSha256':hashlib.sha256((BUILD/'web/manifest.json').read_bytes()).hexdigest(),'htmlSha256':hashlib.sha256((BUILD/'HONRO.html').read_bytes()).hexdigest(),'profileSha256':hashlib.sha256((ROOT/'tests/fixtures/render-update-profile-20261022.json').read_bytes()).hexdigest(),'runnerSha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),'probeSha256':hashlib.sha256((ROOT/'tools/testing/occlusion-probe.js').read_bytes()).hexdigest(),'browser':browser.version,'viewport':[1280,800],'seed':899411,'rows':rows};browser.close()
server.shutdown();(OUT/(os.environ.get('RUN',mode)+'.json')).write_text(json.dumps(meta,indent=2))
