const root='../../shared/assets/monsters/a2/';
const canvas=document.querySelector('#proof'),ctx=canvas.getContext('2d');
const status=document.querySelector('#status'),button=document.querySelector('#run');
const candidateAssets={},sourceRows=[];let loadMs=0;
const digest=async bytes=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),n=>n.toString(16).padStart(2,'0')).join('');
function counts(paths){let anchors=0,controls=0,subpaths=0;for(const p of paths)for(const [,cmd,args] of p.d.matchAll(/([MLQCZ])([^MLQCZ]*)/g)){const n=(args.match(/[-+]?(?:\d*\.)?\d+/g)||[]).length;if(cmd==='M'){anchors+=n/2;subpaths++;}else if(cmd==='L')anchors+=n/2;else if(cmd==='Q'){anchors+=n/4;controls+=n/4;}else if(cmd==='C'){anchors+=n/6;controls+=n/3;}}return{anchors,controls,subpaths,paths:paths.length};}
async function loadManifest(file,optional=false){
 const response=await fetch(root+file,{cache:'no-store'});if(optional&&response.status===404)return;
 if(!response.ok)throw Error('Manifest HTTP '+response.status);const manifest=await response.json();
 for(const row of manifest.assets){
  if(!/^(?:alternates\/)?[\w-]+\.svg$/.test(row.file))throw Error('Unsafe asset path');
  const start=performance.now(),r=await fetch(root+row.file,{cache:'no-store'});if(!r.ok)throw Error('SVG HTTP '+r.status);
  const bytes=await r.arrayBuffer(),sha256=await digest(bytes);if(sha256!==row.sha256)throw Error('Source hash mismatch: '+row.id);
  const svg=new DOMParser().parseFromString(new TextDecoder().decode(bytes),'image/svg+xml');
  if(svg.querySelector('parsererror'))throw Error('SVG parse failed');
  for(const e of svg.querySelectorAll('*')){if(!['svg','path'].includes(e.localName))throw Error('Unsupported SVG node');if(e.hasAttribute('transform')||e.hasAttribute('clip-path'))throw Error('Unsupported geometry modifier');}
  const palette={},paths=Array.from(svg.querySelectorAll('path'),(e,i)=>{const d=e.getAttribute('d'),fill=e.getAttribute('fill');if(!d||/[^MLCQZ\d.,\s+-]/.test(d)||!/^#[\da-f]{6}$/i.test(fill))throw Error('Unsupported path/color');palette['c'+i]=fill;return{d,fill:'c'+i,stroke:null,width:0,lod:0};});
  const measured=counts(paths);if(measured.anchors!==row.anchors||measured.paths!==row.paths||bytes.byteLength!==row.bytes)throw Error('Manifest statistics mismatch: '+row.id);
  const a={id:row.id,baseHeight:128,viewBox:[-85,-150,230,160],palette,parts:[{id:'root',parent:null,pivot:[0,0],paths}],clips:Object.fromEntries(['idle','move','attack','hit','jump_fall'].map(n=>[n,{duration:1,loop:false,tracks:[]}]))};
  candidateAssets[row.id]=a;sourceRows.push({...measured,id:row.id,file:row.file,sha256,svgBytes:bytes.byteLength,fetchParseHashMs:performance.now()-start,overExisting350AnchorGate:measured.anchors>350,variant:row.variant||'retained-high-fidelity'});
 }
}
const stats=values=>{const x=[...values].sort((a,b)=>a-b);return{median:x[Math.floor(x.length*.5)],p95:x[Math.min(x.length-1,Math.floor(x.length*.95))]};};
function positionedDraw(api,id,size,i,time=0){ctx.save();ctx.translate(110+(i%8)*150,160+(Math.floor(i/8)%5)*250);ctx.scale(size/128,size/128);api.draw(ctx,id,{time,pixels:size});ctx.restore();}
function cacheFor(api,id){const c=document.createElement('canvas');c.width=460;c.height=320;const cc=c.getContext('2d');cc.scale(2,2);cc.translate(85,150);const t=performance.now();api.draw(cc,id,{time:0,pixels:256,detail:2});return{canvas:c,buildCpuMs:performance.now()-t};}
function drawProof(all,ids){
 const api=HonroVectorParts.create(all);ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#9fa29b';ctx.fillRect(0,0,canvas.width,canvas.height);
 const groups=[['shade','ghost'],['eoduksini-growth1','eoduksini-stage1-prepare','eoduksini-stage1-attack','eoduksini-stage1-recover'],['eoduksini-growth2','eoduksini-stage2-prepare','eoduksini-stage2-attack','eoduksini-stage2-recover'],['eoduksini-growth3','eoduksini-prepare','eoduksini-attack','eoduksini-recover'],['munyeo-idle','munyeo-prepare','munyeo-link','munyeo-recover'],ids.filter(x=>x.startsWith('munyeo-flat-'))];
 groups.forEach((row,ri)=>row.forEach((id,ci)=>{if(!all[id])return;const x=95+ci*320,y=ri*260;ctx.fillStyle='#17201c';ctx.font='13px sans-serif';ctx.fillText(id,ci*320+8,y+22);for(const [size,dx,dy,facing] of [[128,0,175,1],[48,110,245,1],[48,185,245,-1]]){ctx.save();ctx.translate(x+dx,y+dy);ctx.scale(size/128*facing,size/128);api.draw(ctx,id,{time:0,pixels:size,detail:2});ctx.restore();}}));
}
async function measure(){
 const all={...HONRO_MONSTERS.assets,...candidateAssets},ids=['shade','ghost',...Object.keys(candidateAssets)],results={};
 for(const id of ids){
  status.textContent='Measuring '+id;await new Promise(requestAnimationFrame);
  const cold=[];for(let i=0;i<25;i++){const api=HonroVectorParts.create(all),t=performance.now();positionedDraw(api,id,128,i);cold.push(performance.now()-t);}
  const api=HonroVectorParts.create(all);positionedDraw(api,id,128,0);const direct={};
  for(const size of [48,128]){const times=[];for(let batch=0;batch<15;batch++){ctx.clearRect(0,0,canvas.width,canvas.height);const t=performance.now();for(let i=0;i<100;i++)positionedDraw(api,id,size,i,batch*.01);times.push((performance.now()-t)/5);}direct[size]={twentyActorCpuMs:stats(times)};}
  const cache=cacheFor(api,id),cached={};for(const size of [48,128]){const times=[];for(let batch=0;batch<15;batch++){ctx.clearRect(0,0,canvas.width,canvas.height);const t=performance.now();for(let i=0;i<100;i++){ctx.save();ctx.translate(110+(i%8)*150,160+(Math.floor(i/8)%5)*250);ctx.scale(size/128,size/128);ctx.drawImage(cache.canvas,-85,-150,230,160);ctx.restore();}times.push((performance.now()-t)/5);}cached[size]={twentyActorCpuMs:stats(times)};}
  results[id]={coldCompileAndDrawCpuMs:stats(cold),direct,staticFrameCacheProposal:{buildCpuMs:cache.buildCpuMs,rgbaPixelBytes:460*320*4,cached},paths:all[id].parts.flatMap(p=>p.paths).length};
 }
 drawProof(all,ids);
 return{productionApproval:false,note:'Measurements only. Existing production budget gate unchanged. CPU command submission is not complete GPU frame time or mobile FPS. Static cache is an unintegrated proposal. 4x CPU rate, if requested by driver, is synthetic throttling, not a device.',environment:{userAgent:navigator.userAgent,hardwareConcurrency:navigator.hardwareConcurrency,devicePixelRatio,heapUsedBytes:performance.memory?.usedJSHeapSize??null},load:{note:'Loopback HTTP fetch+parse+hash timing of this QA loader, not CDN/network or production loader latency.',totalFetchParseHashMs:loadMs,candidateSvgBytes:sourceRows.reduce((s,r)=>s+r.svgBytes,0),sourceRows},memory:{sourceUtf8Bytes:sourceRows.reduce((s,r)=>s+r.svgBytes,0),candidateCacheRgbaBytes:sourceRows.length*460*320*4,heapNote:'Heap snapshot is neither a peak nor a steady-state measure; GC timing may retain temporary allocations.',excludes:'Path2D native storage, JS object/string overhead and GPU allocation overhead are not measured'},results};
}
button.onclick=async()=>{button.disabled=true;try{const result=await measure();document.querySelector('#result').textContent=JSON.stringify(result,null,2);status.textContent='Complete';document.documentElement.dataset.qaState='complete';}catch(e){status.textContent='FAILED: '+e.message;document.documentElement.dataset.qaState='failed';throw e;}};
try{const start=performance.now();await loadManifest('manifest.candidate.json');await loadManifest('manifest.alternates.json',true);loadMs=performance.now()-start;drawProof({...HONRO_MONSTERS.assets,...candidateAssets},Object.keys(candidateAssets));button.disabled=false;status.textContent='Ready: '+sourceRows.length+' hashed candidate SVGs';document.documentElement.dataset.qaState='ready';}catch(e){status.textContent='FAILED: '+e.message;document.documentElement.dataset.qaState='failed';throw e;}
