// Browser playthrough bot: drives the real built HONRO.html, pumping its own frame loop with virtual time.
// Inputs: engine move/jump/fire/item/wait and HonroInteractions.use only (no state edits). Seeds a profile at
// each stage's entry level after the app (incl. act4/5 content) has loaded. Crude play: a weak balance signal.
// usage: node tools/qa/browser-playthrough-bot.cjs <url to HONRO.html> <ids e.g. 1,2,3> <out.json> [roundLimit=40]
const {chromium}=require('playwright');const fs=require('fs');
const [U,IDS,OUT,RL]=process.argv.slice(2);const ROUND_LIMIT=+RL||40;
const PAGE_BOT=String.raw`(()=>{
const C=HONRO_CORE,app=HonroApp;let vt=performance.now();
const pump=n=>{for(let i=0;i<n;i++){const q=window.__rafQ;window.__rafQ=[];vt+=1000/60;for(const cb of q){try{cb(vt)}catch(e){window.__botErr=(window.__botErr||[]).concat(String(e).slice(0,200))}}}};
const dist=(a,c)=>Math.hypot(a.x-c.x,a.y-c.y);
const S={actor:'',moved:false,stuck:0,log:[],actions:0,items:{},fires:0,interacts:0,waits:0,lastSummary:''};
function objectivePos(b,u){
 let st=null;try{st=HonroObjectives.state(b,app.stage)}catch{}
 const markers=(b.honroMarkers||[]).filter(m=>m.action&&!m.collected&&(!m.requiredClass||m.requiredClass===u.cls));
 const near=markers.sort((a,c)=>dist(a,u)-dist(c,u))[0];
 const t=(st?.targets||[]).filter(t=>Number.isFinite(t.x)&&Number.isFinite(t.y));
 const pick=t.find(t=>['seal','objective','boss','midboss'].includes(t.kind))||near||t.find(t=>t.kind==='exit')||t[0]||null;
 return {st,pos:pick,marker:near};
}
function tryInteract(b){
 for(const m of (b.honroMarkers||[]).filter(m=>m.action&&!m.collected)){try{if(HonroInteractions.eligibility(app,m).ok&&HonroInteractions.use(app,m)){S.interacts++;return true}}catch{}}
 return false;
}
function tryFire(e,b,u){
 const foes=e.alive(1).filter(f=>dist(f,u)<1600).sort((a,c)=>dist(a,u)-dist(c,u)).slice(0,4);
 const skills=(u.loadout||[]).map(id=>C.SKILLS[id]).filter(s=>s&&s.damage>0&&!s.passive&&e.cooldownLeft(u,s.id)<=0&&e.manaCost(s,u)<=u.focus).sort((a,c)=>c.damage-a.damage).slice(0,3);
 for(const foe of foes)for(const skill of skills){
  if(skill.martial&&skill.branch==='sword'){let angle=Math.atan2(u.y-u.h*.58-(foe.y-foe.h*.5),foe.x-u.x)*180/Math.PI;if(angle<-90)angle+=360;
   for(const power of [1,.7,.2])if(C.meleeContains(e,u,foe,C.meleeRange(u,skill,power),-angle*Math.PI/180,C.meleeSpan(u,skill,power))&&e.fire(skill.id,angle,power)){S.fires++;return true}continue;}
  let best=null;try{for(const aim of e.shotSeeds(u,skill,foe)){const v=C.shotViable(e,u,skill,foe,aim.angle,aim.power);if(v.ok&&v.risk<1&&v.miss<Math.max(85,(skill.radius||0)+foe.r+55)&&(!best||v.net>best.net))best={...aim,net:v.net}}}catch{}
  if(!best&&foe===foes[0]){try{const aim=e.bestShot(u,skill,foe),v=C.shotViable(e,u,skill,foe,aim.angle,aim.power);if(v.ok&&v.risk<1&&v.miss<Math.max(85,(skill.radius||0)+foe.r+55))best=aim}catch{}}
  if(best&&e.fire(skill.id,best.angle,best.power)){S.fires++;return true}
 }
 return false;
}
function moveToward(e,u,pos){
 let still=0,hops=0;for(let j=0;j<480&&e.canAct()&&u.moveLeft>10&&(Math.abs(u.x-pos.x)>24||(pos.y<u.y-70&&hops<4));j++){const x=u.x;
  const dir=Math.abs(u.x-pos.x)>24?Math.sign(pos.x-u.x):(j%60<30?1:-1);e.move(dir,1/60);pump(1);
  // Target above and near: hop toward it (ledges, steps, latch platforms).
  if(pos.y<u.y-70&&Math.abs(u.x-pos.x)<380&&e.grounded(u)&&j%24===0){if(e.jump(u))hops++}
  if(Math.abs(x-u.x)<.08){if(++still>8&&e.grounded(u)){e.jump(u);still=0}}else still=0}
 for(let j=0;j<120&&!e.grounded(u)&&e.canAct();j++)pump(1);
}
window.__bot={pump,S,run(maxMs,roundLimit){
 const t0=performance.now();
 while(performance.now()-t0<maxMs){
  const e=app.engine,b=e?.b;if(!b)return{state:'noengine'};
  if(['won','lost'].includes(b.phase)||app.done)return{state:'end',phase:b.phase};
  if(b.round>roundLimit)return{state:'roundLimit'};
  if(app.dialogue||app.storyCamera){try{if(app.dialogue)HonroStory.finish(app)}catch{}try{HonroStory.next?.(app)}catch{}pump(4);continue}
  if(document.querySelector('#modal.open,.modal.open')){try{app.close?.()}catch{}pump(2);continue}
  if(!e.canAct()||!app.canInput()){if(b.phase==='aim'&&e.active?.dead){const n=e.heroesAlive().find(v=>!v.acted);if(n)e.select(n.id)}pump(2);continue}
  const u=e.active;const key=b.round+':'+u.id;if(S.actor!==key){S.actor=key;S.moved=false}
  let summary='';try{summary=HonroObjectives.state(b,app.stage).summary||''}catch{}
  if(summary!==S.lastSummary){S.lastSummary=summary;S.log.push([b.round,summary])}
  S.actions++;
  if(tryInteract(b)){pump(30);continue}
  if(u.hp<u.maxHp*.32&&b.items?.heal>0&&e.item('heal')){S.items.heal=(S.items.heal||0)+1;pump(20);continue}
  if(!S.moved){S.moved=true;const {pos}=objectivePos(b,u);const foe=e.alive(1).sort((a,c)=>dist(a,u)-dist(c,u))[0];
   const range={archer:720,mage:560,knight:200,occultist:420}[u.cls]||500;let goal=pos||u;
   if(foe&&dist(foe,u)<1300)goal={x:foe.x+(u.x<foe.x?-range:range),y:foe.y};
   if(pos&&dist(pos,u)<350)goal=pos;
   moveToward(e,u,goal);if(tryInteract(b)){pump(30);continue}continue}
  if(u.focus<u.maxFocus*.15&&b.items?.focus>0&&e.item('focus')){S.items.focus=(S.items.focus||0)+1;pump(20);continue}
  if(tryFire(e,b,u)){pump(30);continue}
  e.wait();S.waits++;pump(20);
 }
 return{state:'slice'};
}};
})()`;
(async()=>{const br=await chromium.launch();const res={};
for(const id of IDS.split(',').map(Number)){
 const ctx=await br.newContext({viewport:{width:480,height:320}});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message.slice(0,200)));
 const t0=Date.now();
 try{
  await p.goto(U);await p.waitForFunction('window.HonroApp&&window.HonroProfileStore',null,{timeout:60000});await p.waitForTimeout(1000);
  await p.evaluate(id=>{const P=HonroProfileStore.fresh();P.recruited=['archer','mage','knight','occultist'];P.party=[...P.recruited];for(let i=1;i<id;i++)P.cleared[i]={visits:1,rounds:3};
   try{const C=HONRO_CORE,lvl=HonroProgression.plan(id).entryLevel;if(!HonroProgression.plan(id))throw new Error('no plan '+id);for(const cls of P.recruited){P.heroes[cls].xp=HonroProgression.rewardXpAt(lvl);C.autoTrain(P.heroes[cls],cls);C.sanitizeLoadout(P,cls);}}catch(e){throw e}
   localStorage.setItem('honro-first-act-profile-1',JSON.stringify(P));},id);
  await p.reload();await p.waitForFunction('window.HonroApp',null,{polling:100,timeout:60000});
  await p.waitForTimeout(1500);
  await p.evaluate(id=>HonroApp.launch(id),id);
  await p.waitForFunction(()=>HonroApp.engine?.b,null,{timeout:90000});await p.waitForTimeout(2500);
  // Take over the frame loop: the next scheduled frame re-registers itself through this stub.
  await p.evaluate(()=>{window.__rafQ=[];window.requestAnimationFrame=cb=>{window.__rafQ.push(cb);return window.__rafQ.length}});await p.waitForTimeout(200);
  await p.evaluate(PAGE_BOT);
  let r;for(let slice=0;slice<4000;slice++){r=await p.evaluate(([rl])=>__bot.run(2500,rl),[ROUND_LIMIT]);if(r.state!=='slice')break;if(Date.now()-t0>25*60*1000){r={state:'wallclock'};break}}
  res[id]=await p.evaluate(r=>{const b=HonroApp.engine?.b,S=__bot.S;const heroes=(b?.units||[]).filter(u=>u.side===0&&!u.summoned);
   return{result:r.state==='end'?b.phase:r.state,round:b?.round,goal:S.lastSummary,progress:S.log.slice(-12),actions:S.actions,fires:S.fires,interacts:S.interacts,waits:S.waits,items:S.items,
    heroes:heroes.map(u=>[u.cls,Math.round(u.hp),u.maxHp,u.dead?'dead':'']),level:(app=>{try{return HonroProgression.plan(b.honroStage).entryLevel}catch{return null}})(),loadouts:heroes.map(u=>u.cls+':'+(u.loadout||[]).join('/')),foesLeft:(b?.units||[]).filter(u=>u.side===1&&!u.dead).length,botErr:(window.__botErr||[]).slice(0,3),reason:(document.querySelector('#outcome,.outcome')?.innerText||'').slice(0,80)}},r);
 }catch(err){res[id]={err:String(err).slice(0,300)}}
 res[id].errors=errs.slice(0,5);res[id].seconds=Math.round((Date.now()-t0)/1000);
 console.log(id,JSON.stringify(res[id]).slice(0,700));fs.writeFileSync(OUT,JSON.stringify(res,null,1));await ctx.close();}
await br.close();})();
