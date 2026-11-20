import hashlib,json,os,re
from pathlib import Path
from playwright.sync_api import sync_playwright

OUT=Path(os.environ['OUT']); OUT.mkdir(parents=True,exist_ok=True)
frames=[];issues=[]
stages=[29,30]
variant=os.environ['VARIANT'];port=os.environ['PORT']
assert variant in ['stock','candidate']
views=[('overview',0,0),('south',0,1),('southwest',-1,1),('southeast',1,1),('water-close',0,0)]
def persist():
    (OUT/'proof.json').write_text(json.dumps({
      'scope':'Pinned stock built master, real campaign entry and renderer on two automatic CSS viewports. Isolated registered scenic-channel asset A/B. Min-zoom centre/cardinal/corner captures; actual clamp verified. Official first-turn banner is expired and registered first-view images decoded before re-render. No normal play or art acceptance claimed.',
      'frames':frames,'problems':issues},indent=2))
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True)
    for sid in stages:
     for w,h in [(1440,900),(390,844)]:
      page=browser.new_page(viewport={'width':w,'height':h},device_scale_factor=1)
      errors=[]; requests=[]
      page.add_init_script("window.__qaImages=[];let z=3910;Math.random=()=>((z=(Math.imul(z,1664525)+1013904223)>>>0)/4294967296);const d=Object.getOwnPropertyDescriptor(HTMLImageElement.prototype,'src');Object.defineProperty(HTMLImageElement.prototype,'src',{...d,set(v){window.__qaImages.push(this);d.set.call(this,v)}});")
      page.on('pageerror',lambda e:errors.append(str(e)))
      page.on('requestfailed',lambda req: requests.append([req.url,req.failure]))
      try:
       page.goto(f'http://127.0.0.1:{port}/HONRO.html',wait_until='domcontentloaded',timeout=180000)
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
       for name,dx,dy in views:
        if sid==29 and name in ('water-close','southwest'):continue
        frame=page.evaluate('''q=>{
         const a=HonroApp,s=a.scene,b=a.engine.b;
         const st=HONRO_PROJECT.stages.find(t=>t.metadata?.stageId===q.sid);
         if(!st||b.honroStage!==q.sid)throw Error('Wrong loaded stage');
         const rect=s.canvas.getBoundingClientRect();
         const zoom=HonroBounds.zoomLimits(rect.width),z=q.name==='water-close'?Math.min(zoom.max,zoom.min*3):zoom.min;
         const requested={x:q.dx?q.dx*1e6:st.width/2,y:q.dy?q.dy*1e6:st.height/2,scale:z};
         if(q.name==='water-close')Object.assign(requested,{x:6835,y:6590});
         HonroStoryFraming.clear(s);
         Object.assign(s,{manual:true,time:2,storyTween:null,storyFrozen:false,goalFocus:null,cinematic:null,focusUntil:0,speakerUntil:0,...requested});
         HonroBounds.constrain(s,b);
         const adjusted={x:s.x,y:s.y,scale:s.scale};const f=HonroBounds.focus(b);
         const l=b.honroLandmarks.find(l=>l.id==='sf-art-distant-channel');
         if(q.sid===30&&(!l||l.asset.id!=='stage30:ferry-distant-channel'||l.asset.vector.viewBox[3]!==q.h||l.asset.collision.length))throw Error('Wrong loaded Stage30 channel asset');
         if(q.sid===30){const paths=l.asset.vector.root.children.filter(n=>n.tag==='path');if(paths.length!==3||paths.some(n=>(n.opacity??1)!==q.alpha))throw Error('Scenic path visibility mismatch');}
         const signature=()=>JSON.stringify({terrain:b.terrain,worldTerrain:b.honroWorldTerrain,units:b.units,design:st.design,initialState:st.initialState,objectives:st.objectives,materials:st.materials,surfaceZones:b.honroSurfaceZones,waterPolicies:Object.fromEntries(Object.entries(b).filter(([key])=>/water|material/i.test(key))),focus:f,water:(b.honroSurfaceZones||[]).filter(z=>z.id==='sf-main-river')});
         const state=signature();s.render(a.engine,0,'',.6,false,0);s.render(a.engine,0,'',.6,false,0);
         if(signature()!==state)throw Error('Capture mutated gameplay state');
         const actual={x:s.x,y:s.y,scale:s.scale};
         const range=HonroBounds.viewport(s,rect.width,rect.height);
         const clamped=['x','y','scale'].every(k=>Math.abs(actual[k]-adjusted[k])<1e-6);
         const within=actual.x>=f.left-1e-6&&actual.x<=f.right+1e-6&&actual.y>=f.top-1e-6&&actual.y<=f.bottom+1e-6;
         return{state,requested,actual,adjusted,clamped,within,focus:f,viewport:range,css:{w:rect.width,h:rect.height},backing:[s.canvas.width,s.canvas.height],actorCount:b.units.length,projectStage:st.id,assetId:l?.asset?.id,assetBounds:l?.asset?.bounds,assetPlaced:l?{x:l.x,y:l.y,layer:l.layer}:null};
        }''',{'sid':sid,'dx':dx,'dy':dy,'name':name,'h':2300,'alpha':1 if variant=='stock' else 0})
        if name=='overview':
         page.wait_for_function("window.__qaImages.every(i=>!i.src||i.complete)",timeout=120000)
         page.evaluate("()=>{const a=HonroApp;const unknown=window.__qaImages.filter(i=>i.src&&i.complete&&!i.naturalWidth).map(i=>i.src);if(unknown.length)throw Error('Visible image not decoded: '+unknown.join(', '));a.scene.render(a.engine,0,'',.6,false,0);}")
        file=f'{variant}-s{sid:02d}-{w}x{h}-{name}.png';img=canvas.screenshot(path=str(OUT/file),animations='disabled')
        st=frame.pop('state');frame.update(stage=sid,view=name,width=w,height=h,name=file,rasterSha256=hashlib.sha256(img).hexdigest(),physicsSha256=hashlib.sha256(st.encode()).hexdigest())
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
assert len(frames)==16,len(frames)
assert all(x['within'] and x['clamped'] for x in frames),[x['name'] for x in frames if not(x['within'] and x['clamped'])]
for sid in stages:
 for width in (1440,390):
  assert len({x['physicsSha256'] for x in frames if x['stage']==sid and x['width']==width})==1,(sid,width)
print(f'{len(frames)} actual browser viewport captures plus stable physics through diagnostics')
