"""Actual localhost A/B from normal compiled checkout, no body override or app patches."""
import base64, hashlib, io, json, sys, time
from pathlib import Path
from PIL import Image,ImageDraw
from guard import P

H=Path(__file__).resolve().parent
ENTRY=json.loads((H/'entry.json').read_bytes())
OUT=Path(sys.argv[1])/'out'
BASE=''
HTML='HONRO.html'
N=P['patch']['owner'];DEEP='approved35-forest-foundation'
proof={'status':'INIT','frames':{},'scope':'Two ordinary signed localhost compiled assets; zero replacement, no release'}
def sha(b):return hashlib.sha256(b).hexdigest()
def facts(b):return {'bytes':len(b),'sha256':sha(b)}
def save():(OUT/'BROWSER.json').write_text(json.dumps(proof,ensure_ascii=False,indent=2)+'\n')
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
def capture(browser,evidence,expected,wh,mode,shots):
    w,h=wh;ctx=browser.new_context(viewport={'width':w,'height':h},device_scale_factor=1,service_workers='block')
    assert ctx.storage_state()=={'cookies':[],'origins':[]}
    page=ctx.new_page();page.set_default_timeout(25000)
    errors=[];hits=[];blobs=[];media=[];pending=set()
    def route(r):
        q=r.request; k=rel(q.url)
        if (q.method=='GET' and (k in evidence or k in P['media'] and q.resource_type=='media')) or q.url.startswith(('blob:'+BASE,'data:')):
            return r.continue_()
        errors.append(['unexpected request',q.url]);return r.abort()
    def response(res):
        k=rel(res.url);q=res.request
        if res.url.startswith('blob:'+BASE) and res.status==200:blobs.append(res.url)
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
            assert domH==f['approvedExactRGBA'][mode]['dom'] and rawH==f['approvedExactRGBA'][mode]['raw'], (
                'normal output frame does not match exact previously approved RAW/DOM',k,mode,domH,rawH,f['approvedExactRGBA'][mode])
            peer=page.evaluate(PEER,{'backing':g['backing'],'viewport':g['viewport'],'actual':g['actual']})
            mat=base64.b64decode(peer.pop('png'),validate=True)
            assert sha(peer['deep'].encode())==P['assetOriginalSHA256'][DEEP]
            assert sha(peer['near'].encode())==(P['assetCandidateSHA256'] if mode=='B' else P['assetOriginalSHA256'][N])
            assert sha(decode(mat).tobytes())==f['approvedExactRGBA'][mode]['material'],('material alpha/paint reference drift',k,mode)
            (OUT/f'{k}-{mode}-material.png').write_bytes(mat)
            rows[k]={'rawRGBA':rawH,'domRGBA':domH,'rawPNG':sha(rb),'domPNG':sha(db),'physics':f['physicsSHA256'],
                     'nativeMaterialPNG':sha(mat),'assetSHA256':{p:sha(y.encode()) for p,y in peer.items()}}
            proof['frames'].setdefault(k,{})[mode]=rows[k]
            save()
        seen={};i=quiet=0;deadline=time.monotonic()+12
        while time.monotonic()<deadline:
            assert not errors,errors
            while i<len(hits) and hits[i][1].request not in pending:
                k,res=hits[i]; want=evidence[k]
                seen[k]=facts(res.body()); assert seen[k]==want,('observed HTTP body differs',k)
                i+=1
            generated=set(page.evaluate("()=>[...window.__honroObserver.blobs]"))
            before=(i,len(blobs));page.wait_for_timeout(100)
            idle=before==(len(hits),len(blobs)) and not pending and set(blobs)<=generated
            quiet=quiet+1 if idle else 0
            if quiet==3:break
        assert quiet==3 and not errors and set(expected)<=seen.keys(), ('missed normal compiled loader/split body observations',sorted(set(expected)-seen.keys()),errors)
        proof.setdefault('HTTP',{}).setdefault(f'{w}x{h}',{})[mode]={'verified':seen,'media':sorted(set(media))}
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
    global BASE
    save()
    try:
        graph=json.loads((OUT/'GRAPH.json').read_bytes())
        assert graph['50MapPathsAndBytesExact'] and graph['49NonStage35AssetPacketsAndLeavesExact'] and graph['onlyTargetCanonicalOwnerExact']
        frames=P['frames']
        with sync_playwright() as w:
            b=w.chromium.launch()
            assert b.version==P['browser'],('wrong Chromium',b.version)
            for wh in ((1440,900),(390,844)):
                selected=[f for f in frames.values() if tuple(f['viewportCSS'])==wh]

                seen={}
                for mode,port in (('A',18841),('B',18842)):
                    BASE=f'http://127.0.0.1:{port}/'
                    g=graph[mode]
                    seen[mode]=capture(b,g['files'],g['mustObserve'],wh,mode,selected)
                oldForNew={new:old for old,new in graph['authorizedRenamedPaths']}
                assert set(seen['A'])=={oldForNew.get(k,k) for k in seen['B']}, 'normal A/B browser HTTP scope differs beyond hashed identities'
                for f in selected:
                    k=f['key']
                    receipt=compare(k,f)
                    if f['targetVisible']:assert receipt['nativeMaterial']['wholeFormerAALensFullyOpaque']
                    proof['frames'][k]['strictComparison']=receipt
                    save()
            b.close()
        assert len(proof['frames'])==7 and all(v.keys()>={'A','B','strictComparison'} for v in proof['frames'].values())
        proof.update(status='PASS_NORMAL_BUILD_BROWSER_RAW_DOM_MATERIAL_EXACT',approvedPriorFixture=P['product']['authority'],browser=P['browser'])
    except Exception as err:
        proof.update(status='HOLD',failure=repr(err));raise
    finally:save()
if __name__=='__main__':main()
