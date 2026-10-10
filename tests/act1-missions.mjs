// Explicit state fixtures separate mission-rule regression from normal combat.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {act1Runtime,fixture,reportRoot} from './stage8-bier-act1-history-helpers.mjs';
const g=await act1Runtime(),rows=[];
function check(name,fn){try{const detail=fn();rows.push({name,passed:true,detail});console.log('PASS',name);}catch(error){rows.push({name,passed:false,error:error.stack});console.error('FAIL',name,error.message);}}
function ready(q){const {b,e,st}=q,hs=b.honroState;
 if(st.id===1)e.active.x=b.honroMapAnchors.exit.x;
 if(st.id===2)e.unit('objective').x=b.honroEscortGoalX;
 if(st.id===3)hs.ledger=true;
 if(st.id===4)b.round=st.holdRounds+1;
 if(st.id===5)for(const t of b.terrain)if(t.honroSeal)t.broken=true;
 if(st.id===6){hs.rescued=true;e.unit('objective').x=b.honroMapAnchors.exit.x;for(const u of b.units.filter(u=>u.honroMidboss)){u.dead=true;u.hp=0;}}
 if(st.id===7)hs.rescuedCount=3;
 if(st.id===8){for(const t of b.terrain)if(t.honroSeal)t.broken=true;e.unit('boss').dead=true;e.unit('boss').hp=0;}
 if(st.id===9)hs.receivers=2;
 if(st.id===10){hs.sodanCoop=true;hs.coopHold=6;e.unit('boss').side=2;}
}
for(let id=1;id<=10;id++){
 check(`${id}: mission condition and minimum/settling turns survive redesign`,()=>{const q=fixture(g,id),{b,e,st,app}=q;let state=g.HonroObjectives.state(b,st);assert(!state.complete);const minimumRound=state.minimumRound,settleRounds=state.settleRounds;ready(q);b.round=minimumRound;if(id===4)b.round=Math.max(b.round,st.holdRounds+1);app.checkMission(e);if(settleRounds){assert.notEqual(b.phase,'won');b.round+=settleRounds;app.checkMission(e);}assert.equal(b.phase,'won');return{objective:st.objective,minimumRound,settleRounds};});
 const q=fixture(g,id);
 for(const marker of q.b.honroMarkers.filter(m=>m.action))check(`${id}/${marker.id}: real interaction works from its same-level standing point`,()=>{
  const {b,e,app}=fixture(g,id),m=b.honroMarkers.find(m=>m.id===marker.id),u=e.heroesAlive().find(u=>u.cls===(m.requiredClass||'archer'));
  const target=m.action==='rescue'?e.unit(m.target):null,point=target||m;Object.assign(u,{x:point.x,y:point.y,vx:0,vy:0});b.active=u.id;
  assert(g.HonroInteractions.eligibility(app,m).ok);assert(g.HonroInteractions.use(app,m));assert(m.collected||m.action==='ritual'&&b.honroState.ritual?.active);
  if(m.action==='ritual'){assert(b.terrain.find(t=>t.id==='waterfall-veil').broken);u.x=m.x+126;g.HonroMission.tick(app,0);assert(!b.honroState.ritual.active);assert(!b.terrain.find(t=>t.id==='waterfall-veil').broken);}
  return{action:m.action,requiredClass:m.requiredClass||null,standing:{x:point.x,y:point.y}};
 });
}
for(const [id,target] of [[2,'objective'],[4,'objective'],[6,'objective'],[7,'resident-1'],[10,'boss']])check(`${id}: protected ${target} loss outranks completed objective`,()=>{const q=fixture(g,id);ready(q);q.b.round=50;q.b.honroState.objectiveReadyRound=1;q.e.unit(target).dead=true;q.e.unit(target).hp=0;q.app.checkMission(q.e);assert.equal(q.b.phase,'lost');});
check('5: wrong class and a different floor cannot activate the waterfall array',()=>{const {b,e,app}=fixture(g,5),m=b.honroMarkers.find(m=>m.id==='receiver-5'),u=e.active;Object.assign(u,{x:m.x,y:m.y});assert(!g.HonroInteractions.eligibility(app,m).ok);const mage=e.heroesAlive().find(u=>u.cls==='mage');b.active=mage.id;Object.assign(mage,{x:m.x,y:m.y+180});assert(!g.HonroInteractions.eligibility(app,m).ok);assert(!b.terrain.find(t=>t.id==='waterfall-veil').broken);});
const out=reportRoot();await mkdir(out,{recursive:true});await writeFile(`${out}/missions.json`,JSON.stringify({scope:'Mission state, actual interaction and loss-priority fixtures; no combat clear claim',rows},null,2)+'\n');if(rows.some(r=>!r.passed))process.exitCode=1;
