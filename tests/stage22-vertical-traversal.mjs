import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { runtime, battlefield } from '../game/tests/helpers.mjs';
import { authorStage22VerticalGeometry, V22_LAYOUT, v22Y } from '../tools/map-forge/stage22-vertical-geometry.mjs';
import { followVerticalRoute } from './vertical-route-helpers.mjs';

const json=v=>JSON.parse(JSON.stringify(v)),g=await runtime({legacyMaps:false}),C=g.HONRO_CORE;
const sha=value=>createHash('sha256').update(value).digest('hex');
const fixture=JSON.parse(await readFile('tests/fixtures/vertical-stages/before-stages.json','utf8')).stages.find(s=>s.metadata.stageId===22);
const input=json(g.HONRO_PROJECT);input.stages[21]=json(fixture);
g.HONRO_PROJECT=authorStage22VerticalGeometry(g,input);
const st=g.HONRO_PROJECT.stages[21],opt=k=>process.argv.find(a=>a.startsWith('--'+k+'='))?.slice(k.length+3),onlyRoute=opt('route'),onlyClass=opt('class'),rows=[];
assert.deepEqual(json(authorStage22VerticalGeometry(g,g.HONRO_PROJECT)),json(g.HONRO_PROJECT),'Idempotent authoring');
assert.deepEqual(json(g.HONRO_PROJECT.stages.filter((_,i)=>i!==21)),input.stages.filter((_,i)=>i!==21),'Other 29 stages byte-equivalent JSON');
assert.deepEqual(json(st.initialState.honroAct3Steps),fixture.initialState.honroAct3Steps,'Original five ordered objectives');
assert.equal(st.initialState.honroAct3EncounterRevision,1);assert.equal(st.initialState.honroAct3ResponseRevision,1);
assert.deepEqual(json(st.events),fixture.events,'Original finite seven response definitions');
assert.equal(st.events.reduce((sum,e)=>sum+(e.action?.n||0),0),7);
assert.equal(st.initialState.honroAct3Steps.find(s=>s.id==='compare-ledgers').wave.count,2);
assert.equal(st.width,V22_LAYOUT.width);assert.equal(st.height,V22_LAYOUT.height);
assert.deepEqual([...g.HonroSpaceLayout.validate(st)],[],'Valid whole geometry and route metadata');
assert.deepEqual([...g.HonroTerrainDomain.validate(st)],[],'Fresh reauthored terrain bounds');

function profile(){const p=C.defaults();p.recruited=['archer','mage','knight','occultist'];for(const cls of p.recruited){p.heroes[cls].xp=g.HonroProgression.xpAt(16);p.heroes[cls].ranks={};p.heroes[cls].stats={};}return p;}
// Raw compile/sanitize must not fix a misplaced spawn or a stale source width.
const raw=g.HonroWorld.build(g.HONRO_CONTENT.stages[21],profile(),false,'archer','A01');
const before=raw.units.filter(u=>u.side===0).map(({id,x,y})=>({id,x,y}));
for(const u of raw.units.filter(u=>u.side===0)){
  const authored=st.units.find(a=>a.team==='player'&&a.kind===u.cls);
  assert(authored,'Authored player spawn '+u.cls);
  assert.equal(u.x,authored.x,'Raw compile keeps authored spawn x '+u.cls);
  assert.equal(u.y,authored.y,'Raw compile keeps authored spawn y '+u.cls);
  assert(C.validTerrainContactPose(raw.terrain,u),'Raw spawn body clearance '+u.id);
}
g.HonroStageRules.sanitizeStageBattle(raw);
assert.deepEqual(json(raw.units.filter(u=>u.side===0).map(({id,x,y})=>({id,x,y}))),json(before),'Sanitize does not relocate actors');
assert.equal(raw.width,4800);assert.equal(raw.height,6600);

const individual=st.design.vertical22.routes;
const chain=(id,ids)=>({id,anchors:ids.flatMap(id=>individual.find(r=>r.id===id).anchors),requires:[...new Map(ids.flatMap(id=>individual.find(r=>r.id===id).requires).map(r=>[r.terrainId,r])).values()]});
const routes=[...individual,
  chain('main-roundtrip',['AB','BC','CE','EF','FG','GH','HG','GF','FE-walkoff','EC','CB','BA']),
  chain('west-roundtrip',['AB','BC','CD','DF','FG','GH','HG','GF','FD','DE','EC','CB','BA'])];
