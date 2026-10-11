// Current-source dialogue fixture: only the encounter distance is controlled.
// App scene queue/save/Continue are production; no normal clear/browser claim.
import assert from 'node:assert/strict';
import {appHarness,plain} from './app-regression-helpers.mjs';
const h=await appHarness(),{g}=h,key='act2:first-spirit-encounter';
let app=h.load(h.profileThrough(10));app.launch(11);h.finish(app);
assert(!app.profile.seen[key]);
const b=app.engine.b,spirit=b.units.find(u=>u.honroSpirit&&!u.dead),hero=app.engine.heroesAlive()[0];
assert(spirit);assert(!b.honroMarkers.some(m=>m.id.startsWith('spirit-lamp')));
hero.x=spirit.x-320;hero.y=spirit.y;app.actorBoundary=hero.id;g.HonroAct2.tick(app,0);
assert(app.profile.seen[key]);const guide=app.dialogue?.lines.find(l=>l[0]==='안내');
assert(guide?.[1].includes('혼령탄(O01)'));assert(guide[1].includes('현형 없이도'));
assert(!guide[1].includes('O08'));assert(!guide[1].includes('원혼등불'));
const lines=plain(app.dialogue.lines);assert(app.profile.honroBattle.honroStory);
app=h.reload();h.click('continue');assert.deepEqual(plain(app.dialogue.lines),lines);
h.finish(app);g.HonroAct2.tick(app,0);assert(!app.dialogue?.lines.some(l=>l[2]?.storyId===key));
console.log('PASS current first-spirit scene gives an available O01 action, survives actual Continue, and remains once-only');
