"""Read-only public Stage21 observer; only W, west-near and east on two viewports."""
import base64, json, os, re, time
from io import BytesIO
from math import ceil, floor
from pathlib import Path
from urllib.parse import urlsplit
from PIL import Image
from playwright.sync_api import sync_playwright
from source import (BASE, P, LIVE, VIEWS, VIEWPORTS, check, facts, read, required_observed, save, sha,
                    stage_paths, verify_graph, materialize, patch_original)

STAGE=int(os.environ['AUDIT_STAGE'])
OUT=Path(os.environ['AUDIT_OUT'])
assert str(STAGE) in P["stages"]
ROW=P['stages'][str(STAGE)]
SOURCE=json.loads((OUT/'public-source.json').read_bytes())
assert SOURCE['verified'] and SOURCE['stage']==STAGE and SOURCE['authority']==P['authority']
ACTIVE, MAP, AGGREGATE=verify_graph(STAGE,read)
assert AGGREGATE==SOURCE['aggregate']
ORDINARY,ORDINARY_ORIGIN=ROW['ordinary'],'west native joint near diagnostic'
BLOB=re.compile(r'blob:https://sys8994\.github\.io/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}')
MEDIA=set(f'assets/bgm/{n}.mp3' for n in ('main','battle-1','battle-2','battle-3'))
KNOWN={'HONRO.html':P['required']['HONRO.html'],'web/manifest.json':P['manifest'],**ACTIVE}
BASEURL=urlsplit(BASE)
SPEC=P['patch']
CONFIG=SOURCE['virtualOnly']
assert CONFIG=={'sha256':SPEC['browserExpectedSHA256'],'bytes':SPEC['browserExpectedBytes']}
PROOF={'release':LIVE,'stage':STAGE,'frames':[],'visits':[],'complete':False,
       'ordinaryAnchor':{'pose':ORDINARY,'selection':ORDINARY_ORIGIN},
       'scope':'Canonical public App; observer-parked first-turn camera after isolated diagnostic launch. Not ordinary campaign completion, human visual acceptance, or a 50-stage round.'}

