/** Additive exact Stage12 boundary, above the unchanged Stage30/Stage18 leaves.
 * A namespace or revision flag never authorizes deletion: current map, assets,
 * runtime bytes, membership and order are checked before bounded projection.
 * Historical source strings are evidence only, never executable gameplay. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as ferry from './stage30-ferry-history-helpers.mjs';
export const quarryHistoryHash=ferry.ferryHistoryHash,quarryHistoryPlain=ferry.ferryHistoryPlain;
const hash=quarryHistoryHash,plain=quarryHistoryPlain;
export const stage12QuarryBefore=JSON.parse(readFileSync(new URL('./fixtures/stage12-quarry/history-before.json',import.meta.url),'utf8'));
export const stage12QuarryOriginal=JSON.parse(readFileSync(new URL('./fixtures/stage12-quarry/before-stage12.json',import.meta.url),'utf8'));
const f=stage12QuarryBefore,prefix=f.scope.addedAssetPrefix;
assert.equal(f.sourceCommit,'d7b9fdf6696c05e53012605b77200a5ba7389197');
assert.equal(f.sourceTree,'259267c90b40f03127d7fbe1a5d3b5960917aad4');
assert.equal(stage12QuarryOriginal.sourceCommit,f.sourceCommit);
assert.equal(stage12QuarryOriginal.sourceTree,f.sourceTree);
assert.equal(hash(stage12QuarryOriginal.stage),f.stages.find(s=>s.id==='stage-12').sha256);
const scoped=(rows,scope)=>scope==='full'?rows:rows.filter(s=>Number((s.id||s).slice(6))<=20);
const newAsset=a=>typeof a.id==='string'&&a.id.startsWith(prefix);
const globals=p=>Object.fromEntries(Object.entries(p).filter(([key])=>!['stages','library'].includes(key)));
const normalized=s=>s.replace(/\r\n/g,'\n');
export function stage12QuarryReview(){return JSON.parse(readFileSync(new URL('./fixtures/stage12-quarry/history-reviewed.json',import.meta.url),'utf8'));}
export function stage12QuarryRuntimeSources(){return ferry.stage30FerryRuntimeSources();}
// A single later UI correction sits above the immutable quarry scope. These
// exact line literals plus the frozen full-file digest authorize no other byte.
export const stage12QuarryHoldGuideDelta=Object.freeze({
 path:'shared/runtime/act2-art.js',
 before:"  guideBadge(c,scene,hold.x,hold.y+43/z,[`${hold.who} 유지 · ${hold.progress}/${hold.rounds}턴 · ${hold.status}`,'실선: 방어 범위 / 점선: 적 진입 금지'],color);",
 after:"  guideBadge(c,scene,hold.x,hold.y+43/z,[`${hold.who} 유지 · ${hold.progress}/${hold.rounds}${b.honroStage===12&&!b.honroCustom&&b.honroQuarryRevision===1?'라운드':'턴'} · ${hold.status}`,'실선: 방어 범위 / 점선: 적 진입 금지'],color);"
});
export function beforeStage12QuarryHoldGuideSource(source){
 const d=stage12QuarryHoldGuideDelta,row=f.runtime.files.find(r=>r.path===d.path);
 assert.equal(typeof source,'string','Complete current hold-guide source');
 assert.equal(source.split(d.after).length-1,1,'Exactly one approved quarry hold-guide line');
 assert.equal(source.split(d.before).length-1,0,'No original hold-guide line remains in current source');
 const original=source.replace(d.after,d.before);
 assert.equal(hash(original),row.sha256,'Exact original act2-art file after the single quarry UI reversal');return original;
}
export function beforeStage12QuarryHoldGuideSources(sources){
 const d=stage12QuarryHoldGuideDelta;return{...sources,[d.path]:beforeStage12QuarryHoldGuideSource(sources[d.path])};
}
const baseSource=path=>{const row=f.runtime.files.find(r=>r.path===path);assert(row&&Object.hasOwn(row,'before'),'Stored original quarry source '+path);return row.before;};
function currentReview(review){const r=review??stage12QuarryReview();assert.equal(r.version,1);assert.equal(r.sourceCommit,f.sourceCommit);assert.equal(r.sourceTree,f.sourceTree);assert.deepEqual(r.scope,f.scope,'Reviewed quarry scope is immutable');return r;}
function baseLibrary(library){
 const out=plain(library).filter(a=>!newAsset(a)),full=out.length===f.library.length,expected=f.library.filter(a=>full||!a.id.startsWith('a3-'));
 assert.deepEqual(out.map(a=>a.id),expected.map(a=>a.id),'Every original asset ID and order remains intact');
 for(const [i,a]of out.entries())assert.equal(hash(a),expected[i].sha256,'Unchanged original asset '+a.id);
 return{out,scope:full?'full':'act12'};
}
function assertContract(stage){
 const old=stage12QuarryOriginal,init=stage.initialState;
 assert.equal(stage.id,'stage-12');assert.deepEqual(stage.metadata,old.stage.metadata,'Stage12 retains its campaign identity');
 assert.deepEqual([stage.width,stage.height],[11200,8000]);assert.equal(init.honroQuarryRevision,1);assert.equal(init.honroObjectiveRevision,2);assert.equal(init.honroAct2Revision,2);assert.equal(init.honroActiveLimit,4);
 assert.deepEqual(init.honroAct2Steps,old.stage.initialState.honroAct2Steps,'Exact original five goals, class-free sign, four-round hold and eight finite carts');
 assert.deepEqual(stage.events,old.stage.events,'No extra authored responses');assert.deepEqual(stage.objectives,old.stage.objectives,'No substitute objective system');
 const budgets={candidate26e6:[26,6,34],candidate32e7:[32,7,40],originalBudget20e4:[20,4,28]},budget=budgets[init.honroQuarryRoster];assert(budget,'Named quarry roster required');
 const foes=stage.units.filter(u=>u.team==='enemy'),players=stage.units.filter(u=>u.team==='player');
 assert.deepEqual([foes.length,foes.filter(u=>u.stageOverrides?.honroAct2Elite).length,init.honroQuarryPopulationCap],budget,'Explicit initial/elite/population budgets');
 assert.deepEqual(players.map(u=>u.kind).sort(),['archer','knight','mage','occultist']);assert.equal(stage.units.length,foes.length+players.length,'No additional NPC or party split');
 for(const [label,rows]of [['unit',stage.units],['terrain',stage.terrains],['marker',stage.markers]])assert.equal(new Set(rows.map(row=>row.id)).size,rows.length,'Unique quarry '+label+' IDs');
 for(const id of ['clear-approach','sign','hold-road','clear-quarry','exit'])assert.equal(stage.markers.filter(m=>m.id===id).length,1,'Unique original goal marker '+id);
 assert(!stage.markers.some(m=>m.id==='rock-pin'),'No restored rock-pin chore');
 const spec=init.honroQuarrySpec;assert(spec&&typeof spec.gateTerrainId==='string'&&spec.entries&&Object.keys(spec.entries).length,'Saved quarry gate and finite entry specification');
 const gate=stage.terrains.filter(t=>t.id===spec.gateTerrainId);assert.equal(gate.length,1,'Exactly one initial closed gate');assert.notEqual(gate[0].properties?.broken,true);
 const content=plain(init.honroQuarryContent);assert(content&&typeof content.guide==='string'&&content.guide.trim(),'Saved new-map guidance');
 assert([old.content.enemies,budget[0]].includes(content.enemies),'Saved content count matches the original or named roster');content.enemies=old.content.enemies;
 content.guide=old.content.guide;
 for(const id of ['clear-approach','sign']){assert(Array.isArray(content.beats?.[id])&&content.beats[id].length,'Saved quarry beat '+id);content.beats[id]=plain(old.content.beats[id]);}
 assert.deepEqual(content,old.content,'Only guidance and the two spatially corrected beats may change in saved quarry content');
}
/** Recorder scope validation, not approval of the current checkpoint. */
export function assertStage12QuarryScope(project){
 const p=plain(project),scope=p.stages?.length===30?'full':'act12';
 assert.deepEqual(p.stages?.map(s=>s.id),scoped(f.stageOrder,scope),'Full/Act12 stage membership and order');assert.deepEqual(globals(p),f.globals,'All project globals are unchanged');
 for(const row of scoped(f.stages,scope)){const stage=p.stages.find(s=>s.id===row.id);assert.equal(stage.metadata.stageId,Number(row.id.slice(6)));if(row.id==='stage-12')assertContract(stage);else assert.equal(hash(stage),row.sha256,'Unchanged complete map '+row.id);}
 const lib=baseLibrary(p.library);assert.equal(lib.scope,scope,'Library scope matches stage scope');const added=p.library.filter(newAsset);
 assert.deepEqual(p.library.map(a=>a.id),[...lib.out.map(a=>a.id),...added.map(a=>a.id)],'Quarry artwork may only be appended');assert.equal(new Set(added.map(a=>a.id)).size,added.length,'No duplicate quarry asset IDs');
 for(const a of added){assert.deepEqual(a.collision,[],'New quarry artwork is visual only');assert(a.vector?.root,'Quarry artwork must be editable vector');}
 const out={...p,stages:p.stages.map(s=>s.id==='stage-12'?plain(stage12QuarryOriginal.stage):s),library:lib.out};
 if(scope==='full')assert.equal(hash(out),f.projectSha256,'Exact d7b9fdf project after bounded Stage12 reversal');
 // The immutable before fixture records full-project hashes. Its individual
 // complete stage/asset hashes above also cover Act12; the independent older
 // layer verifies its exact Act12 digest without refreshing that baseline.
 ferry.assertStage30FerryCurrent(out);return out;
}
function assertRuntimeScope(sources){
 assert.deepEqual(Object.keys(sources).sort(),[...f.runtime.files.map(r=>r.path),...f.scope.allowedAddedRuntime].sort(),'Only the two quarry runtime files may be added');
 for(const row of f.runtime.files){const source=sources[row.path];if(!f.scope.allowedChangedRuntime.includes(row.path)){assert.equal(hash(source),row.sha256,'Unchanged runtime source '+row.path);continue;}
  if(row.path==='shared/build.mjs'){
   const expected=row.before.replace("'stage30-ferry','objective-guidance'","'stage30-ferry','stage12-quarry','objective-guidance'").replace("'stage30-ferry-art','combat-feedback'","'stage30-ferry-art','stage12-quarry-art','combat-feedback'");
   assert.notEqual(expected,row.before);assert.equal(source,expected,'Only quarry model/render bundle registrations may change');
  }else if(row.path==='shared/runtime/terrain-readability.js'){
   const expected=row.before.replace('G.HonroStage30FerryArt?.omitReadability(group,b)','G.HonroStage30FerryArt?.omitReadability(group,b)||G.HonroStage12QuarryArt?.omitReadability(group,b)');assert.notEqual(expected,row.before);assert.equal(source,expected,'Only the scoped quarry readability hook may change');
  }else if(row.path==='game/config/balance.json'){
   const out=JSON.parse(source),old=JSON.parse(row.before);assert([20,26,32].includes(out.stages[11].initialEnemies),'Only the explicitly named quarry comparison budgets');out.stages[11].initialEnemies=old.stages[11].initialEnemies;assert.deepEqual(out,old,'Only Stage12 initialEnemies may change; global maxAlive36/action4 and all other balance stay exact');
  }else assert.fail('Unimplemented quarry runtime scope '+row.path);
 }
 for(const path of f.scope.allowedAddedRuntime)assert(typeof sources[path]==='string'&&sources[path].length>100,'Complete new quarry source '+path);return sources;
}
export function createStage12QuarryReview(project,sources,{label,authoringSources={}}={}){
 assert(typeof label==='string'&&label.trim(),'Explicit checkpoint label required');assertStage12QuarryScope(project);assertRuntimeScope(beforeStage12QuarryHoldGuideSources(sources));
 const stage=project.stages.find(s=>s.id==='stage-12');assert.equal(JSON.parse(sources['game/config/balance.json']).stages[11].initialEnemies,stage.units.filter(u=>u.team==='enemy').length,'Published balance matches the reviewed map roster');
 return{version:1,sourceCommit:f.sourceCommit,sourceTree:f.sourceTree,label,scope:plain(f.scope),stage:plain(stage),addedAssets:plain(project.library.filter(newAsset)),projectSha256:hash(project),runtime:Object.fromEntries([...f.scope.allowedChangedRuntime,...f.scope.allowedAddedRuntime].map(path=>[path,sources[path]])),authoringSources:plain(authoringSources)};
}
export function assertStage12QuarryCurrent(project,{review}={}){
 const r=currentReview(review),p=plain(project),scope=p.stages?.length===30?'full':'act12';assertStage12QuarryScope(p);
 assert.equal(hash(p.stages.find(s=>s.id==='stage-12')),hash(r.stage),'Exact reviewed Stage12, including every coordinate and saved field');assert.deepEqual(p.library.filter(newAsset),r.addedAssets,'Exact reviewed new quarry assets and order');if(scope==='full')assert.equal(hash(p),r.projectSha256,'Complete reviewed current project');return p;
}
export function beforeStage12Quarry(project,{review}={}){
 const p=plain(project),rows=p.stages?.filter(s=>s.id==='stage-12'||s.metadata?.stageId===12)||[];assert.equal(rows.length,1,'Exactly one Stage12 at the quarry boundary');assert.equal(rows[0].id,'stage-12');assert.equal(rows[0].metadata.stageId,12);
 if(hash(rows[0])===hash(stage12QuarryOriginal.stage)){assert(!p.library?.some(newAsset),'Historical Stage12 cannot retain quarry artwork');return p;}
 const r=currentReview(review);assert.equal(hash(rows[0]),hash(r.stage),'Only an exact historical or reviewed current stage-12 may cross the quarry boundary');
 assertStage12QuarryCurrent(p,{review:r});return assertStage12QuarryScope(p);
}
export function beforeStage12QuarryLibrary(library,{review}={}){
 const out=plain(library);if(!out.some(newAsset))return out;const r=currentReview(review);assert.deepEqual(out.filter(newAsset),r.addedAssets,'Exact reviewed quarry additions');const {out:prior}=baseLibrary(out);assert.deepEqual(out.map(a=>a.id),[...prior.map(a=>a.id),...r.addedAssets.map(a=>a.id)],'Quarry library append order');return prior;
}
export function beforeStage12QuarryRuntimeSources(sources=stage12QuarryRuntimeSources(),{review}={}){
 const expected=f.runtime.files.map(r=>r.path).sort();
 if(Object.keys(sources).length===expected.length){assert.deepEqual(Object.keys(sources).sort(),expected,'Exact historical d7 runtime membership');for(const row of f.runtime.files)assert.equal(hash(sources[row.path]),row.sha256,'Exact historical d7 runtime '+row.path);ferry.beforeStage30FerryRuntimeSources(sources);return{...sources};}
 const r=currentReview(review),projected=beforeStage12QuarryHoldGuideSources(sources);assertRuntimeScope(projected);assert.deepEqual(Object.keys(r.runtime).sort(),[...f.scope.allowedChangedRuntime,...f.scope.allowedAddedRuntime].sort(),'All reviewed quarry runtime snapshots are present');for(const [path,source]of Object.entries(r.runtime))assert.equal(sources[path],source,'Exact reviewed quarry runtime '+path);
 const out={...projected};for(const path of f.scope.allowedAddedRuntime)delete out[path];for(const path of f.scope.allowedChangedRuntime)out[path]=baseSource(path);return beforeStage12QuarryRuntimeSources(out);
}
const projectPrefix='globalThis.HONRO_PROJECT=HonroObjectiveRevision.author(HonroAct1Roster.author(',projectSuffix='));';
/** Accept only the frozen raw model-parts format or the older temple format
 * (project omitted, five app files appended). Both are exact, never executable. */
