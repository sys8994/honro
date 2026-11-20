"""Anonymous public Stage38, stationary first turn; built-in renderer, no response changes."""
import base64,json,os,re,urllib.parse
from PIL import Image
from playwright.sync_api import sync_playwright
from source import BASE,OUT as ROOT,P,LIVE,OWNER,aggregate,check_body,measured,show,sha
ARM=os.environ['STAGE38_ARM'];assert ARM in ('A','B')
OUT=ROOT/ARM;OUT.mkdir(parents=True,exist_ok=True)
def save(n,v):(OUT/n).write_text(json.dumps(v,indent=2,ensure_ascii=False)+'\n')
patched=(ROOT/'stage38-candidate.js').read_bytes()
pin=json.loads((ROOT/'owner-receipt.json').read_bytes())
assert measured(patched)==pin['injected'] and pin['original']==P['needed'][OWNER]

W,H=1440,900
SCOPES=[dict(name='overview',x=3456,y=2304,scale=None),
        dict(name='slope-warden',x=4530,y=1751.4,scale=.65),
        dict(name='slope-small-control',x=4905,y=1467,scale=.65)]
SOURCE=json.loads((ROOT/'public-source.json').read_bytes())
assert SOURCE['release']==P['live']
active={r['path'] for r in json.loads(show('web/manifest.json'))['files']}
BGM=re.compile(r'assets/bgm/(?:main|battle-[123])\.mp3')
frames,net,errors,media,local_blobs=[],[],[],[],[]
LOCAL_BLOB=re.compile(r'blob:https://sys8994\.github\.io/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}')
receipt={'scope':'Stationary first-turn Stage38 transient A/B diagnostic; B holds exactly one QA owner response. No product changes, movement or combat.',
         'arm':ARM,'poseAttempts':[],
         'release':LIVE,'frames':frames,'network':net,'errors':errors,'silentMedia':media,'localBrowserBlobs':local_blobs,'complete':False,
         'reference':P['probe']['authority']}
def persist():save('proof.json',receipt)

