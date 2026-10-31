"""Actual Chromium, synthetic Stage 33 tide state; no mission completion."""
import argparse,functools,json,sys,threading
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from pathlib import Path
from playwright.sync_api import sync_playwright
SOURCE=Path(__file__).resolve().parent;sys.path.insert(0,str(SOURCE));from browser_support import launch
p=argparse.ArgumentParser();p.add_argument('--root',required=True,type=Path);p.add_argument('--out',required=True,type=Path);a=p.parse_args();root=a.root.resolve();a.out.mkdir(parents=True,exist_ok=True)
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(root)));thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start();result={'root':str(root),'pageErrors':[]}
try:
 with sync_playwright() as pw:
  browser=launch(pw)
  try:
   page=browser.new_page(viewport={'width':1200,'height':800});page.on('pageerror',lambda e:result['pageErrors'].append(str(e)));page.goto(f'http://127.0.0.1:{server.server_port}/HONRO.html');page.wait_for_function('window.HonroApp&&window.HONRO_PROJECT',timeout=60000);result['measurement']=page.evaluate((SOURCE/'native-tide-cache-browser-case.js').read_text());assert not result['pageErrors'],result['pageErrors'];print(json.dumps(result,ensure_ascii=False))
  except Exception as error:
   result['failure']=str(error);print('FAIL',error);raise
  finally:browser.close()
finally:
 server.shutdown();server.server_close();thread.join(timeout=2);(a.out/'tide.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