INIT=r"""()=>{
 const images=new Set(), blobs=new Set();
 const proto=HTMLImageElement.prototype, d=Object.getOwnPropertyDescriptor(proto,'src');
 Object.defineProperty(proto,'src',{...d,set(v){images.add(this);return d.set.call(this,v);}});
 const create=URL.createObjectURL;
 URL.createObjectURL=function(...args){const url=Reflect.apply(create,this,args);blobs.add(url);return url};
 Object.defineProperty(window,'__honroObserver',{value:{images,blobs},enumerable:false});
}"""
LAUNCH=r"""async id=>{
 const a=window.HonroApp;
 if(!a||typeof a.launch!=='function')throw Error('Normal app unavailable');
 // App lives in a new isolated context. Park the loop only for screenshots.
 const orig={frame:a.frame,music:a.profile.settings.music,sound:a.profile.settings.sound};
 window.__honroQAUndo=()=>{a.frame=orig.frame;a.profile.settings.music=orig.music;a.profile.settings.sound=orig.sound;};
 a.frame=()=>{};
 a.profile.settings.music=false;a.profile.settings.sound=false;
 await HonroCampaignLoader.ensureStage(id);
 for(let n=1;n<id;n++)a.profile.cleared[n]=true;
 for(const h of Object.values(a.profile.heroes))h.xp=HonroProgression.xpAt(HonroProgression.plan(id).entryLevel);
 a.launch(id);
 if(a.engine?.b?.honroStage!==id)throw Error('Campaign wrong stage');
 for(let n=0;n<40&&a.dialogue;n++)HonroStory.finish(a);
 if(a.dialogue)throw Error('Entry dialogue remains');
 a.close();HonroStoryFraming.clear(a.scene);
}"""
PARK=r"""q=>{
 const a=HonroApp,s=a.scene,e=a.engine,b=e.b;
 const st=HONRO_PROJECT.stages.find(t=>t.metadata?.stageId===q.id);
 if(!st||st.id!==q.mapId||b.honroStage!==q.id||b.honroCustom!==false||!b.honroCanonical)
   throw Error('Wrong canonical project stage');
 const r=s.canvas.getBoundingClientRect(), f=HonroBounds.focus(b), z=HonroBounds.zoomLimits(r.width);
 if(![z.min,z.max,f.left,f.top,f.right,f.bottom].every(Number.isFinite)||z.min>=z.max)throw Error('Missing real native zoom and focus bounds');
 const desired=q.name==='ordinary'?{x:q.ordinary[0],y:q.ordinary[1],scale:q.ordinary[2]}:
    {x:q.dx?q.dx*1e6:st.width/2,y:q.dy?q.dy*1e6:st.height/2,scale:z.min};
 const pos=()=>({x:s.x,y:s.y,scale:s.scale});
 if(!q.readback){
   HonroStoryFraming.clear(s);
   Object.assign(s,{manual:true,time:2,storyTween:null,storyFrozen:false,goalFocus:null,cinematic:null,
     focusUntil:0,speakerUntil:0,...desired});
   HonroBounds.constrain(s,b);
 }
 const constrained=pos();
 // First draw only stabilizes genuine runtime lazy caches. The observation draw must not mutate gameplay.
 if(!q.readback)s.render(e,0,'',.6,false,0);
 const signature=()=>JSON.stringify({terrain:b.terrain,units:b.units,design:st.design,initialState:st.initialState,
    objectives:st.objectives,water:b.water??null,tide:b.honroAct4PreviewState?.tide??null,
    phase:b.phase??null,round:b.round??null});
 const initial=signature();
 s.render(e,0,'',.6,false,0);
 if(signature()!==initial)throw Error('Draw mutated campaign/physics/actors');
 const actual=pos(), viewport=HonroBounds.viewport(s,r.width,r.height);
 if(Object.keys(actual).some(k=>!Number.isFinite(actual[k])||Math.abs(actual[k]-constrained[k])>1e-6)||
   actual.x<f.left-1e-6||actual.x>f.right+1e-6||actual.y<f.top-1e-6||actual.y>f.bottom+1e-6)
   throw Error('Render after clamp changed camera');
 if(q.name==='ordinary'){
   const margin=1e-6, cx=(q.ordinary[0]-viewport.left)*actual.scale, cy=(q.ordinary[1]-viewport.top)*actual.scale;
   if(actual.scale<=z.min+margin||actual.scale>z.max+margin||cx<0||cx>r.width||cy<0||cy>r.height)
     throw Error('Ordinary target outside current camera or not at ordinary scale');
 }else if(Math.abs(actual.scale-z.min)>1e-6)throw Error('Not actual min zoom');
 if(q.name!=='ordinary'&&!q.readback){
   const edge=axis=>{const p=pos(), ext=axis==='x'?[f.left,f.right]:[f.top,f.bottom];return p[axis]>=ext[0]-1e-6&&p[axis]<=ext[1]+1e-6};
   if(!edge('x')||!edge('y'))throw Error('Extremes outside approved focus');
 }
 return {desired,actual,viewport,focus:f,zoomLimits:z,css:{w:r.width,h:r.height},backing:[s.canvas.width,s.canvas.height],
         actorCount:b.units.length,tide:b.honroAct4PreviewState?.tide??null,
         phase:b.phase??null,round:b.round??null,sceneTime:s.time,signature:initial};
}"""
DECODE=r"""async()=>{
 const work=(async()=>{
 const obs=window.__honroObserver;
 const chosen=new Set([...obs.images,...document.images].filter(i=>i.currentSrc||i.src));
 await document.fonts.ready;
 await Promise.all([...chosen].map(i=>i.decode()));
 const failed=[...chosen].filter(i=>!i.complete||!i.naturalWidth).map(i=>i.currentSrc||i.src);
 return{registered:chosen.size,failed};})();
 return await Promise.race([work,new Promise((_,reject)=>setTimeout(()=>reject(Error('image decode deadline')),30000))]);
}"""
OWN=r"""q=>{
 const a=HonroApp,b=a.engine.b,D=HonroTerrainDomain;
 const source=HONRO_PROJECT.stages.find(s=>s.metadata.stageId===q.stage);
 if(source?.design?.act3HandoffArt!==q.front||b.honroStage!==q.stage||b.honroCustom||!b.honroCanonical)
   throw Error('Wrong stage/owner selectors');
 const list=D.materialLandmarks(b), inList=id=>list.filter(x=>x.asset?.id===id), lib=id=>HONRO_PROJECT.library.filter(x=>x.id===id);
 const placed=source.elements.filter(x=>x.assetId===q.back);
 const [front,frontSource,base,baseSource]=[inList(q.front),lib(q.front),inList(q.back),lib(q.back)];
 if([front,frontSource,base,baseSource,placed].some(x=>x.length!==1))throw Error('Native F/B material owner cardinality');
 const F=front[0], B=base[0], id=source.design.act3HandoffArt, diagnostic=q.variant==='B';
 if((diagnostic? F.asset===frontSource[0]||F.asset.vector!==frontSource[0].vector : F.asset!==frontSource[0])||F.kind!=='canonical-element'||F.layer!=='front'||F.depthLayer!=='L1'||
    F.x!==0||F.y!==0||F.scale!==1||F.asset.bounds.x!==(diagnostic?-380:0)||F.asset.bounds.w!==(diagnostic?6780:6400)||
    F.asset.params?.blendFace||F.asset.params?.edgeFade||(b.honroLandmarks||[]).some(x=>x.asset?.id===id))
   throw Error('Missing canonical direct-strip F');
 if(B.id!=='foundations'||B.layer!=='front'||B.kind!=='canonical-element'||B.asset.bounds.x!==-6000||
    B.asset.bounds.w!==18400||B.asset.bounds.y!==-24000||B.asset.bounds.h!==51200||
    baseSource[0].bounds.x!==0||baseSource[0].bounds.w!==6400||
    list.indexOf(B)>=list.indexOf(F))throw Error('Separate materialized B and order not witnessed');
 const floor=D.render(b).find(x=>x.id==='a3-foundation'), pts=floor&&HONRO_CORE.poly(floor);
 const contact=F.asset.params.contactMapping;
 if(!pts||!contact.every(([,,x,y])=>pts.some(p=>Math.abs(p.x-x)<.01&&Math.abs(p.y-y)<.01)))
   throw Error('Actual render floor does not carry registered contacts');
 const points=[[-500,2755.3125],[0,2810],[620,2810]];
 if(!points.every(([x,y])=>pts.some(p=>p.x===x&&Math.abs(p.y-y)<.01)))throw Error('Actual west render roof points drifted');
 const authored=source.terrains.find(x=>x.id===floor.id)?.playProjection;
 if(authored?.bounds?.left!==0||authored?.start?.x!==0||authored?.start?.y!==2810||source.materials.length!==0)
   throw Error('Author PLAY/water boundary mismatch');
 const sample=l=>({assetId:l.asset.id,id:l.id,layer:l.layer,depthLayer:l.depthLayer??null,kind:l.kind,
                   placement:[l.x,l.y,l.scale],bounds:l.asset.bounds,materialListIndex:list.indexOf(l)});
 return {front:sample(F),back:sample(B),backAuthoredBounds:baseSource[0].bounds,
   contact,renderRoof:points,floorId:floor.id,authoredPLAY:authored,sourceWater:source.materials.map(x=>x.id),
   observationOnly:true,trace:'real registered render owners after normal screenshot; no layer toggling or game state injection'};
}"""

