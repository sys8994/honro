"""Strict node-free Stage34 SE observational carrier. Never modifies Pages or repository."""
import base64, hashlib, io, json, os, subprocess, sys, time
from pathlib import Path
from urllib.parse import urlsplit
from urllib.request import build_opener, Request, HTTPRedirectHandler
from PIL import Image, ImageChops

H=Path(__file__).resolve().parent
P=json.loads((H/'PINS.json').read_text()); ENTRY=json.loads((H/'entry.json').read_text())
BASE=P['base']; LIVE=P['authority']['release']; BRANCH='qa/stage34-se-owner-2939958'
FILES={'.github/workflows/stage34-se-owner.yml',
       *('tools/stage34-se-owner/'+n for n in ('run.py','observe.js','PINS.json','entry.json'))}
OBSERVER=(H/'observe.js').read_text()
OUT=Path(os.environ.get('STAGE34_QA_OUT','evidence'))
PROOF={'authority':P['authority'],'originalCarrier':P['carrierSource'],'scope':'Read-only actual Stage34 two SE camera owner observation (not art or broad game QA).','status':'INIT','poses':{},'failures':[]}
sha=lambda b:hashlib.sha256(b).hexdigest()
FACTS=lambda b:dict(bytes=len(b),sha256=sha(b))
def git(*s):return subprocess.check_output(['git',*s])
def save():
    OUT.mkdir(parents=True,exist_ok=True)
    (OUT/'PROOF.json').write_text(json.dumps(PROOF,indent=2,ensure_ascii=False)+'\n')
def fail(err,pose=None):
    PROOF['failures'].append({'pose':pose,'reason':repr(err)});save()
def check(name,b):
    want=P['responsePins'][name]
    assert FACTS(b)==want,('pinned bytes mismatch',name,FACTS(b),want)
    return b
class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self,*a,**k):
        raise RuntimeError('signed Pages origin redirected')
def live_read(k):
    u=BASE+k
    with build_opener(NoRedirect).open(Request(u,headers={'Accept-Encoding':'identity','Cache-Control':'no-cache'}),timeout=25) as r:
        assert r.status==200 and r.geturl()==u
        return check(k,r.read(P['responsePins'][k]['bytes']+1))
def source_gate():
    head=os.environ['GITHUB_SHA']
    assert os.environ['GITHUB_REF']=='refs/heads/'+BRANCH and os.environ['GITHUB_EVENT_NAME']=='push'
    FIRST='175d9558b57047e03e9887a3a965b1d809c7b4d4'
    assert git('rev-list','--parents','-n1','HEAD').decode().split()==[head,FIRST]
    assert git('show','-s','--format=%P',FIRST).decode().strip()==LIVE
    assert set(git('diff','--name-status','--no-renames',FIRST,head).decode().splitlines())=={
        'M\t.github/workflows/stage34-se-owner.yml','M\ttools/stage34-se-owner/run.py'}
    assert git('rev-parse',LIVE+'^{tree}').decode().strip()==P['authority']['tree']
    assert git('rev-parse',LIVE+':web/manifest.json').decode().strip()==P['authority']['retainedManifestGitBlob']
    assert git('status','--porcelain=v1','-z')==b''
    assert set(git('diff','--name-status','--no-renames',LIVE,head).decode().splitlines())=={'A\t'+f for f in FILES}
    core=('HONRO.html','web/manifest.json',P['entry'],P['campaign'],P['map'],P['packet'],'web/runtime/ordered-common-15.3dd35880565c92f2.js')
    local={k:check(k,git('show',LIVE+':'+k)) for k in core}
    manifest=json.loads(local['web/manifest.json']); camp=json.loads(local[P['campaign']]); map=json.loads(local[P['map']])
    row={f['path']:{k:f[k] for k in ('bytes','sha256')} for f in manifest['files']}
    assert manifest['gameEntry']==P['entry'] and manifest['project']==P['campaign']
    assert camp['stages'][33]==P['map'] and camp['stageLibraries'][33]==P['packet'] and camp['assetEncodings']['stageLibraries'][33]=='json'
    assert map['id']==P['mapId'] and map['metadata']['stageId']==34
    assert all(k in ('HONRO.html','web/manifest.json') or row[k]==f for k,f in P['responsePins'].items())
    packet={a['id']:a for a in json.loads(local[P['packet']])}
    for eid,v in P['owners'].items():
        assert sum(e['id']==eid and e['assetId']==v['asset'] for e in map['elements'])==1 and v['asset'] in packet
        assert not packet[v['asset']].get('collision')
    try:
        served={k:FACTS(live_read(k)) for k in core}
    except Exception as e:
        PROOF['status']='PAGES_SOURCE_HOLD';fail(e);raise
    PROOF['signedSource']=served;PROOF['status']='SOURCE_PASS';save()

