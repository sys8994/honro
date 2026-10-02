import assert from 'node:assert/strict';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
const g=await runtime({legacyMaps:false}),B=g.HonroBounds,C=g.HONRO_CORE,clone=v=>JSON.parse(JSON.stringify(v));
let count=0;const check=(name,fn)=>{fn();count++;console.log('PASS',name);};
check('Zoom limits depend on horizontal FOV and actor size, never map height',()=>{
 for(const w of [320,390,844,1440,2560]){const z=B.zoomLimits(w).min;assert(z*66>=7-1e-9);assert(w/z<=4200+1e-8);
  for(const height of [100,2200,5000,20000]){const st={width:1000,height},f=B.focus(st),v={x:0,y:0,scale:z};B.constrain(v,st);assert.deepEqual(clone(v),{x:0,y:0,scale:z});
   for(const h of [390,844,1100,1440]){const cover=B.visual(st,w,h);for(const x of [f.left,f.right])for(const y of [f.top,f.bottom]){const view=B.viewport({x,y,scale:z},w,h);assert(view.left>=cover.left&&view.right<=cover.right&&view.top>=cover.top&&view.bottom<=cover.bottom);}}}
 }
 assert(B.zoomLimits(390).min<.16);assert.equal(B.zoomLimits(390).min,B.zoomLimits(320).min);
});
check('Focus bounds are independent of viewport and valid through export/import',()=>{
 const p=clone(g.HONRO_PROJECT),st=p.stages[0];st.camera={focusBounds:{left:-400,top:-2000,right:6000,bottom:3000}};
 assert.deepEqual(clone(g.HonroMaps.finalize(JSON.parse(g.HonroMaps.serialize(p)))).stages[0].camera,st.camera);
 const b=g.HonroMaps.createBattle(st,p);assert.deepEqual(clone(B.focus(b)),st.camera.focusBounds);
 const before=JSON.stringify(b);B.constrain({x:1e8,y:-1e8,scale:.3},b);B.visual(b,390,1100);assert.equal(JSON.stringify(b),before);
 st.camera.focusBounds.right=10;assert(g.HonroMaps.validate(p).some(v=>v.level==='err'&&v.text.includes('focusBounds')));
});
function travel(e,u,target){let last=u.x,still=0;u.moveLeft=1e7;
 for(let i=0;i<26000;i++){e.walk(u,Math.sign(target-u.x),1/120);if(still>22&&e.grounded(u)){e.jump(u);still=0;}e.integrateBody(u,1/120);if(u.dead)break;if(Math.abs(target-u.x)<25&&e.grounded(u))return true;still=Math.abs(u.x-last)<.03?still+1:0;last=u.x;}return false;}
check('Stage 1 extension is a usable combat route and its actual exit completes the stage',()=>{
 const {b,e,st}=battlefield(g,1);assert.equal(b.width,5400);assert(b.terrain.some(t=>t.id==='ridge-east-extension'));
 assert(b.units.find(u=>u.id==='foe-2').x>4200);assert(b.honroMapAnchors.exit.x>5000);
 b.round=3;b.units=[e.active];assert(travel(e,e.active,5210),'new exit must be reachable');assert(g.HonroObjectives.state(b,st).complete);
 assert(travel(e,e.active,4050),'extension must also be traversable downhill');
});
check('New final ridge offers a long ballistic shot without changing damage or projectile rules',()=>{
 const {b,e}=battlefield(g,1),u=e.active,target=e.unit('foe-2');b.units=[u,target];
 u.x=3550;u.y=C.topAt(b.terrain.find(t=>t.id==='forest-floor'),u.x);let best=Infinity;
 for(let angle=10;angle<=80;angle+=2)for(let power=.2;power<=1;power+=.025){const p=e.predict(u,C.SKILLS.A01,angle,power,target,false);best=Math.min(best,Math.hypot(p.x-target.x,p.y-(target.y-target.h*.5)));}
 assert(target.x-u.x>1200);assert(best<95,`long shot miss ${best}`);
});
check('Camera math does not cut trajectories when they cross the playable rectangle',()=>{
 const {b,e}=battlefield(g,1),u=e.active;b.terrain=[];b.units=[u];u.x=45;u.y=1300;
 const before=e.predict(u,C.SKILLS.A01,150,.5);assert(before.points.some(p=>p.x<0));
 const copy=JSON.stringify(b);for(let i=0;i<50;i++){const v={x:i*300,y:-i*25,scale:B.zoomLimits(390).min};B.constrain(v,b);B.visual(b,390,1100,v.scale);}
 assert.equal(JSON.stringify(b),copy);assert.deepEqual(e.predict(u,C.SKILLS.A01,150,.5),before);
});
console.log('CAMERA BOUNDS LOGIC PASS',count);
