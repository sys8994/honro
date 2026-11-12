/** Deterministic production interaction + reward checks, not browser play. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {appHarness,plain} from './app-regression-helpers.mjs';
process.env.HONRO_ACT4_RELEASE='1';
const h=await appHarness({productionStory:true}),g=h.g,app=h.load(h.profileThrough(32));
app.launch(33);h.finish(app);const base=plain(app.engine.b);app.stopBattle();g.HonroApp=app;
g.HONRO_ACT4_PREVIEW_SEEDS=JSON.parse(await readFile('shared/data/act4/reviewed.json','utf8'));
for(const name of ['interactions','act4-art','act4-maps','act4-coast-maps','act4-coast-art','act4-events','act4-coast-events'])vm.runInContext(await readFile('shared/runtime/'+name+'.js','utf8'),g);
const P=g.HonroAct4TerrainPreview,C=g.HONRO_CORE;
function fixture(n){const b=plain(base);b.honroStage=n;b.honroAct4Preview=n;b.honroAct4Official=1;b.honroCustom=false;b.phase='aim';b.side=0;b.honroAct4Design.exit={x:5000,y:1000};b.honroAct4Design.connection={entry:{x:0,y:0}};delete b.honroAct4PreviewState;const e=new C.Engine(b,()=>{});e.grounded=()=>true;e.checkEnd=()=>false;for(const u of b.units.filter(u=>u.side===0)){u.x=4900;u.y=1000;u.hp=Math.max(1,u.hp);u.dead=false;}app.engine=e;app.dialogue=null;app.modal.classList.remove('open');const q=P.eventAPI.memory(b);if(n===37)q.events.signal={terminal:true};return {b,e,q};}
for(const n of [33,34,37,38]){let {b,q}=fixture(n);assert.equal(P.interact(app,true),true);assert.equal(q.complete,false);assert.equal(q.completionProof,undefined);assert.equal(P.interact(app,false),true);assert.equal(b.phase,'won');assert.equal(q.complete,true);assert.equal(q.completionProof.exitContributionVersion,1);
 ({b,q}=fixture(n));q.failure='test';P.interact(app,false);assert.equal(q.complete,false);assert.equal(q.completionProof,undefined);assert.equal(b.phase,'aim');
 ({b,q}=fixture(n));b.units.find(u=>u.side===0&&u.id!==b.active).x=1;assert.equal(P.interact(app,false),false);assert.equal(q.complete,false);assert.equal(q.completionProof,undefined);
}
let {q}=fixture(37);q.events.signal.terminal=false;assert.equal(P.interact(app,false),false);assert.equal(q.completionProof,undefined);
console.log('PASS Act4 exit interaction proof, probe, incomplete and failure atomicity');

for(const n of [33,34]){
 const {b,q}=fixture(n),watch=b.units.find(u=>u.side===1&&!u.dead);
 Object.assign(watch,{x:4810,y:1000,hp:1});
 b.honroAct4Design.exitWatch={ids:[watch.id],x1:4500,x2:5500,y1:800,y2:1200};
 assert.match(P.exitWatchHint(b),/적 1기/);
 assert.equal(P.interact(app,true),false);
 assert.equal(P.interact(app,false),false);
 assert.equal(q.complete,false);
 watch.y=1300;
 assert.equal(P.interact(app,true),true,'an enemy outside the upper exit route must not block departure');
 assert.equal(P.interact(app,false),true);
 assert.equal(b.phase,'won');
}
