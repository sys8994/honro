/** Explicit non-browser verification. This never represents full npm run verify. */
import {spawnSync} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
process.chdir(root);const out=process.env.HONRO_OFFLINE_REPORT_DIR||'_local/reports/offline-verification';await mkdir(out,{recursive:true});
const checks=[
 ['character-balance','npm',['run','test:character-balance']],
 ['ui-buttons','npm',['run','test:ui-buttons']],
 ['build','npm',['run','build']],['typecheck','npm',['--prefix','game','run','typecheck']],['game-regressions','npm',['--prefix','game','test']],
 ['ground-contact','npm',['run','test:ground-contact']],
 ['rescue-physics','npm',['run','test:rescue-physics']],
 ['terrain-domain','npm',['run','test:terrain-domain']],
 ['aim-wind-audio','npm',['run','test:aim-wind-audio']],
 ['event-targets','npm',['run','test:event-targets']],['sodan-charge','npm',['run','test:sodan-charge']],['camera-follow','npm',['run','test:camera-follow']],['battle-help','npm',['run','test:battle-help']],['campaign-continuity','npm',['run','test:campaign-continuity']],['camp-persistence','npm',['run','test:camp-persistence']],['rest-journey','npm',['run','test:rest-journey']],['act1-spaces','npm',['run','test:act1:offline']],['act2-art-fidelity','node',['tests/act2-art-fidelity.mjs']],['act2-spatial-art','node',['tests/act2-spatial-art.mjs']],['act2-objective-guidance','node',['tests/act2-objective-readability.mjs']],['map-schema-v5','node',['tests/map-schema-v5.mjs']],['space-layout-import','node',['tests/space-layout-import.mjs']],['workshop-vector-selection','node',['tests/workshop-vector-selection.mjs']],['vector-assets','node',['tests/vector-assets.mjs']],['migration','node',['tests/migration.mjs']],['launch-visibility','npm',['run','test:launch-visibility']],
 ['act2-spaces','npm',['run','test:act2:offline']],['intent-pipeline','npm',['run','test:intent-pipeline']],['review-job','npm',['run','test:review-job']],
 ...['camera-bounds','turnhold-physics-growth','environment-depth','environment-composition','audio','stage36-place-design','current-update','progress-hud','story-rewrite','combat-story-update','finale-update','attack-tempo-finale','npc-latency','skill-redesign','skill-polish','skill-effects','field-polish','sodan-followup','hwigyeom-p5','skill-tuning','existence-damage'].map(x=>[x,'node',[`tests/${x}.mjs`]]),
 ['environment-validation','node',['tools/environment/validate.mjs']],['environment-inventory','node',['tools/environment/inventory.mjs','--check']]
];
const includeCombat=process.argv.includes('--combat-evidence');
if(includeCombat)checks.push(['normal-combat-evidence','node',['tools/collect-act2-combat.mjs']]);
const results=[];
for(const [name,command,args] of checks){const start=Date.now();const p=spawnSync(command,args,{cwd:root,encoding:'utf8',maxBuffer:32*1024*1024});const log=(p.stdout||'')+(p.stderr||'');await writeFile(`${out}/${name}.log`,log);const result={name,command:[command,...args],status:p.status===0?'passed':'failed',exitCode:p.status,seconds:(Date.now()-start)/1000,log:`${out}/${name}.log`,error:p.error?.message};results.push(result);console.log(result.status.toUpperCase(),name,result.seconds+'s');if(result.status==='failed')console.log(log.slice(-6000));}
const report={completedAt:new Date().toISOString(),scope:'Explicit Node/build/typecheck subset, not full verification',normalCombat:includeCombat?'Existing full-act traces verified against current gameplay fingerprints':'Not included; run test:act2:normal separately',results,notRun:[{name:'Browser integration / Game / Stage View / Playtest UI',reason:'This offline command excludes browser UI and input checks; track actual Pages browser evidence separately.'},{name:'Browser performance',reason:'Run browser performance separately without concurrent heavy native or test jobs.'},{name:'User final artwork approval',reason:'Approved concept does not automatically approve final rendered output.'}]};
await writeFile(`${out}/summary.json`,JSON.stringify(report,null,2)+'\n');if(results.some(x=>x.status==='failed'))process.exitCode=1;
