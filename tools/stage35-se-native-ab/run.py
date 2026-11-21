"""HONRO Stage35 product observer with one QA-only response replacement. Never publishes."""
import base64, copy, hashlib, io, json, os, time
from pathlib import Path
from urllib.request import build_opener, HTTPRedirectHandler, Request
from PIL import Image, ImageDraw
import exact as x

H=Path(__file__).resolve().parent
P=json.loads((H/'PINS.json').read_bytes()); ENTRY=json.loads((H/'entry.json').read_bytes())
REF='refs/heads/qa/stage35-se-native-ab-71fb'
BASE='https://sys8994.github.io/honro/'
FILES={'.github/workflows/stage35-se-native-ab.yml',*('tools/stage35-se-native-ab/'+n for n in ('exact.py','entry.json','PINS.json','run.py'))}
OUT=Path(os.environ.get('REPORT_DIR','/tmp/honro-stage35-no-report'))
N=P['patch']['owner']; ID=P['patch']['asset']; DEEP='approved35-forest-foundation'
HTML='HONRO.html'; stageparts={p['path'] for p in x.PARTS}
proof={'status':'INIT','release':x.BASE,'tree':x.TREE,'frames':{},'scope':
       'Candidate-only one response HTTP diagnostic; real game PNGs, no compiler, merge or production/release proof.'}
def save():
    assert OUT.is_dir()
    (OUT/'PROOF.json').write_text(json.dumps(proof,ensure_ascii=False,indent=2)+'\n')
def dumps(v):return json.dumps(v,ensure_ascii=False,allow_nan=False,separators=(',',':')).encode()
def sha(b):return hashlib.sha256(b).hexdigest()
def facts(b):return {'bytes':len(b),'sha256':sha(b)}
def patched(asset):
    q=P['patch']; assert asset['id']==ID and not asset['collision'] and sha(dumps(asset))==P['assetOriginalSHA256'][N]
    a=copy.deepcopy(asset);v=a['vector']; assert len(v['root']['children'])==1 and q['clipId'] not in v['clips']
    v['clips'][q['clipId']]=q['clip'];v['root']['children'].append(q['group'])
    assert sha(dumps(a))==P['assetCandidateSHA256']
    rev=copy.deepcopy(a); rev['vector']['clips'].pop(q['clipId']);rev['vector']['root']['children'].pop()
    assert rev==asset
    return a

def extend_pool(raw,new_asset):
    prev=json.loads(raw); old_n=copy.deepcopy(prev['nodes']); old_root=prev['root']
    old_decoded=x.decode_pool(raw); idx=list(old_decoded).index(ID)
    assert isinstance(old_root,int) and prev['nodes'][old_root][0]==0 and len(prev['nodes'][old_root])==8
    nodes=prev['nodes'];strings={n:i for i,n in enumerate(nodes) if type(n) is str}
    def add(what):
        nodes.append(what);return len(nodes)-1
    def ref(v):
        if v is None or type(v) is bool:return v
        if type(v) in (int,float):return [v]
        if type(v) is str:
            if v not in strings: strings[v]=add(v)
            return strings[v]
        if type(v) is dict:return add([1,*[k for p in v.items() for k in map(ref,p)]])
        assert type(v) is list
        return add([0,*map(ref,v)])
    signed_id=ref(new_asset); rr=list(nodes[old_root]); rr[idx+1]=signed_id
    prev['root']=add(rr)
    altered=dumps(prev); actual=x.decode_pool(altered)
    assert old_n==nodes[:len(old_n)] and old_root!=prev['root']
    assert list(actual)==list(old_decoded) and {k for k in actual if actual[k]!=old_decoded[k]}=={ID}
    assert actual[ID]==new_asset and sha(dumps(actual[ID]))==P['assetCandidateSHA256']
    return altered,{'stockRoot':old_root,'testRoot':prev['root'],'oldNodeCount':len(old_n),
                    'newNodeCount':len(nodes),'onlyOwnerOrdinal':idx,'stock':facts(raw),'test':facts(altered)}

