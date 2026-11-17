import fs from 'node:fs';import vm from 'node:vm';
process.env.HONRO_ACT4_RELEASE='1';process.env.HONRO_ACT5_RELEASE='1';
const {runtime,battlefield}=await import('../game/tests/helpers.mjs');
const g=await runtime({legacyMaps:false,productionStory:true});
g.HONRO_APP_READY={then(){}};
for(const [name,file]of [['HONRO_ACT4_PILOT_COMBAT_REFERENCE','pilot-combat-reference.json'],['HONRO_ACT4_PREVIEW_SEEDS','reviewed.json']])g[name]=JSON.parse(fs.readFileSync('shared/data/act4/'+file));
for(const name of ['act4-art','act4-maps','act4-coast-maps','act4-coast-art','act4-events','act4-coast-events','act4-pilot-combat','act4-pilot-art'])vm.runInContext(fs.readFileSync('shared/runtime/'+name+'.js','utf8'),g);
fs.mkdirSync('_local/reports/monster-placement',{recursive:true});const all=[];
for(let id=1;id<=50;id++){try{const stage=g.HONRO_PROJECT.stages.find(s=>s.metadata?.stageId===id);let b;if(id>=31&&id<=40){g.HonroMaps.compile(stage,g.HONRO_PROJECT);b=g.HonroMaps.createBattle(stage,g.HONRO_PROJECT,g.HonroProfileStore.fresh());g.HonroStageRules.sanitizeStageBattle(b);}else b=battlefield(g,id).b;const units=b.units.filter(u=>u.side===1&&!u.dead&&!u.honroObjectiveTarget).map(u=>({id:u.id,kind:u.kind||u.type,role:u.role,x:u.x,y:u.y,group:u.group,support:u.honroEncounterSupport,elite:u.elite,boss:u.boss}));const xs=units.map(u=>u.x),ys=units.map(u=>u.y);all.push({id,n:units.length,width:b.w,height:b.h,rangeX:[Math.min(...xs),Math.max(...xs)],rangeY:[Math.min(...ys),Math.max(...ys)],units});console.log(id,units.length,Math.min(...xs),Math.max(...xs));}catch(e){all.push({id,error:e.message});console.log(id,e.message)}}fs.writeFileSync('_local/reports/monster-placement/all50-final-initial.json',JSON.stringify(all,null,2));

if(all.some(s=>s.error))process.exitCode=1;