const gateRows=[],headroom=[],objectiveGateRun=[];
const classes=onlyClass?[onlyClass]:['archer','mage','knight','occultist'];
// Both physical barriers stop walking and a base jump. The positive AB/CE
// traversals use only the original objective's opened-door precondition.
for(const [routeId,gateId] of [['AB','archive-door'],['CE','upper-door']])for(const cls of classes){
  const route=individual.find(r=>r.id===routeId),q=battlefield(g,22,{profile:profile(),entry:false}),u=q.e.heroesAlive().find(v=>v.cls===cls),t=q.b.terrain.find(t=>t.id===gateId);
  q.b.units=[u];q.b.active=u.id;q.b.side=0;q.b.phase='aim';q.e.checkEnd=()=>false;
  const x=t.x-75,y=q.e.contactSurface(x,t.y+t.h-180,t.y+t.h+120)?.y;
  assert(Number.isFinite(y),'Gate approach support');
  Object.assign(u,{x,y,vx:0,vy:0,airborne:false,jumping:false});
  const hp=u.hp,move=u.moveLeft;assert(q.e.jump(u));
  for(let tick=0;tick<150;tick++){q.e.move(1,C.STEP);q.e.tick(C.STEP);}
  assert(u.x<t.x,'Closed gate cannot be jumped '+gateId+' '+cls);
  assert.equal(u.hp,hp,'Closed-gate jump is recoverable');assert(!t.broken);
  gateRows.push({gateId,cls,blocked:true,final:{x:u.x,y:u.y},movementCost:move-u.moveLeft});
}
// Physical h+80 clearance is checked along every authored walk segment,
// including the low entrances beneath the overlapping stone shoulders.
const h=Math.max(...raw.units.filter(u=>u.side===0).map(u=>u.h));
function underside(surface,x){const ps=[...surface.top,...surface.bottom],hits=[];for(let i=0;i<ps.length;i++){const a=ps[i],b=ps[(i+1)%ps.length];if(a[0]!==b[0]&&x>=Math.min(a[0],b[0])&&x<=Math.max(a[0],b[0]))hits.push(a[1]+(b[1]-a[1])*(x-a[0])/(b[0]-a[0]));}return hits.length?Math.max(...hits):null;}
for(const route of individual){
  let minimum=Infinity,worst=null;
  for(let i=1;i<route.anchors.length;i++){
    const a=route.anchors[i-1],b=route.anchors[i];
    if(a.surfaceId!==b.surfaceId||a.jumpTo||a.dropTo)continue;
    const lo=Math.min(a.x,b.x),hi=Math.max(a.x,b.x);
    // Linear polygons reach the minimum gap at an endpoint/vertex. Include
    // all of them, plus intermediate samples; a narrow lip cannot be skipped.
    const xs=new Set([lo,hi,...V22_LAYOUT.surfaces.flatMap(t=>[...t.top,...t.bottom].map(p=>p[0])).filter(x=>x>=lo&&x<=hi)]);
    for(let x=lo;x<hi;x+=10)xs.add(x);
    for(const x of xs){
      const y=v22Y(a.surfaceId,x);
      for(const t of V22_LAYOUT.surfaces){
        if(t.id===a.surfaceId)continue;
        const ceiling=underside(t,x);
        if(ceiling===null||ceiling>y)continue;
        const gap=y-ceiling;
        if(gap<minimum){minimum=gap;worst={x,y,ceiling,support:a.surfaceId,overhead:t.id};}
      }
    }
  }
  headroom.push({route:route.id,minimum:Number.isFinite(minimum)?minimum:null,required:h+80,worst});
  assert(minimum>=h+80,route.id+' headroom '+JSON.stringify(headroom.at(-1)));
}

