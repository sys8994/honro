/** Stage5 B3 isolated movement/projectile diagnostics. Poses and renewed travel
 * budget below are explicit fixtures, never evidence of normal campaign play. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {runtime} from '../game/tests/helpers.mjs';
import {traverse} from './act1-spatial-test-helpers.mjs';
import {authorStage5Waterfall} from '../tools/map-forge/stage5-waterfall.mjs';
const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE,p=JSON.parse(await readFile('shared/data/campaign.json','utf8')),s=p.stages[4];
const plain=x=>JSON.parse(JSON.stringify(x)),report={scope:'Isolated geometry and actual projectile diagnostics. Explicit firing poses and renewed route budgets; not normal-input victory.',routes:[],shots:[]};
assert.deepEqual(plain(authorStage5Waterfall(p,g)),p,'Canonical author idempotence');
const profile=C.defaults();profile.recruited=['archer','mage'];for(const cls of profile.recruited){profile.heroes[cls].xp=g.HonroProgression.entryHero(g.HONRO_CONTENT.stages[4]).xp;C.autoTrain(profile.heroes[cls],cls);}
function make(){const b=g.HonroMaps.createBattle(s,p,profile,{origin:'campaign'}),e=new C.Engine(b);e.checkEnd=()=>false;return{b,e};}
for(const cls of (process.argv.some(a=>['--shots-only','--boundary-only'].includes(a))?[]:['archer','mage'])){const {b,e}=make(),u=b.units.find(v=>v.side===0&&v.cls===cls);b.units=[u];b.active=u.id;const r=traverse(g,b,e,u,s.design.positioning.routes[cls==='archer'?'upper':'lower']);assert(r.passed,JSON.stringify({cls,...r}));report.routes.push({cls,...r});console.log('ROUTE',JSON.stringify({cls,...r}));}
for(const [label,x,y,key,expected,open] of (process.argv.some(a=>['--routes-only','--boundary-only'].includes(a))?[]:[
 ['spawn',200,2420,'A01',false,true],['low',2310,1877,'A01',false,true],['low-long',2310,1877,'A14',false,true],
 ['mid',2680,1683,'A01',false,true],['high-left',3080,1497.8333,'A01',true,true],['high',3150,1496.6667,'A01',true,true],['high-right',3220,1495.5,'A01',true,true],['high-front',3290,1494.3333,'A01',true,true],
 ['closed',3150,1496.6667,'A01',false,false],['cave',3460,2670,'M01',false,true],['cave-phase',3460,2670,'M06',false,true]
])){
 const {b,e}=make(),u=b.units.find(v=>v.side===0&&v.cls===(key[0]==='M'?'mage':'archer'));Object.assign(u,{x,y});b.units=b.units.filter(v=>v===u||v.honroObjectiveTarget);b.active=u.id;b.side=0;b.phase='aim';g.HonroStage5WaterGeometry.setOpen(b,open);const sk=C.SKILLS[key],t=e.unit('cliff-cleat');
 const probes=[...e.shotSeeds(u,sk,t),...[15,20,25,30,35,38,39,40,45,50,55,60,65,70,75].map(angle=>({angle,power:1}))];
 const hits=probes.filter(q=>{const v=e.predict(u,sk,q.angle,q.power,undefined,false);return (v.unit||v.terrain)==='cliff-cleat';});assert.equal(hits.length>0,expected,label);const row={label,x,y,skill:key,open,probes:probes.length,hits};
 if(hits.length){const hp=t.hp,h=hits[0];assert(e.fire(key,h.angle,h.power,true));for(let i=0;i<2400&&(b.projectiles.length||b.volley||i<2);i++)e.tick(C.STEP);row.actualLoss=hp-t.hp;assert(row.actualLoss>0,label+' real projectile');}
 report.shots.push(row);console.log('SHOT',JSON.stringify(row));
}
if(!process.argv.some(a=>['--routes-only','--shots-only'].includes(a))){
 report.drops=[];for(const [id,x] of [['stage5-timber-low',2240],['stage5-timber-mid',2680],['stage5-timber-high',3150]]){const{b,e}=make(),u=b.units.find(v=>v.side===0&&v.cls==='archer'),t=b.terrain.find(v=>v.id===id);b.units=[u];b.active=u.id;Object.assign(u,{x,y:C.topAt(t,x),vx:0,vy:0});const y=u.y,budget=u.moveLeft;assert(t.oneWay);assert(e.drop(u),id+' Alt drop action');for(let i=0;i<150&&u.y<y+110;i++)e.integrateBody(u,C.STEP);assert(u.y>y+20,id+' fall through to next support');assert.equal(u.moveLeft,budget);report.drops.push({id,x,from:y,to:u.y});}
 const{b}=make(),before=plain(profile),q={...before,honroBattle:{...plain(b),honroCampaignMapRevision:6}};assert(g.HonroCampaignMapRevision.discard(q));assert.equal(q.honroMapRestart,5);for(const k of ['heroes','cleared','loadouts','recruited'])assert.deepEqual(plain(q[k]??null),plain(before[k]??null));assert(!g.HonroCampaignMapRevision.obsolete(b));const custom={...before,honroBattle:{...plain(b),honroCampaignMapRevision:6,honroMapOrigin:'workshop'}};assert(!g.HonroCampaignMapRevision.discard(custom));
 for(const open of [false,true]){g.HonroStage5WaterGeometry.setOpen(b,open);const state=JSON.stringify(b);g.HonroStage5WaterGeometry.setOpen(b,open);assert.equal(JSON.stringify(b),state);const v=b.terrain.find(t=>t.id==='waterfall-veil');assert.deepEqual(plain(v.honroWaterFluidVertices),plain(C.canonicalPolygon(g.HonroStage5WaterGeometry.dynamic[open?'opened':'closed'])));}
 report.saveBoundary='revision6 current Stage5 restart only; growth/current revision/Workshop preserved; fluid toggle idempotent';
}
const out=process.env.HONRO_STAGE5_DIAGNOSTICS_OUT||'_local/reports/stage5-dynamic-20261026';await mkdir(out,{recursive:true});await writeFile(out+'/'+(process.argv.includes('--routes-only')?'routes':process.argv.includes('--shots-only')?'shots':process.argv.includes('--boundary-only')?'boundaries':'contracts')+'.json',JSON.stringify(report,null,2)+'\n');
