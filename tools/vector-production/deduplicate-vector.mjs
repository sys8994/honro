/** Optional exact-subtree storage dedup. Requires the internal-symbol renderer. */
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import vm from 'node:vm';
const runtime=vm.createContext({});vm.runInContext(readFileSync(new URL('../../shared/map/vector-art.js',import.meta.url),'utf8'),runtime);
const validate=v=>Array.from(runtime.HonroVectorArt.validate(v)),bytes=v=>Buffer.byteLength(JSON.stringify(v));
export function deduplicateVector(input,{minimumBytes=256}={}){
 const errors=validate(input);if(errors.length)throw Error('Invalid input vector: '+errors.join('; '));
 const vector=structuredClone(input),beforeBytes=bytes(vector),report={beforeBytes,afterBytes:beforeBytes,symbols:0,uses:0,applied:false};
 if(Object.keys(vector.symbols||{}).length)return{vector,report:{...report,reason:'Already symbolized; unchanged'}};
 const entries=new Map(),hashes=new WeakMap();
 const visit=node=>{const fields={};for(const key of Object.keys(node).sort())fields[key]=key==='children'?node.children.map(visit):node[key];const key=createHash('sha256').update(JSON.stringify(fields)).digest('hex');hashes.set(node,key);const entry=entries.get(key);if(entry)entry.count++;else entries.set(key,{node,count:1,size:bytes(node)});return key;};visit(vector.root);
 const symbols=Object.create(null),names=new Map();
 const rewrite=node=>{const hash=hashes.get(node),entry=entries.get(hash);if(entry.count>1&&entry.size>=minimumBytes&&entry.size*(entry.count-1)>entry.count*70+60){let id=names.get(hash);if(!id){id='v-'+hash;names.set(hash,id);symbols[id]=structuredClone(entry.node);}report.uses++;return{tag:'use',symbol:id};}return node.tag==='g'?{...node,children:node.children.map(rewrite)}:node;};
 vector.root=rewrite(vector.root);if(names.size)vector.symbols=symbols;
 const finalErrors=validate(vector);if(finalErrors.length)return{vector:structuredClone(input),report:{...report,uses:0,reason:'Expanded budgets or validation prevent deduplication',errors:finalErrors}};
 const afterBytes=bytes(vector);if(afterBytes>=beforeBytes)return{vector:structuredClone(input),report:{...report,uses:0,reason:'No serialized saving'}};
 return{vector,report:{...report,afterBytes,symbols:names.size,applied:true,savedBytes:beforeBytes-afterBytes}};
}
export function deduplicateAsset(input,options){const asset=structuredClone(input);if(!asset.vector)return{asset,report:{applied:false,reason:'No vector'}};const{vector,report}=deduplicateVector(asset.vector,options);asset.vector=vector;return{asset,report};}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const args=process.argv.slice(2),[source,destination]=args;const idsIndex=args.indexOf('--asset-ids'),selected=idsIndex>=0?new Set((args[idsIndex+1]||'').split(',').filter(Boolean)):null;if(!source||!destination)throw Error('Usage: node deduplicate-vector.mjs input-asset-or-project.json output.json');const input=JSON.parse(readFileSync(source));let output,reports;
 if(input.library){if(!selected?.size)throw Error('Project dedup requires explicit --asset-ids id1,id2; historical assets are never rewritten automatically');for(const id of selected)if(!input.library.some(a=>a.id===id))throw Error('Missing selected asset '+id);output=structuredClone(input);reports=[];output.library=output.library.map(a=>{if(!selected.has(a.id))return a;const result=deduplicateAsset(a);if(a.vector)reports.push({id:a.id,...result.report});return result.asset;});}
 else if(input.vector){const result=deduplicateAsset(input);output=result.asset;reports=[result.report];}
 else{const result=deduplicateVector(input);output=result.vector;reports=[result.report];}
 writeFileSync(destination,JSON.stringify(output)+'\n');console.log(JSON.stringify({beforeBytes:bytes(input),afterBytes:bytes(output),reports}));}