export function beforeStage12QuarryFingerprintParts(parts,{sources=stage12QuarryRuntimeSources(),review}={}){
 const base=beforeStage12QuarryRuntimeSources(sources,{review}),added=new Set(f.scope.allowedAddedRuntime.filter(path=>Object.hasOwn(sources,path)).map(path=>normalized(sources[path])));
 for(const part of added)assert(parts.filter(p=>p===part).length<=1,'No duplicate quarry runtime part');
 const out=parts.flatMap(part=>{
  if(added.has(part))return[];
  if(part==='globalThis.HONRO_BALANCE='+normalized(sources['game/config/balance.json'])+';')return['globalThis.HONRO_BALANCE='+normalized(base['game/config/balance.json'])+';'];
  if(part.startsWith('globalThis.HONRO_PROJECT=')){assert(part.startsWith(projectPrefix)&&part.endsWith(projectSuffix),'Exact known project wrapper');const p=JSON.parse(part.slice(projectPrefix.length,-projectSuffix.length));return[projectPrefix+JSON.stringify(beforeStage12Quarry(p,{review}))+projectSuffix];}
  return[part];
 });
 if(out.some(part=>part.startsWith('globalThis.HONRO_PROJECT=')))assert.equal(hash(out.join('\n')),f.runtime.beforeFingerprintSha256,'Exact frozen d7 model-parts fingerprint after bounded quarry reversal');
 else ferry.beforeStage30FerryFingerprintParts(out,{sources:base});
 return out;
}
function uniqueStage(rows){assert.equal(rows.filter(s=>s.id===12).length,1,'Historical semantic input requires unique Stage12');return rows.findIndex(s=>s.id===12);}
export function beforeStage12QuarryBalance(balance,{review}={}){
 const out=plain(balance),at=uniqueStage(out.stages);if(hash(out.stages[at])===hash(stage12QuarryOriginal.balance))return out;
 const r=currentReview(review);assert.deepEqual(out.stages[at],JSON.parse(r.runtime['game/config/balance.json']).stages[11],'Exact reviewed current Stage12 runtime balance');out.stages[at]=plain(stage12QuarryOriginal.balance);return out;
}
export function beforeStage12QuarryContent(content,{review}={}){
 const out=plain(content),at=uniqueStage(out.stages),row=out.stages[at];if(hash(row)===hash(stage12QuarryOriginal.content))return out;
 const r=currentReview(review),expected=plain(stage12QuarryOriginal.content);expected.enemies=JSON.parse(r.runtime['game/config/balance.json']).stages[11].initialEnemies;
 assert.deepEqual(row,expected,'Exact reviewed current Stage12 runtime content; only balance-derived count may change');out.stages[at]=plain(stage12QuarryOriginal.content);return out;
}
export function beforeStage12QuarryPlan(plan){const out=plain(plan),at=uniqueStage(out.stages);assert.deepEqual(out.stages[at],stage12QuarryOriginal.plan,'Exact original Stage12 runtime plan');return out;}
function withHistoricalRows(g,next,fn,{forceStageIds=[]}={}){
 // Runtime modules close over these original objects/arrays. Replace only
 // reviewed rows so Act2's captured H and forStage's captured plans see the
 // same historical fixture as global lookups; never clone away live methods.
 const savedProject=g.HONRO_PROJECT,edits=[];
 for(const [key,target]of Object.entries(next))if(key!=='HONRO_PROJECT'){
  const source=g[key];assert.deepEqual(plain({...source,stages:[]}),plain({...target,stages:[]}),'Historical wrapper preserves non-stage globals '+key);
  assert.deepEqual(plain(source.stages.map(row=>row.id)),plain(target.stages.map(row=>row.id)),'Historical wrapper preserves stage order '+key);
  for(const [index,row]of target.stages.entries())if(forceStageIds.includes(row.id)||hash(source.stages[index])!==hash(row))edits.push({rows:source.stages,index,before:source.stages[index],after:row});
 }
 try{g.HONRO_PROJECT=next.HONRO_PROJECT;for(const edit of edits)edit.rows[edit.index]=edit.after;return fn();}
 finally{g.HONRO_PROJECT=savedProject;for(const edit of edits)edit.rows[edit.index]=edit.before;}
}
/** Synchronous fixture scope. Current Engine remains loaded and all original
 * global object references are restored, including on callback exceptions. */
