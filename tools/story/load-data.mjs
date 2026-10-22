import {readFile} from 'node:fs/promises';
import path from 'node:path';
// Content-only tools share the production catalogue; they do not parse JS prose.
export async function loadNarrativeData(context,root=process.cwd()){
 for(const [key,file]of [['HONRO_NARRATIVE_CATALOGUE','narrative-current.json'],['HONRO_NARRATIVE_COMPAT','narrative-compat-v1.json'],['HONRO_STAGE_CONTRACTS','stage-contracts.json']])context[key]=JSON.parse(await readFile(path.join(root,'shared/data',file),'utf8'));
 return context;
}
