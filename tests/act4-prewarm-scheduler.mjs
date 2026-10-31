/** Speculative fetch is delayed/cancellable; required chapter loads stay independent. */
import assert from 'node:assert/strict';
const events=[],timers=new Map(),idles=new Map();let serial=0,held=false,aborted=false;
const oldSetTimeout=globalThis.setTimeout,oldClearTimeout=globalThis.clearTimeout;
globalThis.setTimeout=(fn,ms)=>{if(!ms)return oldSetTimeout(fn,0);const id=++serial;timers.set(id,{fn,ms});return id};globalThis.clearTimeout=id=>{if(typeof id==='number')timers.delete(id);else oldClearTimeout(id)};
globalThis.requestIdleCallback=fn=>{const id=++serial;idles.set(id,fn);return id};globalThis.cancelIdleCallback=id=>idles.delete(id);
Object.defineProperty(globalThis,'navigator',{value:{connection:{}},configurable:true});globalThis.document={hidden:false,addEventListener(){}};globalThis.addEventListener=()=>{};globalThis.HonroApp={screen:'title'};globalThis.HONRO_ACT4_RELEASE=true;globalThis.localStorage={getItem:()=>JSON.stringify({game:'honro',schema:5,heroes:{},recruited:['archer'],honroBattle:{mode:'campaign',honroStage:39,units:[]}})};
const manifest={base:'base.json',shared:'shared.json',catalog:[{metadata:{stageId:39}},{metadata:{stageId:40}}],stages:['stage39.json','stage40.json'],stageLibraries:['lib39.json','chapter-40-assets-parts.hash.json'],unitTemplates:[],assetPaths:{stageLibraries:[[],[]],stages:[[],[]]}};
const files={'manifest.json':manifest,'base.json':{},'shared.json':[],'stage39.json':{metadata:{stageId:39}},'stage40.json':{metadata:{stageId:40}},'lib39.json':[],'chapter-40-assets-parts.hash.json':{$honroJsonParts:1,bytes:2,parts:[{path:'part.bin',bytes:2}]},'part.bin':[]};
globalThis.fetch=async (url,options={})=>{const file=String(url).split('/').at(-1);events.push({file,speculative:!!options.signal});if(held&&file==='part.bin'&&options.signal){return new Promise((resolve,reject)=>{options.signal.addEventListener('abort',()=>{aborted=true;reject(Object.assign(Error('abort'),{name:'AbortError'}))},{once:true})})}if(!(file in files))throw Error('Unexpected '+file);return new Response(JSON.stringify(files[file]),{status:200,headers:{'Content-Type':'application/json'}})};
const flush=async()=>{for(let i=0;i<20;i++)await new Promise(resolve=>setImmediate(resolve))};
const runTimers=()=>{for(const [id,t]of [...timers]){timers.delete(id);t.fn()}};const runIdle=()=>{for(const [id,fn]of [...idles]){idles.delete(id);fn()}};
try{
 const m=await import('../shared/web-loader.js?prewarm-test');await m.loadCampaign('manifest.json',[]);events.length=0;
 HonroCampaignLoader.prewarmNext(39);assert.equal(events.length,0);HonroCampaignLoader.cancelPrewarm();runTimers();runIdle();await flush();assert.equal(events.length,0);console.log('PASS early entry cancels delayed prewarm before network');
 HonroCampaignLoader.prewarmNext(39);runTimers();runIdle();await flush();assert.deepEqual(events.map(x=>x.file),['chapter-40-assets-parts.hash.json','part.bin','stage40.json']);assert(events.every(x=>x.speculative));console.log('PASS idle prewarm fetches descriptor, parts and stage without required loader cache');
 events.length=0;held=true;HonroCampaignLoader.prewarmNext(39);runTimers();runIdle();await flush();assert(events.some(x=>x.file==='part.bin'&&x.speculative));const stage=await HonroCampaignLoader.ensureStage(40);await flush();assert(aborted);assert.equal(stage.metadata.stageId,40);assert(events.some(x=>x.file==='part.bin'&&!x.speculative));console.log('PASS required load aborts in-flight speculation and succeeds independently');
}finally{globalThis.setTimeout=oldSetTimeout;globalThis.clearTimeout=oldClearTimeout}
