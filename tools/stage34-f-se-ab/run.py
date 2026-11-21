"""Strict node-free Stage34 SE observational carrier. Never modifies Pages or repository."""
import base64, hashlib, io, json, os, subprocess, sys, time, math, re
from pathlib import Path
from urllib.parse import urlsplit
from urllib.request import build_opener, Request, HTTPRedirectHandler
from PIL import Image, ImageChops, ImageDraw, ImageFilter

H=Path(__file__).resolve().parent
P=json.loads((H/'PINS.json').read_text()); ENTRY=json.loads((H/'entry.json').read_text())
BASE=P['base']; LIVE=P['authority']['release']; BRANCH='qa/stage34-f-se-ab-71fb'
FILES={'.github/workflows/stage34-f-se-ab.yml',
       *('tools/stage34-f-se-ab/'+n for n in ('run.py','observe.js','PINS.json','entry.json','FACET.json'))}
OBSERVER=(H/'observe.js').read_text()
FACET=json.loads((H/'FACET.json').read_text()); TEST_PACKET=None
OUT=Path(os.environ.get('STAGE34_QA_OUT','evidence'))
PROOF={'authority':P['authority'],'originalCarrier':P['carrierSource'],'scope':'Stage34 one F response replacement in isolated PC/M apps. Diagnostic only; not native compile, aesthetic acceptance, gameplay, or release proof.','status':'INIT','poses':{},'failures':[]}
sha=lambda b:hashlib.sha256(b).hexdigest()
FACTS=lambda b:dict(bytes=len(b),sha256=sha(b))
def git(*s):return subprocess.check_output(['git',*s])
def save():
    OUT.mkdir(parents=True,exist_ok=True)
    (OUT/'PROOF.json').write_text(json.dumps(PROOF,indent=2,ensure_ascii=False)+'\n')
def fail(err,pose=None):
    PROOF['failures'].append({'pose':pose,'reason':repr(err)});save()
def check(name,b,candidate=False):
    want=FACET['candidatePacket'] if candidate and name==P['packet'] else P['responsePins'][name]
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
def serialized(v):
    return json.dumps(v,ensure_ascii=False,separators=(',',':')).encode()

def synthesize(stock):
    assert FACTS(stock)==FACET['stockPacket']
    rows=json.loads(stock); found=[a for a in rows if a['id']==FACET['id']]; assert len(found)==1
    a=found[0]; old=serialized(a)
    assert sha(old)==FACET['originalAssetSHA256'] and stock.count(old)==1
    vec=a
    for k in FACET['path']:vec=vec[k]
    assert not a.get('collision');vec.extend(FACET['patch'])
    new=serialized(a); assert sha(new)==FACET['candidateAssetSHA256']
    result=stock.replace(old,new,1)
    assert result.replace(new,old,1)==stock and json.loads(result)==rows
    assert FACTS(result)==FACET['candidatePacket'] and len(result)<4194304
    return result

