"""One document, natural production App.frame, reused normal Stage11 input policy.
No mid-run reload, remount, fixture mutation, direct tick, or physics budget edit.
"""
import gzip,hashlib,json,os,sys,time,subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT/'tests'))
from browser_support import launch,serve_game
from playwright.sync_api import sync_playwright
OUT=ROOT/'_local/reports/battle-runtime/continuous';OUT.mkdir(parents=True,exist_ok=True)
source=(ROOT/'tests/stage11-ravine-fullplay.mjs').read_text()
core=source[source.index('const hpFraction='):source.index("if(!['won','lost'].includes(b.phase)&&!stopReason)")]
lines=[]
for line in core.splitlines():
    if line.startswith(' if(process.env.HONRO_FULLPLAY_POLICY)') or line.startswith(' if(manualPolicy.pauseAtRound'):continue
    if line.startswith(' if(lastRound!==b.round)'):
        line=""" if(lastRound!==b.round){lastRound=b.round;const row={round:b.round,goal:g.HonroAct2.current(b)?.id,heroes:e.heroesAlive().map(u=>({id:u.id,hp:u.hp,x:u.x,y:u.y})),foes:e.alive(1).map(u=>({id:u.id,hp:u.hp,x:u.x,y:u.y}))};rounds.push(row);console.log('CONTINUOUS ROUND',b.round,row.goal);if(b.round>=targetRound){stopReason='target round reached';break;}const sig=JSON.stringify({goal:row.goal,foes:row.foes.map(u=>[u.id,Math.round(u.hp)]),heroes:row.heroes.map(u=>[u.id,Math.round(u.x/30),Math.round(u.y/30)])});stalledRounds=sig===lastSignature?stalledRounds+1:0;lastSignature=sig;if(stalledRounds>=3){stopReason='controller stalled for 3 unchanged rounds';break;}}"""
    lines.append(line)