for(const route of routes.filter(r=>!onlyRoute||r.id===onlyRoute))for(const cls of classes) {
  const q=battlefield(g,22,{profile:profile(),entry:false}),u=q.e.heroesAlive().find(v=>v.cls===cls);
  for(const req of route.requires){const gate=q.b.terrain.find(t=>t.id===req.terrainId);assert(gate);gate.broken=true;}
  q.b.units=[u];q.b.active=u.id;q.b.side=0;q.b.phase='aim';q.e.checkEnd=()=>false;
  Object.assign(u,{x:route.anchors[0].x,y:route.anchors[0].y,vx:0,vy:0,airborne:false,jumping:false});
  const result=C.validTerrainContactPose(q.b.terrain,u)?followVerticalRoute(g,q,u,route):{passed:false,failed:{message:'invalid initial body clearance'}};
  rows.push({route:route.id,cls,level:u.level,gatePreconditions:route.requires,...result});
  console.log(result.passed?'PASS':'FAIL',route.id,cls,result.failed?.message||'cost='+result.movementCost.toFixed(1));
}
// One continuous isolated knight run opens the actual gates with the original
// objective API. No gate/actor/resource writes after the initial fixture pose.
// Stop at the third retrieval; the two-round defence and responses need their
// later encounter-authoring tests and are not quietly skipped as a victory.
if(!onlyRoute){
  const q=battlefield(g,22,{profile:profile(),entry:false}),u=q.e.heroesAlive().find(v=>v.cls==='knight');
  q.b.units=[u];q.b.active=u.id;q.b.side=0;q.b.phase='aim';q.e.checkEnd=()=>false;
  const start=individual.find(r=>r.id==='AB').anchors[0];
  Object.assign(u,{x:start.x,y:start.y,vx:0,vy:0,airborne:false,jumping:false});
  g.HonroAct3.attach(q.app,q.e);
  for(const [objectiveId,routeIds] of [['archive-seal',['AB','BC']],['ledger-case',['CE','EF']],['upper-register',[]]]){
    const marker=g.HonroAct3.marker(q.b,objectiveId),step=g.HonroAct3.current(q.b);
    assert.equal(step.id,objectiveId,'Original objective ordering');
    if(step.opens)assert(!q.b.terrain.find(t=>t.id===step.opens).broken,'Gate is closed until its objective');
    assert(g.HonroAct3.use(q.app,marker),'Original E interaction '+objectiveId);
    if(step.opens)assert(q.b.terrain.find(t=>t.id===step.opens).broken,'Original interaction opens its real gate');
    let result=null;
    if(routeIds.length){result=followVerticalRoute(g,q,u,chain(objectiveId+'-approach',routeIds));assert(result.passed,objectiveId+' actual gate route '+JSON.stringify(result.failed));}
    objectiveGateRun.push({objectiveId,opened:step.opens||null,x:u.x,y:u.y,result});
  }
  assert.equal(g.HonroAct3.current(q.b).id,'compare-ledgers','Defence is still pending');
  assert.equal(q.b.honroVerticalStage22Revision,1);
  console.log('PASS ordered physical gate run knight; comparison defence deliberately pending');
}
assert(rows.length,'Unknown route or empty selection');
await mkdir('_local/reports/vertical-stages',{recursive:true});
const out='_local/reports/vertical-stages/stage22-traversal'+(onlyRoute?'-'+onlyRoute:'')+(onlyClass?'-'+onlyClass:'')+'.json';
const sources=Object.fromEntries(await Promise.all(['tools/map-forge/stage22-vertical-geometry.mjs','tests/stage22-vertical-traversal.mjs','tests/vertical-route-helpers.mjs','tests/fixtures/vertical-stages/before-stages.json'].map(async p=>[p,sha(await readFile(p))])));
await writeFile(out,JSON.stringify({scope:'Whole-map geometry only. One initial pose, one level16 hero with SP03 absent, finite Engine move/jump/wait/tick. Other actors removed. Individual routes open declared gates as fixture preconditions; objectiveGateRun instead uses the original ordered E interactions without direct gate writes. No subsequent resource/pose/terrain repair. Not normal combat, art, browser, or old-save certification.',sources,stageDigest:sha(JSON.stringify(st)),otherStagesDigest:sha(JSON.stringify(input.stages.filter((_,i)=>i!==21))),passed:rows.every(r=>r.passed),gateRows,objectiveGateRun,headroom,rows},null,2)+'\n');
assert(rows.every(r=>r.passed),out);
