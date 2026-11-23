"""Read-only Stage44 title Continue discriminant for the already-pinned a6 carrier.
Use only disposable contexts. Never import a real-user profile; never rewrite persisted bytes.
Pass browser, origins, pins, observer and output from fresh carrier after normal preflight.
"""
import base64
import hashlib
import io
import json
from pathlib import Path
from urllib.parse import urlsplit

KEY='honro-first-act-profile-1'
OLD_MAP='web/data/chapter-44.48354b7c0547c1a7.json'
OLD_PACKET='web/data/chapter-44-assets.ddddc05a5f764d6e.json'
FAR='web/graphics/honro_authored_far-images-root-interior.7b6377c64ea476da.webp'
NEAR={'honroStaticAssetRef':1,'id':'act5:near:44','signature':'3323278:8ab035ae'}
UNDER={'honroStaticAssetRef':1,'id':'act5:under:44','signature':'958126:1c647a93'}
READY="()=>document.documentElement.dataset.honroReady==='true' && typeof globalThis.HonroCampaignLoader?.ensureStage==='function'"
AIM="()=>{const a=HonroApp;HonroStory.tick(a,performance.now());HonroStory.draw(a);return document.getElementById('turn-banner')?.hidden!==false&&!a.dialogue&&a.engine?.b?.phase==='aim';}"
STABLE="""()=>{const a=HonroApp,b=a.engine?.b;if(!b||b.honroStage!==44||b.honroCanonical!==true||
 b.honroCustom!==false||b.honroMapOrigin!=='campaign'||a.profileStore.locked||
 a.profile.honroMapRestart!=null||b.honroCampaignMapRevision!==1||b.honroRevision!==20||
 b.phase!=='aim'||b.round!==1||a.screen!=='battle')throw Error('not intact mounted Stage44');
 const items=HonroTerrainDomain.materialLandmarks(b).filter(v=>v.id==='a5-near'||v.id==='a5-under');
 const providers=Object.fromEntries(HONRO_PROJECT.library.filter(a=>a.id==='act5:near:44'||a.id==='act5:under:44').map(a=>[a.id,JSON.stringify(a)]));
 return {state:JSON.stringify({terrain:b.terrain,units:b.units,phase:b.phase,round:b.round,water:b.water,
  width:b.width,height:b.height,stage:b.honroStage,revision:b.honroRevision,mapRevision:b.honroCampaignMapRevision,heroes:b.heroes}),
  items:items.map(v=>({id:v.id,assetId:v.asset?.id,x:v.x,y:v.y,scale:v.scale,usedExactProvider:JSON.stringify(v.asset)===providers[v.asset?.id]})),
  providers};}"""
TAP="""()=>{const a=HonroApp;if(a.screen!=='title'||a.customMap)throw Error('not real title');
 a.frame=()=>{};   // Freeze only the diagnostic clock, not restore logic or profile.
 if(window.__honroContinueTap)throw Error('reuse');
 const l=a.launch,m=a.mount,c={launches:0,mounts:0};window.__honroContinueTap=c;
 a.launch=function(){++c.launches;return Reflect.apply(l,this,arguments);};
 a.mount=function(){++c.mounts;return Reflect.apply(m,this,arguments);};
}"""
def require(c,msg):
    if not c:raise RuntimeError(msg)
