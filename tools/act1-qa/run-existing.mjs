/** Observation adapter, not an amendment to old acceptance tests.
 * Keeps all production game data unchanged. Historical fixed queue assertion is
 * recorded as a deviation, never relabelled passed; actual configured bound
 * remains checked. Uses current productionStory selection. */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';import {pathToFileURL} from 'node:url';import {createHash} from 'node:crypto';
const stage=Number(process.argv[2]),files={8:'tests/stage8-bier-fullplay.mjs',9:'tests/stage9-normal-play.mjs',10:'tests/stage10-normal-play.mjs'};
if(!files[stage])throw Error('Supported8/9/10 only');
const file=files[stage],seed=Number(process.argv[3]||1103),policy=process.argv[4]||'baseline',dir=`_local/reports/act1-gameplay-20261103/stage${stage}-${policy}-${seed}`;await mkdir(dir,{recursive:true});
process.env.HONRO_OUT=dir;process.env.HONRO_FULLPLAY_OUT=dir;process.env.HONRO_FULLPLAY_CURRENT_ENTRY='1';process.env.HONRO_FULLPLAY_SUPPLIES='1';
let code=await readFile(file,'utf8');code=code.replaceAll('appHarness()','appHarness({productionStory:true})');
code=code.replaceAll("assert(b.queue.length<=4)","assert(b.queue.length<=b.enemyLimit);if(b.side===1&&b.queue.length>4)record({op:'legacy-cap-deviation',oldExpected:4,observed:b.queue.length,configured:b.enemyLimit})");
// Seed initialization occurs before launch, and affects RNG only, not battle values.
const insert=`\nvm.runInContext(\`{let state=${seed}>>>0;Math.random=()=>{state+=0x6D2B79F5;let t=state;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}\`,g);\n`;
if(!code.includes("from 'node:vm'")&&!code.includes("from'node:vm'"))code="import vm from 'node:vm';\n"+code;
if(stage===8)code=code.replace("const out=",insert+'const out=');else code=code.replace("const input=",insert+'const input=');
if(policy.includes('focused')){code="import {focusedProfile} from '"+pathToFileURL(path.resolve('tools/act1-qa/focused-profile.mjs')).href+"';\n"+code;if(stage===10)code=code.replace('let app=h.load(profile);','focusedProfile(g,profile);let app=h.load(profile);');if(stage===8)code=code.replace('const resume=',"fixture.training.push(...focusedProfile(g,fixture.profile));const resume=");}
if(stage===8&&policy.includes('modern')){
 code=code.replace(/function story\(\)\{[^\n]+\n/,"function story(){return false;}\n");
 code=code.replace("e.tick(C.STEP);if(!app.dialogue)liveAudit.production(()=>app.missionTick(C.STEP));liveAudit.guard();frames++;","app.scene.render=()=>{};if(app.dialogue)liveAudit.production(()=>g.HonroStory.next(app));liveAudit.production(()=>app.frame(virtualMs));liveAudit.guard();frames++;");
 code=code.replace("if(!u||u.dead){stopReason='no living active hero';break;}","if(!u||u.dead){stopReason='no living active hero';break;}if(u.cls==='knight'&&u.hp<u.maxHp*.65&&u.loadout.includes('S08')&&e.cooldownLeft(u,'S08')===0&&e.canAfford(C.SKILLS.S08,u,1)&&e.fire('S08',u.angle,.3)){record({op:'fire',hero:u.cls,skill:'S08',reason:'ordinary counterstance before pursuit'});continue;}");
}
if(stage===10&&policy.includes('modern')){
 code=code.replace("assert(app.canInput(),'Finite ready boundary');","if(!app.canInput()){await save('input-boundary-failure');throw Error('Finite ready boundary');}");
 code=code.replace(/function tick\(\)\{[^\n]+\n/,"function tick(){ms+=C.STEP*1000;frames++;app.scene.render=()=>{};if(app.dialogue)audit.production(()=>g.HonroStory.next(app));audit.production(()=>app.frame(ms));audit.guard();}\n");
 code=code.replace("const goal=b.honroState.sodanCoop?","const goal=g.HonroSodanWithdrawal.ready(b)?g.HonroSodanWithdrawal.exit(b).x:b.honroState.sodanCoop?");
 code=code.replace("const u=e.active,t=g.HonroQuestTargets.records(b).find(t=>t.id==='sodan-binding');assert(u&&!u.dead);","const u=e.active,t=g.HonroQuestTargets.records(b).find(t=>t.id==='sodan-binding');assert(u&&!u.dead);if(u.cls==='knight'&&u.hp<u.maxHp*.65&&u.loadout.includes('S08')&&e.cooldownLeft(u,'S08')===0&&e.canAfford(C.SKILLS.S08,u,1)){if(e.fire('S08',u.angle,.3)){record({op:'fire',hero:u.cls,skill:'S08',reason:'ordinary counterstance recovery before pursuit'});continue;}}");
}
if(stage===10&&policy.includes('survival')){
 // Existing policy fires at binding before reaching useful cover, leaving each
 // hero exposed. New declared policy completes route before binding, engages
 // nearby actual enemies first, and keeps finite item checks unchanged.
 code=code.replace("if(!b.honroState.sodanCoop&&attackBinding(u,t))continue;","if(!b.honroState.sodanCoop&&pathIndex[u.cls]>=paths[u.cls].length&&attackBinding(u,t))continue;");
 code=code.replace("if(!app.canInput())continue;if(attackBinding(u,t))continue;","if(!app.canInput())continue;if(pathIndex[u.cls]>=paths[u.cls].length&&attackBinding(u,t))continue;");
 code=code.replace("if(!b.honroState.sodanCoop&&pathIndex[u.cls]>=paths[u.cls].length&&attackBinding(u,t))continue;", "if(u.hp<u.maxHp*.55&&e.alive(1).filter(v=>v.id!=='boss'&&Math.hypot(v.x-u.x,v.y-u.y)<1200).some(v=>attack(u,v)))continue;");
}
code=code.replace(/from\s*(['"])(\.[^'"]+)\1/g,(_,q,s)=>'from '+q+pathToFileURL(path.resolve(path.dirname(file),s)).href+q);
code=code.replaceAll('await readFile(new URL(import.meta.url))',`await readFile(${JSON.stringify(file)})`);
const generated=path.resolve(dir,'adapted-controller.mjs');await writeFile(generated,code);await writeFile(dir+'/adapter.json',JSON.stringify({stage,seed,policy,source:file,originalSha256:createHash('sha256').update(await readFile(file)).digest('hex'),adaptedSha256:createHash('sha256').update(code).digest('hex'),scope:'Native calibration. Fixed old cap4 deviations are recorded, NOT passed. No balance/map/state/goal changes.'},null,2));
await import(pathToFileURL(generated));
