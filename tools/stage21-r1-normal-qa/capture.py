"""Read-only public Stage21 observer; only W, west-near and east on two viewports."""
import base64, json, os, re, time, statistics, sys
from io import BytesIO
from math import ceil, floor
from pathlib import Path
from urllib.parse import urlsplit
from PIL import Image
from playwright.sync_api import sync_playwright
from guard import P, A, B, save, sha, facts, required_observed, M

WORK=Path(sys.argv[1]); OUT=WORK/'out'
GRAPH=json.loads((OUT/'GRAPH.json').read_bytes())
assert GRAPH['noneOf50ChapterMapOrAssetPacketsChanged'] and len(P['reference'])==16
STAGE=21
VIEWS=[('ordinary',0,0),('west',-1,0),('overview',0,0),('east',1,0)]
VIEWPORTS=[(1440,900),(390,844)]
LIVE=A
ROW=P['stages']['21']
def check(name,body,wanted):
    assert facts(body)==wanted,(name,facts(body),wanted)
    return body
def stage_paths(s): return {ROW['map'],ROW['packet']}
def asset_json(root,path):
    return json.loads((root/path).read_bytes())
MAP=asset_json(WORK/'A',ROW['map'])
AGGREGATE=GRAPH['A']['active'][ROW['packet']]
ORDINARY,ORDINARY_ORIGIN=ROW['ordinary'],'west native signed ordinary'
BLOB=re.compile(r'blob:http://127\.0\.0\.1:(?:18841|18842)/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}')
MEDIA=set(f'assets/bgm/{n}.mp3' for n in ('main','battle-1','battle-2','battle-3'))
BASE=None; BASEURL=None; KNOWN=None
SPEC=P['patch']
NATIVE=Path(__file__).with_name('native-witness.js').read_text()
SIMULATED_SAVE=WORK/'old-normal-synthetic-save.json'
PROOF={'base':A,'product':B,'stage':STAGE,'frames':[],'visits':[],'complete':False,
       'authorizedVisualReference':P['product']['approvedR1'],
       'scope':'Two normal compiled App origins; no route or network responses substituted. Synthetic old app save replay, not user state or campaign completion.'}

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

def scope_for(variant):
    global BASE, BASEURL, KNOWN
    v=GRAPH[variant]; BASE=v['origin']; BASEURL=urlsplit(BASE)
    KNOWN={'HONRO.html':v['shell'],M:v['manifest'],**v['active']}
    return v
def capture_old_checkpoint(page):
    # This profile originates entirely in the already-running synthetic A
    # campaign. Never synthesize battle fields or collect a person's data.
    previous=page.evaluate("""()=>{const a=HonroApp,k='honro-first-act-profile-1',q=localStorage.getItem(k);
      const qualifies=text=>{try{const x=JSON.parse(text);return x.schema===5&&x.honroBattle?.honroStage===21&&x.honroBattle?.mode==='campaign';}catch{return false;}};
      if(qualifies(q))return{mode:'automatic old app checkpoint',text:q};
      const b=a.engine.b,s=HonroProfileStore.create();
      if(b.honroStage!==21||!b.honroCanonical||b.honroCustom||b.mode!=='campaign'||!s.save({...a.profile,honroBattle:b}))
        throw Error('The old official profile writer could not produce a synthetic normal Stage21 checkpoint');
      const raw=localStorage.getItem(k);if(!qualifies(raw))throw Error('Old official writer did not register Stage21');
      return{mode:'old official profile writer / live old app battle',text:raw};
    }""")
    payload=previous['text']; old=json.loads(payload); battle=old['honroBattle']
    assert old['schema']==5 and battle['mode']=='campaign' and not battle.get('honroCustom')
    inline=[x['asset'] for name in ('honroLandmarks','honroElements') for x in battle.get(name,[]) if 'asset' in x]
    assert not any(x.get('honroStaticAssetRef') or x.get('honroLocalArtRef') for x in inline)
    SIMULATED_SAVE.write_bytes(payload.encode())
    PROOF['oldSave']={'sourceStoredNative':True,'sourceMode':previous['mode'],'bytes':len(payload.encode()),
       'sha256':sha(payload.encode()),'stage':21,'phase':battle['phase'],'round':battle['round'],'verified':False}
    persist()

def bind_keys(old,variant):
    return set(GRAPH['aliases'].get(k,k) if variant=='B' else k for k in old)
