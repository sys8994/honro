import {readFile,realpath} from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';

export const officialAct6=Object.freeze({
 schema:'honro-act6-release/v1', revision:'act6-reunion-v1', origin:'https://sys8994.github.io', basePath:'/honro/'
});
// Only the versioned repository file opts into production. Browser queries
// and player saves never enable the campaign, pick a host or set a save prefix.
export async function readAct6Release(root){
 const raw=await readFile(path.join(root,'shared/act6-release.json'),'utf8').catch(e=>{if(e.code!=='ENOENT')throw e;return null;});
 if(raw===null)return null;
 const x=JSON.parse(raw),expected=Object.keys(officialAct6).sort();
 assert.deepEqual(Object.keys(x).sort(),expected,'Act6 build release metadata has an unexpected field');
 for(const k of expected)assert.equal(x[k],officialAct6[k],'Unexpected Act6 publish '+k);
 return Object.freeze({...x,checkout:await realpath(root)});
}
export function releaseBuildFlags(root){
 return {
   HONRO_ACT6_QA_WEB_BUILD:'1',HONRO_ACT6_QA_WEB_ROOT:root,HONRO_ACT6_QA_NORMAL51:'1',
   HONRO_ACT6_QA_NORMAL_FAR:'1',HONRO_ACT6_QA_NORMAL_FINAL_FAR:'1',HONRO_ACT6_QA_NORMAL_LATE_FAR:'1',
   HONRO_ACT6_QA_NORMAL_LATE_WITNESS:process.env.HONRO_ACT6_QA_NORMAL_LATE_WITNESS??'0',HONRO_ACT6_QA_NORMAL_ENDING_STOCK:'1',HONRO_ACT6_QA_NORMAL_BOUNDARY:'1',HONRO_ACT6_QA_PAGES_SHAPE:'1'
 };
}
