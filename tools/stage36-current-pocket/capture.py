import hashlib,json,os,re
from urllib.parse import urlsplit
from pathlib import Path
from playwright.sync_api import sync_playwright

OUT=Path(os.environ['OUT']); OUT.mkdir(parents=True,exist_ok=True)
frames=[];issues=[]
GRAPH=json.loads(Path(os.environ['GRAPH']).read_bytes())
BASE='http://127.0.0.1:'+os.environ['PORT']
sha=lambda b:hashlib.sha256(b).hexdigest()
stages=[36,37]
views=[('overview',0,0),('south',0,1),('southwest',-1,1),('southeast',1,1)]
def persist():
    (OUT/'proof.json').write_text(json.dumps({
      'scope':'Pinned stock built master, real campaign entry and renderer on two automatic CSS viewports. Original art only. Min-zoom centre/cardinal/corner captures; actual clamp verified. Official first-turn banner is expired and registered first-view images decoded before re-render. No normal play or art acceptance claimed.',
      'frames':frames,'problems':issues},indent=2))
RENDER_POSE='''async q=>{
         const a=HonroApp,s=a.scene,b=a.engine.b;
         const st=HONRO_PROJECT.stages.find(t=>t.metadata?.stageId===q.sid);
         if(!st||b.honroStage!==q.sid)throw Error('Wrong loaded stage');
         const rect=s.canvas.getBoundingClientRect();
         const z=HonroBounds.zoomLimits(rect.width).min;
         const requested={x:q.dx?q.dx*1e6:st.width/2,y:q.dy?q.dy*1e6:st.height/2,scale:z};
         HonroStoryFraming.clear(s);
         Object.assign(s,{manual:true,time:2,storyTween:null,storyFrozen:false,goalFocus:null,cinematic:null,focusUntil:0,speakerUntil:0,...requested});
         HonroBounds.constrain(s,b);
         const adjusted={x:s.x,y:s.y,scale:s.scale};const f=HonroBounds.focus(b);
         const signature=()=>JSON.stringify({terrain:b.terrain,worldTerrain:b.honroWorldTerrain,units:b.units,elements:st.elements,design:st.design,initialState:st.initialState,objectives:st.objectives,events:st.events});
         const resource=HONRO_PROJECT.library.find(z=>z.id==='approved36:near-slope-join-inland');
         const hex=async x=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(x)))).map(x=>x.toString(16).padStart(2,'0')).join('');
         const ownerSha=q.sid===36&&resource?await hex(JSON.stringify(resource)):null;
         const ownerMaskSha=q.sid===36&&resource?await hex(resource.vector.clips['source-alpha-silhouette'][0]):null;
         const state=signature();
         s._releaseDomainTiles();s._releaseRasterCanvas(s._staticWorldCache?.canvas);s._staticWorldCache=null;
         const sky=HonroTimeOfDay.sky,p=performance,old=p.now,own=Object.getOwnPropertyDescriptor(p,'now');
         HonroTimeOfDay.sky=function(...xs){if(xs[4]?.honroStage!==q.sid)return Reflect.apply(sky,this,xs);
          if(p.now!==old)throw Error('sky clock already modified');
          Object.defineProperty(p,'now',{value:()=>41000,configurable:true,writable:true});
          try{return Reflect.apply(sky,this,xs);}finally{if(own)Object.defineProperty(p,'now',own);else delete p.now;}};
         try{s.render(a.engine,0,'',.6,false,0);s.render(a.engine,0,'',.6,false,0);}finally{HonroTimeOfDay.sky=sky;}
         if(p.now!==old)throw Error('native clock not restored');
         if(signature()!==state)throw Error('Capture mutated gameplay state');
         const actual={x:s.x,y:s.y,scale:s.scale};
         const range=HonroBounds.viewport(s,rect.width,rect.height);
         const clamped=['x','y','scale'].every(k=>Math.abs(actual[k]-adjusted[k])<1e-6);
         const within=actual.x>=f.left-1e-6&&actual.x<=f.right+1e-6&&actual.y>=f.top-1e-6&&actual.y<=f.bottom+1e-6;
         return{state,ownerSha,ownerMaskSha,requested,actual,adjusted,clamped,within,focus:f,viewport:range,css:{w:rect.width,h:rect.height},backing:[s.canvas.width,s.canvas.height],actorCount:b.units.length,projectStage:st.id,tide:b.honroAct4PreviewState?.tide??null};
        }'''
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True)
    for sid in stages:
     for w,h in [(1440,900),(390,844)]:
      page=browser.new_page(viewport={'width':w,'height':h},device_scale_factor=1)
      errors=[]; requests=[]; responses={}
      def observed(r):
       u=urlsplit(r.url)
       if u.scheme in ('http','https'):
        if (u.scheme,u.netloc)!=('http',urlsplit(BASE).netloc):errors.append('unexpected remote HTTP '+r.url)
        else:responses[u.path.lstrip('/')]=r
      page.on('response',observed)
      page.add_init_script("window.__qaImages=[];const d=Object.getOwnPropertyDescriptor(HTMLImageElement.prototype,'src');Object.defineProperty(HTMLImageElement.prototype,'src',{...d,set(v){window.__qaImages.push(this);d.set.call(this,v)}});")
      page.on('pageerror',lambda e:errors.append(str(e)))
      page.on('requestfailed',lambda req: requests.append([req.url,req.failure]) if not (req.resource_type=='media' and 'ERR_ABORTED' in (req.failure or '')) else None)
      try:
       shell=page.goto(BASE+'/HONRO.html',wait_until='domcontentloaded',timeout=45000)
       assert shell and shell.status==200 and sha(shell.body())==GRAPH['htmlSHA256']
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
       if sid<=40:
        page.evaluate("()=>HonroAct4TerrainPreview?.coast?.tide?.(HonroApp.engine.b)")
       canvas=page.locator('#battlecanvas')
       canvas.wait_for(state='visible')
       page.wait_for_timeout(1500)
       page.wait_for_function("()=>{const a=HonroApp;HonroStory.tick(a,performance.now());HonroStory.draw(a);return document.getElementById('turn-banner')?.hidden===true&&!a.dialogue;}",polling=100,timeout=6500)
       hashes={}
       for rel in GRAPH['needed'][str(sid)]:
        r=responses.get(rel)
        assert r and r.status==200,('required real normal browser response',sid,rel)
        body=r.body();want=GRAPH['files'][rel];got={'bytes':len(body),'sha256':sha(body)}
        assert got==want,(sid,rel,got,want)
        hashes[rel]=got
       assert not errors,errors
       for name,dx,dy in views:
        frame=page.evaluate(RENDER_POSE,{'sid':sid,'dx':dx,'dy':dy})
        if name=='overview':
         page.wait_for_function("window.__qaImages.every(i=>!i.src||i.complete)",timeout=120000)
         page.evaluate("async()=>{await document.fonts.ready;const unknown=window.__qaImages.filter(i=>i.src&&i.complete&&!i.naturalWidth).map(i=>i.src);if(unknown.length)throw Error('Visible image not decoded: '+unknown.join(', '));}")
         frame=page.evaluate(RENDER_POSE,{'sid':sid,'dx':dx,'dy':dy})
        file=f'act45-s{sid:02d}-{w}x{h}-{name}.png';img=canvas.screenshot(path=str(OUT/file),animations='disabled')
        st=frame.pop('state');frame.update(stage=sid,view=name,width=w,height=h,name=file,rasterSha256=hashlib.sha256(img).hexdigest(),physicsSha256=hashlib.sha256(st.encode()).hexdigest(),http=hashes)
        frames.append(frame)
       bad=[(p,r.status) for p,r in responses.items() if r.status>=400]
       if errors or requests or bad:issues.append({'stage':sid,'width':w,'scriptErrors':errors,'requestFailures':requests,'badHTTP':bad})
      except Exception as e:
       issues.append({'stage':sid,'width':w,'exception':str(e),'scriptErrors':errors,'requestFailures':requests})
      finally:
       persist();page.close()
    browser.close()
persist()
assert not issues,issues
assert len(frames)==2*len(stages)*len(views),len(frames)
assert all(x['within'] and x['clamped'] for x in frames),[x['name'] for x in frames if not(x['within'] and x['clamped'])]
for sid in stages:
 for width in (1440,390):
  assert len({x['physicsSha256'] for x in frames if x['stage']==sid and x['width']==width})==1,(sid,width)
print('Sixteen normal HTTP viewport captures plus stable gameplay signature')
