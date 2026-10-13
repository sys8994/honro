// Production App + feedback methods; DOM/canvas/frame scheduler are doubles.
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {appHarness,plain,report} from './app-regression-helpers.mjs';
const h=await appHarness(),{g,load,profileThrough,finish,reload,click}=h,checks=[];
const check=(name,fn)=>{fn();checks.push(name);console.log('PASS',name);};
const renderer=await readFile('shared/runtime/renderer.js','utf8');
assert(renderer.includes('this.settleHitFeedback?.(e,paused||this.storyFrozen)'));
g.HonroScene.prototype.render=function(e,dt,selected,power,charging,effectDt,paused){this.settleHitFeedback(e,paused||this.storyFrozen);this.time=(this.time||0)+effectDt;this.frames=(this.frames||0)+1;};
g.HonroScene.prototype.unitBody=function(){};
vm.runInContext(await readFile('shared/runtime/combat-feedback.js','utf8'),g);
function fresh(){const a=load(profileThrough(3));a.launch(4);finish(a);a.scene.effects=[];a.scene.arcFx={fxs:[]};a.scene.time=0;a.scene.size=()=>({w:720,h:1560,d:1});a.scene.ctx=new Proxy({},{get:()=>()=>{}});a.done=false;return a;}
function frame(a,n=1){for(let i=0;i<n;i++)a.frame((a.prev||0)+1000/60);assert(!a.lastError,a.lastError);}
function hit(a,u){a.engine.hurt(u,15,'');assert(u.hurt>0);}
check('Actual App dialogue frames finish only emitted hit feedback and preserve complete serialized battle',()=>{
 const a=fresh(),e=a.engine,u=e.active;hit(a,u);
 assert(e.fire('A01',35,.6));assert(e.b.projectiles.length>0,'a real unfinished projectile must remain paused');
 g.HonroStory.start(a,[['설오','피격 직후 멈춤'],['담허','계속']]);
 a.scene.arcFx.fxs=['swordCut','inkLine','slash','inkImpact','meteor','fireBloom','ring','rune'].map(kind=>({kind}));
 a.scene.effects=[{name:'text',text:'−15'},{name:'text',text:'피해 경고'},{name:'line'}];
 const before=JSON.stringify(e.b);frame(a,180);assert.equal(JSON.stringify(e.b),before);assert(!a.scene.hitFlashVisible(u));assert.equal(a.scene.damageNumbers.size,0);
 assert.deepEqual(plain(a.scene.arcFx.fxs.map(x=>x.kind)),['meteor','fireBloom','ring','rune']);assert.deepEqual(plain(a.scene.effects),[{name:'text',text:'피해 경고'},{name:'line'}]);
 // Pause/end must not mutate serialized projectile/zone/turn/objective fields.
 const hurt=u.hurt;finish(a);a.scene.settleHitFeedback(e,false);assert(!a.scene.hitFlashVisible(u));assert.equal(u.hurt,hurt);
 e.tick(1/120);a.scene.settleHitFeedback(e,false);assert(!a.scene.hitFlashVisible(u));assert(u.hurt<hurt);
 hit(a,u);assert(a.scene.hitFlashVisible(u),'a new hit must re-enable normal feedback');
});
check('Modal, repeated pause and hidden-page return settle feedback without battle advancement',()=>{
 const a=fresh(),u=a.engine.active;hit(a,u);a.pause();const before=JSON.stringify(a.engine.b);frame(a,60);assert.equal(JSON.stringify(a.engine.b),before);assert(!a.scene.hitFlashVisible(u));
 a.frame((a.prev||0)+60000);assert.equal(JSON.stringify(a.engine.b),before);assert(!a.scene.hitFlashVisible(u));a.close();a.pause();frame(a);assert.equal(JSON.stringify(a.engine.b),before);
});
check('Old saved hurt timers in a resumed dialogue settle on the first App frame',()=>{
 let a=fresh();hit(a,a.engine.active);g.HonroStory.start(a,[['설오','저장된 대화'],['담허','두 번째']]);g.HonroStory.save(a);a=reload();click('continue');assert(a.dialogue);a.scene.effects=[];a.scene.arcFx={fxs:[]};const before=JSON.stringify(a.engine.b);frame(a,60);assert.equal(JSON.stringify(a.engine.b),before);assert(!a.scene.hitFlashVisible(a.engine.active));
});
check('All sides retain meaningful red/status data; repeated normal hits and recovery reset only the tint suppression',()=>{
 const a=fresh(),e=a.engine;for(const u of e.b.units){u.hurt=.7;u.shield=30;u.curseTurns=2;u.curseDamage=3;}
 const before=JSON.stringify(e.b);a.scene.settleHitFeedback(e,true);assert.equal(JSON.stringify(e.b),before);for(const u of e.b.units)assert(!a.scene.hitFlashVisible(u));
 const u=e.active;u.hurt=.6;a.scene.settleHitFeedback(e,false);u.hurt=.7;u.hp-=1;a.scene.settleHitFeedback(e,false);assert(a.scene.hitFlashVisible(u));
 a.scene.settleHitFeedback(e,true);u.hurt=0;a.scene.settleHitFeedback(e,false);u.hurt=.7;assert(a.scene.hitFlashVisible(u));
 const replacement={...u};a.scene.settleHitFeedback(e,true);e.b.units[e.b.units.indexOf(u)]=replacement;a.scene.settleHitFeedback(e,false);assert(a.scene.hitFlashVisible(replacement));
});
const art=await readFile('shared/runtime/art-dark.js','utf8');assert(art.includes('this.hitFlashVisible?.(u)??u.hurt>0'));
await report('dialogue-hit-feedback',checks,{limits:['Production App, Engine and presentation-state methods with DOM/canvas doubles. No normal-play, native pixels or browser proof.','Browser Game/Workshop and native before/after images require release-owner verification.']});