def one(browser, w, h, variant):
    side=scope_for(variant)
    expected=bind_keys(required_observed(STAGE),variant)
    ctx=browser.new_context(viewport={'width':w,'height':h},device_scale_factor=1,service_workers='block')
    ctx.set_default_timeout(30000)
    assert ctx.storage_state()=={'cookies':[],'origins':[]}
    page=ctx.new_page()
    errors=[]; responses=[]; blobs=[]; media=[]; pending=set()
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
    page.on('request',lambda r:pending.add(r) if path_of(r.url) in KNOWN else None)
    page.on('requestfinished',lambda r:pending.discard(r))
    page.on('requestfailed',lambda r:pending.discard(r))
    page.on('requestfailed',req_failed)
    page.on('request',lambda r:errors.append(['non-read request', r.url,r.method]) if r.method!='GET' else None)
    page.on('pageerror',lambda e:errors.append(['pageerror',str(e)]))
    page.add_init_script('('+INIT+')()')
    before=time.monotonic()
    try:
        shell=page.goto(BASE+'HONRO.html',wait_until='domcontentloaded',timeout=50000)
        assert shell and shell.url==BASE+'HONRO.html' and shell.status==200
        check('browser shell',shell.body(),side['shell'])
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
            start=time.monotonic(); f=page.evaluate(PARK,q); cold_ms=(time.monotonic()-start)*1000
            decode=page.evaluate(DECODE)
            assert decode['registered']>0 and not decode['failed']
            start=time.monotonic(); confirmed=page.evaluate(PARK,{**q,'readback':True}); warm_ms=(time.monotonic()-start)*1000
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
                   'phaseReceiptValidated':False,'automationWallMS':{'coldPark':round(cold_ms,2),'warmReadback':round(warm_ms,2)},**f}
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
            n=page.evaluate(NATIVE,{'frame':frame,'support':SPEC['supportPath'],'box':SPEC['bounds']})
            masks=n.pop('pngs')
            n['masks']={}
            for kind,value in masks.items():
                assert value.startswith('data:image/png;base64,')
                payload=base64.b64decode(value.split(',',1)[1],validate=True)
                with Image.open(BytesIO(payload)) as im:
                    assert list(im.size)==frame['backing']; im.verify()
                leaf=key+'-witness-'+kind+'.png'; (OUT/leaf).write_bytes(payload)
                n['masks'][kind]={'path':leaf,'sha256':sha(payload)}
            assert set(n['masks'])=={'geometricSupport','nativeRim','topLight'}
            assert n['readbackUnchanged'] and all(x['replayExact'] and x['originalPublishedTileExact'] for x in n['tileReceipts'])
            frame['nativeWitness']=n
            frame['nativeReplayedVisibleTileCount']=len(n['tileReceipts'])
            x0,y0,x1,y1=SPEC['bounds']; size=512/n['worldRaster']
            frame['nativeCandidateIntersectingTileCount']=sum(t['left']-2/n['worldRaster']<x1 and
                t['left']+size+2/n['worldRaster']>x0 and t['top']-2/n['worldRaster']<y1 and
                t['top']+size+2/n['worldRaster']>y0 for t in n['tileReceipts']) if variant=='B' else 0
            frame['nativeCacheStats']=page.evaluate("()=>HonroApp.scene.renderCacheStats()")
            ref=P['reference'][key]; result={}
            for lab in ('raw','png'):
                im=rgba((OUT/frame[lab]).read_bytes())
                result[lab]={'rgba':sha(im.tobytes()),'size':list(im.size)}
            frame['priorVisualExact']=result['raw']==ref['raw'] and result['png']==ref['png'] and frame['actual']==ref['pose'] and frame['viewport']==ref['viewport'] and sign==ref['physicsSHA256']
            frame['reflectedReference']=result
            persist()
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
        actual={}; i=0; idle=0; seen=set(); minted=set()
        deadline=time.monotonic()+15
        while time.monotonic()<deadline:
            prior=(len(responses),len(blobs),i)
            assert not errors,errors
            while i<len(responses) and responses[i][1].request not in pending:
                rel,r=responses[i]; i+=1
                value=check(rel,r.body(),KNOWN[rel])
                if rel in stage_paths(STAGE): actual[rel]=value
                if rel not in seen:
                    visit['observed'].append({'path':rel,'status':200,**facts(value)});seen.add(rel)
            minted=set(page.evaluate("()=>Array.from(window.__honroObserver.blobs)"))
            idle=idle+1 if prior==(len(responses),len(blobs),i) and i==len(responses) and not pending else 0
            visit['drain']={'processed':i,'received':len(responses),'pending':sorted(r.url for r in pending),
                            'missingRequiredActual':sorted(expected-seen),
                            'minimumIdle100msTicks':4,'idleNow':idle}
            persist()
            if idle>=4 and expected<=seen and all(url in minted for url,_ in blobs): break
            page.wait_for_timeout(100)
        assert idle>=4 and i==len(responses) and not pending and not errors, ('response drain incomplete',visit['drain'],errors)
        assert expected<=seen, ('missing required actual responses',visit['drain'])
        assert all(url in minted for url,_ in blobs), 'HTTP observer saw a non-local blob'
        visit['blobs']=[{'url':url,'type':typ,'browserGenerated':True} for url,typ in blobs]
        assert set(actual)==stage_paths(STAGE) and facts(actual[ROW['packet']])==AGGREGATE
        visit['verifiedActualAggregate']=AGGREGATE
        visit['responseSubstitution']=False
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
        if variant=='A' and w==1440:
            try:capture_old_checkpoint(page)
            except Exception as e:
                PROOF['oldSave']={'verified':False,'sourceCaptureError':repr(e)};persist()
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
            w,h=ia.size; hw,hh=a['backing']; assert w==hw and h in (hh,hh+1)
            delta=ImageChops.difference(ia,ib)
            mr,mg,mb,ma=delta.split()
            raster=ImageChops.lighter(ImageChops.lighter(mr,mg),ImageChops.lighter(mb,ma))
            diff=raster.getdata(); alpha=ma.getdata()
            for prop in ('geometry','strokeTrace','worldRaster','explicitNativeSourceFilter','pose','priority'):
                assert a['nativeWitness'][prop]==b['nativeWitness'][prop],(key,prop)
            masks={}
            for which in ('geometricSupport','nativeRim','topLight'):
                reads=[]
                for frame in (a,b):
                    meta=frame['nativeWitness']['masks'][which]; data=(OUT/meta['path']).read_bytes()
                    assert sha(data)==meta['sha256']; reads.append(rgba(data))
                assert reads[0].size==reads[1].size==(hw,hh)
                assert reads[0].tobytes()==reads[1].tobytes(),('independent native witness mismatch',key,which)
                masks[which]=reads[0].getchannel('A').getdata()
            changed=out=ach=opaque=above=semi=0;touched=[];maxOut=maxSemi=0
            z=a['actual']['scale'];left=a['viewport']['left'];top=a['viewport']['top']
            for j,val in enumerate(diff):
                if not val:continue
                changed+=1;xx=j%w;yy=j//w;ach+=bool(alpha[j]); coord=[xx,yy,val,alpha[j]]
                if yy>=hh:
                    out+=1;maxOut=max(maxOut,val);touched.append(coord);continue
                xl=left+xx/z;xr=left+(xx+1)/z;yt=top+yy/z;yb=top+(yy+1)/z
                roof=2810+min(xl,0)*54.6875/500
                nativeRim=masks['nativeRim'][j]; topLight=masks['topLight'][j]; allowed=scenic and masks['geometricSupport'][j]>0
                high=yb<=roof
                certainlyOpaque=nativeRim==255 or topLight==255
                if not allowed:out+=1;maxOut=max(maxOut,val)
                if high:above+=1
                if certainlyOpaque:opaque+=1
                if nativeRim and not certainlyOpaque:semi+=1;maxSemi=max(maxSemi,val)
                if len(touched)<16 and (not allowed or high or certainlyOpaque or alpha[j]):
                    touched.append(coord+[nativeRim,topLight])
            strict=(out==0 and ach==0 and opaque==0 and above==0 and (changed>0 if scenic else changed==0))
            p['features'][label]={'changed':changed,'outsideIndependentNativeBilinearSupport':out,'alphaChanged':ach,
                'protectedOpaqueNativeRimChanged':opaque,'whollyAboveExactRoofChanged':above,'halfToneCompositedRimChanged':semi,
                'halfToneMaxRGB':maxSemi,'maxOutsidePerChannel':maxOut,'coordinates':touched,'strict':strict}
            if not strict:p['strictPass']=False
        results.append(p)
        PROOF['comparison']=results.copy();persist()
    return results

