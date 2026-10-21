import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {act1Runtime,fixture,plain} from './act1-spatial-test-helpers.mjs';
const g=await act1Runtime(),q=fixture(g,10),{b,e,app,st}=q,W=g.HonroSodanWithdrawal;
const boss=e.unit('boss');Object.assign(b.honroState,{sodanCoop:true,coopHold:6,finaleRevision:2,finaleDefenseTurns:6,finaleLastEnemyEnd:b.teamEnds[1],finaleWave:5,finaleAnchor:{x:boss.x,y:boss.y}});Object.assign(boss,{side:2,honroAlly:true,fixed:true});app.actorBoundary=e.active.id;
assert(!g.HonroObjectives.state(b,st).complete,'six turns alone cannot complete');
W.tick(app);assert.equal(b.honroState.sodanWithdrawal.phase,'escape');assert.equal(g.HonroObjectives.state(b,st).targets[0].id,'sodan-safe-exit','offscreen draw budget must prioritize the escape marker');
const units=b.units.length;for(let j=0;j<5;j++){b.teamEnds[1]++;g.HonroMission.finale(app);}assert.equal(b.units.length,units,'no ritual reinforcements after turn six');
const before=plain(b),goal=W.exit(b),hero=e.active;hero.x=goal.x;hero.y=goal.y-250;W.tick(app);assert.equal(b.honroState.sodanWithdrawal.phase,'escape','must arrive on the real supported exit');hero.y=goal.y;hero.vx=hero.vy=0;hero.airborne=hero.jumping=false;b.phase='aim';b.side=0;W.tick(app);assert.equal(b.honroState.sodanWithdrawal.phase,'withdrawing');assert.equal(g.HonroObjectives.state(b,st).complete,false,'short extraction precedes victory');assert.equal(b.honroState.sodanWithdrawal.party.length,4);
const restored=new g.HONRO_CORE.Engine(plain(b));assert.equal(restored.b.honroState.sodanWithdrawal.phase,'withdrawing');assert.deepEqual(plain(restored.b.heroes),plain(b.heroes));assert.deepEqual(plain(restored.b.items),plain(b.items));
Object.assign(boss,{dead:true,hp:0});app.checkMission(e);assert.equal(b.phase,'lost','Sodan death remains failure before withdrawal');assert.equal(b.units.filter(u=>u.side===1&&!u.dead).length,before.units.filter(u=>u.side===1&&!u.dead).length,'remaining enemies are not auto-killed');
console.log('PASS six-turn boundary, finite waves, grounded exit, all-party extraction, save state/resources, Sodan failure, surviving enemies');

const frozen=JSON.parse(await readFile('game/docs/stage-review/act-endings/evidence/normal-21-combat.json','utf8')).battleEnd;
const original=JSON.stringify(frozen),projected=W.outro(frozen,frozen.honroStory.lines),indices=[0,1,4,9,15];
projected.forEach((row,i)=>{if(indices.includes(i)){assert.equal(row[1],g.HONRO_CONTENT.stages[9].outro[i][1]);assert.deepEqual(plain(row.slice(2)),frozen.honroStory.lines[i].slice(2));}else assert.deepEqual(plain(row),frozen.honroStory.lines[i]);});
assert.deepEqual(plain(W.outro(frozen,projected)),plain(projected),'approved saved dialogue projection is idempotent');assert.equal(JSON.stringify(frozen),original,'saved cursor/resources and snapshot stay untouched');
assert.deepEqual(plain(W.outro({...frozen,phase:'aim'},frozen.honroStory.lines)),frozen.honroStory.lines,'live combat prose is preserved');
console.log('PASS actual saved outro projects only five approved phrases, preserving every other line/metadata/cursor/resources, idempotently');
