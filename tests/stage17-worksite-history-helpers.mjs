/** Exact fresh-worksite -> immutable pre-worksite projection for old contracts.
 * Current Stage17/art are checked before reversal. Other maps remain visible;
 * this helper never removes a map or exempts a gameplay category from checks. */
import {beforeCurrentStage16Temple,beforeStage16TempleLibrary,beforeStage16TempleBalance,withHistoricalStage16,historicalStage16Runtime} from './stage16-temple-history-helpers.mjs';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

export const stage17WorksiteBefore=JSON.parse(readFileSync(new URL('./fixtures/stage17-worksite-before.json',import.meta.url),'utf8'));
export const stage17WorksiteDelta=JSON.parse(readFileSync(new URL('./fixtures/stage17-worksite-history-delta.json',import.meta.url),'utf8'));
export const worksiteHash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const plain=value=>JSON.parse(JSON.stringify(value));
const assetIds=new Set(stage17WorksiteDelta.addedAssets.map(asset=>asset.id));

function stage17(project,{required=true}={}){
 const matches=(project.stages||[]).filter(stage=>stage.metadata?.stageId===17||stage.id==='stage-17');
 assert.equal(matches.length,required?1:Math.min(matches.length,1),'Exact worksite projection requires a unique Stage17');
 if(!matches.length)return null;
 assert.equal(matches[0].id,'stage-17','Exact worksite canonical map ID');
 assert.equal(matches[0].metadata.stageId,17,'Exact worksite canonical stage ID');
 return matches[0];
}

function libraryScope(library,after){
 const f=stage17WorksiteDelta,digest=worksiteHash(library);
 if(digest===(after?f.afterLibrarySha256:f.beforeLibrarySha256))return 'full';
 if(digest===(after?f.afterAct12LibrarySha256:f.beforeAct12LibrarySha256))return 'act12';
 assert.fail('Exact worksite Library values and order in full/Act12 scope');
}

export function beforeStage17WorksiteLibrary(library,{required=false}={}){
 const out=beforeStage16TempleLibrary(library),f=stage17WorksiteDelta;
 const hasWorksite=out.some(asset=>assetIds.has(asset.id)||asset.id.startsWith('stage17:worksite-'));
 if(!required&&!hasWorksite)return out;
 const scope=libraryScope(out,true),beforeIds=scope==='full'?stage17WorksiteBefore.libraryIds:stage17WorksiteBefore.libraryIds.filter(id=>!id.startsWith('a3-'));
 for(const asset of f.addedAssets){
  const matches=out.filter(candidate=>candidate.id===asset.id);
  assert.equal(matches.length,1,'Exact worksite asset presence '+asset.id);
  assert.deepEqual(matches[0],asset,'Exact worksite asset value '+asset.id);
 }
 assert.deepEqual(out.map(asset=>asset.id),[...beforeIds,...f.addedAssets.map(asset=>asset.id)],'Only exact additive worksite artwork in reviewed order');
 const prior=out.filter(asset=>!assetIds.has(asset.id));
 assert.equal(worksiteHash(prior),scope==='full'?f.beforeLibrarySha256:f.beforeAct12LibrarySha256,'Every original asset and original order remain exact');
 return prior;
}

export function assertStage17WorksiteCurrent(project,{unrelated=true,library=true}={}){
 project=beforeCurrentStage16Temple(project);
 const st=stage17(project),f=stage17WorksiteDelta;
 assert.equal(st.initialState?.honroWorksiteVersion,f.afterWorksiteVersion,'Exact reviewed worksite current marker');
 assert.equal(st.initialState?.honroAct2GeometryRevision,f.afterGeometryRevision,'Exact reviewed worksite geometry marker');
 assert.equal(worksiteHash(st),f.afterStageSha256,'Exact reviewed current Stage17 map');
 if(unrelated){
  const scope=project.stages.length===30?stage17WorksiteBefore.otherStages:stage17WorksiteBefore.otherStages.filter(row=>Number(row.id.slice(6))<=20);
  assert.deepEqual(plain(project.stages.map(stage=>stage.id)),f.stageOrder.filter(id=>scope.some(row=>row.id===id)||id==='stage-17'),'Exact full/Act12 stage membership and order');
  for(const row of scope){const matches=project.stages.filter(stage=>stage.id===row.id);assert.equal(matches.length,1,'Unique unchanged map '+row.id);assert.equal(worksiteHash(matches[0]),row.sha256,'Unchanged original map '+row.id);}
 }
 if(library&&Array.isArray(project.library))beforeStage17WorksiteLibrary(project.library,{required:true});
 return st;
}

