"""Read-only public normal-app canary observer; 20 keys per independently pinned stage."""
import base64, json, os, re, time
from io import BytesIO
from pathlib import Path
from urllib.parse import urlsplit
from PIL import Image
from playwright.sync_api import sync_playwright
from source import (BASE, P, LIVE, ARM, VIEWS, VIEWPORTS, ALL_PINS, check, facts, read, required_observed, save, sha,
                    stage_paths, verify_graph, materialize, ordinary_pose, media_evidence)

STAGE=int(os.environ['AUDIT_STAGE'])
OUT=Path(os.environ['AUDIT_OUT'])
assert str(STAGE) in P["stages"]
ROW=P['stages'][str(STAGE)]
SOURCE=json.loads((OUT/'public-source.json').read_bytes())
assert SOURCE['verified'] and SOURCE['stage']==STAGE and SOURCE['authority']==P['authority']
ACTIVE, MAP, AGGREGATE, STAGE_INPUTS=verify_graph(STAGE,read)
assert AGGREGATE==SOURCE['aggregate'] and STAGE_INPUTS==SOURCE['stageInputs']
ORDINARY, ORDINARY_ORIGIN=ordinary_pose(MAP, ROW)
BLOB=re.compile(r'blob:'+re.escape(BASE.rstrip('/').removesuffix('/honro'))+r'/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}')
MEDIA=set(f'assets/bgm/{n}.mp3' for n in ('main','battle-1','battle-2','battle-3','battle-4'))
KNOWN={'HONRO.html':ALL_PINS['HONRO.html'],'web/manifest.json':P['manifest'],**ACTIVE}
BASEURL=urlsplit(BASE)
PROOF={'release':LIVE,'stage':STAGE,'arm':ARM,'frames':[],'visits':[],'complete':False,
       'ordinaryAnchor':{'pose':ORDINARY,'selection':ORDINARY_ORIGIN},
       'scope':'Two disposable normal localhost builds; this arm uses actual loaded runtime and observer-parked cameras. Not deployment, human visual acceptance, or full play.'}

