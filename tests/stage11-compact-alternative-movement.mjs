/** Candidate geometry + ordinary Engine commands only. Isolated movement,
 * not combat completion, party collision, artwork acceptance or human play. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {buildCore} from '../game/engine/build.mjs';
import {createTwoStepB} from '../tools/map-forge/stage11-compact-alternatives.mjs';
const COMPACT_CANDIDATES=[{id:'B'}],createCompactCandidate=()=>createTwoStepB();
import {commandRoute} from './stage11-ravine-command-helpers.mjs';
const g=vm.createContext({console,performance,structuredClone});vm.runInContext(await buildCore(),g);const C=g.HONRO_CORE;
const hash=x=>createHash('sha256').update(typeof x==='string'?x:JSON.stringify(x)).digest('hex'),rows=[],partyTails=[],coverGeometry=[];
function fixture(c,cls,start){
 const p=C.defaults();p.recruited=[cls];p.party=[cls];p.heroes[cls]=C.freshHero(cls);p.heroes[cls].xp=C.xpAtLevel(10);
 const b=C.createBattle(1,p,'campaign',{party:[cls]});
 b.width=c.width;b.height=c.height;b.honroStage=11;b.honroCustom=true;b.honroMapOrigin='workshop';b.physics=C.makePhysics();
 b.terrain=c.terrains.map(t=>{const xs=t.points.map(p=>p.x),ys=t.points.map(p=>p.y);return{id:t.id,x:Math.min(...xs),y:Math.min(...ys),w:Math.max(...xs)-Math.min(...xs),h:Math.max(...ys)-Math.min(...ys),vertices:structuredClone(t.points),mat:'rock',hp:999999,maxHp:999999,indestructible:true,oneWay:t.oneWay,route:true};});
 const u=C.makeUnit(cls,0,start.x,start.y,{id:'p-'+cls,h:92,r:22,loadout:[C.baseSkill(cls)],equipmentIds:[]});C.applyHero(u,p.heroes[cls],true);b.units=[u];b.active=u.id;b.fields=[];b.waters=[];b.drafts=[];b.decor=[];b.zones=[];b.projectiles=[];b.phase='aim';b.side=0;b.round=1;b.queue=[];
 const e=new C.Engine(b,()=>{},false);e.checkEnd=()=>false;return{b,e,u};
}
for(const meta of COMPACT_CANDIDATES){const c=createCompactCandidate(meta.id);for(const route of c.routes)for(const cls of ['archer','mage','knight','occultist']){
 const q=fixture(c,cls,route.start||route.anchors[0]),initial={level:q.u.level,h:q.u.h,r:q.u.r,maxMove:q.u.maxMove,speed:q.u.walkSpeed,ranks:{...q.u.ranks},equipmentIds:[...q.u.equipmentIds]};
 assert.equal(q.u.ranks.SP03||0,0);assert.equal(q.u.h,92);assert.equal(q.u.r,22);
 const anchorClearance=route.anchors.filter(p=>!C.validTerrainContactPose(q.b.terrain,{...q.u,x:p.x,y:p.y})).map(p=>({...p}));
 let previous={x:q.u.x,y:q.u.y},travel=0,up=0,down=0,maxRise=0,maxDrop=0;
 const tick=q.e.tick.bind(q.e);q.e.tick=dt=>{tick(dt);const dx=q.u.x-previous.x,dy=q.u.y-previous.y;travel+=Math.hypot(dx,dy);up+=Math.max(0,-dy);down+=Math.max(0,dy);maxRise=Math.max(maxRise,-dy);maxDrop=Math.max(maxDrop,dy);previous={x:q.u.x,y:q.u.y};};
 let drop=null;
 if(route.drop){const hp=q.u.hp,from={x:q.u.x,y:q.u.y},accepted=q.e.drop(q.u);let frames=0;while(q.u.platformDrop&&frames++<2000)q.e.tick(C.STEP);drop={accepted,from,to:{x:q.u.x,y:q.u.y},frames,damage:hp-q.u.hp,landed:q.e.grounded(q.u)&&!q.u.platformDrop,support:q.e.surface(q.u.x,q.u.y-4,q.u.y+4)?.t?.id};}
 const result=commandRoute(g,q,q.u,route.anchors),plannedJumpRises=route.anchors.filter(p=>p.jumpTo).map(p=>p.y-p.jumpTo.y),row={candidate:c.id,route:route.id,cls,initial,candidateSha256:hash(c),anchorClearance,...result,drop,plannedJumpRises,actualTravel:travel,cumulativeAscent:up,cumulativeDescent:down,maxTickRise:maxRise,maxTickDrop:maxDrop};rows.push(row);
 console.log(JSON.stringify({candidate:c.id,route:route.id,cls,passed:result.passed,rounds:result.rounds,jumps:result.jumps,damage:result.damage,travel:+travel.toFixed(1),clearance:anchorClearance.length,failed:result.failed}));
}}
for(const meta of COMPACT_CANDIDATES){const c=createCompactCandidate(meta.id),classes=['archer','mage','knight','occultist'],offsets=[-135,-45,45,135],q=fixture(c,'archer',c.sites.lastCombat),floor=q.b.terrain.find(t=>t.id==='compact-floor');
 const cover=q.b.terrain.find(t=>t.id==='compact-bier-cover'),lowX=cover.x-55,low={x:lowX,y:C.topAt(floor,lowX)-92*.7},high={x:c.sites.firingRock.x,y:c.sites.firingRock.y-92*.7},target={x:c.sites.host.x,y:c.sites.host.y-92*.55},lowHit=C.segmentTerrain(low,target,cover),highHit=C.segmentTerrain(high,target,cover);
 coverGeometry.push({candidate:c.id,low,high,target,lowBlockedByBier:!!lowHit,highClearsBier:!highHit,scope:'Actual solid segment/cover geometry, not ballistic prediction, a fired projectile or full combat.'});
 q.b.units=classes.map((cls,i)=>{const x=c.lastCombat+offsets[i],y=C.topAt(floor,x),u=C.makeUnit(cls,0,x,y,{id:'party-'+cls,h:92,r:22,loadout:[C.baseSkill(cls)],equipmentIds:[]}),h=C.freshHero(cls);h.xp=C.xpAtLevel(10);q.b.heroes[cls]=h;C.applyHero(u,h,true);return u;});q.b.active=q.b.units[0].id;
 const initial=q.b.units.map(u=>({id:u.id,x:u.x,y:u.y,hp:u.hp,moveLeft:u.moveLeft})),trials=[];
 for(const [i,cls]of classes.entries()){const u=q.b.units.find(u=>u.cls===cls);assert(q.e.select(u.id),'Party selects an unacted real hero');const x=c.exit+offsets[i],target={x,y:C.topAt(floor,x),surfaceId:floor.id},result=commandRoute(g,q,u,[target]);trials.push({cls,...result});assert(q.e.canAct(),'Party can commit through ordinary wait');q.e.wait();for(let n=0;n<6000&&!q.e.canAct();n++)q.e.tick(C.STEP);}
 const positions=q.b.units.map(u=>({id:u.id,x:u.x,y:u.y,hp:u.hp,grounded:q.e.grounded(u),distanceToExit:Math.hypot(u.x-c.sites.exit.x,u.y-c.sites.exit.y)})),overlaps=[];for(let i=0;i<q.b.units.length;i++)for(let j=i+1;j<q.b.units.length;j++){const a=q.b.units[i],b=q.b.units[j];if(Math.abs(a.x-b.x)<a.r+b.r&&Math.abs(a.y-b.y)<Math.max(a.h,b.h))overlaps.push([a.id,b.id]);}
 const passed=trials.every(r=>r.passed)&&positions.every(u=>u.grounded&&u.distanceToExit<=180)&&!overlaps.length;partyTails.push({candidate:c.id,scope:'Four simultaneously present actors, empty isolated last-combat site, ordinary select/move/wait/tick; no enemies or earned final-combat state. Not combat-tail measurement.',initial,positions,overlaps,trials,rounds:q.b.round,passed});console.log(JSON.stringify({partyTail:c.id,passed,rounds:q.b.round,overlaps:overlaps.length}));
}
const summary=COMPACT_CANDIDATES.map(meta=>{const c=createCompactCandidate(meta.id),own=rows.filter(r=>r.candidate===c.id);return{id:c.id,size:[c.width,c.height],area:c.width*c.height,ratio:c.width/c.height,mainAltitudeRange:Math.max(...c.routes[0].anchors.map(p=>p.y))-Math.min(...c.routes[0].anchors.map(p=>p.y)),routes:c.routes.map(r=>({id:r.id,chordLength:r.anchors.slice(1).reduce((n,p,i)=>n+Math.hypot(p.x-r.anchors[i].x,p.y-r.anchors[i].y),0)})),allMovementPassed:own.every(r=>r.passed&&!r.anchorClearance.length),tailUnder900:own.filter(r=>r.route==='last-combat-to-exit').every(r=>r.actualTravel<=900),tailWithin3Rounds:own.filter(r=>r.route==='last-combat-to-exit').every(r=>r.rounds<=3),isolatedFourHeroTailPassed:partyTails.find(r=>r.candidate===c.id)?.passed}});
const report={scope:'One unadopted two-step B alternative collision skeleton with solid bier and two-step 200-unit firing-rock proxies; four level10 untrained unequipped physical bodies; one-time isolated start then move/jump/drop/wait/tick without state correction. actualTravel is the full sampled body arc including jump ascent/descent, not movement-budget expenditure. Separate four-actor isolated tail below. Not full normal growth, combat, final art, browser play or deployment verification.',iteration1Failures:'Preserved in report-iteration1-failed.json: walking at the coincident one-way neck selects that neck, not its lower floor. Lower-floor recovery and real down-jump entry are now separate probes. B upper flank joined an incorrect lower-floor waypoint; authored merge now follows the actual neck surface.',sourceSha256:{candidateModule:hash(await readFile('tools/map-forge/stage11-compact-alternatives.mjs','utf8')),test:hash(await readFile(new URL(import.meta.url),'utf8'))},summary,rows,partyTails,coverGeometry};
const out='_local/reports/act2-redesign-20261109/movement-two-step';await mkdir(out,{recursive:true});await writeFile(out+'/report.json',JSON.stringify(report,null,2)+'\n');for(const c of COMPACT_CANDIDATES)await writeFile(out+'/candidate-'+c.id+'.json',JSON.stringify(createCompactCandidate(c.id),null,2)+'\n');console.log(JSON.stringify(summary,null,2));
assert(rows.every(r=>r.passed&&!r.anchorClearance.length),'Inspect candidate movement failures in '+out+'/report.json');assert(summary.every(r=>r.tailUnder900&&r.tailWithin3Rounds),'Candidate isolated exit tail exceeds planned budget');
assert(rows.filter(r=>r.drop).every(r=>r.drop.accepted&&r.drop.landed&&r.drop.damage===0&&r.drop.support==='compact-floor'),'Down-jump must land safely on the authored lower floor');
assert(rows.filter(r=>r.route==='upper-flank').flatMap(r=>r.plannedJumpRises).every(rise=>rise>=120&&rise<=145),'Upper flank jump rise must remain within the authored 120–145 comparison range');
assert(rows.filter(r=>r.route==='firing-rock').flatMap(r=>r.plannedJumpRises).every(rise=>rise>=100&&rise<=130),'Rooted firing-rock steps must remain within 100–130');
assert(partyTails.every(r=>r.passed&&r.rounds<=3),'Four isolated heroes must gather within 180 with no overlap or damage through ordinary input');
assert(coverGeometry.every(r=>r.lowBlockedByBier&&r.highClearsBier),'Solid bier must occlude the low direct ray and clear the elevated firing-rock ray');