export function beforeCurrentStage17Worksite(project,{unrelated=false,library=true}={}){
 const out=beforeCurrentStage16Temple(project),st=stage17(out,{required:false});
 if(!st){if(library&&Array.isArray(out.library))out.library=beforeStage17WorksiteLibrary(out.library);return out;}
 if(!st.initialState?.honroWorksiteVersion){
  assert.equal(worksiteHash(st),stage17WorksiteDelta.beforeStageSha256,'Only the exact unchanged historical Stage17 may omit the worksite marker');
  assert(!out.library?.some(asset=>assetIds.has(asset.id)||asset.id.startsWith('stage17:worksite-')),'Historical Stage17 cannot retain fresh-worksite artwork');
  return out;
 }
 assertStage17WorksiteCurrent(out,{unrelated,library});
 for(const row of stage17WorksiteDelta.paths){
  const label='Exact worksite approved path '+row.path.join('/');let target=st;
  for(const key of row.path.slice(0,-1)){assert(target&&Object.hasOwn(target,key),label+' parent');target=target[key];}
  const key=row.path.at(-1);assert.equal(Object.hasOwn(target,key),row.hasAfter,label+' presence');
  if(row.hasAfter)assert.deepEqual(target[key],row.after,label+' after value');
  if(row.hasBefore)target[key]=plain(row.before);else delete target[key];
 }
 assert.deepEqual(st,stage17WorksiteBefore.stage,'Every immutable original Stage17 value after exact bounded reversal');
 // Restore insertion order only after every original value was verified.
 out.stages[out.stages.indexOf(st)]=plain(stage17WorksiteBefore.stage);
 if(library&&Array.isArray(out.library))out.library=beforeStage17WorksiteLibrary(out.library,{required:true});
 return out;
}

export function withHistoricalStage17(g,fn){
 return withHistoricalStage16(g,()=>{
 const saved={project:g.HONRO_PROJECT,content:g.HONRO_CONTENT.stages[16],plan:g.HonroAct2Plan.stages[6],balance:g.HONRO_BALANCE.stages[16]};
 try{historicalStage17Runtime(g);return fn();}
 finally{g.HONRO_PROJECT=saved.project;g.HONRO_CONTENT.stages[16]=saved.content;g.HonroAct2Plan.stages[6]=saved.plan;g.HONRO_BALANCE.stages[16]=saved.balance;}
 });
}

export function beforeStage17WorksiteUnitContracts(units){assert.deepEqual(plain(units),stage17WorksiteDelta.unitContracts.after,'Exact reviewed Stage17 roster, stats and XP distribution');return plain(stage17WorksiteDelta.unitContracts.before);}
export function beforeStage17WorksiteContent(content){assert.deepEqual(plain(content),stage17WorksiteDelta.semanticContent.after,'Exact reviewed Stage17 semantic content');return plain(stage17WorksiteDelta.semanticContent.before);}
export function beforeStage17WorksiteBalance(balance){
 const out=beforeStage16TempleBalance(balance),index=out.stages.findIndex(stage=>stage.id===17);if(index<0)return out;
 assert.deepEqual(out.stages[index],stage17WorksiteDelta.balance.after,'Exact reviewed Stage17 planning budget');
 out.stages[index]=plain(stage17WorksiteDelta.balance.before);return out;
}
export function historicalStage17Runtime(g){
 historicalStage16Runtime(g);
 const st=stage17(g.HONRO_PROJECT),current=!!st.initialState?.honroWorksiteVersion,f=stage17WorksiteDelta;
 if(current)assertStage17WorksiteCurrent(g.HONRO_PROJECT);
 else assert.equal(worksiteHash(st),f.beforeStageSha256,'Only exact original Stage17 runtime');
 assert.deepEqual(plain(g.HONRO_CONTENT.stages[16]),current?f.content.after:f.content.before,'Exact Stage17 runtime content before historical setup');
 assert.deepEqual(plain(g.HonroAct2Plan.stages[6]),current?f.content.after.act2Plan:f.content.before.act2Plan,'Exact Stage17 runtime plan before historical setup');
 assert.deepEqual(plain(g.HONRO_BALANCE.stages[16]),current?f.balance.after:f.balance.before,'Exact Stage17 runtime balance before historical setup');
 g.HONRO_PROJECT=beforeCurrentStage17Worksite(g.HONRO_PROJECT);
 g.HONRO_CONTENT.stages[16]=plain(f.content.before);g.HonroAct2Plan.stages[6]=g.HONRO_CONTENT.stages[16].act2Plan;g.HONRO_BALANCE.stages[16]=plain(f.balance.before);
 return g;
}
