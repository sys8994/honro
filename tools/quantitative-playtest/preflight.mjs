/** Actual App-created cohort. No battle advance, HP/pose changes or damage experiment. */
import {writeFile,mkdir} from 'node:fs/promises';
import {dirname} from 'node:path';
import {execFileSync} from 'node:child_process';
import {adapter} from './adapter.mjs';
import {controllerHash} from './freeze.mjs';
const [stage='31',output='_local/reports/app-cohort-preflight.json']=process.argv.slice(2),a=await adapter(Number(stage)),b=a.app.engine.b;
const keys=['id','cls','side','h','r','role','armor','attack','existenceDefense','ranks','equipmentIds','equipmentState','hp','maxHp','focus','maxFocus','level','loadout','honroPilotRole','honroVariant','honroType','honroPilotMidboss','honroMidboss','boss','honroPilotBudgetBasis'];
const data={kind:'actual-App-created-cohort-preflight',sourceCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),controllerHash:await controllerHash(),stage:Number(stage),entryBuild:a.entryBuild,scope:a.scope,officialIdentity:a.officialIdentity,mode:b.mode,difficulty:b.difficulty,training:!!a.app.training,customMap:!!a.app.customMap,honroCustom:!!b.honroCustom,units:b.units.map(u=>Object.fromEntries(keys.map(k=>[k,u[k]])))};
await mkdir(dirname(output),{recursive:true});await writeFile(output,JSON.stringify(data,null,2));console.log(JSON.stringify({output,units:data.units.length,heroes:data.units.filter(u=>u.side===0).map(u=>({id:u.id,hp:u.hp,attack:u.attack,armor:u.armor,existenceDefense:u.existenceDefense}))}));
