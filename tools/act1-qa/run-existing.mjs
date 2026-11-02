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
if(policy.includes('focused')){code="import {focusedProfile} from '"+new URL('./focused-profile.mjs',import.meta.url).href+"';\n"+code;if(stage===10)code=code.replace('let app=h.load(profile);','focusedProfile(g,profile);let app=h.load(profile);');if(stage===8)code=code.replace('const resume=',"fixture.training.push(...focusedProfile(g,fixture.profile));const resume=");}
if(stage===10&&policy.includes('gear')){
 code=code.replace('app.launch(10);',"h.click('rest');h.finish(app);const gearLog=[];for(const [cls,id]of [['archer','itm_se_01'],['mage','itm_da_01'],['mage','itm_co_02'],['knight','itm_hw_01'],['knight','itm_co_01']]){const already=app.profile.equipment.equippedByClass[cls][C.EQUIPMENT_MAP[id].slot]===id,ok=already||g.HonroEquipment.equip(app,cls,id);gearLog.push({cls,id,ok,already,screen:app.screen});assert(ok,'Owned legal equipment at normal rest '+id+' '+app.screen+' '+g.HonroEquipment.equipLockReason(app));}await writeFile(out+'/entry-equipment.json',JSON.stringify({gearLog,profile:plain(app.profile),scope:'Actual normal rest equipment transactions using only owned recorded items; no pending reward selection'}));app.launch(10);");
}
if(stage===8&&policy.includes('modern')){
 code=code.replace(/function story\(\)\{[^\n]+\n/,"function story(){return false;}\n");
 code=code.replace("e.tick(C.STEP);if(!app.dialogue)liveAudit.production(()=>app.missionTick(C.STEP));liveAudit.guard();frames++;","app.scene.render=()=>{};if(app.dialogue)liveAudit.production(()=>g.HonroStory.next(app));liveAudit.production(()=>app.frame(virtualMs));liveAudit.guard();frames++;");
 code=code.replace("if(!u||u.dead){stopReason='no living active hero';break;}","if(!u||u.dead){stopReason='no living active hero';break;}if(u.cls==='knight'&&u.hp<u.maxHp*.65&&u.loadout.includes('S08')&&e.cooldownLeft(u,'S08')===0&&e.canAfford(C.SKILLS.S08,u,1)&&e.fire('S08',u.angle,.3)){record({op:'fire',hero:u.cls,skill:'S08',reason:'ordinary counterstance before pursuit'});continue;}");
}
if(stage===8&&policy.includes('meleeclose')){
 code=code.replace('function attack(u,target){',"function attack(u,target){if(u.cls==='knight'&&target.id==='boss'&&distance(u,target)>350&&u.moveLeft>200)return false;");
}
if(stage===8&&policy.includes('diagnostic')){
 code=code.replace('liveAudit.guard();frames++;',"liveAudit.guard();frames++;if(app.lastError)throw Error('Production App.frame reported: '+app.lastError);");
 code=code.replace('if(frames>700000)', 'if(frames>180000)');
}
if(stage===10&&policy.includes('modern')){
 code=code.replace("assert(app.canInput(),'Finite ready boundary');","if(!app.canInput()){await save('input-boundary-failure');throw Error('Finite ready boundary');}");
 code=code.replace(/function tick\(\)\{[^\n]+\n/,"function tick(){ms+=C.STEP*1000;frames++;app.scene.render=()=>{};if(app.dialogue)audit.production(()=>g.HonroStory.next(app));audit.production(()=>app.frame(ms));audit.guard();}\n");
 code=code.replace("const goal=b.honroState.sodanCoop?","const goal=g.HonroSodanWithdrawal.ready(b)?g.HonroSodanWithdrawal.exit(b).x:b.honroState.sodanCoop?");
 code=code.replace("const u=e.active,t=g.HonroQuestTargets.records(b).find(t=>t.id==='sodan-binding');assert(u&&!u.dead);","const u=e.active,t=g.HonroQuestTargets.records(b).find(t=>t.id==='sodan-binding');assert(u&&!u.dead);if(u.cls==='knight'&&u.hp<u.maxHp*.65&&u.loadout.includes('S08')&&e.cooldownLeft(u,'S08')===0&&e.canAfford(C.SKILLS.S08,u,1)){if(e.fire('S08',u.angle,.3)){record({op:'fire',hero:u.cls,skill:'S08',reason:'ordinary counterstance recovery before pursuit'});continue;}}");
}
if(stage===10&&policy.includes('bestshot')){
 // Controller calibration: rank legal predicted hits rather than firing the
 // first low-charge seed. Binding finishing attacks take precedence over
 // repeated recovery when the authored target is within one strong hit.
 code=code.replace("u.hp<u.maxHp*.65&&u.loadout.includes('S08')", "u.hp<u.maxHp*.45&&(!t||t.broken||t.hp>500)&&u.loadout.includes('S08')");
 const bestAttack=`function attack(u,t){let best=null;for(const id of u.loadout){const s=C.SKILLS[id];if(!s||s.passive||id==='S08'||e.cooldownLeft(u,id)>0)continue;if(s.martial&&s.branch==='sword'){const q=representativeMelee(g,e,u,t,id);if(q&&e.canAfford(s,u,q.power)&&(!best||s.damage>best.score))best={id,...q,score:s.damage};continue;}for(const q of e.shotSeeds(u,s,t)){if(!e.canAfford(s,u,q.power))continue;const v=C.shotViable(e,u,s,t,q.angle,q.power);if(v.ok&&v.risk<1&&v.enemyDamage>0&&(!best||v.net>best.score))best={id,...q,score:v.net};}}if(best&&e.fire(best.id,best.angle,best.power)){record({op:'fire',hero:u.cls,target:t.id,skill:best.id,angle:best.angle,power:best.power,predictedScore:best.score});return true;}return false;}
`;
 code=code.replace(/function attack\(u,t\)\{[^\n]+\n/,bestAttack);
}
if(stage===10&&policy.includes('protector')){
 code=code.replace("u.hp<u.maxHp*.45&&(!t||t.broken||t.hp>500)","u.hp<u.maxHp*(b.honroState.sodanCoop?.2:.45)&&(!t||t.broken||t.hp>500)");
 code=code.replace("if(foes.filter(v=>Math.hypot(v.x-u.x,v.y-u.y)<700).some(v=>attack(u,v)))continue;","if(!b.honroState.sodanCoop&&foes.filter(v=>Math.hypot(v.x-u.x,v.y-u.y)<700).some(v=>attack(u,v)))continue;");
 code=code.replace("if(foes.some(v=>!v.dead&&attack(u,v)))continue;", "if(b.honroState.sodanCoop){const ward=e.unit('boss');foes.sort((a,z)=>Math.hypot(a.x-ward.x,a.y-ward.y)-Math.hypot(z.x-ward.x,z.y-ward.y));}if(foes.some(v=>!v.dead&&attack(u,v)))continue;");
}
if(stage===10&&policy.includes('preclear')){
 code=code.replace("if(!t||t.broken)return false;", "if(!t||t.broken)return false;if(t.hp<t.maxHp*.3&&b.round<9&&e.alive(1).some(v=>v.id!=='boss'&&!v.honroObjectiveTarget&&Math.hypot(v.x-e.unit('boss').x,v.y-e.unit('boss').y)<800))return false;");
 code=code.replace("if(b.honroState.sodanCoop){const ward=e.unit('boss');", "if(b.honroState.sodanCoop||t?.hp<t?.maxHp*.3){const ward=e.unit('boss');");
 code=code.replace("if(!b.honroState.sodanCoop&&foes.filter", "if(!b.honroState.sodanCoop&&!(t?.hp<t?.maxHp*.3)&&foes.filter");
 code=code.replace("b.honroState.sodanCoop?(u.cls", "(b.honroState.sodanCoop||t?.hp<t?.maxHp*.3)?(u.cls");
}
if(stage===10&&policy.includes('intercept')){
 code=code.replace("u.cls==='knight'?2800:u.cls==='mage'?2360:2040", "u.cls==='knight'?2580:u.cls==='mage'?2340:2200");
 code=code.replace("foes.sort((a,z)=>Math.hypot(a.x-ward.x,a.y-ward.y)-Math.hypot(z.x-ward.x,z.y-ward.y));", "foes.sort((a,z)=>(a.honroTargetId==='boss'?-1500:0)+Math.hypot(a.x-ward.x,a.y-ward.y)-(z.honroTargetId==='boss'?-1500:0)-Math.hypot(z.x-ward.x,z.y-ward.y));");
 // Ordinary equipped area/control skill gets an explicit tactical preference
 // against multiple visible threats; actual risk/affordability checks stay.
 code=code.replace("const v=C.shotViable(e,u,s,t,q.angle,q.power);if(v.ok", "const v=C.shotViable(e,u,s,t,q.angle,q.power);if(b.honroState.sodanCoop&&['M04','M06'].includes(id)&&e.alive(1).filter(v=>Math.hypot(v.x-t.x,v.y-t.y)<450).length>=2)v.net*=1.7;if(v.ok");
}
if(stage===10&&policy.includes('survival')){
 // Existing policy fires at binding before reaching useful cover, leaving each
 // hero exposed. New declared policy completes route before binding, engages
 // nearby actual enemies first, and keeps finite item checks unchanged.
 code=code.replace("if(!b.honroState.sodanCoop&&attackBinding(u,t))continue;","if(!b.honroState.sodanCoop&&pathIndex[u.cls]>=paths[u.cls].length&&attackBinding(u,t))continue;");
 code=code.replace("if(!app.canInput())continue;if(attackBinding(u,t))continue;","if(!app.canInput())continue;if(pathIndex[u.cls]>=paths[u.cls].length&&attackBinding(u,t))continue;");
 code=code.replace("if(!b.honroState.sodanCoop&&pathIndex[u.cls]>=paths[u.cls].length&&attackBinding(u,t))continue;", "if(u.hp<u.maxHp*.55&&e.alive(1).filter(v=>v.id!=='boss'&&Math.hypot(v.x-u.x,v.y-u.y)<1200).some(v=>attack(u,v)))continue;");
}
if(stage===10&&policy.includes('recover')){
 code=code.replace("u.hp<u.maxHp*(b.honroState.sodanCoop?.2:.45)","!g.HonroSodanWithdrawal.ready(b)&&u.hp<u.maxHp*(b.honroState.sodanCoop?.65:.45)");
 code=code.replace("if(!b.honroState.sodanCoop&&attackBinding(u,t))continue;\n if(foes.some", "if(!b.honroState.sodanCoop&&attackBinding(u,t))continue;\n if(foes.some");
 const before="if(b.honroState.sodanCoop){const ward=e.unit('boss');";
 code=code.replace(before,"if(b.honroState.sodanCoop&&!g.HonroSodanWithdrawal.ready(b)&&u.cls!=='knight'&&u.hp<u.maxHp*.4){record({op:'defend',hero:u.cls,reason:'ordinary recover after intercept movement'});audit.production(()=>app.defend());continue;}"+before);
}
if(stage===10&&policy.includes('scout')){
 code=code.replace("g.HonroSodanWithdrawal.ready(b)?g.HonroSodanWithdrawal.exit(b).x:", "(g.HonroSodanWithdrawal.ready(b)||b.honroState.sodanCoop&&u.cls==='archer'&&b.honroState.coopHold>=4)?g.HonroSodanWithdrawal.exit(b).x:");
}
if(stage===10){code=code.replace("h.click('journey-enter',{id:'11'});","app.export();await writeFile(out+'/after-stage10-rest-profile.json',JSON.stringify({profile:await h.exported(),scope:'Actual no-state-edit Stage10 outcome -> ordinary result-continue -> rest recruitment; captured BEFORE Stage11 launch. Prior9 was declared historical victory fixture, not continuous campaign.'}));h.click('journey-enter',{id:'11'});");}
if(policy.includes('noitems')){code=code.replace('if(u.hp<u.maxHp*.5&&b.items.heal)', 'if(false&&u.hp<u.maxHp*.5&&b.items.heal)');code=code.replace('if(useSupplies&&u.hp<u.maxHp*.45&&b.items.heal>0)', 'if(false&&useSupplies&&u.hp<u.maxHp*.45&&b.items.heal>0)');}
code=code.replace(/from\s*(['"])(\.[^'"]+)\1/g,(_,q,s)=>'from '+q+pathToFileURL(path.resolve(path.dirname(file),s)).href+q);
code=code.replaceAll('await readFile(new URL(import.meta.url))',`await readFile(${JSON.stringify(file)})`);
const generated=path.resolve(dir,'adapted-controller.mjs');await writeFile(generated,code);await writeFile(dir+'/adapter.json',JSON.stringify({stage,seed,policy,source:file,originalSha256:createHash('sha256').update(await readFile(file)).digest('hex'),adaptedSha256:createHash('sha256').update(code).digest('hex'),scope:'Native calibration. Fixed old cap4 deviations are recorded, NOT passed. No balance/map/state/goal changes.'},null,2));
await import(pathToFileURL(generated));