CONTACT="""q=>{
 const a=HonroApp,s=a.scene,b=a.engine.b,e=a.engine;
 const st=HONRO_PROJECT.stages.find(t=>t.metadata?.stageId===38);
 if(!st||b.honroStage!==38||b.honroCustom!==false||!b.honroCanonical)throw Error('Not canonical Stage38');
 const rect=s.canvas.getBoundingClientRect(), z=q.scale??HonroBounds.zoomLimits(rect.width).min;
 const requested={x:q.x,y:q.y,scale:z};
 HonroStoryFraming.clear(s);
 Object.assign(s,{manual:true,time:2,storyTween:null,storyFrozen:false,goalFocus:null,cinematic:null,focusUntil:0,speakerUntil:0,...requested});
 HonroBounds.constrain(s,b);
 const pre=()=>JSON.stringify({terrain:b.terrain,units:b.units,design:st.design,initialState:st.initialState,objectives:st.objectives});
 const signature=pre();
 s.render(e,0,'',.6,false,0);s.render(e,0,'',.6,false,0);
 if(pre()!==signature)throw Error('Camera render changed physics/actors');
 const actual={x:s.x,y:s.y,scale:s.scale}, view=HonroBounds.viewport(s,rect.width,rect.height);
 if(q.scale!==null&&Object.keys(actual).some(k=>Math.abs(actual[k]-requested[k])>1e-6))throw Error('Required registered camera clamped');
 const screen=(x,y)=>({x:(x-view.left)*actual.scale,y:(y-view.top)*actual.scale});
 const supportId=q.support, src=st.terrains.find(t=>t.id===supportId);
 const runtime=b.terrain.find(t=>t.id===supportId);
 if(!src||!runtime||typeof e.contactSurface!=='function')throw Error('Missing authored or runtime support');
 const edges=src.properties.honroWalkEdges;
 const poly=HONRO_CORE.poly(runtime);
 function yAt(points,x){
  for(const i of edges){const a=points[i],b=points[(i+1)%points.length];if(!a||!b)continue;
   if(a.x!==b.x&&x>=Math.min(a.x,b.x)&&x<=Math.max(a.x,b.x)){
    return {x,y:a.y+(b.y-a.y)*(x-a.x)/(b.x-a.x),edge:i};}}
  return null;
 }
 const near=(actor,k)=>{
  const u=e.unit(actor.id), authored=st.units.find(x=>x.id===actor.id);
  if(!u||!authored||u.dead||u.hp<=0)throw Error('Missing observed Stage38 target '+actor.id);
  const h=e.contactSurface(u.x,u.y-8,u.y+10), t=h?.t;
  const rig=window.HonroMonsterVisual,rigId=rig?.kind?.(u)??null, a=rigId?rig.assets[rigId]:null;
  const slopeSamples=[u.x,...(k==='slope-warden'?q.footXs:[])].map(x=>{
   const l=yAt(src.points,x),n=yAt(poly,x),hit=n?e.contactSurface(x,n.y-8,n.y+10):null;
   return {x,authorWalk:l,runtimePolyWalk:n,engineSurfaceId:hit?.t?.id??null,
     engineSurfaceY:Number.isFinite(hit?.y)?hit.y:null,canvas:l?screen(l.x,l.y):null};
  });
  return {id:u.id,authored:{kind:authored.kind,x:authored.x,y:authored.y,waterTrait:authored.stageOverrides?.honroAct4WaterTrait??null,
           support:authored.stageOverrides?.honroEncounterSupport??null},
         actual:{x:u.x,y:u.y,h:u.h,r:u.r,facing:u.facing,side:u.side,hp:u.hp,ground:u.ground??null,
           flying:u.flying??u.honroFlying??null,jumping:u.jumping??null,moving:u.moving??null,vx:u.vx??null,vy:u.vy??null,
           honroType:u.honroType??null,waterTrait:u.honroAct4WaterTrait??null,boss:u.boss??null,
           support:u.honroEncounterSupport??null,rigId},engineContact:t?{id:t.id,y:Number.isFinite(h.y)?h.y:null}:null,
         canvasAnchor:screen(u.x,u.y),walkSamples:slopeSamples,
         rigJointPivots:a?.parts?.filter(j=>/leg|foot|hand|arm|paw/i.test(j.id)).map(j=>({id:j.id,pivot:j.pivot,parent:j.parent??null}))??[]};
 };
 const actors=Object.fromEntries(Object.entries(q.actors).map(([k,u])=>[k,near(u,k)]));
 const owners=st.elements.filter(x=>['approved38-body','act4-handoff:38:cave-contact'].includes(x.id)).map(x=>{
  const a=HONRO_PROJECT.library.find(a=>a.id===x.assetId);
  if(!a)throw Error('Missing loaded art owner '+x.assetId);
  return {id:x.id,assetId:a.id,layer:x.layer,x:x.x,y:x.y,scale:x.scale,bounds:a.bounds??null,rootTransform:a.vector?.root?.transform??null};});
 if(owners.length!==2||pre()!==signature)throw Error('Unexpected art count or observation mutated actors');
 return {requested,actual,viewport:view,focus:HonroBounds.focus(b),css:{w:rect.width,h:rect.height},backing:[s.canvas.width,s.canvas.height],
   actorCount:b.units.length,stage:st.id,tide:b.honroAct4PreviewState?.tide??null,phase:b.phase??null,round:b.round??null,
   actors,owners,signature};
}"""

