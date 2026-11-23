"""Disabled exact Pages readback draft. Fresh/cold Stage44 contexts only, no handling of live saves."""
import argparse,contextlib,functools,hashlib,io,json,subprocess,threading
from base64 import b64decode
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit
D=Path(__file__).resolve().parent; P=json.loads((D/'PINS.json').read_bytes())
ob=(D/'observer.json').read_bytes();O=json.loads(ob); OBS=(D/'observe-under.js').read_text()
READY="()=>document.documentElement.dataset.honroReady==='true' && typeof globalThis.HonroCampaignLoader?.ensureStage==='function'"
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
class ExactHTTP(SimpleHTTPRequestHandler):
    def send_head(self):
        u=urlsplit(self.path)
        if u.query not in ('','embedded=1') or not u.path.startswith('/honro/') or any(t in u.path for t in ('..','%','\\','/.git')) or self.command not in ('GET','HEAD'):
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
def collect(br,root,origin,side,who,lane,hashes,pose_override=None):
    W,H={'PC':(1440,900),'M':(390,844)}[who]
    ctx=br.new_context(viewport={'width':W,'height':H},device_scale_factor=1,service_workers='block')
    try:
        # All game browsing is exact loopback; external request capability exists only in public_B.
        ctx.route('**/*',lambda r:r.continue_() if r.request.url.startswith(origin) or r.request.url.startswith(('data:','blob:','about:')) else r.abort())
        p=ctx.new_page(); seen={}; errors=[]
        p.on('response',lambda r:seen.setdefault(r.url,r) if r.url.startswith(origin) else None)
        p.on('pageerror',lambda e:errors.append(str(e)))
        p.add_init_script('('+O['INIT']+')();'+O['INIT_SEED'])
        nav=p.goto(origin+'HONRO.html',wait_until='domcontentloaded',timeout=50000)
        require(nav and nav.status==200 and nav.url==origin+'HONRO.html' and not nav.from_service_worker,'HTTP shell')
        p.wait_for_function(READY,timeout=90000)
        p.evaluate('()=>{__honroResetDiagnosticSeed();HonroApp.audio?.configure?.({...HonroApp.profile.settings,music:false,sound:false});}')
        p.evaluate(O['LAUNCH'],44);p.locator('#battlecanvas').wait_for(state='visible')
        p.wait_for_function("()=>{const a=HonroApp;HonroStory.tick(a,performance.now());HonroStory.draw(a);return document.querySelector('#turn-banner')?.hidden!==false&&!a.dialogue&&a.engine?.b?.phase==='aim';}",timeout=15000,polling=125)
        if lane!='FINAL':
            p.evaluate('()=>HonroApp.scene._releaseDomainTiles()')
            p.evaluate(OBS,{'lane':lane,'expected':int(side in ('B','C'))})
        pose=pose_override if pose_override is not None else P['poses'][who];args=dict(id=44,mapId='stage-44',name='ordinary' if who=='PC' else 'west-min',ordinary=pose,dx=0 if who=='PC' else -1,dy=0,readback=False,fixedNow=O['PHASE'])
        m0=p.evaluate(O['FROZEN'],args)['meta']; d=p.evaluate(O['DECODE']);require(not d['failed'],'images decode')
        m=p.evaluate(O['FROZEN'],{**args,'readback':True})['meta'];raw=b64decode(p.evaluate(O['CANVAS']),validate=True)
        ph=sha(m.pop('signature').encode())
        require(sha(m0.pop('signature').encode())==ph==P['physics'] and m==m0,'physics/readback phase changed')
        require(m['actual']==dict(zip(('x','y','scale'),pose)) and m['round']==1 and m['phase']=='aim' and m['sceneTime']==2 and m['actorCount']==35,'unexpected fixed pose/turn')
        calls=p.evaluate('()=>window.__s44Under.undo()') if lane!='FINAL' else None
        if side=='B' and calls is not None:
            require(calls['under']>0 and calls['root']>0 and calls['crown']>0 and calls['skips']==(calls['under'] if lane=='UNDER_OMITTED' else 0),'incomplete ownership observer')
        require(not errors,str(errors))
        if side=='C' and calls is not None:require(calls['under']==calls['skips']==0 and calls['root']>0 and calls['crown']>0,'candidate draw suppressed wrong owner')
        needed=set(P['arms'][side]['files'])-{'web/manifest.json'}
        for k in needed:
            r=seen.get(origin+k)
            require(r and r.status==200 and not r.from_service_worker and sha(r.body())==P['arms'][side]['files'][k],'used HTTP route missing/changed '+k)
        # Audit every observed 200 asset with manifest pin; do not label scanner/no-response or range complete.
        actual={}
        for u,r in seen.items():
            k=u[len(origin):]
            if r.status==200 and k in hashes:
                require(not r.from_service_worker and sha(r.body())==hashes[k]['sha256'],'unbound asset '+k)
                actual[k]=hashes[k]['sha256']
        return raw,{'meta':m,'physical':ph,'calls':calls,'http':actual,'pngSHA256':sha(raw)}
    finally:ctx.close()
