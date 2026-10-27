/** Actual Lv17 production export plus explicit legacy-field/XP boundary probes.
 * DOM/storage are App harness doubles. The real source run stopped at the
 * failed Continue; obsolete geometry restarts while owned growth survives.
 * Exact battle continuity applies only after the current revision is stamped. */
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {appHarness,plain} from './app-regression-helpers.mjs';
import {escortEntryProfile} from './stage23-escort-entry-helper.mjs';
const file='tests/fixtures/stage23-escort-level17-dock-mid.json',bytes=await readFile(file),saved=JSON.parse(bytes),h=await appHarness(),{g,C}=h,P=g.HonroProgression,rows=[];
const hash=b=>createHash('sha256').update(b).digest('hex'),crit=u=>({critChance:u.critChance,critMultiplier:u.critMultiplier});
assert.equal(saved.sourceSha256,'db3399a0d18471af318787703dd381a3cf32d74fdd471f8ef70f91b60a0994cf');assert.equal(saved.provenance.sourceCommit,'aca4e414168f0daa54695b0953db0b77fb9203f9');assert.equal(saved.round,16);assert.equal(saved.frames,40593);
const bodies=b=>b.units.filter(u=>u.side===0&&!u.summoned),legacy=u=>crit(C.heroStats({xp:C.xpAtLevel(u.level||1),ranks:u.ranks||{}},u.cls)),trained=(b,u)=>crit(C.heroStats({...b.heroes[u.cls],ranks:u.ranks||{}},u.cls,u.loadout));
async function check(name,fn){await fn();rows.push(name);console.log('PASS',name);}
await check('actual Lv17 dock-mid export restarts obsolete geometry while preserving paid growth, SP, equipment and completion; current revision stays exact across four resumes',async()=>{
 const old=plain(saved.profile),snapshot=old.honroBattle,revision=g.HonroCampaignMapRevision.current(23);
 // The identical missing-revision fixture fails the former exact-snapshot
 // assertion on public0f19 too. Never stamp old terrain just to bypass discard.
 assert.equal(snapshot.honroCampaignMapRevision,undefined);assert(revision>0);assert(g.HonroCampaignMapRevision.obsolete(snapshot));
 let app=h.load(old);assert.equal(app.profile.honroBattle,null);assert.equal(app.profile.honroMapRestart,23);
 for(const cls of old.recruited){const hero=app.profile.heroes[cls];assert.equal(hero.xp,Math.max(old.heroes[cls].xp,snapshot.heroes[cls].xp));assert.deepEqual(plain(hero.ranks),old.heroes[cls].ranks);assert.equal(hero.statTraining,old.heroes[cls].statTraining);assert.equal(C.pointsSpent(hero,cls),C.pointsSpent(old.heroes[cls],cls));assert.equal(C.pointsEarned(hero),C.pointsEarned(snapshot.heroes[cls]));}
 for(const key of ['loadouts','cleared','party','recruited','record','seen'])assert.deepEqual(plain(app.profile[key]),old[key],key+' preserved');
 assert.deepEqual(plain(app.profile.honroGrowth),snapshot.honroGrowth.ledger);const owned=plain(app.profile.heroes),gear=plain(app.profile.loadouts),ledger=plain(app.profile.honroGrowth);
 // initialize stamps the already-paid historical stage as immutable policy3.
 // Its credits, limits and cleared flags must otherwise remain byte-identical.
 ledger.stages[23].policy??=3;
 app.continue();h.finish(app);assert.equal(app.engine.b.honroStage,23);assert.equal(app.engine.b.honroCampaignMapRevision,revision);assert(!app.engine.b.cast);assert(!app.engine.b.projectiles.length);assert.deepEqual(plain(app.engine.b.heroes),owned);assert.deepEqual(plain(app.profile.loadouts),gear);assert.deepEqual(plain(app.profile.honroGrowth),ledger);
 for(const u of bodies(app.engine.b)){assert.equal(u.level,17);assert.equal(app.engine.b.heroes[u.cls].statTraining,6);assert.deepEqual(crit(u),crit(C.heroStats(app.engine.b.heroes[u.cls],u.cls)));assert.notDeepEqual(crit(u),legacy(u));}
 // Non-default resources make the same-revision assertion detect an accidental
 // fresh rebuild, even if its geometry/hero data happened to compare equal.
 const archer=app.engine.unit('p-archer');archer.hp-=31;archer.focus-=7;archer.moveLeft=37;app.engine.b.items.heal=1;
 for(let i=0;i<4;i++){const before=plain(app.engine.b);P.initialize(app.engine.b,app.profile);assert.deepEqual(plain(app.engine.b),before);app.export();const exported=await h.exported();await h.import(exported);assert.equal(app.lastNotice,'기록을 불러왔어.');app.continue();assert.deepEqual(plain(app.engine.b),before);app.mount(app.engine.b);assert.deepEqual(plain(app.engine.b),before);assert.deepEqual(plain(app.profile.heroes),owned);assert.deepEqual(plain(app.profile.loadouts),gear);assert.deepEqual(plain(app.profile.cleared),old.cleared);}
});
await check('fresh entry includes trained critical stats and an explicit v3 XP grant applies the same Lv17 stats',async()=>{
 let app=h.load({...plain(g.AppRegression.fresh()),...plain(escortEntryProfile(g).profile)});app.launch(23);h.finish(app);const e=app.engine,b=e.b;
 for(const u of bodies(b)){assert.equal(u.level,16);assert.deepEqual(crit(u),trained(b,u));}
 // This case deliberately exercises the retained v3 award path; v4 actual hits are tested separately.
 const state=b.honroGrowth.ledger.stages[23];delete state.contribution;state.policy=3;
 const before=bodies(b).map(u=>({id:u.id,x:u.x,y:u.y,ranks:plain(u.ranks),loadout:plain(u.loadout)})),grant=C.xpAtLevel(17)-b.heroes.archer.xp;assert(grant>0&&grant<b.honroGrowth.limit.combat);P.awardCombat(e,null,grant);
 for(const u of bodies(b)){assert.equal(u.level,17);assert.deepEqual(crit(u),crit(C.heroStats(b.heroes[u.cls],u.cls)));assert.notDeepEqual(crit(u),legacy(u));assert.equal(b.honroGrowth.ledger.stages[23].combat[u.cls],grant);}
 assert.deepEqual(bodies(b).map(u=>({id:u.id,x:u.x,y:u.y,ranks:plain(u.ranks),loadout:plain(u.loadout)})),before);
 for(let i=0;i<3;i++){const before=plain(app.engine.b);app.export();app=h.load(await h.exported());app.continue();assert.deepEqual(plain(app.engine.b),before);}
});
await check('missing/non-finite legacy crit fields are initialized independently; existing finite fields are retained',()=>{
 for(const missing of ['critChance','critMultiplier']){const b=plain(saved.profile.honroBattle),u=bodies(b)[0],other=missing==='critChance'?'critMultiplier':'critChance',expected=trained(b,u),kept=u[other];delete u[missing];P.initialize(b,saved.profile);assert.equal(u[missing],expected[missing]);assert.equal(u[other],kept);const fixed=crit(u);P.initialize(b,saved.profile);assert.deepEqual(crit(u),fixed);}
 const b=plain(saved.profile.honroBattle),u=bodies(b)[0];u.critChance=NaN;u.critMultiplier=Infinity;P.initialize(b,saved.profile);assert.deepEqual(crit(u),trained(b,u));
});
await check('old stage23, other chapters, custom battles and no-ledger initialization use saved training in normalization',()=>{
 for(const mode of ['old23','12','18','30','custom','no-growth','no-ledger']){const b=plain(saved.profile.honroBattle);if(mode==='old23')delete b.honroEscortYardRevision;else if(['12','18','30'].includes(mode))b.honroStage=Number(mode);else if(mode==='custom')b.honroCustom=true;else if(mode==='no-growth')delete b.honroGrowth;else delete b.honroGrowth.ledger;P.initialize(b,saved.profile);for(const u of bodies(b))assert.deepEqual(crit(u),trained(b,u),mode);}
});
const out='_local/reports/stage23-escort';await mkdir(out,{recursive:true});await writeFile(out+'/growth-resume.json',JSON.stringify({passed:true,fixtureSha256:hash(bytes),sourceExportSha256:saved.sourceSha256,sourceCommit:saved.provenance.sourceCommit,currentRuntimeSha256:hash(await readFile('shared/runtime/stage23-escort.js')),sharedGrowthSha256:hash(await readFile('shared/runtime/progression.js')),rows,limits:['Actual source play reached R16/Lv17/dock-mid but failed Continue; no fullplay pass claimed.','XP-boundary calls, missing-field variants and scope variants are explicit fixtures.','DOM/storage/render/frame scheduling are doubles, not a browser.']},null,2)+'\n');
