/** All production build entry points share this boundary. Preview is isolated.
 * Protected CI/Pages configuration is additionally required against direct pushes.
 */
import {spawnSync} from 'node:child_process';
import {mkdir,realpath,lstat} from 'node:fs/promises';
import path from 'node:path';
export function assertProductionReady(root){
 const result=spawnSync('python3',[path.join(root,'tools/quality-gate/gate.py'),'--root',root,'--criteria-version','v4','--stages','31,32,33,34,35,36,37,38,39,40','--out','_local/quality-gate/production-report.json'],{cwd:root,encoding:'utf8'});
 if(result.status!==0)throw Error('Production quality gate BLOCKED. Missing, failed or unmeasured criteria cannot ship. See _local/quality-gate/production-report.json. '+(result.stderr||'').slice(-1500));
 const report=JSON.parse(result.stdout);if(report.releaseAllowed!==true||report.criteriaVersion!=='v4')throw Error('Quality gate did not authorize this candidate');
 return report;
}
export async function buildOutputRoot(root,preview){
 if(preview===undefined||preview===null){assertProductionReady(root);return root;}
 if(typeof preview!=='string'||! /^[a-z0-9][a-z0-9-]{0,63}$/.test(preview))throw Error('Preview needs a safe isolated name');
 const base=path.join(root,'_local','previews'),output=path.join(base,preview);
 await mkdir(output,{recursive:true});const actual=await realpath(output),realRoot=await realpath(root);
 if(!actual.startsWith(path.join(realRoot,'_local','previews')+path.sep))throw Error('Preview path escapes isolated directory');
 return actual;
}