export function withHistoricalStage12(g,fn){beforeStage12QuarryRuntimeSources();return withHistoricalRows(g,{HONRO_PROJECT:beforeStage12Quarry(g.HONRO_PROJECT),HONRO_BALANCE:beforeStage12QuarryBalance(g.HONRO_BALANCE),HONRO_CONTENT:beforeStage12QuarryContent(g.HONRO_CONTENT),HonroAct2Plan:beforeStage12QuarryPlan(g.HonroAct2Plan)},fn,{forceStageIds:[12]});}

// Compatibility entry points preserve the immutable 30 and 18 validators.
export const ferryHistoryHash=hash,ferryHistoryPlain=plain,bellHistoryHash=hash,bellHistoryPlain=plain;
export const stage30FerryBefore=ferry.stage30FerryBefore,stage30FerryOriginal=ferry.stage30FerryOriginal,stage30FerryReview=ferry.stage30FerryReview;
export const stage18BellBefore=ferry.stage18BellBefore,stage18BellHistoryDelta=ferry.stage18BellHistoryDelta;
export const beforeStage30Ferry=(p,options)=>ferry.beforeStage30Ferry(beforeStage12Quarry(p),options);
export const beforeStage30FerryLibrary=(p,options)=>ferry.beforeStage30FerryLibrary(beforeStage12QuarryLibrary(p),options);
export const assertStage30FerryCurrent=(p,options)=>ferry.assertStage30FerryCurrent(beforeStage12Quarry(p),options);
export const stage30FerryRuntimeSources=stage12QuarryRuntimeSources;
export const beforeStage30FerryRuntimeSources=(sources=stage12QuarryRuntimeSources(),options)=>ferry.beforeStage30FerryRuntimeSources(Object.keys(sources).length===ferry.stage30FerryBefore.runtime.files.length?sources:beforeStage12QuarryRuntimeSources(sources),options);
export function beforeStage30FerryFingerprintParts(parts,{sources=stage12QuarryRuntimeSources(),...options}={}){return ferry.beforeStage30FerryFingerprintParts(beforeStage12QuarryFingerprintParts(parts,{sources}),{...options,sources:beforeStage12QuarryRuntimeSources(sources)});}
export const beforeStage30FerryBalance=(p,options)=>ferry.beforeStage30FerryBalance(beforeStage12QuarryBalance(p),options);
export const beforeStage30FerryContent=(p,options)=>ferry.beforeStage30FerryContent(beforeStage12QuarryContent(p),options);
export function withHistoricalStage30(g,fn){beforeStage30FerryRuntimeSources();return withHistoricalRows(g,{HONRO_PROJECT:beforeStage30Ferry(g.HONRO_PROJECT),HONRO_BALANCE:beforeStage30FerryBalance(g.HONRO_BALANCE),HONRO_CONTENT:beforeStage30FerryContent(g.HONRO_CONTENT),HonroAct2Plan:beforeStage12QuarryPlan(g.HonroAct2Plan)},fn,{forceStageIds:[12,30]});}
export const beforeStage18Bell=p=>ferry.beforeStage18Bell(beforeStage12Quarry(p));
export const beforeStage18BellLibrary=(p,options)=>ferry.beforeStage18BellLibrary(beforeStage12QuarryLibrary(p),options);
export const assertStage18BellCurrent=p=>ferry.assertStage18BellCurrent(beforeStage12Quarry(p));
export const stage18BellRuntimeSources=stage12QuarryRuntimeSources;
export const assertStage18BellRuntimeSources=(sources=stage12QuarryRuntimeSources())=>{beforeStage30FerryRuntimeSources(sources);return sources;};
export function beforeStage18BellFingerprintParts(parts,{sources=stage12QuarryRuntimeSources()}={}){return ferry.beforeStage18BellFingerprintParts(beforeStage12QuarryFingerprintParts(parts,{sources}),{sources:beforeStage12QuarryRuntimeSources(sources)});}
export function withHistoricalStage18(g,fn){return withHistoricalStage30(g,()=>{
 const content=plain(g.HONRO_CONTENT),plan=plain(g.HonroAct2Plan),balance=plain(g.HONRO_BALANCE);
 for(const row of stage18BellHistoryDelta.runtime.stages){for(const [key,value]of Object.entries({content:content.stages[row.id-1],plan:plan.stages[row.id-11],balance:balance.stages[row.id-1]}))assert.deepEqual(value,row.after[key],'Exact reviewed current Stage'+row.id+' runtime '+key);content.stages[row.id-1]=plain(row.before.content);plan.stages[row.id-11]=plain(row.before.plan);balance.stages[row.id-1]=plain(row.before.balance);}
 return withHistoricalRows(g,{HONRO_PROJECT:beforeStage18Bell(g.HONRO_PROJECT),HONRO_CONTENT:content,HonroAct2Plan:plan,HONRO_BALANCE:balance},fn,{forceStageIds:[18,19]});
});}
