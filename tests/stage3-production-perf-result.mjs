import assert from 'node:assert/strict';import{readFile,writeFile,mkdir}from'node:fs/promises';import path from'node:path';import{createHash}from'node:crypto';
const [input,out,variant,view,slot]=process.argv.slice(2);assert(['baseline','candidate'].includes(variant));assert(['desktop','portrait','native'].includes(view));assert(/^[01]-[0-3]$/.test(slot));
const html=await readFile(input,'utf8'),m=html.match(/<pre id="result">([A-Za-z0-9+/=]+)<\/pre>/);assert(m,'No completed fixture result');const r=JSON.parse(Buffer.from(m[1],'base64').toString('utf8'));await mkdir(out,{recursive:true});const stem=`stage3-perf-${view}-${slot}-${variant}`;
if(!r.ok){await writeFile(path.join(out,stem+'-failure.json'),JSON.stringify(r,null,2));throw Error(JSON.stringify(r));}
assert.equal(r.variant,variant);assert.equal(r.view,view);assert.equal(r.dpr,1);for(const k of ['storage','errors','violations'])assert.deepEqual(r[k],[]);
for(const [phase,count]of Object.entries({'scene-cold':5,'screen-prime':2,warm:24,pan:12})){const rows=r.samples.filter(x=>x.phase===phase);assert.equal(rows.length,count);assert(rows.every(x=>Number.isFinite(x.ms)&&x.ms>=0));}
assert(r.samples.some(x=>x.phase==='scene-cold'&&x.ms>0),'Invalid timing clock: all cold render durations are zero');
assert(r.samples.filter(x=>x.phase==='warm').every(x=>x.tileBuilds===0),'Warm tile rebuild');
const png=Buffer.from(r.png.split(',')[1],'base64');assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a');delete r.png;r.pngSha256=createHash('sha256').update(png).digest('hex');r.slot=slot;
await writeFile(path.join(out,stem+'.png'),png);await writeFile(path.join(out,stem+'.json'),JSON.stringify(r,null,2));console.log(JSON.stringify({ok:true,variant,view,slot,firstFrameMs:r.firstFrameMs,samples:r.samples.length}));