with sync_playwright() as p:
    browser=p.chromium.launch(headless=True)
    receipt['browser']=browser.version; assert browser.version=='151.0.7922.34'
    ctx=browser.new_context(viewport={'width':W,'height':H},device_scale_factor=1,service_workers='block')
    assert ctx.storage_state()=={'cookies':[],'origins':[]}
    page=ctx.new_page(); responses={}; replacements=[]
    if ARM=='B':
        def single_owner(route):
            req=route.request
            assert req.method=='GET' and req.url==BASE+OWNER and not replacements
            original=route.fetch(max_redirects=0,max_retries=0)
            assert (original.url,original.status)==(BASE+OWNER,200)
            check_body('actual B pre-injection owner response',original.body(),P['needed'][OWNER])
            replacements.append({'path':OWNER,'original':pin['original'],'delivered':pin['injected']})
            # Exactly one pinned original GET, one replacement in this disposable B context.
            route.fulfill(status=200,content_type='text/javascript; charset=utf-8',body=patched)
        ctx.route(BASE+OWNER,single_owner)
    receipt['replacement']=replacements
    def path(url):
        u=urllib.parse.urlsplit(url)
        return u.path.removeprefix('/honro/') if url.startswith(BASE) and not u.query and not u.fragment else None
    def observe(r):
        rel=path(r.url)
        # The packed stage creates local object URLs inside this document's browser.
        # Record them as local only; they cannot satisfy any pinned HTTPS response.
        if LOCAL_BLOB.fullmatch(r.url) and r.request.method=='GET' and r.status==200:
            local_blobs.append({'url':r.url,'type':r.request.resource_type,'status':200});return
        if rel and BGM.fullmatch(rel) and r.request.resource_type=='media' and r.status in (200,206):
            media.append({'path':rel,'status':r.status});return
        if not rel or (rel!='HONRO.html' and rel not in active) or r.status!=200 or r.request.method not in ('GET','HEAD'):
            errors.append(['unexpected response',r.request.method,r.status,r.url]);return
        responses[rel]=r
    def failed(req):
        rel=path(req.url)
        if rel and BGM.fullmatch(rel) and req.resource_type=='media' and req.failure=='net::ERR_ABORTED':
            media.append({'path':rel,'status':req.failure});return
        errors.append(['failed request',req.url,req.failure])
    page.on('response',observe); page.on('requestfailed',failed)
    page.on('pageerror',lambda err:errors.append(['pageerror',str(err)]))
    page.on('request',lambda r:errors.append(['unexpected request method',r.method,r.url]) if r.method not in ('GET','HEAD') else None)
    # Transparently observe off-DOM image decode, while calling the original native setter.
    page.add_init_script("window.__qaImages=[];const d=Object.getOwnPropertyDescriptor(HTMLImageElement.prototype,'src');Object.defineProperty(HTMLImageElement.prototype,'src',{...d,set(v){window.__qaImages.push(this);d.set.call(this,v)}});")
    try:
        shell=page.goto(BASE+'HONRO.html',wait_until='domcontentloaded',timeout=50000)
        assert shell and shell.url==BASE+'HONRO.html' and shell.status==200 and shell.request.method=='GET'
        check_body('normal public app shell',shell.body(),P['html'])
        page.wait_for_function("document.documentElement.dataset.honroReady==='true' && window.HonroCampaignLoader",timeout=90000)
        page.evaluate("""async()=>{
          const a=HonroApp;a.frame=()=>{};a.profile.settings.music=false;a.profile.settings.sound=false;
          await HonroCampaignLoader.ensureStage(38);
          for(let n=1;n<38;n++)a.profile.cleared[n]=true;
          for(const h of Object.values(a.profile.heroes))h.xp=HonroProgression.xpAt(HonroProgression.plan(38).entryLevel);
          a.launch(38);if(a.engine?.b.honroStage!==38)throw Error('Campaign did not enter Stage38');
          for(let n=0;n<40&&a.dialogue;n++)HonroStory.finish(a);
          if(a.dialogue)throw Error('Stage38 entry dialogue still active');a.close();HonroStoryFraming.clear(a.scene);
        }""")
        canvas=page.locator('#battlecanvas');canvas.wait_for(state='visible')
        page.wait_for_timeout(1500)
        page.evaluate("()=>{const a=HonroApp;HonroStory.tick(a,performance.now());HonroStory.draw(a);if(document.getElementById('turn-banner')?.hidden===false)throw Error('First-turn banner still visible');}")
        for q in SCOPES:
            trace_before=page.evaluate('()=>globalThis.__qaStage38CompactPaint?.count??0')
            args={**q,'actors':P['coverage']['actors'],'support':P['coverage']['support'],'footXs':P['coverage']['historicalArchive']['approxFootWorldXs']}
            initial=page.evaluate(CONTACT,args)
            decode=page.evaluate("""async()=>{await document.fonts.ready;const live=window.__qaImages.filter(i=>i.src);
                await Promise.all(live.map(i=>i.decode()));return {registered:live.length,
                  pending:live.filter(i=>!i.complete||!i.naturalWidth).length};}""")
            assert not decode['pending'] and decode['registered']>0
            f=page.evaluate(CONTACT,args); assert f==initial,'decode/pose changed registered contact or physics'
            scope=q['name']
            if scope=='overview':continue
            facts=page.evaluate('''() => {
             const a=HonroApp,s=a.scene,r=a.engine.unit('a4-38-e-1'),u=a.engine.unit('a4-38-d-1'),v=HonroMonsterVisual;
             const pts=HonroBounds.viewport(s,s.canvas.getBoundingClientRect().width,s.canvas.getBoundingClientRect().height);
             const native=z=>{const w=v.headPoint(z,s.time);return {world:w,screen:w?{x:(w.x-pts.left)*s.scale,y:(w.y-pts.top)*s.scale}:null};};
             const clip=G=>G?.parts?.map(p=>({id:p.id,parent:p.parent??null,pivot:p.pivot,paths:p.paths.map(({d,fill,stroke,width,lod})=>({d,fill,stroke,width,lod}))}));
             const live=v.assets.pursuer;
             const actor=HonroActorVisual;
             return {nativeHeads:{warden:native(r),small:native(u)},counter:globalThis.__qaStage38CompactPaint??null,livePursuerParts:clip(live),
                dispatch:{side:r.side,actorKind:actor.kind(r),actorMonsterKind:actor.monsterKind(r),enemyRigKind:v.kind(r)},
                 nativeHeadPivot:live.parts.find(p=>p.id==='head').pivot};
            }''')
            receipt['poseAttempts'].append({k:v for k,v in {'view':scope,'beforeCount':trace_before,**facts}.items() if k!='livePursuerParts'})
            persist()
            assert facts['dispatch']=={'side':1,'actorKind':None,'actorMonsterKind':None,'enemyRigKind':'pursuer'},facts['dispatch']
            oldParts=P['probe']['localApproved']['originalParts']
            for p0 in oldParts:
                if p0.get('parent') is None:p0['parent']=None
            assert facts.pop('livePursuerParts')==oldParts,'The original live asset changed or no longer matches the authored pose'
            if ARM=='A':assert facts['counter'] is None
            else:assert facts['counter'] and facts['counter']['count']>trace_before,('render slot not reached for this pose',scope)
            dest=OUT/('stage38-'+scope+'.png')
            png=canvas.screenshot(path=str(dest),animations='disabled')
            raw=base64.b64decode(page.evaluate("()=>document.getElementById('battlecanvas').toDataURL('image/png').split(',')[1]"),validate=True)
            rp=OUT/('stage38-'+scope+'-raw.png');rp.write_bytes(raw)
            with Image.open(rp) as im:assert im.size==tuple(f['backing'])
            with Image.open(dest) as im:decoded=list(im.size)
            f['physicsSHA256']=sha(f.pop('signature').encode())
            f.update(view=scope,dpr=1,viewportCSS=[W,H],imageDecode=decode,png=dest.name,raw=rp.name,
                     pngSHA256=sha(png),canvasRawSHA256=sha(raw),canvasDOMPixels=decoded)
            old=P['probe']['frames'][scope]
            for k,v in old.items():
                if ARM=='B' and k in ('pngSHA256','canvasRawSHA256'):continue
                if k=='imageDecode':
                    got=f[k]
                    assert type(got['registered']) is int and got['registered']>0
                    assert {n:v0 for n,v0 in got.items() if n!='registered'}=={n:v0 for n,v0 in v.items() if n!='registered'}
                    continue
                assert f.get(k)==v,('actual frame identity',ARM,scope,k,f.get(k),v)
            meta={'view':scope,'nativeHeads':facts['nativeHeads'],'counter':facts['counter'],'nativeHeadPivot':facts['nativeHeadPivot']}
            frames.append({**f,'diagnostic':meta});persist()
        assert len(frames)==2 and len({f['physicsSHA256'] for f in frames})==1
        assert all(x['actors']==frames[0]['actors'] or all(
            x['actors'][k]['actual']==frames[0]['actors'][k]['actual'] and
            x['actors'][k]['engineContact']==frames[0]['actors'][k]['engineContact']
            for k in x['actors']) for x in frames),'camera changed actor facts/surface'
        data={}
        for rel,want in P['needed'].items():
            r=responses.get(rel)
            assert r and (r.request.method,r.status,r.url)==('GET',200,BASE+rel),('missing actual public response',rel)
            if rel==OWNER and ARM=='B':
                body=r.body(); assert body==patched;data[rel]=body
            else:data[rel]=check_body(rel,r.body(),want)
            net.append({'path':rel,'url':r.url,'status':r.status,**measured(data[rel])})
        receipt['lastPacketAssembly']=aggregate(data)
        assert len(replacements)==(1 if ARM=='B' else 0),replacements
        assert not errors,errors
        receipt['complete']=True
    except Exception as err:
        errors.append(['capture failure',repr(err)])
        if ARM=='B':
          try:receipt['lastGateTrace']=page.evaluate('()=>globalThis.__qaStage38CompactPaint??null')
          except Exception as trace:receipt['lastGateTraceError']=repr(trace)
        raise
    finally:
        persist();ctx.close();browser.close()
