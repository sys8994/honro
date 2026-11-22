#!/usr/bin/env python3
"""Stage44 f6 stock phase recording, disposable local Chrome only; disabled by default."""
from __future__ import annotations
import argparse,base64,contextlib,functools,hashlib,io,json,subprocess,threading
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit
D=Path(__file__).resolve().parent
P=json.loads((D/'PINS.json').read_bytes())
observer_bytes=(D/'observer.json').read_bytes()
O=json.loads(observer_bytes)
OBS=(D/'observe.js').read_text()
def need(x,m):
    if not x: raise RuntimeError(m)
def sha(v): return hashlib.sha256(v).hexdigest()
def fact(v): return {'bytes':len(v),'sha256':sha(v)}
def gblob(v): return hashlib.sha1(f'blob {len(v)}\0'.encode()+v).hexdigest()
def git(root,*args):
    return subprocess.check_output(['git','-C',str(root),*args],stderr=subprocess.PIPE,timeout=30).rstrip(b'\n')
def checkout_preflight(root):
    """Read actual checked-out bytes AND compare to their immutable Git object."""
    root=root.resolve(strict=True)
    try: actual_root=Path(git(root,'rev-parse','--show-toplevel').decode())
    except subprocess.CalledProcessError as e: raise RuntimeError('--stock is not a real Git checkout') from e
    need(actual_root==root,'--stock must name checkout root')
    need(sha(observer_bytes)==P['parentTransport']['observerSha256'],'archived frozen state observer bytes changed')
    r=P['release']; need(git(root,'rev-parse','HEAD').decode()==r['head'],'not the exact f6 stock checkout HEAD')
    need(git(root,'rev-parse','HEAD^{tree}').decode()==r['tree'],'not the exact f6 checkout tree')
    need(not git(root,'status','--porcelain','--untracked-files=all'),'stock checkout is not pristine')
    pins={'HONRO.html':P['shell'],**P['qualifiedRoutes']}
    pins['web/manifest.json']={k:r['manifest'][k] for k in ('bytes','sha256')}
    actual={}
    for path,pin in pins.items():
        f=root/path
        need(f.is_file() and not f.is_symlink() and f.resolve().is_relative_to(root),f'missing/nonregular stock path: {path}')
        raw=f.read_bytes()
        bodyid=git(root,'rev-parse','HEAD:'+path).decode()
        need(fact(raw)==pin and gblob(raw)==bodyid,f'exact checkout byte/route mismatch: {path}')
        actual[path]={**pin,'git':bodyid}
    need(actual['web/manifest.json']['git']==r['manifest']['git'],'manifest Git differs')
    manifest=json.loads((root/'web/manifest.json').read_bytes())
    files={x['path']:{k:x[k] for k in ('bytes','sha256')} for x in manifest['files']}
    need(all(files.get(k)==v for k,v in P['qualifiedRoutes'].items()),'f6 manifest projection mismatch')
    return {'head':r['head'],'tree':r['tree'],'tracked':actual}
class ExactLocal(SimpleHTTPRequestHandler):
    def send_head(self):
        u=urlsplit(self.path)
        if u.query or not u.path.startswith('/honro/') or any(t in u.path for t in ('..','%','\\')) or self.command not in ('GET','HEAD'):
            self.send_error(404);return None
        self.path='/'+u.path.removeprefix('/honro/')
        candidate=Path(self.translate_path(self.path))
        if not candidate.is_file() or not candidate.resolve().is_relative_to(Path(self.directory).resolve()):
            self.send_error(404);return None
        return super().send_head()
    def log_message(self,*_): pass
@contextlib.contextmanager
def local_server(root):
    srv=ThreadingHTTPServer(('127.0.0.1',0),functools.partial(ExactLocal,directory=str(root)))
    thr=threading.Thread(target=srv.serve_forever,daemon=True);thr.start()
    try: yield f'http://127.0.0.1:{srv.server_port}/honro/'
    finally: srv.shutdown();srv.server_close();thr.join()
