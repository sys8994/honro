import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {pathToFileURL} from 'node:url';
const entry=process.env.HONRO_QA_PLAYWRIGHT;
const {chromium}=await import(entry?pathToFileURL(entry).href:'playwright');
const root=path.resolve(process.env.HONRO_ROOT??'../honro-monster-runtime');
const ids=['boss_daedosa','grot_hanging','grot_hands','grot_door','wonhon','wonhon_knotted','gate_armor','forepaw'];
function assets(file){const context={};vm.runInNewContext(fs.readFileSync(file,'utf8'),context);return context.HONRO_ACTORS.assets;}
const old=assets(path.join(root,'shared/assets/actors/actors.runtime.js')),candidate={};
for(const id of ids){
 const alt='rig-parts/'+id+'/compact.runtime.js';
 Object.assign(candidate,assets(process.env.HONRO_RIG_COMPACT&&fs.existsSync(alt)?alt:'rig-parts/'+id+'/candidate.runtime.js'));
}
old.wonhon_knotted=old.wonhon; if(process.env.HONRO_RIG_IDLE_CACHE)for(const a of Object.values(candidate)) a.budget='act6-retained-art';
function report(asset){const a=asset.parts.flatMap(p=>p.paths);return {
 anchors:a.reduce((n,v)=>n+(v.d.match(/[MLCQ]/g)?.length??0),0),
 paths:a.length,parts:asset.parts.length,bytes:Buffer.byteLength(JSON.stringify(asset))
};}
const stats=Object.fromEntries(ids.map(id=>[id,{previous:report(old[id]),candidate:report(candidate[id])}]));
const browser=await chromium.launch({executablePath:process.env.HONRO_CHROMIUM_BINARY,args:['--no-sandbox','--disable-dev-shm-usage'],headless:true});
try{
 const page=await browser.newPage();
 await page.setContent('<body><canvas width="1440" height="800"></canvas></body>');
 await page.addScriptTag({content:'globalThis.HonroScene=class {}'});
 await page.addScriptTag({path:path.join(root,'shared/runtime/monster-vector.js')});
 const timings=await page.evaluate(({old,candidate})=>{
  const cv=document.querySelector('canvas'),c=cv.getContext('2d'), oldRenderer=HonroVectorParts.create(old),newRenderer=HonroVectorParts.create(candidate);
  const scenarios={
    '58-mixed':['boss_daedosa','grot_hanging','grot_hands','grot_door'],
    '59-14-live':Array.from({length:14},(_,i)=>i===13?'forepaw':i%5===0?'gate_armor':i%2===0?'wonhon_knotted':'wonhon')
  };
  function measure(renderer,roster,size){
   const a=[];
   for(let i=0;i<53;i++){
    const t=performance.now();
    c.clearRect(0,0,1440,800);
    for(const [j,id] of roster.entries()){
     const scale=size/renderer.assets[id].baseHeight;c.save();
     c.translate(126+j%7*188,199+Math.floor(j/7)*230);c.scale(scale,scale);
     renderer.draw(c,id,{time:i/30,pixels:size,state:j===i%roster.length?{attack:(i%10)/10}:{move:false}});
     c.restore();
    }
    c.getImageData(0,0,1,1);
    if(i>=13)a.push(performance.now()-t);
   }
   a.sort((x,y)=>x-y);return {p50:a[Math.floor(a.length*.5)],p95:a[Math.floor(a.length*.95)]};
  }
  return Object.fromEntries(Object.entries(scenarios).map(([k,roster])=>[k,Object.fromEntries([48,96,128].map(s=>[s,{baseline:measure(oldRenderer,roster,s),candidate:measure(newRenderer,roster,s)}]))]));
 },{old:Object.fromEntries(ids.map(id=>[id,old[id]])),candidate});
 fs.writeFileSync('rig-parts/isolated-render-metrics.json',JSON.stringify({stats,timings},null,2)+'\n');
 console.log(JSON.stringify({stats,timings},null,2));
}finally{await browser.close();}