class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self,*a,**k):raise RuntimeError('signed Pages origin redirected')
def source_gate():
    gt=x.git
    head=os.environ['GITHUB_SHA']
    assert os.environ.get('GITHUB_EVENT_NAME')=='push' and os.environ.get('GITHUB_REF')==REF and os.environ.get('GITHUB_REPOSITORY')=='sys8994/honro'
    assert gt('rev-list','--parents','-n1','HEAD').decode().split()==[head,x.BASE]
    assert gt('rev-parse',x.BASE+'^{tree}').decode().strip()==x.TREE
    assert gt('rev-parse',x.BASE+':web/manifest.json').decode().strip()=='30671da683f66f4d959ed617d1cfd79a0a1e3dbe'
    assert gt('status','--porcelain=v1','-z')==b'' and set(gt('diff','--name-status','--no-renames',x.BASE,head).decode().splitlines())=={'A\t'+v for v in FILES}
    def read(p):return x.checked(gt('show',x.BASE+':'+p),x.PINS[p],p)
    manifest=json.loads(read(x.MANIFEST))
    evidence={r['path']:{k:r[k] for k in ('bytes','sha256')} for r in manifest['files']}
    assert manifest['project']==x.CAMPAIGN and len(evidence)==len(manifest['files'])==809
    assert all(evidence[k]==v for k,v in x.PINS.items() if k!=x.MANIFEST)
    evidence[HTML]=P['stockHtml'];evidence[x.MANIFEST]=x.PINS[x.MANIFEST]
    assert all(p in evidence for p in P['graphExpected']) and manifest['gameEntry'] in P['graphExpected']
    assert facts(gt('show',x.BASE+':'+HTML))==evidence[HTML]
    camp=json.loads(read(x.CAMPAIGN))
    assert [camp[k][34] for k in ('stages','stageLibraries')]==[x.MAP,x.DESCRIPTOR] and camp['assetEncodings']['stageLibraries'][34]=='json-pool-v1'
    packet=x.materialize(json.loads(read(x.DESCRIPTOR)),read); assets=x.decode_pool(packet)
    intakes=x.project(json.loads(read(x.MAP)),assets)['owners']
    assert all(sha(dumps(intakes[k]['asset']))==P['assetOriginalSHA256'][k] for k in intakes)
    new_asset=patched(assets[ID]); patch,pins=extend_pool(packet,new_asset)
    # Public source is signed independently of the checkout, not assumed from the old proof.
    serve={}
    keys=[HTML,x.MANIFEST,*P['graphExpected'][1:],x.MAP,x.DESCRIPTOR,*sorted(stageparts)]
    for k in keys:
        u=BASE+k
        with build_opener(NoRedirect).open(Request(u,headers={'Accept-Encoding':'identity','Cache-Control':'no-cache'}),timeout=28) as r:
            assert r.status==200 and r.geturl()==u
            serve[k]=facts(r.read(evidence[k]['bytes']+1));assert serve[k]==evidence[k],('deployed body drift',k)
    proof.update({'status':'SOURCE_PASS','qaHead':head,'sourcePins':serve,'poolPatch':pins,
                  'originalAssets':P['assetOriginalSHA256'],'patchedAsset':P['assetCandidateSHA256']})
    save()
    return evidence,patch

def rel(u):
    return u[len(BASE):] if u.startswith(BASE) and '?' not in u and '#' not in u else None
def decode(b):return Image.open(io.BytesIO(b)).convert('RGBA')
def read_png(p,z):
    b=base64.b64decode(p.evaluate(z),validate=True);return b,decode(b)
