/** Independent leaf: exact approved18/19 + additive art/runtime boundary.
 * No imports from older history layers. Never accepts a revision marker alone,
 * erases an unvalidated map, or evaluates historical code in current gameplay. */
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
const ts=createRequire(new URL('../game/engine/build.mjs',import.meta.url))('typescript');
export const bellHistoryHash=v=>createHash('sha256').update(typeof v==='string'?v:JSON.stringify(v)).digest('hex');
export const bellHistoryPlain=v=>JSON.parse(JSON.stringify(v));
const hash=bellHistoryHash,plain=bellHistoryPlain;
export const stage18BellBefore=JSON.parse(readFileSync(new URL('./fixtures/stage18-bell-before.json',import.meta.url),'utf8'));
export const stage18BellHistoryDelta=JSON.parse(readFileSync(new URL('./fixtures/stage18-bell-history-delta.json',import.meta.url),'utf8'));
const f=stage18BellHistoryDelta,addedIds=new Set(f.addedAssets.map(a=>a.id));
const hasBellArt=a=>addedIds.has(a.id)||a.id.startsWith('stage18:bell-');
const scoped=(rows,scope)=>scope==='full'?rows:rows.filter(s=>Number((s.id||s).slice(6))<=20);
function map(project,id,{required=true}={}){const rows=(project.stages||[]).filter(s=>s.id==='stage-'+id||s.metadata?.stageId===id);assert.equal(rows.length,required?1:Math.min(rows.length,1),'Exact bell unique Stage'+id);if(!rows.length)return null;assert.equal(rows[0].id,'stage-'+id);assert.equal(rows[0].metadata.stageId,id);return rows[0];}
function scopeForLibrary(library,after){const digest=hash(library);if(digest===f[after?'afterLibrarySha256':'beforeLibrarySha256'])return'full';if(digest===f[after?'afterAct12LibrarySha256':'beforeAct12LibrarySha256'])return'act12';assert.fail('Exact bell Library values and order in full/Act12 scope');}
export function beforeStage18BellLibrary(library,{required=false}={}){
 const out=plain(library);if(!required&&!out.some(hasBellArt))return out;
 const scope=scopeForLibrary(out,true),oldIds=f.libraryOrder.filter(id=>scope==='full'||!id.startsWith('a3-'));
 assert.deepEqual(out.map(a=>a.id),[...oldIds,...f.addedAssets.map(a=>a.id)],'Only exact appended bell artwork in reviewed order');
 for(const asset of f.addedAssets){const rows=out.filter(a=>a.id===asset.id);assert.equal(rows.length,1,'Unique bell asset '+asset.id);assert.deepEqual(rows[0],asset,'Exact reviewed bell asset '+asset.id);}
 const prior=out.filter(a=>!addedIds.has(a.id));assert.equal(hash(prior),f[scope==='full'?'beforeLibrarySha256':'beforeAct12LibrarySha256'],'Every historical asset value and order is preserved');return prior;
}
export function assertStage18BellCurrent(project){
 const p=plain(project),scope=p.stages?.length===30?'full':'act12';
 assert.deepEqual(p.stages?.map(s=>s.id),scoped(f.stageOrder,scope),'Exact bell full/Act12 stage membership and order');
 for(const row of f.stages)assert.equal(hash(map(p,Number(row.id.slice(6)))),row.afterSha256,'Exact reviewed current '+row.id);
 for(const row of scoped(f.otherStages,scope))assert.equal(hash(p.stages.find(s=>s.id===row.id)),row.sha256,'Unchanged original map '+row.id);
 assert.equal(hash({...p,stages:[],library:[]}),f.globalsSha256,'Every non-map/non-library global is unchanged');
 beforeStage18BellLibrary(p.library,{required:true});
 assert.equal(hash(p),f[scope==='full'?'afterProjectSha256':'afterAct12ProjectSha256'],'Complete current bell project is exact');return p;
}
export function beforeStage18Bell(project){
 const out=plain(project),states=f.stages.map(row=>{const st=map(out,Number(row.id.slice(6)),{required:false});if(!st)return'absent';const digest=hash(st);if(digest===row.beforeSha256)return'before';assert.equal(digest,row.afterSha256,'Only an exact historical or reviewed current '+row.id+' may cross the bell boundary');return'after';});
 if(!states.includes('after')){assert(!out.library?.some(hasBellArt),'Historical18/19 cannot retain fresh bell artwork');return out;}
 assert(states.every(s=>s==='after'),'No mixed historical/current18/19 boundary');assertStage18BellCurrent(out);
 for(const row of f.stages){const st=map(out,Number(row.id.slice(6)));for(const delta of row.paths){let target=st;for(const key of delta.path.slice(0,-1)){assert(target&&Object.hasOwn(target,key),'Exact bell delta parent '+delta.path.join('/'));target=target[key];}const key=delta.path.at(-1);assert.equal(Object.hasOwn(target,key),delta.hasAfter,'Exact bell delta presence '+delta.path.join('/'));if(delta.hasAfter)assert.deepEqual(target[key],delta.after,'Exact bell delta value '+delta.path.join('/'));if(delta.hasBefore)target[key]=plain(delta.before);else delete target[key];}
  const original=stage18BellBefore.stages.find(s=>s.id===row.id);assert.deepEqual(st,original,'Every immutable original '+row.id+' field after bounded reversal');out.stages[out.stages.indexOf(st)]=plain(original);assert.equal(hash(original),row.beforeSha256);
 }
 out.library=beforeStage18BellLibrary(out.library,{required:true});const scope=out.stages.length===30?'full':'act12';assert.equal(hash(out),f[scope==='full'?'beforeProjectSha256':'beforeAct12ProjectSha256'],'Exact original full/Act12 project recovered only after validating current source');return out;
}
export function stage18BellRuntimeSources(){const dirs=['shared/runtime','shared/map','shared/engine/src'],extra=['shared/build.mjs','game/engine/build.mjs','game/config/balance.json',...readdirSync('shared/data').filter(p=>p.endsWith('.json')&&p!=='campaign.json').map(p=>'shared/data/'+p)];return Object.fromEntries([...dirs.flatMap(dir=>readdirSync(dir).filter(p=>/\.(js|ts)$/.test(p)).map(p=>dir+'/'+p)),...extra].sort().map(p=>[p,readFileSync(p,'utf8')]));}
export function assertStage18BellRuntimeSources(sources=stage18BellRuntimeSources()){
 assert.deepEqual(Object.keys(sources).sort(),f.runtime.files.map(row=>row.path),'Exact runtime file membership, with no unrelated additions/removals');
 for(const row of f.runtime.files)assert.equal(hash(sources[row.path]),row.afterSha256,'Exact reviewed runtime source '+row.path);return sources;
}
const compiledModule=(path,code)=>{const name=path.split('/').at(-1),out=ts.transpileModule(code,{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.CommonJS,strict:true},fileName:name});return`${JSON.stringify(name.slice(0,-3))}: function(module,exports,require){\n${out.outputText}\n}`;};
/** Input is the exact temple fingerprint list, with project omitted and its five
 * app files appended. Historical source strings are for hashing only. */
