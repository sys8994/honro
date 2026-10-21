/** Real native normal-play terminal save -> production outcome -> Stage12.
 * No terminal state or earned growth is fabricated here. App DOM/storage are doubles. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {appHarness,plain} from './app-regression-helpers.mjs';
const input=process.env.HONRO_STAGE11_CHECKPOINT;if(!input)throw Error('HONRO_STAGE11_CHECKPOINT must name the genuine completed normal-play checkpoint');
const saved=JSON.parse(await readFile(input,'utf8')),h=await appHarness(),{g}=h,hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
assert.equal(saved.sourceHash,hash(g.HONRO_PROJECT));assert.equal(saved.b.phase,'won');assert.equal(saved.b.honroStage,11);
assert.equal(Object.keys(saved.b.honroState.act2.done).filter(k=>saved.b.honroState.act2.done[k]).length,6);
const profile=plain(saved.profile);profile.honroBattle=plain(saved.b);const before=profile.honroBattle.units.map(u=>({id:u.id,x:u.x,y:u.y,hp:u.hp,focus:u.focus,moveLeft:u.moveLeft,dead:u.dead}));
let app=h.load(profile);app.continue();assert.deepEqual(plain(app.engine.b.units.map(u=>({id:u.id,x:u.x,y:u.y,hp:u.hp,focus:u.focus,moveLeft:u.moveLeft,dead:u.dead}))),before,'Terminal Continue preserves physical battle state');
const b=app.engine.b,combatEarned=plain(b.heroes),expected=plain(b);g.HonroProgression.complete(expected);const earned=plain(expected.heroes);h.finish(app);app.outcome();h.finish(app);assert(app.profile.cleared[11]);
for(const cls of profile.recruited)assert.deepEqual(plain(app.profile.heroes[cls]),earned[cls],cls+' earned growth survives production outcome');
const ledger=b.honroGrowth.ledger.stages[11].contribution;assert(ledger.completed);assert.equal(ledger.spent+ledger.forfeited,ledger.total,'Completed contribution budget balances');
const after=plain(app.profile);g.HonroProgression.complete(b);assert.deepEqual(plain(b.heroes),earned,'Repeated completion cannot pay rewards twice');
app.export();const exported=await h.exported();assert(exported.cleared[11]);h.click('result-continue');h.finish(app);assert.equal(app.screen,'rest');assert(app.profile.recruited.includes('occultist'));
h.click('journey-enter',{id:'12'});h.finish(app);assert.equal(app.engine.b.honroStage,12);
for(const cls of profile.recruited)assert.deepEqual(plain(app.engine.b.heroes[cls]),after.heroes[cls],cls+' progression/loadout carries into12');
const out=process.env.HONRO_STAGE11_TRANSITION_OUT||'/tmp/stage11-transition';await mkdir(out,{recursive:true});await writeFile(out+'/victory-profile.json',JSON.stringify({profile:exported}));await writeFile(out+'/result.json',JSON.stringify({pass:true,input,sourceHash:saved.sourceHash,round:saved.b.round,nextStage:12,resident:saved.b.units.find(u=>u.honroProtected)?.hp,party:plain(app.profile.recruited),combatGrowth:combatEarned,growth:after.heroes,scope:'Production App outcome, exact terminal Continue and campaign transition from actual normal native play. DOM/storage doubles; not a fresh browser playthrough.'},null,2));console.log('PASS genuine normal11 terminal Continue, earned growth/reward once, export and Stage12 entry');
