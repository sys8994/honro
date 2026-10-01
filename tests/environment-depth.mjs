import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';

const source=await readFile(new URL('../shared/map/environment.js',import.meta.url),'utf8');
const g=vm.createContext({});vm.runInContext(source,g);
const E=g.HonroEnvironment,project=JSON.parse(await readFile(new URL('../shared/data/campaign.json',import.meta.url),'utf8'));
assert.equal(E.validate(project).length,0,'All assets, placements and stages must be classified');
const st=project.stages[2],tree=project.library.find(a=>a.id==='ancient_pine');
const L2=st.environment.placements.find(e=>e.assetId==='ancient_pine'&&e.depthLayer==='L2');
const group3=st.environment.groups.find(g=>g.depthLayer==='L3');
assert(L2&&group3,'Stage 3 exposes both finite depths');
assert(st.environment.placements.some(e=>e.assetId==='env:forest'&&e.depthLayer==='L3'),'Distant vegetation is a forest mass');
const near={...L2,x:1600,y:0,scale:1},far={...near,depthLayer:'L3',groupId:group3.id,supportId:st.environment.surfaces.find(s=>s.groupId===group3.id).id};
const w=960,h=540,view={x:1400,y:1500,scale:.66};
const height=e=>E.screenBounds(tree,e,view,w,h,st).h;
const d2=E.depth(st,'L2'),d3=E.depth(st,'L3');
assert(d2<d3&&height(near)>height(far),'A deeper equal-size pine must be smaller');
for(const zoom of [.16,.66,1.65])for(const [layer,e] of [['L2',near],['L3',far]]){
 const v={...view,scale:zoom},d=E.depth(st,layer),z=zoom/E.REFERENCE_SCALE;
 const expected=E.REFERENCE_SCALE*E.WORLD_UNITS_PER_METER*tree.reference.heightM*z/(1+z*d/E.D0_METERS);
 const actual=E.screenBounds(tree,e,v,w,h,st).h;
 assert(Math.abs(actual-expected)<1e-9,`${layer} size at ${zoom}`);
 const p=E.screen(v,w,h,st,layer,e),back=E.world(v,w,h,st,layer,p);
 assert(Math.abs(back.x-e.x)<1e-9&&Math.abs(back.y-e.y)<1e-9,`${layer} inverse at ${zoom}`);
 const moved=E.screen({...v,x:v.x+100},w,h,st,layer,e);
 assert(Math.abs((p.x-moved.x)-100*zoom/(1+z*d/E.D0_METERS))<1e-9,`${layer} pan at ${zoom}`);
}
assert.equal(E.ratio(st,'L1',.16),1,'L1 remains the exact existing world transform');
assert.equal(E.ratio(st,'L1',1.65),1,'L1 zoom remains unchanged');
// Original Stage 3/4 trees used almost the same viewport height while
// depthPan assigned unrelated motion. The authored replacements share H=8 m.
assert(height(near)/height(far)>1.25,'The former equal-height contradiction is removed');
const invalid=JSON.parse(JSON.stringify(project));invalid.stages[2].environment.placements[0].depthLayer='L5';invalid.library.find(a=>a.id==='ancient_pine').reference=null;
assert(E.validate(invalid).some(e=>e.text.includes('invalid scenery layer')));
assert(E.validate(invalid).some(e=>e.text.includes('reference height')));
console.log(`PASS environment projection and classification: ${project.stages.length} maps, ${project.stages.reduce((n,s)=>n+s.environment.placements.length,0)} placements`);
