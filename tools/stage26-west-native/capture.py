import hashlib,json,os,base64,urllib.parse,re
from PIL import Image
from pathlib import Path
from playwright.sync_api import sync_playwright

P=Path(os.environ['STAGE26_QA'])
ARM=os.environ['STAGE26_ARM'];assert ARM in ('A','B')
OUT=P/'evidence'/ARM; OUT.mkdir(parents=True,exist_ok=True)
PATCHED=(P/'west-candidate.js').read_bytes()
OWNER='web/runtime/ordered-common-17.9b8e07dd9a78ec92.js'
BASE='https://sys8994.github.io/honro/'
RELEASE='4416dfb527f810398903d15510ab8ca05a892661'
IDENTITY={'HONRO.html':'36d138b95b55bea83ae2580499105e0194e98928','web/entries/game.340c32a30a66adad.js':'bec78f1a10a8594703cb57ab2b35041191be21ea','web/data/campaign.9840d8f258b12a6d.json':'aed4c6004795df3aba19409bed480cb34f43d7cb','web/data/chapter-26.cc8e0e37503433b3.json':'846ef414bc95659495072ed7dcab9df720f80e09','web/data/chapter-26-assets.a45d6ce39671a754.json':'f0a63c9c7a499a222764eccc6bbb569f1fa2b84a'}
def git_sha(data):
 return hashlib.sha1(f'blob {len(data)}\0'.encode()+data).hexdigest()
