import assert from 'node:assert/strict';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
import {appHarness,plain,report} from './app-regression-helpers.mjs';
const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE,checks=[];
for(let id=21;id<=30;id++){
 const {b,st}=battlefield(g,id),events=b.honroEvents.filter(e=>e.id.startsWith('act3-response-'));assert(events.length>=2);
 for(const u of b.units)if(!g.HonroWorld.archetypes[u.honroVariant]?.flying)assert(C.validTerrainContactPose(b.terrain,u),id+'/'+u.id+' fresh split/party body must be supported');
 for(const tree of g.HONRO_PROJECT.stages[id-1].elements.filter(e=>e.id.includes('a3-refine:')&&e.id.includes('rooted-pine'))){const support=g.HonroMapEngine.surfaceY(b.terrain,tree.x,tree.y-2);assert(support&&Math.abs(support.y-tree.y)<1,'tree roots follow physical ground, never a multi-storey route '+tree.id);}
 const before=JSON.stringify(b),s=g.HonroObjectives.state(b,st);assert.equal(JSON.stringify(b),before,'reading guidance cannot mutate progress');assert.equal(s.visibleChecklist.length,1);assert(s.currentInstruction.length<65);
 const ordered=g.HonroAct3.steps(b);for(let i=0;i<ordered.length;i++){const q=ordered[i];b.honroState.act3.done[q.id]=true;const help=g.HonroObjectives.help({engine:{b},stage:st});assert(help.checklist.every(row=>row.done||row.current));assert(help.checklist.filter(row=>!row.done).length<=1);assert(help.checklist.every(row=>ordered.findIndex(s=>s.id===row.id)<=i+1||ordered[i+1]?.parallelGroup));}
 const emitted=[];b.units=b.units.filter(u=>u.side!==1);b.honroGrowth.ledger.stages[id].cleared=false;const e=new C.Engine(b,ev=>emitted.push(ev),true);e.checkEnd=()=>false;
 const notices=[],app={engine:e,stage:st,actorBoundary:null,dialogue:null,done:false,event:t=>notices.push(t),sayLines(){},checkMission(){return false;},dirty:false};
 b.honroState.act3.done={};g.HonroMission.tick(app,0);assert.equal(b.honroState.pendingEvents.length,0,'no early response');
 for(const ev of events){b.honroState.act3.done[ev.when.objectiveDone]=true;if(ev.when.progress){e.active.x=b.width-90;e.active.y=g.HonroWorld.top(b,e.active.x,e.active.y);}app.actorBoundary=null;const old=b.units.length;g.HonroMission.tick(app,0);
  assert(b.honroState.pendingEvents.includes(ev.id),'warning queued');assert.equal(old,b.units.length,'warning cannot spawn actors before a safe boundary');
  app.actorBoundary=e.active?.id||'boundary';b.honroState.actorTurnSerial=(b.honroState.actorTurnSerial||0)+1;g.HonroMission.tick(app,0);assert(b.honroState.flags['event:'+ev.id],'normal mission loop commits one entry');
  const born=b.units.filter(u=>u.honroSpawnSource===ev.id);assert.equal(born.length,ev.action.n);for(const u of born){assert(u.awake);assert(C.validTerrainContactPose(b.terrain,u),id+'/'+ev.id+' supported reinforcement');assert(Math.abs(u.x-ev.entry.x)<650,'entry stays at authored doorway');assert(u.xpBudget>0);assert(u.honroAct3EncounterTuned);}
  const after=JSON.stringify(b);g.HonroEncounters.flush(app);assert.equal(JSON.stringify(b),after,'flushing a saved committed event never duplicates actors');
  // Defeat fixture frees population for the next entry; not a combat-playthrough.
  for(const u of born){u.dead=true;u.hp=0;}
 }
 assert(notices.some(t=>t.includes('소리')||t.includes('종')||t.includes('기척')||t.includes('경비')||t.includes('장부')||t.includes('궁귀')));checks.push(id+': progressive objectives and all finite entries supported/idempotent');
}
// XP near an actual level threshold; an unconscious companion never revives.
{const h=await appHarness(),app=h.load(h.profileThrough(27));delete app.profile.cleared[28];app.launch(28);h.finish(app);const e=app.engine,b=e.b,u=e.active,v=b.units.find(v=>v.side===0&&v.id!==u.id),threshold=C.xpAtLevel(20);for(const cls of [u.cls,v.cls])b.heroes[cls].xp=threshold-1;h.C.applyHero(u,b.heroes[u.cls],false);u.hp=1;u.focus=2;u.moveLeft=3;u.acted=true;v.dead=true;v.hp=0;const events=[],emit=e.emit.bind(e);e.emit=(type,ev)=>{events.push({type,...ev});emit(type,ev);};h.g.HonroProgression.awardCombat(e,u,2);assert.equal(u.level,20);assert.equal(u.hp,u.maxHp);assert.equal(u.focus,u.maxFocus);assert.equal(u.moveLeft,u.maxMove);assert(u.acted);assert(v.dead&&v.hp===0);assert.equal(events.filter(e=>e.type==='level').length,1);assert.equal(events.filter(e=>e.type==='fx'&&e.text?.startsWith('경지')).length,1);checks.push('one live level effect, full resources, no action reset or resurrection');}
await report('act3-refinement',checks,{entryGroups:29,scope:'Production state fixtures. Browser art/input and normal balance are separate.'});console.log('PASS refinement',checks.length,'checks');
