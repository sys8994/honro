"""Stage15 actual normal-app capture; one checked build per invocation, 24 frozen views."""
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
assert STAGE==15 and str(STAGE) in P["stages"]
ROW=P['stages'][str(STAGE)]
SOURCE=json.loads((OUT/'public-source.json').read_bytes())
assert SOURCE['verified'] and SOURCE['stage']==STAGE and SOURCE['authority']==P['authority']
ACTIVE, MAP, AGGREGATE, STAGE_INPUTS=verify_graph(STAGE,read)
assert AGGREGATE==SOURCE['aggregate'] and STAGE_INPUTS==SOURCE['stageInputs']
ORDINARY, ORDINARY_ORIGIN=ordinary_pose(MAP, ROW)
QC=Path(__file__).resolve().parent
PINS=json.loads((QC/'frozen-cameras.json').read_bytes())
BUNDLE=json.loads(Path(os.environ['AUDIT_CAPTURE_BUNDLE']).read_bytes())
assert set(BUNDLE)=={'schema','stage','release','arm','manifest','runtime','compactAggregate','formalJoin'}
assert BUNDLE['schema']==1 and BUNDLE['stage']==15 and BUNDLE['release']==LIVE==PINS['release']
assert PINS['schema']==1 and PINS['stage']==15 and PINS['cachedKeySummary']=={'legacy':63,'detail':10,'total':73}
assert BUNDLE['arm']==SOURCE['arm']==ARM and type(BUNDLE['formalJoin']) is bool
assert BUNDLE['manifest']==P['manifest']
assert BUNDLE['compactAggregate']==STAGE_INPUTS['activeCompactAggregate']==P['overrides']['act2Aggregate']
assert set(BUNDLE['runtime'])=={'path','bytes','sha256'}
ROUTE_RUNTIME=BUNDLE['runtime']['path']
assert ROUTE_RUNTIME.startswith('web/runtime/') and ROUTE_RUNTIME in P['modules']
assert ACTIVE[ROUTE_RUNTIME]=={k:BUNDLE['runtime'][k] for k in ('bytes','sha256')}
check('signed combined native runtime',read(ROUTE_RUNTIME),ACTIVE[ROUTE_RUNTIME])
JOIN_METHOD='_stage15TerrainReliefLandmarks'
assert (JOIN_METHOD.encode() in read(ROUTE_RUNTIME)) is BUNDLE['formalJoin']
CANONICAL_VIEWS=tuple(x[0] for x in VIEWS)
EXTRA=(('roof-detail',0,0),('ground-detail',0,0))
assert CANONICAL_VIEWS==('ordinary','overview','north','south','west','east','northwest','northeast','southwest','southeast')
assert list(map(tuple,VIEWPORTS))==[(1440,900),(390,844)]
assert ORDINARY==[224,2038.4444444444443,.5]
FROZEN_ATTRS=('desired','actual','viewport','focus','zoomLimits','css','backing','pixels','DPR',
              'actorCount','phase','round','tide','sceneTime','physicsSHA256','viewportCSS','view')

