/** Bounded one-page CDP diagnostic. Same standard Chrome flags; no sandbox change. */
import {spawn} from 'node:child_process';
import {mkdir,readFile,writeFile,appendFile} from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const [browser,profile,input,out]=process.argv.slice(2);if(!out)throw Error('browser profile input outputDirectory required');
await mkdir(out,{recursive:true});
const started=Date.now(),deadline=started+120000,events=[],samples=[];let ws,closed=false,seq=0;
const pending=new Map(),sleep=ms=>new Promise(r=>setTimeout(r,ms)),clip=(s,n=3000)=>String(s??'').slice(0,n);
const log=(type,data)=>{const row={ms:Date.now()-started,type,data};events.push(row);if(events.length>500)events.shift();void appendFile(path.join(out,'events.jsonl'),JSON.stringify(row)+'\n').catch(()=>{});};
const child=spawn(browser,['--headless','--no-first-run','--no-default-browser-check','--force-device-scale-factor=1','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{stdio:['ignore','ignore','pipe']});
child.stderr.on('data',b=>{void appendFile(path.join(out,'chrome-stderr.log'),b).catch(()=>{});});
child.on('exit',(code,signal)=>log('chrome-exit',{code,signal}));
const send=(method,params={},timeout=4000)=>new Promise((resolve,reject)=>{if(!ws||closed)return reject(Error('CDP unavailable'));const id=++seq,timer=setTimeout(()=>{pending.delete(id);reject(Error('CDP command timeout: '+method));},Math.min(timeout,Math.max(1,deadline-Date.now())));pending.set(id,{resolve:r=>{clearTimeout(timer);resolve(r);},reject:e=>{clearTimeout(timer);reject(e);}});ws.send(JSON.stringify({id,method,params}));});
const persist=async extra=>writeFile(path.join(out,'progress.json'),JSON.stringify({elapsedMs:Date.now()-started,input,events:events.slice(-100),samples,...extra},null,2));
let completed=false,error=null;
try{
 let port;while(!port){if(Date.now()>deadline)throw Error('Chrome startup deadline');try{port=Number((await readFile(path.join(profile,'DevToolsActivePort'),'utf8')).split('\n')[0]);}catch{await sleep(100);}}
 const tabs=await(await fetch(`http://127.0.0.1:${port}/json/list`,{signal:AbortSignal.timeout(4000)})).json(),tab=tabs.find(t=>t.type==='page');if(!tab)throw Error('No Chrome page');
 ws=new WebSocket(tab.webSocketDebuggerUrl);await Promise.race([new Promise((resolve,reject)=>{ws.addEventListener('open',resolve,{once:true});ws.addEventListener('error',reject,{once:true});}),sleep(4000).then(()=>{throw Error('CDP open timeout');})]);
 ws.addEventListener('close',()=>{closed=true;log('cdp-close',{});for(const p of pending.values())p.reject(Error('CDP closed'));pending.clear();});
 ws.addEventListener('message',e=>{const r=JSON.parse(e.data);if(r.id&&pending.has(r.id)){const p=pending.get(r.id);pending.delete(r.id);r.error?p.reject(Error(JSON.stringify(r.error))):p.resolve(r.result);return;}
  const p=r.params||{};
  if(r.method==='Runtime.exceptionThrown')log(r.method,{text:p.exceptionDetails?.text,exception:clip(p.exceptionDetails?.exception?.description),line:p.exceptionDetails?.lineNumber,url:p.exceptionDetails?.url});
  else if(r.method==='Runtime.consoleAPICalled')log(r.method,{type:p.type,args:p.args?.map(a=>clip(a.value??a.description,1000)).slice(0,8)});
  else if(r.method==='Log.entryAdded')log(r.method,{...p.entry,text:clip(p.entry?.text),stackTrace:undefined});
  else if(['Page.domContentEventFired','Page.loadEventFired','Inspector.detached'].includes(r.method))log(r.method,p);
  else if(r.method==='Debugger.scriptParsed')log(r.method,{url:p.url,length:p.length,scriptId:p.scriptId});
 });
 for(const method of ['Page.enable','Runtime.enable','Log.enable','Debugger.enable'])await send(method);
 log('navigate',{url:pathToFileURL(path.resolve(input)).href});await persist({phase:'before-navigation'});
 try{await send('Page.navigate',{url:pathToFileURL(path.resolve(input)).href},8000);}catch(e){log('navigation-command',String(e));}
 const expression=`(()=>{const el=document.getElementById('result'),p=globalThis.PROBE;return{readyState:document.readyState,title:document.title,resultLength:el?.textContent?.length??0,resultHead:el?.textContent?.slice(0,100)??null,resultReady:!!el&&el.textContent!=='pending'&&/^[A-Za-z0-9+/=]+$/.test(el.textContent),bodyHead:document.body?.innerText?.slice(0,1200),core:!!globalThis.HONRO_CORE,scene:!!globalThis.HonroScene,helper:!!globalThis.HonroStage32FoundationArt,app:!!globalThis.HonroApp,probe:p?{storage:p.storage,errors:p.errors.slice(-3),violations:p.violations.slice(-3),images:p.images.length,pending:p.images.filter(x=>x.pending).length}:null}})()`;
 while(Date.now()<deadline-8000){
  try{const r=await send('Runtime.evaluate',{expression,returnByValue:true,timeout:3000});const sample={ms:Date.now()-started,value:r.result?.value,exception:r.exceptionDetails?.text};samples.push(sample);await persist({phase:'polling'});
   if(sample.value?.resultReady){const value=await send('Runtime.evaluate',{expression:"document.getElementById('result').textContent",returnByValue:true,timeout:3000});if(typeof value.result?.value!=='string')throw Error('Result text unavailable');await writeFile(path.join(out,'result.html'),'<pre id="result">'+value.result.value+'</pre>');completed=true;break;}
  }catch(e){samples.push({ms:Date.now()-started,error:String(e)});await persist({phase:'evaluate-timeout-or-error'});}
  await sleep(1500);
 }
 if(!completed)throw Error('Bounded probe did not complete within120s; see samples/events');
}catch(e){error=String(e.stack||e);log('probe-error',error);}finally{
 await persist({phase:'final',completed,error});ws?.close();child.kill('SIGTERM');setTimeout(()=>child.kill('SIGKILL'),1000).unref();
}
console.log(JSON.stringify({completed,error,out}));if(!completed)process.exitCode=1;
