// Independent reconstruction of exact, deliberately expected owners only.
import {readFileSync as rd} from 'node:fs';
import {join} from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const [a,b,la,lb,ax,bx,laPath,lbPath]=process.argv.slice(2);
const {minify}=createRequire(join(b,'package.json'))('terser');
const pins=JSON.parse(rd(fileURLToPath(new URL('./PINS.json',import.meta.url))));
const atomic=p=>rd(p,'utf8').replace(/\r\n/g,'\n');
const sha=x=>createHash('sha256').update(x).digest('hex');
const locked = async x=>(await minify(x,{module:true,compress:false,mangle:false,format:{comments:false}})).code+'\n';
const {modelFiles}=await import(pathToFileURL(join(b,'shared/build.mjs')).href);
const names=modelFiles.slice(0,18);
assert.equal(names[16],'profile-store');assert.equal(names[17],'encounters');
const blocks=[];
for(const [root, loader, output, selected, publishedLoader, profileBytes] of [[a,la,ax,laPath,laPath,pins.rawGroupSizes[0]],[b,lb,bx,lbPath,lbPath,pins.rawGroupSizes[1]]]){
 const sources=names.map(n=>atomic(join(root,'shared/runtime',n+'.js')));
 if(blocks.length)assert.deepEqual(sources.filter((_,i)=>i!==16),blocks[0].sources.filter((_,i)=>i!==16));
 const bytes=sources.slice(0,17).reduce((x,y)=>x+Buffer.byteLength(y),0);
 assert.equal(bytes,profileBytes,'known canonical grouping byte length changed');
 assert(bytes<=196608&&bytes+Buffer.byteLength(sources[17])>196608,'known canonical grouping boundary changed');
 const source='import {yieldIfNeeded} from '+JSON.stringify('./'+loader)+';\n'+sources.slice(0,17).map(s=>"(()=>{\n'use strict';\n"+s+"\n})();\nawait yieldIfNeeded();\n").join('');
 const compiled=await locked(source), actual=rd(join(root,output),'utf8');
 assert.equal(compiled,actual,'exact common4 output does not match native compiled owner');
 const {unpackJson}=await import(pathToFileURL(join(root,'shared/json-pool.mjs')).href);
 const input=atomic(join(root,'shared/web-loader.js')).replace('/* JSON_POOL_DECODER */',unpackJson.toString());
 const l=await locked(input), runtimeLoader=rd(join(root,selected),'utf8');
 assert.equal(l,runtimeLoader,'exact independent loader reconstruction failed');
 assert.equal(publishedLoader,selected);
 blocks.push({sources,compiled:sha(compiled),loader:sha(l),bytes});
}
console.log(JSON.stringify({a:blocks[0].compiled,b:blocks[1].compiled,loaderA:blocks[0].loader,loaderB:blocks[1].loader,rawGroupA:blocks[0].bytes,rawGroupB:blocks[1].bytes,groupOwners:names.slice(0,17),profileOnly:true}));