def control_26(browser):
    controls={}
    for w,h in VIEWPORTS:
        for side in ('A','B'):
            graph=scope_for(side); read=WORK/side
            campaign_path=next(p for p in graph['active'] if re.fullmatch(r'web/data/campaign\.[a-f0-9]{16}\.json',p))
            campaign=asset_json(read,campaign_path)
            map26,asset26=campaign['stages'][25],campaign['stageLibraries'][25]
            bindings={map26,asset26}
            if '-parts.' in asset26:
                descriptor=asset_json(read,asset26)
                bindings|={part['path'] for part in descriptor['parts']}
            m=asset_json(read,map26)
            assert m['metadata']['stageId']==26
            ctx=browser.new_context(viewport={'width':w,'height':h},device_scale_factor=1,service_workers='block')
            p=ctx.new_page(); seen={}; hits=[]; errors=[]; pending=set()
            def observe(r):
                rel=path_of(r.url)
                if (r.status==200 and r.request.method=='GET' and rel in KNOWN):hits.append((rel,r));return
                if rel in MEDIA and r.request.method=='GET' and r.status in (200,206):return
                if BLOB.fullmatch(r.url) and r.status==200:return
                errors.append((r.status,r.url))
            p.on('response',observe);p.on('pageerror',lambda e:errors.append(str(e)))
            p.on('request',lambda q:pending.add(q) if path_of(q.url) in KNOWN else None)
            p.on('requestfinished',lambda q:pending.discard(q))
            p.on('requestfailed',lambda q:pending.discard(q));
            p.add_init_script('('+INIT+')()')
            try:
                shell=p.goto(BASE+'HONRO.html',wait_until='domcontentloaded',timeout=50000)
                assert shell and shell.url==BASE+'HONRO.html' and shell.status==200
                check('normal control shell',shell.body(),graph['shell'])
                p.wait_for_function("()=>Boolean(document.documentElement.dataset.honroReady==='true'&&window.HonroCampaignLoader)",timeout=90000)
                p.evaluate(LAUNCH,26)
                canvas=p.locator('#battlecanvas');canvas.wait_for(state='visible')
                p.wait_for_function("""()=>{const a=HonroApp;HonroStory.tick(a,performance.now());HonroStory.draw(a);
                    return Boolean(document.getElementById('turn-banner')?.hidden!==false&&!a.dialogue);}""",polling=125,timeout=9000)
                q={'id':26,'mapId':m['id'],'name':'west','dx':-1,'dy':0,'ordinary':None,'readback':False}
                f=p.evaluate(PARK,q)
                dec=p.evaluate(DECODE);assert dec['registered']>0 and not dec['failed']
                assert p.evaluate(PARK,{**q,'readback':True})==f
                payload=raw_png(p,f['backing']);label=f'{side}-s26-{w}x{h}-west-raw.png';(OUT/label).write_bytes(payload)
                i=idle=0; stop=time.monotonic()+15
                while time.monotonic()<stop:
                    prev=(len(hits),i)
                    while i<len(hits) and hits[i][1].request not in pending:
                        name,reply=hits[i];i+=1
                        seen[name]=facts(check(name,reply.body(),KNOWN[name]))
                    idle=idle+1 if prev==(len(hits),i) and i==len(hits) and not pending else 0
                    if idle>=4 and bindings<=seen.keys():break
                    assert not errors,errors
                    p.wait_for_timeout(100)
                assert bindings<=seen.keys() and not errors and i==len(hits) and not pending and idle>=4,(26,side,errors,sorted(bindings-seen.keys()))
                assert p.evaluate("()=>{if(window.__honroQAUndo){window.__honroQAUndo();delete window.__honroQAUndo;return true;}return false;}")
                controls[(w,h,side)]={'file':label,'pngSHA256':sha(payload),'rgbaSHA256':sha(rgba(payload).tobytes()),
                    'physicsSHA256':sha(f.pop('signature').encode()),'actual':f['actual'],'viewport':f['viewport'],'binding':{k:seen[k] for k in sorted(bindings)}}
                PROOF['stage26Control']={'verified':False,'receipts':list(controls.values())};persist()
            finally:ctx.close()
    for w,h in VIEWPORTS:
        a,b=controls[(w,h,'A')],controls[(w,h,'B')]
        assert all(a[k]==b[k] for k in ('rgbaSHA256','physicsSHA256','actual','viewport','binding')),(26,w,h)
    PROOF['stage26Control']['verified']=True;persist()
