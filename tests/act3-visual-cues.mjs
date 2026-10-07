// Pure shared-renderer cue tests with a recording Canvas. No engine build,
// bitmap approval, browser or normal-play claim.
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const project=JSON.parse(await readFile('shared/data/campaign.json','utf8')),balance=JSON.parse(await readFile('game/config/balance.json','utf8'));
const g=vm.createContext({structuredClone,HONRO_CORE:{poly:t=>t.vertices},HONRO_BALANCE:balance,HONRO_CONTENT:{stages:Array.from({length:20},(_,i)=>({id:i+1})),acts:[],hero:{archer:{name:'설오'},mage:{name:'담허'},knight:{name:'휘겸'},occultist:{name:'소단'}}},HonroWorld:{archetypes:{}}});
for(const file of ['act3-content','act3-objectives','renderer','act3-art'])vm.runInContext(await readFile(`shared/runtime/${file}.js`,'utf8'),g);
const source=project.stages.find(s=>s.metadata.stageId===27),b={honroStage:27,honroState:{act3:{done:{},holds:{}}},honroAct3Steps:g.HONRO_CONTENT.stages[26].steps,honroMarkers:structuredClone(source.markers),units:[{id:'p-mage',cls:'mage',side:0,hp:500,x:0,y:0}],active:'p-mage',terrain:source.terrains.filter(t=>t.properties?.honroAct3Target).map(t=>({...t.properties,id:t.id,vertices:t.points,x:Math.min(...t.points.map(p=>p.x)),y:Math.min(...t.points.map(p=>p.y)),w:Math.max(...t.points.map(p=>p.x))-Math.min(...t.points.map(p=>p.x)),h:Math.max(...t.points.map(p=>p.y))-Math.min(...t.points.map(p=>p.y))}))};
const scene=Object.assign(Object.create(g.HonroScene.prototype),{scale:.5,time:2,x:2000,y:2200,size:()=>({w:1200,h:800})});
function draw(){const calls=[],ctx=new Proxy({},{get:(o,k)=>k==='createRadialGradient'? (...args)=>{calls.push([k,...args]);return{addColorStop(){}};}:k in o?o[k]:(...args)=>calls.push([k,...args]),set:(o,k,v)=>(o[k]=v,true)});const before=JSON.stringify(b);g.HonroAct3Art.draw(ctx,scene,b);assert.equal(JSON.stringify(b),before,'art never initializes or changes objective state');return calls;}
let calls=draw();assert.equal(calls.filter(c=>c[0]==='createRadialGradient').length,2);for(const id of ['fire-west','fire-east']){const p=g.HonroAct3.marker(b,id);assert(p);assert(calls.some(c=>c[0]==='translate'&&c[1]===p.x&&c[2]===p.y-8),'flame uses actual '+id);}
b.honroState.act3.done['water-release']=true;calls=draw();assert.equal(calls.filter(c=>c[0]==='createRadialGradient').length,1);b.honroState.act3.done['fire-screen']=true;calls=draw();assert.equal(calls.filter(c=>c[0]==='createRadialGradient').length,0);
assert(calls.some(c=>c[0]==='fillRect'&&c[1]===-67&&c[2]===-8),'charred timbers remain after both fires are controlled');
assert(!calls.some(c=>c[0]==='bezierCurveTo'),'controlled fires emit no smoke');
const health=scene.terrainHealthTargets(b).find(t=>t.id==='water-release');assert(health);assert.equal(health.label,'수문 고정구 끊어 서쪽 불길 막기');assert.equal(health.blocked,'설오의 사격 필요');
const empty=structuredClone(b);delete empty.honroState.act3;const before=JSON.stringify(empty);g.HonroAct3Art.guide(empty);assert.equal(JSON.stringify(empty),before,'raw display queries stay pure before lifecycle initialization');
console.log('PASS Act 3 cue purity, two authored fire sites, independent extinguishing, exact control labels and class hints');