def source_gate():
    global TEST_PACKET
    head=os.environ['GITHUB_SHA']
    assert os.environ['GITHUB_REF']=='refs/heads/'+BRANCH and os.environ['GITHUB_EVENT_NAME']=='push'
    assert git('rev-list','--parents','-n1','HEAD').decode().split()==[head,LIVE]
    assert git('rev-parse',LIVE+'^{tree}').decode().strip()==P['authority']['tree']
    assert git('rev-parse',LIVE+':web/manifest.json').decode().strip()==P['authority']['retainedManifestGitBlob']
    assert git('status','--porcelain=v1','-z')==b''
    assert set(git('diff','--name-status','--no-renames',LIVE,head).decode().splitlines())=={'A\t'+f for f in FILES}
    core=('HONRO.html','web/manifest.json',P['entry'],P['campaign'],P['map'],P['packet'],P['renderer'],P['compactLoader'])
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
    TEST_PACKET=synthesize(local[P['packet']])
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
def drain_signed_http(page,hits,errors,blobs,pending,candidate=False,seconds=8.0):
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
            seen[rel]=FACTS(check(rel,response.body(),candidate))
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
    p=ctx.new_page();p.set_default_timeout(25000);errors=[];hits=[];blobs=[];audio=[];pending=set(); replaced=[]
    def route(r):
        q=r.request; rel=path_of(q.url)
        if mode=='B' and q.method=='GET' and rel==P['packet']:
            # No URL/code/loader mutation. Verify the original official HTTP body before
            # supplying a different signed body to this fresh test browser alone.
            try:
                rr=r.fetch(max_redirects=0,timeout=18000)
                assert rr.status==200 and rr.url==q.url
                check(rel,rr.body()); assert not replaced
                hdr={k:v for k,v in rr.headers.items() if k.lower() not in ('content-encoding','content-length','etag','last-modified','content-range','content-digest','digest')}
                hdr.update({'content-type':'application/json','cache-control':'no-store'})
                r.fulfill(status=200,headers=hdr,body=TEST_PACKET);replaced.append(rel)
                return
            except Exception as ex:
                errors.append(['single-response intercept rejected',repr(ex)]);return r.abort()
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
    p.on('requestfinished',lambda req:pending.discard(req))
    p.on('requestfailed',lambda req:pending.discard(req))
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
        akey='candidateAssetSHA256' if mode=='B' else 'originalAssetSHA256'
        renderedAsset=p.evaluate("""id=>{const h=HonroApp, pack=HONRO_PROJECT.library.filter(x=>x.id===id);
          const lands=HonroTerrainDomain.materialLandmarks(h.engine.b),active=lands.filter(l=>l.asset?.id===id);
          if(pack.length!==1||active.length!==1||JSON.stringify(pack[0].vector)!==JSON.stringify(active[0].asset.vector))throw Error('F owner missing or actual render vector differs');
          return JSON.stringify(pack[0]);}""",FACET['id'])
        assert sha(renderedAsset.encode())==FACET[akey],('F binding',mode)
        png_bytes=canvas.screenshot(animations='disabled'); img,receipts=snapshot(png_bytes,shot)
        raw0=base64.b64decode(p.evaluate("()=>HonroApp.scene.canvas.toDataURL('image/png').split(',')[1]"),validate=True)
        w=p.evaluate(OBSERVER,{'worldROI':P['roi'],'owners':P['owners'],'mapId':P['mapId'],'ablate':None,'snap':True})
        assert w.pop('state')==f['signature']
        obs=base64.b64decode(p.evaluate("()=>HonroApp.scene.canvas.toDataURL('image/png').split(',')[1]"),validate=True)
        assert Image.open(io.BytesIO(raw0)).convert('RGBA').tobytes()==Image.open(io.BytesIO(obs)).convert('RGBA').tobytes(),('measuring changed same-frame raw',tag,mode)
        for i,o in enumerate(w.pop('raw')):
            for phase in ('before','after'):
                blob=base64.b64decode(o[phase],validate=True)
                nn=f'{tag}-{mode}-{i:02}-{phase}.png'
                Image.frombytes('RGBA',tuple(o['rect'][2:]),blob).save(OUT/nn)
                o[phase]={'name':nn,'rgbaSHA256':sha(blob)}
            w.setdefault('raw',[]).append(o)
        seen,transport=drain_signed_http(p,hits,errors,blobs,pending,mode=='B')
        assert replaced==([P['packet']] if mode=='B' else [])
        (OUT/f'{tag}-{mode}-raw.png').write_bytes(raw0)
        watch=w
        # Reuse the first actual captured PNG bytes rather than re-rendering or resaving.
        return img,{**receipts,'camera':{k:f[k] for k in ('actual','viewport','phase','round','sceneTime')},
                    'stateSHA256':shot['physicsSHA256'],'watched':watch,'assetSHA256':FACET[akey],'syntheticOnly':replaced,'rawPNGsha256':sha(raw0),'http':seen,'httpDrain':transport,'audio':audio,'registeredDecode':dd['registered']},png_bytes
    finally:ctx.close()

def summary(a,b,rect):
    rgb=ImageChops.difference(a,b)
    def stats(im):
        return {'changed':sum(any(v) for v in im.getdata()),'maxChannel':max(a[1] for a in im.getextrema())}
    return {'full':stats(rgb),'ROI':stats(rgb.crop(rect))}
def shape_polygons():
    for _,segments in FACET['forms']:
        ring=[]
        for op,*xy in segments:
            if op in ('M','L'): ring.append(tuple(xy))
            elif op=='C':
                a=ring[-1]; b=xy[:2];c=xy[2:4]; d=xy[4:]
                ring.extend(tuple((1-t)**3*a[k]+3*(1-t)**2*t*b[k]+3*(1-t)*t*t*c[k]+t**3*d[k] for k in (0,1))
                            for t in (j/32 for j in range(1,33)))
            else:assert op=='Z'
        yield ring

