/** Actual Lv17 production export plus explicit legacy-field/XP boundary probes.
 * DOM/storage are App harness doubles. The real source run stopped at the
 * failed Continue; this is not normal completion or corrected-geometry proof. */
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {appHarness,plain} from './app-regression-helpers.mjs';
import {escortEntryProfile} from './stage23-escort-entry-helper.mjs';
const file='tests/fixtures/stage23-escort-level17-dock-mid.json',bytes=await readFile(file),saved=JSON.parse(bytes),h=await appHarness(),{g,C}=h,P=g.HonroProgression,rows=[];
const hash=b=>createHash('sha256').update(b).digest('hex'),crit=u=>({critChance:u.critChance,critMultiplier:u.critMultiplier});
assert.equal(saved.sourceSha256,'db3399a0d18471af318787703dd381a3cf32d74fdd471f8ef70f91b60a0994cf');assert.equal(saved.provenance.sourceCommit,'aca4e414168f0daa54695b0953db0b77fb9203f9');assert.equal(saved.round,16);assert.equal(saved.frames,40593);
const bodies=b=>b.units.filter(u=>u.side===0&&!u.summoned),legacy=u=>crit(C.heroStats({xp:C.xpAtLevel(u.level||1),ranks:u.ranks||{}},u.cls));
async function check(name,fn){await fn();rows.push(name);console.log('PASS',name);}
await check('actual Lv17 dock-mid export retains every battle field over four import/Continue and initialize repeats',async()=>{
 let app=h.load(saved.profile);app.continue();assert.deepEqual(plain(app.engine.b),saved.profile.honroBattle);
 for(const u of bodies(app.engine.b)){assert.equal(u.level,17);assert.equal(app.engine.b.heroes[u.cls].statTraining,6);assert.deepEqual(crit(u),crit(C.heroStats(app.engine.b.heroes[u.cls],u.cls)));assert.notDeepEqual(crit(u),legacy(u));}
 for(let i=0;i<4;i++){const before=plain(app.engine.b);P.initialize(app.engine.b,app.profile);assert.deepEqual(plain(app.engine.b),before);app.export();const exported=await h.exported();await h.import(exported);assert.equal(app.lastNotice,'기록을 불러왔어.');app.continue();assert.deepEqual(plain(app.engine.b),before);app.mount(app.engine.b);assert.deepEqual(plain(app.engine.b),before);}
});
await check('fresh entry follows legacy initialization and an actual production XP grant still applies trained Lv17 stats',async()=>{
 let app=h.load({...plain(g.AppRegression.fresh()),...plain(escortEntryProfile(g).profile)});app.launch(23);h.finish(app);const e=app.engine,b=e.b;
 for(const u of bodies(b)){assert.equal(u.level,16);assert.deepEqual(crit(u),legacy(u));}
 const before=bodies(b).map(u=>({id:u.id,x:u.x,y:u.y,ranks:plain(u.ranks),loadout:plain(u.loadout)})),grant=C.xpAtLevel(17)-b.heroes.archer.xp;assert(grant>0&&grant<b.honroGrowth.limit.combat);P.awardCombat(e,null,grant);
 for(const u of bodies(b)){assert.equal(u.level,17);assert.deepEqual(crit(u),crit(C.heroStats(b.heroes[u.cls],u.cls)));assert.notDeepEqual(crit(u),legacy(u));assert.equal(b.honroGrowth.ledger.stages[23].combat[u.cls],grant);}
 assert.deepEqual(bodies(b).map(u=>({id:u.id,x:u.x,y:u.y,ranks:plain(u.ranks),loadout:plain(u.loadout)})),before);
 for(let i=0;i<3;i++){const before=plain(app.engine.b);app.export();app=h.load(await h.exported());app.continue();assert.deepEqual(plain(app.engine.b),before);}
});
await check('missing/non-finite legacy crit fields are initialized independently; existing finite fields are retained',()=>{
 for(const missing of ['critChance','critMultiplier']){const b=plain(saved.profile.honroBattle),u=bodies(b)[0],other=missing==='critChance'?'critMultiplier':'critChance',expected=legacy(u),kept=u[other];delete u[missing];P.initialize(b,saved.profile);assert.equal(u[missing],expected[missing]);assert.equal(u[other],kept);const fixed=crit(u);P.initialize(b,saved.profile);assert.deepEqual(crit(u),fixed);}
 const b=plain(saved.profile.honroBattle),u=bodies(b)[0];u.critChance=NaN;u.critMultiplier=Infinity;P.initialize(b,saved.profile);assert.deepEqual(crit(u),legacy(u));
});
await check('old stage23, other chapters, custom battles and no-ledger initialization keep the prior normalization path',()=>{
 for(const mode of ['old23','12','18','30','custom','no-growth','no-ledger']){const b=plain(saved.profile.honroBattle);if(mode==='old23')delete b.honroEscortYardRevision;else if(['12','18','30'].includes(mode))b.honroStage=Number(mode);else if(mode==='custom')b.honroCustom=true;else if(mode==='no-growth')delete b.honroGrowth;else delete b.honroGrowth.ledger;P.initialize(b,saved.profile);for(const u of bodies(b))assert.deepEqual(crit(u),legacy(u),mode);}
});
const out='_local/reports/stage23-escort';await mkdir(out,{recursive:true});await writeFile(out+'/growth-resume.json',JSON.stringify({passed:true,fixtureSha256:hash(bytes),sourceExportSha256:saved.sourceSha256,sourceCommit:saved.provenance.sourceCommit,currentRuntimeSha256:hash(await readFile('shared/runtime/stage23-escort.js')),sharedGrowthSha256:hash(await readFile('shared/runtime/progression.js')),rows,limits:['Actual source play reached R16/Lv17/dock-mid but failed Continue; no fullplay pass claimed.','XP-boundary calls, missing-field variants and scope variants are explicit fixtures.','DOM/storage/render/frame scheduling are doubles, not a browser.']},null,2)+'\n');
