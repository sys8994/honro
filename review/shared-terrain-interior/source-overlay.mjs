import {readFile,writeFile,mkdir} from 'node:fs/promises';import vm from 'node:vm';
const root=new URL('../../',import.meta.url).pathname;const {vectorKitRuntime}=await import(root+'tools/environment/vector-kit-runtime.mjs');
const manifest=JSON.parse(await readFile(root+'web/manifest.json','utf8')),replacements={'shared/environment-vector-kit':await vectorKitRuntime(),'shared/runtime/vector-campaign-art.js':await readFile(root+'shared/runtime/vector-campaign-art.js','utf8')};
const out='/tmp/honro-terrain-overlay';await mkdir(out,{recursive:true});const patches={};
for(const file of manifest.common){let body=await readFile(root+file,'utf8'),changed=false;for(const [name,source]of Object.entries(replacements)){
 const marker='// '+name+'\n',start=body.indexOf(marker);if(start<0)continue;const end=body.indexOf('await yieldIfNeeded();\n',start)+'await yieldIfNeeded();\n'.length;if(end<start)throw Error('Missing runtime entry end');
 new vm.Script('(()=>{\n'+source+'\n})();');body=body.slice(0,start)+marker+'(()=>{\n\'use strict\';\n'+source+'\n})();\nawait yieldIfNeeded();\n'+body.slice(end);changed=true;
 }if(changed){const target=out+'/'+file.split('/').at(-1);await writeFile(target,body);patches[file]=target;}}
if(Object.keys(patches).length!==2)throw Error('Expected exactly two runtime overlays');await writeFile(out+'/manifest.json',JSON.stringify(patches));console.log('Prepared source-only overlays; committed web bundles unchanged.');
