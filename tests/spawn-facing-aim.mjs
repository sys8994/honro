/** Fresh authored directions share the engine's world-angle convention.
 * Saved explicit values remain authoritative; no Continue migration here. */
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE,rows=[];
const sign=a=>Math.cos(a*Math.PI/180)>=0?1:-1;
for(const stage of [1,12]){
 const {b}=battlefield(g,stage);
 for(const u of b.units.filter(u=>u.side===0)){rows.push({stage,id:u.id,facing:u.facing,angle:u.angle});assert.equal(sign(u.angle),u.facing,`stage${stage} ${u.id}: body and world aim disagree`);assert.equal(u.facing<0?180-u.angle:u.angle,44);}
}
const {b,p,st}=battlefield(g,12),create=record=>g.HonroUnits.create(record,b,p,st);
for(const cls of ['archer','mage','knight','occultist'])for(const facing of [-1,1]){
 const record={id:'direction-'+cls,kind:cls,team:'player',x:100,y:200,facing},saved=JSON.stringify(record),u=create(record);
 assert.equal(u.facing,facing);assert.equal(u.angle,facing===1?44:136);assert.equal(JSON.stringify(record),saved);
 for(const angle of [-30,20,90,136,200]){
  const explicit=create({...record,angle});assert.equal(explicit.angle,angle);assert.equal(explicit.facing,facing,'explicit authored pair is preserved');
 }
 const override=create({...record,facing:1,stageOverrides:{facing}});assert.equal(override.angle,facing===1?44:136);
 const exact=create({...record,stageOverrides:{angle:27,facing}});assert.equal(exact.angle,27);assert.equal(exact.facing,facing);
 const template=create({...u,runtimeTemplate:true,kind:cls,team:'player',facing,angle:37});assert.equal(template.angle,37);assert.equal(template.facing,facing);
}
for(const angle of [-30,44,136,220]){const u=create({id:'explicit-angle',kind:'archer',team:'player',x:100,y:200,angle});assert.equal(u.angle,angle);assert.equal(u.facing,sign(angle));}
for(const [kind,team] of [['human','enemy'],['ally:guard','ally']])for(const facing of [-1,1]){const u=create({id:'other-rig',kind,team,x:100,y:200,facing});assert.equal(sign(u.angle),facing);}
const e=new C.Engine(b);b.units=b.units.filter(u=>u.side===0);b.active=b.units[0].id;b.phase='aim';b.side=0;
for(const u of b.units){
 b.active=u.id;
 for(const facing of [-1,1]){
  e.face(facing);assert.equal(u.facing,facing);assert.equal(sign(u.angle),facing);
  const skill=C.SKILLS[u.loadout[0]],v=e.velocity(u,skill,u.angle,.55),o=e.projectileOrigin(u,skill,u.angle);assert.equal(Math.sign(v.vx),facing);assert.equal(Math.sign(o.x-u.x),facing);
 }
}
const snapshot=JSON.parse(JSON.stringify(b));for(const u of snapshot.units){u.facing=-1;u.angle=44;}const saved=JSON.stringify(snapshot);new C.Engine(snapshot);g.HonroStageRules.sanitizeStageBattle(snapshot);assert.equal(JSON.stringify(snapshot),saved,'explicit old save is not reset or migrated');
await mkdir('_local/reports/spawn-facing-aim',{recursive:true});await writeFile('_local/reports/spawn-facing-aim/native.json',JSON.stringify({passed:true,rows,scope:'Fresh production unit factory, authored entry, explicit pair/template preservation, Engine direction/origin, save purity. Renderer/browser checked separately.'},null,2)+'\n');
console.log('PASS spawn-facing aim: fresh1/12, four heroes/both directions, explicit authored/save values, NPC/enemy and Engine origin/velocity');
