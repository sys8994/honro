import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFile,writeFile,mkdir,mkdtemp,rm} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
const dir=path.dirname(fileURLToPath(import.meta.url));
const browser=process.env.CHROME_BIN||'/usr/bin/google-chrome';
const out=path.resolve(process.env.STUDY_OUTPUT||'artifacts/stage7-vector-study');await mkdir(out,{recursive:true});
const repo=path.resolve(dir,'../../..');
const config=JSON.parse(await readFile(path.join(repo,'game/tools/stage7-svg-study/config.json'),'utf8'));
config.scope='Actual HonroVectorArt on attached correctly sized canvas; NOT HonroScene, campaign, mobile FPS or deployment';
const assets={};for(const k of ['original','candidate'])assets[k]=JSON.parse(await readFile(path.join(dir,'generated',k+'.json'),'utf8'));
const renderer=await readFile(path.join(repo,'shared/map/vector-art.js'),'utf8');
const contract=JSON.parse(await readFile(path.join(dir,'generated/conversion-contract.json'),'utf8'));
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
 await evaluate(renderer);
 await evaluate(`(()=>{window.studyAssets=${JSON.stringify(assets)};window.studyConfig=${JSON.stringify(config)};window.warmAssets={};
 window.renderStudy=function(kind,view,pan=0,repeats=0,fresh=true){
   const asset=fresh?JSON.parse(JSON.stringify(studyAssets[kind])):(warmAssets[kind]||(warmAssets[kind]=JSON.parse(JSON.stringify(studyAssets[kind]))));
   document.body.style.margin='0';document.querySelectorAll('canvas').forEach(x=>x.remove());
   const canvas=document.createElement('canvas');canvas.width=view.width;canvas.height=view.height;canvas.style.width=view.width+'px';canvas.style.height=view.height+'px';canvas.style.display='block';document.body.appendChild(canvas);
   const rect=canvas.getBoundingClientRect();if(canvas.width!==view.width||canvas.height!==view.height||rect.width!==view.width||rect.height!==view.height||canvas.width<100||canvas.height<100)throw Error('Actual canvas dimensions mismatch or 1x1 canvas');
   const c=canvas.getContext('2d',{willReadFrequently:true});c.honroVisualLayer='gameplay';const [x,y,w,h]=view.viewBox;const scale=Math.min(canvas.width/w,canvas.height/h);const ox=(canvas.width-w*scale)/2,oy=(canvas.height-h*scale)/2;
   const matrix=[scale,0,0,scale,ox-(x+pan)*scale,oy-y*scale];
   const t=performance.now();const prepared=HonroVectorArt.prepare(asset.vector);const ready=performance.now();
   function draw(){c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,canvas.width,canvas.height);c.setTransform(...matrix);if(!HonroVectorArt.draw(c,asset,{x:0,y:0,scale:1}))throw Error('Vector draw fallback');c.getImageData(0,0,canvas.width,canvas.height);}
   draw();const finished=performance.now();const repeated=[];for(let i=0;i<repeats;i++){const a=performance.now();draw();repeated.push(performance.now()-a);}
   return {prepareMs:ready-t,drawReadbackMs:finished-ready,totalMs:finished-t,repeatedDrawReadbackMs:repeated,canvas:{width:canvas.width,height:canvas.height,cssWidth:rect.width,cssHeight:rect.height,sourceTransform:matrix,authoredWorldScale:3.13,equivalentWorldCameraScale:scale/3.13},pathCount:prepared.pathCount,uniquePathCount:prepared.uniquePathCount,png:canvas.toDataURL('image/png').split(',')[1]};};return true;})()`);
 const results={scope:config.scope,environment:{chrome:version,rendererSHA256:createHash('sha256').update(renderer).digest('hex'),platform:process.platform,node:process.version,cpus:os.cpus().map(x=>x.model),args},conversion:contract,views:{},timing:{coldFreshVector:[],panWarmVector:[]}};
 for(const view of config.views){results.views[view.name]={};for(const kind of ['original','candidate']){const r=await evaluate(`renderStudy(${JSON.stringify(kind)},${JSON.stringify(view)},0,7)`);await writeFile(path.join(out,view.name+'-'+kind+'.png'),Buffer.from(r.png,'base64'));delete r.png;results.views[view.name][kind]=r;}}
 const v=config.views.find(v=>v.name==='portrait-left');
 for(let i=0;i<6;i++)for(const kind of i%2?['candidate','original']:['original','candidate']){const r=await evaluate(`renderStudy(${JSON.stringify(kind)},${JSON.stringify(v)})`);delete r.png;results.timing.coldFreshVector.push({round:i,kind,...r});}
 for(const kind of ['original','candidate'])await evaluate(`renderStudy(${JSON.stringify(kind)},${JSON.stringify(v)},0,0,false)`);
 for(const pan of [0,1,4,16,64,128,-1,-16])for(const kind of ['original','candidate']){const r=await evaluate(`renderStudy(${JSON.stringify(kind)},${JSON.stringify(v)},${pan},0,false)`);delete r.png;results.timing.panWarmVector.push({panSourceUnits:pan,kind,...r});}
 results.timing.notes=['Real performance.now; no virtual time','Cold means fresh cloned vector and actual validate/Path2D prepare, not cold browser startup','Repeated draw reuses prepared vector but executes actual native VectorArt path drawing','Pan changes Canvas source transform with a warm prepared vector, NOT full Scene camera/render cost','Canvas bitmap AND attached CSS size are asserted for every view','CI CPU timings are NOT phone performance/FPS'];
 await writeFile(path.join(out,'results.json'),JSON.stringify(results,null,2));
 console.log(JSON.stringify({scope:config.scope,views:Object.keys(results.views),out}));
}finally{ws?.close();child.kill('SIGTERM');await writeFile(path.join(out,'chrome-stderr.log'),stderr);/* Leave profile cleanup to ephemeral runner after Chrome exit. */}
