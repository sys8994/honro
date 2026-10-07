// Pure schema VM, matching legacy migration's deliberate lack of Geometry.
// No engine compilation, rendering, browser, or gameplay-fixture exceptions.
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const g=vm.createContext({HONRO_CORE:{},HonroEnvironment:{VERSION:1,makeEnvironment:()=>({}),validate:()=>[]},HonroBounds:{validate:()=>[]},HonroUnits:{has:()=>true,teams:{player:0}}});
vm.runInContext(await readFile(new URL('../shared/map/schema.js',import.meta.url),'utf8'),g);
assert.equal(g.HonroGeometry,undefined,'The importer intentionally has no geometry module');
const cases=[];
for(const type of ['solid','platform'])for(const oneWay of [undefined,false,true,'true',1])for(const ceiling of [false,true]){
 const t={id:'test-terrain',type,points:[{x:0,y:500},{x:100,y:500},{x:100,y:600},{x:0,y:600}],control:[{x:0,y:500},{x:100,y:500}],properties:{honroCeiling:ceiling},...(oneWay===undefined?{}:{oneWay})};
 const st=g.HonroMaps.emptyStage('test-stage');st.terrains=[t];st.units=[{id:'player',kind:'archer',team:'player',x:50,y:500}];
 const project=g.HonroMaps.normalize({schema:'honro-map',version:6,environmentVersion:1,library:[],stages:[st],activeStageId:st.id}),snapshot=JSON.stringify(project);
 const errors=()=>g.HonroMaps.validate(project).filter(x=>x.level==='err'),invalidType=oneWay!==undefined&&typeof oneWay!=='boolean',oneWayDefault=oneWay===undefined?type==='platform':oneWay===true;
 const out=errors();assert.equal(out.some(x=>x.text.includes('must be boolean')),invalidType);assert.equal(out.some(x=>x.text.includes('ceiling')),ceiling&&oneWayDefault);assert.equal(out.length,Number(invalidType)+Number(ceiling&&oneWayDefault));assert.equal(JSON.stringify(project),snapshot,'Validation never rewrites an imported map');
 cases.push({t,project,errorText:JSON.stringify(out),oneWayDefault});
}
// The same schema still works beside a partial or fully loaded geometry API,
// and its ceiling decision agrees with the compiler's public pure helper.
g.HonroGeometry={};for(const c of cases)assert.equal(JSON.stringify(g.HonroMaps.validate(c.project).filter(x=>x.level==='err')),c.errorText);
vm.runInContext(await readFile(new URL('../shared/map/geometry.js',import.meta.url),'utf8'),g);
for(const c of cases){assert.equal(g.HonroGeometry.oneWay(c.t),c.oneWayDefault);assert.equal(JSON.stringify(g.HonroMaps.validate(c.project).filter(x=>x.level==='err')),c.errorText);}
console.log(`PASS ${cases.length} standalone platform/ceiling schema cases without, with partial, and with full Geometry`);
