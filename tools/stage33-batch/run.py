"""Run only from a parent-authorized official no-deploy batch after the single normal build."""
import functools,json,os,re,sys,threading
from pathlib import Path
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from guard import D,P,need,obj,rd,setup
import capture
w=Path(sys.argv[1]).resolve();v=obj(Path(sys.argv[2]))
# Parent runner owns the exact case, explicit separate approval, and registered Pages authority.
need(v.get('enabled') is True,'batch carrier disabled')
base=v['base']
need(base.get('head') and base.get('tree') and base.get('manifest') and base.get('pagesRun') and base.get('pagesJob') and base.get('publishedAt') and base['head']!=P['stage7']['previousHead'],'exact Stage7 live parent authority missing or wrong')
need(w.is_relative_to(Path(os.environ['RUNNER_TEMP']).resolve()) and not (os.getenv('GH_TOKEN')or os.getenv('GITHUB_TOKEN')),'not isolated no-deploy environment')
need(all(base[k]==P['expectedPostStage7'][k]for k in ('head','tree','registry','manifest')),'Stage7 successor expectation does not match parent authority')
P['manifest']=base['manifest']
out=w/'OUT'/'stage33';out.mkdir()
setup(w,out,base)
history=w/'STAGE33-HISTORICAL';history.mkdir()
for name,f in [('HONRO.html','old-c60-HONRO.html'),('OLD-2C4.html','old-2c4-HONRO.html'),('OLD-0B9.html','old-0b9-HONRO.html')]:
 (history/name).write_bytes(rd(D,f))
for k in ('web','assets'):(history/k).symlink_to(w/'A'/k,target_is_directory=True)
class Handler(SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
server=ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Handler,directory=str(history)))
thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
try:
 capture.A=f'http://127.0.0.1:{server.server_port}/'
 capture.B='http://127.0.0.1:18882/'
 capture.main(out)
finally:
 server.shutdown();server.server_close();thread.join(4)