CANVAS="()=>HonroApp.scene.canvas.toDataURL('image/png').split(',')[1]"
PEER="""q=>{
 const h=HonroApp, st=h.engine.b;
 const a=HonroTerrainDomain.materialLandmarks(st);
 const find=id=>{const z=HONRO_PROJECT.library.filter(l=>l.id===id), ls=a.filter(l=>l.asset?.id===id);
   if(z.length!==1||ls.length!==1||ls[0].kind!=='canonical-element'||JSON.stringify(z[0].vector)!==JSON.stringify(ls[0].asset.vector))throw Error('Source/render owner mismatch '+id);
   return z[0];};
 const deep=find('approved35:forest-foundation'),near=find('approved35:near-geology');
 const c=document.createElement('canvas');[c.width,c.height]=q.backing;const g=c.getContext('2d'),s=q.actual.scale;
 g.setTransform(s,0,0,s,-s*q.viewport.left,-s*q.viewport.top);
 if(!HonroVectorArt.draw(g,deep,{x:-6000,y:-5000,scale:1,rotation:0,opacity:1})||
    !HonroVectorArt.draw(g,near,{x:-700,y:1450,scale:1,rotation:0,opacity:1}))throw Error('Native detached material draw failed');
 return{near:JSON.stringify(near),deep:JSON.stringify(deep),png:c.toDataURL('image/png').split(',')[1]};
}"""
def capture(browser,evidence,patch,wh,mode,shots):
    w,h=wh;ctx=browser.new_context(viewport={'width':w,'height':h},device_scale_factor=1,service_workers='block')
    assert ctx.storage_state()=={'cookies':[],'origins':[]}
    page=ctx.new_page();page.set_default_timeout(25000)
    errors=[];hits=[];blobs=[];media=[];pending=set();intercepts=[]
    def route(r):
        q=r.request; k=rel(q.url)
        if mode=='B' and k==x.DESCRIPTOR and q.method=='GET':
            try:
                rr=r.fetch(max_redirects=0,timeout=25000); assert rr.status==200 and rr.url==q.url and facts(rr.body())==evidence[k]
                assert not intercepts
                hdr={a:b for a,b in rr.headers.items() if a not in ('content-encoding','content-length','etag','last-modified','content-range','content-digest','digest')}
                hdr.update({'content-type':'application/json','cache-control':'no-store'})
                r.fulfill(status=200,headers=hdr,body=patch);intercepts.append(k);return
            except Exception as exc:
                errors.append(['candidate replacement',repr(exc)]);return r.abort()
        if (q.method=='GET' and (k in evidence or k in P['media'] and q.resource_type=='media')) or q.url.startswith(('blob:'+BASE.split('/honro/')[0]+'/','data:')):
            return r.continue_()
        errors.append(['unexpected request',q.url]);return r.abort()
    def response(res):
        k=rel(res.url);q=res.request
        if res.url.startswith('blob:https://sys8994.github.io/') and res.status==200:blobs.append(res.url)
        elif k in P['media'] and q.resource_type=='media' and res.status in (200,206):media.append(k)
        elif k in evidence and res.status==200 and q.method=='GET':hits.append((k,res))
        else: errors.append(['unexpected response',res.url,res.status])
    def abnormal(q):
        if not (rel(q.url) in P['media'] and q.resource_type=='media' and q.failure=='net::ERR_ABORTED'):
            errors.append(['unexpected request failure',q.url,q.failure])
    ctx.route('**/*',route)
    page.on('request',lambda q:pending.add(q) if rel(q.url) in evidence else None)
    page.on('requestfinished',lambda q:pending.discard(q))
    page.on('requestfailed',lambda q:pending.discard(q))
    page.on('requestfailed',abnormal);page.on('response',response)
    page.on('pageerror',lambda e:errors.append(['pageerror',str(e)]))
    page.add_init_script('('+ENTRY['INIT']+')()')
    rows={}
    try:
        shell=page.goto(BASE+HTML,wait_until='domcontentloaded')
        assert shell and shell.url==BASE+HTML and shell.status==200 and facts(shell.body())==evidence[HTML]
        page.wait_for_function("()=>document.documentElement.dataset.honroReady==='true'&&typeof window.HonroCampaignLoader?.ensureStage==='function'")
        page.evaluate(ENTRY['LAUNCH'],35); canvas=page.locator('#battlecanvas');canvas.wait_for(state='visible')
        page.wait_for_function("()=>{const a=HonroApp;HonroStory.tick(a,performance.now());HonroStory.draw(a);return Boolean(document.getElementById('turn-banner')?.hidden!==false&&!a.dialogue);}",timeout=12000)
        page.evaluate("()=>HonroApp.scene.render(HonroApp.engine,0,'',.6,false,0)")
        for f in shots:
            k=f['key']; view=f['view'];q={'id':35,'mapId':'stage-35','name':view,'dx':int(view=='southeast'),'dy':1 if view=='southeast' else -1 if view=='north' else 0,'ordinary':f['ordinaryAnchor'],'readback':False}
            g=page.evaluate(ENTRY['PARK'],q)
            dd=page.evaluate(ENTRY['DECODE'])
            assert dd['registered']==f['decodeCount'] and not dd['failed']
            assert g==page.evaluate(ENTRY['PARK'],{**q,'readback':True})
            assert sha(g['signature'].encode())==f['physicsSHA256'] and all(f[n]==g[n] for n in (
              'actual','viewport','css','backing','focus','actorCount','tide','sceneTime','phase','round'))
            rb,raw=read_png(page,CANVAS);db=canvas.screenshot(animations='disabled');dom=decode(db)
            assert list(raw.size)==f['backing'] and list(dom.size)==f['pixels']
            domH=sha(dom.tobytes());rawH=sha(raw.tobytes())
            for name,value in [('raw',rb),('dom',db)]: (OUT/f'{k}-{mode}-{name}.png').write_bytes(value)
            if mode=='A':
                assert domH==f['stockDOMSha256Decoded'],('stock DOM archival drift',k,domH)
                if 'stockRawSha256Decoded' in f:assert rawH==f['stockRawSha256Decoded'],('stock raw archival drift',k)
            peer=page.evaluate(PEER,{'backing':g['backing'],'viewport':g['viewport'],'actual':g['actual']})
            mat=base64.b64decode(peer.pop('png'),validate=True)
            assert sha(peer['deep'].encode())==P['assetOriginalSHA256'][DEEP]
            assert sha(peer['near'].encode())==(P['assetCandidateSHA256'] if mode=='B' else P['assetOriginalSHA256'][N])
            (OUT/f'{k}-{mode}-material.png').write_bytes(mat)
            rows[k]={'rawRGBA':rawH,'domRGBA':domH,'rawPNG':sha(rb),'domPNG':sha(db),'physics':f['physicsSHA256'],
                     'nativeMaterialPNG':sha(mat),'assetSHA256':{p:sha(y.encode()) for p,y in peer.items()}}
            proof['frames'].setdefault(k,{})[mode]=rows[k]
            save()
        seen={};i=quiet=0;deadline=time.monotonic()+12
        while time.monotonic()<deadline:
            assert not errors,errors
            while i<len(hits) and hits[i][1].request not in pending:
                k,res=hits[i]; want=facts(patch) if mode=='B' and k==x.DESCRIPTOR else evidence[k]
                seen[k]=facts(res.body()); assert seen[k]==want,('observed HTTP body differs',k)
                i+=1
            generated=set(page.evaluate("()=>[...window.__honroObserver.blobs]"))
            before=(i,len(blobs));page.wait_for_timeout(100)
            idle=before==(len(hits),len(blobs)) and not pending and set(blobs)<=generated
            quiet=quiet+1 if idle else 0
            if quiet==3:break
        assert quiet==3 and not errors and set(P['graphExpected']+[x.MAP,x.DESCRIPTOR])<=seen.keys()
        assert intercepts==([x.DESCRIPTOR] if mode=='B' else [])
        assert stageparts.intersection(seen)==(stageparts if mode=='A' else set())
        proof.setdefault('HTTP',{}).setdefault(f'{w}x{h}',{})[mode]={'verified':seen,'onlyReplacement':intercepts,'media':sorted(set(media))}
        save();return seen
    finally:ctx.close()