def protect(a,b,mask,fore=None,requireRGB=True):
    assert a.size==b.size==mask.size
    diff=ImageChops.difference(a,b)
    pa,pb=list(a.getdata()),list(b.getdata())
    changed=[i for i,v in enumerate(diff.getdata()) if any(v)]
    owned=mask.tobytes(); lock=fore.tobytes() if fore else None
    out={'changed':len(changed),'outside':sum(owned[i]==0 for i in changed),
         'alpha':sum(pa[i][3]!=pb[i][3] for i in changed),
         'notSolid':sum(pa[i][3]!=255 or pb[i][3]!=255 for i in changed),
         'FORE':sum(bool(lock[i]) for i in changed) if lock else 0,
         'maxChannel':max(v[1] for v in diff.getextrema())}
    assert not any(out[k] for k in ('outside','alpha','notSolid','FORE')),out
    if requireRGB:assert out['changed']>0,out
    return out

def mask(size,M,pad,shift=(0,0)):
    a,_,_,d,x,y=M
    m=Image.new('L',size); ink=ImageDraw.Draw(m)
    for ring in shape_polygons():ink.polygon([(a*xx+x-shift[0],d*yy+y-shift[1]) for xx,yy in ring],fill=255)
    return m.filter(ImageFilter.MaxFilter(pad*2+1))

def pose(browser,tag,f):
    row={'archived':{k:f[k] for k in ('pngSHA256','fullRGBAsha256','roiRGBAsha256','roiPx','actorCount')}};PROOF['poses'][tag]=row
    pics={}
    for mode in ('A','B'):
        pic,row[mode],png=capture(browser,tag,f,mode);(OUT/f'{tag}-{mode}-dom.png').write_bytes(png);pics[mode]=pic;save()
        if mode=='A':
            assert row[mode]['fullRGBAsha256']==f['fullRGBAsha256'] and row[mode]['roiRGBAsha256']==f['roiRGBAsha256'],('current stock differs from certified R3',tag)
    a,b=row['A'],row['B']
    assert a['camera']==b['camera'] and a['stateSHA256']==b['stateSHA256']
    assert a['http'].keys()==b['http'].keys() and [k for k in a['http'] if a['http'][k]!=b['http'][k]]==[P['packet']]
    at,bt=[z['watched']['raw'] for z in (a,b)]
    assert len(at)==len(bt) and [z['meta']['id'] for z in at]==[z['meta']['id'] for z in bt]
    assert a['watched']['tiles']==b['watched']['tiles']
    fore=None; proofs=[]
    for x,y in zip(at,bt):
        assert x['meta']==y['meta'] and x['rect']==y['rect']
        if x['meta']['asset']==FACET['id']:
            assert x['before']['rgbaSHA256']==y['before']['rgbaSHA256'], 'B tile changed before F'
            ax,bx=[Image.open(OUT/i['after']['name']).convert('RGBA') for i in (x,y)]
            proofs.append(protect(ax,bx,mask(ax.size,x['meta']['worldMatrix'],1,tuple(x['rect'][:2]))))
        if x['meta']['id']=='approved34-deep-bedrock':
            assert all(x[k]['rgbaSHA256']==y[k]['rgbaSHA256'] for k in ('before','after'))
        if x['meta']['lane']=='foreground' and x['meta']['direct']==False:
            # Only fresh transparent screen-cache pass; not before/after the full-sky direct context.
            before=Image.open(OUT/x['before']['name']).convert('RGBA')
            if before.getbbox() is None:
                assert x['after']['rgbaSHA256']==y['after']['rgbaSHA256']
                fore=x,y
    assert proofs and fore is not None
    x,y=fore
    # R3 issues a blank-to-painted transparent foreground capture. The released
    # source also exposes exact composite before/after if only the direct path fires.
    rawA,rawB=[Image.open(OUT/f'{tag}-{mode}-raw.png').convert('RGBA') for mode in ('A','B')]
    protect_fore=Image.new('L',rawA.size)
    protect_fore.paste(Image.open(OUT/x['after']['name']).convert('RGBA').getchannel('A'),tuple(x['rect'][:2]))
    protect_fore=protect_fore.filter(ImageFilter.MaxFilter(3))
    M=x['meta']['worldMatrix']
    raw=protect(rawA,rawB,mask(rawA.size,M,3),protect_fore)
    dom=protect(pics['A'],pics['B'],mask(pics['A'].size,M,3))
    row.update({'signedProof':{'raw':raw,'dom':dom,'Ftiles':proofs,'foreHash':x['after']['rgbaSHA256']},'complete':True});save()
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
        PROOF['status']='MECHANICAL_DIAGNOSTIC_PASS_REQUIRES_VISUAL_REVIEW'
    except Exception as e:
        if PROOF['status']!='PAGES_SOURCE_HOLD':
            PROOF['status']='HOLD';fail(e)
        raise
    finally:save()
if __name__=='__main__':
    main()
