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
function request(file,text=false){const url=new URL(file,root).href,key=url+'|'+text;if(!requests.has(key))requests.set(key,fetch(url,{priority:file.includes('campaign-library.')?'low':'auto'}).then(async response=>{if(!response.ok)throw Error('Load failed: '+response.status+' '+url);if(text)return response.text();if(Number(response.headers.get('content-length'))>400000||file.includes('campaign-library.'))return workerParse(await response.arrayBuffer());return response.json();}));return requests.get(key);}
function hydrate(value,refs){const pending=[];
 const asset=record=>{if(!record?.$honroAsset)return record;const file=record.$honroAsset;let url=assetURLs.get(file);if(!url){url=new URL(file,root).href;assetURLs.set(file,url);}if(file.endsWith('.svg')){globalThis.HONRO_SVG_SOURCES??=Object.create(null);pending.push(request(file,true).then(text=>{globalThis.HONRO_SVG_SOURCES[url]=text;}));}return url;};
 if(refs){for(const path of refs){if(!path.length){value=asset(value);continue;}let parent=value;for(let i=0;i<path.length-1;i++)parent=parent[path[i]];const key=path.at(-1);parent[key]=asset(parent[key]);}}
 else {const visit=node=>{if(!node||typeof node!=='object')return node;if(node.$honroAsset)return asset(node);for(const key in node){const child=node[key];if(child&&typeof child==='object')node[key]=visit(child);}return node;};value=visit(value);}
 return pending.length?Promise.all(pending).then(()=>value):value;
}
export async function loadData(file,refs){return hydrate(await request(file),refs);}
export async function loadProject(file){const manifest=await request(file),refs=manifest.assetPaths;const [base,library,stages]=await Promise.all([loadData(manifest.base,refs?.base),loadData(manifest.library,refs?.library),Promise.all(manifest.stages.map((file,i)=>loadData(file,refs?.stages[i])))]);return {...base,library,stages};}
// Warm the same request cache during independent module imports; no project authoring or extra downloads.
export function prefetchProject(file){void request(file).then(manifest=>request(manifest.library)).catch(()=>{});}
