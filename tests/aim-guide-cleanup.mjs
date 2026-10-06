/** Production path/area checks and native Canvas evidence, not a browser test. */
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createCanvas} from '@napi-rs/canvas';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE,rows=[];
assert.equal(C.drawTerrainGuideContact,undefined);
for(const file of ['shared/engine/src/skillVisuals.ts','shared/engine/src/art.ts','shared/runtime/renderer.js'])assert(!/지형에\s*막힘/.test(await readFile(file,'utf8')));
function fixture(id){
 const {b,e}=battlefield(g,1),u=e.active;
 Object.assign(u,{cls:C.SKILLS[id].cls,x:1000,y:1900,h:92,angle:0,loadout:[id],lastPower:.8,ranks:{[id]:1},vx:0,vy:0,airborne:false});
 Object.assign(b,{width:3000,height:2400,wind:0,units:[u],waters:[],fields:[],zones:[],drafts:[],projectiles:[],terrain:[
  {id:'floor',x:0,y:1900,w:3000,h:500,mat:'rock',hp:99999,maxHp:99999},
  {id:'wall',x:1110,y:1700,w:100,h:200,mat:'rock',hp:99999,maxHp:99999,indestructible:true}
 ]});b.sceneVersion++;return{b,e,u};
}
function traceContext(){
 const calls=[],strokes=[],arcs=[],state={};let path=[],dash=[];
 const c=new Proxy({
  createLinearGradient(){return {addColorStop(){}};},createRadialGradient(){return {addColorStop(){}};},
  beginPath(){path=[];},moveTo(x,y){path.push(['moveTo',x,y]);},lineTo(x,y){path.push(['lineTo',x,y]);},
  setLineDash(value){dash=[...value];},stroke(){strokes.push({path:[...path],dash:[...dash],width:state.lineWidth,alpha:state.globalAlpha});},arc(...args){arcs.push(args);}
 },{get:(o,k)=>k in o?o[k]:k in state?state[k]:(...args)=>calls.push([k,...args]),set:(o,k,v)=>(state[k]=v,true)});
 return {calls,strokes,arcs,c};
}
for(const id of ['A01','A02','A07','A10','M01','M02','M05','M13','O01','O02','O04','O05','O06','O07']){
 const {b,e,u}=fixture(id),s=C.SKILLS[id],before=JSON.stringify(b),pr=C.guidePrediction(e,u,s,.8),trace=traceContext(),renderer=Object.create(C.Renderer.prototype);
 Object.assign(renderer,{time:0,scale:.68});renderer.predictionGuide(trace.c,e,u,id,.8,true);
 assert.equal(JSON.stringify(b),before,`${id} guide mutated battle`);
 const isX=p=>p.length===4&&p[0][0]==='moveTo'&&p[1][0]==='lineTo'&&p[2][0]==='moveTo'&&p[3][0]==='lineTo'&&Math.abs((p[0][1]+p[1][1])/2-pr.x)<1e-6&&Math.abs((p[0][2]+p[1][2])/2-pr.y)<1e-6&&Math.abs(p[1][1]-p[0][1])>0&&Math.abs(p[1][2]-p[0][2])>0;
 assert(!trace.strokes.some(x=>isX(x.path)),`${id} still draws a terminal X`);
 assert(!trace.calls.some(x=>['fillText','strokeText'].includes(x[0])&&/막힘/.test(x[1])),`${id} blocked text`);
 if(pr.points.length>1)assert(trace.strokes.some(x=>x.dash.length&&x.path.length===pr.points.length&&x.path.every((p,i)=>p[1]===pr.points[i].x&&p[2]===pr.points[i].y)),`${id} lost exact dotted trajectory`);
 const radius=e.effective(s,u).radius;
 if(radius&&s.branch!=='stake'&&!('geometry' in pr))assert(trace.arcs.some(a=>a[0]===pr.x&&a[1]===pr.y&&a[2]===radius),`${id} lost blast radius`);
 rows.push({skill:id,endpoint:[pr.x,pr.y],terrain:pr.terrain||null,points:pr.points.length,radius,arcs:trace.arcs.length});
}
// Deterministic prediction fixture invokes the production continuation directly.
const first={points:[{x:0,y:0},{x:10,y:5}],unit:'target',x:10,y:5},extended={points:[{x:0,y:0},{x:10,y:5},{x:30,y:9},{x:50,y:14}],x:50,y:14};
for(const zoom of [.12,.68,1,2]){
 const u={cls:'archer',x:0,y:0,h:90,angle:0,ranks:{}},s=C.SKILLS.A01,b={shot:0,rng:1,sceneVersion:0,wind:0,units:[]},e={b,predict(...args){return args[7]?extended:first;}},trace=traceContext(),before=JSON.stringify(b);
 C.drawGuideContinuation(trace.c,e,u,s,.8,zoom);assert.equal(trace.strokes.length,1);const stroke=trace.strokes[0];assert.equal(stroke.width,.7/Math.max(.12,zoom));assert.equal(stroke.alpha,.38);assert.equal(stroke.dash.length,0);assert.equal(JSON.stringify(stroke.path),JSON.stringify([['moveTo',10,5],['lineTo',10,5],['lineTo',30,9],['lineTo',50,14]]));assert.equal(JSON.stringify(b),before);
 const primary=traceContext();C.guideStroke(primary.c,first.points,zoom);assert.equal(primary.strokes.at(-1).width,1.35/zoom);assert.equal(primary.strokes.at(-1).alpha,.64);
}
const out='_local/reports/aim-wind-audio';await mkdir(out,{recursive:true});
const canvas=createCanvas(1280,560),c=canvas.getContext('2d');c.fillStyle='#16272b';c.fillRect(0,0,1280,560);
for(const [i,id] of ['M01','M13','A07','O01'].entries()){
 const {e,u}=fixture(id),r=Object.create(C.Renderer.prototype);Object.assign(r,{time:0,scale:1});
 c.save();c.translate(i%2*640,Math.floor(i/2)*280);c.beginPath();c.rect(0,0,640,280);c.clip();c.save();c.translate(-860,-1690);c.fillStyle='#3c4b47';c.fillRect(1110,1700,100,200);c.fillRect(860,1900,640,60);r.predictionGuide(c,e,u,id,.8,true);c.restore();c.fillStyle='#16272b';c.fillRect(0,0,640,40);c.fillStyle='#e4d7b8';c.font='17px sans-serif';c.fillText(`${id}: trajectory and blast area retained; X/text removed`,15,26);c.restore();
}
await writeFile(`${out}/aim-guides.png`,canvas.toBuffer('image/png'));
await writeFile(`${out}/aim-guides.json`,JSON.stringify({passed:true,rows,continuation:{width:.7,alpha:.38,zoomCases:4},limitations:['Actual renderer paths and native Canvas samples; browser HUD and input remain separate.']},null,2)+'\n');
console.log('PASS 14 production guides and 4 continuation zoom cases: exact paths/radii, no X/text, unchanged battle');
