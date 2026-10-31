"""Real Chromium cache-slot isolation measurements against an explicitly built checkout.

The same script accepts a baseline or candidate root. Profiles and dialogue are
prepared fixtures; this is not full play. Does not edit product or persist saves.
"""
import argparse
import functools
import hashlib
import json
import sys
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from playwright.sync_api import sync_playwright

SOURCE = Path(__file__).resolve().parent
sys.path.insert(0, str(SOURCE))
from browser_support import launch

parser = argparse.ArgumentParser()
parser.add_argument('--root', type=Path, required=True)
parser.add_argument('--out', type=Path, required=True)
parser.add_argument('--stages', default='1,11,14,22')
parser.add_argument('--dprs', default='1,2')
args = parser.parse_args()
root=args.root.resolve();args.out.mkdir(parents=True,exist_ok=True)
case=(SOURCE/'static-screen-cache-browser-isolate.js').read_text()
dpr_case=(SOURCE/'static-screen-cache-browser-dpr.js').read_text()
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
server=ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(root)))
thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
result={'root':str(root),'scope':'Real Chromium production renderer, prepared stage-entry profiles; no normal play or release proof',
        'entrySha256':hashlib.sha256((root/'HONRO.html').read_bytes()).hexdigest(),'cases':[],'errors':[]}
try:
 with sync_playwright() as pw:
  browser=launch(pw)
  try:
   for dpr in map(float,args.dprs.split(',')):
    for width,height in [(960,640),(390,844)]:
     for stage in map(int,args.stages.split(',')):
      row={'stage':stage,'viewport':[width,height],'dpr':dpr,'errors':[]};result['cases'].append(row)
      context=browser.new_context(viewport={'width':width,'height':height},device_scale_factor=dpr);page=context.new_page()
      page.on('pageerror',lambda error:row['errors'].append(str(error)))
      try:
       page.goto(f'http://127.0.0.1:{server.server_port}/HONRO.html');page.wait_for_function('window.HonroApp&&window.HONRO_PROJECT',timeout=60000)
       row['measurement']=page.evaluate(case,{'stage':stage,'width':width,'height':height,'mode':root.name})
       if row['errors']:raise RuntimeError('page errors: '+str(row['errors']))
       print('MEASURED',stage,width,height,'DPR',dpr,flush=True)
      except Exception as error:
       row['failure']=str(error);result['errors'].append({'stage':stage,'viewport':[width,height],'dpr':dpr,'error':str(error)})
       print('FAIL',stage,width,height,'DPR',dpr,str(error),flush=True)
      finally:
       context.close();(args.out/'results.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
  finally:browser.close()
finally:server.shutdown();server.server_close();thread.join(timeout=2)
if result['errors']:sys.exit(1)