BLOB=re.compile(r'blob:'+re.escape(BASE.rstrip('/').removesuffix('/honro'))+r'/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}')
MEDIA=set(f'assets/bgm/{n}.mp3' for n in ('main','battle-1','battle-2','battle-3','battle-4'))
KNOWN={'HONRO.html':ALL_PINS['HONRO.html'],'web/manifest.json':P['manifest'],**ACTIVE}
BASEURL=urlsplit(BASE)
assert BASEURL.scheme=='http' and BASEURL.hostname=='127.0.0.1' and 1024<=BASEURL.port<=65535
assert BASEURL.path=='/' and not BASEURL.query and not BASEURL.fragment and not BASEURL.username and not BASEURL.password
PROOF={'release':LIVE,'stage':STAGE,'arm':ARM,'frames':[],'visits':[],'complete':False,
       'ordinaryAnchor':{'pose':ORDINARY,'selection':ORDINARY_ORIGIN},
       'scope':'Normal localhost renderer, one integrated or baseline arm, frozen initial turn/play. Not a playthrough, release or art approval.',
       'sources':BUNDLE,'cameraPinsSHA256':sha((QC/'frozen-cameras.json').read_bytes()),'previousCameraReceipts':PINS['priorReceipts']}

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
 const desired=q.detail??(q.name==='ordinary'?{x:q.ordinary[0],y:q.ordinary[1],scale:q.ordinary[2]}:
    {x:q.dx?q.dx*1e6:st.width/2,y:q.dy?q.dy*1e6:st.height/2,scale:z.min});
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
 if(q.detail){
   if(!['roof-detail','ground-detail'].includes(q.name)||actual.scale<=z.min||actual.scale>z.max||
      Object.keys(actual).some(k=>Math.abs(actual[k]-q.detail[k])>1e-6))
    throw Error('Owned detail camera not contained or not exact');
   if(q.name==='roof-detail'&&(viewport.left>710+1e-6||viewport.right<1360-1e-6||
      viewport.top>1200||viewport.bottom<1500)) throw Error('Pinned roof source contact out of frame');
   if(q.name==='ground-detail'&&(viewport.left>0||viewport.right<551||
      viewport.top>2020||viewport.bottom<2540)) throw Error('Pinned floor source contact out of frame');
 }else if(q.name==='ordinary'){
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
 if(q.name!=='ordinary'&&!q.detail&&!q.readback){
   const edge=axis=>{const p=pos(), ext=axis==='x'?[f.left,f.right]:[f.top,f.bottom];return p[axis]>=ext[0]-1e-6&&p[axis]<=ext[1]+1e-6};
   if(!edge('x')||!edge('y'))throw Error('Extremes outside approved focus');
 }
 return {desired,actual,viewport,focus:f,zoomLimits:z,css:{w:r.width,h:r.height},backing:[s.canvas.width,s.canvas.height],
         DPR:devicePixelRatio,actorCount:b.units.length,tide:b.honroAct4PreviewState?.tide??null,
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

CACHE=r"""({view,known})=>{
 const s=HonroApp.scene,b=HonroApp.engine.b,q=s._domainTiles,d=b.honroTerrainBounds;
 if(!q||!(q.tiles instanceof Map)||!(q.rs>0)||!d)throw Error('Native active 512 raster tile cache missing');
 const cs=s.canvas.getBoundingClientRect(),v=HonroBounds.viewport(s,cs.width,cs.height);
 if(JSON.stringify(v)!==JSON.stringify(view))throw Error('Camera changed before cache sample');
 const rs=q.rs, size=512/rs;
 const minX=Math.floor(Math.max(v.left,d.left)/size),maxX=Math.floor(Math.min(v.right,d.right)/size);
 const minY=Math.floor(Math.max(v.top,d.top)/size),maxY=Math.floor(Math.min(v.bottom,d.bottom)/size);
 const keys=[],fresh=[];
 for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++){
   const id=x+':'+y,t=q.tiles.get(id),key=rs.toString()+':'+id;
   if(!t||t.canvas.width!==516||t.canvas.height!==516||t.left!==x*size||t.top!==y*size)
      throw Error('Missing exact native cache tile '+key);
   keys.push(key);
   if(!known.includes(key))fresh.push({key,id,rs,left:t.left,top:t.top,png:t.canvas.toDataURL('image/png').split(',')[1]});
 }
 return {keys,fresh};
}"""

def cache_witness(page,visit,f,w,h):
    tiles=visit.setdefault('tileFrames',{})
    res=page.evaluate(CACHE,{'view':f['viewport'],'known':list(tiles)})
    for ent in res['fresh']:
        key=ent['key']; assert key not in tiles and re.fullmatch(r'[\d.e+:-]+',key)
        raw=base64.b64decode(ent.pop('png'),validate=True)
        with Image.open(BytesIO(raw)) as im:
            assert list(im.size)==[516,516]; im.verify()
        name=f'tile-{w}x{h}-'+key.replace(':','_')+'.png'
        (OUT/name).write_bytes(raw)
        tiles[key]={**ent,'path':name,'sha256':sha(raw)}
    assert all(k in tiles for k in res['keys'])
    return res['keys']

JOIN_OBSERVER=r"""({name,needed})=>{
 const scene=HonroApp.scene, original=scene[name], methodExists=typeof original==='function';
 if(methodExists!==needed)throw Error('Formal join capability differs from signed runtime arm');
 if(!needed)return null;
 if(Object.hasOwn(scene,name)||Object.hasOwn(scene,'_captureJoinWitness'))throw Error('Join observer not installed once');
 const rows=new Map(), errors=[], active=scene._domainTiles,
       preObserver=active?.tiles instanceof Map?[...active.tiles.keys()].map(id=>active.rs.toString()+':'+id):[];
 Object.defineProperty(scene,'_captureJoinWitness',{value:{rows,errors,preObserver},enumerable:false,configurable:true});
 Object.defineProperty(scene,name,{enumerable:false,configurable:true,value:function(...args){
   // Render result is computed by the real method once, and returned unmodified
   // even if read-only observation detects an unexpected native signature.
   const result=Reflect.apply(original,this,args);
   try {
    const [b,domain,stock,view,rs]=args;
    if(b.honroStage!==15||b.honroCustom!==false||!b.honroCanonical||!Array.isArray(stock)||!Array.isArray(result)||
       stock.length!==result.length||!view||!(rs>0)||!(domain.left===-5000&&domain.right===10800&&domain.top===-25600&&domain.bottom===28400))
     throw Error('Unexpected actual relief method args/array');
    const size=512/rs,x=Math.round(view.left/size),y=Math.round(view.top/size);
    if(view.left!==x*size||view.top!==y*size)throw Error('Relief not acquired at actual stock tile origin');
    const key=rs.toString()+':'+x+':'+y,state=view.top<0?'north':'south';
    const changed=stock.flatMap((a,i)=>a===result[i]?[]:[i]);
    const id='act2-compact-stage15-act2-stage15-traced-outer-v1-1';
    let outcome='stock';
    if(result!==stock){
     if(changed.length!==1||stock[changed[0]]?.id!==id||result[changed[0]]?.id!==id||
        stock[changed[0]].asset===result[changed[0]].asset||
        stock[changed[0]].asset?.id!==result[changed[0]].asset?.id)
      throw Error('Formal relief changed more than one exact outer owner');
     outcome=state;
    }else if(changed.length)throw Error('Unexpected in-place relief array change');
    const item={key,side:state,outcome,left:view.left,top:view.top,rs,
                rowRefChanges:changed.length,count:(rows.get(key)?.count??0)+1};
    if(rows.has(key)&&rows.get(key).outcome!==outcome)throw Error('Relief routing nondeterministic for fixed tile');
    rows.set(key,item);
   } catch(e) { if(errors.length<20)errors.push(String(e)); }
   return result;
 }});
 return {method:name,originalCalledOnce:true,sameReturnIdentity:true};
}"""
JOIN_READ=r"""()=>{
 const w=HonroApp.scene._captureJoinWitness;
 if(!w)return null;
 return {rows:[...w.rows.values()],errors:w.errors.slice(),preObserver:w.preObserver.slice()};
}"""

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
        visit['formalJoinObserver']=page.evaluate(JOIN_OBSERVER,{'name':JOIN_METHOD,'needed':BUNDLE['formalJoin']})
        canvas=page.locator('#battlecanvas')
        canvas.wait_for(state='visible')
        page.wait_for_function("""()=>{const a=HonroApp;HonroStory.tick(a,performance.now());HonroStory.draw(a);
           return Boolean(document.getElementById('turn-banner')?.hidden!==false&&!a.dialogue);}""",polling=125,timeout=9000)
        # Warm through the genuine renderer before the owned pose list, so lazy initial state is not mistaken for a camera effect.
        page.evaluate("()=>{const a=HonroApp;a.scene.render(a.engine,0,'',.6,false,0);}")
        physics=None
        for name,dx,dy in (*VIEWS,*EXTRA):
            key=f's{STAGE:02d}-{w}x{h}-{name}'
            pin=PINS['poses'][key]
            q={'id':STAGE,'mapId':MAP['id'],'name':name,'dx':dx,'dy':dy,'ordinary':ORDINARY,'compact':ROW['compact'],'readback':False,
               'detail':pin['actual'] if name in ('roof-detail','ground-detail') else None}
            f=page.evaluate(PARK,q)
            decode=page.evaluate(DECODE)
            assert decode['registered']>0 and not decode['failed']
            confirmed=page.evaluate(PARK,{**q,'readback':True})
            assert confirmed==f, ('post-decode state/camera drift',name)
            if name in ('ordinary','roof-detail','ground-detail'):
                visit.setdefault('contactAndOwners',{})[name]=page.evaluate(OWN,{
                    'id':STAGE,'owners':STAGE_INPUTS['selectedOwners'],'view':f['viewport'],'cam':f['actual']})
                assert page.evaluate(PARK,{**q,'readback':True})==f,'ownership/contact observation changed scene'
            sign=sha(f.pop('signature').encode())
            physics=physics or sign
            png=canvas.screenshot(animations='disabled',timeout=30000)
            with Image.open(BytesIO(png)) as im:
                im.verify(); pixels=list(im.size)
            (OUT/(key+'.png')).write_bytes(png)
            frame={'key':key,'png':key+'.png','pngSHA256':sha(png),'pixels':pixels,'viewportCSS':[w,h],
                   'view':name,'physicsSHA256':sign,'decodeCount':decode['registered'],
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
                frame['tileKeys']=cache_witness(page,visit,f,w,h);persist()
            mismatch={k:{'wanted':pin[k],'actual':frame[k]} for k in FROZEN_ATTRS if frame[k]!=pin[k]}
            if mismatch:
                frame['frozenMismatch']=mismatch;persist()
                raise AssertionError(('frozen camera/layout/gameplay differs',key,sorted(mismatch)))
            assert frame['tileKeys']==pin['pinnedActualTileKeys'],(key,'frozen tile keys drift',frame['tileKeys'])
            frame['poseProvenance']=pin['poseProvenance']
            if name=='ordinary':visit['ordinaryContactAndOwners']=visit['contactAndOwners'][name]
            persist()
        minted=set(page.evaluate("()=>Array.from(window.__honroObserver.blobs)"))
        assert all(url in minted for url,_ in blobs), 'HTTP observer saw a non-local blob'
        visit['blobs']=[{'url':url,'type':typ,'browserGenerated':True} for url,typ in blobs]
        assert not errors,errors
        n=P['overrides']
        compact_files={n['act2Descriptor'],*n['act2Parts']}
        actual={}
        snapshot=list(responses)
        for rel,r in snapshot:
            value=check(rel,r.body(),KNOWN[rel])
            if rel in stage_paths(STAGE) or rel in compact_files: actual[rel]=value
            if rel not in {x['path'] for x in visit['observed']}:
                visit['observed'].append({'path':rel,'status':200,**facts(value)})
        assert required_observed(STAGE)<={x['path'] for x in visit['observed']}, (
            'missing required actual responses',sorted(required_observed(STAGE)-{x['path'] for x in visit['observed']}))
        assert not errors and len(responses)==len(snapshot), ('late unexpected response',errors)
        assert facts(materialize(ROW,actual))==SOURCE['aggregate']
        visit['verifiedActualAggregate']=SOURCE['aggregate']
        assert all(p in actual for p in compact_files)
        descriptor=json.loads(actual[n['act2Descriptor']])
        assert descriptor['$honroJsonParts']==1 and [p['path'] for p in descriptor['parts']]==n['act2Parts']
        assert {k:descriptor[k]for k in ('bytes','sha256')}==BUNDLE['compactAggregate']
        compact_wire=b''.join(check(p['path'],actual[p['path']],{k:p[k]for k in ('bytes','sha256')})for p in descriptor['parts'])
        assert facts(compact_wire)==BUNDLE['compactAggregate']
        visit['verifiedHTTPCompactAggregate']=BUNDLE['compactAggregate']
        matches=[receipt for receipt in visit['observed'] if receipt['path']==ROUTE_RUNTIME]
        assert matches==[{'status':200,**BUNDLE['runtime']}]
        visit['verifiedHTTPJoinRuntime']=matches[0]
        frames=[f for f in PROOF['frames'] if f['viewportCSS']==[w,h]]
        byview={f['view']:f for f in frames}; around=byview['overview']['actual']
        assert len(frames)==len(byview)==12
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
        records=page.evaluate(JOIN_READ)
        if BUNDLE['formalJoin']:
            assert records is not None and not records['errors'],records
            saved={r['key']:r for r in records['rows']}
            relevant={k for f in frames for k in f['tileKeys']}
            missing=relevant-saved.keys()
            assert missing<=set(records['preObserver']),(w,h,'missing actual formal route', sorted(missing))
            seen={saved[k]['outcome'] for k in relevant if k in saved}
            assert seen=={'stock','north','south'},(w,h,seen)
            for f in frames:
                f['observedFormalRoutes']=[{'tileKey':k,'result':saved[k]['outcome'] if k in saved else 'pre-observer'}for k in f['tileKeys']]
        else:
            assert records is None
        visit['formalJoinRouteReceipt']=records
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
        assert b.version==PINS['browser']=='151.0.7922.34'
        for w,h in VIEWPORTS:
            one(b,w,h)
        b.close()
    want=set(PINS['poses'])
    got=PROOF['frames']; assert len(got)==len(want)==24 and {f['key']for f in got}==want
    old={key for f in got if f['poseProvenance']=='S' for key in f['tileKeys']}
    detail={key for f in got if f['poseProvenance']!='S' for key in f['tileKeys']}
    assert len(old)==63 and len(detail)==10 and not (old&detail) and len(old|detail)==73
    PROOF['validatedDistinctNativeTileKeys']={'legacy':len(old),'detail':len(detail),'total':len(old|detail)}
    assert all(f['phaseReceiptValidated'] for f in got) and all(v['complete'] for v in PROOF['visits'])
    PROOF['complete']=True
except Exception as exc:
    PROOF['failure']=repr(exc)
    raise
finally:
    persist()