OBJECTIVE_FONT="""async()=>{
 const s=globalThis.HonroApp?.scene;
 if(!s||!Array.isArray(s.missionTargets))throw Error('No live objective targets for native font witness');
 const text='오른쪽 · 위 뿌리 능선',font='600 12px sans-serif';
 const targets=s.missionTargets.map(t=>[t.id,t.kind,t.x,t.y,t.label]);
 const face=await document.fonts.load(font,text);await document.fonts.ready;
 if(!document.fonts.check(font,text)||face.some(f=>f.status!=='loaded'))throw Error('Native canvas objective font not ready');
 // The objective renderer assigns an explicit generic sans-serif, not DOM
 // Honro Serif. A FontFaceSet/check result alone cannot prove fallback glyphs.
 const c=document.createElement('canvas');c.width=48;c.height=32;
 const g=c.getContext('2d',{willReadFrequently:true});g.font=font;g.textBaseline='alphabetic';
 const fingerprints=[...'오른쪽'].map(ch=>{g.clearRect(0,0,48,32);g.fillText(ch,2,20);
  const pixels=g.getImageData(0,0,48,32).data;let h=2166136261,ink=0;
  for(let i=3;i<pixels.length;i+=4){if(pixels[i])ink++;h=Math.imul(h^pixels[i],16777619);}
  return{ch,ink,hash:h>>>0};});
 if(fingerprints.some(x=>x.ink===0)||new Set(fingerprints.map(x=>x.hash)).size!==fingerprints.length)
  throw Error('Native Korean objective fallback has missing/tofu glyphs');
 return{font:g.font,text,width:g.measureText(text).width,fingerprints,targets,
         authorFaceFamilies:face.map(x=>x.family),status:document.fonts.status};
}"""
def ready_canvas_font(page):
    return page.evaluate(OBJECTIVE_FONT)
def sha(a):
    return hashlib.sha256(a.encode('utf-8') if isinstance(a,str) else a).hexdigest()
def refs(raw):
    b=json.loads(raw)['honroBattle']
    require(b['honroStage']==44 and b['honroCampaignMapRevision']==1 and b['honroRevision']==20 and b['phase']=='aim','bad authored fixture state')
    a={i['id']:i['asset'] for i in b['honroLandmarks'] if i['id'] in ('a5-near','a5-under')}
    require(a.get('a5-near')==NEAR,'near ref changed')
    if 'a5-under' in a: require(a['a5-under']==UNDER,'under ref changed')
    return a
