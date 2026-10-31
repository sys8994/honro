import assert from 'node:assert/strict';
import fs from 'node:fs';import vm from 'node:vm';
const g={document:{hidden:false},getComputedStyle:()=>({visibility:'visible'})};g.globalThis=g;
vm.runInNewContext(fs.readFileSync('shared/runtime/act4-pilot-combat.js','utf8'),g);
const P=g.HonroAct4PilotCombat,rect=(l,t,w,h)=>({left:l,top:t,right:l+w,bottom:t+h,width:w,height:h});
function setup(w,h,scale,boxes=[]){const scene={x:0,y:0,scale,canvas:{getBoundingClientRect:()=>rect(0,0,w,h),checkVisibility:()=>true},size:()=>({d:1})};const app={scene,root:{querySelectorAll:()=>boxes.map(b=>({getBoundingClientRect:()=>b}))},modal:{classList:{contains:()=>false}}};return {scene,app};}
for(const [w,h] of [[1440,900],[390,844],[844,390]])for(const scale of [.3,.7,1.4]){
 const {scene,app}=setup(w,h,scale);const center={x:0,y:0};const a=P.warningLayout(scene,app,center,{blast:65},150);assert(a,`center ${w}x${h} scale ${scale}`);assert(a.panel.left>=4&&a.panel.right<=w-4);assert(a.panel.top>=4&&a.panel.bottom<=h-4);
 const edge={x:(-w/2+4)/scale,y:0};assert.equal(P.warningLayout(scene,app,edge,{blast:65},150),null,'clipped marker must not count');
 const blocked=setup(w,h,scale,[rect(w/2-40,h/2-40,80,80)]);assert.equal(P.warningLayout(blocked.scene,blocked.app,center,{blast:65},150),null,'UI over marker must not count');
}
const {scene,app}=setup(390,844,.3,[rect(0,0,390,70),rect(0,700,390,144)]);assert(P.warningLayout(scene,app,{x:0,y:0},{blast:65},160));assert.equal(P.warningLayout(scene,app,{x:0,y:0},{blast:65},500),null,'text too wide must not count');
const z=setup(390,844,.5,[rect(0,0,390,130)]);assert.equal(P.warningLayout(z.scene,z.app,{x:0,y:-700},{blast:65},150),null,'HUD-covered target is not an observation');
const c={save(){},restore(){},setTransform(){},measureText(){return {width:150}},setLineDash(){},beginPath(){},arc(){},stroke(){},moveTo(){},lineTo(){},fillRect(){},fillText(){}};
const mid={id:'mid',side:1,hp:100,honroPilotMidboss:'levee',honroPilotCombat:{phase:'telegraph',target:{x:0,y:0}}},battle={honroAct4Official:1,honroAct4Preview:31,round:2,teamEnds:[0,0],units:[mid]};
const blocked=setup(390,844,.5,[rect(150,380,90,90)]);g.HonroApp=blocked.app;P.draw(blocked.scene,c,battle);assert.equal(mid.honroPilotCombat.target.seen,undefined,'blocked target cannot set receipt');
const open=setup(390,844,.5);g.HonroApp=open.app;P.draw(open.scene,c,battle);assert.equal(mid.honroPilotCombat.target.seen,true,'complete rendered marker and label set receipt');
console.log('PASS warning layout: viewport/zoom/mobile/HUD bounds; adapter fixture only');