def persist(): save(OUT,'proof.json',PROOF)
def path_of(url):
    q=urlsplit(url)
    if (q.scheme,q.netloc)!=(BASEURL.scheme,BASEURL.netloc) or q.query or q.fragment or not url.startswith(BASE):
        return None
    return q.path.removeprefix(BASEURL.path)

def one(browser, w, h, variant):
    ctx=browser.new_context(viewport={'width':w,'height':h},device_scale_factor=1,service_workers='block')
    ctx.set_default_timeout(30000)
    assert ctx.storage_state()=={'cookies':[],'origins':[]}
    page=ctx.new_page()
    errors=[]; responses=[]; blobs=[]; media=[]
    visit={'variant':variant,'viewportCSS':[w,h],'observed':[],'errors':errors,'blobs':[],'media':media,'complete':False}
    PROOF['visits'].append(visit); persist()

    def on_resp(r):
        rel=path_of(r.url); req=r.request
        if BLOB.fullmatch(r.url) and r.status==200 and req.method=='GET':
            blobs.append((r.url,req.resource_type)); return
        if rel in MEDIA and req.method=='GET' and req.resource_type=='media' and r.status in (200,206):
            media.append({'path':rel,'status':r.status}); return
        if rel not in KNOWN or req.method!='GET' or r.status!=200:
            errors.append(['unexpected response',req.method,r.status,r.url]);return
        responses.append((rel,r))
    def req_failed(r):
        rel=path_of(r.url)
        if rel in MEDIA and r.method=='GET' and r.resource_type=='media' and r.failure=='net::ERR_ABORTED':
            media.append({'path':rel,'aborted':True});return
        errors.append(['failed request',r.url,r.failure])
    page.on('response',on_resp)
    page.on('requestfailed',req_failed)
    page.on('request',lambda r:errors.append(['non-read request', r.url,r.method]) if r.method!='GET' else None)
    page.on('pageerror',lambda e:errors.append(['pageerror',str(e)]))
    page.add_init_script('('+INIT+')()')
    signed_routes=[]
    if variant=='B':
        def exact_material(route):
            assert route.request.url==BASE+SPEC['rel'] and route.request.method=='GET' and not signed_routes
            r=route.fetch(max_redirects=0,timeout=30000)
            assert r.status==200 and r.url==BASE+SPEC['rel']
            stock=check('unaltered public JS before virtual replacement',r.body(),KNOWN[SPEC['rel']])
            body=check('exact virtual wrapper',patch_original(stock),CONFIG)
            keep={k:v for k,v in r.headers.items() if k.lower() not in
                  ('content-length','content-encoding','etag','content-md5','content-type','cache-control')}
            signed_routes.append({'path':SPEC['rel'],'stock':facts(stock),'localOnly':facts(body)})
            route.fulfill(status=200,headers=keep,content_type='application/javascript; charset=utf-8',body=body)
        page.route(BASE+SPEC['rel'],exact_material)

    before=time.monotonic()
    try:
        shell=page.goto(BASE+'HONRO.html',wait_until='domcontentloaded',timeout=50000)
        assert shell and shell.url==BASE+'HONRO.html' and shell.status==200
        check('browser shell',shell.body(),P['required']['HONRO.html'])
        page.wait_for_function("""()=>Boolean((document.documentElement.dataset.honroReady==='true'&&window.HonroCampaignLoader)
        || document.querySelector('[data-startup-retry]'))""",timeout=90000)
        assert page.evaluate("()=>Boolean(document.documentElement.dataset.honroReady==='true'&&window.HonroCampaignLoader)")
        page.evaluate(LAUNCH,STAGE)
        canvas=page.locator('#battlecanvas')
        canvas.wait_for(state='visible')
        page.wait_for_function("""()=>{const a=HonroApp;HonroStory.tick(a,performance.now());HonroStory.draw(a);
           return Boolean(document.getElementById('turn-banner')?.hidden!==false&&!a.dialogue);}""",polling=125,timeout=9000)
        # Warm through the genuine renderer before the owned pose list, so lazy initial state is not mistaken for a camera effect.
        page.evaluate("()=>{const a=HonroApp;a.scene.render(a.engine,0,'',.6,false,0);}")
        physics=None
        for name,dx,dy in VIEWS:
            q={'id':STAGE,'mapId':MAP['id'],'name':name,'dx':dx,'dy':dy,'ordinary':ORDINARY,'readback':False}
            f=page.evaluate(PARK,q)
            decode=page.evaluate(DECODE)
            assert decode['registered']>0 and not decode['failed']
            confirmed=page.evaluate(PARK,{**q,'readback':True})
            assert confirmed==f, ('post-decode state/camera drift',name)
            sign=sha(f.pop('signature').encode())
            physics=physics or sign
            png=canvas.screenshot(animations='disabled',timeout=30000)
            with Image.open(BytesIO(png)) as im:
                im.verify(); pixels=list(im.size)
            key=f'{variant}-s{STAGE:02d}-{w}x{h}-{name}'
            (OUT/(key+'.png')).write_bytes(png)
            frame={'variant':variant,'key':key,'png':key+'.png','pngSHA256':sha(png),'pixels':pixels,'viewportCSS':[w,h],
                   'DPR':1,'view':name,'physicsSHA256':sign,'decodeCount':decode['registered'],
                   'phaseReceiptValidated':False,**f}
            PROOF['frames'].append(frame);persist()
            assert physics==sign, ('different settled gameplay state between views', key)
            assert not errors,errors
            if name=='ordinary':
                actual=f['actual']
                assert [actual['x'],actual['y'],actual['scale']]==ORDINARY,('west-near clamp mismatch',actual)
                z=actual['scale']; t=f['viewport']; b=P['witnessWorld']
                roi=[floor((b['left']-t['left'])*z),floor((b['top']-t['top'])*z),
                     ceil((b['right']-t['left'])*z),ceil((b['bottom']-t['top'])*z)]
                assert 0<=roi[0]<roi[2]<=pixels[0] and 0<=roi[1]<roi[3]<=pixels[1], ('near ROI not fully in frame',roi)
                frame['nearWestRoiCSSPixels']=roi
                frame['nearWestRoiWorld']=b
                visit['ordinaryContactAndOwners']=page.evaluate(OWN,{'stage':STAGE,'front':P['owner'],'back':P['baseOwner'],'variant':variant})
                again=page.evaluate(PARK,{**q,'readback':True})
                assert sha(again.pop('signature').encode())==sign and again==f,'read-only ownership probe changed scene'
                persist()
            raw=raw_png(page,f['backing'])
            (OUT/(key+'-raw.png')).write_bytes(raw)
            frame.update(raw=key+'-raw.png',rawSHA256=sha(raw));persist()
            if variant=='A' and name!='east':
                for label,size in [('raw',f['backing']),('dom',pixels)]:
                    support=support_png(page,size,f['viewport'],f['actual']['scale'])
                    mask_name=key+'-support-'+label+'.png'
                    (OUT/mask_name).write_bytes(support)
                    frame['independentSupport'+label.upper()]={'png':mask_name,'sha256':sha(support)}
            if name in ('ordinary','west'):
                again=page.evaluate(PARK,{**q,'readback':True})
                assert sha(again.pop('signature').encode())==sign and again==f
                warm=raw_png(page,f['backing'])
                # Leave the west support completely: each E pose begins at x3920 and shows distinct world tiles.
                away=page.evaluate(PARK,{**q,'name':'east','dx':1,'dy':0,'readback':False})
                assert away['viewport']['left']>SPEC['bounds'][2] and [away['actual'][k] for k in ('x','y')]==P['sceneControl']['east']
                back=page.evaluate(PARK,{**q,'readback':False})
                assert sha(back.pop('signature').encode())==sign and back==f
                returned=raw_png(page,f['backing'])
                for k,payload in [('warm',warm),('returned',returned)]: (OUT/(key+'-'+k+'.png')).write_bytes(payload)
                frame['replay']={'rawSHA256':sha(raw),'warmSHA256':sha(warm),'returnedSHA256':sha(returned),
                                 'outOfRoiCamera':away['actual'],'equal':rgba_identical(raw,warm) and rgba_identical(raw,returned)}
            persist()
        minted=set(page.evaluate("()=>Array.from(window.__honroObserver.blobs)"))
        assert all(url in minted for url,_ in blobs), 'HTTP observer saw a non-local blob'
        visit['blobs']=[{'url':url,'type':typ,'browserGenerated':True} for url,typ in blobs]
        assert not errors,errors
        actual={}
        snapshot=list(responses)
        for rel,r in snapshot:
            value=check(rel,r.body(),CONFIG if variant=='B' and rel==SPEC['rel'] else KNOWN[rel])
            if rel in stage_paths(STAGE): actual[rel]=value
            if rel not in {x['path'] for x in visit['observed']}:
                visit['observed'].append({'path':rel,'status':200,**facts(value)})
        assert required_observed(STAGE)<={x['path'] for x in visit['observed']}, (
            'missing required actual responses',sorted(required_observed(STAGE)-{x['path'] for x in visit['observed']}))
        assert not errors and len(responses)==len(snapshot), ('late unexpected response',errors)
        assert facts(materialize(ROW,actual))==SOURCE['aggregate']
        visit['verifiedActualAggregate']=SOURCE['aggregate']
        visit['virtualResponses']=signed_routes
        assert len(signed_routes)==int(variant=='B')
        frames=[f for f in PROOF['frames'] if f['viewportCSS']==[w,h] and f['variant']==variant]
        byview={f['view']:f for f in frames}; assert len(frames)==len(byview)==4
        for name in ('west','overview','east'):
            a=byview[name]['actual']
            assert [a['x'],a['y']]==P['sceneControl'][name], (name,a)
        camera_keys={}
        for f in frames:
            coord=tuple(round(f['actual'][k],8) for k in ('x','y','scale'))
            f['duplicateOfCameraKey']=camera_keys.get(coord)
            camera_keys.setdefault(coord,f['key'])
            f['phaseReceiptValidated']=True
        visit['distinctActualCameras']=len(camera_keys)
        visit['complete']=True
    except Exception as exc:
        errors.append(['first failure',repr(exc)])
    finally:
        visit['elapsedSeconds']=round(time.monotonic()-before,3)
        try:
            visit['isolatedLifecycleRestored']=page.evaluate('()=>{if(window.__honroQAUndo){window.__honroQAUndo();delete window.__honroQAUndo;return true;}return false;}')
        finally:
            persist();ctx.close()


