import hashlib,json,os,sys
from pathlib import Path
from playwright.sync_api import sync_playwright
out=Path(os.environ['OUT']);out.mkdir(parents=True,exist_ok=True)
def digest(v):
 return hashlib.sha256(json.dumps(v,sort_keys=True,ensure_ascii=False,separators=(',',':')).encode()).hexdigest()
snapshot=r"""sid=>{
 const a=HonroApp,e=a.engine,b=e.b;
 const st=HONRO_PROJECT.stages.find(t=>t.metadata?.stageId===sid),mode=sid===13?[5200,4600,613,513,1]:[8200,7000,618,518,1];
 const revision=[b.width,b.height,b.honroCampaignMapRevision,b.honroReviewedSceneRevision,b.honroAct2CompactRevision];
 if(b.honroStage!==sid||JSON.stringify(revision)!==JSON.stringify(mode)||st.width!==mode[0])throw Error('Wrong runtime variant '+JSON.stringify(revision));
 const actors=b.units.map(u=>{const c=e.contactSurface(u.x,u.y-8,u.y+10);return {id:u.id,x:u.x,y:u.y,sill:c?.t.id||null,group:u.group??null,cluster:u.honroCluster??null,awake:!!u.awake,side:u.side}});
 const projection={actors,units:b.units.map(u=>Object.fromEntries(Object.entries(u).filter(([k])=>!/(At|Time)Ms$/.test(k)))),
  terrain:b.terrain,world:b.honroWorldTerrain,elements:b.honroElements,environment:b.honroEnvironment,
  bounds:[b.honroPlayBounds,b.honroTerrainBounds],markers:b.honroMarkers,events:b.honroEvents,
  goals:HonroAct2.steps(b),act2:b.honroState.act2,density:b.honroState.encounterDensity,
  activation:b.honroBellActivation,eligible:[...(e.honroDensityEligible||[])],items:b.items,
  turn:{phase:b.phase,side:b.side,round:b.round,actor:b.active,canAct:e.canAct(),canInput:a.canInput()}};
 const root={sid,revision,actors,projection};
 if(sid===13){
  const id='stage12:quarry-carrier-rubble',asset=HONRO_PROJECT.library.find(x=>x.id===id);
  const map=st.elements.filter(x=>x.assetId===id);
  const declared=[['stage13-finish-rubble-mason',1740,1560,.22],['stage13-finish-rubble-threshold',2940,2038,.24]];
  if(!asset||asset.collision.length||JSON.stringify(map.map(x=>[x.id,x.x,x.y,x.scale]))!==JSON.stringify(declared))throw Error('Expected two preserved compact visual rows');
  const world=(b.honroElements||[]).filter(x=>map.some(m=>m.id===x.id));
  root.targetChange={range:asset.reference.scaleRange,embeddedRanges:world.map(x=>x.asset?.reference?.scaleRange)};
  function omitExactApprovedField(e){
   if(e.asset?.id!==id)return e;
   const q=structuredClone(e);delete q.asset.reference.scaleRange;return q;
  }
  projection.elements=projection.elements.map(omitExactApprovedField);
  projection.rubble={map,world:world.map(omitExactApprovedField),
   backgroundRange:asset.reference.backgroundRange,bounds:asset.bounds,collision:asset.collision,vector:asset.vector};
  if(projection.rubble.world.length!==2)throw Error('Both ordinary authored runtime props must be loaded');
 }else{
  const rows=st.encounters;
  const enemies=b.units.filter(u=>u.side===1&&!u.honroObjectiveTarget);
  const expected={'sb-b-left':4,'sb-b-screen':5,'sb-b-spirit-high':6,'sb-c-bat-front':8,'sb-d-lamp':11,'sb-e-front':13,'sb-f-tool-west':16,'sb-g-front':17,'sb-g-bat-high':18,'act2-keeper':22};
  if(rows.length!==22||enemies.length!==10||enemies.some(u=>u.group!==expected[u.id]))throw Error('Unexpected Stage18 actor binding');
  root.targetChange={missing:rows.flatMap(q=>q.unitIds).filter(id=>!st.units.some(u=>u.id===id)).length,empty:rows.filter(q=>!q.unitIds.length).length};
  projection.bell=HonroAct23V4Stage18.memory(b);
 }
 return root;
}"""
def run():
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True)
  proof={}
  for sid in (13,18):
   page=browser.new_page(viewport={'width':1440,'height':900},device_scale_factor=1)
   failures=[];page.on('pageerror',lambda e:failures.append(str(e)))
   page.add_init_script("window.__qaImages=[];let z=3910;Math.random=()=>((z=(Math.imul(z,1664525)+1013904223)>>>0)/4294967296);const d=Object.getOwnPropertyDescriptor(HTMLImageElement.prototype,'src');Object.defineProperty(HTMLImageElement.prototype,'src',{...d,set(v){window.__qaImages.push(this);d.set.call(this,v)}});")
   page.goto(f"http://127.0.0.1:{os.environ['PORT']}/HONRO.html",wait_until='domcontentloaded',timeout=180000)
   page.wait_for_function("document.documentElement.dataset.honroReady==='true' && window.HonroCampaignLoader",timeout=180000)
   page.evaluate("""async sid=>{const a=HonroApp;a.frame=()=>{};a.profile.settings.music=false;a.profile.settings.sound=false;a.profile.settings.debugMode=false;
    await HonroCampaignLoader.ensureStage(sid);for(let n=1;n<sid;n++)a.profile.cleared[n]=true;
    for(const h of Object.values(a.profile.heroes))h.xp=HonroProgression.xpAt(HonroProgression.plan(sid).entryLevel);
    a.launch(sid);if(a.engine?.b.honroStage!==sid)throw Error('Wrong stage runtime');
    for(let n=0;n<40&&a.dialogue;n++)HonroStory.finish(a);
    if(a.dialogue)throw Error('Initial dialogue present');a.close();HonroStoryFraming.clear(a.scene);
   }""",sid)
   canvas=page.locator('#battlecanvas')
   canvas.wait_for(state='visible')
   page.wait_for_timeout(1500)
   page.evaluate("()=>{HonroStory.tick(HonroApp,performance.now());HonroStory.draw(HonroApp);}")
   cameras=[('initial',None),('mason',[1740,1560]),('threshold',[2940,2038])] if sid==13 else [('initial',None),('refresh-initial-activation',None)]
   for label,point in cameras:
    if label=='refresh-initial-activation':
     page.evaluate("()=>HonroApp.engine.refreshActivation()")
    camera=page.evaluate("""point=>{const a=HonroApp,s=a.scene,b=a.engine.b,r=s.canvas.getBoundingClientRect(),z=HonroBounds.zoomLimits(r.width);
     HonroStoryFraming.clear(s);Object.assign(s,{manual:true,time:2,storyTween:null,storyFrozen:false,goalFocus:null,cinematic:null,focusUntil:0,speakerUntil:0,x:point?.[0]??b.width/2,y:point?.[1]??b.height/2,scale:point?Math.min(z.max,3*z.min):z.min});
     HonroBounds.constrain(s,b);s.render(a.engine,0,'',.6,false,0);return [s.x,s.y,s.scale,r.width,r.height];
    }""",point)
    page.wait_for_function("window.__qaImages.every(i=>!i.src||i.complete)",timeout=120000)
    page.evaluate("""()=>{const a=HonroApp,failed=window.__qaImages.filter(i=>i.src&&i.complete&&!i.naturalWidth);if(failed.length)throw Error('Image decode failed '+failed.map(i=>i.src).join(' '));a.scene.render(a.engine,0,'',.6,false,0);}""")
    state=page.evaluate(snapshot,sid)
    projection=state.pop('projection')
    state.update(stateSHA256=digest(projection),perFieldSHA256={k:digest(v) for k,v in projection.items()},camera=camera)
    name=f'{sid}-{label}'; state['pngSHA256']=hashlib.sha256(canvas.screenshot(path=str(out/(name+'.png')),animations='disabled')).hexdigest()
    proof[name]=state
    (out/'proof.json').write_text(json.dumps(proof,indent=2))
   assert not failures,failures
   page.close()
  browser.close()
if __name__=='__main__':run()
