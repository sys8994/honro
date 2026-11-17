import {readFile,writeFile} from 'node:fs/promises';
import vm from 'node:vm';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const dir=path.dirname(fileURLToPath(import.meta.url)),repo=process.env.HONRO_REPOSITORY?path.resolve(process.env.HONRO_REPOSITORY):path.resolve(dir,'../../..');
const g={};vm.runInNewContext(await readFile(path.join(repo,'shared/map/vector-art.js'),'utf8'),g);
const report={renderer:'shared/map/vector-art.js',criteriaUnmodified:true,assets:{}};
for(const kind of ['original','candidate']){const a=JSON.parse(await readFile(path.join(dir,'generated',kind+'.json'),'utf8'));const errors=g.HonroVectorArt.validate(a.vector);if(errors.length)throw Error(kind+': '+errors.join('; '));let nodes=0,paths=0,maxDepth=0;function walk(n,depth=0){nodes++;maxDepth=Math.max(depth,maxDepth);if(n.tag==='path')paths++;else if(n.tag==='use')walk(a.vector.symbols[n.symbol],depth+1);else n.children.forEach(c=>walk(c,depth+1));}walk(a.vector.root);report.assets[kind]={errors,expandedNodes:nodes,paths,maxDepth};}
await writeFile(path.join(dir,'generated/runtime-validation.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
