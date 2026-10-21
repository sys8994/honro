# Exact deployed-snapshot startup comparison; see game/docs/INTRO_LOADING_AUDIT.md.
import sys,json,gzip,time,os
from pathlib import Path
from functools import partial
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from threading import Thread
R=Path(__file__).resolve().parents[2];sys.path.insert(0,str(R/'tests'))
from browser_support import launch
from playwright.sync_api import sync_playwright
O=Path(os.environ.get('HONRO_HISTORY_OUT',str(R/'_local/reports/intro-audit')));O.mkdir(parents=True,exist_ok=True);cases=sys.argv[1:] or ['inline','split','pre-ui','ui','chapter','image-start','restored','baseline','current'];rows=[];reps=int(os.environ.get('REPS','1'));compress=os.environ.get('ENCODING','gzip')=='gzip'
init='''window.his={ready:null,title:null,long:[]};new PerformanceObserver(l=>his.long.push(...l.getEntries().map(e=>({start:e.startTime,ms:e.duration})))).observe({type:'longtask',buffered:true});function check(){const imgs=[...document.querySelectorAll('.title-painting img,.honro-logo')];if(document.querySelector('.honro-title')&&imgs.every(i=>i.complete&&i.naturalWidth))his.title??=performance.now();if(window.HonroApp&&document.querySelector('.title-actions button[data-action]'))his.ready??=performance.now();if(!his.ready||!his.title)requestAnimationFrame(check)}requestAnimationFrame(check);'''
with sync_playwright() as p:
 b=launch(p)
 for name in cases:
  root=R if name=='current' else Path(os.environ.get('HONRO_BASELINE_ROOT','/workspace/honro-loading-baseline')) if name=='baseline' else Path(os.environ.get('HONRO_HISTORY_ROOT','/workspace/honro-history'))/name
  packed={}
  if compress:
   for folder in [root/'web',root]:
    files=folder.rglob('*') if folder.name=='web' else [root/'HONRO.html']
    for f in files:
     if f.is_file() and f.suffix in ['.js','.json','.css','.html']:packed[str(f)]=gzip.compress(f.read_bytes(),compresslevel=6,mtime=0)
   packed[str(root/'HONRO.html')]=gzip.compress((root/'HONRO.html').read_bytes(),compresslevel=6,mtime=0)
  class H(SimpleHTTPRequestHandler):
   def log_message(self,*a):pass
   def handle(self):
    try:super().handle()
    except (BrokenPipeError,ConnectionResetError):pass
   def end_headers(self):self.send_header('Cache-Control','public, max-age=600');super().end_headers()
   def do_GET(self):
    f=self.translate_path(self.path)
    if f in packed:
     body=packed[f];self.send_response(200);self.send_header('Content-Type',self.guess_type(f));self.send_header('Content-Encoding','gzip');self.send_header('Vary','Accept-Encoding');self.send_header('Content-Length',str(len(body)));self.end_headers();self.wfile.write(body)
    else:super().do_GET()
  server=ThreadingHTTPServer(('127.0.0.1',0),partial(H,directory=str(root)));Thread(target=server.serve_forever,daemon=True).start();base=f'http://127.0.0.1:{server.server_port}'
  for rep in range(reps):
   c=b.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True,device_scale_factor=1);pg=c.new_page();pg.add_init_script(init);pg.add_init_script("localStorage.removeItem('honro-first-act-profile-1');localStorage.removeItem('honro-debug-mode')");errors=[];pg.on('pageerror',lambda e:errors.append(str(e)));cd=c.new_cdp_session(pg);cd.send('Network.enable');cd.send('Emulation.setCPUThrottlingRate',{'rate':4});cd.send('Network.emulateNetworkConditions',{'offline':False,'latency':40,'downloadThroughput':2*1024*1024,'uploadThroughput':1024*1024});events=[];cd.on('Network.loadingFinished',lambda e:events.append(e))
   for cache in ['cold','warm']:
    events.clear();pg.goto(base+'/HONRO.html',wait_until='commit',timeout=120000)
    try:pg.wait_for_function('his.ready&&his.title',timeout=120000)
    except Exception as e:rows.append({'name':name,'cache':cache,'error':str(e),'pageerrors':errors.copy()});print(name,cache,'FAILED',errors,flush=True);break
    row=pg.evaluate('''()=>({...his,resources:performance.getEntriesByType('resource').map(e=>({url:new URL(e.name).pathname,type:e.initiatorType,start:e.startTime,end:e.responseEnd,body:e.encodedBodySize,transfer:e.transferSize})),nav:performance.getEntriesByType('navigation')[0].toJSON(),stageCount:HONRO_PROJECT.stages.filter(s=>!s.pending).length})''');row.update(name=name,cache=cache,rep=rep,encoding='gzip' if compress else 'identity',bytes=sum(x['encodedDataLength'] for x in events),requests=len(events),errors=errors.copy())
    pg.evaluate("document.addEventListener('click',()=>his.click=performance.now(),{once:true,capture:true})");pg.locator('.title-actions button.primary').click();pg.wait_for_function("HonroApp.screen!=='title'");pg.evaluate('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');row['entryMs']=pg.evaluate('performance.now()-his.click');row['screen']=pg.evaluate('HonroApp.screen');row['totalToScene']=max(row['ready'],row['title'])+row['entryMs'];rows.append(row);print(name,cache,rep,'title',round(row['title']),'ready',round(row['ready']),'entry',round(row['entryMs']),'B',row['bytes'],'stages',row['stageCount'],flush=True)
    if rep==0:pg.screenshot(path=str(O/f'history-{name}-{cache}-scene.png'))
   c.close()
  server.shutdown();server.server_close()
 b.close()
file=O/('history-'+os.environ.get('RUN','survey')+'.json');file.write_text(json.dumps(rows,indent=2));print(file)
