/** Prepared pre-sluice arrival, not combat completion. Only the active hero's
 * arrival pose and the three existing local threats' subdued facts are inputs.
 * The two distant minecarts and all other actors retain source poses/resources. */
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {appHarness,plain} from './app-regression-helpers.mjs';
import {battlefield} from '../game/tests/helpers.mjs';
const h=await appHarness(),{g}=h,p=h.profileThrough(14);
for(const cls of p.recruited)p.heroes[cls].xp=g.HonroProgression.xpAt(g.HonroProgression.plan(15).entryLevel);
p.settings.debugMode=false;p.settings.music=false;p.settings.sound=false;
const {b}=battlefield(g,15,{profile:p}),original=plain(b.units),m=b.honroMarkers.find(m=>m.id==='sluice'),u=b.units.find(u=>u.side===0);
Object.assign(u,{x:m.x,y:m.y,vx:0,vy:0,jumping:false,airborne:false});b.active=u.id;b.side=0;b.phase='aim';
const threats=g.HonroAct2.interactionThreats(b,m);for(const v of threats)v.honroSubdued=true;
assert.deepEqual(threats.map(v=>v.id).sort(),['a2-enemy-5','a2-enemy-6','a2-enemy-8']);
for(const id of ['a2-enemy-15','a2-enemy-17'])assert.deepEqual(plain(b.units.find(v=>v.id===id)),original.find(v=>v.id===id));
assert(b.terrain.find(t=>t.id==='fc15-drained-ledge').broken);assert(!g.HonroAct2.memory(b).done.sluice);
p.honroBattle=plain(b);
const out='_local/reports/stage15-drain-art-release-20261022';await mkdir(out,{recursive:true});
await writeFile(out+'/browser-input.json',JSON.stringify({checkedCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),scope:'Prepared arrival and local subdued facts; not normal combat arrival. No completed sluice or activated ledge is supplied.',prepared:{activeHero:u.id,arrival:{x:m.x,y:m.y},subduedIds:threats.map(v=>v.id)},profile:p},null,2));
console.log('Prepared normal-mode pre-sluice browser input; original minecarts exact, no drain completion facts.');
