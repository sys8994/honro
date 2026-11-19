import json,os,hashlib,statistics
from pathlib import Path
from playwright.sync_api import sync_playwright
out=Path(os.environ['OUT']);rows=[]
setup='''async sid=>{await HONRO_APP_READY;const a=HonroApp;a.frame=()=>{};a.profile.settings.music=false;a.profile.settings.sound=false;await HonroCampaignLoader.ensureStage(sid);for(let n=1;n<sid;n++)a.profile.cleared[n]=true;for(const h of Object.values(a.profile.heroes))h.xp=HonroProgression.xpAt(HonroProgression.plan(sid).entryLevel);a.launch(sid);if(a.engine?.b.honroStage!==sid)throw Error('Wrong stage');for(let n=0;a.dialogue&&n<12;n++)HonroStory.finish(a);if(a.dialogue)throw Error('intro active');a.turnNotice=null;a.close();HonroStory.draw(a);HonroStoryFraming.clear(a.scene);const s=a.scene;Object.assign(s,{manual:true,time:2,storyTween:null,storyFrozen:false,goalFocus:null,cinematic:null,focusUntil:0,speakerUntil:0});globalThis.qaState=()=>JSON.stringify({terrain:a.engine.b.terrain,units:a.engine.b.units,design:HONRO_PROJECT.stages.find(t=>t.metadata?.stageId===sid).design,objectives:a.engine.b.honroObjectives});return qaState();}'''
measure='''q=>{const a=HonroApp,s=a.scene;Object.assign(s,{x:q.x,y:q.y,scale:q.z});HonroBounds.constrain(s,a.engine.b);const samples=[];for(let i=0;i<q.n;i++){const pre=s.renderCacheStats(),t=performance.now();s.render(a.engine,0,'',.6,false,0);const drawMs=performance.now()-t;const t2=performance.now();s.ctx.getImageData(0,0,1,1);const flushMs=performance.now()-t2;const post=s.renderCacheStats();samples.push({drawMs,flushMs,tileBuilds:(post.domainTileBuilds||0)-(pre.domainTileBuilds||0),screenBuilds:(post.screenBuilds||0)-(pre.screenBuilds||0),worldBuildMs:post.worldBuildMs-pre.worldBuildMs});}return{samples,camera:{x:s.x,y:s.y,z:s.scale},canvas:[s.canvas.width,s.canvas.height],cache:s.renderCacheStats(),state:qaState()};}'''
def save(): (out/'performance.json').write_text(json.dumps({'scope':'Actual built HTTP launch, fixed diagnostic stock-constrained cameras, dt=0 Scene.render CPU submission + separately measured pixel flush; NOT RAF/FPS or combat. Initial render separated. Four alternating AB/BA repetitions. No cache clearing.','rows':rows},indent=2))
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True)
 try:
  for rep in range(4):
   for w,h in [(1440,900),(390,1000)]:
    for sid in [46,42]:
     for mode,port in ([('original',8884),('candidate',8885)] if rep%2==0 else [('candidate',8885),('original',8884)]):
      context=browser.new_context(viewport={'width':w,'height':h},device_scale_factor=1);page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
      page.goto(f'http://127.0.0.1:{port}/HONRO.html',wait_until='domcontentloaded',timeout=180000);page.wait_for_function("window.HonroApp && document.documentElement.dataset.honroReady==='true'",timeout=180000)
      initial=page.evaluate(setup,sid);digest=hashlib.sha256(initial.encode()).hexdigest()
      points=([(100,3200),(4416,1800),(100,5000),(4416,6500),(100,0),(4416,4000),(100,6500),(4416,0)] if sid==46 else [(800,1200),(2400,1200),(4000,1200),(5600,1200),(100,500),(3000,500),(5000,500),(6500,1200)])
      row={'rep':rep,'order':'AB' if rep%2==0 else 'BA','viewport':[w,h],'stage':sid,'mode':mode,'stateSha256':digest,'points':[]};rows.append(row)
      for k,(x,y) in enumerate(points):
       result=page.evaluate(measure,{'x':x,'y':y,'z':.55,'n':33});state=result.pop('state');assert state==initial,'Gameplay state changed';result.update(index=k,label='initial-first-location' if k==0 else 'pan',requested=[x,y,.55]);row['points'].append(result);save()
      row['closureStateSha256']=hashlib.sha256(page.evaluate('qaState()').encode()).hexdigest();assert row['closureStateSha256']==digest;assert not errors,errors
      if rep==0:page.locator('#battlecanvas').screenshot(path=str(out/f'stage{sid}-{w}-{mode}.png'))
      context.close();save()
 finally:save();browser.close()
# Compare per-stage state hashes only within same repetition and viewport; no campaign progression claims.
for rep in range(4):
 for wh in [(1440,900),(390,1000)]:
  for sid in [46,42]:
   pair=[r for r in rows if r['rep']==rep and r['viewport']==list(wh) and r['stage']==sid];assert len(pair)==2 and pair[0]['stateSha256']==pair[1]['stateSha256']
(out/'closure.json').write_text(json.dumps({'pairs':16,'allBeforeAfterGameplayHashesEqual':True,'allLocalClosureUnchanged':True},indent=2))