def snapshot(png,f):
    im=Image.open(io.BytesIO(png)).convert('RGBA')
    assert list(im.size)==f['pixels']
    return im,{'pngSHA256':sha(png),'fullRGBAsha256':sha(im.tobytes()),'roiRGBAsha256':sha(im.crop(f['roiPx']).tobytes())}
def path_of(url):
    p=urlsplit(url)
    if not url.startswith(BASE) or p.query or p.fragment:return None
    return url[len(BASE):]
def drain_signed_http(page,hits,errors,blobs,pending,seconds=6.0):
    """Finish ordinary request bursts and verify every event, including duplicates."""
    deadline=time.monotonic()+seconds
    i=0; quiet=0; seen={}
    while time.monotonic()<deadline:
        assert not errors,errors
        while i<len(hits):
            assert time.monotonic()<deadline,('signed HTTP drain deadline',i,len(hits))
            rel,response=hits[i]
            if response.request in pending:break
            i+=1
            seen[rel]=FACTS(check(rel,response.body()))
        before=(i,len(blobs))
        generated=set(page.evaluate("()=>[...window.__honroObserver.blobs]"))
        page.wait_for_timeout(100)
        assert not errors,errors
        idle=(before==(len(hits),len(blobs)) and not pending and set(blobs)<=generated)
        quiet=(quiet+1) if idle else 0
        if quiet==3:
            missing=set(P['expectedNormal'])-set(seen)
            assert not missing,('missing required actual responses',sorted(missing))
            return seen,{'verifiedEvents':i,'uniquePaths':len(seen),'quietMilliseconds':300,'pending':0}
    raise AssertionError(('signed HTTP drain deadline',i,len(hits),len(pending),
                          sorted(set(P['expectedNormal'])-set(seen)),errors))

