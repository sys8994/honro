import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const [base,qa,out]=process.argv.slice(2);
const author=path.join(base,'tools/environment/stage30-ferry-art.mjs');
const orig=fs.readFileSync(author,'utf8'),a=orig.indexOf('function distantRiver()'),b=orig.indexOf('function bankRoots()',a);
assert(a>=0&&b>a);
const old=orig.slice(a,b),next=old.replace('y2="6700"','y2="8500"').replace('offset="0.45"','offset="0.21857142857142858"').replace('<stop offset="1" stop-color="#2b444e"/>','<stop offset="0.4857142857142857" stop-color="#2b444e"/><stop offset="0.65" stop-color="#2b444e" stop-opacity="0.72"/><stop offset="0.83" stop-color="#2b444e" stop-opacity="0.25"/><stop offset="1" stop-color="#2b444e" stop-opacity="0"/>').replace('V7100H-6000Z','V8500H-6000Z').replace('23200,2300','23200,3700');
for(const x of ['y2="8500"','V8500H-6000Z','23200,3700'])assert(next.includes(x)&&!old.includes(x));
const generated=[];
for(const [label,source] of [['stock',orig],['candidate',orig.slice(0,a)+next+orig.slice(b)]]){
 const src=path.join(base,'tools/environment/qa-only-'+label+'-stage30.mjs');
 fs.writeFileSync(src,source+'\nexport {distantRiver};\n');
 try{generated.push(JSON.parse(JSON.stringify((await import(pathToFileURL(src))).distantRiver())));}
 finally{fs.unlinkSync(src);}
}
const packet='web/data/chapter-30-assets.99a6cc921e7e09ae.json';
const rows=JSON.parse(fs.readFileSync(path.join(base,packet),'utf8')),z=rows.findIndex(v=>v.id==='stage30:ferry-distant-channel');
assert(z>=0);
const [oldAsset,newAsset]=generated;
assert.deepEqual(oldAsset,rows[z]);
assert.deepEqual(oldAsset.params,newAsset.params);
assert.deepEqual(oldAsset.collision,[]);
assert.deepEqual(newAsset.collision,[]);
assert.deepEqual(oldAsset.vector.root.children.slice(1),newAsset.vector.root.children.slice(1));
const dest=path.join(qa,packet);
fs.writeFileSync(dest+'.temp',JSON.stringify(rows.map((v,i)=>i===z?newAsset:v)));
fs.renameSync(dest+'.temp',dest);
fs.writeFileSync(path.join(out,'asset-contract.json'),JSON.stringify({changedPacket:packet,changedAsset:newAsset.id,oldBottom:7100,newBottom:8500,onlyAssetIndex:z,physicalStagePacketUnchanged:true,originalRecompiledExactly:true,authorOtherFunctionsUnchanged:true},null,2));
