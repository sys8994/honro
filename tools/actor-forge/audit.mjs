import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {actorCatalog} from './catalog.mjs';
import {runtimeParts,root} from '../../shared/build.mjs';
import path from 'node:path';
const out=path.join(root,'_local/reports/actor-forge');await mkdir(out,{recursive:true});
// Run before authoring a new pass. Never silently replace an existing immutable baseline.
const fixture=path.join(root,'tests/fixtures/actor-baseline.json');
try{await readFile(fixture);throw Error('Actor baseline already exists; use the saved reference');}catch(e){if(e.code!=='ENOENT')throw e;}
const sources={};for(const name of ['art-dark','renderer']){const from=path.join(root,`shared/runtime/${name}.js`),to=`tests/fixtures/actor-${name}-baseline.js`;await copyFile(from,path.join(root,to));sources[to]=createHash('sha256').update(await readFile(from)).digest('hex');}
const runtime=(await runtimeParts()).join('\n');
await writeFile(path.join(out,'baseline.html'),`<!doctype html><meta charset="utf-8"><body><script>${runtime}</script><script>globalThis.ActorCatalog=${JSON.stringify(actorCatalog)};globalThis.ActorBaselineSources=${JSON.stringify(sources)};</script>`);
console.log('Actor baseline renderer ready');
