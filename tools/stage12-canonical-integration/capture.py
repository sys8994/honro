import hashlib,json,os,re,base64
from pathlib import Path
from playwright.sync_api import sync_playwright

OUT=Path(os.environ['OUT']); OUT.mkdir(parents=True,exist_ok=True)
frames=[];issues=[]
views=[('overview',0,0),('north',0,-1),('south',0,1),('west',-1,0),('east',1,0),('northwest',-1,-1),('northeast',1,-1),('southwest',-1,1),('southeast',1,1),('bottom-left',0,1),('bottom-right',1,1)]
def persist():
    (OUT/'proof.json').write_text(json.dumps({
      'scope':'Official app diagnostic, original weather draws with only cloud phase/clock isolated at each sampled render; phase restored after capture. Raw canvas and DOM screenshots; not natural-time live playback.',
      'frames':frames,'problems':issues},indent=2))
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True)
    for sid in [12,13]:
     for w,h in [(390,892),(1440,900)]:
      page=browser.new_page(viewport={'width':w,'height':h},device_scale_factor=1)
      page.add_init_script("""(()=>{let seed=3910;Math.random=()=>((seed=(seed*1664525+1013904223)>>>0)/2**32);window.__qaImages=new Set();const d=Object.getOwnPropertyDescriptor(HTMLImageElement.prototype,'src');Object.defineProperty(HTMLImageElement.prototype,'src',{...d,set(v){window.__qaImages.add(this);d.set.call(this,v)}});})()""")
      errors=[]; requests=[]
      page.on('pageerror',lambda e:errors.append(str(e)))
      page.on('requestfailed',lambda req: requests.append([req.url,req.failure]))
      try:
       page.goto('http://127.0.0.1:' + os.environ['PORT'] + '/HONRO.html',wait_until='domcontentloaded',timeout=180000)
       page.wait_for_function("document.documentElement.dataset.honroReady==='true' && window.HonroCampaignLoader",timeout=180000)
       page.evaluate('''async sid=>{
        const a=HonroApp;a.frame=()=>{};a.profile.settings.music=false;a.profile.settings.sound=false;
        await HonroCampaignLoader.ensureStage(sid);
        for(let n=1;n<sid;n++)a.profile.cleared[n]=true;
        for(const hero of Object.values(a.profile.heroes))hero.xp=HonroProgression.xpAt(HonroProgression.plan(sid).entryLevel);
        a.launch(sid);if(a.engine?.b.honroStage!==sid)throw Error('Campaign launch did not reach '+sid);
        for(let n=0;n<40&&a.dialogue;n++)HonroStory.finish(a);
        if(a.dialogue)throw Error('Campaign entry dialogue still active');
        a.close();HonroStory.tick(a,performance.now());HonroStory.draw(a);HonroStoryFraming.clear(a.scene);
       }''',sid)
       canvas=page.locator('#battlecanvas')
       canvas.wait_for(state='visible')
       page.wait_for_function("document.getElementById('turn-banner')?.hidden!==false",timeout=10000)
       catalog=page.evaluate('''async sid=>{
         const b=HonroApp.engine.b,stage=HONRO_PROJECT.stages.find(s=>s.metadata?.stageId===sid);
         if(b.honroStage!==sid||!stage)throw Error('Unmapped active Stage'+sid);
         const hash=async x=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(x))))).map(v=>v.toString(16).padStart(2,'0')).join('');
         const assets=HONRO_PROJECT.library.filter(a=>a.id.startsWith('act2-compact:stage'+sid+'-'));
         const active=(b.honroLandmarks||[]).filter(l=>l.asset&&assets.some(a=>a.id===l.asset.id));
         const ground=sid===12?await Promise.all([1,2].map(async n=>{
           const id='act2-compact:stage12-act2-traced-stage12-ground-'+n;
           const a=assets.find(z=>z.id===id),l=active.filter(z=>z.asset.id===id);
           if(!a||!l.length)throw Error('Stage12 target not active '+id);
           return {id,asset:await hash(a),vector:await hash(a.vector),placementCount:l.length,activeHashes:await Promise.all(l.map(z=>hash(z.asset)))};
         })):[];
         return{stage:stage.id,mapStage:b.honroStage,groupIds:assets.map(a=>a.id),activeAssetIds:active.map(l=>l.asset.id),ground,stageHash:await hash(stage)};
       }''',sid)
       for name,dx,dy in views:
        if name.startswith('bottom-') and w!=390:continue
        frame=page.evaluate('''q=>{
         const a=HonroApp,s=a.scene,b=a.engine.b;
         const st=HONRO_PROJECT.stages.find(t=>t.metadata?.stageId===q.sid);
         if(!st||b.honroStage!==q.sid)throw Error('Wrong loaded stage');
         const rect=s.canvas.getBoundingClientRect();
         const z=HonroBounds.zoomLimits(rect.width).min;
         const requested=q.name.startsWith('bottom-')?{x:q.dx?st.width:0,y:5000,scale:z}:{x:q.dx?q.dx*1e6:st.width/2,y:q.dy?q.dy*1e6:st.height/2,scale:z};
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
         return{state,requested,actual,adjusted,clamped,within,focus:f,viewport:range,css:{w:rect.width,h:rect.height},backing:[s.canvas.width,s.canvas.height],actorCount:b.units.length,projectStage:st.id};
        }''',{'sid':sid,'dx':dx,'dy':dy,'name':name})
        page.wait_for_function("""sid=>{const a=HonroApp;return sid!==12||HonroAct2SpatialArt.ready(a.engine.b)}""",arg=sid,timeout=20000)
        images=page.evaluate("""async sid=>{await document.fonts.ready;const imgs=[...new Set([...document.images,...window.__qaImages])].filter(i=>i.getAttribute('src'));await Promise.all(imgs.map(i=>i.decode()));const results=imgs.map(i=>({src:i.currentSrc||i.src,complete:i.complete,width:i.naturalWidth,height:i.naturalHeight}));if(results.some(x=>!x.complete||!x.width||!x.height))throw Error('Incomplete image');if(sid===12&&!results.some(x=>/honro_act2_far_data-clouded/.test(x.src)))throw Error('Stage12 far source was not tracked');return results;}""",sid)
        frame['images']=images
        def repaint():
         check=page.evaluate("""async sid=>{
           const a=HonroApp,s=a.scene,b=a.engine.b,st=HONRO_PROJECT.stages.find(t=>t.metadata?.stageId===sid);
           const before=s._honroClouds,own=Object.hasOwn(s,'_honroClouds'),sceneTime=s.time;
           let read=0,write=0;const receipt={x:0,v:0,get at(){read++;return Infinity},set at(value){write++}};
           // Local fixture only: original clouds() runs (textures + compositing), but
           // delta clamps to zero. No global time/API/asset/camera/paint override.
           s._honroClouds=receipt;
           try{s.time=2;s.render(a.engine,0,'',.6,false,0);}
           finally{s.time=sceneTime;if(own)s._honroClouds=before;else delete s._honroClouds;}
           if(read<1||write<1||receipt.x!==0||receipt.v!==0||s._honroClouds!==before)throw Error('Cloud phase was not consumed, or failed to restore');
           const raster=s.canvas.getContext('2d').getImageData(0,0,s.canvas.width,s.canvas.height).data;
           const digest=await crypto.subtle.digest('SHA-256',raster);
           return{state:JSON.stringify({terrain:b.terrain,units:b.units,design:st.design,initialState:st.initialState,objectives:st.objectives}),camera:{x:s.x,y:s.y,scale:s.scale},raw:'sha256:'+Array.from(new Uint8Array(digest),v=>v.toString(16).padStart(2,'0')).join(''),png:s.canvas.toDataURL('image/png').split(',',2)[1],cloud:{x:receipt.x,v:receipt.v,read,write,restored:true}};
         }""",sid)
         assert check['state']==frame['state'] and check['camera']==frame['actual'],check['camera']
         return check,canvas.screenshot(animations='disabled')
        file=f'act2-s{sid:02d}-{w}x{h}-{name}.png';check,img=repaint()
        repeat,other=repaint();(OUT/file).write_bytes(img);
        if other!=img:(OUT/(file+'.repeat.png')).write_bytes(other)
        for value,extra in [(check,''),(repeat,'.repeat')]:
         if not extra or value['raw']!=check['raw']:(OUT/(file+'.raw'+extra+'.png')).write_bytes(base64.b64decode(value['png']))
        frame.update(catalog=catalog,repeatSameEncoded=img==other,repeatRawHashSame=check['raw']==repeat['raw'],rawDigests=[check['raw'],repeat['raw']],cloudReceipts=[check['cloud'],repeat['cloud']])
        st=frame.pop('state');frame.update(stage=sid,view=name,width=w,height=h,name=file,rasterSha256=hashlib.sha256(img).hexdigest(),physicsSha256=hashlib.sha256(st.encode()).hexdigest())
        frames.append(frame)
       if errors or requests:issues.append({'stage':sid,'width':w,'scriptErrors':errors,'requestFailures':requests})
      except Exception as e:
       issues.append({'stage':sid,'width':w,'exception':str(e),'scriptErrors':errors,'requestFailures':requests})
      finally:
       persist();page.close()
    browser.close()
persist()
critical=[i for i in issues if i.get('exception') or i.get('scriptErrors') or i.get('requestFailures')]
assert not critical,critical
assert len(frames)==40,len(frames)
assert all(x['within'] and x['clamped'] for x in frames),[x['name'] for x in frames if not(x['within'] and x['clamped'])]
for sid in [12,13]:
 for width in (390,1440):
  assert len({x['physicsSha256'] for x in frames if x['stage']==sid and x['width']==width})==1,(sid,width)
print('40 actual browser viewport captures plus stable physics through diagnostics')