def open_shot(k,side,kind):return Image.open(OUT/f'{k}-{side}-{kind}.png').convert('RGBA')
def world_pixel(f,xy):
    s=f['actual']['scale']; l,t=(f['viewport'][z] for z in ('left','top'))
    return tuple(int((v-d)*s) for v,d in zip(xy,(l,t)))
def roi(f,image):
    scale=f['actual']['scale']; l,t=(f['viewport'][z] for z in ('left','top'))
    lo,top,hi,bottom=P['signedWorldEnvelope']
    xy=(int((lo-l)*scale)-2,int((top-t)*scale)-2,int((hi-l)*scale)+2,int((bottom-t)*scale)+2)
    roi=Image.new('L',image.size);ImageDraw.Draw(roi).rectangle(xy,fill=255)
    return roi
def report_pixels(f,A,B):
    assert A.size==B.size
    mask=roi(f,A).tobytes(); w,h=A.size
    zx,zy=world_pixel(f,P['protectedEastPocketWorld'][:2]); xx,yy=world_pixel(f,P['protectedEastPocketWorld'][2:])
    raw_a=A.tobytes();raw_b=B.tobytes()
    changed=outside=east=alpha=0
    for j in range(w*h):
        i=j*4
        if raw_a[i:i+4]==raw_b[i:i+4]:continue
        changed+=1;outside+=not mask[j];alpha+=raw_a[i+3]!=raw_b[i+3]
        py,px=divmod(j,w);east+=zx<=px<=xx and zy<=py<=yy
    assert not (outside or east or alpha), (f['key'],changed,outside,east,alpha)
    if not f['targetVisible']:assert changed==0, ('untouched control differs',f['key'],changed)
    else:assert changed>0, ('target not visible',f['key'])
    return {'changedRGBA':changed,'outsideSigned':outside,'actualGameAlphaChanged':alpha,'otherEastVoidChanged':east}