def capture(browser,tag,shot,mode):
    vw,vh=shot['viewportCSS']
    ctx=browser.new_context(viewport={'width':vw,'height':vh},device_scale_factor=1,service_workers='block')
    assert ctx.storage_state()=={'cookies':[],'origins':[]}
    p=ctx.new_page();p.set_default_timeout(25000);errors=[];hits=[];blobs=[];audio=[];pending=set()
    def route(r):
        q=r.request; rel=path_of(q.url)
        if (q.method=='GET' and (rel in P['responsePins'] or (rel in P['media'] and q.resource_type=='media'))) or q.url.startswith(('blob:https://sys8994.github.io/','data:')):
            return r.continue_()
        errors.append(['unexpected request',q.method,q.url]);return r.abort()
    ctx.route('**/*',route)
    def response(r):
        url=r.url; rel=path_of(url)
        if url.startswith('blob:https://sys8994.github.io/') and r.status==200 and r.request.method=='GET':
            blobs.append(url)
        elif rel in P['media'] and r.request.resource_type=='media' and r.status in (200,206):
            audio.append([rel,r.status])
        elif rel in P['responsePins'] and r.status==200 and r.request.method=='GET':
            hits.append((rel,r))
        else:errors.append(['unexpected response',r.status,url])
    def abort(r):
        rel=path_of(r.url)
        if rel in P['media'] and r.resource_type=='media' and r.failure=='net::ERR_ABORTED':
            audio.append([rel,'aborted'])
        else:errors.append(['request failed',r.url,r.failure])
    # HTTP activity pending tracks even a signed response whose body has not arrived.
    p.on('request',lambda req:pending.add(req) if path_of(req.url) in P['responsePins'] else None)
    p.on('requestfinished',pending.discard)
    p.on('requestfailed',pending.discard)
    p.on('response',response);p.on('requestfailed',abort);p.on('pageerror',lambda e:errors.append(['pageerror',str(e)]))
    p.add_init_script('('+ENTRY['INIT']+')()')
    try:
        shell=p.goto(BASE+'HONRO.html',wait_until='domcontentloaded')
        assert shell and shell.url==BASE+'HONRO.html' and shell.status==200
        check('HONRO.html',shell.body())
        p.wait_for_function("()=>document.documentElement.dataset.honroReady==='true'&&typeof window.HonroCampaignLoader?.ensureStage==='function'")
        p.evaluate(ENTRY['LAUNCH'],34); canvas=p.locator('#battlecanvas');canvas.wait_for(state='visible')
        p.wait_for_function("()=>{const a=HonroApp;HonroStory.tick(a,performance.now());HonroStory.draw(a);return Boolean(document.getElementById('turn-banner')?.hidden!==false&&!a.dialogue);}",timeout=12000)
        p.evaluate("()=>HonroApp.scene.render(HonroApp.engine,0,'',.6,false,0)")
        q={'id':34,'mapId':P['mapId'],'name':'southeast','dx':1,'dy':1,'ordinary':[],'readback':False}
        f=p.evaluate(ENTRY['PARK'],q); dd=p.evaluate(ENTRY['DECODE'])
        assert dd['registered']>0 and not dd['failed'] and f==p.evaluate(ENTRY['PARK'],{**q,'readback':True})
        assert sha(f['signature'].encode())==shot['physicsSHA256']
        assert all(f[k]==shot[k] for k in ('actual','viewport','css','backing','focus','actorCount','tide','sceneTime','phase','round'))
        watch=None
        if mode!='U':
            watch=p.evaluate(OBSERVER,{'worldROI':P['roi'],'owners':P['owners'],'mapId':P['mapId'],
                                       'ablate':None if mode=='AA' else mode,'snap':mode=='AA'})
            assert watch.pop('state')==f['signature']
            for i,o in enumerate(watch.pop('raw')):
                for step in ('before','after'):
                    blob=base64.b64decode(o[step],validate=True);n=f'{tag}-{i:02}-{step}.png'
                    Image.frombytes('RGBA',tuple(o['rect'][2:]),blob).save(OUT/n)
                    o[step]={'name':n,'rgbaSHA256':sha(blob)}
                watch.setdefault('raw',[]).append(o)
        png_bytes=canvas.screenshot(animations='disabled'); img,receipts=snapshot(png_bytes,shot)
        seen,transport=drain_signed_http(p,hits,errors,blobs,pending)
        # Reuse the first actual captured PNG bytes rather than re-rendering or resaving.
        return img,{**receipts,'camera':{k:f[k] for k in ('actual','viewport','phase','round','sceneTime')},
                    'stateSHA256':shot['physicsSHA256'],'watched':watch,'http':seen,'httpDrain':transport,'audio':audio,'registeredDecode':dd['registered']},png_bytes
    finally:ctx.close()

def summary(a,b,rect):
    rgb=ImageChops.difference(a,b)
    def stats(im):
        return {'changed':sum(any(v) for v in im.getdata()),'maxChannel':max(a[1] for a in im.getextrema())}
    return {'full':stats(rgb),'ROI':stats(rgb.crop(rect))}
def pose(browser,tag,f):
    row={'archived':{k:f[k] for k in ('pngSHA256','fullRGBAsha256','roiRGBAsha256','roiPx','actorCount')}};PROOF['poses'][tag]=row
    def record(mode):
        pic,row[mode],png=capture(browser,tag,f,mode);(OUT/f'{tag}-{mode}.png').write_bytes(png); save(); return pic
    a=record('U')
    assert row['U']['roiRGBAsha256']==f['roiRGBAsha256'],('archive exact SE ROI failed',tag)
    z=record('AA');row['AAvU']=summary(a,z,f['roiPx']);save()
    assert row['AAvU']['full']['changed']==0,('observer alters actual renderer',tag)
    for mode in ('F','B','FORE'):
        z=record(mode);row[mode]['differenceVsU']=summary(a,z,f['roiPx']);save()
    row['complete']=True;save()
def main():
    from playwright.sync_api import sync_playwright
    save()
    try:
        source_gate()
        with sync_playwright() as p:
            browser=p.chromium.launch(headless=True); PROOF['browser']=browser.version
            assert browser.version==P['browser']
            for tag in P['frames']:
                try:pose(browser,tag,P['frames'][tag])
                except Exception as e:fail(e,tag)
            browser.close()
        assert not PROOF['failures'] and all(PPROOF.get('complete') for PPROOF in PROOF['poses'].values())
        PROOF['status']='OBSERVATION_PASS'
    except Exception as e:
        if PROOF['status']!='PAGES_SOURCE_HOLD':
            PROOF['status']='HOLD';fail(e)
        raise
    finally:save()
if __name__=='__main__':
    main()
