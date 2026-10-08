import assert from 'node:assert/strict';
import {appHarness,plain} from './app-regression-helpers.mjs';
const h=await appHarness(),{g}=h,R=g.HonroOpenStructures,rows=R.rows;
const revert=p=>{p=plain(p);for(const r of rows){const t=r.kind==='asset'?p.library.find(a=>a.id===r.id):p.stages.find(s=>s.metadata.stageId===r.stage).terrains.find(t=>t.id===r.id);t.oneWay=false;if(r.kind==='terrain')t.properties=plain(r.before.properties);}return p;};
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
console.log('PASS ten canonical Continue/export/import paths, exact 70 flags, actor/resources preservation, rejection/idempotence and bounded Workshop autosave migration');
