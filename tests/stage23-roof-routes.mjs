/** Isolated geometry fixtures: production finite move/jump/drop, not combat. */
import assert from 'node:assert/strict';import{writeFile}from'node:fs/promises';import{createHash}from'node:crypto';import{execFileSync}from'node:child_process';
import{runtime,battlefield}from'../game/tests/helpers.mjs';import{drive}from'./tactical-finite-driver.mjs';
const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE,s=g.HONRO_PROJECT.stages[22],plain=x=>JSON.parse(JSON.stringify(x)),rows=[];
const base=JSON.parse(execFileSync('git',['show','HEAD:shared/data/campaign.json'],{maxBuffer:80*1024*1024})).stages[22];
const yAt=(q,x)=>{for(let i=1;i<q.length;i++)if(x>=q[i-1][0]&&x<=q[i][0])return q[i-1][1]+(q[i][1]-q[i-1][1])*(x-q[i-1][0])/(q[i][0]-q[i-1][0]);throw Error('no surface '+x);};
const main=x=>yAt(s.design.act3.primaryContour,x),point=(x,y)=>({x,y});
const west=[point(1100,main(1100)),point(1240,4156),point(1330,4156)];
const east=[point(6060,main(6060)),point(6200,4267.5),point(6280,4267.5),point(6420,4120)];
const paths={
 'west-gate':[point(100,4250),point(100,4140),point(395,3876)],
 'west-wing':[...west,point(1456.2,4110.272727272727)],
 granary:[...west,point(1760,4020),point(2250,4057)],
 'east-wing':[point(2480,4700),point(2480,4590),point(2767.5,4537)],
 'upper-store':[...west,point(1760,4020),point(2600,4100),point(2900,3922.7272727272725),point(3000,3822.1779497098647),point(3487.5,3332)],
 'sorting-west':[...east,point(6900,yAt([[6420,4120],[7060,3390]],6900)),point(6900,3420),point(7000,3250),point(7060,3090),point(7117.5,3003.714285714286)],
 'sorting-east':[...east,point(6900,yAt([[6420,4120],[7060,3390]],6900)),point(6900,3420),point(7000,3250),point(7060,3090),point(7117.5,3003.714285714286),point(7190.2,2942.714285714286),point(7233,2902.714285714286),point(7452.35,2902.714285714286),point(7673.5,3012.714285714286),point(7777.5,3087.4545454545455)],
 'east-gate':[point(9060,4170),point(8920,4020),point(8850,4020),point(8640,3920),point(8580,3857),point(8805,3796)]
};
const ids=s.design.escortYardRoofs.ids;assert.equal(ids.length,8);assert.equal(s.terrains.filter(t=>t.id.startsWith('sy-roof-')).length,16);assert(s.terrains.filter(t=>t.id.startsWith('sy-roof-')).every(t=>t.oneWay));
for(const cls of (process.env.HONRO_ROOF_CLASSES||'knight,archer,mage,occultist').split(','))for(const id of ids){
 const name=id.slice(8),q=battlefield(g,23),{b,e}=q,u=e.heroesAlive().find(u=>u.cls===cls);b.units=[u];b.active=u.id;b.side=0;b.phase='aim';e.checkEnd=()=>false;
 const path=paths[name];Object.assign(u,{x:path[0].x,y:path[0].y,vx:0,vy:0,jumping:false,airborne:false}); // Declared start fixture on the original low road, no changes after this point.
 const roof=s.design.escortYardRoofProfiles[ids.indexOf(id)],apex=point((roof.top[3][0]+roof.top[4][0])/2,roof.top[3][1]);
 const result=drive(g,q,u,[...path,...(name==='east-wing'?roof.top.slice(1,3).map(([x,y],i)=>i===1?{x,y,jumpTo:{x:3000,support:id}}:{x,y}):[]),{...apex,support:id}],{jump:true,automaticDrop:true,strictPose:false,label:id});
 const before={x:u.x,y:u.y,hp:u.hp};let drop=false,ticks=0,landed;
 if(result.passed){drop=e.drop(u);if(drop){for(;ticks<1000;ticks++){e.tick(C.STEP);if(ticks>30&&e.grounded(u)&&!u.platformDrop){landed={x:u.x,y:u.y,support:e.contactSurface(u.x,u.y-4,u.y+5)?.t.id,hp:u.hp};break;}}}}
 rows.push({cls,id,result,drop,ticks,before,landed,passed:result.passed&&drop&&!!landed&&landed.y>before.y+5&&landed.hp===before.hp});
 console.log(rows.at(-1).passed?'PASS':'FAIL',cls,id,JSON.stringify(result.failure||{drop,landed}));
}
// Removing only new roof surfaces recovers the precise low-road geometry and escort path.
const oldRoad=base.terrains.filter(t=>!t.id.startsWith('sy-roof-')),newRoad=s.terrains.filter(t=>!t.id.startsWith('sy-roof-'));
assert.deepEqual(plain(newRoad),plain(oldRoad));assert.deepEqual(plain(s.design.act3.primaryContour),plain(base.design.act3.primaryContour));assert.deepEqual(plain(s.design.escortYard.routes),plain(base.design.escortYard.routes));assert.deepEqual(plain(s.initialState.honroEscortYardSpec),plain(base.initialState.honroEscortYardSpec));
const q=battlefield(g,23),npc=q.b.units.find(u=>u.id==='act3-carrier');let npcPassed=true,npcTicks=0,cost=0;const start={x:npc.x,y:npc.y,hp:npc.hp},supports=new Set();
// Continuous production NPC walker, no jump or mission shortcuts. Explicit large but finite
// probe budget; this isolates geometry, not escort timing/normal resource completion.
npc.moveLeft=20000;q.b.units=[npc];q.e.checkEnd=()=>false;
for(;npcTicks<18000&&npc.x<9150;npcTicks++){const old=npc.x,pre=npc.moveLeft;q.e.walk(npc,1,C.STEP);q.e.integrateBody(npc,C.STEP);cost+=pre-npc.moveLeft;supports.add(q.e.contactSurface(npc.x,npc.y-4,npc.y+5)?.t.id);if(Math.abs(npc.y-main(npc.x))>3||npc.hp<start.hp||npc.x<=old){npcPassed=false;break;}}
npcPassed&&=npc.x>=9150;const npcRow={passed:npcPassed,start,end:{x:npc.x,y:npc.y,hp:npc.hp},ticks:npcTicks,cost,supports:[...supports]};
const passed=rows.every(r=>r.passed)&&npcPassed;await writeFile('review/stage23/roofs.json',JSON.stringify({passed,stageSha256:createHash('sha256').update(JSON.stringify(s)).digest('hex'),baseline:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),scope:'Authored geometry fixtures, ordinary finite hero inputs and production NPC low-road walker. No combat/browser claim; NPC budget explicitly 20000 for geometry.',rows,npc:npcRow,lowRoadAndSpecUnchanged:true},null,2));assert(passed,'See review/stage23/roofs.json');
