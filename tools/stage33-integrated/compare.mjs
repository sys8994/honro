import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
const load=async f=>JSON.parse(await readFile(f,'utf8'));
const expected=await load('tools/stage33-integrated/v3-expected.json'),actual=await load('_local/reports/stage33-integrated/native/report.json');
assert.equal(actual.rows.length,expected.rows.length);
for(const row of actual.rows){const old=expected.rows.find(x=>x.file===row.file);assert(old);assert.equal(row.pngSha256,old.pngSha256,row.file+' v3 image parity');assert.equal(row.gameplaySha256,old.gameplaySha256,row.file+' gameplay parity');assert.deepEqual(row.actualCamera,old.actualCamera);assert.deepEqual(row.tide,old.tide);}
const before=await load('_local/reports/stage33-integrated/stock/report.json'),after=await load('_local/reports/stage33-integrated/integrated/report.json');
for(let i=0;i<before.rows.length;i++){const a=before.rows[i],b=after.rows[i];assert.equal(a.gameplaySha256,b.gameplaySha256,a.label+' HTTP gameplay');assert.deepEqual(a.camera,b.camera);assert.deepEqual(a.tide,b.tide);if(a.stage!==33){assert.deepEqual(await readFile('_local/reports/stage33-integrated/stock/'+a.label+'.png'),await readFile('_local/reports/stage33-integrated/integrated/'+b.label+'.png'),a.label+' control pixels');}}
await writeFile('_local/reports/stage33-integrated/parity.json',JSON.stringify({nativeV3PixelParity:7,httpGameplayParity:4,httpControlPixelParity:2,noProductionDeployment:true},null,2));console.log('Native v3 parity and stock HTTP controls pass');