core='\n'.join(lines).replace('function advance(', 'async function advance(').replace('if(goal)advance(u,goal,enemy);','if(goal)await advance(u,goal,enemy);')
core=core.replace('e.canAct()','app.canInput()').replace('tick();','await tick();').replace('e.move(', 'requestMove(')
core=core.replace('const actionLimit=Number(process.env.HONRO_FULLPLAY_ACTION_LIMIT||1600),started=performance.now();','const actionLimit=200,started=performance.now();')
core=core.replace('frames<1800000','frames<60000').replace('frames>=1800000','frames>=60000')
assert 'process.' not in core and 'writeFile' not in core and 'e.tick' not in core
prefix="""async ({targetRound,maxSeconds})=>{
const g=globalThis,C=HONRO_CORE,app=HonroApp,e=app.engine,b=e.b,st=app.stage,profile=app.profile,a=g.HonroAct2.memory(b),canonical=g.HONRO_PROJECT.stages.find(s=>s.metadata?.stageId===11),resume=null;
const m=battleContinuous,actions=[],rounds=[],navEvents=[],births=[],known=new Set(b.units.map(u=>u.id));let frames=0,lastRound=0,stalledRounds=0,lastSignature='',stopReason=null,queuedMove=0,lastYield=performance.now();
const assert=(v,message)=>{if(!v)throw Error(message||'policy assertion');};
const trackBirths=()=>{for(const u of b.units)if(!known.has(u.id)){known.add(u.id);births.push({round:b.round,id:u.id,source:u.honroSpawnSource,x:u.x,y:u.y});}};
const DT=C.STEP,requestMove=x=>{queuedMove=x;return true;};
const tick=async()=>{const at=performance.now(),ms=at-lastYield;if(ms>8){m.policy.push({at:lastYield-m.started,ms,round:b.round});m.policyPending+=ms;}app.stick.x=queuedMove;queuedMove=0;
await new Promise(requestAnimationFrame);app.stick.x=0;frames=m.frames.length;lastYield=performance.now();
if(app.dialogue)document.querySelector('[data-action="dialogue-skip"]')?.click();
if(m.error)throw Error(m.error);if((performance.now()-m.started)/1000>maxSeconds)throw Error('continuous wall-clock budget reached');if(m.engineChanges||m.sceneChanges)throw Error('Unexpected engine/scene replacement during continuous run');};
const fire=e.fire;e.fire=function(id,angle,power,...rest){const u=this.active,ok=fire.call(this,id,angle,power,...rest);if(ok&&u?.side===0&&!u.summoned){app.selected=id;app.selectedByUnit[u.id]=id;app.power=power;app.scene.manual=false;}return ok;};
"""
suffix="""
app.stick.x=0;return {round:b.round,phase:b.phase,stopReason:stopReason||'policy action limit or terminal battle',actions,rounds,navEvents,births,frames,goal:g.HonroAct2.current(b)?.id};
}"""
policy=prefix+core+suffix
(OUT/'adapted-policy.js').write_text(policy)
subprocess.run(['node','--check',str(OUT/'adapted-policy.js')],check=True)
record=json.loads(gzip.decompress((ROOT/'game/docs/battle-runtime-performance-20261022/evidence/saves/round1.json.gz').read_bytes()))
profile=record['profile'];profile.update(game='honro',schema=4,lastStage=11,honroBattle=record['b']);profile['settings'].update(music=False,sound=False)
meta={'sourceCommit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'originalPolicySha256':hashlib.sha256(source.encode()).hexdigest(),'adaptedPolicySha256':hashlib.sha256(policy.encode()).hexdigest(),'manifestSha256':hashlib.sha256((ROOT/'web/manifest.json').read_bytes()).hexdigest(),'seed':899411,'music':False,'sound':False,'viewport':[1280,800],'targetRound':int(os.environ.get('TARGET_ROUND','16'))}
with serve_game() as url,sync_playwright() as p:
    browser=launch(p);ctx=browser.new_context(viewport={'width':1280,'height':800},device_scale_factor=1);page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    page.add_init_script('localStorage.setItem("honro-first-act-profile-1",'+json.dumps(json.dumps(profile))+');let s=899411;Math.random=()=>((s=Math.imul(s,1664525)+1013904223>>>0)/4294967296);')
    page.goto(url+'/HONRO.html');page.wait_for_function('document.documentElement.dataset.honroReady')
    page.evaluate((ROOT/'tools/testing/battle-runtime-continuous-monitor.js').read_text())
    page.locator('.title-actions button.primary').click();page.wait_for_function('HonroApp.engine?.b.honroStage===11')
    page.wait_for_function('HonroAuthoredFarArt.ready(11)')
    assert page.evaluate('HonroApp.engine.b.round')==1
    page.evaluate('''({source,config})=>{window.battlePolicyPromise=(0,eval)('('+source+')')(config).then(r=>{battleContinuous.result=r;battleContinuous.done=true;},error=>{battlePolicyError=String(error.stack||error);battleContinuous.error=battlePolicyError;battleContinuous.done=true;HonroApp.stick.x=0;});return true;}''',{'source':policy,'config':{'targetRound':meta['targetRound'],'maxSeconds':int(os.environ.get('MAX_SECONDS','900'))}})
    while True:
        status=page.evaluate('battleContinuous.status()');(OUT/'progress.json').write_text(json.dumps(status,indent=2));print(json.dumps({k:status.get(k)for k in ['frames','round','phase','goal','done','error']}),flush=True)
        if status['done']:break
        page.wait_for_timeout(5000)
    page.screenshot(path=str(OUT/'live-final.jpg'),type='jpeg',quality=90)
    page.evaluate('HonroApp.stick.x=0;HonroApp.pause();battleContinuous.active=false;battleContinuous.observer.disconnect();HonroApp.frame=()=>{};')
    result=page.evaluate('battleContinuous.report()');result.update(meta=meta,errors=errors,browser=browser.version)
    (OUT/'continuous.json').write_text(json.dumps(result,indent=2))
    # Capture an exact final battle into a new isolated document only AFTER the
    # uninterrupted run has ended; the live document/Scene remain untouched.
    saved=page.evaluate('''()=>{const a=HonroApp;a.profile.honroBattle=JSON.parse(JSON.stringify(a.engine.b));a.persist();return JSON.parse(JSON.stringify(a.profile));}''')
    (OUT/'final-profile.json').write_text(json.dumps(saved))
    view=page.evaluate('({x:HonroApp.engine.active.x,y:HonroApp.engine.active.y-140,scale:.68,time:HonroApp.scene.time,selected:HonroApp.selected})')
    state_js='JSON.stringify({round:HonroApp.engine.b.round,rng:HonroApp.engine.b.rng,phase:HonroApp.engine.b.phase,units:HonroApp.engine.b.units,projectiles:HonroApp.engine.b.projectiles,terrain:HonroApp.engine.b.terrain,state:HonroApp.engine.b.honroState,heroes:HonroApp.profile.heroes,loadouts:HonroApp.profile.loadouts,cleared:HonroApp.profile.cleared,items:HonroApp.engine.b.items})'
    signature=page.evaluate(state_js)
    sampler=(ROOT/'tools/testing/battle-runtime-continuous-compare.js').read_text()
    live=page.evaluate(sampler,view)
    (OUT/'live-comparison.json').write_text(json.dumps({'view':view,'live':live},indent=2))
    fresh_ctx=browser.new_context(viewport={'width':1280,'height':800},device_scale_factor=1);fresh=fresh_ctx.new_page()
    fresh.add_init_script('localStorage.setItem("honro-first-act-profile-1",'+json.dumps(json.dumps(saved))+');')
    fresh.goto(url+'/HONRO.html');fresh.wait_for_function('document.documentElement.dataset.honroReady')
    fresh.evaluate('''()=>{window.compareNativeFrame=HonroApp.frame.bind(HonroApp);HonroApp.frame=()=>{};const mount=HonroApp.mount;HonroApp.mount=function(...args){const out=mount.apply(this,args);this.pause();return out;};}''')
    fresh.locator('.title-actions button.primary').click();fresh.wait_for_function('HonroApp.engine?.b.honroStage===11');fresh.wait_for_function('HonroAuthoredFarArt.ready(11)')
    equal=json.loads(signature)==json.loads(fresh.evaluate(state_js))
    new=fresh.evaluate(sampler,view)
    (OUT/'live-vs-fresh.json').write_text(json.dumps({'stateEqualBeforeComparison':equal,'view':view,'live':live,'fresh':new,'scope':'Post-run actual paused App.frame, same saved battle and controlled view; live scene/caches retained; other document loop stopped during sampling. No GC forced.'},indent=2))
    print('CONTINUOUS FINISHED',json.dumps({'result':result.get('result'),'error':result['error'],'stateEqual':equal}),flush=True)
    fresh_ctx.close()
    browser.close()
