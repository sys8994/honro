/** Real projectile and production Canvas fixtures. Not a normal battle playthrough. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {guidanceRuntime,canvas,guidanceFixture} from './act2-guidance-helpers.mjs';
import {battlefield} from '../game/tests/helpers.mjs';
const g=await guidanceRuntime(),C=g.HONRO_CORE,rows=[],out='_local/reports/event-target-health';
await mkdir(out,{recursive:true});
g.document.addEventListener=()=>{};
vm.runInContext(await readFile('shared/runtime/interactions.js','utf8'),g);
const main=await readFile('shared/runtime/main.js','utf8'),method=main.slice(main.indexOf('        checkMission(e) {'),main.indexOf('        missionTick(dt)'));
const checkMission=new Function('G','C','return ({'+method+'}).checkMission')(g,C);
const check=(name,fn)=>{fn();rows.push({name,status:'passed'});console.log('PASS',name);};
let {b,e,app,st,events}=battlefield(g,5);Object.assign(app,{canInput(){return this.engine.canAct();},cancelInput(){},checkMission});e.checkEnd=()=>false;
let ring=b.terrain.find(t=>t.id==='cliff-cleat');
const cv=canvas(1440,960),scene=new g.HonroScene(cv);
Object.assign(scene,{x:ring.x+ring.w/2,y:ring.y+210,scale:.6,manual:true,time:2});
const health=()=>scene.terrainHealthTargets(b).find(t=>t.id===ring.id);
const render=()=>{scene.missionTargets=g.HonroObjectives.state(b,st).targets;const before=JSON.stringify(b);scene.render(e,0,'',.6,false,0);assert.equal(JSON.stringify(b),before,'Rendering must not change battle/save state');};
const capture=async(name)=>{render();await new Promise(r=>setTimeout(r,20));render();await writeFile(`${out}/${name}.png`,cv.toBuffer('image/png'));};
check('Closed ring exposes its real HP and the ritual prerequisite',()=>{
 assert.equal(health().hp,520);assert.match(health().blocked,/받이진 필요/);
 const hp=ring.hp;e.damageTerrain(ring,50);assert.equal(ring.hp,hp);
 assert(events.some(ev=>ev.type==='fx'&&ev.text==='물틈 닫힘 · 받이진 필요'));
});
await capture('stage5-locked');
const mage=e.heroesAlive().find(u=>u.cls==='mage'),archer=e.heroesAlive().find(u=>u.cls==='archer'),marker=b.honroMarkers.find(m=>m.id==='receiver-5');
// Isolated firing fixture: initial placement/roster and between-shot action reset.
// Geometry, aim prediction, collision, damage and target HP remain real.
Object.assign(mage,{x:marker.x,y:marker.y});b.units=[mage,archer];b.active=mage.id;
assert(g.HonroInteractions.use(app,marker));Object.assign(archer,b.honroMapAnchors.shotGap);e.finishAction(true);e.select(archer.id);
check('Actual ritual use opens the ring without changing its durability',()=>{assert.equal(health().blocked,'');assert.equal(ring.hp,520);assert(b.terrain.find(t=>t.id==='waterfall-veil').broken);});
await capture('stage5-full');const cacheBuilds=scene.renderCacheStats().worldBuilds,sceneVersion=b.sceneVersion;
const findAim=()=>{for(const angle of [35,...Array.from({length:61},(_,i)=>25+i*.5)])for(const power of [.8,1,.65])if(e.predict(e.active,C.SKILLS.A01,angle,power,undefined,false,false).terrain===ring.id)return{angle,power};throw Error('No valid real arrow lane');};
const shots=[];
for(let i=0;!ring.broken&&i<20;i++){
 const before=ring.hp,aim=findAim();assert(e.fire('A01',aim.angle,aim.power));
 for(let n=0;n<1800&&b.projectiles.length;n++)for(const p of [...b.projectiles])if(b.projectiles.includes(p))e.stepProjectile(p,C.STEP);
 assert.equal(b.projectiles.length,0);assert(ring.hp<before,'A predicted ring hit must reduce durability');
 shots.push({shot:i+1,...aim,before,after:ring.hp,broken:!!ring.broken});
 if(i===0){
  await capture('stage5-damaged');
  const portrait=canvas(390,844),ps=new g.HonroScene(portrait);Object.assign(ps,{x:ring.x+ring.w/2,y:ring.y+210,scale:.42,manual:true,time:2,missionTargets:g.HonroObjectives.state(b,st).targets});
  const unchanged=JSON.stringify(b);ps.render(e,0);await new Promise(r=>setTimeout(r,20));ps.render(e,0);assert.equal(JSON.stringify(b),unchanged);
  await writeFile(`${out}/stage5-damaged-portrait.png`,portrait.toBuffer('image/png'));
  check('Nonlethal real arrow updates live HP with no scenery-cache rebuild',()=>{assert.equal(scene.renderCacheStats().worldBuilds,cacheBuilds);assert.equal(b.sceneVersion,sceneVersion);assert.equal(health().hp,ring.hp);assert(health().hp<520);});
  const calls=[],ctx=new Proxy({measureText:()=>({width:100})},{get:(o,k)=>k in o?o[k]:(...a)=>calls.push([k,...a]),set:(o,k,v)=>(o[k]=v,true)});
  scene.terrainHealth(ctx,b,1440,960);assert(calls.some(x=>x[0]==='fillText'&&x[1]===`${Math.ceil(ring.hp)} / 520`));
  assert(calls.some(x=>x[0]==='fillRect'&&Math.abs(x[3]-100*ring.hp/520)<1e-6));
 }
 if(i===3){
  const before=JSON.stringify(b),saved=JSON.parse(before);e=new C.Engine(saved,ev=>events.push(ev),false);b=e.b;app.engine=e;e.checkEnd=()=>false;ring=b.terrain.find(t=>t.id==='cliff-cleat');
  check('Partial durability and the active ritual survive save/resume',()=>{assert.equal(ring.hp,shots.at(-1).after);assert(b.honroState.ritual.active);assert.equal(health().hp,ring.hp);});
 }
 if(!ring.broken){b.phase='aim';b.side=0;b.active=b.units.find(u=>u.cls==='archer').id;e.active.acted=false;}
}
check('Repeated real arrows destroy the ring, with no HP or damage override',()=>{assert(ring.broken);assert(shots.length>1);assert.equal(health(),undefined);assert(b.awardIds.includes(ring.id));});
// Mission aftermath is checked separately from the isolated firing turns.
g.HonroMission.tick(app,0);
check('Destruction permanently opens water, clears ritual and preserves stabilization',()=>{
 assert(!b.honroState.ritual.active);assert(b.terrain.find(t=>t.id==='waterfall-veil').broken);assert(marker.collected||b.honroMarkers.find(m=>m.id===marker.id).collected);
 const state=g.HonroObjectives.state(b,st);assert(state.objectiveReady);assert(!state.targets.some(t=>t.id===ring.id));assert(!state.complete);assert.match(state.summary,/고리쇠 파괴 완료/);
});
await capture('stage5-destroyed');
const broken=JSON.parse(JSON.stringify(b)),resumed=new C.Engine(broken,()=>{},false);app.engine=resumed;g.HonroMission.tick(app,0);assert(broken.terrain.find(t=>t.id===ring.id).broken);assert(broken.terrain.find(t=>t.id==='waterfall-veil').broken);
check('Every campaign event target has a health panel; protected scenery never does',()=>{
 for(let id=1;id<=20;id++){
  const {b}=battlefield(g,id),list=scene.terrainHealthTargets(b);
  for(const t of b.terrain.filter(t=>!t.broken&&!t.indestructible&&t.hp<9999&&(t.honroSeal||t.honroAct2Target||t.device)))assert(list.some(row=>row.id===t.id),`Missing ${id}/${t.id}`);
  for(const t of b.terrain.filter(t=>t.indestructible||t.hp>=9999))assert(!list.some(row=>row.id===t.id));
 }
 const t={id:'custom',x:100,y:100,w:80,h:40,hp:80,maxHp:80},custom={terrain:[t],units:[],honroObjectives:[{type:'destroy',targetId:t.id,label:'사용자 장치'}]};
 assert.equal(scene.terrainHealthTargets(custom)[0].label,'사용자 장치');t.broken=true;assert.equal(scene.terrainHealthTargets(custom).length,0);
 const branch={...t,id:'branch',broken:false,hp:40};assert.equal(scene.terrainHealthTargets({terrain:[branch]})[0].hp,40);
});
check('Leaving and restarting the ritual preserves partial damage and restores attackability',()=>{
 const q=battlefield(g,5),{b,e,app}=q,m=b.honroMarkers.find(m=>m.id==='receiver-5'),mage=e.heroesAlive().find(u=>u.cls==='mage'),ring=b.terrain.find(t=>t.id==='cliff-cleat');
 Object.assign(app,{canInput(){return true;},cancelInput(){}});b.active=mage.id;Object.assign(mage,{x:m.x,y:m.y});assert(g.HonroInteractions.use(app,m));
 e.damageTerrain(ring,50);const remaining=ring.hp;
 mage.x=m.x+125;g.HonroMission.tick(app,0);assert(b.honroState.ritual.active);
 mage.x=m.x+126;g.HonroMission.tick(app,0);assert(!b.honroState.ritual.active);assert(!b.terrain.find(t=>t.id==='waterfall-veil').broken);e.damageTerrain(ring,50);assert.equal(ring.hp,remaining);
 mage.x=m.x;b.phase='aim';mage.acted=false;assert(g.HonroInteractions.use(app,m));assert.equal(ring.hp,remaining);e.damageTerrain(ring,50);assert.equal(ring.hp,remaining-50);
 mage.hp=0;g.HonroMission.tick(app,0);assert(!b.honroState.ritual.active);assert.match(scene.terrainHealthTargets(b).find(t=>t.id===ring.id).blocked,/받이진 필요/);
});
check('Older Act 2 saves use the same target labels and required-class rules',()=>{
 const {b}=battlefield(g,18);delete b.honroAct2Steps;
 const step=g.HonroAct2.steps(b).find(s=>s.id==='upper-chain');b.honroState.act2={silenced:true,done:{},events:{},rescued:[],checkpoints:[]};b.active=b.units.find(u=>u.cls==='mage'&&u.side===0).id;
 const row=scene.terrainHealthTargets(b).find(t=>t.id===step.id);assert.equal(row.label,step.label);assert.match(row.blocked,/설오/);
});
check('Health bars remain 100 screen pixels at low and high zoom',()=>{
 const {b}=battlefield(g,5),calls=[],ctx=new Proxy({measureText:()=>({width:100})},{get:(o,k)=>k in o?o[k]:(...a)=>calls.push([k,...a]),set:(o,k,v)=>(o[k]=v,true)});
 for(const scale of [.2,.42,.6,1.3]){scene.scale=scale;calls.length=0;scene.terrainHealth(ctx,b,1440,960);assert(calls.some(x=>x[0]==='scale'&&x[1]===1/scale));assert(calls.some(x=>x[0]==='fillRect'&&x[3]===100&&x[4]===7));}
});
for(const portrait of [false,true]){
 const q=guidanceFixture(g,18,'upper-chain'),target=q.b.terrain.find(t=>t.id==='upper-chain'),v=canvas(portrait?390:1440,portrait?844:960),s=new g.HonroScene(v);
 Object.assign(s,{x:target.x+target.w/2,y:target.y+210,scale:portrait?.42:.6,manual:true,time:2,missionTargets:g.HonroAct2.state(q.b).targets});
 assert.match(s.terrainHealthTargets(q.b).find(t=>t.id===target.id).blocked,/공명/);
 const before=JSON.stringify(q.b);s.render(q.e,0);await new Promise(r=>setTimeout(r,20));s.render(q.e,0);assert.equal(JSON.stringify(q.b),before);
 await writeFile(`${out}/stage18-locked-${portrait?'portrait':'landscape'}.png`,v.toBuffer('image/png'));
}
await writeFile(`${out}/summary.json`,JSON.stringify({status:'passed',rows,shots,limitations:['Isolated real-projectile and Native Canvas fixtures, not normal combat completion','No browser DOM, pointer/keyboard or browser performance validation']},null,2)+'\n');
