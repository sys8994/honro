import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const loader=(await readFile('shared/web-loader.js','utf8')).replace("new URL('../../',import.meta.url)","new URL('https://example.test/')").replace(/export /g,'');
const profile={game:'honro',schema:5,heroes:{},recruited:['archer']};
async function check(saved,count,expected){
 const catalog=(Array.isArray(count)?count:Array.from({length:count},(_,i)=>i+1)).map(id=>({metadata:{stageId:id}})),manifest={catalog,base:'base',shared:'shared',stages:catalog.map(s=>'stage'+s.metadata.stageId),stageLibraries:catalog.map(s=>'assets'+s.metadata.stageId)},fetched=[];
 const context=vm.createContext({URL,performance,setTimeout,clearTimeout,console,localStorage:{getItem:()=>typeof saved==='string'?saved:JSON.stringify(saved)},fetch:async url=>{const key=new URL(url).pathname.slice(1);fetched.push(key);return{ok:true,headers:{get:()=>null},json:async()=>key==='manifest'?manifest:[]};}});
 vm.runInContext(loader+'\nglobalThis.test={prefetchProject,destination};',context);
 assert.equal(context.test.destination({...profile,honroMapRestart:40}),1,'gameplay destination semantics unchanged before release initialization');
 context.test.prefetchProject('manifest');await new Promise(resolve=>setTimeout(resolve,10));
 assert.deepEqual(fetched,['manifest','base','shared','stage'+expected,'assets'+expected]);
 if(expected===40)assert(!fetched.includes('stage30')&&!fetched.includes('assets30'));
}
const cleared=Object.fromEntries(Array.from({length:40},(_,i)=>[i+1,true]));
await check({...profile,honroBattle:{mode:'campaign',units:[],honroStage:40}},40,40);
await check({...profile,cleared},40,40);
await check({...profile,honroMapRestart:31},40,31);
await check({...profile,cleared,honroMapRestart:40},30,30);
await check({...profile,honroBattle:{mode:'campaign',honroCustom:true,units:[],honroStage:40}},40,1);
await check({...profile,honroMapRestart:999},40,1);
await check('{invalid',40,1);
await check(null,40,1);
await check({...profile,honroMapRestart:31},[1,31,40],31);
await check({game:'other',honroMapRestart:40},40,1);
console.log('PASS catalog-bounded early prefetch: stage40 battle/rest,31restart,legacy30,custom/invalid profiles; no extra30 requests; gameplay selector unchanged');
