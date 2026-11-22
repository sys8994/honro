import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
const W=path.resolve(process.argv[2]),D=path.dirname(fileURLToPath(import.meta.url)),P=JSON.parse(fs.readFileSync(process.argv[3])),base=JSON.parse(fs.readFileSync(path.join(D,'PINS.json')));
assert(W.startsWith('/tmp/')&&P.enabled===true,'DISABLED: exact root-local authorization required');
assert.deepEqual({...P,enabled:false},base,'only the local enable flag may vary');
const O=JSON.parse(fs.readFileSync(path.join(W,'out/GRAPH-PRE.json')));
const minify=createRequire(path.resolve(process.argv[4], 'package.json'))('terser').minify, code=(arm,p)=>fs.readFileSync(path.join(W,arm.toUpperCase(),p),'utf8');
const ms=x=>minify(x,{module:true,compress:false,mangle:false,format:{comments:false}});
const pre=/^import\{yieldIfNeeded\}from"\.\/load-data\.[a-f0-9]{16}\.js";/;
const ordered=(x,f)=>new RegExp('^web/runtime/ordered-'+f+'-[0-9]+\\.[a-f0-9]{16}\\.js$').test(x);
const A=O.a.manifest,B=O.b.manifest,pairs=new Map(),ops=[];
const ad=(x,y)=>{if(x!==y){
 for(const [arm,k] of [['a',x],['b',y]]){
  const m=/\.([a-f0-9]{16})\.(?:js|html)$/.exec(k);
  assert(m&&O[arm].active[k]?.sha256.slice(0,16)===m[1],'changed active content address not independently verified '+k);
 }
 assert(!pairs.has(x)||pairs.get(x)===y);pairs.set(x,y)
}};
for(const [key,kind]of [['common','common'],['gameOnly','game']]){
 assert.equal(A[key].length,B[key].length,'normal build changed ordered module count');
 A[key].forEach((x,i)=>{const y=B[key][i];if(x!==y){
  assert(ordered(x,kind)&&ordered(y,kind)&&x.split('.')[0]===y.split('.')[0],'unqualified ordered chunk relocation');
  ad(x,y);
 }});
 const loc=(arm,m)=>m[key].filter(x=>ordered(x,kind)).map(x=>{const z=code(arm,x);assert(pre.test(z)&&z.endsWith('\n'),'wrong stock compiler wrapper');return z.replace(pre,'').slice(0,-1);}).join('');
 let old=loc('a',A),now=loc('b',B);
 for(const fn of Object.keys(P.source)){
  const oe=await ms('(()=>{\n\'use strict\';\n'+code('a',P.source[fn].path)+'\n})();\nawait yieldIfNeeded();');
  const ne=await ms('(()=>{\n\'use strict\';\n'+code('b',P.source[fn].path)+'\n})();\nawait yieldIfNeeded();');
  if(!old.includes(oe.code))continue;
  assert.equal(old.split(oe.code).length,2,'not unique exact stock wrapped statement '+fn);
  assert.equal(now.split(ne.code).length,2,'not unique exact candidate wrapped statement '+fn);
  assert(oe.code!==ne.code&&ne.code.endsWith('await yieldIfNeeded();'),'unexpected source shape');
  old=old.replace(oe.code,ne.code);ops.push({file:fn,orderedFamily:kind,oldBytes:Buffer.byteLength(oe.code),newBytes:Buffer.byteLength(ne.code)});
 }
 assert.equal(old,now,'ordered runtime bytes differ beyond exact two independently minified source modules '+kind);
}
assert.deepEqual(ops.map(v=>v.file).sort(),Object.keys(P.source).sort());
for(const k of ['gameEntry','workshopEntry','game','workshop'])if(typeof A[k]==='string'&&typeof B[k]==='string')ad(A[k],B[k]);
// Native web-build bootstrap writes this literal only in the workshop JS, and
// manifest.playtest records the same full browser URL. Query is not a physical file.
const playtestPath=(arm,m)=>{
 const hit=/^(web\/entries\/game\.([a-f0-9]{16})\.html)\?embedded=1$/.exec(m.playtest);
 assert(hit&&O[arm].active[hit[1]]?.sha256.slice(0,16)===hit[2],'noncanonical playtest document route '+arm);
 return hit[1];
};
const playtestA=playtestPath('a',A),playtestB=playtestPath('b',B);
ad(playtestA,playtestB);
if (A.playtest!==B.playtest)assert(A.workshopEntry!==B.workshopEntry,'playtest changed without workshop consumer');
const workshopPlaytestLine=u=>';globalThis.HONRO_PROJECT_MODE="full";globalThis.HONRO_PLAYTEST_URL='+JSON.stringify(u)+';const modules=';
const exactWorkshopPlaytest=(old,next)=>{
 const from=workshopPlaytestLine(A.playtest),to=workshopPlaytestLine(B.playtest);
 const occurrences=s=>s.split('globalThis.HONRO_PLAYTEST_URL').length-1;
 assert.equal(occurrences(old),1,'stock workshop playtest marker not unique');
 assert.equal(occurrences(next),1,'candidate workshop playtest marker not unique');
 assert.equal(old.split(from).length,2,'stock workshop does not consume exact manifest playtest URL');
 assert.equal(next.split(to).length,2,'candidate workshop does not consume exact manifest playtest URL');
 return old.replace(from,to);
};
const pathNorm=s=>{for(const [a,b] of pairs){s=s.replaceAll(a,b).replaceAll(path.basename(a),path.basename(b))};return s;};
const firstNorm=s=>{for(const [a,b] of pairs){if(!a.startsWith('web/runtime/'))continue;s=s.replaceAll(a,b).replaceAll(path.basename(a),path.basename(b));}return s;};
for(const [k,l] of pairs)if(k.startsWith('web/entries/')&&k.endsWith('.js')){
 const old=firstNorm(code('a',k)), next=code('b',l);
 const isWorkshop=k===A.workshopEntry&&l===B.workshopEntry;
 assert.equal(isWorkshop?exactWorkshopPlaytest(old,next):old,next,'entry changed beyond exact ordered pointers and workshop playtest literal');
}
for(const [k,l] of pairs)if(k.startsWith('web/entries/')&&k.endsWith('.html'))assert.equal(pathNorm(code('a',k)),code('b',l),'entry HTML shell changed beyond pointers');
for(const z of ['HONRO.html','index.html','HONRO_WORKSHOP.html'])assert.equal(pathNorm(code('a',z)),code('b',z),'stable visible shell nonaddress drift '+z);
assert.deepEqual([...pairs.keys()].sort(),[...O.aonly].sort(),'unexpected retired active alias');
assert.deepEqual([...pairs.values()].sort(),[...O.bonly].sort(),'unexpected new active alias');
const copy=m=>Object.fromEntries(Object.entries(m).filter(([k])=>!['files','previousFiles','previousGenerations','publishedGenerations','publishedRetention'].includes(k)));
const mapDeep=x=>typeof x==='string'?pairs.get(x)??x:Array.isArray(x)?x.map(mapDeep):x&&typeof x==='object'?Object.fromEntries(Object.entries(x).map(([k,v])=>[k,mapDeep(v)])):x;
const old=copy(A),next=copy(B);
delete old.playtest;delete next.playtest; // Independently mapped from its validated exact root field above.
assert.deepEqual(mapDeep(old),next,'other manifest control or reference changed');
fs.writeFileSync(path.join(W,'out/ORDERED.json'),JSON.stringify({status:'PASS_ONLY_TWO_SIGNED_SOURCE_MODULES_AND_POINTERS',ops,addressPairs:Object.fromEntries(pairs),workshopShell:{a:O.a.workshopShell,b:O.b.workshopShell},workshopPlaytest:{oldUrl:A.playtest,newUrl:B.playtest,oldDocument:playtestA,newDocument:playtestB},retainedFilesScope:'not asked to write/publish in disposable B'},null,2)+'\n');
