import {beforeStage16Buddha,beforeStage16BuddhaLibrary} from './stage16-temple-buddha-history-helpers.mjs';
/** Exact fresh-temple -> immutable pre-temple projection for old contracts.
 * Current Stage16/art are checked before reversal. Other maps remain visible;
 * this helper never removes a map or exempts a gameplay category from checks. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

export const stage16TempleBefore=JSON.parse(readFileSync(new URL('./fixtures/stage16-temple-before.json',import.meta.url),'utf8'));
export const stage16TempleDelta=JSON.parse(readFileSync(new URL('./fixtures/stage16-temple-history-delta.json',import.meta.url),'utf8'));
export const templeHash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const plain=value=>JSON.parse(JSON.stringify(value));
const assetIds=new Set(stage16TempleDelta.addedAssets.map(asset=>asset.id));

function stage16(project,{required=true}={}){
 const matches=(project.stages||[]).filter(stage=>stage.metadata?.stageId===16||stage.id==='stage-16');
 assert.equal(matches.length,required?1:Math.min(matches.length,1),'Exact temple projection requires a unique Stage16');
 if(!matches.length)return null;
 assert.equal(matches[0].id,'stage-16','Exact temple canonical map ID');
 assert.equal(matches[0].metadata.stageId,16,'Exact temple canonical stage ID');
 return matches[0];
}

function libraryScope(library,after){
 const f=stage16TempleDelta,digest=templeHash(library);
 if(digest===(after?f.afterLibrarySha256:f.beforeLibrarySha256))return 'full';
 if(digest===(after?f.afterAct12LibrarySha256:f.beforeAct12LibrarySha256))return 'act12';
 assert.fail('Exact temple Library values and order in full/Act12 scope');
}

export function beforeStage16TempleLibrary(library,{required=false}={}){
 const out=beforeStage16BuddhaLibrary(library),f=stage16TempleDelta;
 const hasTemple=out.some(asset=>assetIds.has(asset.id)||asset.id.startsWith('stage16:temple-'));
 if(!required&&!hasTemple)return out;
 const scope=libraryScope(out,true),beforeIds=scope==='full'?stage16TempleBefore.libraryIds:stage16TempleBefore.libraryIds.filter(id=>!id.startsWith('a3-'));
 for(const asset of f.addedAssets){
  const matches=out.filter(candidate=>candidate.id===asset.id);
  assert.equal(matches.length,1,'Exact temple asset presence '+asset.id);
  assert.deepEqual(matches[0],asset,'Exact temple asset value '+asset.id);
 }
 assert.deepEqual(out.map(asset=>asset.id),[...beforeIds,...f.addedAssets.map(asset=>asset.id)],'Only exact additive temple artwork in reviewed order');
 const prior=out.filter(asset=>!assetIds.has(asset.id));
 assert.equal(templeHash(prior),scope==='full'?f.beforeLibrarySha256:f.beforeAct12LibrarySha256,'Every original asset and original order remain exact');
 return prior;
}

export function assertStage16TempleCurrent(project,{unrelated=true,library=true}={}){
 project=beforeStage16Buddha(project);
 const st=stage16(project),f=stage16TempleDelta;
 assert.equal(st.initialState?.honroTempleVersion,f.afterTempleVersion,'Exact reviewed temple current marker');
 assert.equal(st.initialState?.honroAct2GeometryRevision,f.afterGeometryRevision,'Exact reviewed temple geometry marker');
 assert.equal(templeHash(st),f.afterStageSha256,'Exact reviewed current Stage16 map');
 if(unrelated){
  const scope=project.stages.length===30?stage16TempleBefore.otherStages:stage16TempleBefore.otherStages.filter(row=>Number(row.id.slice(6))<=20);
  assert.deepEqual(plain(project.stages.map(stage=>stage.id)),f.stageOrder.filter(id=>scope.some(row=>row.id===id)||id==='stage-16'),'Exact full/Act12 stage membership and order');
  for(const row of scope){const matches=project.stages.filter(stage=>stage.id===row.id);assert.equal(matches.length,1,'Unique unchanged map '+row.id);assert.equal(templeHash(matches[0]),row.sha256,'Unchanged original map '+row.id);}
 }
 if(library&&Array.isArray(project.library))beforeStage16TempleLibrary(project.library,{required:true});
 return st;
}

export function beforeCurrentStage16Temple(project,{unrelated=false,library=true}={}){
 const out=beforeStage16Buddha(project),st=stage16(out,{required:false});
 if(!st){if(library&&Array.isArray(out.library))out.library=beforeStage16TempleLibrary(out.library);return out;}
 if(!st.initialState?.honroTempleVersion){
  assert.equal(templeHash(st),stage16TempleDelta.beforeStageSha256,'Only the exact unchanged historical Stage16 may omit the temple marker');
  assert(!out.library?.some(asset=>assetIds.has(asset.id)||asset.id.startsWith('stage16:temple-')),'Historical Stage16 cannot retain fresh-temple artwork');
  return out;
 }
 assertStage16TempleCurrent(out,{unrelated,library});
 for(const row of stage16TempleDelta.paths){
  const label='Exact temple approved path '+row.path.join('/');let target=st;
  for(const key of row.path.slice(0,-1)){assert(target&&Object.hasOwn(target,key),label+' parent');target=target[key];}
  const key=row.path.at(-1);assert.equal(Object.hasOwn(target,key),row.hasAfter,label+' presence');
  if(row.hasAfter)assert.deepEqual(target[key],row.after,label+' after value');
  if(row.hasBefore)target[key]=plain(row.before);else delete target[key];
 }
 assert.deepEqual(st,stage16TempleBefore.stage,'Every immutable original Stage16 value after exact bounded reversal');
 // Restore insertion order only after every original value was verified.
 out.stages[out.stages.indexOf(st)]=plain(stage16TempleBefore.stage);
 if(library&&Array.isArray(out.library))out.library=beforeStage16TempleLibrary(out.library,{required:true});
 return out;
}

export function withHistoricalStage16(g,fn){
 const saved={project:g.HONRO_PROJECT,content:g.HONRO_CONTENT.stages[15],plan:g.HonroAct2Plan.stages[5],balance:g.HONRO_BALANCE.stages[15]};
 try{historicalStage16Runtime(g);return fn();}
 finally{g.HONRO_PROJECT=saved.project;g.HONRO_CONTENT.stages[15]=saved.content;g.HonroAct2Plan.stages[5]=saved.plan;g.HONRO_BALANCE.stages[15]=saved.balance;}
}

export function beforeStage16TempleUnitContracts(units){assert.deepEqual(plain(units),stage16TempleDelta.unitContracts.after,'Exact reviewed Stage16 roster, stats and XP distribution');return plain(stage16TempleDelta.unitContracts.before);}
export function beforeStage16TemplePlan(plan){assert.deepEqual(plain(plan),stage16TempleDelta.plan.after,'Exact reviewed Stage16 encounter plan');return plain(stage16TempleDelta.plan.before);}
export function beforeStage16TempleContent(content){assert.deepEqual(plain(content),stage16TempleDelta.semanticContent.after,'Exact reviewed Stage16 semantic content');return plain(stage16TempleDelta.semanticContent.before);}
export function beforeStage16TempleBalance(balance){
 const out=plain(balance),index=out.stages.findIndex(stage=>stage.id===16);if(index<0)return out;
 assert.deepEqual(out.stages[index],stage16TempleDelta.balance.after,'Exact reviewed Stage16 planning budget');
 out.stages[index]=plain(stage16TempleDelta.balance.before);return out;
}
export function historicalStage16Runtime(g){
 const st=stage16(g.HONRO_PROJECT),current=!!st.initialState?.honroTempleVersion,f=stage16TempleDelta;
 if(current)assertStage16TempleCurrent(g.HONRO_PROJECT);
 else assert.equal(templeHash(st),f.beforeStageSha256,'Only exact original Stage16 runtime');
 assert.deepEqual(plain(g.HONRO_CONTENT.stages[15]),current?f.content.after:f.content.before,'Exact Stage16 runtime content before historical setup');
 assert.deepEqual(plain(g.HonroAct2Plan.stages[5]),current?f.plan.after:f.plan.before,'Exact Stage16 runtime plan before historical setup');
 assert.deepEqual(plain(g.HONRO_BALANCE.stages[15]),current?f.balance.after:f.balance.before,'Exact Stage16 runtime balance before historical setup');
 g.HONRO_PROJECT=beforeCurrentStage16Temple(g.HONRO_PROJECT);
 g.HONRO_CONTENT.stages[15]=plain(f.content.before);g.HonroAct2Plan.stages[5]=plain(f.plan.before);g.HONRO_BALANCE.stages[15]=plain(f.balance.before);
 return g;
}
