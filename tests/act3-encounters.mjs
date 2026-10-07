import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
import {applyEncounters,ENCOUNTERS} from '../tools/map-forge/act3-encounters.mjs';
const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE,clone=x=>JSON.parse(JSON.stringify(x)),rows=[];
const authored=g.HONRO_PROJECT,again=clone(authored);applyEncounters(g,again);assert.deepEqual(again,clone(authored),'authoring is deterministic and does not scatter actors');
for(let id=21;id<=30;id++){
 const s=authored.stages[id-1],plan=s.design.act3.encounterPlan,expected=ENCOUNTERS[id],{b,st}=battlefield(g,id),e=b.units.filter(u=>u.side===1),xs=e.map(u=>u.x).sort((a,b)=>a-b),gaps=xs.slice(1).map((x,i)=>x-xs[i]);
 assert.equal(e.length,plan.initial);assert.equal(e.filter(u=>u.elite).length,plan.elites);assert.equal(e.filter(u=>u.honroAct3Elite).length,plan.elites);
 assert.equal(s.encounters.length,5);assert.equal(new Set(e.map(u=>u.group)).size,5);assert.equal(b.enemyLimit,3);
 assert(e.length>=18&&e.length<=24);assert(plan.elites/e.length>=.18&&plan.elites/e.length<=.25);
 assert(gaps.some(v=>v>=400),'empty connection interval');assert(gaps.filter(v=>v<=300).length>=Math.floor(e.length/2),'meaningful local density');
 for(const q of expected){assert(s.markers.some(m=>m.id===q.anchor||m.target===q.anchor)||s.elements.some(v=>v.id===q.anchor)||s.terrains.some(v=>v.id===q.anchor),`stage ${id}: group anchor ${q.anchor} exists`);const us=e.filter(u=>u.honroCohort===q.id);assert.equal(us.length,q.members.length);assert.equal(new Set(us.map(u=>u.honroCluster)).size,1);}
 const sourceBattle=g.HonroMaps.createBattle(s,authored);assert.deepEqual(sourceBattle.units.map(u=>[u.id,u.x,u.y,u.hp,u.elite]),b.units.map(u=>[u.id,u.x,u.y,u.hp,u.elite]),'Game and Stage View use exact authored positions and stats, no safety scatter');
 const poses=[];for(const u of e){assert(g.HonroWorld.archetypes[u.honroVariant]?.flying||C.validTerrainContactPose(b.terrain,u),`stage ${id}/${u.id}: body is embedded or floating at ${u.x},${u.y}`);assert(b.terrain.some(t=>t.id===u.honroEncounterSupport));poses.push({id:u.id,kind:u.honroVariant,x:u.x,y:u.y,elite:u.elite,group:u.group,role:u.honroEncounterRole,support:u.honroEncounterSupport});}
 const pairOverlaps=[];for(let i=0;i<e.length;i++)for(let j=i+1;j<e.length;j++)if(Math.abs(e[i].x-e[j].x)<e[i].r+e[j].r&&Math.abs(e[i].y-e[j].y)<Math.min(e[i].h,e[j].h))pairOverlaps.push([e[i].id,e[j].id]);assert.equal(pairOverlaps.length,0);
 for(const u of b.units.filter(u=>u.side===0)){assert(!e.some(v=>Math.hypot(v.x-u.x,v.y-u.y)<400),'readable entry/party space');}
 const limits=g.HonroDifficulty.audit(st,b);assert.deepEqual(clone(limits.issues),[]);
 // The saved source battle is never repopulated, healed or promoted on load.
 const saved=clone(b);saved.units=saved.units.slice(0,-1);saved.units.find(u=>u.side===1).hp=1;const before=JSON.stringify(saved);g.HonroAct3Encounters.initialize(saved);assert.equal(JSON.stringify(saved),before);
 const difficulty=[];for(const name of Object.keys(C.DIFFICULTIES)){const profile=C.defaults();profile.settings.difficulty=name;const {b:db}=battlefield(g,id,{profile});const de=db.units.filter(u=>u.side===1),d=C.DIFFICULTIES[name];assert.deepEqual(de.map(u=>[u.id,u.x,u.y,u.elite]),e.map(u=>[u.id,u.x,u.y,u.elite]));assert.equal(db.enemyLimit,3);for(const u of de){assert.equal(u.maxHp,Math.round(u.combatBaseHp*d.hp));assert(Math.abs(u.attack-u.combatBaseAttack*d.damage)<1e-8);}difficulty.push({name,hp:d.hp,damage:d.damage,count:de.length,elites:de.filter(u=>u.elite).length,active:db.enemyLimit});}
 const wave=(st.steps||[]).reduce((n,q)=>n+(q.wave?.count||0),0);rows.push({id,name:st.name,initial:e.length,elite:plan.elites,groups:s.encounters.length,reinforcements:wave,active:b.enemyLimit,maxGap:Math.max(...gaps),minGap:Math.min(...gaps),gaps,difficulty,limits,poses});console.log('PASS',id,e.length,'enemies',plan.elites,'elites',s.encounters.length,'groups');
}
// The explicit four-person baseline must not silently become a two-person map.
assert(rows.every(r=>g.HonroStageRules.stageParty(r.id).length===4));
await mkdir('_local/reports/act3-encounters',{recursive:true});await writeFile('_local/reports/act3-encounters/after.json',JSON.stringify({scope:'Actual compiled campaign battles across five difficulties; deterministic positions, roles, elites, body support, separation, difficulty and save idempotence. Not normal combat completion or browser evidence.',rows},null,2));
