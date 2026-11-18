import assert from'node:assert/strict';import{readFile,writeFile}from'node:fs/promises';import path from'node:path';
const dir=process.argv[2],order=['baseline','candidate','candidate','baseline'],results=[];
const stats=xs=>{const s=[...xs].sort((a,b)=>a-b);return{n:s.length,min:s[0],p50:s[Math.ceil(s.length*.5)-1],p95:s[Math.ceil(s.length*.95)-1],max:s.at(-1)};};
for(const view of ['desktop','portrait','native']){
 const rows=[];for(let block=0;block<2;block++)for(let i=0;i<4;i++){const variant=order[i];rows.push(JSON.parse(await readFile(path.join(dir,`stage3-perf-${view}-${block}-${i}-${variant}.json`),'utf8')));}
 for(const r of rows){assert(r.ok);assert.deepEqual(r.camera,rows[0].camera);assert.equal(r.physicsSha256,rows[0].physicsSha256);assert.equal(r.stageSha256,rows[0].stageSha256);}
 for(const variant of order.slice(0,2)){const same=rows.filter(r=>r.variant===variant);for(const r of same){assert.equal(r.runtimeSha256,same[0].runtimeSha256);assert.equal(r.pngSha256,same[0].pngSha256,'Nondeterministic visual output');assert.equal(r.bodySha256,same[0].bodySha256);}}
 const phases={};for(const phase of ['scene-cold','warm','pan']){
  phases[phase]={};for(const variant of order.slice(0,2))phases[phase][variant]=stats(rows.filter(r=>r.variant===variant).flatMap(r=>r.samples.filter(s=>s.phase===phase).map(s=>s.ms)));
  const a=phases[phase].baseline,b=phases[phase].candidate;phases[phase].deltaP50Ms=b.p50-a.p50;phases[phase].ratioP50=a.p50?b.p50/a.p50:null;
  phases[phase].blockDeltas=[0,1].map(block=>{const sub=rows.filter(r=>r.slot.startsWith(block+'-'));const values=v=>sub.filter(r=>r.variant===v).flatMap(r=>r.samples.filter(s=>s.phase===phase).map(s=>s.ms));return stats(values('candidate')).p50-stats(values('baseline')).p50;});
 }
 const memory={};for(const variant of order.slice(0,2)){const samples=rows.filter(r=>r.variant===variant).flatMap(r=>r.samples);memory[variant]=Object.fromEntries(['worldBytes','screenWorldBytes','screenBackgroundBytes','screenForegroundBytes','backgroundBytes'].map(k=>[k,Math.max(...samples.map(s=>s.cache?.[k]||0))]));}
 results.push({view,phases,memory,firstFrame:Object.fromEntries(order.slice(0,2).map(v=>[v,stats(rows.filter(r=>r.variant===v).map(r=>r.firstFrameMs))])),sourceFirstFrame:'Before image decoding; report separately, not render-ready load time.',verdict:'MEASURED; no arbitrary performance pass threshold. Review per-block cost regressions together with visual gains and mobile memory. Normal-play/device FPS not measured.'});
}
await writeFile(path.join(dir,'stage3-performance-comparison.json'),JSON.stringify({order:'ABBA repeated twice, each entry fresh Chrome profile',results},null,2));console.log(JSON.stringify(results));
