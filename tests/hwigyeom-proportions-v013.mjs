/** Exact artwork retargeting and production rig checks; not browser/input QA. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createCanvas,Path2D} from '@napi-rs/canvas';
import {createParty} from '../tools/party-forge/recipes.mjs';
import {refineHwigyeomScale,HWIGYEOM_SCALE} from '../tools/party-forge/hwigyeom-scale.mjs';
import {pathBounds,paintedBounds} from '../tools/party-forge/shape-bounds.mjs';

const read=p=>readFile(p,'utf8'),plain=x=>JSON.parse(JSON.stringify(x));
const hash=x=>createHash('sha256').update(typeof x==='string'?x:JSON.stringify(x)).digest('hex');
const close=(a,b,label,epsilon=1e-6)=>assert(Math.abs(a-b)<epsilon,`${label}: ${a} != ${b}`);
const vector=(a,b,label,epsilon=1e-6)=>{assert.equal(a.length,b.length,label);a.forEach((n,i)=>close(n,b[i],`${label}[${i}]`,epsilon));};
const rows=[],check=(name,fn)=>{fn();rows.push(name);console.log('PASS',name);};
const g=vm.createContext({console,structuredClone,Path2D});
vm.runInContext(await read('shared/runtime/party-rig.js'),g);
const baseline=JSON.parse(await read('tests/fixtures/party-baseline.json')),input=await read(baseline.source);
assert.equal(hash(input.replace(/\r\n/g,'\n')),baseline.sha256,'The original v006 authoring source is immutable');
// The legacy bundle contains its own old renderer. Keep it in a separate
// context so all measurements and authoring use the production rig above.
const legacy={};vm.runInNewContext(input,legacy);
const R=g.HonroVectorRig,original=structuredClone(legacy.HONRO_PARTY);
const production={};vm.runInNewContext(await read('shared/assets/party/party.runtime.js'),production);
g.productionParty=production.HONRO_PARTY;g.adapterSource=await read('shared/assets/rebuild-game-adapter.mjs');
const beforeParty=createParty(original,R,{hwigyeomScale:false}),afterParty=createParty(original,R);
const before=beforeParty.hwigyeom,after=afterParty.hwigyeom;
const by=a=>Object.fromEntries(a.rig.parts.map(p=>[p.id,p])),oldBy=by(before),newBy=by(after);
const anchor=before.canvas.anchor,body=p=>p.map((v,i)=>anchor[i]+(v-anchor[i])*1.05);
const oldHead=oldBy.head.pivot,newHead=body(oldHead),head=p=>p.map((v,i)=>newHead[i]+(v-oldHead[i])*.95);
const weaponDelta=body(before.rig.handSockets.front).map((v,i)=>v-oldBy.weapon.pivot[i]);
const isHead=part=>['head','hair_tail'].includes(part),transform=part=>isHead(part)?head:part==='weapon'?p=>p.map((v,i)=>v+weaponDelta[i]):body;
const numbers=d=>(d.match(/[-+]?(?:\d*\.)?\d+/g)||[]).map(Number);

check('The pre-overlay face, costume, legs and soles retain the ec4e9a2 reviewed artwork',()=>{
 // Hand/grip changes are independently authorized in v013, so they are not
 // confused with the preserved face/costume baseline or the scale multiplier.
 const bodyParts=['thorax','neck','pelvis','rear_thigh','front_thigh','rear_shin','front_shin','rear_cloth','front_cloth','belt','ribbon','prop_hip','rear_foot','front_foot'];
 assert.equal(hash(before.paths.filter(p=>isHead(p.part))),'ace75d205791db02e3eddbd3b1464ba90af80479d37d37aa454ddc05ce5408f5');
 assert.equal(hash(before.paths.filter(p=>bodyParts.includes(p.part))),'17e70c796ec933a7e08ad4d481658faa62a66b32a53d507f4b14822f8627b87c');
 vector(oldBy.head.pivot,[240,70.198047],'ec4 head pivot');
 vector(before.canvas.anchor,[240,480],'ec4 sole anchor');
});

check('Every head/face/hair/gat dimension is 95%, every body dimension is 105%, sword stays 100%',()=>{
 assert.equal(HWIGYEOM_SCALE.body,1.05);assert.equal(HWIGYEOM_SCALE.head,.95);
 assert.deepEqual(after.paths.map(p=>p.id),before.paths.map(p=>p.id));
 assert.deepEqual(after.palette,before.palette);
 for(const p of after.paths){
  const q=before.paths.find(q=>q.id===p.id),a=numbers(p.d),b=numbers(q.d),map=transform(p.part);
  assert.equal(p.d.replace(/[^MLQCZ]/g,''),q.d.replace(/[^MLQCZ]/g,''),p.id+' path topology');
  assert.equal(a.length,b.length,p.id+' control-point count');
  for(let i=0;i<a.length;i+=2)vector(a.slice(i,i+2),map(b.slice(i,i+2)),p.id+' exact affine point',.000051);
  const k=isHead(p.part)?.95:p.part==='weapon'?1:1.05,oldBounds=pathBounds(q.d),newBounds=pathBounds(p.d);
  for(const axis of [0,1])close(newBounds[axis+2]-newBounds[axis],(oldBounds[axis+2]-oldBounds[axis])*k,p.id+' dimension '+axis,.00011);
  close(p.strokeWidth||0,(q.strokeWidth||0)*k,p.id+' stroke');
  for(const key of ['part','fill','stroke','detail'])assert.equal(p[key],q[key],p.id+' '+key);
 }
});

check('Rig, hand sockets and facial/portrait metadata match the same affine transforms',()=>{
 for(const p of after.rig.parts)vector(p.pivot,transform(p.id)(oldBy[p.id].pivot),p.id+' pivot');
 vector(after.rig.bindThorax,body(before.rig.bindThorax),'bind thorax');
 for(const side of ['front','rear'])vector(after.rig.handSockets[side],body(before.rig.handSockets[side]),side+' palm socket');
 assert.deepEqual(newBy.weapon.pivot,after.rig.handSockets.front);
 for(const [name,p]of Object.entries(before.face.landmarks))vector(after.face.landmarks[name],head(p),'face '+name);
 for(const name of ['crown','chin'])vector(after.face.anatomy[name],head(before.face.anatomy[name]),name);
 vector(after.face.authoringMap.to,head(before.face.authoringMap.to),'sheet map destination');
 close(after.face.authoringMap.scale,before.face.authoringMap.scale*.95,'sheet map scale');
 for(const key of ['from','sign','eye','farEye','nose','mouth'])assert.deepEqual(after.face.authoringMap[key],before.face.authoringMap[key]);
 assert.deepEqual(after.face.shapeIds,before.face.shapeIds);
 vector(after.portrait.headBounds,paintedBounds(after,R,{filter:p=>isHead(p.part)}),'portrait actual head bounds');
 close(after.proportions.width,before.proportions.width*1.05,'width metadata');
 close(after.proportions.height,before.proportions.height*1.05,'height metadata');
 close(after.proportions.headScale,before.proportions.headScale*.95,'head metadata');
 vector(after.proportions.hwigyeomScale.anchor,anchor,'metadata anchor');
 assert.equal(after.proportionsRevision,13);
});

check('All animation targets are retargeted, while angles, contacts and event timing stay unchanged',()=>{
 for(const [name,clip]of Object.entries(before.animation.animations)){
  const current=after.animation.animations[name];
  assert.deepEqual({...current,keyframes:undefined},{...clip,keyframes:undefined},name+' clip metadata');
  assert.equal(current.keyframes.length,clip.keyframes.length);
  for(let i=0;i<clip.keyframes.length;i++){
   const expected=R.completePose(before,clip.keyframes[i]),actual=current.keyframes[i];
   assert.deepEqual(Object.keys(actual),Object.keys(expected),name+' complete target keys');
   for(const [key,value]of Object.entries(expected)){
    if(Array.isArray(value)&&value.length===2&&value.every(Number.isFinite))vector(actual[key],body(value),`${name}/${i}/${key}`);
    else assert.deepEqual(actual[key],value,`${name}/${i}/${key}`);
   }
  }
 }
});

const metrics={samples:0,gripGap:0,jointGap:0,rigidityError:0,reach:0,idleSoleDrift:0,idleFootDrift:0,loopError:0};
check('1,205 pose samples preserve planted soles, zero grip gap, rigid sword/head and connected limbs',()=>{
 const initial=R.rigMatrices(after,R.sampleAnimation(after,'idle',0,true).poses);
 const beforeSole=paintedBounds(before,R,{filter:p=>p.part.endsWith('_foot')})[3];
 close(beforeSole,anchor[1],'reviewed painted sole');
 for(const name of Object.keys(after.animation.animations))for(let i=0;i<=240;i++){
  const sample=R.sampleAnimation(after,name,i/240,true),m=R.rigMatrices(after,sample.poses);
  metrics.samples++;assert(Object.values(m).flat().every(Number.isFinite));
  const grip=R.point(m.weapon,newBy.weapon.pivot),palm=R.point(m.front_hand,after.rig.handSockets.front);
  metrics.gripGap=Math.max(metrics.gripGap,Math.hypot(...grip.map((v,j)=>v-palm[j])));
  metrics.reach=Math.max(metrics.reach,...Object.values(sample.guide.reach));
  for(const part of ['head','weapon']){const h=m[part];metrics.rigidityError=Math.max(metrics.rigidityError,Math.abs(Math.hypot(h[0],h[1])-1),Math.abs(Math.hypot(h[2],h[3])-1),Math.abs(h[0]*h[2]+h[1]*h[3]));}
  for(const side of ['front','rear']){
   for(const [upper,lower]of [[side+'_upper_arm',side+'_forearm'],[side+'_forearm',side+'_hand'],[side+'_thigh',side+'_shin'],[side+'_shin',side+'_foot']]){
    const p=newBy[lower].pivot,a=R.point(m[upper],p),b=R.point(m[lower],p);metrics.jointGap=Math.max(metrics.jointGap,Math.hypot(...a.map((v,j)=>v-b[j])));
   }
   if(name==='idle'){const part=side+'_foot',a=R.point(initial[part],newBy[part].pivot),b=R.point(m[part],newBy[part].pivot);metrics.idleFootDrift=Math.max(metrics.idleFootDrift,Math.hypot(...a.map((v,j)=>v-b[j])));}
  }
  if(name==='idle')metrics.idleSoleDrift=Math.max(metrics.idleSoleDrift,Math.abs(paintedBounds(after,R,{filter:p=>p.part.endsWith('_foot'),time:i/240})[3]-beforeSole));
 }
 for(const name of ['idle','move']){const a=R.rigMatrices(after,R.sampleAnimation(after,name,0,true).poses),b=R.rigMatrices(after,R.sampleAnimation(after,name,1,true).poses);for(const part of Object.keys(a))metrics.loopError=Math.max(metrics.loopError,...a[part].map((v,i)=>Math.abs(v-b[part][i])));}
 for(const key of ['gripGap','jointGap','rigidityError','idleSoleDrift','idleFootDrift','loopError'])assert(metrics[key]<1e-6,`${key}: ${metrics[key]}`);
 assert(metrics.reach<.1,`reach: ${metrics.reach}`);
});

check('Fixed game calibration, simulation actor data and the other three characters are unchanged',()=>{
 for(const key of ['viewBox','anchor','visualHeight'])assert.deepEqual(after.canvas[key],before.canvas[key]);
 assert.equal(after.canvas.visualHeight,425);
 assert(after.canvas.presentationHeight>=anchor[1]-after.portrait.headBounds[1]+8,'UI labels clear the enlarged body and complete head');
 for(const id of ['seol_o','damheo','sodan'])assert.deepEqual(afterParty[id],beforeParty[id],id+' visual overlay scope');
 vm.runInContext((g.adapterSource).replace(/^export /gm,'')+'\nglobalThis.HonroPoseVisual=HonroPoseVisual;',g);
 const visual=new g.HonroPoseVisual(after,R),actor={id:'hwigyeom-proportion-check',side:0,cls:'knight',x:15,y:27,h:92,r:20,facing:-1,angle:155,hp:100,mp:20},saved=structuredClone(actor);let height;
 visual.renderer={draw(_ctx,options){height=options.height;return {sample:options.sample};}};
 visual.draw({},actor,0);assert.equal(height,102,'same production draw height');assert.deepEqual(actor,saved,'rendering cannot change physics/hitbox actor data');
});

check('The generated runtime contains this exact retarget and the generator is repeatable',()=>{
 const generated=g.productionParty.hwigyeom;
 for(const key of ['paths','rig','face','animation','canvas','portrait','proportions','proportionsRevision'])assert.deepEqual(plain(generated[key]),plain(after[key]),'generated '+key);
 assert.deepEqual(createParty(original,R).hwigyeom,after,'regenerating does not apply the scale twice');
 const twice=structuredClone(after);assert.throws(()=>refineHwigyeomScale(twice,R),/exactly once/);
});

const out='_local/reports/hwigyeom-proportions-v013';await mkdir(out,{recursive:true});
const sheet=createCanvas(1200,760),ctx=sheet.getContext('2d');ctx.fillStyle='#162a2e';ctx.fillRect(0,0,sheet.width,sheet.height);ctx.font='18px sans-serif';ctx.fillStyle='#eddfbd';
ctx.fillText('Hwigyeom: reviewed base / head 95% + body 105%',22,32);
ctx.strokeStyle='#5d746e';ctx.beginPath();ctx.moveTo(20,706);ctx.lineTo(1180,706);ctx.stroke();
for(const [index,asset]of [before,after].entries()){ctx.fillStyle='#eddfbd';ctx.fillText(index?'v013: sword size and game scale unchanged':'Before scale: same motion and anatomy',30+index*600,67);R.createCanvasRenderer(asset).draw(ctx,{x:230+index*600,y:706,height:490,time:0,normalized:true,detail:2});}
await writeFile(`${out}/before-after.png`,sheet.toBuffer('image/png'));
await writeFile(`${out}/summary.json`,JSON.stringify({status:'passed',checks:rows,metrics,proportions:after.proportions.hwigyeomScale,limits:['Native Canvas and numerical production-rig checks; excludes browser DOM/input and normal gameplay.']},null,2)+'\n');
console.log('HWIGYEOM PROPORTIONS V013 PASS',rows.length,JSON.stringify(metrics));
