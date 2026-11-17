import fs from'node:fs';import path from'node:path';import assert from'node:assert/strict';import{createHash}from'node:crypto';import{execFileSync}from'node:child_process';
const sha=b=>createHash('sha256').update(b).digest('hex'),m=JSON.parse(fs.readFileSync('web/manifest.json')),out=process.env.OUT;
for(const f of [...m.files,...(m.previousFiles||[]),...(m.publishedGenerations||[]).flatMap(g=>g.files)]){const b=fs.readFileSync(f.path);assert.equal(b.length,f.bytes,f.path);assert.equal(sha(b),f.sha256,f.path);}
assert(m.publishedGenerations.some(g=>g.sourceSha==='7d238d20663c3ceffe430eb0304e01516ae625cf'),'current successful public graph retained');
const html=fs.readFileSync('HONRO.html');assert.equal(sha(html),'e755d6ca1e7bf268a0f40f64b87acdeaca25df150b847328a152bd41b335da78','exact previously reviewed actual App HTML');
assert(html.includes(Buffer.from(m.gameEntry)));
for(const g of ['HONRO.html','index.html','HONRO_WORKSHOP.html','workshop/HONRO_MAP_WORKSHOP.html'])assert(fs.existsSync(g));
const changed=execFileSync('git',['diff','--name-only'],{encoding:'utf8'}).trim().split('\n').filter(Boolean);
assert(changed.every(p=>p.startsWith('web/')||['HONRO.html','HONRO_WORKSHOP.html','index.html','workshop/HONRO_MAP_WORKSHOP.html'].includes(p)),JSON.stringify(changed));
const files=['HONRO.html','HONRO_WORKSHOP.html','index.html','web/manifest.json','workshop/HONRO_MAP_WORKSHOP.html'].map(p=>({path:p,bytes:fs.statSync(p).size,sha256:sha(fs.readFileSync(p))}));
fs.mkdirSync(out,{recursive:true});fs.writeFileSync(out+'/generated-graph.json',JSON.stringify({production:'09ac90235b89031b6df8d88cde4c16f39aba78f7',source:process.env.GITHUB_SHA,files,activeGraphSha256:sha(JSON.stringify(m.files)),activeFiles:m.files,publishedGenerations:m.publishedGenerations.map(g=>({sourceSha:g.sourceSha,publishedAt:g.publishedAt,graphSha256:g.graphSha256,fileCount:g.files.length})),scope:'Generated candidate only, not deployed'},null,2));
