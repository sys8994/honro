/** Only join the source's left edge to existing world terrain; no path edits. */
import {readFile,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
export function applyStage29LeftBlend(asset){
 if(asset.id!=='act3-handoff:29:west-bank')throw Error('Stage 29 west bank only');
 if(JSON.stringify(asset.params.edgeFade?.[1])!=='[3770,4150]')throw Error('Right fade baseline changed');
 return {...asset,params:{...asset.params,edgeFade:[[0,170],asset.params.edgeFade[1]]}};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const file=new URL('../../shared/assets/environment/act3-handoff/stage29-west-bank.json',import.meta.url),asset=JSON.parse(await readFile(file,'utf8'));await writeFile(file,JSON.stringify(applyStage29LeftBlend(asset))+'\n');}
