/** Actual App-created cohort. No battle advance, HP/pose changes or damage experiment. */
import {writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {dirname} from 'node:path';
import {execFileSync} from 'node:child_process';
import {adapter} from './adapter.mjs';
import {controllerHash} from './freeze.mjs';
const [stage='31',output='_local/reports/app-cohort-preflight.json',...options]=process.argv.slice(2),a=await adapter(Number(stage)),b=a.app.engine.b;
const keys=['id','cls','side','h','r','role','armor','attack','existenceDefense','ranks','equipmentIds','equipmentState','hp','maxHp','focus','maxFocus','level','loadout','honroPilotRole','honroVariant','honroType','honroPilotMidboss','honroMidboss','boss','honroPilotBudgetBasis'];
const data={kind:'actual-App-created-cohort-preflight',sourceCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),controllerHash:await controllerHash(),stage:Number(stage),entryBuild:a.entryBuild,scope:a.scope,officialIdentity:a.officialIdentity,mode:b.mode,difficulty:b.difficulty,training:!!a.app.training,customMap:!!a.app.customMap,honroCustom:!!b.honroCustom,units:b.units.map(u=>Object.fromEntries(keys.map(k=>[k,u[k]])))};
await mkdir(dirname(output),{recursive:true});await writeFile(output,JSON.stringify(data,null,2));console.log(JSON.stringify({output,units:data.units.length,heroes:data.units.filter(u=>u.side===0).map(u=>({id:u.id,hp:u.hp,attack:u.attack,armor:u.armor,existenceDefense:u.existenceDefense}))}));

if(options.length){
 if(options.length!==2||options[0]!=='--export-profile')throw Error('Optional: --export-profile synthetic-prepared-stage31-entry.json');
 const path=options[1],profile=await a.exportProfile(),text=JSON.stringify(profile,null,2)+'\n';
 if(profile.settings.debugMode||!profile.honroBattle||profile.honroBattle.honroStage!==Number(stage))throw Error('Normal actual-App fresh battle export required');
 await mkdir(dirname(path),{recursive:true});await writeFile(path,text,{flag:'wx'});
 await writeFile(path+'.receipt.json',JSON.stringify({kind:'SYNTHETIC-PREPARED-ENTRY-NOT-PRIOR-PLAY-EVIDENCE',created:new Date().toISOString(),profileSHA256:createHash('sha256').update(text).digest('hex'),sourceCommit:data.sourceCommit,controllerHash:data.controllerHash,stage:Number(stage),entryBuild:a.entryBuild,exportAPI:'actual App.export → App.downloadProfile → application/json Blob',flags:{debug:false,training:false,customMap:false},limitations:['Prepared independent normal-growth cohort with prerequisite clear markers; stages1–30 were NOT actually played.','For isolated localhost GUI review only; do not import into public/user records.','Fresh entry snapshot, no gameplay acceptance or campaign-earned history claim.'],officialIdentity:a.officialIdentity},null,2)+'\n',{flag:'wx'});
 console.log(JSON.stringify({exportedPreparedProfile:path,receipt:path+'.receipt.json',priorCampaignPlayed:false}));
}