def flood(a,p):
    W,H=a.size; get=a.load();x,y=p
    assert 0<=x<W and 0<=y<H and get[x,y]==0, ('old actual native material core must reveal far',p,get[x,y])
    q=[p];seen={p}
    while q:
        x,y=q.pop()
        for u,v in ((x-1,y),(x+1,y),(x,y-1),(x,y+1)):
            if 0<=u<W and 0<=v<H and (u,v) not in seen and get[u,v]<255:
                seen.add((u,v));q.append((u,v))
    assert len(seen)>16 and all(0<x<W-1 and 0<y<H-1 for x,y in seen), ('not enclosed former contact',len(seen))
    return seen
def compare(k,f):
    A={n:open_shot(k,'A',n) for n in ('raw','dom','material')};B={n:open_shot(k,'B',n) for n in A}
    p={n:report_pixels(f,A[n],B[n]) for n in ('raw','dom')}
    if not f['targetVisible']:
        assert A['material'].tobytes()==B['material'].tobytes(), ('detached control RGB differs',k)
        return p
    a,b=(g['material'].getchannel('A') for g in (A,B))
    seed=[2975.3,3535.8] if f['view']=='overview' else [3017.9,3542.9]
    q=world_pixel(f,seed); enclosed=flood(a,q)
    opaque=[s for s in enclosed if a.getpixel(s)==0]
    assert opaque and all(b.getpixel(s)==255 for s in opaque), ('actual Chrome pre-existing clear core did not all reach full opacity',k)
    assert all(b.getpixel(s)>=a.getpixel(s) for s in enclosed), ('actual Chrome AA became more open',k)
    ar=A['raw'].getpixel(q);br=B['raw'].getpixel(q)
    assert all(v>u for v,u in zip(ar[:3],br[:3])), ('actual game does not darken certified former sky centre',k,ar,br)
    def rgb(s):
        return {'xy':s,'worldPixelCentre':[(s[j]+.5)/f['actual']['scale']+f['viewport'][axis] for j,axis in enumerate(('left','top'))],
                'pureMaterialAlpha':[a.getpixel(s),b.getpixel(s)],
                'gameRawRGBA':[A['raw'].getpixel(s),B['raw'].getpixel(s)],
                'gameDomRGBA':[A['dom'].getpixel(s),B['dom'].getpixel(s)]}
    residual=[rgb(t) for t in sorted(enclosed) if b.getpixel(t)<255]
    old=[rgb(tuple(t)) for t in P['mobileHistoricalAA'].get(k,[])]
    # Report every actual alpha residual and historical coordinate, no numeric exemption.
    p['nativeMaterial']={'formerClearFullyOpaque':len(opaque),'signedCore':rgb(q),
                         'residualActualNativeAlphaAndFinalGameRGB':residual,'offlineKnownCoordinatesActualGameRGB':old,
                         'wholeFormerAALensFullyOpaque':not residual}
    return p
def main():
    from playwright.sync_api import sync_playwright
    save()
    try:
        pins,packet=source_gate()
        frames=P['frames']
        with sync_playwright() as w:
            browser=w.chromium.launch()
            assert browser.version==P['browser'],('wrong Chromium',browser.version)
            for wh in ((1440,900),(390,844)):
                selected=[f for f in frames.values() if tuple(f['viewportCSS'])==wh]
                assert len(selected) in (3,4)
                A=capture(browser,pins,packet,wh,'A',selected)
                B=capture(browser,pins,packet,wh,'B',selected)
                assert A.keys()-B.keys()==stageparts and not B.keys()-A.keys()
                assert [k for k in sorted(B) if B[k]!=A[k]]==[x.DESCRIPTOR]
                for f in selected:
                    k=f['key'];proof['frames'][k]['strictComparison']=compare(k,f);save()
            browser.close()
        assert len(proof['frames'])==7 and all(v.keys()>={'A','B','strictComparison'} for v in proof['frames'].values())
        proof['status']='PASS_SCOPED_CAMERA_AND_OPAQUE_CORE_DIAGNOSTIC_ONLY'
        proof['manualAAMobileAndArtJudgmentPending']=True
    except Exception as e:
        proof['status']='HOLD';proof['failure']=repr(e);raise
    finally:save()
if __name__=='__main__':main()
