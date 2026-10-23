import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
let clock=0;
const g=vm.createContext({performance:{now:()=>clock},matchMedia:()=>({matches:false})});
vm.runInContext(await readFile('shared/runtime/reinforcement-camera.js','utf8'),g);
const C=g.HonroReinforcementCamera,unit=(id,x=3000,y=1000,extra={})=>({id,x,y,side:1,h:90,r:25,hp:100,...extra});
function fixture(manual=false){clock=0;const scene={x:200,y:800,scale:.65,manual},e={b:{units:[unit('hero',200,1000,{side:0}),unit('old',5000)],phase:'aim'}};C.prime(scene,e.b);return{scene,e};}
function step(f,time){clock=time;return C.update(f.scene,f.e,1280,800,time);}
function add(f,...units){f.e.b.units.push(...units);}
const camera=s=>({x:s.x,y:s.y,scale:s.scale,manual:s.manual});
// Initial/Continue population, allies, targets, own eater and failed requests
// cannot select an unrelated existing enemy or hero.
let f=fixture();assert.equal(step(f,0),false);
add(f,unit('ally',0,0,{side:2}),unit('target',0,0,{honroObjectiveTarget:true}),unit('dead',0,0,{dead:true}),unit('eater',0,0,{summonKind:'eater'}));
assert.equal(step(f,1),false);assert.equal(C.active(f.scene),false);
// Spirit flags describe live combat actors, including unmanifested spirits.
for(const spirit of [{honroSpirit:true},{honroSpirit:true,spiritHidden:true},{honroSpirit:true,manifested:true},{honroSpirit:true,revealSpiritToParty:true}]){f=fixture();add(f,unit('combat-spirit',3100,1000,spirit));assert.equal(step(f,0),true);step(f,420);assert(f.scene.x>2500,'combat spirit is the actual target');}
f=fixture();add(f,unit('visual-spirit',3100,1000,{honroSpirit:true,honroVisualOnly:true}),unit('dead-spirit',3200,1000,{honroSpirit:true,dead:true,hp:0}));f.e.b.honroStaging={hidden:{absent:unit('absent',3300,1000,{honroSpirit:true})}};assert.equal(step(f,0),false,'visual/dead/absent noncombat actors never select a fallback');
// One enemy / multiple groups, on/off screen, no zoom-in, all bodies fit.
for(const [w,h]of [[1280,800],[390,844],[844,390]])for(const positions of [[210],[3300],[2200,2600,3100],[500,5200]]){
 f=fixture(true);const original=camera(f.scene),batch=positions.map((x,i)=>unit('new'+i,x));add(f,...batch);C.update(f.scene,f.e,w,h,0);assert.deepEqual(camera(f.scene),original);
 C.update(f.scene,f.e,w,h,420);assert(f.scene.scale<=original.scale);for(const u of batch){const x=(u.x-f.scene.x)*f.scene.scale+w/2,y=(u.y-f.scene.y)*f.scene.scale+h/2;assert(x>=0&&x<=w);assert(y>=u.h*f.scene.scale&&y<=h*.76);}
 C.update(f.scene,f.e,w,h,1500);C.update(f.scene,f.e,w,h,1920);assert.deepEqual(camera(f.scene),original);assert(!C.active(f.scene));
}
// Dead/removed targets return to the exact view; no old enemy fallback.
f=fixture();const original=camera(f.scene);add(f,unit('new'));step(f,0);step(f,200);assert.deepEqual(JSON.parse(JSON.stringify(C.controlView(f.scene))),original);f.e.b.units.at(-1).dead=true;step(f,201);step(f,621);assert.deepEqual(camera(f.scene),original);
// Consecutive batches retarget continuously and preserve the first return view.
f=fixture(true);const first=camera(f.scene);add(f,unit('a'));step(f,0);step(f,200);const before=camera(f.scene);add(f,unit('b',4000));step(f,200);assert.deepEqual(camera(f.scene),before);step(f,620);step(f,1700);step(f,2120);assert.deepEqual(camera(f.scene),first);
// Player pan/zoom cancels the insert and prevents its later restoration.
f=fixture();add(f,unit('a'));step(f,0);step(f,400);C.cancel(f.scene);Object.assign(f.scene,{x:900,y:200,scale:.5,manual:true});const manual=camera(f.scene);assert.equal(step(f,1800),true);assert.deepEqual(camera(f.scene),manual);add(f,unit('during-manual'));assert.equal(step(f,1801),true);assert(C.blocksFocus(f.scene));add(f,unit('after-manual'));assert.equal(step(f,2400),true);
// Concurrent speaker/objective/frame state cannot override the insert, and its
// spring/tween resumes at the actual rendered frame rather than a stale time.
f=fixture();add(f,unit('a'));step(f,0);f.scene.storyFrame={motion:{}};g.HonroStoryFraming={targetFrame:()=>({camera:{x:900,y:700,scale:.5}})};step(f,420);assert(f.scene.x>2000);step(f,1500);step(f,1920);assert.equal(f.scene.x,900);assert.equal(f.scene.storyFrame.motion.x,900);assert.equal(f.scene.storyFrame.motion.time,1920);
// Continue primes existing enemies but detects the next genuinely new ID.
f=fixture();add(f,unit('saved'));C.prime(f.scene,f.e.b);assert.equal(step(f,100),false);add(f,unit('later'));assert.equal(step(f,101),true);
// A same-frame automatic turn notice must not replace the last rendered
// manual mode when a spawn insert captures its return view.
f=fixture(true);const manualOrigin=camera(f.scene);f.scene.manual=false;add(f,unit('turn-spawn'));step(f,0);step(f,1500);step(f,1920);assert.deepEqual(camera(f.scene),manualOrigin);
// Scripted hide/reveal reintroduces an actual absent actor ID.
f=fixture();const hidden=f.e.b.units.pop();step(f,1);add(f,hidden);assert.equal(step(f,2),true);
console.log('PASS reinforcement camera: actual IDs, bounds on 3 viewports, return, death, consecutive batches, manual cancel, dialogue resume, Continue');
