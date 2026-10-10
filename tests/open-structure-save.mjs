import assert from 'node:assert/strict';
import {appHarness,plain} from './app-regression-helpers.mjs';
import {withHistoricalStage23,stage30FerryOriginal,stage30FerryBefore,escortHistoryHash as hash} from './stage8-bier-history-helpers.mjs';
const h=await appHarness(),{g}=h,R=g.HonroOpenStructures,rows=R.rows;
const revert=p=>{p=plain(p);for(const r of rows){const t=r.kind==='asset'?p.library.find(a=>a.id===r.id):p.stages.find(s=>s.metadata.stageId===r.stage).terrains.find(t=>t.id===r.id);t.oneWay=false;if(r.kind==='terrain')t.properties=plain(r.before.properties);}return p;};
// Capture only validated historical data in the synchronous boundary. Async
// Continue/import checks run below with current production functions unchanged.
const currentData={project:g.HONRO_PROJECT,content23:g.HONRO_CONTENT.stages[22],balance23:g.HONRO_BALANCE.stages[22]},currentSnapshot=plain({project:g.HONRO_PROJECT,content:g.HONRO_CONTENT,balance:g.HONRO_BALANCE});
const historicalData=withHistoricalStage23(g,()=>({project:g.HONRO_PROJECT,content23:g.HONRO_CONTENT.stages[22],balance23:g.HONRO_BALANCE.stages[22]}));
assert.equal(hash(stage30FerryOriginal.stage),stage30FerryBefore.stages.find(s=>s.id==='stage-30').sha256,'Exact immutable pre-ferry Stage30 data fixture');
historicalData.project.stages[29]=plain(stage30FerryOriginal.stage);
for(let i=0;i<30;i++)if(i!==22&&i!==29)assert.deepEqual(plain(historicalData.project.stages[i]),plain(currentData.project.stages[i]),'Only Stage23/30 historical map fixtures project; current stage '+(i+1)+' stays exact');
try{
 g.HONRO_PROJECT=historicalData.project;g.HONRO_CONTENT.stages[22]=historicalData.content23;g.HONRO_BALANCE.stages[22]=historicalData.balance23;
const oldProject=revert(g.HONRO_PROJECT),current=g.HONRO_PROJECT;
for(const id of [...new Set(rows.map(r=>r.stage))]){
 const p=h.profileThrough(30);p.settings.debugMode=false;const app=h.load(p);
 // Compile a real pre-D snapshot; no invented geometry or added colliders.
 app.launch(id);h.finish(app);const b=plain(app.engine.b),oldMap=g.HonroMaps.compile(oldProject.stages[id-1],oldProject);
 for(const [list,old]of[[b.terrain,oldMap.terrain],[b.honroWorldTerrain,oldMap.worldTerrain]])for(const t of list){const z=old.find(z=>z.id===t.id);t.oneWay=z.oneWay;if(z.honroCeiling)t.honroCeiling=true;if(z.honroLocationCeiling)t.honroLocationCeiling=true;}
 for(const e of [...b.honroElements,...b.honroLandmarks])if(e.asset&&rows.some(r=>r.kind==='asset'&&r.id===e.asset.id))e.asset.oneWay=false;
 b.round=7;b.items.heal=1;
 for(const u of b.units){u.hp=Math.max(1,u.hp-5);u.focus=Math.max(0,u.focus-2);}
 const before=plain(b),stable=x=>plain({units:x.units,items:x.items,heroes:x.heroes,round:x.round,state:x.honroState,projectiles:x.projectiles,active:x.active,markers:x.honroMarkers,events:x.honroEvents});
 assert(R.upgradeBattle(b),'stage '+id);assert.deepEqual(stable(b),stable(before));
 const expected=g.HonroMaps.compile(current.stages[id-1],current);
 for(const [a,z]of[[b.terrain,expected.terrain],[b.honroWorldTerrain,expected.worldTerrain]])assert.deepEqual(plain(a.map(t=>[t.id,t.vertices,t.oneWay,!!t.honroCeiling])),plain(z.map(t=>[t.id,t.vertices,t.oneWay,!!t.honroCeiling])));
 const once=JSON.stringify(b);assert.equal(R.upgradeBattle(b),false);assert.equal(JSON.stringify(b),once);
 for(const mutate of [b=>delete b.honroMapOrigin,b=>b.honroMapOrigin='workshop',b=>b.honroCustom=true,b=>b.terrain[0].vertices[0].x++,b=>b.honroWorldTerrain[0].vertices[0].y++,b=>b.honroMapAnchors.start.x++]){const q=plain(before);mutate(q);const prior=JSON.stringify(q);assert.equal(R.upgradeBattle(q),false);assert.equal(JSON.stringify(q),prior);}
 app.profile.honroBattle=plain(before);app.continue();h.finish(app);assert.equal(app.engine.b.honroOpenStructureRevision,1);assert.deepEqual(stable(app.engine.b),stable(before));
 app.export();await h.import(await h.exported());app.continue();h.finish(app);assert.deepEqual(stable(app.engine.b),stable(before));
}
const old=plain(oldProject);assert(R.upgradeProject(old));assert.deepEqual(old,plain(current));assert.equal(R.upgradeProject(old),false);
// Unedited canonical autosaves upgrade, but any edited stage protects its shared assets.
const custom=plain(oldProject);for(const s of custom.stages)s.width++;const prior=JSON.stringify(custom);assert.equal(R.upgradeProject(custom),false);assert.equal(JSON.stringify(custom),prior);
const imported=g.HonroMaps.normalize(oldProject);assert.deepEqual(plain(imported),oldProject,'Generic normalization/import stays lossless');
}finally{
 g.HONRO_PROJECT=currentData.project;g.HONRO_CONTENT.stages[22]=currentData.content23;g.HONRO_BALANCE.stages[22]=currentData.balance23;
}
assert.equal(g.HONRO_PROJECT,currentData.project);assert.equal(g.HONRO_CONTENT.stages[22],currentData.content23);assert.equal(g.HONRO_BALANCE.stages[22],currentData.balance23);
assert.deepEqual(plain({project:g.HONRO_PROJECT,content:g.HONRO_CONTENT,balance:g.HONRO_BALANCE}),currentSnapshot,'Historical migration fixture restores complete current data and original references');
// New Stage23/30 have no old D element targets. A no-op must preserve every
// saved battle field instead of injecting migration flags or old geometry.
for(const id of [23,30]){
 const p=h.profileThrough(30);p.settings.debugMode=false;const app=h.load(p);app.launch(id);h.finish(app);
 assert((id===23?g.HonroStage23Escort:g.HonroStage30Ferry).active(app.engine.b),'No-op control uses current authored Stage'+id);
 const before=JSON.stringify(app.engine.b);assert.equal(R.upgradeBattle(app.engine.b),false,'Current Stage'+id+' has no historical D target to upgrade');assert.equal(JSON.stringify(app.engine.b),before,'Current Stage'+id+' no-op preserves the entire battle');
}
console.log('PASS twelve canonical Continue/export/import paths, exact 74 flags, actor/resources preservation, rejection/idempotence and bounded Workshop autosave migration; exact Stage23/30 data-only historical fixtures and whole-current23/30 no-ops');