def bytes64(x): return base64.b64decode(x,validate=True)
def eval_stock(p,who,origin,lane):
    viewport={'PC':(1440,900),'M':(390,844)}[who]
    key,pose=next(iter(P['poses'][who].items()))
    args=dict(id=44,mapId='stage-44',name='west-min' if key=='west-min' else 'ordinary',ordinary=pose,dx=-1 if key=='west-min' else 0,dy=0,readback=False,fixedNow=O['PHASE'])
    routes={origin+k for k in P['qualifiedRoutes']}
    seen={}; errors=[]
    p.on('response',lambda r:seen.setdefault(r.url,r) if r.url in routes else None)
    p.on('pageerror',lambda e:errors.append(str(e)))
    p.add_init_script('('+O['INIT']+')();'+O['INIT_SEED'])
    u=origin+'HONRO.html';nav=p.goto(u,wait_until='domcontentloaded',timeout=50000)
    need(nav and nav.url==u and nav.status==200 and not nav.from_service_worker and fact(nav.body())==P['shell'],'wrong exact stock HTTP shell')
    p.wait_for_function("()=>document.documentElement.dataset.honroReady==='true' && typeof HonroCampaignLoader?.ensureStage==='function'",timeout=90000)
    p.evaluate("()=>{__honroResetDiagnosticSeed();HonroApp.audio?.configure?.({...HonroApp.profile.settings,music:false,sound:false});}")
    p.evaluate(O['LAUNCH'],44);p.locator('#battlecanvas').wait_for(state='visible')
    p.wait_for_function("()=>{const a=HonroApp;HonroStory.tick(a,performance.now());HonroStory.draw(a);return document.getElementById('turn-banner')?.hidden!==false&&!a.dialogue&&a.engine.b.phase==='aim';}",timeout=15000,polling=125)
    # No caught/stale constructor cache: observer before the original warm-up,
    # clear only terrain tiles by original API, never shared background/renderer.
    if lane in ('BACKDROP','OMITTED'):
        p.evaluate("()=>{const s=HonroApp.scene;if(typeof s._releaseDomainTiles!=='function')throw Error('cold reset unavailable');s._releaseDomainTiles();}")
        p.evaluate(OBS,lane=='OMITTED')
    meta0=p.evaluate(O['FROZEN'],args)['meta']
    decoded=p.evaluate(O['DECODE']); need(not decoded['failed'],'native asset decode')
    if lane=='BACKDROP': p.evaluate("()=>{window.__s44split.record=true;}")
    m=p.evaluate(O['FROZEN'],{**args,'readback':True})['meta']
    raw=bytes64(p.evaluate(O['CANVAS']))
    physical=sha(m.pop('signature').encode())
    need(sha(meta0.pop('signature').encode())==physical==P['physics'] and m==meta0,'native warm-up changed pose, render phase, or physical state')
    need(m['round']==1 and m['phase']=='aim' and m['sceneTime']==2 and m['actorCount']==35 and m['css']['w']==viewport[0],'unexpected game state')
    need(all(abs(m['actual'][v]-b)<1e-6 for v,b in zip(('x','y','scale'),pose)) and m['focus']['left']==pose[0] and (key!='west-min' or abs(m['zoomLimits']['min']-pose[2])<=1e-9),'wrong actual legacy pose')
    view=m['viewport'];need(all(view['left']<x0<x1<view['right'] and view['top']<y0<y1<view['bottom'] for x0,y0,x1,y1 in P['witnessWU'].values()),'required view lost')
    for k,pin in P['qualifiedRoutes'].items():
        r=seen.get(origin+k);need(r and r.status==200 and not r.from_service_worker and fact(r.body())==pin,'ordinary HTTP body changed: '+k)
    need(not errors,'normal app page error')
    witness=None; backdrop=None
    if lane in ('BACKDROP','OMITTED'):
        witness=p.evaluate("""()=>{const o=window.__s44split; const r={preCount:o.preCount,prep:o.prep,draws:o.draws,skips:o.skips,crown:o.crown,ctm:o.ctm}; o.undo();return r;}""")
        backdrop=bytes64(witness.pop('prep')) if witness.get('prep') else None
        if not backdrop:witness.pop('prep',None)
        need(witness['draws']>0 and witness['crown']>0 and witness['preCount']==int(lane=='BACKDROP'),'no authentic target or pre-world phase')
        need(witness['skips']==(witness['draws'] if lane=='OMITTED' else 0),'omission ran in the wrong phase/client')
    return raw,backdrop,{'meta':m,'physical':physical,'owner':witness,'raw':fact(raw)}