export function beforeStage18BellFingerprintParts(parts,{sources=stage18BellRuntimeSources()}={}){
 assertStage18BellRuntimeSources(sources);assert.equal(hash(parts.join('\n')),f.runtime.afterFingerprintSha256,'Exact current runtime fingerprint before bounded historical projection');
 const projected=parts.flatMap(part=>{let out=part;for(const row of f.runtime.files.filter(r=>Object.hasOwn(r,'before'))){if(row.path.endsWith('.ts')){const after=compiledModule(row.path,row.after);if(out.includes(after)){assert.equal(out.split(after).length,2,'Unique reviewed compiled module');out=out.replace(after,compiledModule(row.path,row.before));}}else if(out===row.after.replace(/\r\n/g,'\n')){if(row.before===null)return[];out=row.before.replace(/\r\n/g,'\n');}}return[out];});
 assert.equal(hash(projected.join('\n')),f.runtime.beforeFingerprintSha256,'Exact original runtime fingerprint recovered with the same TypeScript compiler');return projected;
}
export function withHistoricalStage18(g,fn){
 assertStage18BellRuntimeSources();
 const saved={project:g.HONRO_PROJECT,rows:f.runtime.stages.map(row=>({id:row.id,content:g.HONRO_CONTENT.stages[row.id-1],plan:g.HonroAct2Plan.stages[row.id-11],balance:g.HONRO_BALANCE.stages[row.id-1]}))};
 try{const original=beforeStage18Bell(g.HONRO_PROJECT);for(const row of f.runtime.stages){for(const [key,value]of Object.entries({content:g.HONRO_CONTENT.stages[row.id-1],plan:g.HonroAct2Plan.stages[row.id-11],balance:g.HONRO_BALANCE.stages[row.id-1]}))assert.deepEqual(plain(value),row.after[key],'Exact reviewed current Stage'+row.id+' runtime '+key);g.HONRO_CONTENT.stages[row.id-1]=plain(row.before.content);g.HonroAct2Plan.stages[row.id-11]=plain(row.before.plan);g.HONRO_BALANCE.stages[row.id-1]=plain(row.before.balance);}g.HONRO_PROJECT=original;return fn();}
 finally{g.HONRO_PROJECT=saved.project;for(const row of saved.rows){g.HONRO_CONTENT.stages[row.id-1]=row.content;g.HonroAct2Plan.stages[row.id-11]=row.plan;g.HONRO_BALANCE.stages[row.id-1]=row.balance;}}
}
