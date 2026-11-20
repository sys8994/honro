import base64,hashlib,json,os,re
from pathlib import Path
from playwright.sync_api import sync_playwright

OUT=Path(os.environ['OUT']); OUT.mkdir(parents=True,exist_ok=True)
frames=[];issues=[]
stages=[28,27,29,7,41]
MASK=os.environ["MASK"]=="1"
MASK_SOURCE=(Path(__file__).parent/"stroke-mask.js").read_text()
expected=os.environ["MODE"]=="candidate"
views=[("south",0,1),("southwest",-1,1),("southeast",1,1)]
def persist():
    (OUT/'proof.json').write_text(json.dumps({
      'scope':'Pinned stock or native QA-only Stage28 registered candidate, real campaign entry and renderer on two automatic CSS viewports. Native build; no injected browser art. Min-zoom centre/cardinal/corner captures; actual clamp verified. Official first-turn banner is expired and registered first-view images decoded before re-render. No normal play or art acceptance claimed.',
      'frames':frames,'problems':issues},indent=2))
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True)
    for sid in stages:
     for w,h in ([(1440,900),(390,844)] if sid==28 else [(1440,900)] if sid==7 else [(390,844)]):
      page=browser.new_page(viewport={'width':w,'height':h},device_scale_factor=1)
      errors=[]; requests=[]
      page.add_init_script("Date.now=()=>1794931200000;let qaSeed=3910;Math.random=()=>((qaSeed=(qaSeed*1664525+1013904223)>>>0)/2**32);window.__qaImages=[];const d=Object.getOwnPropertyDescriptor(HTMLImageElement.prototype,'src');Object.defineProperty(HTMLImageElement.prototype,'src',{...d,set(v){window.__qaImages.push(this);d.set.call(this,v)}});")
      page.on('pageerror',lambda e:errors.append(str(e)))
      page.on('requestfailed',lambda req: requests.append([req.url,req.failure]))
      try:
       page.goto('http://127.0.0.1:8884/HONRO.html',wait_until='domcontentloaded',timeout=180000)
       page.wait_for_function("document.documentElement.dataset.honroReady==='true' && window.HonroCampaignLoader",timeout=180000)
       page.evaluate('''async sid=>{
        const a=HonroApp;a.frame=()=>{};a.profile.settings.music=false;a.profile.settings.sound=false;
        await HonroCampaignLoader.ensureStage(sid);
        for(let n=1;n<sid;n++)a.profile.cleared[n]=true;
        for(const hero of Object.values(a.profile.heroes))hero.xp=HonroProgression.xpAt(HonroProgression.plan(sid).entryLevel);
        a.launch(sid);if(a.engine?.b.honroStage!==sid)throw Error('Campaign launch did not reach '+sid);
        for(let n=0;n<40&&a.dialogue;n++)HonroStory.finish(a);
        if(a.dialogue)throw Error('Campaign entry dialogue still active');
        a.close();HonroStoryFraming.clear(a.scene);
       }''',sid)
       canvas=page.locator('#battlecanvas')
       canvas.wait_for(state='visible')
       page.wait_for_timeout(1500)
       page.evaluate("()=>{const a=HonroApp;HonroStory.tick(a,performance.now());HonroStory.draw(a);if(document.getElementById('turn-banner')?.hidden===false)throw Error('First-turn banner still visible');}")
       for name,dx,dy in (views if sid==28 and w==390 else views[:1]):
        frame=page.evaluate('''q=>{
         const a=HonroApp,s=a.scene,b=a.engine.b;Object.defineProperty(performance,"now",{configurable:true,value:()=>100000});
         const st=HONRO_PROJECT.stages.find(t=>t.metadata?.stageId===q.sid);
         if(!st||b.honroStage!==q.sid)throw Error('Wrong loaded stage');
         const rect=s.canvas.getBoundingClientRect();
         const z=HonroBounds.zoomLimits(rect.width).min;
         const requested=q.sid===41?{x:250,y:2564,scale:.55}:{x:q.dx?q.dx*1e6:st.width/2,y:q.dy?q.dy*1e6:st.height/2,scale:z};
         HonroStoryFraming.clear(s);
         Object.assign(s,{manual:true,time:2,storyTween:null,storyFrozen:false,goalFocus:null,cinematic:null,focusUntil:0,speakerUntil:0,...requested});
         HonroBounds.constrain(s,b);
         const adjusted={x:s.x,y:s.y,scale:s.scale};const f=HonroBounds.focus(b);
         const id='stage28:qa-only:deep-foundation';
         const owner=b.honroLandmarks?.find(l=>l.asset?.id===id), declared=st.elements?.filter(e=>e.assetId===id)||[];
         const asset=HONRO_PROJECT.library.find(v=>v.id===id), enough=owner&&asset&&asset.collision.length===0&&asset.sockets.length===0;
         if(q.expected!==(!!enough)||declared.length!==+q.expected||q.expected&&(s._isForeground(owner)||owner.layer!=='structural-back'||declared[0].layer!=='structural-back'||asset.params.semanticLayer!=='BODY'))throw Error('Native owner/slot mismatch');
         const stageSource=JSON.stringify({...st,elements:st.elements.filter(e=>e.assetId!==id)});
         const signature=()=>JSON.stringify({terrain:b.terrain,world:b.honroWorldTerrain,rendered:HonroTerrainDomain.render(b),units:b.units,design:st.design,initialState:st.initialState,objectives:st.objectives,playBounds:b.honroPlayBounds,terrainBounds:b.honroTerrainBounds,landmarks:b.honroLandmarks?.filter(l=>l.asset?.id!==id)});
         const state=signature();s.render(a.engine,0,'',.6,false,0);s.render(a.engine,0,'',.6,false,0);
         if(signature()!==state)throw Error('Capture mutated gameplay state');
         const actual={x:s.x,y:s.y,scale:s.scale};
         const range=HonroBounds.viewport(s,rect.width,rect.height);
         const clamped=['x','y','scale'].every(k=>Math.abs(actual[k]-adjusted[k])<1e-6);
         const within=actual.x>=f.left-1e-6&&actual.x<=f.right+1e-6&&actual.y>=f.top-1e-6&&actual.y<=f.bottom+1e-6;
         return{state,stageSource,maskStyle:{rs:s._worldRasterScale(b,rect.width),dpr:window.devicePixelRatio,z:s.scale,domain:b.honroTerrainBounds,edgePixels:HonroTerrainReadability.STYLE.edgePixels,edgeInk:HonroTerrainReadability.STYLE.edgeInk},ink:HonroTerrainReadability.prepare(b).groups.map(g=>({id:g.id,segments:g.segments})),owner:owner?{id:owner.id,collision:owner.asset.collision.length,sockets:owner.asset.sockets.length,mode:owner.asset.params.semanticLayer,layer:owner.layer,visible:s._landmarkVisible(owner,range),foreground:s._isForeground(owner)}:null,requested,actual,adjusted,clamped,within,focus:f,viewport:range,css:{w:rect.width,h:rect.height},backing:[s.canvas.width,s.canvas.height],actorCount:b.units.length,projectStage:st.id};
        }''',{'sid':sid,'dx':dx,'dy':dy,'expected':expected and sid==28})
        if True:
         page.wait_for_function("window.__qaImages.every(i=>!i.src||i.complete)",timeout=120000)
         page.evaluate("()=>{const a=HonroApp;const unknown=window.__qaImages.filter(i=>i.src&&i.complete&&!i.naturalWidth).map(i=>i.src);if(unknown.length)throw Error('Visible image not decoded: '+unknown.join(', '));a.scene.render(a.engine,0,'',.6,false,0);}")
        file=f'act23-s{sid:02d}-{w}x{h}-{name}.png'
        if sid==28 and w==390:
         stem=file.removesuffix('.png')
         if MASK:
          segments=[s for g in frame['ink'] if g['id']=='a3-foundation' for s in g['segments'] if s=={'a':{'x':16200,'y':9000},'z':{'x':-9000,'y':9000},'walkable':False}]
          assert len(segments)==1
          inputs={k:frame[k] for k in ('css','backing','actual','viewport')}|frame['maskStyle']|{'segment':segments[0]}
          mask=page.evaluate(MASK_SOURCE,inputs)
          assert mask['spans'] and mask['segment']==segments[0]
          (OUT/(stem+'-independent-stroke-mask.json')).write_text(json.dumps(mask))
         diagnostic=page.evaluate(r"""()=>{
          const c=document.querySelector('#battlecanvas'), scene=HonroApp.scene;
          const pick=e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return{
           node:e.tagName,id:e.id,className:typeof e.className==='string'?e.className:'',
           rect:{x:r.x,y:r.y,left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height},
           client:{w:e.clientWidth,h:e.clientHeight,top:e.clientTop,left:e.clientLeft},
           style:{overflow:s.overflow,overflowX:s.overflowX,overflowY:s.overflowY,position:s.position,
                  transform:s.transform,clip:s.clip,clipPath:s.clipPath,backgroundColor:s.backgroundColor,backgroundImage:s.backgroundImage}}};
          const ancestors=[];for(let e=c;e;e=e.parentElement)ancestors.push(pick(e));
          const read=surface=>{
            if(!surface)return null;
            const ctx=surface.getContext('2d'),h=surface.height,w=surface.width,from=644,to=Math.min(648,h);
            return {height:h,width:w,from,to,rgba:to>from?Array.from(ctx.getImageData(0,from,w,to-from).data):[]};
          };
          const v=visualViewport,asset=HONRO_PROJECT.library.find(v=>v.id==='stage28:qa-only:deep-foundation');
          return {rawPng:c.toDataURL('image/png'),rawRows:read(c),worldCacheRows:read(scene._screenWorldCache?.canvas),
           ancestors,dpr:devicePixelRatio,scrollX,scrollY,innerWidth,innerHeight,visualViewport:v?{width:v.width,height:v.height,offsetLeft:v.offsetLeft,offsetTop:v.offsetTop,pageLeft:v.pageLeft,pageTop:v.pageTop,scale:v.scale}:null,
           ownerJSON:asset?JSON.stringify(asset):null,ownerOldSlotJSON:asset?JSON.stringify({...asset,params:{...asset.params,semanticLayer:'FORE'}}):null,vectorJSON:asset?JSON.stringify(asset.vector):null,
           servedStageBlobs:performance.getEntriesByType('resource').map(e=>e.name).filter(n=>/chapter-28(?:-assets)?\.[a-f0-9]+\.json/.test(n))};
         }""")
         (OUT/(stem+'-backing.png')).write_bytes(base64.b64decode(diagnostic.pop('rawPng').split(',',1)[1]))
         assets=diagnostic.pop('ownerJSON')
         old=diagnostic.pop('ownerOldSlotJSON')
         vec=diagnostic.pop('vectorJSON')
         diagnostic['loadedOwnerNormalizedToForeSha256']=hashlib.sha256(old.encode()).hexdigest() if old else None
         diagnostic['loadedVectorSha256']=hashlib.sha256(vec.encode()).hexdigest() if vec else None
         if old:assert diagnostic['loadedOwnerNormalizedToForeSha256']=='923611967851986cab7b851e60994851ae809fbc6c15107c0563c2002884d6dc'
         diagnostic['loadedOwnerSha256']=hashlib.sha256(assets.encode()).hexdigest() if assets else None
         if assets:(OUT/(stem+'-loaded-owner.json')).write_text(assets)
         page.screenshot(path=str(OUT/(stem+'-viewport.png')),animations='disabled')
         (OUT/(stem+'-raster.json')).write_text(json.dumps(diagnostic))
        img=canvas.screenshot(path=str(OUT/file),animations='disabled')
        st=frame.pop('state');ss=frame.pop('stageSource');frame.update(stageSourceSha256=hashlib.sha256(ss.encode()).hexdigest(),stage=sid,view=name,width=w,height=h,name=file,rasterSha256=hashlib.sha256(img).hexdigest(),physicsSha256=hashlib.sha256(st.encode()).hexdigest())
        frames.append(frame)
       if errors or requests:issues.append({'stage':sid,'width':w,'scriptErrors':errors,'requestFailures':requests})
      except Exception as e:
       issues.append({'stage':sid,'width':w,'exception':str(e),'scriptErrors':errors,'requestFailures':requests})
      finally:
       persist();page.close()
    browser.close()
persist()
critical=[i for i in issues if i.get('exception') or i.get('scriptErrors')]
assert not critical,critical
assert len(frames)==8,len(frames)
assert all(x['within'] and x['clamped'] for x in frames),[x['name'] for x in frames if not(x['within'] and x['clamped'])]
for sid in stages:
 for width in (1440,390):
  assert len({x['physicsSha256'] for x in frames if x['stage']==sid and x['width']==width})<=1,(sid,width)
print(f'{len(frames)} actual browser viewport captures plus stable physics through diagnostics')