def resume_old(browser):
    old=json.loads(SIMULATED_SAVE.read_bytes())
    expected=old['honroBattle']
    assert sha(SIMULATED_SAVE.read_bytes())==PROOF['oldSave']['sha256']
    ctx=browser.new_context(viewport={'width':1440,'height':900},device_scale_factor=1,service_workers='block')
    p=ctx.new_page()
    try:
        graph=scope_for('B'); shell=p.goto(BASE+'HONRO.html',wait_until='domcontentloaded',timeout=50000)
        assert shell and shell.url==BASE+'HONRO.html' and shell.status==200
        check('actual candidate resume shell',shell.body(),graph['shell'])
        p.wait_for_function("()=>Boolean(document.documentElement.dataset.honroReady==='true'&&window.HonroApp)",timeout=90000)
        assert p.evaluate("()=>localStorage.getItem('honro-first-act-profile-1')===null")
        p.locator('[data-action="settings"]').first.click()
        p.get_by_text('기록·관리',exact=False).click()
        p.get_by_text('JSON 기록 가져오기',exact=True).click()
        p.get_by_text('파일 선택',exact=True).click()
        p.locator('#file-import').set_input_files(str(SIMULATED_SAVE))
        p.wait_for_function("()=>Boolean(HonroApp.profile?.honroBattle?.honroStage===21)",timeout=30000)
        entered=p.evaluate("()=>HonroApp.profile.honroBattle")
        for k in ('honroStage','round','phase','terrain','units','honroLandmarks','honroElements','honroWorldTerrain','water'):
            assert entered.get(k)==expected.get(k),('old import data mismatch',k)
        p.get_by_text('이어서 걷기',exact=True).click()
        p.wait_for_function("()=>Boolean(HonroApp.engine?.b?.honroStage===21&&document.querySelector('#battlecanvas')?.getBoundingClientRect().width>0)",timeout=60000)
        result=p.evaluate("""()=>{const b=HonroApp.engine.b;const art=HonroTerrainDomain.materialLandmarks(b).find(x=>x.asset?.id==='act3-handoff:21:bedrock');return{
          stage:b.honroStage,round:b.round,phase:b.phase,terrain:b.terrain,units:b.units,water:b.water??null,width:b.width,height:b.height,
          localVisualOwner:art?.asset?.bounds?.x??null};}""")
        assert [result['stage'],result['round'],result['phase']]==[expected['honroStage'],expected['round'],expected['phase']]
        assert result['localVisualOwner']==-380
        for k in ('terrain','units','water','width','height'):assert result[k]==expected.get(k),('actual resumed state mismatch',k)
        for k in ('terrain','units','water'):result[k]=sha(json.dumps(result[k],sort_keys=True,separators=(',',':')).encode())
        p.locator('#battlecanvas').screenshot(path=str(OUT/'B-stage21-9ac-save-resumed.png'),animations='disabled',timeout=30000)
        PROOF['oldSave'].update(verified=True,resumedState=result,mode='normal title JSON import and Continue click; fresh detached browser');persist()
    finally:ctx.close()

