/** Stage12 east play bound: only the x=6400 collision closures lose ink; walk rims and other stages keep theirs. */
import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
class Path {commands=[];moveTo(x,y){this.commands.push(['M',x,y])}lineTo(x,y){this.commands.push(['L',x,y])}}
const g={HonroScene:class{},Path2D:Path,HONRO_CORE:{poly:t=>t.vertices}};g.window=g;vm.runInNewContext(fs.readFileSync('shared/runtime/terrain-readability.js','utf8').replace("(function(G){","(function(G){G=globalThis;"),g);
const ground={id:'sq-lower-ground',x:0,y:2750,w:6400,h:3350,oneWay:false,vertices:[{x:0,y:4300},{x:5734,y:4310},{x:6400,y:4560},{x:6400,y:6100},{x:0,y:6100}]};
const bound=q=>q.groups[0].segments.filter(s=>s.a.x===6400&&s.z.x===6400);
for(const [stage,id,expect]of [[12,'stage-12',0],[13,'stage-13',1],[12,'custom',1]]){
 const b={honroStage:stage,honroCanonical:true,honroCustom:false,honroMapOrigin:'campaign',honroAuthoredId:id,width:6400,sceneVersion:1,terrain:[structuredClone(ground)]};
 const q=g.HonroTerrainReadability.prepare(b);assert.equal(bound(q).length,expect);assert(q.groups[0].segments.some(s=>s.walkable&&s.z.x===6400));}
console.log('PASS: stage12 drops only east play-bound closure ink; walk rim and other maps retained');
