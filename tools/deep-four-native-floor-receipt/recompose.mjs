/* Exact official source-span replay; no route/feature/runtime patch. */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const d=path.dirname(fileURLToPath(import.meta.url));
const pins=JSON.parse(fs.readFileSync(path.join(d,'chunks.json')));
const [A,B,out]=process.argv.slice(2).map(x=>path.resolve(x));
const sha=b=>createHash('sha256').update(b).digest('hex');
const blob=b=>createHash('sha1').update('blob '+b.length+'\0').update(b).digest('hex');
const read=(r,n)=>fs.readFileSync(path.join(r,n));
const claim=(r,n,p)=>{const b=read(r,n);assert.equal(sha(b),p,n);return b;};
const forceNames=owner=>{
 const prefix=owner.indexOf("await file('shared/assets/actors/actors.runtime.js');");
 const start=owner.indexOf("for(const name of ['renderer'",prefix);
 const finish=owner.indexOf('  if(render){\n    const timeline=',start);
 assert(prefix>=0&&start>prefix&&finish>start);
 const segment=owner.slice(start,finish);
 assert(segment.includes("if(act3TerrainPreview||act3TerrainStages.length)await file('shared/runtime/act3-handoff-art.js');"));
 const m=segment.match(/for\(const name of (\['renderer'[^\]]+\])\)await file\(`shared\/runtime\/\$\{name\}\.js`\);/);
 assert(m);
 return [...JSON.parse(m[1].replaceAll("'",'"')),'act3-handoff-art'].map(s=>'shared/runtime/'+s+'.js');
};
const sourceRecord=owner=>{
 const names=forceNames(owner);assert.equal(names.length,42);
 return names;
};
const receipt={purpose:'Exact build input block replay with project lockfile Terser',originalRun:pins.originalRun,
 stock:{},target:{},explainedMoves:pins.moves};
const entries=[],normalizedEntries=[],normalizedShells=[];
for(const [mode,r] of [['stock',A],['target',B]]){
 const build=claim(r,'shared/build.mjs',pins.builders['shared/build.mjs']);
 const web=claim(r,'shared/web-build.mjs',pins.builders['shared/web-build.mjs']);
 const sourceNames=sourceRecord(build.toString());
 const source=web.toString();
 assert(source.includes('if(pendingBytes+bytes>192*1024)await flushScripts(target);'));
 assert(source.includes("minify(body,{module:true,compress:false,mangle:false,format:{comments:false}})"));
 const files=sourceNames.map(name=>{const raw=read(r,name);return {name,code:raw.toString('utf8').replace(/\r\n/g,'\n'),raw}});
 assert.equal(blob(files[0].raw),pins.renderer[mode]);
 entries.push(files);
 const require=createRequire(path.join(r,'package.json'));
 const terserPkg=require.resolve('terser/package.json');
 const {version}=JSON.parse(fs.readFileSync(terserPkg));
 const lock=read(r,'package-lock.json'),lockData=JSON.parse(lock);
 assert.equal(lockData.packages['node_modules/terser'].version,version);
 const {minify}=require('terser');
 const {orderedScriptSource}=await import(pathToFileURL(path.join(r,'shared/web-build.mjs')));
 const all=[];let pending=[],size=0;
 for(const f of files){
  const bytes=Buffer.byteLength(f.code);
  if(size+bytes>192*1024&&pending.length){all.push({size,files:pending});pending=[];size=0;}
  pending.push(f);size+=bytes;
 }
 if(pending.length)all.push({size,files:pending});
 assert.deepEqual(all.map(x=>x.files.length),pins.groupSizes[mode]);assert.equal(all.length,3);
 const loader='../runtime/'+path.basename(pins.loader.path);
 claim(r,pins.loader.path,pins.loader.sha256);
 const loaderImport='./'+path.basename(pins.loader.path);
 const artifact=pins[mode];
 const row=receipt[mode];
 row.lockSHA256=sha(lock);row.terserVersion=version;row.rawSources=Object.fromEntries(files.map(f=>[f.name,sha(f.raw)]));
 row.chunks=[];
 for(let i=0;i<all.length;i++){
  const {size,files:members}=all[i],expected=artifact.chunks[i];
  const body=orderedScriptSource(members,loaderImport);
  const recomposed=Buffer.from((await minify(body,{module:true,compress:false,mangle:false,format:{comments:false}})).code+'\n');
  const actual=claim(r,expected.path,expected.sha256);
  assert.equal(actual.length,expected.bytes);
  assert(recomposed.equals(actual),'source-built chunk differs '+expected.path);
  row.chunks.push({path:expected.path,sha256:expected.sha256,signedRawBytes:size,members:members.map(x=>x.name),exact:true});
 }
 const e=claim(r,artifact.entry.path,artifact.entry.sha256);
 assert.equal(e.length,artifact.entry.bytes);
 let neutral=e.toString('utf8');
 for(let i=0;i<artifact.chunks.length;i++){
  const importURL='../runtime/'+path.basename(artifact.chunks[i].path);
  const literal='new URL('+JSON.stringify(importURL)+',import.meta.url).href';
  assert.equal(neutral.split(literal).length,2,'exactly one ordered bootstrap module token '+importURL);
  const at=neutral.indexOf(literal);
  const begin=neutral.indexOf('const modules=['),end=neutral.indexOf('].filter(',begin);
  // Replacements must stay inside the existing common runtime import array.
  assert(begin>=0&&at>begin&&at<end,importURL);
  neutral=neutral.replace(literal,'new URL("EXACT-ORDERED-SLOT-'+(15+i)+'",import.meta.url).href');
 }
 normalizedEntries.push(Buffer.from(neutral));row.entryNormalized=sha(normalizedEntries.at(-1));row.entry=artifact.entry;
 const html=claim(r,'HONRO.html',artifact.htmlSHA256).toString('utf8');
 assert.equal(html.split(artifact.entry.path).length,2);
 normalizedShells.push(Buffer.from(html.replace(artifact.entry.path,'EXACT-GAME-ENTRY-URL')));
 row.normalizedHTML=sha(normalizedShells.at(-1));
 assert(loader.includes('/load-data.'));
}
assert.equal(receipt.stock.lockSHA256,receipt.target.lockSHA256);
assert.equal(receipt.stock.terserVersion,receipt.target.terserVersion);
assert.equal(receipt.stock.entryNormalized,receipt.target.entryNormalized);
assert.equal(receipt.stock.normalizedHTML,receipt.target.normalizedHTML);
assert(normalizedEntries[0].equals(normalizedEntries[1]));assert(normalizedShells[0].equals(normalizedShells[1]));
assert.equal(entries[0][0].name,pins.renderer.path);
for(let i=1;i<entries[0].length;i++){
 const a=entries[0][i],b=entries[1][i];
 assert.equal(a.name,b.name);assert(a.raw.equals(b.raw),a.name);
}
assert.equal(Object.keys(receipt.stock.rawSources).length,42);
fs.writeFileSync(path.join(out,'recomposition-receipt.json'),JSON.stringify(receipt,null,2)+'\n');
console.log('Exact 42 source entries with only renderer changed; strict A/B normal chunk regen 15/16/17; three ordered entry URL-only substitutions, no camera started by this gate.');