def history_comparison(who,raw,pix,sz):
    p=P['historyComparison'][who]; archived=P['raw'][who]
    fact0=fact(raw)
    h={'classification':'unchanged archived full frame','archived':archived,'new':{**fact0,'rgba':sha(pix)},'decodedFullExact':sha(pix)==archived['rgba'],'encodedExact':fact0=={k:archived[k] for k in ('bytes','sha256')}}
    need(sz==p['size'],'historical witness has different backing dimensions')
    if who=='M':
        return {**h,'historicalGate':h['decodedFullExact'],'outsideDelta':'0' if h['decodedFullExact'] else 'nonzero (no approved historical exception)'}
    left,top,right,bottom=p['rectangleExclusive']; W,H=sz
    need(0<=left<right<=W and 0<=top<bottom<=H,'historical documentation rectangle invalid')
    reference=bytes64(p['archivedROIRGBA_base64'])
    need(len(reference)==4*(right-left)*(bottom-top) and sha(reference)==p['archivedROIRGBA_SHA256'],'historical crop custody failed')
    masked=bytearray(pix)
    crop=bytearray()
    for y in range(top,bottom):
        first,last=4*(y*W+left),4*(y*W+right)
        crop.extend(pix[first:last]);masked[first:last]=bytes(last-first)
    outside=sha(masked)==p['archivedOutsideZeroROI_SHA256']
    points=[];alphaDiff=0;peak=0
    for k in range(0,len(reference),4):
        if crop[k:k+4]==reference[k:k+4]:continue
        points.append([left+(k//4)%(right-left),top+(k//4)//(right-left)])
        alphaDiff+=int(crop[k+3]!=reference[k+3])
        peak=max(peak,*(abs(crop[k+j]-reference[k+j]) for j in range(3)))
    bbox=[min(x for x,y in points),min(y for x,y in points),max(x for x,y in points),max(y for x,y in points)] if points else None
    return {**h,'classification':'historical Korean goal-label overlay only' if points and outside and not alphaDiff else (h['classification'] if h['decodedFullExact'] else 'historical mismatch not eligible'),'outsideExact':outside,'insideChanged':len(points),'alphaChangedInside':alphaDiff,'maxRGBInside':peak,'bboxInclusive':bbox,'historicalGate':outside and not alphaDiff}

def run(root,out,receipt):
    from PIL import Image
    from playwright.sync_api import sync_playwright
    def rgba(raw,sz):
        with Image.open(io.BytesIO(raw)) as im:
            need(list(im.size)==sz,'backing RGBA size')
            return im.convert('RGBA').tobytes()
    hold={'status':'HOLD','localOnly':True,'checkout':receipt,'cases':{},'blocking':[],'historicalR1Observed':P['historyComparison']['pcR1Observed']}
    out.mkdir(parents=True,exist_ok=False)
    def save(): (out/'READBACK.json').write_text(json.dumps(hold,indent=2)+'\n')
    save()
    views=[('PC',(1440,900)),('M',(390,844))]
    with local_server(root) as origin,sync_playwright() as pw:
        browser=pw.chromium.launch(headless=True,chromium_sandbox=True)
        try:
            need(browser.version=='151.0.7922.34','not the exact observer Chromium')
            full={who:{} for who,_ in views}
            for who,_ in views:hold['cases'][who]={'status':'PENDING_ORIGINAL_CONTROLS','lanes':{}}
            def collect(who,dims,lane):
                row=hold['cases'][who]['lanes'];c=None;w=None
                try:
                    c=browser.new_context(viewport=dict(zip(('width','height'),dims)),device_scale_factor=1,service_workers='block')
                    c.route('**/*',lambda r:r.continue_() if r.request.url.startswith(origin) or r.request.url.startswith(('data:','blob:','about:')) else r.abort())
                    raw,back,w=eval_stock(c.new_page(),who,origin,lane)
                    backing=w['meta']['backing'];pix=rgba(raw,backing)
                    full[who][lane]=(raw,pix,w)
                    row[lane]={**w,'rgba':sha(pix),'status':'CAPTURED'}
                    dest={'FINAL':'STOCK-FINAL','RESTORED':'STOCK-RESTORED','OMITTED':'ROOT-OMITTED-FINAL'}.get(lane)
                    if dest:(out/f'{who}-{dest}.png').write_bytes(raw)
                    if lane=='BACKDROP':
                        need(back is not None,'missing true pre-world bytes')
                        (out/f'{who}-BACKDROP-PRE-WORLD.png').write_bytes(back)
                        row[lane]['layer']={**fact(back),'rgba':sha(rgba(back,backing))}
                        (out/f'{who}-BACKDROP-PASSTHROUGH-FINAL.png').write_bytes(raw)
                    save()
                except Exception as e:
                    row[lane]={'status':'HOLD','error':repr(e),'observed':row.get(lane) or w}
                    hold['blocking'].append({'who':who,'lane':lane,'error':repr(e)});save()
                finally:
                    if c is not None:c.close()

            # Archive both untouched controls for BOTH devices before entering
            # any possibly failing instrumented or historical-comparison lane.
            for lane in ('FINAL','RESTORED'):
                for who,dims in views:collect(who,dims,lane)

            eligible=set()
            for who,dims in views:
                row=hold['cases'][who]; a=full[who].get('FINAL');r=full[who].get('RESTORED')
                try:
                    need(a and r,'missing untouched control output(s)')
                    row['history']=history_comparison(who,a[0],a[1],a[2]['meta']['backing'])
                    equal=(a[0]==r[0] and a[1]==r[1] and a[2]['meta']==r[2]['meta'] and a[2]['physical']==r[2]['physical'])
                    row['untouchedControlsPNGAndRGBAExact']=equal;save()
                    need(equal,'contemporaneous untouched FINAL vs RESTORED disagreement; no exception')
                    need(row['history']['historicalGate'],'historical reference geometry/alpha outside documented overlay changed')
                    eligible.add(who);row['status']='CONTEMPORANEOUS_CONTROLS_EXACT';save()
                except Exception as e:
                    row['status']='HOLD_CONTROLS';hold['blocking'].append({'who':who,'lane':'ORIGINAL_CONTROLS','error':repr(e)});save()

            # Continue to capture independent available evidence even if the
            # other device/phase fails; overall HOLD remains strict.
            for lane in ('BACKDROP','OMITTED'):
                for who,dims in views:
                    if who in eligible:collect(who,dims,lane)
                    else:hold['cases'][who]['lanes'][lane]={'status':'SKIPPED_INVALID_CONTROLS'}
            for who,_ in views:
                if who not in eligible:continue
                row=hold['cases'][who]; f=full[who]
                try:
                    need(all(x in f and row['lanes'].get(x,{}).get('status')=='CAPTURED' for x in ('FINAL','RESTORED','BACKDROP','OMITTED')),'missing separately validated output(s)')
                    a,px,w=f['FINAL']; n0,r0,ow=f['BACKDROP']
                    need(all(v[2]['meta']==w['meta'] and v[2]['physical']==w['physical'] for v in f.values()),'arms not same frozen view')
                    need(n0==a and r0==px,'current BACKDROP pass-through vs current FINAL disagreement; no exception')
                    need(f['OMITTED'][1]!=px,'owner omission had no visible effect')
                    need(ow['owner']['ctm']==f['OMITTED'][2]['owner']['ctm'] and ow['owner']['crown']==f['OMITTED'][2]['owner']['crown'],'camera path/target coverage diverged across arms')
                    row['fullStockNativeEquality']=True;row['status']='PASS_STOCK_PHASES';save()
                except Exception as e:
                    row['status']='HOLD_NATIVE';hold['blocking'].append({'who':who,'lane':'PHASE_COMPARISON','error':repr(e)});save()
        finally: browser.close()
    need(not hold['blocking'] and all(r['status']=='PASS_STOCK_PHASES' for r in hold['cases'].values()),'one or more exact stock/phase gates failed, see per-device receipts')
    hold['status']='PASS_ACTUAL_STOCK_PHASES_ONLY_NO_CANDIDATE';save()

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument('--stock',type=Path,required=True)
    ap.add_argument('--out',type=Path)
    ap.add_argument('--preflight-only',action='store_true')
    a=ap.parse_args()
    if not a.preflight_only:need(P['enabled'] is True and a.out is not None,'disabled locally; no browser ran')
    receipt=checkout_preflight(a.stock)
    print(json.dumps(receipt,indent=2))
    if not a.preflight_only:run(a.stock.resolve(),a.out.resolve(),receipt)
if __name__=='__main__':main()
