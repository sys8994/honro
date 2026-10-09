import {beforeCurrentStage17Worksite} from './stage17-worksite-history-helpers.mjs';
import assert from 'node:assert/strict';
import {appHarness,plain} from './app-regression-helpers.mjs';

const {g,load,reload,profileThrough,finish,click}=await appHarness();
// Preserve the old cave-roster counts after the exact reviewed Stage16/17 deltas.
// Live first-sighting/dialogue/save behavior below still uses the current runtime.
const project=beforeCurrentStage17Worksite(g.HONRO_PROJECT),counts=[];
for(const [id,bats,spirits] of [[13,8,1],[14,10,3],[15,9,0],[16,5,6],[17,4,5],[18,10,6]]){
 const units=project.stages[id-1].units.filter(u=>u.team==='enemy');
 const actualBats=units.filter(u=>u.kind==='bat').length,actualSpirits=units.filter(u=>['resonance','echo','bellCluster','monkVessel'].includes(u.kind)).length;
 assert.equal(actualBats,bats,`stage ${id} bat group`);assert.equal(actualSpirits,spirits,`stage ${id} remaining story spirits`);
 counts.push([id,actualBats,actualSpirits]);
}
assert(g.HONRO_PROJECT.stages[18].units.some(u=>u.kind==='bellCluster'),'the chapter 19 release rite remains a spirit encounter');
let app=load(profileThrough(10));app.launch(11);finish(app);
assert(!app.profile.seen['act2:first-spirit-encounter']);
const spirit=app.engine.b.units.find(u=>u.honroSpirit&&!u.dead),hero=app.engine.heroesAlive()[0];assert(spirit&&hero);
hero.x=spirit.x-320;hero.y=spirit.y;app.actorBoundary=hero.id;g.HonroAct2.tick(app,0);
assert(app.profile.seen['act2:first-spirit-encounter']);
assert(app.dialogue?.lines.some(l=>l[1].includes('현형부')));
assert(app.dialogue?.lines.some(l=>l[0]==='안내'&&l[1].includes('O08')));
const lines=plain(app.dialogue.lines),saved=plain(app.profile.honroBattle);
assert(saved.honroStory,'the encounter dialogue must be saved with its battle');
app=reload();click('continue');assert.deepEqual(plain(app.dialogue.lines),lines);
finish(app);g.HonroAct2.tick(app,0);assert(!app.dialogue?.lines?.some(l=>l[2]?.storyId==='act2:first-spirit-encounter'));
console.log('PASS first Act 2 spirit sighting explains 현형부 once, survives resume; cave roster',JSON.stringify(counts));
