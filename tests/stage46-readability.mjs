/** Only stage46's internal collision-wall ink is omitted, never walking contacts. */
import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
class Path {commands=[];moveTo(x,y){this.commands.push(['M',x,y])}lineTo(x,y){this.commands.push(['L',x,y])}}
let painted;
class Scene {terrainReadability(c,b){painted=b.groups.map(g=>({id:g.id,edge:g.edge,top:g.top}));}}
const g={HonroScene:Scene,Path2D:Path,HonroTerrainReadability:{prepare:b=>({groups:b.groups})}};vm.runInNewContext(fs.readFileSync('shared/runtime/act5-edge-art.js','utf8'),g);
const edge=new Path(),top=new Path(),vertical={a:{x:192,y:980},z:{x:180,y:1548},walkable:false},walk={a:{x:172,y:1548},z:{x:1064,y:1548},walkable:true};
for(const stage of [46,45]){const groups=['a5-left-cliff','a5-right-cliff','a5-rim'].map(id=>({id,edge,top,segments:[vertical,walk]})),before=JSON.stringify(groups);new Scene().terrainReadability({}, {honroStage:stage,width:4096,height:6504,groups});assert.equal(JSON.stringify(groups),before);assert(groups.every(x=>x.edge===edge&&x.top===top));for(const p of painted){assert.equal(p.top,top);assert.equal(p.edge.commands.length,stage===46&&p.id!=='a5-rim'?2:4);}assert.equal(g.HonroEdgeClosureQA.walkableRemoved,0);}
console.log('PASS: stage46 only removes two internal nonwalking cliff outlines; walk rims, original paths and other stages retained');