persist()
try:
    with sync_playwright() as p:
        b=p.chromium.launch(headless=True)
        PROOF['browser']=b.version;persist();assert b.version=='151.0.7922.34'
        for w,h in VIEWPORTS:
            for variant in ('A','B'):one(b,w,h,variant)
        got=PROOF['frames']
        want={f'{v}-s21-{w}x{h}-{n}' for w,h in VIEWPORTS for v in ('A','B') for n,_,_ in VIEWS}
        assert {f['key'] for f in got}==want and len(got)==16
        assert all(f['phaseReceiptValidated'] for f in got) and all(v['complete'] for v in PROOF['visits'])
        PROOF['comparison']=compare_all(got);persist()
        assert all(x['strictPass'] for x in PROOF['comparison'])
        assert all(f['priorVisualExact'] for f in got),('normal build != archived approved image or protected state',
                                                       [f['key'] for f in got if not f['priorVisualExact']])
        control_26(b);assert PROOF.get('oldSave',{}).get('sourceStoredNative'),PROOF.get('oldSave');resume_old(b);b.close()
    PROOF['complete']=True;PROOF['humanReviewRequired']=True
    PROOF['timingScope']={'units':'automation RPC wall ms; coldPark renders twice, warmReadback once; not a frame rate benchmark',
       'builds':{v:{k:statistics.median(f['automationWallMS'][k] for f in got if f['variant']==v)
         for k in ('coldPark','warmReadback')} for v in ('A','B')},
       'perFrameNativeVisibleTiles':{f['key']:f['nativeReplayedVisibleTileCount'] for f in got},
       'perFramePotentialCandidateIntersectingTiles':{f['key']:f['nativeCandidateIntersectingTileCount'] for f in got}}
except Exception as exc:
    PROOF['failure']=repr(exc)
    raise
finally:
    persist()
