/** Bounded native Canvas catalog check; not gameplay QA. Build catalog first. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createCanvas,Path2D,DOMMatrix} from '@napi-rs/canvas';
import {catalogImageGlobals,catalogProject} from '../tools/character-catalog/runtime-selection.mjs';
const base='_local/reports/character-catalog/',read=p=>readFileSync(p,'utf8'),hash=x=>createHash('sha256').update(x).digest('hex');
const full=read(base+'runtime.js'),selected=read(base+'selected-runtime.js'),data=JSON.parse(read(base+'inventory.json')),adapter=read('tools/character-catalog/adapter.js');
function context(source){const g=vm.createContext({console,performance,structuredClone,Path2D,DOMMatrix,devicePixelRatio:1,document:{createElement:()=>createCanvas(1,1)},navigator:{userAgent:'catalog-parity'},matchMedia:()=>({matches:false}),setTimeout,clearTimeout});g.window=g;vm.runInContext(source,g);vm.runInContext(adapter,g);return g;}
assert.equal(hash(full),data.sourceSha256,'Inventory provenance is the full source runtime');
assert.equal(hash(selected),data.catalogRuntimeSha256,'Selected runtime provenance');
const a=context(full),b=context(selected);
assert.equal(data.rows.length,72);assert.deepEqual(JSON.parse(JSON.stringify(b.HONRO_PROJECT)),catalogProject(JSON.parse(JSON.stringify(a.HONRO_PROJECT))));
// These globals may be captured by background-provider closures during initialization.
// Poison both their existing object properties AND subsequent global reads.
for(const g of [a,b])for(const name of catalogImageGlobals){const obj=g[name];for(const key of Object.keys(obj))Object.defineProperty(obj,key,{configurable:true,get(){throw Error('Unused image payload accessed: '+name+'.'+key);}});Object.defineProperty(g,name,{configurable:true,get(){throw Error('Unused image global accessed: '+name);}});}
const allowedProject=catalogProject(JSON.parse(JSON.stringify(a.HONRO_PROJECT)));
function guarded(value,label){return new Proxy(value,{get(t,k){if(typeof k==='symbol'||k in t)return typeof t[k]==='object'&&t[k]!==null?guarded(t[k],label+'.'+String(k)):t[k];throw Error('Dropped project field accessed: '+label+'.'+String(k));}});}
for(const g of [a,b])g.HONRO_PROJECT=guarded(structuredClone(allowedProject),'HONRO_PROJECT');
const before=JSON.stringify(data.rows),samples=[],canvasA=createCanvas(300,280),canvasB=createCanvas(300,280);
// Reuse only two canvases. No screenshots or giant retained image arrays.
for(const row of data.rows){for(const mode of row.layer==='현행 전용 벡터'?['scene','clip']:['scene'])for(const motion of row.clips)for(const phase of [0,.27,.68]){
 const options={mode,motion:motion.id,phase};a.HonroCatalogRenderer.draw(canvasA,row,options);b.HonroCatalogRenderer.draw(canvasB,row,options);
 const pa=canvasA.getContext('2d').getImageData(0,0,300,280).data,pb=canvasB.getContext('2d').getImageData(0,0,300,280).data;
 assert.equal(hash(pb),hash(pa),row.id+' '+JSON.stringify(options));assert(pa.some((v,i)=>i%4===3&&v>20),'Empty '+row.id);samples.push({id:row.id,...options,sha256:hash(pa)});
 }console.log('PASS',row.id);}
assert.equal(JSON.stringify(data.rows),before,'No inventory mutation');
const report={rows:data.rows.length,samples:samples.length,fullRuntimeSha256:hash(full),catalogRuntimeSha256:hash(selected),inventorySha256:hash(before),pixelParity:true,poisonAccess:true,samplesDetail:samples};
writeFileSync(base+'payload-parity.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({...report,samplesDetail:undefined}));
