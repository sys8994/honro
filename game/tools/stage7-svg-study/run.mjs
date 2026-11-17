import {spawn} from 'node:child_process';
import {readFile,writeFile,mkdir,mkdtemp,rm} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
const dir=path.dirname(fileURLToPath(import.meta.url));
const browser=process.env.CHROME_BIN||'/usr/bin/google-chrome';
const out=path.resolve(process.env.STUDY_OUTPUT||'artifacts/stage7-svg-study');await mkdir(out,{recursive:true});
const config=JSON.parse(await readFile(path.join(dir,'config.json'),'utf8'));
const svg={};for(const k of ['original','candidate'])svg[k]=await readFile(path.join(dir,k+'.svg'),'utf8');
const profile=await mkdtemp(path.join(os.tmpdir(),'honro-stage7-svg-'));
const args=['--headless','--no-first-run','--no-default-browser-check','--force-device-scale-factor=1','--remote-debugging-address=127.0.0.1','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'];
const child=spawn(browser,args,{stdio:['ignore','ignore','pipe']});let stderr='';child.stderr.on('data',d=>{stderr+=d;});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));let ws;const deadline=Date.now()+180000;
try {
 let port;while(!port){if(child.exitCode!==null)throw Error('Chrome exited '+child.exitCode+': '+stderr);if(Date.now()>deadline)throw Error('Chrome startup timed out');try{port=Number((await readFile(path.join(profile,'DevToolsActivePort'),'utf8')).split('\n')[0]);}catch{await sleep(100);}}
 const tabs=await(await fetch(`http://127.0.0.1:${port}/json/list`)).json();const tab=tabs.find(t=>t.type==='page');if(!tab)throw Error('Missing isolated tab');
 ws=new WebSocket(tab.webSocketDebuggerUrl);await new Promise((resolve,reject)=>{ws.addEventListener('open',resolve,{once:true});ws.addEventListener('error',reject,{once:true});});
 let id=0;const pending=new Map();ws.addEventListener('message',e=>{const r=JSON.parse(e.data);if(pending.has(r.id)){const p=pending.get(r.id);pending.delete(r.id);clearTimeout(p.timer);r.error?p.reject(Error(JSON.stringify(r.error))):p.resolve(r.result);}});
 const send=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;const timer=setTimeout(()=>{pending.delete(n);reject(Error('CDP timeout '+method));},120000);pending.set(n,{resolve,reject,timer});ws.send(JSON.stringify({id:n,method,params}));});
 const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
 const version=await send('Browser.getVersion');
 await evaluate(`(()=>{window.studySVG=${JSON.stringify(svg)};window.studyConfig=${JSON.stringify(config)};window.renderStudy=async function(kind,view,pan=0,repeats=0){
   const d=new DOMParser().parseFromString(studySVG[kind],'image/svg+xml');if(d.querySelector('parsererror'))throw Error('SVG parse failure');const root=d.documentElement;root.setAttribute('width',view.width);root.setAttribute('height',view.height);const vb=[...view.viewBox];vb[0]+=pan;root.setAttribute('viewBox',vb.join(' '));
   const xml=new XMLSerializer().serializeToString(root);const canvas=document.createElement('canvas');canvas.width=view.width;canvas.height=view.height;const c=canvas.getContext('2d',{willReadFrequently:true});
   const t=performance.now();const url=URL.createObjectURL(new Blob([xml],{type:'image/svg+xml'}));const img=new Image();img.src=url;await img.decode();const decoded=performance.now();c.drawImage(img,0,0);c.getImageData(0,0,canvas.width,canvas.height);const finished=performance.now();
   const repeated=[];for(let i=0;i<repeats;i++){const a=performance.now();c.clearRect(0,0,canvas.width,canvas.height);c.drawImage(img,0,0);c.getImageData(0,0,canvas.width,canvas.height);repeated.push(performance.now()-a);}
   const png=canvas.toDataURL('image/png').split(',')[1];URL.revokeObjectURL(url);return {decodeMs:decoded-t,drawReadbackMs:finished-decoded,totalMs:finished-t,repeatedDrawReadbackMs:repeated,png};};return true;})()`);
 const results={scope:config.scope,environment:{chrome:version,platform:process.platform,node:process.version,cpus:os.cpus().map(x=>x.model),args},views:{},timing:{coldFreshImage:[],panFreshViewport:[]}};
 for(const view of config.views){results.views[view.name]={};for(const kind of ['original','candidate']){const r=await evaluate(`renderStudy(${JSON.stringify(kind)},${JSON.stringify(view)},0,7)`);await writeFile(path.join(out,view.name+'-'+kind+'.png'),Buffer.from(r.png,'base64'));delete r.png;results.views[view.name][kind]=r;}}
 const v=config.views.find(v=>v.name==='portrait-left');
 for(let i=0;i<6;i++)for(const kind of i%2?['candidate','original']:['original','candidate']){const r=await evaluate(`renderStudy(${JSON.stringify(kind)},${JSON.stringify(v)})`);delete r.png;results.timing.coldFreshImage.push({round:i,kind,...r});}
 for(const pan of [0,1,4,16,64,128,-1,-16])for(const kind of ['original','candidate']){const r=await evaluate(`renderStudy(${JSON.stringify(kind)},${JSON.stringify(v)},${pan})`);delete r.png;results.timing.panFreshViewport.push({panSourceUnits:pan,kind,...r});}
 results.timing.notes=['Real performance.now; no virtual time','Fresh-image cold means new SVG Blob/Image within the same browser, NOT a cold browser process','Repeated timings measure SVG-image Canvas draw+readback reuse, NOT native VectorArt draw','Pan changes SVG viewBox then decodes/renders; this is NOT in-game camera cost','CPU CI numbers are NOT phone performance or FPS'];
 await writeFile(path.join(out,'results.json'),JSON.stringify(results,null,2));
 console.log(JSON.stringify({scope:config.scope,views:Object.keys(results.views),out}));
}finally{ws?.close();child.kill('SIGTERM');await writeFile(path.join(out,'chrome-stderr.log'),stderr);/* Leave profile cleanup to ephemeral runner after Chrome exit. */}
