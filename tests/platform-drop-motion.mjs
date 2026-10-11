// Native Canvas inspection of the real engine + production four-party pose adapter.
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createCanvas,Path2D} from '@napi-rs/canvas';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE,base=battlefield(g,11).b;
g.Path2D=Path2D;for(const file of ['shared/runtime/party-rig.js','shared/assets/party/party.runtime.js','shared/assets/rebuild-game-adapter.mjs'])vm.runInContext((await readFile(file,'utf8')).replace(/^export /gm,'')+(file.endsWith('adapter.mjs')?'\nglobalThis.HonroPoseVisual=HonroPoseVisual;':''),g);
const R=g.HonroVectorRig,classes={seol_o:'archer',damheo:'mage',hwigyeom:'knight',sodan:'occultist'},out='_local/reports/platform-drop',rows=[];
await mkdir(out,{recursive:true});
function metrics(asset,sample){const m=R.rigMatrices(asset,sample.poses),parts=Object.fromEntries(asset.rig.parts.map(p=>[p.id,p]));let joints=0,rigid=0;for(const side of ['rear','front'])for(const [a,b]of [[side+'_upper_arm',side+'_forearm'],[side+'_forearm',side+'_hand'],[side+'_thigh',side+'_shin'],[side+'_shin',side+'_foot']]){const p=parts[b].pivot,aa=R.point(m[a],p),bb=R.point(m[b],p);joints=Math.max(joints,Math.hypot(aa[0]-bb[0],aa[1]-bb[1]));}for(const key of ['head','weapon']){const a=m[key];rigid=Math.max(rigid,Math.abs(Math.hypot(a[0],a[1])-1),Math.abs(Math.hypot(a[2],a[3])-1),Math.abs(a[0]*a[2]+a[1]*a[3]));}const w=R.point(m.weapon,parts.weapon.pivot),h=R.point(m.front_hand,parts.weapon.pivot);return{joints,rigid,grip:Math.hypot(w[0]-h[0],w[1]-h[1]),feet:Object.fromEntries(['rear','front'].map(side=>[side,R.point(m[side+'_foot'],parts[side+'_foot'].pivot)])),reach:Math.max(...Object.values(sample.guide.reach))};}
for(const facing of [1,-1]){
 const cv=createCanvas(2200,1160),ctx=cv.getContext('2d');ctx.fillStyle='#12252b';ctx.fillRect(0,0,cv.width,cv.height);ctx.fillStyle='#f1dfbc';ctx.font='18px sans-serif';ctx.fillText(`Platform drop: anticipation, support release, descent, grounded recovery (${facing>0?'right':'left'})`,16,27);
 let row=0;
 for(const [id,cls]of Object.entries(classes)){
  const b=structuredClone(base),u=b.units.find(u=>u.side===0&&u.cls===cls);Object.assign(u,{x:700,y:800,vx:0,vy:0,jumping:false,airborne:false,acted:false,moving:0,anim:0,hurt:0,facing});Object.assign(b,{units:[u],active:u.id,phase:'aim',side:0,terrain:[{id:'top',x:300,y:800,w:1000,h:30,mat:'wood',hp:99999,maxHp:99999,oneWay:true},{id:'bottom',x:0,y:1060,w:2200,h:1000,mat:'rock',hp:99999,maxHp:99999}],width:2400,height:3000,waters:[],projectiles:[],drafts:[]});b.sceneVersion++;const e=new C.Engine(b);e.checkEnd=()=>false;const asset=g.HONRO_PARTY[id],v=new g.HonroPoseVisual(asset,R),idle=R.sampleAnimation(asset,'idle',0,true),idleM=metrics(asset,idle);
  const schedule=[['prepare',0],['prepare',.06],['prepare',.12],['prepare',.17],['fall',.03],['fall',.09],['fall',.30],['land',0],['land',.065],['land',.23]];let next=0,previous=null,maxTravel=0;
  assert(e.drop());
  for(let tick=0;tick<600;tick++){
   const time=tick/240;if(tick)e.integrateBody(u,1/240);v.update(e,time,1/240);const before=JSON.stringify(u),{sample,state}=v.pose(u,0),m=metrics(asset,sample);assert.equal(JSON.stringify(u),before);
   for(const key of ['joints','rigid','grip'])assert(m[key]<1e-6,`${id} ${state.mode} ${key}`);assert(m.reach<.3,`${id} ${state.mode} reach ${m.reach}`);
   if(u.platformDrop?.phase==='prepare'||u.platformDrop?.phase==='land')for(const side of ['rear','front'])assert(Math.hypot(...m.feet[side].map((x,i)=>x-idleM.feet[side][i]))<1e-6,`${id} planted ${side}`);
   if(u.platformDrop?.phase==='fall')assert.equal(sample.guide.contacts.length,0);
   if(previous)for(const key of ['pelvis','frontHand','rearHand'])maxTravel=Math.max(maxTravel,Math.hypot(...sample.targets[key].map((x,i)=>x-previous[key][i])));previous=structuredClone(sample.targets);
   if(next<schedule.length&&u.platformDrop?.phase===schedule[next][0]&&u.platformDrop.elapsed+1e-7>=schedule[next][1]){
    const x=next*220,y=42+row*278;ctx.save();ctx.beginPath();ctx.rect(x,y,220,278);ctx.clip();ctx.fillStyle='#d8d0b7';ctx.font='12px sans-serif';ctx.fillText(`${id} ${state.mode}`,x+8,y+19);ctx.fillText(`${Math.round(u.platformDrop.elapsed*1000)} ms · feet ${u.y.toFixed(1)}`,x+8,y+36);
    ctx.strokeStyle='#829c8a';ctx.beginPath();ctx.moveTo(x+10,y+252);ctx.lineTo(x+210,y+252);ctx.stroke();v.renderer.draw(ctx,{x:x+110,y:y+252,height:165,facing,sample,detail:2});ctx.restore();rows.push({id,facing,time,phase:u.platformDrop.phase,elapsed:u.platformDrop.elapsed,feetY:u.y,mode:state.mode,metrics:m,targets:sample.targets});next++;
   }
  }
  assert.equal(next,schedule.length);rows.push({id,facing,maxTravel});row++;global.gc?.();
 }
 await writeFile(`${out}/motion-${facing>0?'right':'left'}.png`,cv.toBuffer('image/png'));cv.width=cv.height=1;global.gc?.();
}
// Keep identical world/camera coordinates in every panel, so support release
// and arrival on the lower floor can be inspected independently of a pose sheet.
const world=createCanvas(1440,1760),wc=world.getContext('2d');wc.fillStyle='#15262b';wc.fillRect(0,0,1440,1760);
let wr=0;
for(const [id,cls]of Object.entries(classes)){
 const b=structuredClone(base),u=b.units.find(u=>u.side===0&&u.cls===cls);Object.assign(u,{x:700,y:800,vx:0,vy:0,jumping:false,airborne:false,acted:false,moving:0,anim:0,hurt:0,facing:1});Object.assign(b,{units:[u],active:u.id,phase:'aim',side:0,terrain:[{id:'top',x:300,y:800,w:1000,h:30,mat:'wood',hp:99999,maxHp:99999,oneWay:true},{id:'bottom',x:0,y:980,w:2200,h:1000,mat:'rock',hp:99999,maxHp:99999}],width:2400,height:3000,waters:[],projectiles:[],drafts:[]});b.sceneVersion++;const e=new C.Engine(b);e.checkEnd=()=>false;const asset=g.HONRO_PARTY[id],v=new g.HonroPoseVisual(asset,R),schedule=[['prepare',.13],['fall',.035],['fall',.14],['fall',.36],['land',0],['land',.13]];let next=0;assert(e.drop());
 for(let tick=0;tick<600&&next<schedule.length;tick++){
  const time=tick/240;if(tick)e.integrateBody(u,1/240);v.update(e,time,1/240);const {sample,state}=v.pose(u);
  if(u.platformDrop?.phase!==schedule[next][0]||u.platformDrop.elapsed+1e-7<schedule[next][1])continue;
  const x=next*240,y=wr*440,z=1.25,top=y+166,foot=top+(u.y-800)*z;
  wc.save();wc.beginPath();wc.rect(x,y,240,440);wc.clip();wc.fillStyle='#e9ddbd';wc.font='12px sans-serif';wc.fillText(`${id} ${state.mode} +${Math.round(u.platformDrop.elapsed*1000)}ms`,x+8,y+22);wc.fillText(`Native Canvas · world feet ${u.y.toFixed(1)}`,x+8,y+42);
  wc.fillStyle='#534638';wc.fillRect(x+14,top,212,30*z);wc.fillStyle='#394842';wc.fillRect(x+14,top+180*z,212,50);wc.strokeStyle='#b2a583';wc.lineWidth=2;for(const yy of [top,top+180*z]){wc.beginPath();wc.moveTo(x+14,yy);wc.lineTo(x+226,yy);wc.stroke();}
  v.renderer.draw(wc,{x:x+120,y:foot,height:u.h*z,facing:1,sample,detail:2});wc.fillStyle='#d4c699';wc.beginPath();wc.arc(x+120,foot,2.2,0,Math.PI*2);wc.fill();wc.restore();next++;
 }
 assert.equal(next,schedule.length);wr++;
}
await writeFile(`${out}/world-descent.png`,world.toBuffer('image/png'));
await writeFile(`${out}/motion.json`,JSON.stringify({rows,scope:'Production engine+rig, Native Canvas; not browser presentation timing.'},null,2)+'\n');console.log('PASS 4 characters, 2 facings, planted anticipation and landing, unplanted descent, rigid joint/grip metrics');
