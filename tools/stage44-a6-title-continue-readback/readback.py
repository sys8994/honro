"""Read-only Stage44 title Continue, exact f6 and a6 Pages build roots; no fresh screenshot recapture."""
import argparse,contextlib,functools,hashlib,json,subprocess,threading
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit
from urllib.request import urlopen
D=Path(__file__).resolve().parent; P=json.loads((D/'PINS.json').read_bytes())
ob=(D/'observer.json').read_bytes();O=json.loads(ob)
READY="()=>document.documentElement.dataset.honroReady==='true' && typeof HonroCampaignLoader?.ensureStage==='function'"
def require(c,m):
    if not c:raise RuntimeError(m)
def sha(b):return hashlib.sha256(b).hexdigest()
def git(root,*args):return subprocess.check_output(['git','-C',str(root),*args],text=True,timeout=40).strip()
def closure(side,root):
    pin=P['arms'][side]
    require(git(root,'rev-parse','HEAD')==pin['head'] and git(root,'rev-parse','HEAD^{tree}')==pin['tree'],'wrong immutable game tree')
    require(not git(root,'status','--porcelain','--untracked-files=all'),'game checkout changed')
    shell=root/'HONRO.html'; manifest=root/'web/manifest.json'
    require(sha(shell.read_bytes())==pin['files']['HONRO.html'] and sha(manifest.read_bytes())==pin['files']['web/manifest.json'],'tracked shell/manifest')
    files={x['path']:x for x in json.loads(manifest.read_bytes())['files']}
    for k,v in pin['files'].items():
        f=root/k;require(f.is_file() and not f.is_symlink() and sha(f.read_bytes())==v,'closure '+k)
        if k in files:require(files[k]['sha256']==v,'manifest does not bind '+k)
    y=json.loads((root/pin['campaign']).read_bytes())
    require(y['stages'][43]==pin['map'] and y['stageLibraries'][43]==pin['provider'],'wrong active 44 campaign aliases')
    return files
def public_B(root):
    origin=P['origin']; out={}
    for k,v in P['arms']['B']['files'].items():
        with urlopen(origin+k,timeout=30) as r:
            raw=r.read();require(r.status==200 and r.geturl()==origin+k and sha(raw)==v and raw==(root/k).read_bytes(),'B Pages body mismatch '+k)
            out[k]={'bytes':len(raw),'sha256':v}
    return out
class ExactHTTP(SimpleHTTPRequestHandler):
    def send_head(self):
        u=urlsplit(self.path)
        if u.query or not u.path.startswith('/honro/') or any(t in u.path for t in ('..','%','\\')) or self.command not in ('GET','HEAD'):
            self.send_error(404);return None
        self.path='/'+u.path.removeprefix('/honro/')
        f=Path(self.translate_path(self.path))
        if not f.is_file() or not f.resolve().is_relative_to(Path(self.directory).resolve()):
            self.send_error(404);return None
        return super().send_head()
    def log_message(self,*_):pass
@contextlib.contextmanager
def server(root):
    h=ThreadingHTTPServer(('127.0.0.1',0),functools.partial(ExactHTTP,directory=str(root)))
    t=threading.Thread(target=h.serve_forever,daemon=True);t.start()
    try:yield f'http://127.0.0.1:{h.server_port}/honro/'
    finally:h.shutdown();h.server_close();t.join()

def main():
    import os
    from continue_probe import run_continue
    from playwright.sync_api import sync_playwright
    pp=argparse.ArgumentParser()
    for x in ('old','new','out'):pp.add_argument('--'+x,required=True,type=Path)
    a=pp.parse_args()
    require(P['enabled'] is True and os.getenv('GITHUB_REF')==P['qaRef'] and os.getenv('GITHUB_REPOSITORY')=='sys8994/honro','QA branch/run not approved')
    require(sha(ob)==P['observerSHA256'],'independent observer bytes changed')
    roots={'A':a.old.resolve(strict=True),'B':a.new.resolve(strict=True)}
    for side,root in roots.items():closure(side,root)
    a.out.mkdir(parents=True,exist_ok=False)
    public=public_B(roots['B'])
    (a.out/'PUBLIC-READBACK.json').write_text(json.dumps(public,indent=2)+'\n')
    with server(roots['A']) as aa,server(roots['B']) as bb,sync_playwright() as pw:
        br=pw.chromium.launch(headless=True,chromium_sandbox=True)
        try:run_continue(br,{'A':aa,'B':bb},P,O,a.out)
        finally:br.close()
if __name__=='__main__':main()
