/** Dedicated synthetic fixture runner. Real clock, no user session/profile/storage. */
import {spawn} from 'node:child_process';import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';import os from 'node:os';import path from 'node:path';import {pathToFileURL} from 'node:url';
const [browser,input,output]=process.argv.slice(2);if(!browser||!input||!output)throw Error('Usage BROWSER FIXTURE OUTPUT');
const profile=await mkdtemp(path.join(os.tmpdir(),'stage3-cdp-'));let chrome,ws;const pending=new Map();let seq=0;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
try{
 chrome=spawn(browser,['--headless','--no-first-run','--no-default-browser-check','--force-device-scale-factor=1','--disable-gpu','--disable-threaded-animation','--disable-threaded-scrolling','--run-all-compositor-stages-before-draw','--remote-debugging-port=0',`--user-data-dir=${profile}`,'about:blank'],{stdio:['ignore','ignore','inherit']});
 const deadline=Date.now()+210000;let port;while(Date.now()<deadline){try{port=(await readFile(path.join(profile,'DevToolsActivePort'),'utf8')).split('\n')[0];break;}catch{}if((chrome.exitCode!==null||chrome.signalCode!==null))throw Error('Chrome exited '+(chrome.exitCode??chrome.signalCode));await sleep(100);}if(!port)throw Error('CDP startup timeout');
 const tabs=await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();const tab=tabs.find(x=>x.type==='page');if(!tab)throw Error('No fixture target');ws=new WebSocket(tab.webSocketDebuggerUrl);await new Promise((resolve,reject)=>{ws.addEventListener('open',resolve,{once:true});ws.addEventListener('error',reject,{once:true});});
 ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(!m.id)return;const p=pending.get(m.id);if(!p)return;pending.delete(m.id);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result);});
 const call=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});
 await call('Page.navigate',{url:pathToFileURL(path.resolve(input)).href});let done=false;
 while(Date.now()<deadline){const r=await call('Runtime.evaluate',{expression:"document.getElementById('result')?.textContent",returnByValue:true});if(r.result?.value&&r.result.value!=='pending'){done=true;break;}await sleep(100);}
 if(!done)throw Error('Synthetic fixture timeout');const r=await call('Runtime.evaluate',{expression:'document.documentElement.outerHTML',returnByValue:true});await writeFile(output,r.result.value);
}finally{ws?.close();chrome?.kill('SIGTERM');await sleep(300);if(chrome?.exitCode===null)chrome.kill('SIGKILL');await rm(profile,{recursive:true,force:true});}
