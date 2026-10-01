import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const g=vm.createContext({structuredClone}),read=p=>readFile(new URL('../'+p,import.meta.url),'utf8');
for(const f of ['environment','schema','geometry','commands'])vm.runInContext(await read('shared/map/'+f+'.js'),g);
g.HonroUnits={has:()=>true,teams:{player:0,enemy:1,ally:2,npc:3}};
const E=g.HonroEnvironment,project=JSON.parse(await read('shared/data/campaign.json')),clone=x=>JSON.parse(JSON.stringify(x));
assert.deepEqual(clone(E.validate(project)),[]);
let count=0;
for(const st of project.stages){
 for(const zoom of [.16,.66,1.65])for(const y of [0,st.height*.2,st.height*.37,st.height*.5,st.height*.67,st.height]){
  const v={x:st.width/2,y,scale:zoom};
  assert(Math.abs(E.zoneWeights(st,y).reduce((s,z)=>s+z.weight,0)-1)<1e-10);
  for(const e of st.environment.placements){const sf=E.supportOf(st,e),group=E.groupOf(st,e),q=E.placementScreen(v,1280,720,st,e),t=E.groupTransform(v,1280,720,st,group);
   assert(sf,'Every current finite asset has explicit support');assert.equal(e.y,0);
   assert(Math.abs(q.y-(t.y+E.surfaceY(sf,e.x)*t.scale))<1e-8,'Root and support share the complete transform');
   const inverse=E.groupWorld(v,1280,720,st,group.id,q);assert(Math.abs(inverse.x-e.x)<1e-8);
  const moved=E.placementScreen({...v,x:v.x+100},1280,720,st,e);assert(Math.abs(q.x-moved.x-100*t.scale)<1e-8,'Horizontal response still follows physical depth');count++;
   const raised=E.placementScreen({...v,y:v.y-100},1280,720,st,e);assert(Math.abs(raised.y-q.y-100*zoom)<1e-8,'Every finite layer follows L1 camera height');
  }
 }
 // Height zones blend atmosphere only. Scenery never fades or relocates there.
 for(const zone of st.environment.zones.slice(0,-1))for(let y=zone.to-zone.blend-1;y<=zone.to+zone.blend+1;y+=2){
  const a=E.zoneWeights(st,y),b=E.zoneWeights(st,y+.01);assert(a.every((r,i)=>Math.abs(r.weight-b[i].weight)<.001));
  for(const group of st.environment.groups){const q=E.groupTransform({x:0,y,scale:.66},960,540,st,group),r=E.groupTransform({x:0,y:y+.01,scale:.66},960,540,st,group);assert(Math.abs(q.y-r.y-.0066)<1e-9);assert.equal(q.opacity,1);}
 }
}
const st=project.stages[4],v={x:1000,y:2000,scale:.66},group={...st.environment.groups[0],verticalMode:'WORLD',x:1000,y:2000};
for(const layer of ['L1','L2','L3','L4']){const t=E.groupTransform(v,960,540,st,{...group,depthLayer:layer});assert.equal(t.y,270,'Depth alone never shifts screen height');}
assert.deepEqual(clone(E.groupTransform(v,960,540,st,{...group,verticalMode:'SKY',depthLayer:'L5',x:.7,y:.2})),{x:672,y:108,scale:1,opacity:1});
const checkInvalid=(mutate,message)=>{const p=clone(project);mutate(p.stages[4].environment,p);assert(E.validate(p).some(i=>i.text.includes(message)),message);};
checkInvalid(e=>delete e.placements.find(x=>x.assetId==='ancient_pine').supportId,'rooted object without support');
checkInvalid(e=>e.placements.find(x=>x.assetId==='ancient_pine').y=500,'root detached');
checkInvalid(e=>e.placements[0].supportId='missing','invalid support id');
checkInvalid(e=>e.placements[0].groupId='missing','invalid scenic group');
checkInvalid(e=>e.groups[0].zoneId='missing','invalid background zone');
checkInvalid(e=>e.groups[0].verticalMode='custom','unsupported vertical mode');
checkInvalid(e=>e.zones[0].blend=0,'invalid zone transition');
checkInvalid(e=>e.atmosphere.preset='missing','atmosphere preset');
checkInvalid(e=>e.surfaces[0].points=e.surfaces[0].points.filter(p=>p.x>=0),'coverage insufficient');
checkInvalid(e=>e.placements[0].yFactor=.3,'old arbitrary parallax factor');
checkInvalid((e,p)=>p.library.find(a=>a.id===e.placements[0].assetId).collision=[[{x:0,y:0},{x:1,y:0},{x:0,y:1}]],'interactive/colliding scenery');
// Old v4 projects and custom placements migrate once, with a visible audit note.
const old=clone(project);old.environmentVersion=1;for(const s of old.stages){delete s.environment.version;s.environment.placements=s.environment.placements.map(({groupId,supportId,...e})=>e);}
old.stages[0].environment.placements.push({id:'authored-tree',assetId:'ancient_pine',depthLayer:'L2',x:1234,y:900,scale:1,rotation:0});
const preserved=JSON.stringify(old.stages.map(({environment,...s})=>s));E.upgradeComposition(old);
assert.equal(JSON.stringify(old.stages.map(({environment,...s})=>s)),preserved,'Migration preserves all gameplay data');
assert(old.stages[0].environment.migrationNotes.some(n=>n.includes('authored-tree')));
const snapshot=JSON.stringify(old);E.upgradeComposition(old);assert.equal(JSON.stringify(old),snapshot,'Migration is idempotent');
const previous=clone(project),priorStage=previous.stages[4];previous.environmentVersion=2;priorStage.environment.version=2;
priorStage.environment.atmosphere.overrides={hazeStrength:.5};priorStage.environment.placements.push({id:'author-v2',assetId:'ancient_pine',depthLayer:'L2',groupId:'slope-L2',supportId:'slope-L2-support',x:500,y:0,scale:1,rotation:.23});
priorStage.environment.groups.push({id:'artist-wall',depthLayer:'L2',verticalMode:'SCENIC',zoneId:'slope',x:0,y:120});
priorStage.environment.surfaces.push({id:'artist-wall-support',groupId:'artist-wall',kind:'cliff',points:[{x:0,y:-100},{x:1000,y:-120}],bottom:900});
priorStage.environment.placements.push({id:'author-wall',assetId:'env:rock',depthLayer:'L2',groupId:'artist-wall',supportId:'artist-wall-support',x:500,y:0,scale:1,rotation:0});
const previousGameplay=JSON.stringify(previous.stages.map(({environment,...stage})=>stage));E.upgradeComposition(previous);
const retained=previous.stages[4].environment.placements.find(e=>e.id==='author-v2');
assert.equal(JSON.stringify(previous.stages.map(({environment,...stage})=>stage)),previousGameplay,'v2 migration changes environment only');
assert.equal(retained.groupId,'slope-L2');assert.equal(retained.supportId,'slope-L2-support');assert.equal(retained.rotation,.23);
assert.equal(previous.stages[4].environment.groups.find(g=>g.id==='artist-wall').verticalMode,'WORLD');
assert.equal(previous.stages[4].environment.placements.find(e=>e.id==='author-wall').supportId,'artist-wall-support');
assert.equal(previous.stages[4].environment.atmosphere.overrides.hazeStrength,.5);
assert.deepEqual(clone(E.validate(previous)),[]);
const placed=g.HonroCommands.apply(project,[{op:'scenery.place',stageId:'stage-5',id:'test-root',assetId:'ancient_pine',depthLayer:'L2',x:1000,y:2000}]);
const moved=g.HonroCommands.apply(placed,[{op:'move',stageId:'stage-5',id:'test-root',dx:40,dy:500}]);
assert.equal(moved.stages[4].environment.placements.find(e=>e.id==='test-root').y,0,'Dragging never detaches roots');
const attached=g.HonroCommands.apply(moved,[{op:'scenery.attach',stageId:'stage-5',id:'test-root',depthLayer:'L3',zoneId:'slope'}]);
assert.equal(attached.stages[4].environment.placements.find(e=>e.id==='test-root').groupId,'slope-L3');
assert.throws(()=>g.HonroCommands.apply(attached,[{op:'delete',stageId:'stage-5',id:'slope-L3-support'}]),/support/,'Referenced supports cannot be silently deleted');
assert.deepEqual(clone(g.HonroMaps.finalize(moved)),clone(moved),'Canonical save/load is lossless');
console.log('PASS composition: '+count+' root/depth/zoom checks, zone sweeps, validator, migration and authoring');