def run_continue(browser, originals, pins, observer, output):
    from PIL import Image
    # Intended to be called from already pinned carrier with its real shell and manifest checks.
    require(browser.version==pins['chromium'],'browser differs from pinned Chromium')
    # Every exported PNG and receipt goes to the diagnostic output directory only.
    out=Path(output);report={'status':'HOLD','visits':{},'note':'Isolated genuine title Continue; no existing user storage.'}
    def persist(): (out/'CONTINUE-READBACK.json').write_text(json.dumps(report,indent=2)+'\n')
    persist()
    def start(side,fixture):
        host=originals[side]
        u=urlsplit(host)
        require(u.scheme=='http' and u.hostname=='127.0.0.1' and u.port is not None and u.path=='/honro/' and not u.query and not u.fragment,'an exact local sandbox origin is required')
        ctx=browser.new_context(viewport={'width':390,'height':844},device_scale_factor=1,service_workers='block')
        seen={};requested=[];errors=[];page=ctx.new_page()
        ctx.route('**/*',lambda r:r.continue_() if r.request.url.startswith(host) or r.request.url.startswith(('data:','blob:','about:')) else r.abort())
        page.on('response',lambda r:seen.setdefault(r.url.split('?',1)[0],r) if r.url.startswith(host) else None)
        page.on('request',lambda r:requested.append(r.url.split('?',1)[0][len(host):]) if r.url.startswith(host) else None)
        page.on('pageerror',lambda e:errors.append(str(e)))
        page.add_init_script('('+observer['INIT']+')();'+observer['INIT_SEED'])
        if fixture is not None:
            # location.origin never includes host path. Do not append '/honro' here.
            payload=json.dumps({'origin':u.scheme+'://'+u.netloc,'key':KEY,'value':fixture},ensure_ascii=True)
            page.add_init_script('(()=>{const p='+payload+';if(location.origin===p.origin&&localStorage.getItem(p.key)===null)localStorage.setItem(p.key,p.value);})();')
        try:
            rsp=page.goto(host+'HONRO.html',wait_until='domcontentloaded',timeout=50000)
            require(rsp and rsp.status==200 and rsp.url==host+'HONRO.html' and not rsp.from_service_worker and sha(rsp.body())==pins['arms'][side]['files']['HONRO.html'],'shell not pinned')
            page.wait_for_function(READY,timeout=90000)
            return ctx,page,seen,requested,errors
        except BaseException:
            ctx.close(); raise
    def ledger(side,seen,requested,errors,*,rendered=True):
        host=originals[side]; case=pins['arms'][side]; paths=set(case['files'])-{'web/manifest.json'}
        require(FAR in paths,'FAR must remain pinned in both product closures')
        require(not errors,'page errors: '+repr(errors))
        far_response=seen.get(host+FAR)
        # Fixture authors only create and flush an actual save; they never
        # call Scene.render/FROZEN. They need not fetch a lazy paint resource.
        # If a response is seen on an author, still hold it to the exact pin.
        if not rendered and far_response is None: paths.remove(FAR)
        for name in sorted(paths):
            r=seen.get(host+name)
            require(r and r.status==200 and not r.from_service_worker and sha(r.body())==case['files'][name],'missing/changed current request '+name)
        older=sorted({x for x in requested if x in (OLD_MAP,OLD_PACKET)}) if side in ('B','D','C') else []
        require(not older,'B requested old Stage44 filenames '+repr(older))
        far_state='OBSERVED_200_EXACT' if far_response is not None else ('REQUEST_PENDING_NO_FRAME' if FAR in requested else 'NOT_REQUESTED_NO_FRAME')
        return {'activeHTTPExact':sorted(paths),'observedPaths':sorted(set(requested)),'oldStage44URLsOnB':older,
                'far':{'requiredFromRenderedFrame':rendered,'state':far_state,'immutablePackageSHA256':case['files'][FAR]}}
    def snapshot(p,side):
        d=p.evaluate(STABLE)
        providers=d.pop('providers')
        d['providerHashes']={k:sha(v) for k,v in providers.items()}
        require(all(v['usedExactProvider'] for v in d['items']),'restored renderer did not use exact current provider')
        require(set(d['providerHashes'])==({'act5:near:44'} if side=='A' else {'act5:near:44','act5:under:44'}),'wrong current registry contents')
        owners=[v['id'] for v in d['items']]
        require(owners.count('a5-near')==1 and owners.count('a5-under')<=1,'unexpected observed owner count')
        d['stableBattleSHA256']=sha(d.pop('state'))
        return d
    def get_frame(p,label):
        font=ready_canvas_font(p)
        args={'id':44,'mapId':'stage-44','name':'west-min','ordinary':pins['poses']['M'],'dx':-1,'dy':0,'readback':False,'fixedNow':observer['PHASE']}
        a=p.evaluate(observer['FROZEN'],args)['meta']; decoded=p.evaluate(observer['DECODE'])
        require(not decoded['failed'],'assets not decoded')
        b=p.evaluate(observer['FROZEN'],{**args,'readback':True})['meta']
        h=sha(a.pop('signature'));require(sha(b.pop('signature'))==h==pins['physics'] and a==b,'frame physics/readback not preserved')
        require(b['actual']==dict(zip(['x','y','scale'],pins['poses']['M'])),'registration changed')
        data=base64.b64decode(p.evaluate(observer['CANVAS']),validate=True)
        with Image.open(io.BytesIO(data)) as im:
            require(list(im.size)==b['backing'],'decoded backing size')
            rgba=sha(im.convert('RGBA').tobytes())
        (out/(label+'.png')).write_bytes(data)
        return {'pngSHA256':sha(data),'rgbaSHA256':rgba,'meta':b,'physical':h,'objectiveFont':font}
    def author(side):
        context,p,seen,paths,errors=start(side,None)
        try:
            p.evaluate('()=>{__honroResetDiagnosticSeed();HonroApp.audio?.configure?.({...HonroApp.profile.settings,music:false,sound:false});}')
            p.evaluate(observer['LAUNCH'],44)
            p.locator('#battlecanvas').wait_for(state='visible')
            p.wait_for_function(AIM,timeout=15000,polling=125)
            p.evaluate("()=>{const a=HonroApp;a.dirty=true;a.flushBattleSave();}")
            raw=p.evaluate('(key)=>localStorage.getItem(key)',KEY)
            ref=refs(raw); require(('a5-under' in ref)==(side in ('B','D')),'authored fixture under ref not as expected')
            state=snapshot(p,side)
            report['visits']['author-'+side]={'profileSHA256':sha(raw),'profileBytes':len(raw.encode('utf-8')),'refs':ref,
                                            **state,'network':ledger(side,seen,paths,errors,rendered=False)};persist()
            return raw,state
        finally:context.close()
    def title(side,label,raw,ref,expected_under):
        context,p,seen,paths,errors=start(side,raw)
        try:
            btn=p.locator('.title-actions button[data-action="continue"]').first
            btn.wait_for(state='visible',timeout=12000)
            require(p.evaluate('(key)=>localStorage.getItem(key)',KEY)==raw,'fixture altered before title Continue')
            p.evaluate(TAP);btn.click()
            p.wait_for_function("()=>HonroApp.engine?.b?.honroStage===44 && HonroApp.engine?.b?.phase==='aim'",timeout=50000)
            p.locator('#battlecanvas').wait_for(state='visible')
            d=snapshot(p,side); calls=p.evaluate('()=>window.__honroContinueTap'); frame=get_frame(p,label)
            old=d['providerHashes'].get('act5:near:44'); require(old==ref['providerHashes'].get('act5:near:44'),'current near ref bytes changed')
            report['visits'][label]={'calls':calls,'inputProfileSHA256':sha(raw),**d,'frame':frame,
                                     'network':ledger(side,seen,paths,errors)};persist()
            require(calls=={'launches':0,'mounts':1},label+': restarted or remounted')
            require(d['stableBattleSHA256']==ref['stableBattleSHA256'],label+': mounted runtime state changed')
            require(any(v['id']=='a5-under' for v in d['items'])==expected_under,label+': unexpected mounted art variant (see saved receipt)')
        finally:context.close()
    try:
        old,a=author('A');a6,b=author('B');latest,d=author('D')
        title('A','A-SAVE-CONTINUE-A',old,a,False)
        title('C','A-SAVE-CONTINUE-C',old,a,False)
        title('C','B-SAVE-CONTINUE-C',a6,b,True)
        title('C','D-SAVE-CONTINUE-C',latest,d,True)
        v=report['visits']; aa,ab,bb,dd=[v[k]['frame']['rgbaSHA256'] for k in ('A-SAVE-CONTINUE-A','A-SAVE-CONTINUE-C','B-SAVE-CONTINUE-C','D-SAVE-CONTINUE-C')]
        require(v['B-SAVE-CONTINUE-C']['providerHashes']==v['author-B']['providerHashes'],'candidate must preserve both a6 registered provider bytes')
        require(v['D-SAVE-CONTINUE-C']['providerHashes']==v['author-D']['providerHashes'],'candidate must preserve both current-3c registered provider bytes')
        report['cross']={'a6AndCurrentProviderInventoryAndOldAuthoredSavesRetained':True,'allContinueFramesEqualOriginal':aa==ab==bb==dd,
                         'priorFreshAReference':pins['Araw']['M'],'candidateContinueMatchesPriorFreshA':aa==pins['Araw']['M']}
        persist()
        require(aa==ab==bb==dd,'native candidate title view differs from original title control')
        report['status']='VERIFIED_DISPOSABLE_F6_A6_AND_3C_TITLE_CONTINUE_C';persist()
    except BaseException as e:
        report['firstError']=repr(e);persist();raise
    return report
