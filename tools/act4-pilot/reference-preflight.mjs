/** Actual App snapshot parity gate; isolated contact fixture is not campaign play. */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
export async function referencePreflight(g,p,st){
 const bytes=await readFile('tests/fixtures/act4-pilot-app-preflight31.json'),app=JSON.parse(bytes),C=g.HONRO_CORE;
 assert.equal(app.kind,'actual-App-created-cohort-preflight');assert.equal(app.mode,'campaign');assert.equal(app.difficulty,'normal');for(const k of ['training','customMap','honroCustom'])assert.equal(app[k],false,k);
 const b=C.createBattle(1,structuredClone(p),'practice',{party:['archer'],distance:900});b.honroStage=31;
 const roster=JSON.parse(await readFile('tools/act4-pilot/layouts/stage31-roster.json'));const placements=roster.cells.flatMap(c=>c.placements);
 const checked=[];for(const expected of app.units){
  const placement=placements.find(q=>q.id===expected.id),hero=expected.side===0,kind=hero?expected.cls:expected.honroVariant;
  const u=g.HonroUnits.create({id:expected.id,kind,team:hero?'player':'enemy',x:600,y:600,...(!hero?{stageOverrides:{h:expected.honroPilotRole==='midboss'?106:placement?.elite?104:96,r:expected.honroPilotRole==='midboss'?26:placement?.elite?24:22,role:({guard:'guard',bow:'bow',bind:'ice',arc:'guard',close:'leaper',midboss:'guard'})[expected.honroPilotRole],armor:expected.honroPilotRole==='guard'||expected.honroPilotRole==='midboss'?.15:.04,honroMidboss:!!expected.honroMidboss,boss:0}}:{})},b,p,st);
  const fields=hero?['h','r','role','armor','attack','ranks','equipmentIds','maxHp','level']:['h','r','role','armor','ranks','existenceDefense','honroVariant','honroType'];
  for(const key of fields)assert.equal(JSON.stringify(u[key]),JSON.stringify(expected[key]),`${expected.id}.${key}: actual App parity`);
  checked.push({id:expected.id,fields});
 }
 return {kind:'actual-App-parity-before-isolated-contact',sha256:createHash('sha256').update(bytes).digest('hex'),sourceCommit:app.sourceCommit,mode:app.mode,difficulty:app.difficulty,training:app.training,checked,fixtureMode:'practice',excluded:['turn lifecycle','revival','victory','accuracy','play acceptance'],note:'No Engine.tick is invoked by contact matrix; native projectile/melee integration only. Enemy HP/attack are intentional calibration variables, not copied from obsolete v1 budget.'};
}