INIT=r"""()=>{
 const images=new Set(), blobs=new Set();
 const proto=HTMLImageElement.prototype, d=Object.getOwnPropertyDescriptor(proto,'src');
 Object.defineProperty(proto,'src',{...d,set(v){images.add(this);return d.set.call(this,v);}});
 const create=URL.createObjectURL;
 URL.createObjectURL=function(...args){const url=Reflect.apply(create,this,args);blobs.add(url);return url};
 Object.defineProperty(window,'__honroObserver',{value:{images,blobs},enumerable:false});
}"""
LAUNCH=r"""async q=>{
 const id=q.id, a=window.HonroApp;
 if(!a||typeof a.launch!=='function')throw Error('Normal app unavailable');
 a.frame=()=>{};
 a.profile.settings.music=false;a.profile.settings.sound=false;
 await HonroCampaignLoader.ensureStage(id);
 const compact=id===11?window.HONRO_STAGE11_COMPACT_DATA:window.HONRO_ACT2_COMPACT_PACKAGES?.[id];
 const active=HONRO_PROJECT.stages.find(s=>s.metadata?.stageId===id);
 const enabled=id===11?window.HonroStage11Compact?.enabled():window.HonroAct2Compact?.enabled(id);
 if(enabled!==true||!compact||!active||JSON.stringify(active)!==JSON.stringify(compact.stage)||
    compact.mapRevision!==q.compact.revision||active.width!==q.compact.width||active.height!==q.compact.height)
   throw Error('Normal compact author output does not match active signed package');
 for(const [name,evidence] of Object.entries(q.owners)){
   const aid=evidence.assetId, assets=HONRO_PROJECT.library.filter(x=>x.id===aid);
   if(assets.length!==1||!assets[0].vector)throw Error('Compact or retained native asset not registered '+name);
   if(evidence.origin==='active compact override'){
     const original=compact.assets.filter(x=>x.id===aid);
     if(original.length!==1||JSON.stringify(assets[0])!==JSON.stringify(original[0]))
       throw Error('Loaded compact asset is not exact packaged artwork '+name);
   }
 }
 for(let n=1;n<id;n++)a.profile.cleared[n]=true;
 for(const h of Object.values(a.profile.heroes))h.xp=HonroProgression.xpAt(HonroProgression.plan(id).entryLevel);
 a.launch(id);
 const b=a.engine?.b;
 if(!b||b.honroStage!==id||b.width!==q.compact.width||b.height!==q.compact.height||
    b.honroCampaignMapRevision!==q.compact.revision||
    (id===11&&window.HonroStage11Compact?.active(b)!==true))
   throw Error('Campaign launched wrong compact geometry or revision');
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
 if(st.width!==q.compact.width||st.height!==q.compact.height||b.width!==st.width||b.height!==st.height||b.honroCampaignMapRevision!==q.compact.revision)throw Error('Active playing dimensions/revision no longer exact compact');
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
   if(q.id===11){
     const [px,py]=q.compact.spawn;
     if(Math.abs(actual.x-430)>margin||Math.abs(actual.y-2370)>margin||Math.abs(actual.scale-.5)>margin||
        px<viewport.left||px>viewport.right||py<viewport.top||py>viewport.bottom)
       throw Error('Registered Stage11 compact route or real camera clamp not witnessed');
   }
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
 const a=HonroApp,e=a.engine,b=e.b,st=HONRO_PROJECT.stages.find(s=>s.metadata?.stageId===q.id);
 const L=HONRO_PROJECT.library;
 const landmarks=globalThis.HonroTerrainDomain?.materialLandmarks?.(b)??[];
 const owners=[];
 for(const [id,expected] of Object.entries(q.owners)){
   const aid=expected.assetId;
   const es=st.elements.filter(x=>x.id===id), assets=L.filter(x=>x.id===aid);
   if(es.length!==1||es[0].assetId!==aid||assets.length!==1)
     throw Error('Named native compact owner did not resolve '+id+' '+aid);
   const v=assets[0], el=es[0], keys=['x','y','w','h'];
   if(!v.vector||JSON.stringify(v.bounds??null)!==JSON.stringify(expected.bounds??null)&&
       (!v.bounds||!expected.bounds||!keys.every(k=>v.bounds[k]===expected.bounds[k])))
     throw Error('Current owner has wrong native bounds '+id);
   for(const [k,val] of Object.entries(expected.authored))if((el[k]??null)!==val)
     throw Error('Named compact placement changed '+id+' '+k);
   const drawOwners=landmarks.filter(x=>x.id===id);
   const battleOwners=(b.honroLandmarks||[]).filter(x=>x.id===id);
   if(drawOwners.length!==1||battleOwners.length!==1||drawOwners[0]!==battleOwners[0]||
      drawOwners[0].kind!=='canonical-element'||drawOwners[0].asset?.id!==aid||!drawOwners[0].asset?.vector||
      JSON.stringify(drawOwners[0].asset.vector)!==JSON.stringify(v.vector))
     throw Error('Actual renderer has wrong compiled native owner '+id);
   const now=drawOwners[0];
   owners.push({id,assetId:aid,origin:expected.origin,layer:el.layer,
      placement:[el.x,el.y,el.scale],nativeBounds:v.bounds??null,kind:now.kind,
      compiled:{layer:now.layer,x:now.x,y:now.y,scale:now.scale,assetId:now.asset.id}});
 }
 if(owners.length===0)throw Error('No exact current compact owner witnesses');
 const byscreen=(x,y)=>({x:(x-q.view.left)*q.cam.scale,y:(y-q.view.top)*q.cam.scale});
 const inside=u=>u.x>=q.view.left&&u.x<=q.view.right&&u.y>=q.view.top&&u.y<=q.view.bottom;
 const visible=b.units.filter(u=>Number.isFinite(u.x)&&Number.isFinite(u.y)&&!u.dead&&inside(u));
 visible.sort((i,j)=>(i.side===0?0:1)-(j.side===0?0:1)||i.x-j.x);
 const supported=typeof e.contactSurface==='function';
 const observe=u=>{
   const contact=supported?e.contactSurface(u.x,u.y-12,u.y+18):null, terrain=contact?.t?.id??null;
   return {id:u.id,side:u.side,world:[u.x,u.y],screen:byscreen(u.x,u.y),ground:u.ground??null,flying:u.flying??u.honroFlying??null,
    contactTerrain:terrain,contactY:Number.isFinite(contact?.y)?contact.y:null,
    sourceContainsTerrain:terrain?st.terrains.some(x=>x.id===terrain):null};
 };
 return {registeredAssets:owners,ownerStatus:owners.length?'registered-source matched':'no strong registered source owner selected; diagnostic gap',
   dynamicMarks:landmarks.length,actorContact:supported?visible.slice(0,4).map(observe):[],
   actorScope:'parked initial scene only; screen values are model anchors, not visually approved feet',
   visibleUnits:visible.length,contactQueryAvailable:supported};
}"""

