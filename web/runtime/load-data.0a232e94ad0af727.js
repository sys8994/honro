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
function request(file,text=false,priority='auto'){const url=new URL(file,root).href,key=url+'|'+text;if(!requests.has(key)){const pending=fetch(url,{priority}).then(async response=>{if(!response.ok)throw Error('Load failed: '+response.status+' '+url);if(text)return response.text();if(Number(response.headers.get('content-length'))>400000||file.includes('campaign-library.'))return workerParse(await response.arrayBuffer());return response.json();});requests.set(key,pending);pending.catch(()=>{if(requests.get(key)===pending)requests.delete(key);});}return requests.get(key);}
function hydrate(value,refs,{svgSources=true}={}){const pending=[];
 const asset=record=>{if(!record?.$honroAsset)return record;const file=record.$honroAsset;let url=assetURLs.get(file);if(!url){url=new URL(file,root).href;assetURLs.set(file,url);}if(svgSources&&file.endsWith('.svg')){globalThis.HONRO_SVG_SOURCES??=Object.create(null);pending.push(request(file,true).then(text=>{globalThis.HONRO_SVG_SOURCES[url]=text;}));}return url;};
 if(refs){for(const path of refs){if(!path.length){value=asset(value);continue;}let parent=value;for(let i=0;i<path.length-1;i++)parent=parent[path[i]];const key=path.at(-1);parent[key]=asset(parent[key]);}}
 else {const visit=node=>{if(!node||typeof node!=='object')return node;if(node.$honroAsset)return asset(node);for(const key in node){const child=node[key];if(child&&typeof child==='object')node[key]=visit(child);}return node;};value=visit(value);}
 return pending.length?Promise.all(pending).then(()=>value):value;
}
export async function loadData(file,refs,options){return hydrate(await request(file),refs,options);}
// Fetch only known required JSON while earlier scripts execute. Registration and
// SVG hydration still happen at the original ordered import boundary.
export function prefetchData(files){for(const file of files)void request(file).catch(()=>{});}
export async function loadProject(file){const manifest=await request(file),refs=manifest.assetPaths;const [base,library,stages]=await Promise.all([loadData(manifest.base,refs?.base),loadData(manifest.library,refs?.library),Promise.all(manifest.stages.map((file,i)=>loadData(file,refs?.stages[i])))]);return {...base,library,stages};}
// The hint is read-only. App.load remains the sole migration/save authority.
function savedHint(){try{const p=JSON.parse(localStorage.getItem('honro-first-act-profile-1'));return p?.game==='honro'&&[1,2,3,4].includes(p.schema)&&p.heroes&&Array.isArray(p.recruited)&&p.recruited.includes('archer')?p:null;}catch{return null;}}
export function destination(profile){
 const valid=id=>Number.isInteger(id)&&id>=1&&id<=30;
 if(valid(profile?.honroMapRestart))return profile.honroMapRestart;
 const battle=profile?.honroBattle;if(battle?.mode==='campaign'&&!battle.honroCustom&&Array.isArray(battle.units)&&valid(battle.honroStage))return battle.honroStage;
 const content=globalThis.HONRO_CONTENT?.stages;
 return content?.find(stage=>!profile?.cleared?.[stage.id]&&(stage.requires||[]).every(id=>profile?.cleared?.[id]))?.id||Array.from({length:30},(_,i)=>i+1).find(id=>!profile?.cleared?.[id])||30;
}
let hint;
export function prefetchProject(file){hint=destination(savedHint());void request(file).then(manifest=>Promise.all([manifest.base,manifest.shared,manifest.stages[hint-1],manifest.stageLibraries[hint-1]].filter(Boolean).map(path=>request(path)))).catch(()=>{});}
export async function loadCampaign(file,authors,{full=false}={}){
 if(full){let project=await loadProject(file);for(const author of authors){project=author.author(project);await yieldIfNeeded();}return project;}
 const manifest=await request(file),base=await loadData(manifest.base,manifest.assetPaths.base),project={...base,unitTemplates:manifest.unitTemplates,library:[],stages:manifest.catalog.map(stage=>({...stage}))},loading=new Map(),loaded=new Set(),assets=new Map();
 async function ensureStage(id){
  if(loaded.has(id))return project.stages.find(stage=>stage.metadata.stageId===id);
  if(loading.has(id))return loading.get(id);
  const index=manifest.catalog.findIndex(stage=>stage.metadata.stageId===id);if(index<0)throw Error('Unknown chapter '+id);
  const pending=(async()=>{
   let completed=0;const paths=[manifest.shared,manifest.stageLibraries[index],manifest.stages[index]],refs=[manifest.assetPaths.shared,manifest.assetPaths.stageLibraries[index],manifest.assetPaths.stages[index]];
   const parts=await Promise.all(paths.map(async(path,i)=>{const value=await loadData(path,refs[i]);globalThis.HonroStartup?.progress('도착할 길 준비',++completed,paths.length);return value;}));
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
