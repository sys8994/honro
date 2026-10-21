"""Alternating local snapshot comparison. Does not measure real Android or Pages."""
import gzip,json,os,sys
from pathlib import Path
from functools import partial
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from threading import Thread
ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT/'tests'))
from browser_support import launch
from playwright.sync_api import sync_playwright
OUT=ROOT/'_local/reports/entry-render';OUT.mkdir(parents=True,exist_ok=True)
roots={name:Path(os.environ[key]) for name,key in [('before','HONRO_ENTRY_BEFORE'),('candidate','HONRO_ENTRY_CANDIDATE')]}
save=json.loads(Path(os.environ['HONRO_ENTRY_SAVE']).read_text());rows=[];servers=[];urls={}
for name,root in roots.items():
 packed={str(f):gzip.compress(f.read_bytes(),compresslevel=6,mtime=0) for f in [root/'HONRO.html',*root.joinpath('web').rglob('*')] if f.is_file() and f.suffix in ['.js','.json','.css','.html']}
 def handler_factory(packed):
  class H(SimpleHTTPRequestHandler):
   def log_message(self,*args):pass
   def handle(self):
    try:super().handle()
    except (BrokenPipeError,ConnectionResetError):pass
   def end_headers(self):self.send_header('Cache-Control','public,max-age=600');super().end_headers()
   def do_GET(self):
    f=self.translate_path(self.path)
    if f not in packed:return super().do_GET()
    body=packed[f];self.send_response(200);self.send_header('Content-Type',self.guess_type(f));self.send_header('Content-Encoding','gzip');self.send_header('Vary','Accept-Encoding');self.send_header('Content-Length',str(len(body)));self.end_headers();self.wfile.write(body)
  return H
 server=ThreadingHTTPServer(('127.0.0.1',0),partial(handler_factory(packed),directory=str(root)));Thread(target=server.serve_forever,daemon=True).start();servers.append(server);urls[name]=f'http://127.0.0.1:{server.server_port}/HONRO.html'
with sync_playwright() as p:
 b=launch(p)
 for kind in ['new','continue21']:
  for rep in range(int(os.environ.get('REPS','5'))):
   for name in (['before','candidate'] if rep%2==0 else ['candidate','before']):
    c=b.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True);pg=c.new_page();errors=[];pg.on('pageerror',lambda e:errors.append(str(e)))
    pg.add_init_script('localStorage.clear();'+('localStorage.setItem("honro-first-act-profile-1",'+json.dumps(json.dumps(save))+');' if kind=='continue21' else ''))
    pg.add_init_script('''window.entryMeasure={};new MutationObserver(()=>{if(document.documentElement.dataset.honroReady)entryMeasure.ready??=performance.now()}).observe(document,{subtree:true,attributes:true});document.addEventListener('click',()=>{entryMeasure.click=performance.now();requestAnimationFrame(()=>requestAnimationFrame(()=>entryMeasure.present=performance.now()))},{capture:true,once:true});''')
    cd=c.new_cdp_session(pg);cd.send('Network.enable');cd.send('Emulation.setCPUThrottlingRate',{'rate':4});cd.send('Network.emulateNetworkConditions',{'offline':False,'latency':40,'downloadThroughput':2*1024*1024,'uploadThroughput':1024*1024})
    for cache in ['cold','warm']:
     pg.goto(urls[name]);pg.wait_for_function('entryMeasure.ready');pg.locator('.title-actions button.primary').click();pg.wait_for_function('entryMeasure.present');pg.wait_for_function("HonroApp.audio.context?.state==='running'")
     row=pg.evaluate('({ready:entryMeasure.ready,entry:entryMeasure.present-entryMeasure.click,screen:HonroApp.screen,audio:HonroApp.audio.context.state})');row.update(kind=kind,rep=rep,name=name,cache=cache,errors=errors.copy());rows.append(row);print(name,kind,rep,cache,round(row['ready']),round(row['entry']),flush=True)
    c.close()
 b.close()
for server in servers:server.shutdown();server.server_close()
(OUT/(os.environ.get('RUN','paired')+'.json')).write_text(json.dumps(rows,indent=2))
