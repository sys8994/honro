/** Focused Stage32 movement and restore checks on the authored campaign map. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {appHarness,plain} from './app-regression-helpers.mjs';

process.env.HONRO_ACT4_RELEASE='1';
const h=await appHarness({productionStory:true}),g=h.g;
const app=h.load(h.profileThrough(31));
app.launch(32);
h.finish(app);
const entry=plain(app.engine.b);
app.stopBattle();
g.HonroApp=app;
g.HONRO_ACT4_PREVIEW_SEEDS=JSON.parse(await readFile('shared/data/act4/reviewed.json','utf8'));
for(const module of ['interactions','act4-art','act4-maps','act4-coast-maps','act4-coast-art','act4-events','act4-coast-events']){
 vm.runInContext(await readFile(`shared/runtime/${module}.js`,'utf8'),g);
}
const P=g.HonroAct4TerrainPreview,C=g.HONRO_CORE;
function mount(b){
 const e=new C.Engine(b,()=>{});
 // Isolate locomotion. The production App owns the Act 4 mission check.
 e.checkEnd=()=>false;
 app.engine=e;
 app.dialogue=null;
 P.attachCoast(app);
 return e;
}

const b=plain(entry),e=mount(b),q=P.previewMemory(b),hero=e.unit('archer'),mage=e.unit('mage');
const enemies=b.units.filter(u=>u.side===1);
assert.equal(enemies.length,12);
b.phase='aim';b.side=0;b.active=hero.id;b.round=15;
mage.acted=true;
hero.moveLeft=5;
const health=hero.hp,focus=hero.focus,startX=hero.x;
P.coastObserve(app,.01);
assert.equal(q.shelterTravel,undefined);
for(let i=0;i<30;i++)e.move(1,C.STEP);
assert(hero.x-startX<=5.01,'an active threat keeps the combat movement limit');

// Simulate the post-combat checkpoint with all original enemies defeated.
for(const enemy of enemies){enemy.dead=true;enemy.hp=0;}
P.coastObserve(app,.01);
assert.equal(q.shelterTravel,undefined,'the quiet interval still applies');
q.clock=q.quietAt+2;
mage.jumping=true;
P.coastObserve(app,.01);
assert.equal(q.shelterTravel,undefined,'a live jump must settle first');
mage.jumping=false;
P.coastObserve(app,.01);
assert.equal(q.shelterTravel,true);
assert(!mage.acted,'companions can regroup on the current round');
assert(!e.noncombatWalk(),'the stage still records its combat rounds');
assert(!q.safeSeven&&!q.complete,'movement permission does not grant a reunion or clear');

hero.moveLeft=5;
const exhaustedX=hero.x;
for(let i=0;i<30;i++){e.move(1,C.STEP);e.tick(C.STEP);}
assert(hero.x-exhaustedX>40);
assert.equal(b.round,15);
assert.equal(hero.hp,health);
assert.equal(hero.focus,focus);

const restored=mount(plain(b)),savedHero=restored.unit(hero.id);
assert.equal(savedHero.x,hero.x);
savedHero.moveLeft=0;
assert(restored.jump(savedHero),'the saved quiet approach retains ordinary jump input');
assert.equal(restored.b.round,15);
assert.equal(savedHero.hp,health);
assert(!P.previewMemory(restored.b).safeSeven);
console.log('PASS Stage32 combat budget, settled regrouping, real walking, jump and JSON remount. Post-combat fixture only.');