def rgba(b):
    with Image.open(BytesIO(b)) as im: return im.convert('RGBA')
def rgba_identical(a,b):
    aa,bb=rgba(a),rgba(b);return aa.size==bb.size and aa.tobytes()==bb.tobytes()
def raw_png(page, backing):
    blob=base64.b64decode(page.evaluate("()=>document.getElementById('battlecanvas').toDataURL('image/png').split(',')[1]"),validate=True)
    with Image.open(BytesIO(blob)) as im:
        assert list(im.size)==backing; im.verify()
    return blob
def support_png(page,dims,v,z):
    blob=page.evaluate(r'''q=>{
      const s=document.createElement('canvas');s.width=q.dim[0];s.height=q.dim[1];
      const c=s.getContext('2d');c.setTransform(q.z,0,0,q.z,-q.left*q.z,-q.top*q.z);
      c.fillStyle='#fff';c.fill(new Path2D(q.d));
      return s.toDataURL('image/png').split(',')[1];
    }''',{'dim':dims,'z':z,'left':v['left'],'top':v['top'],'d':SPEC['supportPath']})
    return base64.b64decode(blob,validate=True)
def compare_all(frames):
    results=[]
    A={tuple(f['viewportCSS'])+(f['view'],):f for f in frames if f['variant']=='A'}
    B={tuple(f['viewportCSS'])+(f['view'],):f for f in frames if f['variant']=='B'}
    assert A.keys()==B.keys()
    from PIL import ImageChops
    for key,a in A.items():
        b=B[key]; scenic=a['view']!='east'
        p={'key':list(key),'features':{},'strictPass':True}
        for t in ('actual','viewport','backing','physicsSHA256','actorCount','tide','sceneTime','phase','round','pixels','DPR'):
            if a[t]!=b[t]: p['strictPass']=False; p.setdefault('nonVisualMismatch',[]).append(t)
        if a.get('replay') or b.get('replay'):
            p['replays']=[f.get('replay',{}).get('equal',False) for f in (a,b)]
            if not all(p['replays']):p['strictPass']=False
        for label,filekey in [('RAW','raw'),('DOM','png')]:
            ia,ib=(rgba((OUT/f[filekey]).read_bytes()) for f in (a,b))
            assert ia.size==ib.size
            w,h=ia.size
            delta=ImageChops.difference(ia,ib)
            mr,mg,mb,ma=delta.split()
            raster=ImageChops.lighter(ImageChops.lighter(mr,mg),ImageChops.lighter(mb,ma))
            diff=raster.getdata(); alpha=ma.getdata()
            changed=out=ach=rift=0;touched=[]; maxOut=0
            if scenic:
                m=a['independentSupport'+label]
                data=(OUT/m['png']).read_bytes();assert sha(data)==m['sha256']
                geom=rgba(data);assert geom.size==ia.size
                mask=geom.getchannel('A').getdata()
            z=a['actual']['scale'];left=a['viewport']['left'];top=a['viewport']['top']
            for j,val in enumerate(diff):
                if not val:continue
                changed+=1;xx=j%w;yy=j//w;ach+=bool(alpha[j])
                xl=left+xx/z;xr=left+(xx+1)/z;yt=top+yy/z;yb=top+(yy+1)/z
                roof=2810+min(xr,0)*54.6875/500
                signed=scenic and mask[j]>0 and xl>=SPEC['bounds'][0] and xr<=SPEC['bounds'][2] and yt>=max(2813,roof+3) and yb<=3220
                if not signed:out+=1;maxOut=max(maxOut,val)
                if yt<=roof+8: rift+=1
                if len(touched)<12 and (not signed or alpha[j]):touched.append([xx,yy,round(xl,4),round(yt,4),val,alpha[j]])
            strict=(out==0 and ach==0 and (changed>0 if scenic else changed==0))
            if label=='RAW' and rift and scenic:
                # Signed material can change color below roof, but final visible rim's native stroke must be reviewed.
                p['nativeRimEyeReviewRequired']=True
            p['features'][label]={'changed':changed,'outsideWholePixelOrIndependentSupport':out,'alphaChanged':ach,
                'rimNeighborhoodChanges':rift,'maxOutsidePerChannel':maxOut,'coordinates':touched,'strict':strict}
            if not strict:p['strictPass']=False
        results.append(p)
    return results

persist()
try:
    with sync_playwright() as p:
        b=p.chromium.launch(headless=True)
        PROOF['browser']=b.version;persist()
        assert b.version=='151.0.7922.34'
        for w,h in VIEWPORTS:
            for variant in ('A','B'): one(b,w,h,variant)
        b.close()
    want={f'{variant}-s{STAGE:02d}-{w}x{h}-{name}' for w,h in VIEWPORTS for name,_,_ in VIEWS for variant in ('A','B')}
    got=PROOF['frames'];assert len(got)==16 and {f['key']for f in got}==want
    assert all(f['phaseReceiptValidated'] for f in got) and all(v['complete'] for v in PROOF['visits'])
    PROOF['comparison']=compare_all(got);persist()
    PROOF['complete']=all(x['strictPass'] for x in PROOF['comparison']);persist()
    assert PROOF['complete'],'hard hold: real browser changed a protected raster or lifecycle hold'
except Exception as exc:
    PROOF['failure']=repr(exc)
    raise
finally:
    persist()
