// Isolated live projectiles from authored high/low supports. Geometry is never
// removed to make a shot work. Includes the real overwatch and waterfall goals.
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {act1Runtime,fixture,reportRoot} from './stage8-bier-act1-history-helpers.mjs';
const g=await act1Runtime(),C=g.HONRO_CORE,ids=process.argv.slice(2).map(Number),rows=[];if(!ids.length)ids.push(...Array.from({length:10},(_,i)=>i+1));
const hints=JSON.parse(await readFile('tests/fixtures/act1-shot-aims.json','utf8')).aims;
const pairs={1:['pine-branch-east',2500,'forest-floor',2900],2:['left-tree-branch-lower',1530,'canyon-ground',1940],3:['warehouse-roof',5650,'ferry-ground',6150],4:['west-shoulder',1670,'west-step-2',1200],5:['archer-step',1980,'valley-floor',1470],6:['bridge-west',1400,'debris-step-2',1180],7:['tier-mid',2800,'tier-low',1750],8:['west-eave',3120,'bier-road',3200],9:['west-gallery',1210,'yard-floor',1530],10:['west-gallery',1620,'outer-yard',1900]};
function aimAt(e,u,skill,target,terrainId){
 const ok=p=>terrainId?p.terrain===terrainId:p.unit===target.id;
 if(target)for(const seed of e.shotSeeds(u,skill,target)){if(ok(e.predict(u,skill,seed.angle,seed.power,target,false)))return seed;}
 for(const power of [.2,.35,.5,.65,.8,1]){for(let angle=-85;angle<=265;angle+=2){if(ok(e.predict(u,skill,angle,power,target,false,!!terrainId)))return{angle,power};}}
 return null;
}
function fire(e,u,target,skill,aim){const before=target.hp;let fired=false;if(aim){fired=e.fire(skill.id,aim.angle,aim.power);for(let frame=0;frame<1800&&e.b.projectiles.length;frame++)for(const p of [...e.b.projectiles])if(e.b.projectiles.includes(p))e.stepProjectile(p,C.STEP);}return{fired,damage:before-target.hp,passed:fired&&(target.hp<before||target.broken)};}
for(const id of ids)for(const cls of id<=2?['archer']:['archer','mage'])for(const direction of ['low-to-high','high-to-low']){
 const {b,e}=fixture(g,id),[highId,hx,lowId,lx]=pairs[id],highTerrain=b.terrain.find(t=>t.id===highId),lowTerrain=b.terrain.find(t=>t.id===lowId),high={x:hx,y:C.topAt(highTerrain,hx)},low={x:lx,y:C.topAt(lowTerrain,lx)};
 const u=C.makeUnit(cls,0,0,0,{id:'probe-shooter'}),target=C.makeUnit('knight',1,0,0,{id:'probe-target'}),from=direction==='low-to-high'?low:high,to=direction==='low-to-high'?high:low;
 Object.assign(u,from);Object.assign(target,to);b.units=[u,target];b.active=u.id;b.phase='aim';b.side=0;e.checkEnd=()=>false;assert(e.grounded(u),`${id}/${cls}/${direction}: shooter lacks exposed support`);assert(e.grounded(target),`${id}/${cls}/${direction}: target lacks exposed support`);const skill=C.SKILLS[C.baseSkill(cls)],aim=hints[`${id}/${cls}/${direction}`];assert(aim,'Missing verified firing fixture');assert.equal(e.predict(u,skill,aim.angle,aim.power,target,false).unit,target.id,'Verified high/low lane no longer reaches its target');const result=fire(e,u,target,skill,aim),row={stage:id,hero:cls,direction,from,to,supports:[highId,lowId],skill:skill.id,aim,...result};rows.push(row);console.log(JSON.stringify(row));
}
if(ids.includes(2)){
 const {b,e}=fixture(g,2),u=e.active,target=b.units.find(v=>v.honroCluster==='shelf-roost');b.units=[u,target];e.checkEnd=()=>false;const skill=C.SKILLS.A01,aim=aimAt(e,u,skill,target),result=fire(e,u,target,skill,aim);rows.push({stage:2,name:'actual overwatch target from original archer spawn',target:target.id,aim,...result});
}
if(ids.includes(5)){
 const {b,e,app}=fixture(g,5),mage=e.heroesAlive().find(u=>u.cls==='mage'),u=e.heroesAlive().find(u=>u.cls==='archer'),m=b.honroMarkers.find(m=>m.id==='receiver-5'),target=b.terrain.find(t=>t.id==='cliff-cleat');Object.assign(mage,{x:m.x,y:m.y});b.active=mage.id;assert(g.HonroInteractions.use(app,m));Object.assign(u,b.honroMapAnchors.shotGap);b.active=u.id;b.phase='aim';b.side=0;u.acted=false;b.units=[mage,u];e.checkEnd=()=>false;const skill=C.SKILLS.A01,aim=aimAt(e,u,skill,null,target.id),result=fire(e,u,target,skill,aim);rows.push({stage:5,name:'real arrow reaches cliff cleat after actual mage ritual',aim,...result});
}
const out=reportRoot();await mkdir(out,{recursive:true});await writeFile(`${out}/high-low-shots${ids.length===10?'':'-'+ids.join('-')}.json`,JSON.stringify({scope:'Explicit high/low firing-site fixtures and actual target damage. Failed site/skill pairs identify a blocked firing lane, not mission impossibility.',rows},null,2)+'\n');if(rows.some(r=>!r.passed))process.exitCode=1;
