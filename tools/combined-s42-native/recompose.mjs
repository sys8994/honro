/* QA only: reconstruct exact normal build owners with locked builders and Terser. */
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath,pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
const H=path.dirname(fileURLToPath(import.meta.url));
const pin=JSON.parse(fs.readFileSync(path.join(H,'PINS.json')));
const h=JSON.parse(fs.readFileSync(path.join(H,'STAGE42-BOUNDS-HUNK.json')));
const cmp=pin.compiler;
const [A,B,C,out]=process.argv.slice(2).map(x=>path.resolve(x));
assert(out);
const sha=b=>createHash('sha256').update(b).digest('hex');
const blob=b=>createHash('sha1').update('blob '+b.length+'\0').update(b).digest('hex');
const read=(r,p)=>fs.readFileSync(path.join(r,p));
function one(a,what){assert.equal(a.length,1,what);return a[0];}
const regexEscape=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
function list(owner){
 const m=one([...owner.matchAll(/for\(const name of (\['renderer'[^\]]+\])\)await file\(`shared\/runtime\/\$\{name\}\.js`\);/g)],'renderer segment');
 assert(owner.slice(m.index).startsWith(m[0]+"\n    if(act3TerrainPreview||act3TerrainStages.length)await file('shared/runtime/act3-handoff-art.js');\n  }\n  if(render){\n    const timeline="));
 const names=[...JSON.parse(m[1].replaceAll("'",'"')),'act3-handoff-art'].map(n=>'shared/runtime/'+n+'.js');
 assert.equal(names.length,42); assert.equal(new Set(names).size,42);
 const start=owner.indexOf("    data('HONRO_TIMELINE',timeline);");
 const end=owner.indexOf("    data('HONRO_SKILL_AUDIO',await skillAudioData());",start);
 assert(start>m.index&&end>start);
 const seg=owner.slice(start,end);
 const edge=[...seg.matchAll(/await file\('(shared\/runtime\/[a-z0-9-]+\.js)'\);/g)].map(x=>x[1]);
 assert.deepEqual(edge,['shared/runtime/authored-far-art.js','shared/runtime/act5-art.js','shared/runtime/act5-edge-art.js']);
 return [names,edge];
}
// Preserve actual build outputs before the compiled owner/DAG/historical checks.
// This receipt is diagnostic only; the browser/strict hash gates below remain.
const diagnosticDir=path.join(path.dirname(out),'actual-stage42-packets');
fs.mkdirSync(diagnosticDir,{recursive:true});
const diag={};
for(const [mode,r] of [['A',A],['B',B],['C',C]]){
 try{
  const web=JSON.parse(read(r,'web/manifest.json'));
  const campaign=web.project;
  assert(/^web\/data\/campaign\.[a-f0-9]{16}\.json$/.test(campaign));
  const manifestRaw=read(r,campaign);
  const m=JSON.parse(manifestRaw);
  assert.equal(m.stageLibraries.length,50);assert.equal(m.catalog[41].id,'stage-42');
  const packet=m.stageLibraries[41],stagePath=m.stages[41];
  assert(/^web\/data\/chapter-42-assets\.[a-f0-9]{16}\.json$/.test(packet));
  assert(/^web\/data\/chapter-42\.[a-f0-9]{16}\.json$/.test(stagePath));
  const b=read(r,packet),stage=read(r,stagePath);
  fs.writeFileSync(path.join(diagnosticDir,mode+'-raw-asset-packet.json'),b);
  fs.writeFileSync(path.join(diagnosticDir,mode+'-raw-stage.json'),stage);
  const enc=m.assetEncodings.stageLibraries[41];
  diag[mode]={campaign,packet,stagePath,encoding:enc,packetSHA256:sha(b),packetB:b.length,stageSHA256:sha(stage)};
  const codec='shared/json-pool.mjs';assert.equal(blob(read(r,codec)),cmp.builders[codec]);
  const {unpackJson}=await import(pathToFileURL(path.join(r,codec)));
  const q=JSON.parse(b);
  assert(['json','json-pool-v1'].includes(enc));
  const assets=enc==='json-pool-v1'?unpackJson(q):q;
  assert(Array.isArray(assets));
  const owner=one(assets.filter(x=>x.id==='act5:near:42'),mode+' unique compiled Stage42 owner');
  const jsonBytes=x=>Buffer.from(JSON.stringify(x)??'null');
  const ownerBytes=jsonBytes(owner);
  fs.writeFileSync(path.join(diagnosticDir,mode+'-decoded-near-owner.json'),ownerBytes);
  const shaProps=Object.fromEntries(['edgeWall','edgeSurface','vector'].map(k=>[k,sha(jsonBytes(owner[k]))]));
  const s42=JSON.parse(stage);
  const placements=(s42.elements??[]).filter(x=>JSON.stringify(x).includes('act5:near:42'));
  Object.assign(diag[mode],{ownerSHA256:sha(ownerBytes),ownerB:ownerBytes.length,assetIds:assets.map(x=>x.id),shaProps,placements});
 }catch(ex){diag[mode]={...diag[mode],diagnosticError:String(ex)};}
 fs.writeFileSync(path.join(diagnosticDir,'actual-packet-owner-receipt.json'),JSON.stringify(diag,null,2)+'\n');
}
const receipt={base:pin.base,tree:pin.tree,renderer:pin.renderer,lockedBuilders:cmp.builders,arms:{}};
const rawSources={};
for(const [mode,r] of [['A',A],['B',B],['C',C]]){
 const own=read(r,'shared/build.mjs'),build=read(r,'shared/web-build.mjs');
 for(const [p,want] of Object.entries(cmp.builders))assert.equal(blob(read(r,p)),want,p);
 const web=build.toString();
 assert(web.includes('if(pendingBytes+bytes>192*1024)await flushScripts(target);'));
 assert(web.includes("minify(body,{module:true,compress:false,mangle:false,format:{comments:false}})"));
 const loader=cmp.loader.path;const L=read(r,loader);assert.equal(sha(L),cmp.loader.sha256);assert.equal(L.length,cmp.loader.bytes);
 const manifestPath='web/manifest.json';const manifest=JSON.parse(read(r,manifestPath));
 const html=read(r,'HONRO.html').toString();
 const entry=one([...html.matchAll(/web\/entries\/game\.[a-f0-9]{16}\.js/g)].map(x=>x[0]),mode+' game entry');
 assert.equal(manifest.gameEntry,entry);
 const e=read(r,entry).toString();
 const begin=e.indexOf('const modules=['),end=e.indexOf('].filter(',begin);
 assert(begin>=0&&end>begin,'active module array');
 const require=createRequire(path.join(r,'package.json'));
 const pkg=require.resolve('terser/package.json');
 const ver=JSON.parse(fs.readFileSync(pkg)).version;
 const lock=JSON.parse(read(r,'package-lock.json'));assert.equal(ver,lock.packages['node_modules/terser'].version);
 const {minify}=require('terser');
 const {orderedScriptSource}=await import(pathToFileURL(path.join(r,'shared/web-build.mjs')));
 const blocks=list(own.toString());
 const rows=[];const src={};let number=15;
 for(const nms of blocks){
  let p=[],bytes=0;
  const grouped=[];
  for(const name of nms){
   const raw=read(r,name);const code=raw.toString('utf8').replace(/\r\n/g,'\n');const n=Buffer.byteLength(code);
   assert(!(name in src));src[name]={blob:blob(raw),sha256:sha(raw)}; if(!rawSources[mode])rawSources[mode]={};rawSources[mode][name]=raw;
   if(p.length&&bytes+n>192*1024){grouped.push({files:p,bytes});p=[];bytes=0;}
   p.push({name,code});bytes+=n;
  }
  if(p.length)grouped.push({files:p,bytes});
  assert.deepEqual(grouped.map(x=>x.files.length),nms===blocks[0]?cmp.rendererGroupSizes:[3]);
  for(const group of grouped){
   const joined=orderedScriptSource(group.files,'./'+path.basename(loader));
   const baked=Buffer.from((await minify(joined,{module:true,compress:false,mangle:false,format:{comments:false}})).code+'\n');
   const digest=sha(baked);const file='web/runtime/ordered-common-'+number+'.'+digest.slice(0,16)+'.js';
   const actual=one(manifest.common.filter(x=>new RegExp('^web/runtime/ordered-common-'+number+'\\.[a-f0-9]{16}\\.js$').test(x)),mode+' common ordinal '+number);
   assert.equal(file,actual,mode+' content-address from canonical source replay');
   assert(read(r,actual).equals(baked),mode+' complete minified owner bytes');
   const token=JSON.stringify('../runtime/'+path.basename(file));
   assert.equal([...e.slice(begin,end).matchAll(new RegExp(regexEscape(token),'g'))].length,1,'one native boot reference '+file);
   if(number<=17)assert.deepEqual({path:file,sha256:digest,bytes:baked.length},cmp.rendererChunks[number-15]);
   if(number===18&&mode==='A')assert.deepEqual({path:file,sha256:digest,bytes:baked.length},cmp.stockEdgeChunk);
   rows.push({number,path:file,sha256:digest,bytes:baked.length,members:group.files.map(x=>x.name),sourceBytes:group.bytes});
   number++;
  }
 }
 assert.equal(number,19);
 const renderer='shared/runtime/renderer.js',edge='shared/runtime/act5-edge-art.js';
 assert.equal(src[renderer].blob,pin.renderer);
 assert.equal(src[edge].blob,mode==='A'?h.master:h.expectedDerived);
 receipt.arms[mode]={entry,terser:ver,source:src,chunks:rows,sourceModules:{[renderer]:rows[0].path,[edge]:rows[3].path}};
}
const E='shared/runtime/act5-edge-art.js',a=rawSources.A,b=rawSources.B,c=rawSources.C;
assert.deepEqual(Object.keys(a),Object.keys(b));assert.deepEqual(Object.keys(b),Object.keys(c));
for(const [k,value] of Object.entries(a)){
 assert(b[k].equals(c[k]),'B/C runtime source delta '+k);
 if(k!==E)assert(value.equals(b[k]),'unexpected runtime source delta '+k);
 else {
  const old=value.toString();assert.equal(old.split(h.replaceExactlyOnce).length,2);
  assert(Buffer.from(old.replace(h.replaceExactlyOnce,h.with)).equals(b[k]));
  assert.equal(blob(b[k]),h.expectedDerived);
 }
}
const bs=receipt.arms;assert.equal(bs.A.terser,bs.B.terser);assert.equal(bs.B.terser,bs.C.terser);
assert.notEqual(bs.A.chunks[3].path,bs.B.chunks[3].path);
assert.deepEqual(bs.B.chunks,bs.C.chunks);
receipt.exactOneStage42SourceHunk=true;
fs.writeFileSync(out,JSON.stringify(receipt,null,2)+'\n');
console.log('Normal locked Terser bytes: 42 renderer-family sources + 3 Act5 sources; only exact Stage42 Act5 edge hunk differs in group 18.');