man=(P/'manifest.json').read_bytes()
assert git_sha(man)=='cf62cfd03527fd821f126d7b017f4c363ae09a7d'
resource={d['path']:d for d in json.loads(man)['files']}
ref=(Path(__file__).parent/'stock-reference.json').read_bytes()
assert hashlib.sha256(ref).hexdigest()=='04e7e495c12157007b21f06bf29db1104b68e8d8c033e09d75ab35291c85f924'
old_dict=json.loads(ref)
references={(f['width'],f['view']):f for f in old_dict['frames'] if f['stage']==26 and f['view'] in ('southwest','southeast')}
assert len(references)==4
assert old_dict['release']==RELEASE and len(references)==4
stock_owner=(P/'stock-owner.js').read_bytes(); assert git_sha(stock_owner)=='1c9add7508d0e2dd1084346729a33b0de0a02eb2'
frames=[];issues=[]
stages=[26]
assert stages and all(i in {14,23,24,25,26,27,29} for i in stages)
views=[('overview',0,0),('southwest',-1,1),('southeast',1,1)]
network=[]
browser_version=None
def persist():
    (OUT/'proof.json').write_text(json.dumps({
      'scope':'Isolated Stage26 native material proof, not product or release. A exact stock. B confined to signed one response in a fresh test browser.', 'release':RELEASE,'arm':ARM,'bundledChromium':browser_version,'network':network,
      'frames':frames,'problems':issues},indent=2))
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True)
    browser_version=browser.version
    assert browser_version=="151.0.7922.34"
    for sid in stages:
     for w,h in [(1440,900),(390,844)]:
      context=browser.new_context(viewport={'width':w,'height':h},device_scale_factor=1,service_workers='block')
      assert context.storage_state()=={'cookies':[],'origins':[]}
      page=context.new_page()
      # Disable every other origin and all mutations to remote sites.
      route_hits=[]
      unrelated_blocks=[]
      silent_bgm=re.compile(r'assets/bgm/[a-zA-Z0-9_-]+\.mp3')
      def routed(route):
       req=route.request
       if req.method not in ('GET','HEAD') or not req.url.startswith(BASE):return route.abort()
       media_path=urllib.parse.urlsplit(req.url).path.removeprefix('/honro/')
       if req.resource_type=='media' and req.method=='GET' and media_path not in resource and silent_bgm.fullmatch(media_path):
        unrelated_blocks.append([media_path,'randomized music disabled in both silent arms'])
        return route.abort('aborted')
       if ARM=='B' and req.url==BASE+OWNER and req.method=='GET':
        route_hits.append(req.url)
        # This is a single response scoped to this disposable local test browser.
        return route.fulfill(status=200,content_type='text/javascript; charset=utf-8',body=PATCHED)
       return route.continue_()
      context.route('**/*',routed)
      expected=set()
      response_problems=[]
      def observe(request):
       response=request.response()
       path=urllib.parse.urlsplit(request.url).path.removeprefix('/honro/')
       if not response:return
       if not response.url.startswith(BASE):
        response_problems.append(['off-origin response',response.url]);return
       if path not in IDENTITY and path not in resource:
        response_problems.append([path,'not owned by exact manifest']);return
       if response.status!=200:
        # Browser audio with an HTTP range is allowed only if unused by this silent visual proof.
        if path not in IDENTITY and request.resource_type=='media' and response.status==206:
         unrelated_blocks.append([path,206]);return
        response_problems.append([path,response.status]);return
       try:
        data=response.body()
        git=git_sha(data); sha=hashlib.sha256(data).hexdigest()
        if path in IDENTITY:
         assert git==IDENTITY[path],(path,git)
         expected.add(path)
        if ARM=='B' and path==OWNER:
         assert data==PATCHED
        elif path in resource:
         assert sha==resource[path]['sha256'] and len(data)==resource[path]['bytes'],(path,sha)
        network.append({'width':w,'path':path,'status':200,'git':git,'sha256':sha,'bytes':len(data)})
       except Exception as e:
        response_problems.append([path,str(e)])
      page.on('requestfinished',observe)
      errors=[]; requests=[]
      page.add_init_script("window.__qaImages=[];const d=Object.getOwnPropertyDescriptor(HTMLImageElement.prototype,'src');Object.defineProperty(HTMLImageElement.prototype,'src',{...d,set(v){window.__qaImages.push(this);d.set.call(this,v)}});")
      page.on('pageerror',lambda e:errors.append(str(e)))
      def failed(req):
       if (req.failure=='net::ERR_ABORTED' and req.resource_type=='media' and req.url.startswith(BASE)):
        unrelated_blocks.append([req.url,req.failure]);return
       requests.append([req.url,req.failure])
      page.on('requestfailed',failed)
      try:
       page.goto(BASE+'HONRO.html',wait_until='domcontentloaded',timeout=50000)
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
         if(!st||b.honroStage!==q.sid)throw Error('Wrong loaded stage');
         const rect=s.canvas.getBoundingClientRect();
         const z=HonroBounds.zoomLimits(rect.width).min;
         const requested={x:q.dx?q.dx*1e6:st.width/2,y:q.dy?q.dy*1e6:st.height/2,scale:z};
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
        }''',{'sid':sid,'dx':dx,'dy':dy})
        if name=='overview':
         page.wait_for_function("window.__qaImages.every(i=>!i.src||i.complete)",timeout=120000)
         page.evaluate("()=>{const a=HonroApp;const unknown=window.__qaImages.filter(i=>i.src&&i.complete&&!i.naturalWidth).map(i=>i.src);if(unknown.length)throw Error('Visible image not decoded: '+unknown.join(', '));a.scene.render(a.engine,0,'',.6,false,0);}")
        if name=='overview':continue  # Keep the archive's warm-up without adding a pose.
        image_ready=page.evaluate('''async()=>{await document.fonts.ready;const live=window.__qaImages.filter(i=>i.src);
          await Promise.all(live.map(i=>i.decode()));const a=HonroApp;
          a.scene.render(a.engine,0,'',.6,false,0);
          return {registered:live.length,failed:live.filter(i=>!i.complete||!i.naturalWidth).length,
           actual:{x:a.scene.x,y:a.scene.y,scale:a.scene.scale},time:a.scene.time,
           signature:JSON.stringify({terrain:a.engine.b.terrain,units:a.engine.b.units,design:HONRO_PROJECT.stages.find(t=>t.metadata?.stageId===26).design,initialState:HONRO_PROJECT.stages.find(t=>t.metadata?.stageId===26).initialState,objectives:HONRO_PROJECT.stages.find(t=>t.metadata?.stageId===26).objectives})};}''')
        assert image_ready.pop('signature')==frame['state']
        assert image_ready['actual']==frame['actual'] and image_ready['failed']==0 and image_ready['time']==2
        frame['decode']=image_ready
        file=f'stock-4416-s{sid:02d}-{w}x{h}-{name}.png';img=canvas.screenshot(path=str(OUT/file),animations='disabled')
        raw=page.evaluate("()=>document.getElementById('battlecanvas').toDataURL('image/png').split(',')[1]")
        raw_png=base64.b64decode(raw,validate=True)
        raw_name=file.replace('.png','-raw.png')
        (OUT/raw_name).write_bytes(raw_png)
        with Image.open(OUT/raw_name) as raw_img:
         raw_img.load()
         assert raw_img.size==tuple(frame['backing'])
        frame.update(rawPng=raw_name,rawSha256=hashlib.sha256(raw_png).hexdigest())
        st=frame.pop('state');frame.update(stage=sid,view=name,width=w,height=h,name=file,rasterSha256=hashlib.sha256(img).hexdigest(),physicsSha256=hashlib.sha256(st.encode()).hexdigest())
        old=references[(w,name)]
        frame['slotHits']=page.evaluate('()=>globalThis.__stage26WestProofDraws||0')
        if ARM=='A':
         assert frame['slotHits']==0 and not route_hits
         assert frame['rawSha256']==old['rawSha256'] and frame['rasterSha256']==old['rasterSha256'],(w,name,'stock no longer replays exact registered frame')
        else:
         assert len(route_hits)==1,(w,name,route_hits)
         if name=='southwest':assert frame['slotHits']>0,(w,name,'native slot not reached')
        frame['ownerRouteHits']=len(route_hits)
        for field in ['requested','actual','adjusted','clamped','within','focus','viewport','css','backing','actorCount','projectStage','physicsSha256']:
         assert frame[field]==old[field],(field,frame[field],old[field])
        with Image.open(OUT/file) as a:
         a.load()
         assert list(a.size)==old['decodedPngSize']
         frame['decodedPngSize']=list(a.size)
        frames.append(frame)
       assert expected==set(IDENTITY),(expected,response_problems)
       assert any(n['width']==w and n['path']==OWNER for n in network),(w,'actual owner response missing')
       assert not response_problems,response_problems
       if errors or requests or unrelated_blocks:
        issues.append({'stage':sid,'width':w,'scriptErrors':errors,'requestFailures':requests,'silentNonVisualMedia':unrelated_blocks})
      except Exception as e:
       issues.append({'stage':sid,'width':w,'exception':str(e),'scriptErrors':errors,'requestFailures':requests})
      finally:
       persist();context.close()
    browser.close()
persist()
critical=[i for i in issues if i.get('exception') or i.get('scriptErrors') or i.get('requestFailures')]
assert not critical,critical
assert len(frames)==len(stages)*4,len(frames)
assert all(x['within'] and x['clamped'] for x in frames),[x['name'] for x in frames if not(x['within'] and x['clamped'])]
for sid in stages:
 for width in (1440,390):
  assert len({x['physicsSha256'] for x in frames if x['stage']==sid and x['width']==width})==1,(sid,width)
print(f'Arm {ARM} actual native Chrome four registered views and exact live stage identity.')
