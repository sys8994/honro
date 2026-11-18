import {readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import assert from 'node:assert/strict';
const out=process.argv[2];
for(const v of ['overview','west','east','top','bottom','contact','portrait']){
 const data=[];
 for(const t of ['baseline','candidate']){
  const n=t+'-'+v;
  const hit=readFileSync(join(out,n+'.result.html'),'utf8').match(/<pre id="result">([A-Za-z0-9+/=]+)<\/pre>/);
  assert(hit,n+': no result');
  const r=JSON.parse(Buffer.from(hit[1],'base64'));
  assert(r.ok&&r.farReady&&r.stageId==='stage-42'&&r.variant===t&&r.view===v,n+': '+JSON.stringify(r.error??r.ok));
  assert(r.physics&&r.units&&r.camera&&r.runtimeSha&&r.projectSha&&r.png?.startsWith('data:image/png;base64,'),n+': incomplete');
  writeFileSync(join(out,n+'.png'), Buffer.from(r.png.split(',')[1],'base64'));
  delete r.png; data.push(r);
  writeFileSync(join(out,n+'.json'),JSON.stringify(r,null,2));
 }
 for(const key of ['physics','units','camera','runtimeSha']) assert.deepEqual(data[0][key],data[1][key],v+': '+key);
 if(process.env.HONRO_QA_SMOKE==='1'){
 assert.equal(data[0].projectSha,data[1].projectSha,v+': smoke differs');
 assert.deepEqual(readFileSync(join(out,'baseline-'+v+'.png')),readFileSync(join(out,'candidate-'+v+'.png')),v+': nondeterministic smoke PNG');
 }else assert.notEqual(data[0].projectSha,data[1].projectSha,v+': duplicate project');
}
console.log('Chrome Scene parity only. Art, browser app, gameplay and release remain separate.');
