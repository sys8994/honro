import hashlib,json,os
from pathlib import Path
from playwright.sync_api import sync_playwright
out=Path(os.environ['OUT']); out.mkdir(parents=True,exist_ok=True)
snapshot=r"""() => {
 const a=HonroApp,e=a.engine,b=e.b,S=HonroAct23V4Stage18;
 const st=HONRO_PROJECT.stages.find(t=>t.metadata?.stageId===18);
 if(b.honroStage!==18||b.width!==8200||b.height!==7000||b.honroCampaignMapRevision!==618||b.honroReviewedSceneRevision!==518||b.honroAct2CompactRevision!==1||st.width!==8200)throw Error('Wrong Stage18 variant '+JSON.stringify([b.width,b.height,b.honroCampaignMapRevision,b.honroReviewedSceneRevision,b.honroAct2CompactRevision,st.width]));
 const units=b.units.filter(u=>u.side===1&&!u.honroObjectiveTarget);
 if(units.length!==10||st.encounters.length!==22)throw Error('Wrong live roster or group count');
 const expected={ 'sb-b-left':4,'sb-b-screen':5,'sb-b-spirit-high':6,'sb-c-bat-front':8,'sb-d-lamp':11,'sb-e-front':13,'sb-f-tool-west':16,'sb-g-front':17,'sb-g-bat-high':18,'act2-keeper':22};
 if(units.some(u=>u.group!==expected[u.id]))throw Error('Live group mismatch '+JSON.stringify(units.map(u=>[u.id,u.group])));
 const missing=st.encounters.flatMap(g=>g.unitIds).filter(id=>!st.units.some(u=>u.id===id)).length;
 const empty=st.encounters.filter(g=>!g.unitIds.length).length;
 const pos=u=>Object.fromEntries(Object.entries(u).filter(([k])=>!/(At|Time)Ms$/.test(k)));
 // Observe source-independent battlefield state. Groups/metadata deliberately
 // remain live in the proof, avoiding a blind whole-map serialization scrub.
 const projection={units:b.units.map(pos),terrain:b.terrain,world:b.honroWorldTerrain,
  bBounds:[b.honroPlayBounds,b.honroTerrainBounds],markers:b.honroMarkers,events:b.honroEvents,
  goals:HonroAct2.steps(b),act2:b.honroState.act2,reviewed:b.honroState.honroReviewed18,
  bell:S.memory(b),activation:b.honroBellActivation,density:b.honroEncounterDensityActivation,
  densityState:b.honroState.encounterDensity,eligible:[...(e.honroDensityEligible||[])],
  turn:{phase:b.phase,side:b.side,round:b.round,actor:b.active,canAct:e.canAct(),canInput:a.canInput()},
  items:b.items,projectiles:b.projectiles,waterPolicies:Object.fromEntries(Object.entries(b).filter(([key])=>/water|material/i.test(key)))};
 return {missing,empty,helmet:[b.width,b.height,b.honroCampaignMapRevision,b.honroReviewedSceneRevision,b.honroAct2CompactRevision],unitGroups:units.map(u=>[u.id,u.group,u.honroCluster??null,u.awake]),projection};
}"""
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True)
 page=browser.new_page(viewport={'width':1440,'height':900},device_scale_factor=1)
 failures=[];page.on('pageerror',lambda e:failures.append(str(e)))
 page.add_init_script("window.__qaImages=[];let z=3910;Math.random=()=>((z=(Math.imul(z,1664525)+1013904223)>>>0)/4294967296);const d=Object.getOwnPropertyDescriptor(HTMLImageElement.prototype,'src');Object.defineProperty(HTMLImageElement.prototype,'src',{...d,set(v){window.__qaImages.push(this);d.set.call(this,v)}});")
 page.goto('http://127.0.0.1:'+os.environ['PORT']+'/HONRO.html',wait_until='domcontentloaded',timeout=180000)
 page.wait_for_function("document.documentElement.dataset.honroReady==='true' && window.HonroCampaignLoader",timeout=180000)
 page.evaluate("""async()=>{const a=HonroApp;window.__qaNormalFrame=a.frame.bind(a);a.frame=()=>{};a.profile.settings.music=false;a.profile.settings.sound=false;a.profile.settings.debugMode=false;
  await HonroCampaignLoader.ensureStage(18);for(let n=1;n<18;n++)a.profile.cleared[n]=true;
  for(const h of Object.values(a.profile.heroes))h.xp=HonroProgression.xpAt(HonroProgression.plan(18).entryLevel);
  a.launch(18);if(a.engine?.b.honroStage!==18)throw Error('Wrong stage');
  for(let n=0;n<40&&a.dialogue;n++)HonroStory.finish(a);
  if(a.dialogue)throw Error('Initial dialogue present');a.close();HonroStoryFraming.clear(a.scene);
 }""")
 canvas=page.locator('#battlecanvas')
 canvas.wait_for(state='visible')
 page.wait_for_timeout(1500)
 page.evaluate("()=>{HonroStory.tick(HonroApp,performance.now());HonroStory.draw(HonroApp);}")
 results={}
 def save(name,steps=0):
  camera=page.evaluate("""()=>{const a=HonroApp,s=a.scene,b=a.engine.b,r=s.canvas.getBoundingClientRect();
   HonroStoryFraming.clear(s);Object.assign(s,{manual:true,time:2,storyTween:null,storyFrozen:false,goalFocus:null,cinematic:null,focusUntil:0,speakerUntil:0,x:b.width/2,y:b.height/2,scale:HonroBounds.zoomLimits(r.width).min});
   HonroBounds.constrain(s,b);s.render(a.engine,0,'',.6,false,0);return [s.x,s.y,s.scale,r.width,r.height];
  }""")
  page.wait_for_function("window.__qaImages.every(i=>!i.src||i.complete)",timeout=120000)
  page.evaluate("""()=>{const a=HonroApp,failed=window.__qaImages.filter(i=>i.src&&i.complete&&!i.naturalWidth);if(failed.length)throw Error('Image decode failed '+failed.map(i=>i.src).join(' '));a.scene.render(a.engine,0,'',.6,false,0);}""")
  state=page.evaluate(snapshot)
  im=canvas.screenshot(path=str(out/(name+'.png')),animations='disabled')
  projection=state.pop('projection')
  canonical=json.dumps(projection,sort_keys=True,ensure_ascii=False,separators=(',',':'))
  state['stateSha256']=hashlib.sha256(canonical.encode()).hexdigest()
  state['perFieldSha256']={k:hashlib.sha256(json.dumps(v,sort_keys=True,ensure_ascii=False,separators=(',',':')).encode()).hexdigest() for k,v in projection.items()}
  state.update(camera=camera,rasterSha256=hashlib.sha256(im).hexdigest(),fixedSteps=steps,bellStatus=projection['bell'].get('bell',{}).get('status'),threatStarted=projection['bell'].get('threat',{}).get('started'),turn=projection['turn'])
  results[name]=state
  (out/'proof.json').write_text(json.dumps(results,indent=2))
  return state
 first=save('initial');assert first['threatStarted'] is False,first
 # Advance actual released production story/Engine on the normally launched
 # compact map with fixed dt. No actor placement, HP, quest or trigger writes.
 # The first later event is the resident reaching the hypnosis warning point.
 step=page.evaluate("""()=>{const a=HonroApp,e=a.engine,b=e.b,S=HonroAct23V4Stage18,t=performance.now(),raf=window.requestAnimationFrame;
   window.requestAnimationFrame=()=>0;
   a.prev=t;
   try{for(let n=1;n<=900;n++){
    if(a.dialogue){for(let j=0;j<40&&a.dialogue;j++)HonroStory.finish(a);}
    window.__qaNormalFrame(t+n*(1000/60));
    if(a.lastError)throw Error(a.lastError);
    const m=S.memory(b);if(m.threat.started&&m.bell.status==='warning')return n;
   }}finally{window.requestAnimationFrame=raf;}
   throw Error('Natural warning not reached '+JSON.stringify({bell:S.memory(b).bell.status,threat:S.memory(b).threat,canAct:e.canAct(),phase:b.phase,actor:b.active,npc:[e.unit('18.survivor')?.x,e.unit('18.survivor')?.y],point:b.honroV4Stage18?.threatPoint}));
 }""")
 late=save('dormant-to-bell-warning',step)
 assert late['bellStatus']=='warning' and late['threatStarted'] is True,late
 assert not failures,failures
 browser.close()
