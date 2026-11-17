/** Stage 21 composition repair only. The traced source is finite, not missing
 * bounds. Reuse the production handoff compositor's fades instead of stretching
 * paths or changing the canonical support/contact contour. Neighboring handoff
 * assets already opt into this compositor. Units below are world coordinates. */
import {readFile,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
export function applyStage21HandoffBlend(asset){
 if(asset.id!=='act3-handoff:21:bedrock')throw Error('Stage 21 bedrock only');
 return {...asset,params:{...asset.params,blendFace:true,edgeFade:[[0,170],[6150,6400]]}};
}
export async function regenerateStage21HandoffBlend(){
 const file=new URL('../../shared/assets/environment/act3-handoff/stage21-bedrock.json',import.meta.url);
 const a=JSON.parse(await readFile(file,'utf8'));
 await writeFile(file,JSON.stringify(applyStage21HandoffBlend(a))+'\n');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await regenerateStage21HandoffBlend();
