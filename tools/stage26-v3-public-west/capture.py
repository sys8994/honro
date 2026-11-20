import hashlib,json,os,base64,urllib.parse,re
from PIL import Image
from pathlib import Path
from playwright.sync_api import sync_playwright

from public import BASE, OUT, REF, POLICY, git, write_json
ARM='B'
RELEASE=POLICY['release']
GRAPH={'files':{r['path']:r for r in json.loads(git('show',RELEASE+':web/manifest.json'))['files']},
       'needed':REF['active'],'htmlSHA256':REF['htmlSHA256'],'material':REF['material']}
SHA=lambda b:hashlib.sha256(b).hexdigest()
public_source=json.loads((OUT/'public-source.json').read_bytes())
assert public_source['complete'] is True and public_source['release']==POLICY and len(public_source['http'])==15
references={(f['width'],f['view']):f for f in REF['frames'].values()}
assert set(references)=={(1440,'west-near'),(1440,'southwest'),(390,'southwest')}
assert all({k:GRAPH['files'][path][k] for k in ('bytes','sha256')}==v for path,v in REF['active'].items())
frames=[];issues=[]
stages=[26]
views=[('overview',0,0),('southwest',-1,1),('southeast',1,1),('overview-control',0,0),('west-near',0,0)]
network=[]; ownership=[]
browser_version=None
complete=False
def persist():
    (OUT/'proof.json').write_text(json.dumps({
      'scope':'Three Stage26 v3 west camera poses from the public release. No routing/response replacement or full playthrough.', 'release':RELEASE,'arm':ARM,
      'fixtureAuthority':REF['fixtureAuthority'],'bundledChromium':browser_version,'network':network,
      'frames':frames,'problems':issues,'ownership':ownership,'complete':complete},indent=2))
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True)
    browser_version=browser.version
    assert browser_version=="151.0.7922.34"
    for sid in stages:
     for w,h in [(1440,900),(390,844)]:
      context=browser.new_context(viewport={'width':w,'height':h},device_scale_factor=1,service_workers='block')
      assert context.storage_state()=={'cookies':[],'origins':[]}
      page=context.new_page()
      # Observe the actual served browser responses. No route handler, no
      # script replacement, no CDP patch, and no product behavior is intercepted.
      responses={}; response_problems=[]; harmless=[]
      bgm=re.compile(r'assets/bgm/(?:main|battle-[123])\.mp3')
      def observe(r):
       u=urllib.parse.urlsplit(r.url);h=urllib.parse.urlsplit(BASE)
       if (u.scheme,u.netloc)!=(h.scheme,h.netloc):
        if u.scheme in ('http','https'):response_problems.append(['off-origin',r.url])
        return
       if not r.url.startswith(BASE) or u.query or u.fragment:
        response_problems.append(['unexpected public route',r.url]);return
       path=u.path.removeprefix('/honro/')
       if path not in GRAPH['files'] and path!='HONRO.html':
        if r.status in (200,206) and r.request.resource_type=='media' and bgm.fullmatch(path):
         harmless.append({'path':path,'status':r.status});return
        response_problems.append([path,'unowned page response']);return
       if r.status!=200:response_problems.append([path,r.status])
       responses[path]=r
      page.on('response',observe)
      errors=[]; requests=[]
      page.add_init_script("window.__qaImages=[];const d=Object.getOwnPropertyDescriptor(HTMLImageElement.prototype,'src');Object.defineProperty(HTMLImageElement.prototype,'src',{...d,set(v){window.__qaImages.push(this);d.set.call(this,v)}});")
      page.on('pageerror',lambda e:errors.append(str(e)))
      page.on('request',lambda req:errors.append('unexpected write attempt '+req.method+' '+req.url) if req.method not in ('GET','HEAD') else None)
      def failed(req):
       if req.failure=='net::ERR_ABORTED' and req.resource_type=='media' and req.url.startswith(BASE) and bgm.fullmatch(urllib.parse.urlsplit(req.url).path.removeprefix('/honro/')):
        harmless.append({'path':urllib.parse.urlsplit(req.url).path.removeprefix('/honro/'),'status':'net::ERR_ABORTED'});return
       requests.append([req.url,req.failure])
      page.on('requestfailed',failed)
      try:
       shell=page.goto(BASE+'HONRO.html',wait_until='domcontentloaded',timeout=50000)
       assert shell and shell.url==BASE+'HONRO.html' and shell.status==200 and SHA(shell.body())==GRAPH['htmlSHA256']
       page.wait_for_function("document.documentElement.dataset.honroReady==='true' && window.HonroCampaignLoader",timeout=90000)
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
       for name,dx,dy in views:
        frame=page.evaluate('''q=>{
         const a=HonroApp,s=a.scene,b=a.engine.b;
         const st=HONRO_PROJECT.stages.find(t=>t.metadata?.stageId===q.sid);
         if(!st||b.honroStage!==q.sid||b.honroCustom!==false||!b.honroCanonical)throw Error('Wrong loaded stage');
         const rect=s.canvas.getBoundingClientRect();
         const z=HonroBounds.zoomLimits(rect.width).min;
         const requested=q.name==='west-near'?{x:-150,y:2520,scale:.5}:{x:q.dx?q.dx*1e6:st.width/2,y:q.dy?q.dy*1e6:st.height/2,scale:z};
         HonroStoryFraming.clear(s);
         Object.assign(s,{manual:true,time:2,storyTween:null,storyFrozen:false,goalFocus:null,cinematic:null,focusUntil:0,speakerUntil:0,...requested});
         HonroBounds.constrain(s,b);
         const adjusted={x:s.x,y:s.y,scale:s.scale};const f=HonroBounds.focus(b);
         const signature=()=>JSON.stringify({terrain:b.terrain,units:b.units,design:st.design,initialState:st.initialState,objectives:st.objectives});
         const state=signature();s.render(a.engine,0,'',.6,false,0);s.render(a.engine,0,'',.6,false,0);
         if(signature()!==state)throw Error('Capture mutated gameplay state');
         const actual={x:s.x,y:s.y,scale:s.scale};
         const range=HonroBounds.viewport(s,rect.width,rect.height);
         const clamped=['x','y','scale'].every(k=>Math.abs(actual[k]-adjusted[k])<1e-6);
         const within=actual.x>=f.left-1e-6&&actual.x<=f.right+1e-6&&actual.y>=f.top-1e-6&&actual.y<=f.bottom+1e-6;
         return{state,requested,actual,adjusted,clamped,within,focus:f,viewport:range,css:{w:rect.width,h:rect.height},backing:[s.canvas.width,s.canvas.height],actorCount:b.units.length,projectStage:st.id,tide:b.honroAct4PreviewState?.tide??null};
        }''',{'sid':sid,'dx':dx,'dy':dy,'name':name})
        if name=='overview':
         page.wait_for_function("window.__qaImages.every(i=>!i.src||i.complete)",timeout=120000)
         page.evaluate("()=>{const a=HonroApp;const unknown=window.__qaImages.filter(i=>i.src&&i.complete&&!i.naturalWidth).map(i=>i.src);if(unknown.length)throw Error('Visible image not decoded: '+unknown.join(', '));a.scene.render(a.engine,0,'',.6,false,0);}")
        if name=='overview':continue  # Keep the registered warm-up; extra controls only after both legacy views.
        image_ready=page.evaluate('''async()=>{await document.fonts.ready;const live=window.__qaImages.filter(i=>i.src);
          await Promise.all(live.map(i=>i.decode()));const a=HonroApp;
          a.scene.render(a.engine,0,'',.6,false,0);
          return {registered:live.length,failed:live.filter(i=>!i.complete||!i.naturalWidth).length,
           actual:{x:a.scene.x,y:a.scene.y,scale:a.scene.scale},time:a.scene.time,
           signature:JSON.stringify({terrain:a.engine.b.terrain,units:a.engine.b.units,design:HONRO_PROJECT.stages.find(t=>t.metadata?.stageId===26).design,initialState:HONRO_PROJECT.stages.find(t=>t.metadata?.stageId===26).initialState,objectives:HONRO_PROJECT.stages.find(t=>t.metadata?.stageId===26).objectives})};}''')
        assert image_ready.pop('signature')==frame['state']
        assert image_ready['actual']==frame['actual'] and image_ready['failed']==0 and image_ready['time']==2
        frame['decode']=image_ready
        if (w,name) not in references:continue  # Keep the preceding render/cache sequence; export only the three public views.
        file=f'v3-s{sid:02d}-{w}x{h}-{name}.png';img=canvas.screenshot(path=str(OUT/file),animations='disabled')
        raw=page.evaluate("()=>document.getElementById('battlecanvas').toDataURL('image/png').split(',')[1]")
        raw_png=base64.b64decode(raw,validate=True)
        raw_name=file.replace('.png','-raw.png')
        (OUT/raw_name).write_bytes(raw_png)
        with Image.open(OUT/raw_name) as raw_img:
         raw_img.load()
         assert raw_img.size==tuple(frame['backing'])
        frame.update(rawPng=raw_name,rawSha256=hashlib.sha256(raw_png).hexdigest())
        st=frame.pop('state');frame.update(stage=sid,view=name,width=w,height=h,name=file,rasterSha256=hashlib.sha256(img).hexdigest(),physicsSha256=hashlib.sha256(st.encode()).hexdigest())
        with Image.open(OUT/file) as a:
         a.load();frame['decodedPngSize']=list(a.size)
        old=references[(w,name)]
        # This observed count can differ with origin preload/cache scheduling. Every
        # requested image must decode, and exact raw/DOM PNGs and every visual/scene
        # field remain checked. Retain both measured counts for transparency.
        got_count=frame['decode']['registered']; want_count=old['decode']['registered']
        assert type(got_count) is int and got_count>0 and type(want_count) is int and want_count>0
        drop_count=lambda row: {**row,'decode':{k:v for k,v in row['decode'].items() if k!='registered'}}
        expect,measured=drop_count(old),drop_count(frame)
        delta={k:{'expected':v,'actual':measured.get(k)} for k,v in expect.items() if measured.get(k)!=v}
        frames.append(frame); persist()
        assert measured==expect,('Public app scene or PNG hash differs from v3 baseline',w,name,delta)
       assert page.evaluate("()=>HonroApp.profile.settings.music===false&&HonroApp.profile.settings.sound===false")
       loaded=page.evaluate("""arm=>{const b=HonroApp.engine.b,id='act3-handoff:26:kiln-foundation';
         const matches=rows=>rows.filter(v=>v.id===id&&v.asset?.id===id);
         const registered=HONRO_PROJECT.library.filter(v=>v.id===id);
         const [a,...duplicate]=matches(HonroTerrainDomain.materialLandmarks(b));
         const [native]=registered;
         if(!a||duplicate.length||registered.length!==1||a.kind!=='canonical-element'||
            a.x!==0||a.y!==0||a.scale!==1||!b.honroCanonical||b.honroCustom!==false||b.honroStage!==26)
           throw Error('wrong canonical Stage26 owner');
         const actual=a.asset, box=actual.bounds, reg=native.bounds, isB=arm==='B';
         if(!reg||reg.x!==0||reg.y!==2150||reg.w!==7000||reg.h!==3907)
           throw Error('registered source bounds moved');
         if(!box||box.x!==(isB?-1480:0)||box.w!==(isB?8480:7000)||box.y!==reg.y||box.h!==reg.h||
            (actual!==native)!==isB||(box!==reg)!==isB)
           throw Error('wrong render-only bounds identity');
         const own=o=>Object.keys(o).sort().join('|');
         if(own(actual)!==own(native)||own(box)!==own(reg)||
            !Object.keys(actual).filter(k=>k!=='bounds').every(k=>Object.is(actual[k],native[k]))||
            !Object.keys(box).filter(k=>k!=='x'&&k!=='w').every(k=>Object.is(box[k],reg[k]))||
            !actual.params||!actual.reference||!Array.isArray(actual.visual))
           throw Error('registered asset contents/aliases changed');
         const again=matches(HonroTerrainDomain.materialLandmarks(b));
         if(again.length!==1||again[0].asset!==actual||HONRO_PROJECT.library.find(v=>v.id===id)!==native)
           throw Error('render-only clone not stable or project owner replaced');
         return {assetId:id,changedBoundsOnly:isB,cloneStable:true,nativeBounds:reg,renderBounds:box,
           sharedOwnFields:Object.keys(actual).filter(k=>k!=='bounds').sort(),material:actual.params.westBedMaterial??null};
       }""",ARM)
       assert loaded.pop('material')==GRAPH['material'],('normal runtime asset field',ARM)
       ownership.append({'stage':sid,'width':w,**loaded});persist()
       assert ownership[-1]==REF['ownership'][str(w)],('actual support owner differs',w)
       for path in GRAPH['needed']:
        r=responses.get(path);assert r and (r.url,r.request.method,r.status)==(BASE+path,'GET',200),('missing actual HTTP path',path)
        d=r.body();v={'bytes':len(d),'sha256':SHA(d)}
        assert v==REF['active'][path],(w,path,v,REF['active'][path])
        network.append({'width':w,'path':path,**v})
       assert not response_problems,response_problems
       if errors or requests or harmless:
        issues.append({'stage':sid,'width':w,'scriptErrors':errors,'requestFailures':requests,'silentNonVisualMedia':harmless})
      except Exception as e:
       issues.append({'stage':sid,'width':w,'exception':str(e),'scriptErrors':errors,'requestFailures':requests})
      finally:
       persist();context.close()
    browser.close()
persist()
critical=[i for i in issues if i.get('exception') or i.get('scriptErrors') or i.get('requestFailures')]
assert not critical,critical
assert len(frames)==3
assert {(f['width'],f['view']) for f in frames}==set(references)
assert len(ownership)==2 and {v['width'] for v in ownership}=={1440,390}
assert len(network)==16
assert all(x['within'] and x['clamped'] for x in frames),[x['name'] for x in frames if not(x['within'] and x['clamped'])]
for sid in stages:
 for width in (1440,390):
  assert len({x['physicsSha256'] for x in frames if x['stage']==sid and x['width']==width})==1,(sid,width)
complete=True
persist()
print('Stage26 v3 public PASS: exact six PNGs in three west camera poses and exact canonical collision/asset bounds.')
