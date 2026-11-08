/** Isolated ordinary A01/M01 projectile probes on unadopted candidate B.
 * Every trial starts fresh. No position/health/MP correction after setup.
 * Direct projectile stepping isolates trajectories from enemy AI and is not
 * an App turn loop, normal-combat completion or browser-control test. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {buildCore} from '../game/engine/build.mjs';
import {createCompactCandidate,heightOn} from '../tools/map-forge/stage11-compact-candidates.mjs';
const core=await buildCore(),g=vm.createContext({console,performance,structuredClone});vm.runInContext(core,g);const C=g.HONRO_CORE,c=createCompactCandidate('B'),rows=[],scans=[];
const hash=x=>createHash('sha256').update(typeof x==='string'?x:JSON.stringify(x)).digest('hex');
const floorPoint=x=>({x,y:heightOn(c.floor,x)}),upperPoint=x=>({x,y:heightOn(c.upper,x)});
function fixture(cls,from,to){
 const p=C.defaults();p.recruited=[cls];p.party=[cls];p.heroes[cls]=C.freshHero(cls);p.heroes[cls].xp=C.xpAtLevel(10);p.loadouts[cls]=[C.baseSkill(cls)];
 const b=C.createBattle(1,p,'campaign',{party:[cls]});Object.assign(b,{width:c.width,height:c.height,honroStage:11,honroCustom:true,honroMapOrigin:'workshop',physics:C.makePhysics(),wind:0,fields:[],waters:[],drafts:[],zones:[],decor:[],projectiles:[],phase:'aim',side:0,round:1,queue:[]});
 b.terrain=c.terrains.map(t=>{const xs=t.points.map(p=>p.x),ys=t.points.map(p=>p.y);return{id:t.id,x:Math.min(...xs),y:Math.min(...ys),w:Math.max(...xs)-Math.min(...xs),h:Math.max(...ys)-Math.min(...ys),vertices:structuredClone(t.points),mat:'rock',hp:999999,maxHp:999999,indestructible:true,oneWay:t.oneWay,route:true};});
 const u=C.makeUnit(cls,0,from.x,from.y,{id:'shooter',h:92,r:22,loadout:[C.baseSkill(cls)],equipmentIds:[]});C.applyHero(u,p.heroes[cls],true);
 const target=C.makeUnit('knight',1,to.x,to.y,{id:'target',h:92,r:22,fixed:true,hp:10000,maxHp:10000,shield:0,armor:0,loadout:[],equipmentIds:[]});b.units=[u,target];b.active=u.id;
 const e=new C.Engine(b,()=>{},false);e.checkEnd=()=>false;assert(C.validTerrainContactPose(b.terrain,u),'Shooter must stand on actual collision');assert(C.validTerrainContactPose(b.terrain,target),'Target must stand on actual collision');return{b,e,u,target,skill:C.SKILLS[C.baseSkill(cls)]};
}
function fireTrial(name,cls,from,to,angle,power){
 const {b,e,u,target,skill}=fixture(cls,from,to),pred=e.predict(u,skill,angle,power,target,false),before=target.hp,shooterHp=u.hp,terrainHp=b.terrain.map(t=>[t.id,t.hp]),fired=e.fire(skill.id,angle,power);let ticks=0;
 while(b.projectiles.length&&ticks++<3600)for(const p of [...b.projectiles])if(b.projectiles.includes(p))e.stepProjectile(p,C.STEP);
 const row={name,cls,skill:skill.id,from,to,angle,power,prediction:{unit:pred.unit??null,terrain:pred.terrain??null,terrainAtEnd:pred.terrainAtEnd??null,x:pred.x,y:pred.y},fired,ticks,remainingProjectiles:b.projectiles.length,damage:before-target.hp,shooterDamage:shooterHp-u.hp,terrainUnchanged:JSON.stringify(terrainHp)===JSON.stringify(b.terrain.map(t=>[t.id,t.hp])),scope:'Fresh isolated poses; Engine.predict/fire/stepProjectile; no App or AI turn loop.'};rows.push(row);return row;
}
function scan(name,cls,from,to){
 const q=fixture(cls,from,to),powers=[.2,.35,.5,.65,.8,1],bands=[];let best=null;
 for(const power of powers){const hits=[];for(let angle=-75;angle<=195;angle+=2){const pred=q.e.predict(q.u,q.skill,angle,power,q.target,false);if(pred.unit===q.target.id){hits.push(angle);best??={angle,power};}}
  const intervals=[];for(const angle of hits){const last=intervals.at(-1);if(last&&angle===last.max+2)last.max=angle;else intervals.push({min:angle,max:angle});}
  bands.push({power,stepDegrees:2,hitAngles:hits.length,intervals:intervals.map(p=>({...p,sampledSpan:p.max-p.min}))});
 }
 const result={name,cls,from,to,bands,best,scope:'2-degree sampled prediction windows at six discrete powers; not continuous mathematical reachability or player success rate.'};scans.push(result);if(best)fireTrial(name,cls,from,to,best.angle,best.power);return result;
}
const cover=c.terrains.find(t=>t.id==='compact-bier-cover'),low=floorPoint(cover.points[0].x-55),high={x:c.sites.firingRock.x,y:c.sites.firingRock.y},host={x:c.sites.host.x,y:c.sites.host.y};
const lowBlocked=fireTrial('low-horizontal-cover','archer',low,host,0,.65);
for(const cls of ['archer','mage'])scan('firing-rock-to-host',cls,high,host);
// Both targets are on exposed authored supports. The lower actor is beyond
// the neck's east end, rather than staged inside its solid/one-way footprint.
const upper=upperPoint(2500),lower=floorPoint(3530);
for(const cls of ['archer','mage']){scan('upper-to-lower',cls,upper,lower);scan('lower-to-upper',cls,lower,upper);}
const out='_local/reports/act2-redesign-20261109/shots';await mkdir(out,{recursive:true});const report={candidate:'B',candidateSha256:hash(c),engineSourceSha256:hash(core),testSha256:hash(await readFile(new URL(import.meta.url),'utf8')),scope:'Isolated geometry/ordinary projectiles with one initialized shooter and one stationary test target per fresh trial. No campaign objective, health/position correction, enemy AI, complete combat, browser play or art approval.',rows,scans};await writeFile(out+'/report.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({rows,scans:scans.map(s=>({name:s.name,cls:s.cls,best:s.best,bands:s.bands}))},null,2));
assert(lowBlocked.fired&&lowBlocked.prediction.terrain==='compact-bier-cover'&&lowBlocked.damage===0,'A low horizontal A01 must actually strike the solid bier');
assert(scans.every(s=>s.best),'Every required high/low firing question needs a predicted ordinary-shot window');
assert(rows.filter(r=>r!==lowBlocked).every(r=>r.fired&&r.damage>0&&r.remainingProjectiles===0),'Predicted hits must cause real projectile damage in fresh matching fixtures');
assert(rows.every(r=>r.shooterDamage===0&&r.terrainUnchanged),'Probe must preserve shooter health and authored terrain');
