import json, io
from urllib.parse import urlsplit
from PIL import Image
from playwright.sync_api import sync_playwright
from public import BASE, OUT, REF, POLICY, sha, measure, write_json

# Same engine/view/scene setup as official 44814900553. The disposable
# incognito contexts never use or export a user save; no response is replaced.
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
ENTER='''async sid=>{
        const a=HonroApp;a.frame=()=>{};a.profile.settings.music=false;a.profile.settings.sound=false;
        await HonroCampaignLoader.ensureStage(sid);
        for(let n=1;n<sid;n++)a.profile.cleared[n]=true;
        for(const hero of Object.values(a.profile.heroes))hero.xp=HonroProgression.xpAt(HonroProgression.plan(sid).entryLevel);
        a.launch(sid);if(a.engine?.b.honroStage!==sid)throw Error('Campaign launch did not reach '+sid);
        for(let n=0;n<40&&a.dialogue;n++)HonroStory.finish(a);
        if(a.dialogue)throw Error('Campaign entry dialogue still active');
        a.close();HonroStoryFraming.clear(a.scene);
       }'''

AUDIO={'assets/bgm/main.mp3',*(f'assets/bgm/battle-{n}.mp3' for n in range(1,7))}
verified=json.loads((OUT/'public-source.json').read_bytes())
assert verified['complete'] is True and verified['release']==POLICY and len(verified['http'])==12
receipt={'scope':'Two actual Stage36 southeast public Chrome frames; no release/action or playthrough claim',
         'release':POLICY,'fixtureAuthority':REF['fixtureAuthority'],'views':[],'errors':[],'complete':False}
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True)
    receipt['chromium']=browser.version
    assert browser.version=='145.0.7632.6',browser.version
    for w,h in ((1440,900),(390,844)):
      expected=REF['frames'][str(w)]
      ctx=browser.new_context(viewport={'width':w,'height':h},device_scale_factor=1,service_workers='block')
      assert ctx.storage_state()=={'cookies':[],'origins':[]}
      page=ctx.new_page()
      res={}; errors=[]; failures=[]; unrelated=[]
      def response(r):
       u=urlsplit(r.url)
       if u.scheme in ('http','https'):
        if not r.url.startswith(BASE):
         errors.append('unexpected remote HTTP '+r.url)
        elif not u.query and not u.fragment:
         res[u.path.removeprefix('/honro/')]=r
      def failed(req):
       part=urlsplit(req.url).path.removeprefix('/honro/')
       if req.url.startswith(BASE) and part in AUDIO and req.resource_type=='media' and req.failure=='net::ERR_ABORTED':
        unrelated.append([part,req.failure]);return
       failures.append([req.url,req.failure])
      page.on('response',response)
      page.on('pageerror',lambda e:errors.append(str(e)))
      page.on('requestfailed',failed)
      page.on('request',lambda req:errors.append('unexpected mutation request '+req.method+' '+req.url) if req.method not in ('GET','HEAD') else None)
      page.add_init_script("window.__qaImages=[];const d=Object.getOwnPropertyDescriptor(HTMLImageElement.prototype,'src');Object.defineProperty(HTMLImageElement.prototype,'src',{...d,set(v){window.__qaImages.push(this);d.set.call(this,v)}});")
      try:
       shell=page.goto(BASE+'HONRO.html',wait_until='domcontentloaded',timeout=45000)
       assert shell and shell.url==BASE+'HONRO.html' and shell.status==200 and sha(shell.body())==REF['htmlSHA256']
       page.wait_for_function("document.documentElement.dataset.honroReady==='true' && window.HonroCampaignLoader",timeout=180000)
       page.evaluate(ENTER,36)
       page.evaluate("()=>HonroAct4TerrainPreview?.coast?.tide?.(HonroApp.engine.b)")
       canvas=page.locator('#battlecanvas');canvas.wait_for(state='visible')
       page.wait_for_timeout(1500)
       page.wait_for_function("()=>{const a=HonroApp;HonroStory.tick(a,performance.now());HonroStory.draw(a);return document.getElementById('turn-banner')?.hidden===true&&!a.dialogue;}",polling=100,timeout=6500)
       hashes={}
       for rel,want in REF['active'].items():
        r=res.get(rel)
        assert r and (r.url,r.request.method,r.status)==(BASE+rel,'GET',200),('actual normal browser response missing',w,rel)
        got=measure(r.body());assert got==want,(w,rel,got,want)
        hashes[rel]=got
       # Restore original official render order/caches, but only write requested southeast PNG.
       for dx,dy in ((0,0),(0,1),(-1,1),(1,1)):
        frame=page.evaluate(RENDER_POSE,{'sid':36,'dx':dx,'dy':dy})
        if (dx,dy)==(0,0):
         page.wait_for_function("window.__qaImages.every(i=>!i.src||i.complete)",timeout=120000)
         page.evaluate("async()=>{await document.fonts.ready;const unknown=window.__qaImages.filter(i=>i.src&&i.complete&&!i.naturalWidth).map(i=>i.src);if(unknown.length)throw Error('Visible image not decoded: '+unknown.join(', '));}")
         frame=page.evaluate(RENDER_POSE,{'sid':36,'dx':dx,'dy':dy})
       name=expected['render']['name']
       img=canvas.screenshot(path=str(OUT/name),animations='disabled')
       frame.update(stage=36,view='southeast',width=w,height=h,name=name,
                    physicsSha256=sha(frame.pop('state').encode()),rasterSha256=sha(img))
       data=Image.open(io.BytesIO(img)).convert('RGBA')
       box=expected['roi']
       assert data.size=={1440:(1440,770),390:(390,648)}[w]
       assert 0<=box[0]<box[2]<=data.width and 0<=box[1]<box[3]<=data.height
       bright=sum(data.getchannel(2).crop(box).histogram()[131:])
       changes={k:{'expected':v,'actual':frame.get(k)} for k,v in expected['render'].items() if frame.get(k)!=v}
       bad=[(f,r.status) for f,r in res.items() if r.status>=400]
       receipt['views'].append({'frame':frame,'publicResponses':hashes,'roi':box,
           'stockBrightBluePixels':expected['priorBrightBluePixels'],'publicBrightBluePixels':bright,
           'fixtureDiff':changes,'ordinaryAudioAborts':unrelated})
       assert not (errors or failures or bad),(errors,failures,bad)
       assert not changes,('Exact official pixels or active scene differed',w,changes)
       assert bright==0,('The old bright pocket remains',w,box,bright)
      except Exception as e:
       receipt['errors'].append({'width':w,'exception':str(e),'pageErrors':errors,'requestFailures':failures})
      finally:
       write_json('public-browser.json',receipt)
       ctx.close()
    browser.close()
receipt['complete']=len(receipt['views'])==2 and not receipt['errors']
write_json('public-browser.json',receipt)
assert receipt['complete'],receipt['errors']
print('Stage36 native public southeast PC/mobile: exact approved PNGs, owner, physics and two missing sky pockets.')