def persist(): save(OUT,'proof.json',PROOF)
def path_of(url):
    q=urlsplit(url)
    if (q.scheme,q.netloc)!=(BASEURL.scheme,BASEURL.netloc) or q.query or q.fragment or not url.startswith(BASE):
        return None
    return q.path.removeprefix(BASEURL.path)

def one(browser, w, h):
    ctx=browser.new_context(viewport={'width':w,'height':h},device_scale_factor=1,service_workers='block')
    ctx.set_default_timeout(30000)
    assert ctx.storage_state()=={'cookies':[],'origins':[]}
    page=ctx.new_page()
    errors=[]; responses=[]; blobs=[]; media=[]
    visit={'viewportCSS':[w,h],'observed':[],'errors':errors,'blobs':[],'media':media,'complete':False}
    PROOF['visits'].append(visit); persist()

    def on_resp(r):
        rel=path_of(r.url); req=r.request
        if BLOB.fullmatch(r.url) and r.status==200 and req.method=='GET':
            blobs.append((r.url,req.resource_type)); return
        if rel in MEDIA and req.method=='GET' and req.resource_type=='media' and r.status in (200,206):
            try:
                media.append(media_evidence(rel,req.method,req.resource_type,r.status,
                    req.header_value('range'),r.header_value('content-range'),r.header_value('content-length')))
            except AssertionError as exc:
                errors.append(['invalid media protocol',rel,r.status,repr(exc)])
            return
        if rel not in KNOWN or req.method!='GET' or r.status!=200:
            errors.append(['unexpected response',req.method,r.status,r.url]);return
        responses.append((rel,r))
    def req_failed(r):
        rel=path_of(r.url)
        if rel in MEDIA-{'assets/bgm/battle-4.mp3'} and r.method=='GET' and r.resource_type=='media' and r.failure=='net::ERR_ABORTED':
            media.append({'path':rel,'aborted':True});return
        errors.append(['failed request',r.url,r.failure])
    page.on('response',on_resp)
    page.on('requestfailed',req_failed)
    page.on('request',lambda r:errors.append(['non-read request', r.url,r.method]) if r.method!='GET' else None)
    page.on('pageerror',lambda e:errors.append(['pageerror',str(e)]))
    page.add_init_script('('+INIT+')()')
    before=time.monotonic()
    try:
        shell=page.goto(BASE+'HONRO.html',wait_until='domcontentloaded',timeout=50000)
        assert shell and shell.url==BASE+'HONRO.html' and shell.status==200
        check('browser shell',shell.body(),ALL_PINS['HONRO.html'])
        page.wait_for_function("""()=>Boolean((document.documentElement.dataset.honroReady==='true'&&window.HonroCampaignLoader)
        || document.querySelector('[data-startup-retry]'))""",timeout=90000)
        assert page.evaluate("()=>Boolean(document.documentElement.dataset.honroReady==='true'&&window.HonroCampaignLoader)")
        page.evaluate(LAUNCH,{"id":STAGE,"compact":ROW["compact"],"owners":STAGE_INPUTS["selectedOwners"]})
        canvas=page.locator('#battlecanvas')
        canvas.wait_for(state='visible')
        page.wait_for_function("""()=>{const a=HonroApp;HonroStory.tick(a,performance.now());HonroStory.draw(a);
           return Boolean(document.getElementById('turn-banner')?.hidden!==false&&!a.dialogue);}""",polling=125,timeout=9000)
        # Warm through the genuine renderer before the owned pose list, so lazy initial state is not mistaken for a camera effect.
        page.evaluate("()=>{const a=HonroApp;a.scene.render(a.engine,0,'',.6,false,0);}")
        physics=None
        for name,dx,dy in VIEWS:
            q={'id':STAGE,'mapId':MAP['id'],'name':name,'dx':dx,'dy':dy,'ordinary':ORDINARY,'compact':ROW['compact'],'readback':False}
            f=page.evaluate(PARK,q)
            decode=page.evaluate(DECODE)
            assert decode['registered']>0 and not decode['failed']
            confirmed=page.evaluate(PARK,{**q,'readback':True})
            assert confirmed==f, ('post-decode state/camera drift',name)
            if name=='ordinary':
                visit['ordinaryContactAndOwners']=page.evaluate(OWN,{
                    'id':STAGE,'owners':STAGE_INPUTS['selectedOwners'],'view':f['viewport'],'cam':f['actual']})
                assert page.evaluate(PARK,{**q,'readback':True})==f,'ownership/contact observation changed scene'
            sign=sha(f.pop('signature').encode())
            physics=physics or sign
            png=canvas.screenshot(animations='disabled',timeout=30000)
            with Image.open(BytesIO(png)) as im:
                im.verify(); pixels=list(im.size)
            key=f's{STAGE:02d}-{w}x{h}-{name}'
            (OUT/(key+'.png')).write_bytes(png)
            frame={'key':key,'png':key+'.png','pngSHA256':sha(png),'pixels':pixels,'viewportCSS':[w,h],
                   'DPR':1,'view':name,'physicsSHA256':sign,'decodeCount':decode['registered'],
                   'phaseReceiptValidated':False,**f}
            PROOF['frames'].append(frame);persist()
            assert physics==sign, ('different settled gameplay state between views', key)
            assert not errors,errors
            if True:  # Preserve original raw evidence as well as real DOM capture at every camera.
                raw=base64.b64decode(page.evaluate("()=>document.getElementById('battlecanvas').toDataURL('image/png').split(',')[1]"),validate=True)
                with Image.open(BytesIO(raw)) as im:
                    assert list(im.size)==f['backing'];im.verify()
                (OUT/(key+'-raw.png')).write_bytes(raw)
                frame.update(raw=key+'-raw.png',rawSHA256=sha(raw));persist()
        minted=set(page.evaluate("()=>Array.from(window.__honroObserver.blobs)"))
        assert all(url in minted for url,_ in blobs), 'HTTP observer saw a non-local blob'
        visit['blobs']=[{'url':url,'type':typ,'browserGenerated':True} for url,typ in blobs]
        assert not errors,errors
        actual={}
        snapshot=list(responses)
        for rel,r in snapshot:
            value=check(rel,r.body(),KNOWN[rel])
            if rel in stage_paths(STAGE): actual[rel]=value
            if rel not in {x['path'] for x in visit['observed']}:
                visit['observed'].append({'path':rel,'status':200,**facts(value)})
        assert required_observed(STAGE)<={x['path'] for x in visit['observed']}, (
            'missing required actual responses',sorted(required_observed(STAGE)-{x['path'] for x in visit['observed']}))
        assert not errors and len(responses)==len(snapshot), ('late unexpected response',errors)
        assert facts(materialize(ROW,actual))==SOURCE['aggregate']
        visit['verifiedActualAggregate']=SOURCE['aggregate']
        frames=[f for f in PROOF['frames'] if f['viewportCSS']==[w,h]]
        byview={f['view']:f for f in frames}; around=byview['overview']['actual']
        assert len(frames)==len(byview)==10
        for name,dx,dy in VIEWS:
            f=byview[name];a=f['actual']
            if dx: assert dx*(a['x']-around['x'])>=-1e-6,('wrong horizontal extreme',name,a,around)
            if dy: assert dy*(a['y']-around['y'])>=-1e-6,('wrong vertical extreme',name,a,around)
        camera_keys={}
        for f in frames:
            coord=tuple(round(f['actual'][k],8) for k in ('x','y','scale'))
            f['duplicateOfCameraKey']=camera_keys.get(coord)
            camera_keys.setdefault(coord,f['key'])
            f['phaseReceiptValidated']=True
        visit['distinctActualCameras']=len(camera_keys)
        route=page.evaluate("()=>HonroApp.scene._stage15NorthQaProof??null")
        if ARM=='A': assert route is None
        else: assert route and route['candidate']>0 and route['lowerStock']>0,route
        visit['tileRoutes']=route
        visit['complete']=True
    except Exception as exc:
        errors.append(['first failure',repr(exc)])
    finally:
        visit['elapsedSeconds']=round(time.monotonic()-before,3);persist();ctx.close()

persist()
try:
    with sync_playwright() as p:
        b=p.chromium.launch(headless=True)
        PROOF['browser']=b.version;persist()
        assert b.version=='151.0.7922.34'
        for w,h in VIEWPORTS:
            one(b,w,h)
        b.close()
    want={f's{STAGE:02d}-{w}x{h}-{name}' for w,h in VIEWPORTS for name,_,_ in VIEWS}
    got=PROOF['frames'];assert len(got)==20 and {f['key']for f in got}==want
    assert all(f['phaseReceiptValidated'] for f in got) and all(v['complete'] for v in PROOF['visits'])
    PROOF['complete']=True
except Exception as exc:
    PROOF['failure']=repr(exc)
    raise
finally:
    persist()
