/** Genuine pre-geology saves: only the obsolete battle is restarted. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import {appHarness,plain} from './app-regression-helpers.mjs';
const h=await appHarness(),{g}=h,rows=[];
const base='game/docs/stage-review/stage12-quarry/evidence/normal/';
for(const name of ['initial','sign-action','gate-open','round11','terminal']){
 const saved=JSON.parse(gunzipSync(await readFile(base+name+'.json.gz'))),p=plain(saved.profile);p.honroBattle=plain(saved.b);
 const heroes=plain(p.heroes),loadouts=plain(p.loadouts),cleared=plain(p.cleared),settings=plain(p.settings),recruited=plain(p.recruited),ledger=plain(p.honroGrowth);
 for(const cls of recruited)heroes[cls].xp=Math.max(heroes[cls].xp||0,saved.b.heroes[cls].xp||0);
 const app=h.load(p);assert.equal(app.profile.honroBattle,null);assert.equal(app.profile.honroMapRestart,12);
 for(const cls of recruited){assert.equal(app.profile.heroes[cls].xp,heroes[cls].xp);for(const key of ['ranks','stats','equipment','spSpent'])if(heroes[cls][key]!==undefined)assert.deepEqual(plain(app.profile.heroes[cls][key]),heroes[cls][key]);assert.equal(g.HONRO_CORE.pointsEarned(app.profile.heroes[cls])-g.HONRO_CORE.pointsSpent(app.profile.heroes[cls],cls),g.HONRO_CORE.pointsEarned(heroes[cls])-g.HONRO_CORE.pointsSpent(heroes[cls],cls));}
 for(const [key,v]of Object.entries({loadouts,cleared,settings,recruited}))assert.deepEqual(plain(app.profile[key]),v,key);
 // Every prior payment survives; a restart pays no new combat/objective XP.
 for(const [stage,row]of Object.entries(ledger?.stages||{}))for(const [cls,paid]of Object.entries(row.combat||{}))assert(app.profile.honroGrowth.stages[stage].combat[cls]>=paid);
 const before=plain(app.profile.heroes);app.continue();h.finish(app);assert.equal(app.engine.b.honroStage,12);assert.equal(app.engine.b.honroCampaignMapRevision,1);assert.equal(app.engine.b.round,1);assert.deepEqual(plain(app.profile.heroes),before);
 const fresh=app.engine.b.terrain.find(t=>t.id==='sq-north-quarry'),old=saved.b.terrain.find(t=>t.id===fresh.id);assert.notDeepEqual(plain(fresh.vertices),old.vertices);
 app.stopBattle();const same=plain(app.profile),expected=plain(same.honroBattle);const resumed=h.load(same);resumed.continue();assert.deepEqual(plain(resumed.engine.b),expected,'Same revision retains exact battle');
 rows.push({name,oldRound:saved.b.round,oldPhase:saved.b.phase,newRound:1,growthAndSP:true,equipment:true,campaign:true,sameRevisionExact:true});
}
const completed=JSON.parse(await readFile(base+'victory-profile.json','utf8')).profile;
assert(completed.cleared[12]);const continued=h.load(plain(completed));
for(const key of ['cleared','heroes','loadouts','recruited'])assert.deepEqual(plain(continued.profile[key]),completed[key],'Already completed12 '+key);
continued.launch(13);h.finish(continued);assert.equal(continued.engine.b.honroStage,13);assert.equal(continued.engine.b.honroEntryVariant.choice,'B');
rows.push({name:'already completed original12',growthAndSP:true,equipment:true,campaign:true,nextStage:13,route:'B'});
const workshop={...plain(h.load(h.profileThrough(11)).profile.honroBattle||{}),mode:'campaign',honroStage:12,honroRevision:20,honroCustom:true,honroMapOrigin:'workshop'};assert.equal(g.HonroCampaignMapRevision.obsolete(workshop),false);
await mkdir('/tmp/stage12-v3/checks',{recursive:true});await writeFile('/tmp/stage12-v3/checks/save.json',JSON.stringify({pass:true,rows,workshopExcluded:true,scope:'Production App with DOM/storage doubles; original genuine saves remain byte-for-byte untouched.'},null,2));console.log('PASS genuine old12 saves restart only battle, growth/SP/loadouts/progress preserved; same revision exact');
