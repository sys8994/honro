import fs from 'node:fs';import assert from 'node:assert/strict';import path from 'node:path';
const [file,out]=process.argv.slice(2);const html=fs.readFileSync(file,'utf8'),match=html.match(/<pre id="result">([^<]+)<\/pre>/);assert(match,'result absent');
const r=JSON.parse(Buffer.from(match[1],'base64').toString());fs.mkdirSync(out,{recursive:true});
const key=r.variant&&r.view?`stage40-${r.variant}-${r.view}`:path.basename(file).replace(/\.[^.]+$/,'')+'-failed';
if(r.png){fs.writeFileSync(path.join(out,key+'.png'),Buffer.from(r.png.split(',')[1],'base64'));delete r.png;}
fs.writeFileSync(path.join(out,key+'.json'),JSON.stringify(r,null,2));
assert(r.ok,JSON.stringify({error:r.error,diagnosticFailures:r.diagnosticFailures}));
assert(r.storage.length===0&&r.errors.length===0&&r.violations.length===0);assert.equal(r.stage,40);assert.equal(r.tideSnapshot.surface,3762.5);assert(r.renderPure);
console.log(key,r.units.length,r.camera);
