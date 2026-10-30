/* JSON_POOL_DECODER */
const root=new URL('../../',import.meta.url),requests=new Map(),assetURLs=new Map();
let lastYield=performance.now();
export async function yieldIfNeeded(){if(performance.now()-lastYield<12)return;if(globalThis.scheduler?.yield)await scheduler.yield();else await new Promise(resolve=>setTimeout(resolve,0));lastYield=performance.now();}
let parseWorker=null,parseWorkerURL=null,parseSerial=0;const parses=new Map();
const parserSource=`const batches=new Map();
function next(id){const task=batches.get(id),chunk=task.value.slice(task.at,task.at+16);task.at+=chunk.length;const done=task.at>=task.value.length;self.postMessage({id,chunk,done});if(done)batches.delete(id);}
self.onmessage=({data})=>{if(data.ack){next(data.ack);return;}const {id,buffer}=data;try{const value=JSON.parse(new TextDecoder().decode(buffer));if(Array.isArray(value)&&value.length>16){batches.set(id,{value,at:0});next(id);}else self.postMessage({id,value});}catch(error){self.postMessage({id,error:String(error)});}};`;
function retireParser(){parseWorker?.terminate();parseWorker=null;if(parseWorkerURL)URL.revokeObjectURL(parseWorkerURL);parseWorkerURL=null;}
function fallbackParses(){const tasks=[...parses.values()];parses.clear();retireParser();for(const task of tasks)task.fallback();}
function parseBuffer(buffer){return JSON.parse(new TextDecoder().decode(buffer));}
function workerParse(buffer){if(typeof Worker==='undefined')return Promise.resolve(parseBuffer(buffer));
 try{if(!parseWorker){parseWorkerURL=URL.createObjectURL(new Blob([parserSource],{type:'text/javascript'}));parseWorker=new Worker(parseWorkerURL);
   parseWorker.onmessage=async({data})=>{const task=parses.get(data.id);if(!task)return;
    if(data.chunk){task.value.push(...data.chunk);if(!data.done){await yieldIfNeeded();parseWorker?.postMessage({ack:data.id});return;}}
    parses.delete(data.id);data.error?task.reject(Error(data.error)):task.resolve(data.chunk?task.value:data.value);if(!parses.size)retireParser();
   };parseWorker.onerror=fallbackParses;
  }
  const backup=buffer.slice(0);return new Promise((resolve,reject)=>{const id=++parseSerial;parses.set(id,{resolve,reject,value:[],fallback(){try{resolve(parseBuffer(backup));}catch(error){reject(error);}}});try{parseWorker.postMessage({id,buffer},[buffer]);}catch{fallbackParses();}});
 }catch{retireParser();return Promise.resolve(parseBuffer(buffer));}
}
async function joinedJson(descriptor,priority){
 if(!Number.isSafeInteger(descriptor.bytes)||descriptor.bytes<1||!Array.isArray(descriptor.parts)||!descriptor.parts.length)throw Error('Invalid JSON parts descriptor');
 const joined=new Uint8Array(descriptor.bytes);let offset=0;
 // Do not cache raw parts or start all requests at once. Only the final parsed
 // value enters request's normal cache, as with the prior single-file bundle.
 for(const part of descriptor.parts){
  if(typeof part.path!=='string'||!Number.isSafeInteger(part.bytes)||part.bytes<1||offset+part.bytes>joined.length)throw Error('Invalid JSON part');
  const url=new URL(part.path,root).href,response=await fetch(url,{priority});
  if(!response.ok)throw Error('Load failed: '+response.status+' '+url);
  const bytes=new Uint8Array(await response.arrayBuffer());
  if(bytes.length!==part.bytes)throw Error('JSON part byte count mismatch: '+url);
  if(globalThis.crypto?.subtle&&part.sha256){const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');if(digest!==part.sha256)throw Error('JSON part checksum mismatch: '+url);}
  joined.set(bytes,offset);offset+=bytes.length;await yieldIfNeeded();
 }
 if(offset!==joined.length)throw Error('JSON parts total byte count mismatch');
 return workerParse(joined.buffer);
}
function request(file,text=false,priority='auto'){const url=new URL(file,root).href,key=url+'|'+text;if(!requests.has(key)){const pending=fetch(url,{priority}).then(async response=>{if(!response.ok)throw Error('Load failed: '+response.status+' '+url);if(text)return response.text();const value=Number(response.headers.get('content-length'))>400000||file.includes('campaign-library.')?await workerParse(await response.arrayBuffer()):await response.json();return value?.$honroJsonParts===1?joinedJson(value,priority):value;});requests.set(key,pending);pending.catch(()=>{if(requests.get(key)===pending)requests.delete(key);});}return requests.get(key);}
// Optional source text has document lifetime, including failed/completed attempts.
// Required data/module loading keeps the strict request and rejection contract.
const optionalSvgSources=new Map();
function optionalSvgSource(file,url){
 if(!optionalSvgSources.has(url))optionalSvgSources.set(url,request(file,true).then(text=>{globalThis.HONRO_SVG_SOURCES[url]=text;}).catch(()=>{}));
 return optionalSvgSources.get(url);
}
async function optionalSvgBatch(pending,value){
 let timer;await Promise.race([Promise.all(pending),new Promise(resolve=>{timer=setTimeout(resolve,1500);})]);clearTimeout(timer);return value;
}
function hydrate(value,refs,{svgSources=true}={}){const pending=[];
 const asset=record=>{if(!record?.$honroAsset)return record;const file=record.$honroAsset;let url=assetURLs.get(file);if(!url){url=new URL(file,root).href;assetURLs.set(file,url);}if(svgSources&&file.endsWith('.svg')){globalThis.HONRO_SVG_SOURCES??=Object.create(null);pending.push(svgSources==='optional'?optionalSvgSource(file,url):request(file,true).then(text=>{globalThis.HONRO_SVG_SOURCES[url]=text;}));}return url;};
 if(refs){for(const path of refs){if(!path.length){value=asset(value);continue;}let parent=value;for(let i=0;i<path.length-1;i++)parent=parent[path[i]];const key=path.at(-1);parent[key]=asset(parent[key]);}}
 else {const visit=node=>{if(!node||typeof node!=='object')return node;if(node.$honroAsset)return asset(node);for(const key in node){const child=node[key];if(child&&typeof child==='object')node[key]=visit(child);}return node;};value=visit(value);}
 return pending.length?(svgSources==='optional'?optionalSvgBatch(pending,value):Promise.all(pending).then(()=>value)):value;
}
export async function loadData(file,refs,options){const value=await request(file);return hydrate(options?.jsonPool?unpackJson(value):value,refs,options);}
// Fetch only known required JSON while earlier scripts execute. Registration and
// SVG hydration still happen at the original ordered import boundary.
export function prefetchData(files){for(const file of files)void request(file).catch(()=>{});}
function assetOptions(encoding){
 if(encoding===undefined||encoding==='json')return undefined;
 if(encoding==='json-pool-v1')return {jsonPool:true};
 throw Error('Unsupported campaign asset encoding: '+encoding);
}
async function fullLibrary(manifest){
 const refs=manifest.assetPaths;
 if(manifest.library)return loadData(manifest.library,refs?.library); // Existing published manifests.
 if(!Array.isArray(manifest.libraryOrder)||new Set(manifest.libraryOrder).size!==manifest.libraryOrder.length)throw Error('Invalid campaign library order');
 const enc=manifest.assetEncodings,records=[[manifest.shared,refs?.shared,enc?.shared],...manifest.stageLibraries.map((file,i)=>[file,refs?.stageLibraries[i],enc?.stageLibraries?.[i]]),[manifest.editorExtras,refs?.editorExtras,enc?.editorExtras]],assets=new Map();
 // Reuse the same chapter resources as lazy gameplay. Bound the full editor's
 // parsing/hydration work to one asset bundle at a time, then restore native order.
 for(const [file,paths,encoding]of records){
  if(!file)throw Error('Missing campaign asset bundle');
  const bundle=await loadData(file,paths,assetOptions(encoding));
  if(!Array.isArray(bundle))throw Error('Invalid campaign asset bundle');
  for(const asset of bundle){
   if(!asset||typeof asset.id!=='string')throw Error('Invalid campaign asset ID');
   if(assets.has(asset.id)){if(JSON.stringify(assets.get(asset.id))!==JSON.stringify(asset))throw Error('Conflicting campaign asset: '+asset.id);}
   else assets.set(asset.id,asset);
  }
  await yieldIfNeeded();
 }
 if(assets.size!==manifest.libraryOrder.length)throw Error('Campaign library asset count mismatch');
 return manifest.libraryOrder.map(id=>{if(!assets.has(id))throw Error('Missing campaign asset: '+id);return assets.get(id);});
}
export async function loadProject(file){const manifest=await request(file),refs=manifest.assetPaths;const [base,library,stages]=await Promise.all([loadData(manifest.base,refs?.base),fullLibrary(manifest),Promise.all(manifest.stages.map((file,i)=>loadData(file,refs?.stages[i])))]);return {...base,library,stages};}
// The hint is read-only. App.load remains the sole migration/save authority.
function savedHint(){try{const p=JSON.parse(localStorage.getItem('honro-first-act-profile-1'));return p?.game==='honro'&&[1,2,3,4,5].includes(p.schema)&&p.heroes&&Array.isArray(p.recruited)&&p.recruited.includes('archer')?p:null;}catch{return null;}}
export function destination(profile){
 const valid=id=>Number.isInteger(id)&&id>=1&&id<=(globalThis.HONRO_ACT4_RELEASE===true?40:30);
 if(valid(profile?.honroMapRestart))return profile.honroMapRestart;
 const battle=profile?.honroBattle;if(battle?.mode==='campaign'&&!battle.honroCustom&&Array.isArray(battle.units)&&valid(battle.honroStage))return battle.honroStage;
 const content=globalThis.HONRO_CONTENT?.stages;
 return content?.find(stage=>!profile?.cleared?.[stage.id]&&(stage.requires||[]).every(id=>profile?.cleared?.[id]))?.id||Array.from({length:globalThis.HONRO_ACT4_RELEASE===true?40:30},(_,i)=>i+1).find(id=>!profile?.cleared?.[id])||(content?.at(-1)?.id||30);
}
let hint;
function prefetchDestination(profile,manifest){
 // The early preload runs before release/content scripts. The downloaded
 // catalog, not a not-yet-initialized global release flag, defines its bounds.
 const ids=manifest.catalog.map(stage=>stage.metadata.stageId),valid=id=>Number.isInteger(id)&&ids.includes(id);
 if(valid(profile?.honroMapRestart))return profile.honroMapRestart;
 const battle=profile?.honroBattle;if(battle?.mode==='campaign'&&!battle.honroCustom&&Array.isArray(battle.units)&&valid(battle.honroStage))return battle.honroStage;
 return globalThis.HONRO_CONTENT?.stages?.find(stage=>valid(stage.id)&&!profile?.cleared?.[stage.id]&&(stage.requires||[]).every(id=>profile?.cleared?.[id]))?.id||ids.find(id=>!profile?.cleared?.[id])||ids.at(-1);
}
export function prefetchProject(file){void request(file).then(manifest=>{
 hint=prefetchDestination(savedHint(),manifest);const index=manifest.catalog.findIndex(stage=>stage.metadata.stageId===hint);
 return Promise.all([manifest.base,manifest.shared,manifest.stages[index],manifest.stageLibraries[index]].filter(Boolean).map(path=>request(path)));
}).catch(()=>{});}
export async function loadCampaign(file,authors,{full=false}={}){
 if(full){let project=await loadProject(file);for(const author of authors){project=author.author(project);await yieldIfNeeded();}return project;}
 const manifest=await request(file),base=await loadData(manifest.base,manifest.assetPaths.base),project={...base,unitTemplates:manifest.unitTemplates,library:[],stages:manifest.catalog.map(stage=>({...stage}))},loading=new Map(),loaded=new Set(),assets=new Map();
 async function ensureStage(id){
  if(loaded.has(id))return project.stages.find(stage=>stage.metadata.stageId===id);
  if(loading.has(id))return loading.get(id);
  const index=manifest.catalog.findIndex(stage=>stage.metadata.stageId===id);if(index<0)throw Error('Unknown chapter '+id);
  const pending=(async()=>{
   let completed=0;const paths=[manifest.shared,manifest.stageLibraries[index],manifest.stages[index]],refs=[manifest.assetPaths.shared,manifest.assetPaths.stageLibraries[index],manifest.assetPaths.stages[index]];
   const encodings=[manifest.assetEncodings?.shared,manifest.assetEncodings?.stageLibraries[index],undefined];
   const parts=await Promise.all(paths.map(async(path,i)=>{const value=await loadData(path,refs[i],assetOptions(encodings[i]));globalThis.HonroStartup?.progress('도착할 길 준비',++completed,paths.length);return value;}));
   // Never pass catalog placeholders to authors or the compiler. Each author sees
   // the real chapter and its complete dependency closure, in native order.
   const library=[...parts[0],...parts[1]];let local={...base,library,stages:[structuredClone(parts[2])]};
   for(const author of authors){local=author.author(local);await yieldIfNeeded();}
   for(const asset of library)assets.set(asset.id,asset);
   project.library=[...assets.values()];project.stages[index]=local.stages[0];loaded.add(id);return local.stages[0];
  })();loading.set(id,pending);try{return await pending;}finally{loading.delete(id);}
 }
 let warmHandle;
 function prewarmNext(id){
  if(warmHandle){if(globalThis.cancelIdleCallback)cancelIdleCallback(warmHandle);else clearTimeout(warmHandle);}
  const index=manifest.catalog.findIndex(stage=>stage.metadata.stageId===id)+1;
  if(index<=0||index>=manifest.stages.length)return;
  const warm=()=>{warmHandle=null;const connection=navigator.connection;if(document.hidden||connection?.saveData||/^(slow-)?2g$/.test(connection?.effectiveType||'')||globalThis.HonroApp?.screen==='battle')return;
   // Warm only the next chapter's two JSON bundles, sequentially, without
   // authoring/compiling it. No all-chapter background burst during play.
   void request(manifest.stageLibraries[index],false,'low').then(()=>{if(!document.hidden&&globalThis.HonroApp?.screen!=='battle')return request(manifest.stages[index],false,'low');}).catch(()=>{});
  };
  warmHandle=globalThis.requestIdleCallback?requestIdleCallback(warm,{timeout:5000}):setTimeout(warm,1500);
 }
 globalThis.HonroCampaignLoader={ensureStage,has:id=>loaded.has(id),destination,prewarmNext,catalog:manifest.catalog};
 await ensureStage(hint??destination(savedHint()));return project;
}
