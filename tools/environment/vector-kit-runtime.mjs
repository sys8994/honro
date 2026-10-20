/** Build plain runtime code from the same authored module sources. No copied path registry. */
import {readFile} from 'node:fs/promises';
export async function vectorKitRuntime(){
 const sources=['shared/assets/environment/vector-kit/registry.mjs','shared/assets/environment/vector-kit/compositions.mjs','shared/assets/environment/vector-kit/campaign.mjs','shared/runtime/environment-vector-kit.mjs'];
 const body=[];for(const path of sources){const text=await readFile(new URL('../../'+path,import.meta.url),'utf8');body.push('// '+path+'\n'+text.replace(/^import .*;\s*$/gm,'').replace(/^export \{[^}]*\};?\s*$/gm,'').replace(/^export /gm,''));}
 return '(function(G){\n'+body.join('\n')+'\nG.HonroEnvironmentVectorKit={ASSETS,MATERIALS,PALETTES,HUMAN_H,COMPOSITIONS,STAGE_STYLES,REGISTRY_VERSION,compileScene,drawCanvas,paintFor,svgScene};\n})(globalThis);';
}
