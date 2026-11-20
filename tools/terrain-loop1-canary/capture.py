"""Read-only public normal-app canary observer; 20 keys per independently pinned stage."""
import base64, json, os, re, time
from io import BytesIO
from pathlib import Path
from urllib.parse import urlsplit
from PIL import Image
from playwright.sync_api import sync_playwright
from source import BASE, P, LIVE, VIEWS, VIEWPORTS, check, facts, read, required, save, sha, stage_paths, verify_graph, materialize

STAGE=int(os.environ['AUDIT_STAGE'])
OUT=Path(os.environ['AUDIT_OUT'])
assert STAGE in (1,26,38)
ROW=P['stages'][str(STAGE)]
SOURCE=json.loads((OUT/'public-source.json').read_bytes())
assert SOURCE['verified'] and SOURCE['stage']==STAGE and SOURCE['authority']==P['authority']
ACTIVE, MAP, AGGREGATE=verify_graph(STAGE,read)
assert AGGREGATE==SOURCE['aggregate']
BLOB=re.compile(r'blob:https://sys8994\.github\.io/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}')
MEDIA=set(f'assets/bgm/{n}.mp3' for n in ('main','battle-1','battle-2','battle-3'))
KNOWN={'HONRO.html':P['required']['HONRO.html'],'web/manifest.json':P['manifest'],**ACTIVE}
BASEURL=urlsplit(BASE)
PROOF={'release':LIVE,'stage':STAGE,'frames':[],'visits':[],'complete':False,
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
 const a=HonroApp,e=a.engine,b=e.b,st=HONRO_PROJECT.stages.find(s=>s.metadata?.stageId===q.id);
 const L=HONRO_PROJECT.library;
 const registered=id=>{const found=L.filter(v=>v.id===id);if(found.length!==1)throw Error('Asset owner not unique '+id);return found[0]};
 const result={assets:[],contact:[]};
 for(const [name,aid] of Object.entries(q.owners)){
   if(name==='@kiln'){
     const rows=()=>HonroTerrainDomain.materialLandmarks(b).filter(r=>r.id===aid&&r.asset?.id===aid);
     const [row,...dup]=rows(),native=registered(aid), asset=row?.asset;
     if(!row||dup.length||row.kind!=='canonical-element'||row.x!==0||row.y!==0||row.scale!==1||
        asset===native||asset.bounds===native.bounds||rows()[0].asset!==asset)
       throw Error('Wrong or unstable Stage26 render owner');
     const shared=Object.keys(asset).filter(k=>k!=='bounds').sort();
     if(Object.keys(native).sort().join('|')!==Object.keys(asset).sort().join('|')||
        !shared.every(k=>Object.is(asset[k],native[k]))||
        Object.keys(asset.bounds).sort().join('|')!==Object.keys(native.bounds).sort().join('|')||
        !Object.keys(asset.bounds).filter(k=>!['x','w'].includes(k)).every(k=>Object.is(asset.bounds[k],native.bounds[k])))
       throw Error('Unexpected Stage26 material clone change');
     result.assets.push({assetId:aid,nativeBounds:native.bounds,renderBounds:asset.bounds,
          sharedOwnFields:shared,material:asset.params?.westBedMaterial??null});
   }else{
     const es=st.elements.filter(x=>x.id===name);
     if(es.length!==1||(aid!==null&&es[0].assetId!==aid))throw Error('Missing active native owner '+name);
     const a=registered(es[0].assetId);
     result.assets.push({id:name,assetId:a.id,bounds:a.bounds??null,layer:es[0].layer,
       x:es[0].x,y:es[0].y,scale:es[0].scale,rootTransform:a.vector?.root?.transform??null});
   }
 }
 if(q.id===38){
   const t=st.terrains.find(r=>r.id===q.contact38.support), rt=b.terrain.find(r=>r.id===q.contact38.support);
   if(!t||!rt||typeof e.contactSurface!=='function')throw Error('Missing supported Stage38 contact query');
   const idx=t.properties.honroWalkEdges, runtime=HONRO_CORE.poly(rt);
   const project=(x,y)=>({x:(x-q.view.left)*q.cam.scale,y:(y-q.view.top)*q.cam.scale});
   function edgeAt(points,x){
     for(const i of idx){
       const a=points[i],b=points[(i+1)%points.length];if(!a||!b||a.x===b.x)continue;
       if(x>=Math.min(a.x,b.x)&&x<=Math.max(a.x,b.x))return {edge:i,x,y:a.y+(b.y-a.y)*(x-a.x)/(b.x-a.x)};
     }return null;
   }
   for(const target of Object.values(q.contact38.actors)){
     const u=e.unit(target.id), authored=st.units.find(x=>x.id===target.id);
     if(!u||!authored||authored.kind!==target.kind||authored.x!==target.sourceX||Math.abs(authored.y-target.sourceY)>1e-6)
       throw Error('Wrong expected clip/contact actor '+target.id);
     const source=edgeAt(t.points,u.x), rtHit=edgeAt(runtime,u.x), hit=e.contactSurface(u.x,u.y-8,u.y+10);
     result.contact.push({id:target.id,position:[u.x,u.y],height:u.h??null,ground:u.ground??null,
       sourceEdge:source,runtimeEdge:rtHit,contactSurface:hit?.t?.id??null,contactY:hit?.y??null,
       anchor:project(u.x,u.y),supportAnchor:rtHit?project(rtHit.x,rtHit.y):null});
   }
 }
 return result;
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
            q={'id':STAGE,'mapId':MAP['id'],'name':name,'dx':dx,'dy':dy,'ordinary':ROW['ordinary'],'readback':False}
            f=page.evaluate(PARK,q)
            decode=page.evaluate(DECODE)
            assert decode['registered']>0 and not decode['failed']
            confirmed=page.evaluate(PARK,{**q,'readback':True})
            assert confirmed==f, ('post-decode state/camera drift',name)
            if name=='ordinary':
                own=page.evaluate(OWN,{'id':STAGE,'owners':ROW['registeredOwners'],'contact38':P['contact38'],
                                     'view':f['viewport'],'cam':f['actual']})
                if STAGE==26:
                    src=own['assets'][0]
                    assert src['material']==P['material26']
                    for k in ('assetId','nativeBounds','renderBounds','sharedOwnFields'): assert src[k]==P['owner26'][k],k
                visit['ordinaryContactAndOwners']=own
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
            if name=='ordinary' or (STAGE==26 and name=='southwest'):
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
        assert required(STAGE)<={x['path'] for x in visit['observed']}, (
            'missing required actual responses',sorted(required(STAGE)-{x['path'] for x in visit['observed']}))
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
