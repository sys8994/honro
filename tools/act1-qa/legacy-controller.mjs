/** Diagnostic reuse of existing positioning controller. Production Engine/App;
 * DOM/render doubles. Old route policies are calibration, not accepted cohorts. */
import vm from 'node:vm';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {appHarness,plain} from '../../tests/app-regression-helpers.mjs';
const stage=Number(process.argv[2]||1),seed=Number(process.argv[3]||1103),out=`_local/reports/act1-gameplay-20261103/stage${stage}-legacy-${seed}`;
await mkdir(out,{recursive:true});
const h=await appHarness({productionStory:true}),{g,C}=h;
vm.runInContext(`{let state=${seed}>>>0;Math.random=()=>{state+=0x6D2B79F5;let t=state;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}`,g);
vm.runInContext(await readFile('shared/runtime/interactions.js','utf8'),g);
const paths={2:'stage02-positioning',3:'stage03-positioning',4:'stage04-positioning',6:'stage06-bridge',7:'stage07-roots'};
const entryPath=stage===1?null:`game/docs/stage-review/${paths[stage]}/evidence/entry-profile.json`;
const profile=entryPath?JSON.parse(await readFile(entryPath)).profile:plain(g.AppRegression.fresh());
profile.settings.debugMode=false;const app=h.load(profile);app.launch(stage);g.HonroApp=app;app.scene.render=()=>{};h.finish(app);
const e=app.engine,b=e.b,initial=plain(b),events=[],inputs=[],damage=[],poses=[];let ticks=0;
for(const op of ['move','jump','drop','fire','wait','item','select']){const f=e[op]?.bind(e);if(!f)continue;e[op]=(...args)=>{const u=e.active,before=u&&{id:u.id,x:u.x,y:u.y,hp:u.hp,moveLeft:u.moveLeft};const ret=f(...args);if(op!=='move'||ticks%30===0)inputs.push({tick:ticks,round:b.round,op,args:args.map(v=>typeof v==='object'?v.id:v),before,accepted:ret});return ret;};}
const hurt=e.hurt.bind(e);e.hurt=(u,...args)=>{const hp=u.hp,r=hurt(u,...args);if(hp>u.hp)damage.push({tick:ticks,round:b.round,target:u.id,side:u.side,owner:args[1],loss:hp-u.hp,maxHp:u.maxHp,skill:args[3]?.skill});return r;};
const tick=e.tick.bind(e);e.tick=(dt)=>{ticks++;const r=tick(dt);if(ticks%60===0)poses.push({tick:ticks,round:b.round,phase:b.phase,units:b.units.map(u=>({id:u.id,x:u.x,y:u.y,hp:u.hp,dead:u.dead,support:e.surface(u.x,u.y-3,u.y+3)?.t.id}))});return r;};
await writeFile(out+'/initial.json',JSON.stringify({profile,entryPath,initial}));
let result,error;try{result=vm.runInContext(`(${await readFile(`tools/testing/stage${stage}-positioning-controller.js`,'utf8')})()`,g);delete result.images;}catch(err){error=err.stack;}
await writeFile(out+'/trace.json',JSON.stringify({source:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),stage,seed,scope:'Historical route controller calibration, native Engine/App inputs; DOM and canvas doubles. Entry historical declared profile, not continuous campaign.',entryPath,initial,final:plain(b),inputs,damage,poses,result,error}));
console.log(JSON.stringify({stage,seed,phase:b.phase,round:b.round,ticks,error,alive:e.heroesAlive().length,shots:inputs.filter(v=>v.op==='fire').length}));if(error)process.exitCode=1;
