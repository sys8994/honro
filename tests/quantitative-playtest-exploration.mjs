import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {buildCore} from '../game/engine/build.mjs';
import {PublicExplorer,publicObjective} from '../tools/quantitative-playtest/exploration.mjs';
import {RouteFollower,motionHost} from '../tools/quantitative-playtest/navigation.mjs';
import {objective} from '../tools/quantitative-playtest/policy.mjs';
assert.deepEqual(publicObjective('주변 위협을 제압하세요 · 남은 적 34명'),{instruction:'주변 위협을 제압하세요 · 남은 적 34명',remainingThreats:34,requiresThreatSearch:true});
assert(!publicObjective('살아 있는 동행 전원을 배 갑판에 모은 뒤 상호작용하세요').requiresThreatSearch);
assert.equal(objective({}, {x:1,y:2},31,publicObjective('남은 적 3명')).kind,'search-threats','Public kill-all objective must not resolve to dock');
const objectiveSource=await readFile('shared/runtime/act4-content.js','utf8'),start=objectiveSource.indexOf('function objectiveState(b){'),end=objectiveSource.indexOf('G.HonroAct4Content=',start);
assert(start>=0&&end>start);const productionObjective=vm.runInNewContext('(()=>{'+objectiveSource.slice(start,end)+';return objectiveState;})()');
const undisclosed={side:1,hp:10,dead:false};Object.defineProperties(undisclosed,{x:{get(){throw Error('HUD must not require hidden x');}},y:{get(){throw Error('HUD must not require hidden y');}}});
const publishedState=productionObjective({honroStage:31,phase:'aim',honroAct4PreviewState:{boat:{phase:'waiting'}},units:[{side:0,hp:10},undisclosed]});assert.equal(publicObjective(publishedState.currentInstruction).remainingThreats,1);assert.equal(publishedState.targets.length,0);
const g=vm.createContext({console,performance,structuredClone});vm.runInContext(await buildCore(),g);const C=g.HONRO_CORE;
const t=(id,x,y,w)=>({id,x,y,w,h:30,mat:'stone',oneWay:true,hp:1000,maxHp:1000});
const world={width:1900,height:900,sceneVersion:1,physics:C.makePhysics(),terrain:[t('low-shore',0,600,1850),t('upper-step',420,440,240),t('upper-court',720,280,280),t('high-lookout',1030,120,280)]};
Object.defineProperty(world,'units',{get(){throw Error('Hidden actor data is forbidden to exploration');}});
const body={id:'archer',cls:'archer',side:0,x:100,y:600,r:22,h:92,walkSpeed:320,maxMove:2200,moveLeft:2200,hp:1000,maxHp:1000,ranks:{A01:1},equipmentIds:[],facing:1,angle:45};
const explorer=new PublicExplorer(C),follower=new RouteFollower(C),{h,u}=motionHost(C,world,body),published=publicObjective('주변 위협을 제압하세요 · 남은 적 1명');
let discovered=false;const seenGoals=[],inputs=[];
for(let frame=0;frame<1800;frame++){
 const view={left:u.x-350,right:u.x+350,top:u.y-350,bottom:u.y+150};
 // Synthetic camera sensor alone owns the unknown actor; the policy gets no position before visibility.
 const sensor={id:'discovered-upper-threat',x:1100,y:120};const visible=sensor.x>=view.left&&sensor.x<=view.right&&sensor.y>=view.top&&sensor.y<=view.bottom?[sensor]:[];
 explorer.observe(world,u,view,visible);if(visible.length){discovered=true;break;}
 const goal=explorer.choose(world,u,published,{grounded:h.grounded(u)});assert.notEqual(goal.kind,'exploration-exhausted');assert.notEqual(goal.kind,'board');if(seenGoals.at(-1)?.key!==goal.key)seenGoals.push(goal);
 const intent=follower.intention(h,u,goal,{range:24});assert(!['blocked','end-turn'].includes(intent.kind),JSON.stringify(intent));
 if(intent.kind==='jump'){assert(h.jump(u));follower.accepted(u.id);inputs.push('jump');}if(intent.kind==='drop'){assert(h.drop(u));follower.accepted(u.id);inputs.push('drop');}
 if(['walk','jump','air-control'].includes(intent.kind)&&intent.direction)h.walk(u,intent.direction,C.STEP);assert(h.integrateBody(u,C.STEP,true));
}
assert(discovered,'Must discover upper threat through actual moving viewport, not coast-to-dock shortcut');assert(inputs.filter(x=>x==='jump').length>=2);assert(u.y<400,'Upper threat must require a genuinely elevated camera viewpoint');assert(u.x<1400,'Do not reach lower east dock before exploring upper court');assert.equal(u.hp,body.hp);
assert.equal(explorer.choose(world,u,publicObjective('선착장으로 이동하며 배가 도착하기를 기다리세요')),null,'Stop threat search only when published objective changes');
const exhausted=new PublicExplorer(C);exhausted.observe(world,u,{left:0,right:1900,top:0,bottom:900});for(const n of exhausted.nodes(world,u))exhausted.visited.add(n.key);assert.equal(exhausted.choose(world,u,published).kind,'exploration-exhausted');
console.log(JSON.stringify({status:'passed',inputs,discoveredAt:{x:u.x,y:u.y},goals:seenGoals.map(x=>({support:x.support,x:x.x,y:x.y})),observations:explorer.summary()}));
console.log('PASS published threat objective, hidden actor access forbidden, camera-led upper discovery, exhausted search fails closed');
