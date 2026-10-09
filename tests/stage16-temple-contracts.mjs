/** Current Stage16 body/roster contracts. Eight seconds of unmodified shared
 * idle physics; no enemy removal, pose edits, damage suppression or rescue.
 * This is a body/placement regression, not combat or campaign completion. */
import assert from 'node:assert/strict';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE,checks=[],rows=[];
const plain=x=>JSON.parse(JSON.stringify(x));
const check=(name,run)=>{try{const detail=run();checks.push({name,passed:true,detail});console.log('PASS',name);}catch(error){checks.push({name,passed:false,error:error.message});console.error('FAIL',name,error.message);}};
const fixture=()=>{const q=battlefield(g,16);g.HonroAllies.attach(q.app,q.e);g.HonroEncounters.attach(q.app,q.e);g.HonroAct2.attach(q.app,q.e);return q;};
const floating=u=>!!g.HonroWorld.archetypes[u.honroVariant]?.flying||!!u.summonFloating;
const q=fixture(),st=g.HONRO_PROJECT.stages[15];
check('initial enemy35, residents2, heroes4 and declared elite8/action4',()=>{
 assert.equal(q.e.alive(1).length,35);assert.equal(q.b.units.filter(u=>u.side===2).length,2);assert.equal(q.e.heroesAlive().length,4);assert.equal(q.b.enemyLimit,4);
 assert.equal(q.e.alive(1).filter(u=>u.honroAct2Elite).length,8);assert.equal(q.e.alive(1).filter(u=>u.elite).length,8,'No undeclared factory-index elites');
 return{enemies:35,residents:2,heroes:4,elites:8,activeLimit:4};
});
check('every initial body keeps its declared support or legal floating air',()=>{
 const bad=[];
 for(const u of q.b.units){const authored=st.units.find(v=>v.id===u.id),support=q.e.contactSurface(u.x,u.y-.2,u.y+.2)?.t?.id,valid=floating(u)?!g.HonroTerrain.intersects(q.b,u):C.validTerrainContactPose(q.b.terrain,u);rows.push({id:u.id,kind:u.honroVariant||u.cls,floating:floating(u),x:u.x,y:u.y,support,valid,authored:authored&&{x:authored.x,y:authored.y,support:authored.stageOverrides?.honroEncounterSupport}});if(!valid)bad.push({id:u.id,reason:'invalid body or contact',x:u.x,y:u.y});if(authored&&(Math.abs(u.x-authored.x)>.2||Math.abs(u.y-authored.y)>.2))bad.push({id:u.id,reason:'constructor relocated authored position',from:{x:authored.x,y:authored.y},to:{x:u.x,y:u.y},support});}
 assert.equal(bad.length,0,JSON.stringify(bad));return{bodies:q.b.units.length};
});
check('all declared route anchors and jump/drop destinations fit the four bodies',()=>{
 const bad=[];for(const route of st.design.space.routes)for(const anchor of route.anchors){
  const targets=[anchor,...[anchor.jumpTo,anchor.dropTo].filter(Boolean).map(p=>{const t=q.b.terrain.find(t=>t.id===p.support);return{...p,y:t?C.topAt(t,p.x):NaN,surfaceId:p.support};})];
  for(const target of targets)for(const hero of q.e.heroesAlive())if(!Number.isFinite(target.y)||!C.validTerrainContactPose(q.b.terrain,{...hero,x:target.x,y:target.y}))bad.push({route:route.id,cls:hero.cls,x:target.x,y:target.y,support:target.surfaceId});
 }
 assert.equal(bad.length,0,JSON.stringify(bad));return{routes:st.design.space.routes.length,bodies:4};
});
const overlap=units=>{const pairs=[];for(let i=0;i<units.length;i++)for(let j=i+1;j<units.length;j++){const a=units[i],b=units[j];if(Math.abs(a.x-b.x)<a.r+b.r&&Math.min(a.y,b.y)>Math.max(a.y-a.h,b.y-b.h))pairs.push([a.id,b.id]);}return pairs;};
check('no initial actor bodies overlap',()=>{assert.deepEqual(overlap(q.b.units),[]);return{bodies:q.b.units.length};});
for(const dt of [1/120,1/60,1/30])check(`all41 bodies stay valid through8 seconds shared idle physics dt=${dt}`,()=>{
 const {b,e}=fixture(),before=plain(b.units),failures=[];
 for(let tick=1;tick<=Math.round(8/dt);tick++){
  e.stepUnits(dt);
  for(const u of b.units){const was=before.find(v=>v.id===u.id);if(u.dead||u.hp!==was.hp||Math.abs(u.x-was.x)>.2||Math.abs(u.y-was.y)>.2||!floating(u)&&!C.validTerrainContactPose(b.terrain,u)||floating(u)&&g.HonroTerrain.intersects(b,u)){if(!failures.some(v=>v.id===u.id))failures.push({id:u.id,tick,seconds:tick*dt,from:{x:was.x,y:was.y,hp:was.hp},to:{x:u.x,y:u.y,hp:u.hp},dead:!!u.dead});}}
 }
 assert.equal(failures.length,0,JSON.stringify(failures));assert.deepEqual(overlap(b.units),[]);return{bodies:b.units.length,seconds:8,ticks:Math.round(8/dt)};
});
await mkdir('_local/reports/stage16-temple',{recursive:true});await writeFile('_local/reports/stage16-temple/body-contracts.json',JSON.stringify({stageSha256:createHash('sha256').update(JSON.stringify(st)).digest('hex'),scope:'Initial authoring and shared idle physics only. No normal combat, player route or elapsed play-time claim.',checks,rows},null,2)+'\n');
if(checks.some(c=>!c.passed))process.exitCode=1;
