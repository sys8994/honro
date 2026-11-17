import {spawn} from 'node:child_process';
import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const [browser,profile,input,output]=process.argv.slice(2);if(!output)throw Error('browser profile input output required');
const child=spawn(browser,['--headless','--no-first-run','--no-default-browser-check','--force-device-scale-factor=1','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{stdio:['ignore','ignore','inherit']});
let ws;const deadline=Date.now()+300000;const sleep=ms=>new Promise(r=>setTimeout(r,ms));
try{
 let port;while(!port){if(Date.now()>deadline)throw Error('Chrome startup timeout');try{port=Number((await readFile(path.join(profile,'DevToolsActivePort'),'utf8')).split('\n')[0]);}catch{await sleep(100);}}
 const tabs=await(await fetch(`http://127.0.0.1:${port}/json/list`)).json(),tab=tabs.find(t=>t.type==='page');if(!tab)throw Error('No Chrome page');
 ws=new WebSocket(tab.webSocketDebuggerUrl);await new Promise((resolve,reject)=>{ws.addEventListener('open',resolve,{once:true});ws.addEventListener('error',reject,{once:true});});
 let id=0;const pending=new Map();ws.addEventListener('message',e=>{const r=JSON.parse(e.data);if(r.id&&pending.has(r.id)){const{resolve,reject}=pending.get(r.id);pending.delete(r.id);r.error?reject(Error(JSON.stringify(r.error))):resolve(r.result);}});
 const send=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,{resolve,reject});ws.send(JSON.stringify({id:n,method,params}));});
 await send('Page.enable');await send('Page.navigate',{url:pathToFileURL(path.resolve(input)).href});
 let ready=false;while(!ready){if(Date.now()>deadline)throw Error('Fixture completion timeout');const r=await send('Runtime.evaluate',{expression:"!!document.querySelector('#result') && /^[A-Za-z0-9+/=]+$/.test(document.querySelector('#result').textContent) && document.querySelector('#result').textContent !== 'pending'",returnByValue:true});ready=r.result?.value===true;if(!ready)await sleep(100);}
 const r=await send('Runtime.evaluate',{expression:'document.documentElement.outerHTML',returnByValue:true});await writeFile(output,r.result.value);
}finally{ws?.close();child.kill('SIGTERM');}
