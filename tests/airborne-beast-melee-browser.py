"""Production browser/Scene combat evidence. Prepared ordinary-resource situations;
not a full campaign playthrough. Native PNG frames are saved without compositing."""
import json
from playwright.sync_api import sync_playwright
from browser_support import launch,ROOT,serve_game
OUT=ROOT/'_local/reports/airborne-beast-melee/browser';OUT.mkdir(parents=True,exist_ok=True)
SETUP=r'''async ({kind,scenario})=>{
 const a=HonroApp,C=HONRO_CORE;
 a.frame=()=>{};a.profile.settings.sound=false;a.profile.settings.music=false;a.updateAudio();
 a.launch(1,true,'A01');
 await new Promise(r=>setTimeout(r,600));
 if(!a.engine||!a.training){a.launch(1,true,'A01');await new Promise(r=>setTimeout(r,100));}
 a.dialogue=null;a.turnNotice=null;a.close();
 const b=a.engine.b,hero=b.units.find(v=>v.side===0),st=HONRO_CONTENT.stages[0];
 // The actual character stats and enemy tuning remain finite ordinary entry values.
 const fresh=C.defaults();b.heroes=structuredClone(fresh.heroes);C.applyHero(hero,b.heroes.archer,true);
 Object.assign(hero,{x:1080,y:1400,vx:0,vy:0});
 const u=HonroWorld.createEnemy(b,st,1000,kind,1,1400,true);
 Object.assign(u,{awake:true,lastAct:-1,acted:false,moveLeft:u.maxMove,facing:1});
 if(scenario==='approach')hero.x=1400;
 if(scenario==='charge')hero.x=1145;
 b.terrain=[{id:'review-floor',x:0,y:1400,w:6000,h:900,mat:'rock',hp:99999,maxHp:99999,indestructible:true}];b.sceneVersion++;
 if(scenario==='wall')b.terrain.push({id:'review-wall',x:1040,y:800,w:12,h:600,mat:'rock',hp:99999,maxHp:99999,indestructible:true});
 if(scenario==='upper'){hero.y=1290;b.terrain.push({id:'review-upper',x:1060,y:1290,w:300,h:20,mat:'wood',oneWay:true,hp:99999,maxHp:99999,indestructible:true});}
 if(scenario==='unreachable'){hero.x=1580;hero.y=1050;b.terrain.push({id:'review-high',x:1490,y:1050,w:350,h:20,mat:'wood',oneWay:true,hp:99999,maxHp:99999,indestructible:true});}
 b.units=[hero,u];b.active=u.id;b.side=1;b.phase='enemy';b.queue=[u.id];b.mode='skirmish';delete b.practiceCombat;a.training=false;b.projectiles=[];b.volley=undefined;
 const e=new C.Engine(b,ev=>{a.scene.event(ev);a.dirty=true;});a.engine=e;
 window.review={a,b,e,u,hero,kind,scenario,time:0,trace:[],hits:[],start:{x:u.x,hp:hero.hp,move:u.moveLeft}};
 const hurt=e.hurt.bind(e);e.hurt=(t,...args)=>{const hp=t.hp,shield=t.shield;const result=hurt(t,...args);review.hits.push({time:review.time,id:t.id,owner:args[1],skill:args[3]?.skill,hpLoss:hp-t.hp,shieldLoss:shield-t.shield,attacker:{x:u.x,y:u.y},target:{x:t.x,y:t.y}});return result;};
 Object.assign(a.scene,{manual:true,x:scenario==='unreachable'?1310:scenario==='approach'?1200:1080,y:1280,scale:1.3});
 review.render=()=>{a.updateHUD(true);a.scene.time=review.time;a.scene.render(e,0,'A01',.5,false,0);};review.render();
 return {hero:{hp:hero.hp,maxHp:hero.maxHp,attack:hero.attack,focus:hero.focus},enemy:{hp:u.hp,maxHp:u.maxHp,attack:u.attack,move:u.moveLeft,loadout:u.loadout}};
}'''
ADVANCE=r'''(seconds)=>{const r=review;for(let i=0;i<Math.round(seconds*120);i++){r.time+=HONRO_CORE.STEP;r.e.tick(HONRO_CORE.STEP);r.trace.push({time:r.time,x:r.u.x,y:r.u.y,hp:r.hero.hp,move:r.u.moveLeft,phase:r.b.phase,intent:r.u.intent,action:r.u.beastAction?structuredClone(r.u.beastAction):null,projectiles:r.b.projectiles.length});}r.render();return{hits:r.hits,phase:r.b.phase,x:r.u.x,action:r.u.beastAction||null,hp:r.hero.hp};}'''
rows=[];errors=[]
with serve_game() as base,sync_playwright() as pw:
 browser=launch(pw);page=browser.new_page(viewport={'width':1440,'height':900},device_scale_factor=1)
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(base+'/HONRO.html');page.wait_for_function('window.HonroApp && window.HONRO_APP_READY')
 # Lazy training runtime is loaded by the ordinary launch path first.
 for kind,scenario in [('hound','approach'),('boar','charge'),('stag','approach'),('boar','wall'),('stag','upper'),('hound','unreachable')]:
  initial=page.evaluate(SETUP,{'kind':kind,'scenario':scenario});prefix=f'{kind}-{scenario}'
  if scenario in ['approach','charge']:
   # Let the real AI use its movement plan and start the cast itself.
   for _ in range(45):
    status=page.evaluate(ADVANCE,.1)
    if status['action']:break
   assert status['action'],(prefix,status)
   page.evaluate(ADVANCE,.18);page.screenshot(path=str(OUT/f'{prefix}-1-prepare.png'))
   page.evaluate(ADVANCE,.25);page.screenshot(path=str(OUT/f'{prefix}-2-contact.png'))
   page.evaluate(ADVANCE,.28);page.screenshot(path=str(OUT/f'{prefix}-3-recover.png'))
   page.evaluate(ADVANCE,.45)
   detail=page.evaluate('()=>({hits:review.hits,trace:review.trace,start:review.start,end:{x:review.u.x,move:review.u.moveLeft,hp:review.hero.hp}})')
   assert sum(h['hpLoss']+h['shieldLoss']>0 for h in detail['hits'])==1,(prefix,detail['hits'])
   assert all(t['projectiles']==0 for t in detail['trace'])
  else:
   page.evaluate(ADVANCE,5)
   page.screenshot(path=str(OUT/f'{prefix}.png'))
   detail=page.evaluate('()=>({hits:review.hits,trace:review.trace,start:review.start,end:{x:review.u.x,move:review.u.moveLeft,hp:review.hero.hp,intent:review.u.intent}})')
   if scenario=='upper':
    assert any(h['hpLoss']>0 for h in detail['hits']),(prefix,detail['hits'])
    assert all(abs(h['attacker']['y']-h['target']['y'])<=45 for h in detail['hits'] if h['hpLoss']>0),(prefix,detail['hits'])
   else:
    assert not any(h['hpLoss']>0 for h in detail['hits']),(prefix,detail['hits'])
  (OUT/f'{prefix}-trace.json').write_text(json.dumps(detail,ensure_ascii=False,indent=2));rows.append({'kind':kind,'scenario':scenario,'initial':initial,'hits':detail['hits'],'end':detail['end']})
 # The live flight planner still moves each flying species within its existing budget.
 for kind in ['bat','crow','lantern']:
  page.evaluate(SETUP,{'kind':kind,'scenario':'approach'})
  page.evaluate('''()=>{const r=review;Object.assign(r.u,{y:1150,spawnY:1150,fixed:true,lastAct:-1});r.hero.x=2200;r.b.active=r.u.id;r.b.phase='enemy';r.b.side=1;r.b.queue=[r.u.id];Object.assign(r.a.scene,{x:1400,y:1220,scale:.8});r.start={x:r.u.x,y:r.u.y,move:r.u.moveLeft};r.render();}''')
  page.screenshot(path=str(OUT/f'{kind}-flight-before.png'));page.evaluate(ADVANCE,1.2);page.screenshot(path=str(OUT/f'{kind}-flight-after.png'))
  flight=page.evaluate('()=>({kind:review.kind,start:review.start,end:{x:review.u.x,y:review.u.y,move:review.u.moveLeft,fixed:review.u.fixed},trace:review.trace})')
  assert abs(flight['start']['x']-flight['end']['x'])+abs(flight['start']['y']-flight['end']['y'])>2,flight
  assert flight['end']['fixed']
  trail=[flight['start']]+flight['trace'];travel=sum(((z['x']-v['x'])**2+(z['y']-v['y'])**2)**.5 for v,z in zip(trail,trail[1:]));assert travel<=280.001,travel
  flight['travel']=travel
  (OUT/f'{kind}-flight-trace.json').write_text(json.dumps(flight,ensure_ascii=False,indent=2));rows.append({k:v for k,v in flight.items() if k!='trace'})
 # Unmodified canonical chapter 1: spend ordinary walking input, wait, and observe one enemy turn.
 page.evaluate("""async()=>{const a=HonroApp;a.launch(1);await new Promise(r=>setTimeout(r,1000));if(a.training||a.engine.b.mode!=='campaign')a.launch(1);await new Promise(r=>setTimeout(r,300));a.dialogue=null;a.turnNotice=null;a.close();window.canonical={hits:[],actions:[],trace:[]};const e=a.engine,old=e.hurt.bind(e);e.hurt=(u,...args)=>{const hp=u.hp,r=old(u,...args);if(u.hp<hp)canonical.hits.push({id:u.id,owner:args[1],skill:args[3]?.skill,loss:hp-u.hp});return r;};}""")
 canonical=page.evaluate("""()=>{const a=HonroApp,e=a.engine,b=e.b,C=HONRO_CORE;
 const stories=()=>{for(let n=0;a.dialogue&&n<30;n++)HonroStory.finish(a);a.turnNotice=null;};stories();
 for(let turn=0;turn<3&&e.heroesAlive().length&&!['won','lost'].includes(b.phase);turn++){
  for(let i=0;i<320;i++){stories();if(e.canAct()){const u=e.active,x=u.x;e.move(1,1/60);if(Math.abs(u.x-x)<.01)e.jump();}e.tick(1/60);}
  if(e.canAct())e.wait();
  const round=b.round;for(let i=0;i<1800&&b.round===round&&!['won','lost'].includes(b.phase);i++){stories();e.tick(1/120);canonical.trace.push({round:b.round,phase:b.phase,active:b.active,beasts:b.units.filter(u=>['hound','boar','stag'].includes(u.honroVariant)).map(u=>({id:u.id,x:u.x,y:u.y,action:u.beastAction||null,intent:u.intent}))});}
  if(canonical.hits.some(h=>/^HBM/.test(h.skill||'')))break;
 }
 stories();a.updateHUD(true);const hero=e.heroesAlive()[0];if(hero)Object.assign(a.scene,{manual:true,x:hero.x,y:hero.y-160,scale:.8});a.scene.render(e,0,'A01',.5,false,0);return {mode:b.mode,round:b.round,hero:hero?{hp:hero.hp,maxHp:hero.maxHp,x:hero.x,y:hero.y}:null,hits:canonical.hits,trace:canonical.trace,events:b.events};}""")
 assert canonical['mode']=='campaign',canonical
 page.screenshot(path=str(OUT/'canonical-stage1-enemy-turn.png'))
 (OUT/'canonical-stage1-trace.json').write_text(json.dumps(canonical,ensure_ascii=False,indent=2));rows.append({k:v for k,v in canonical.items() if k!='trace'})
 browser.close()
assert not errors,errors
(OUT/'summary.json').write_text(json.dumps({'method':'production browser, prepared skirmish at normal entry stats and lethal damage; real AI and Scene; no damage overrides','rows':rows,'errors':errors},ensure_ascii=False,indent=2))
print('PASS browser melee/obstacle/elevation/unreachable/flight; raw PNG sequences and traces:',OUT)
