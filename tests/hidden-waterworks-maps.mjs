import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {runtime} from '../game/tests/helpers.mjs';
import {applyHiddenWaterworks} from '../tools/map-forge/act3-hidden-waterworks.mjs';
import {traverse} from './act1-spatial-test-helpers.mjs';
const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE,clone=x=>JSON.parse(JSON.stringify(x));
const input=JSON.parse(await readFile('shared/data/campaign.json','utf8')),p=applyHiddenWaterworks(g,input),rows=[];
for(const id of [...Array.from({length:22},(_,i)=>i+1),29,30])assert.deepEqual(clone(p.stages[id-1]),input.stages[id-1],'preserve stage '+id);
assert.equal(p.stages.length,30);assert.deepEqual(clone(g.HonroMaps.finalize(JSON.parse(g.HonroMaps.serialize(p)))),clone(p),'canonical round-trip');
assert.deepEqual(clone(applyHiddenWaterworks(g,p)),clone(p),'idempotent regeneration');
for(const id of [23,24,25,26,27,28]){
 const s=p.stages[id-1],st=g.HONRO_CONTENT.stages[id-1],b=g.HonroMaps.createBattle(s,p,undefined,{origin:'campaign'});
 for(const step of st.steps){assert(s.markers.some(m=>m.id===step.id)||s.terrains.some(t=>t.id===step.id),'marker '+id+'/'+step.id);assert(step.label.length<43,'one-line goal '+id+'/'+step.id);}
 assert.deepEqual(clone(s.initialState.honroAct3Steps),clone(st.steps));
 for(const u of b.units)if(!g.HonroWorld.archetypes[u.honroVariant]?.flying)assert(C.validTerrainContactPose(b.terrain,u),id+'/'+u.id+' actual body contact');
 for(const c of s.design.act3.crossings||[]){assert(c.fromZone.right-c.fromZone.left<=300);assert(c.to.x>=c.landing.left&&c.to.x<=c.landing.right);assert(s.markers.some(m=>m.id===c.markerId));}
 rows.push({stage:id,kind:s.design.act3.kind,heroes:s.units.filter(u=>u.team==='player').map(u=>u.kind),enemies:s.units.filter(u=>u.team==='enemy').length,crossings:s.design.act3.crossings?.length||0,objectives:st.steps.map(z=>z.id)});
}
for(const id of [26,28]){const s=p.stages[id-1],b=g.HonroMaps.createBattle(s,p,undefined,{origin:'campaign'}),u=b.units.find(u=>u.side===0&&u.cls==='knight'),e=new C.Engine(b,()=>{},true);b.units=[u];b.active=u.id;e.checkEnd=()=>false;for(const t of b.terrain)if(t.honroAct3Gate)t.broken=true;const result=traverse(g,b,e,u,s.design.act3.requiredRoute);assert(result.passed&&!result.damage,'ordinary open-gate route '+id+JSON.stringify(result));}
await mkdir('_local/reports/hidden-waterworks',{recursive:true});await writeFile('_local/reports/hidden-waterworks/map-contracts.json',JSON.stringify({scope:'Canonical source, body support, goal markers and open-gate ordinary routes; crossing runtime, browser input and full combat are separate.',rows},null,2));console.log('PASS hidden depot maps: exact unaffected stages, idempotence, roundtrip, body supports, objectives, ordinary 26/28 traversal');
