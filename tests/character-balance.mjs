/** Shared production rig + Native Canvas proof. Never represents browser input QA. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createCanvas,Path2D} from '@napi-rs/canvas';
import {guidanceRuntime} from './act2-guidance-helpers.mjs';
import {pathBounds,paintedBounds} from '../tools/party-forge/shape-bounds.mjs';
import {BALANCE} from '../tools/party-forge/balance.mjs';
import {buildParty} from '../tools/party-forge/build.mjs';
const out='_local/reports/character-balance';await mkdir(out,{recursive:true});
const read=p=>readFile(p,'utf8'),hash=p=>createHash('sha256').update(p).digest('hex'),plain=x=>x===undefined?undefined:JSON.parse(JSON.stringify(x));
const old={};vm.runInNewContext(await read('tests/fixtures/party-v009.runtime.js'),old);
const g=await guidanceRuntime(),R=g.HonroVectorRig,assets=g.HONRO_PARTY,rows=[],geometry=[];
// Browsers keep first-context alpha options. Native Canvas 0.1.100 instead
// changes drawImage's alpha behavior on a second getContext({alpha:false}).
// Match the browser contract only in this evidence harness.
function canvas(w=400,h=400){const c=createCanvas(w,h),ctx=c.getContext('2d');c.getContext=(type)=>{assert.equal(type,'2d');return ctx;};Object.defineProperties(c,{clientWidth:{get:()=>c.width},clientHeight:{get:()=>c.height}});c.getBoundingClientRect=()=>({left:0,top:0,width:c.width,height:c.height});return c;}
g.document.createElement=()=>canvas();
vm.runInContext(await read('shared/runtime/portraits.js'),g);
const check=(name,fn)=>{fn();rows.push({name,status:'passed'});console.log('PASS',name);};
const generated=await read('shared/assets/party/party.runtime.js');await buildParty();const rebuilt=await read('shared/assets/party/party.runtime.js');check('Committed source deterministically reproduces all four asset bundles',()=>assert.equal(rebuilt,generated));
for(const [id,a]of Object.entries(assets)){
 const previous=old.HONRO_PARTY[id],spec=BALANCE[id],by=Object.fromEntries(a.rig.parts.map(p=>[p.id,p])),beforeBy=Object.fromEntries(previous.rig.parts.map(p=>[p.id,p]));
 const matrix=R.rigMatrices(a,R.sampleAnimation(a,'idle',0,true).poses).head,crown=R.point(matrix,a.face.anatomy.crown),chin=R.point(matrix,a.face.anatomy.chin),sole=paintedBounds(a,R,{filter:p=>p.part.endsWith('_foot')})[3],beforeSole=paintedBounds(previous,R,{filter:p=>p.part.endsWith('_foot')})[3],bounds=paintedBounds(a,R),before=paintedBounds(previous,R),ratio=(sole-crown[1])/(chin[1]-crown[1]);
 const body=p=>['thorax','pelvis','rear_thigh','front_thigh','rear_cloth','front_cloth'].includes(p.part),bodyWidth=asset=>{const b=asset.paths.filter(body).map(p=>pathBounds(p.d));return Math.max(...b.map(p=>p[2]))-Math.min(...b.map(p=>p[0]));};
 const shoulder=asset=>{const ps=Object.fromEntries(asset.rig.parts.map(p=>[p.id,p]));return ps.front_upper_arm.pivot[0]-ps.rear_upper_arm.pivot[0];};
 check(id+': target adult head units, unchanged top/sole and calibrated game height',()=>{
  assert(Math.abs(ratio-spec.heads)<.001);assert(Math.abs(bounds[1]-before[1])<.001);assert(Math.abs(sole-beforeSole)<.001);assert.equal(a.canvas.visualHeight,previous.canvas.visualHeight);assert.equal(a.canvas.presentationHeight,previous.canvas.presentationHeight);assert.deepEqual(plain(a.canvas.anchor),plain(previous.canvas.anchor));
  assert(Math.abs(shoulder(a)/shoulder(previous)-spec.width)<.00001);assert(Math.abs(bodyWidth(a)/bodyWidth(previous)-spec.width)<.00001);
 });
 check(id+': facial identity, palette, path budget, weapon grip and animation timing preserved',()=>{
  assert.equal(a.paths.length,previous.paths.length);assert.deepEqual(plain(a.palette),plain(previous.palette));assert.deepEqual(plain(a.paths.map(p=>p.id)),plain(previous.paths.map(p=>p.id)));
  const scale=a.proportions.balance.headMultiplier,pivot=beforeBy.head.pivot,nextPivot=by.head.pivot;
  for(const p of a.paths.filter(p=>['head','hair_tail'].includes(p.part))){const q=previous.paths.find(q=>q.id===p.id),ns=d=>(d.match(/[-+]?(?:\d*\.)?\d+/g)||[]).map(Number),x=ns(p.d),y=ns(q.d);assert.equal(x.length,y.length);for(let i=0;i<x.length;i++)assert(Math.abs(x[i]-(nextPivot[i%2]+(y[i]-pivot[i%2])*scale))<.00006);assert.equal(p.fill,q.fill);assert.equal(p.stroke,q.stroke);}
  if(a.anatomyRevision){assert.equal(a.anatomyRevision,12);assert.deepEqual(plain(by.weapon.pivot),plain(a.rig.handSockets.front));for(const side of ['front','rear'])assert(Math.hypot(...a.rig.handSockets[side].map((v,i)=>v-by[side+'_hand'].pivot[i]))<12,'grip remains inside palm');}
  if(!a.anatomyRevision)for(let axis=0;axis<2;axis++){const expected=(beforeBy.weapon.pivot[axis]-beforeBy.front_hand.pivot[axis])*(id==='damheo'&&axis===1?a.proportions.balance.bodyHeightMultiplier:1);assert(Math.abs(by.weapon.pivot[axis]-by.front_hand.pivot[axis]-expected)<.000002,'weapon retains its authored grip offset');}
  if(!a.anatomyRevision&&id!=='damheo')for(const p of a.paths.filter(p=>p.part==='weapon')){const q=previous.paths.find(q=>q.id===p.id),ns=d=>(d.match(/[-+]?(?:\d*\.)?\d+/g)||[]).map(Number),x=ns(p.d),y=ns(q.d),delta=by.weapon.pivot.map((v,i)=>v-beforeBy.weapon.pivot[i]);for(let i=0;i<x.length;i++)assert(Math.abs(x[i]-y[i]-delta[i%2])<.00006,'rigid implement may translate, not deform');}
  for(const[name,clip]of Object.entries(previous.animation.animations)){const current=a.animation.animations[name];assert.equal(current.duration_ms,clip.duration_ms);assert.equal(current.loop,clip.loop);assert.deepEqual(plain(current.events),plain(clip.events));assert.deepEqual(plain(current.keyframes.map(f=>f.t)),plain(clip.keyframes.map(f=>f.t)));if(!a.motionRevision)for(let i=0;i<clip.keyframes.length;i++)for(const key of ['weapon','head','frontHandAngle','rearHandAngle','frontFootAngle','rearFootAngle'])assert.equal(current.keyframes[i][key],clip.keyframes[i][key]);}
 });
 let headError=0,jointGap=0,footDrift=0,reach=0,loopError=0;
 const idle=R.rigMatrices(a,R.sampleAnimation(a,'idle',0,true).poses);
 for(const name of Object.keys(a.animation.animations))for(let i=0;i<=100;i++){
  const s=R.sampleAnimation(a,name,i/100,true),m=R.rigMatrices(a,s.poses),h=m.head;headError=Math.max(headError,Math.abs(Math.hypot(h[0],h[1])-1),Math.abs(Math.hypot(h[2],h[3])-1),Math.abs(h[0]*h[2]+h[1]*h[3]));reach=Math.max(reach,...Object.values(s.guide.reach));
  for(const side of ['rear','front']){for(const [upper,lower]of [[side+'_upper_arm',side+'_forearm'],[side+'_forearm',side+'_hand'],[side+'_thigh',side+'_shin'],[side+'_shin',side+'_foot']]){const p=by[lower].pivot,x=R.point(m[upper],p),y=R.point(m[lower],p);jointGap=Math.max(jointGap,Math.hypot(x[0]-y[0],x[1]-y[1]));}if(name==='idle'){const p=by[side+'_foot'].pivot,x=R.point(m[side+'_foot'],p),y=R.point(idle[side+'_foot'],p);footDrift=Math.max(footDrift,Math.hypot(x[0]-y[0],x[1]-y[1]));}}
  assert(Object.values(m).flat().every(Number.isFinite));
 }
 for(const name of ['idle','move']){const x=R.rigMatrices(a,R.sampleAnimation(a,name,0,true).poses),y=R.rigMatrices(a,R.sampleAnimation(a,name,1,true).poses);for(const k of Object.keys(x))loopError=Math.max(loopError,...x[k].map((v,i)=>Math.abs(v-y[k][i])));}
 check(id+': 505 motion samples keep rigid skull, connected limbs, idle contacts and seamless loops',()=>{assert(headError<1e-6);assert(jointGap<1e-6);assert(footDrift<1e-6);assert(loopError<1e-6);assert(reach<.1,`reach ${reach}`);});
 for(const p of a.paths){const native=new Path2D(p.d).computeTightBounds(),exact=pathBounds(p.d);assert(native.every((v,i)=>Math.abs(v-exact[i])<.002),`${id}/${p.id}: analytical bounds agree with native curves`);}
 geometry.push({id,bodyWidthBefore:bodyWidth(previous),bodyWidthAfter:bodyWidth(a),widthMultiplier:spec.width,headScale:a.proportions.balance.headMultiplier,anatomicalHeadUnits:ratio,standingBoundsBefore:before,standingBoundsAfter:bounds,soleBefore:beforeSole,soleAfter:sole,headError,jointGap,footDrift,reach,loopError});
}
check('All bow charge/aim directions keep string attached and arms reachable',()=>{const a=assets.seol_o,v=new g.HonroArcherVisual(a,R);for(const facing of [-1,1])for(const elevation of [-30,0,45,80])for(const charge of [.3,.6,1]){const u={side:0,cls:'archer',facing,angle:facing===1?elevation:180-elevation},s=v.state(u);v.time=1;s.chargeAt=0;const pose=v.pose(u,charge).sample,m=R.rigMatrices(a,pose.poses),q=R.constrainedPaths(a,m,pose.controls);assert(Math.max(...Object.values(pose.guide.reach))<.2);assert(Math.hypot(q.nock[0]-q.hand[0],q.nock[1]-q.hand[1])<1e-6);}});
const portraitMetrics=[];
for(const cls of ['archer','mage','knight','occultist'])check(cls+': all UI aspect ratios protect the complete head with margin and preserve actor data',()=>{
 const actor={cls,side:0,id:'portrait-'+cls,h:88,r:20,x:10,y:20,hp:1,mp:2,anim:.2,hurt:.2},original=JSON.stringify(actor);
 for(const [w,h]of [[160,192],[88,108],[400,440],[96,126],[64,90],[27,34],[24,30]]){
  const cv=canvas(w,h),{crop,head}=g.HonroPortraits.draw(cv,actor,cls),pad=Math.min(w,h)*.025;
  const rendered={left:(head.left-crop.x)/crop.width*w,right:(head.right-crop.x)/crop.width*w,top:(head.top-crop.y)/crop.height*h,bottom:(head.bottom-crop.y)/crop.height*h};
  assert(rendered.left>pad&&rendered.right<w-pad&&rendered.top>pad&&rendered.bottom<h-pad,`${cls}/${w}x${h}: ${JSON.stringify(rendered)}`);
  assert.equal(JSON.stringify(actor),original);portraitMetrics.push({cls,w,h,head:rendered});
 }
});
for(const actor of [{id:'npc-woodcutter',name:'나무꾼',cls:'knight',side:2,honroAlly:true,allyRole:'guard'},{id:'resident-1',name:'연실',cls:'mage',side:2,honroCivilian:true,honroType:'civilian'},{id:'boss',name:'소단',cls:'occultist',side:1,boss:true,honroFinalBoss:true},{id:'summon',cls:'occultist',side:0,summoned:true,summonKind:'stalker'}])check((actor.name||actor.id)+': non-party identity keeps its own portrait renderer',()=>{const before=JSON.stringify(actor),cv=canvas(200,240);assert(g.HonroPortraits.draw(cv,actor,actor.cls));assert.equal(JSON.stringify(actor),before);});
const main=await read('shared/runtime/main.js'),ui=await read('shared/runtime/ui-bridge.js'),story=await read('shared/runtime/story.js'),training=await read('shared/runtime/training.js'),bundle=await read('shared/build.mjs'),css=await read('game/src/presentation.css');
assert.match(main,/drawPortraits\(\) \{[^\n]*HonroPortraits.draw/);assert.match(ui,/function portraits\(\)[^\n]*HonroPortraits.draw/);assert.match(story,/function drawBust[^\n]*HonroPortraits.draw/);assert.match(training,/HonroUI.portraits\(\)/);assert.match(bundle,/\['portraits','ui-bridge'/);assert.match(css,/\.story-portrait canvas,\.story-portrait img\{[^}]*object-fit:contain/);assert.match(css,/\.summary-identity>img,[^}]*object-fit:contain/);assert.match(story,/Number\(portrait\?\.imageZoom\)\|\|1\)/);
g.HonroFA={data:{}};vm.runInContext(ui,g);const cache=g.HonroUI.portraits();assert.equal(cache,g.HonroUI.portraits());assert.equal(Object.keys(cache).length,4);assert(Object.values(cache).every(x=>x.startsWith('data:image/png')));
const drawMethod=main.slice(main.indexOf('        drawPortraits()'),main.indexOf('\n        showTitle()')),cv=canvas(88,108);cv.dataset={portrait:'knight'};g.document.querySelectorAll=()=>[cv];new Function('G','document','return ({'+drawMethod+'}).drawPortraits;')(g,g.document)();const ref=canvas(88,108);g.HonroPortraits.draw(ref,null,'knight');check('Camp/summary, training picker/toolbar, HUD buttons and dialogue all route through one helper',()=>assert.equal(hash(cv.toBuffer('image/png')),hash(ref.toBuffer('image/png'))));
const sheet=canvas(1800,800),s=sheet.getContext('2d');s.fillStyle='#192a2e';s.fillRect(0,0,1800,800);let index=0;
for(const [id,a]of Object.entries(assets)){for(const [label,asset]of [['before',old.HONRO_PARTY[id]],['after',a]]){const x=index*450+(label==='before'?105:310);s.fillStyle='#e8d9b4';s.font='17px sans-serif';s.fillText(id+' '+label,x-80,55);R.createCanvasRenderer(asset).draw(s,{x,y:725,height:450,animation:'idle',time:0,normalized:true,facing:1,detail:2});}index++;}
await writeFile(`${out}/before-after.png`,sheet.toBuffer('image/png'));
const portraits=canvas(1200,880),pc=portraits.getContext('2d');pc.fillStyle='#14262b';pc.fillRect(0,0,1200,880);index=0;
for(const cls of ['archer','mage','knight','occultist']){pc.fillStyle='#e8d9b4';pc.font='18px sans-serif';pc.fillText(cls,index*300+30,30);let y=65;for(const[w,h]of[[160,192],[88,108],[200,220],[27,34],[24,30]]){const cv=canvas(w,h);g.HonroPortraits.draw(cv,null,cls);pc.drawImage(cv,index*300+40,y);y+=h+20;}index++;}
await writeFile(`${out}/portraits.png`,portraits.toBuffer('image/png'));
const comparison=canvas(1600,520),cc=comparison.getContext('2d');cc.fillStyle='#17282d';cc.fillRect(0,0,1600,520);
const currentAssets=g.HONRO_PARTY,currentArcher=g.HONRO_ARCHER;
['archer','mage','knight','occultist'].forEach((cls,i)=>{cc.fillStyle='#e8d9b4';cc.font='17px sans-serif';cc.fillText(cls+' old / bust',i*400+20,28);let y=50;for(const [w,h,kind]of [[160,192,'camp'],[88,108,'HUD']]){const before=canvas(w,h),c=before.getContext('2d');g.HONRO_PARTY=old.HONRO_PARTY;g.HONRO_ARCHER=old.HONRO_PARTY.seol_o;const scene=new g.HonroScene(before);if(kind==='camp'){c.translate(79,181);c.scale(1.62,1.62);}else{c.translate(44,110);c.scale(1.2,1.2);}scene.human(c,{cls,side:0,facing:1,x:0,y:0,angle:25,h:92},g.HONRO_CONTENT.hero[cls],false,0,0);g.HONRO_PARTY=currentAssets;g.HONRO_ARCHER=currentArcher;const after=canvas(w,h);g.HonroPortraits.draw(after,null,cls);cc.drawImage(before,i*400+10,y);cc.drawImage(after,i*400+205,y);y+=h+40;}});
await writeFile(`${out}/portrait-before-after.png`,comparison.toBuffer('image/png'));
for(const motion of ['idle','move','attack','jump_fall','hit']){const sheet=canvas(1800,1400),ctx=sheet.getContext('2d');ctx.fillStyle='#192a2e';ctx.fillRect(0,0,1800,1400);Object.entries(assets).forEach(([id,a],i)=>{ctx.fillStyle='#e8d9b4';ctx.font='17px sans-serif';ctx.fillText(id,15,i*350+25);[0,.2,.4,.6,.8,1].forEach((t,j)=>R.createCanvasRenderer(a).draw(ctx,{x:100+j*300,y:i*350+335,height:235,animation:motion,time:t,normalized:true,facing:j%2?-1:1,detail:2}));});await writeFile(`${out}/${motion}.png`,sheet.toBuffer('image/png'));}
const sizes=canvas(1600,850),sc=sizes.getContext('2d');sc.fillStyle='#b9b9ae';sc.fillRect(0,0,1600,425);sc.fillStyle='#17282d';sc.fillRect(0,425,1600,425);for(let row=0;row<2;row++)Object.entries(assets).forEach(([id,a],i)=>{let x=i*400+30;for(const h of [256,128,96,64]){R.createCanvasRenderer(a).draw(sc,{x:x+30,y:row*425+390,height:h*a.canvas.visualHeight/(a.canvas.anchor[1]-a.proportions.balance.standingBoundsAfter[1]),facing:row?-1:1,time:0,normalized:true,silhouette:row===1});x+=h*.65+25;}});await writeFile(`${out}/sizes-silhouettes.png`,sizes.toBuffer('image/png'));
await writeFile(`${out}/summary.json`,JSON.stringify({status:'passed',mode:'Production rig and Native Canvas; not browser DOM/input',checks:rows,geometry,portraitMetrics,limits:['Anatomical crowns are artist-estimated beneath the supplied hair/hat, not skeletal measurements.','Before/after uses identical idle time, direction, display scale and baseline. Retargeted wider shoulders naturally change arm positions; grip, weapon angles and event timing are preserved.','Native evidence excludes real browser CSS/layout/input, Game/Workshop/Playtest UI and performance.']},null,2)+'\n');
console.log('CHARACTER BALANCE PASS',rows.length);
