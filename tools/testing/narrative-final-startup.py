"""Compare the same uncompressed cold title JS/JSON boundary against aa76.
No claim about live Pages compression, FPS, network latency or physical phones.
"""
import json,subprocess,sys,tarfile,tempfile
from pathlib import Path
from functools import partial
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from threading import Thread
ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT/'tests'))
from playwright.sync_api import sync_playwright
from browser_support import launch
OUT=ROOT/'_local/reports/narrative-final-current';OUT.mkdir(parents=True,exist_ok=True)
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
rows=[]
with tempfile.TemporaryDirectory(prefix='honro-aa76-startup-') as temp:
 proc=subprocess.Popen(['git','archive','--format=tar','aa76d27cf6587a2e70091777699505ba9ffc0a38','HONRO.html','web'],cwd=ROOT,stdout=subprocess.PIPE)
 with tarfile.open(fileobj=proc.stdout,mode='r|') as archive:archive.extractall(temp,filter='data')
 assert proc.wait()==0
 with sync_playwright() as pw:
  browser=launch(pw)
  for label,root in [('aa76',Path(temp)),('final',ROOT)]:
   server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(root)));Thread(target=server.serve_forever,daemon=True).start();ctx=browser.new_context(viewport={'width':390,'height':844});page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)));cdp=ctx.new_cdp_session(page);cdp.send('Network.enable');cdp.send('Network.setCacheDisabled',{'cacheDisabled':True})
   page.goto(f'http://127.0.0.1:{server.server_port}/HONRO.html');page.wait_for_function('document.documentElement.dataset.honroReady',timeout=90000);page.wait_for_timeout(400)
   resources=page.evaluate('performance.getEntriesByType("resource").filter(e=>/\\.(?:js|json)$/.test(new URL(e.name).pathname)).map(e=>({path:new URL(e.name).pathname,body:e.encodedBodySize,transfer:e.transferSize}))')
   assert not errors,errors;rows.append({'label':label,'requests':len(resources),'body':sum(r['body'] for r in resources),'transfer':sum(r['transfer'] for r in resources),'duplicateURLs':len(resources)-len(set(r['path'] for r in resources)),'resources':resources,'errors':errors});ctx.close();server.shutdown();server.server_close()
  browser.close()
assert rows[0]['requests']==72 and rows[0]['body']==4402944,rows[0]
assert rows[1]['duplicateURLs']==0
report={'sourceCommit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'conditions':'New Chromium context, disabled cache, uncompressed local HTTP, title ready+400ms before input; JS/JSON resource bodies.','baselineMasterBody':4185192,'rows':rows,'deltaFromAa76':{'requests':rows[1]['requests']-rows[0]['requests'],'body':rows[1]['body']-rows[0]['body']},'finalVsOriginalMasterPercent':round((rows[1]['body']/4185192-1)*100,2),'limits':__doc__}
(OUT/'startup.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps({k:v for k,v in report.items() if k!='rows'},ensure_ascii=False));print([(r['label'],r['requests'],r['body'],r['transfer']) for r in rows])
