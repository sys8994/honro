/** Opt-in QA instrumentation. No game source changes; only fresh pre-entry difficulty. */
import assert from 'node:assert/strict';
import {writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const copy=x=>JSON.parse(JSON.stringify(x)),hash=x=>createHash('sha256').update(typeof x==='string'?x:JSON.stringify(x)).digest('hex');
export function expeditionProfile(profile){const before=copy(profile),after=copy(profile);assert(!after.honroBattle,'Do not rewrite an in-progress battle profile');after.settings.difficulty='story';const audit=copy(after);audit.settings.difficulty=before.settings.difficulty;assert.deepEqual(audit,before);return{profile:after,receipt:{beforeSha256:hash(before),afterSha256:hash(after),diff:[{path:'settings.difficulty',before:before.settings.difficulty,after:'story'}]}};}
export function detachedPrediction(C,e,method,args,profile,stats={calls:0}){
 const methods=['predict','shotSeeds','bestShot','searchShot'],identities=methods.map(k=>e[k]);for(const k of methods)assert.equal(e[k],C.Engine.prototype[k],`Production ${k} identity changed before planning`);
 const before=JSON.stringify(e.b),beforeProfile=JSON.stringify(profile),sim=new C.Engine(JSON.parse(before));assert.equal(JSON.stringify(sim.b),before,'Planner constructor changed replica');
 const mapped=args.map(v=>v&&typeof v==='object'&&v.id&&e.b.units.includes(v)?sim.unit(v.id):v);
 try{stats.calls++;return method.startsWith('core:')?C[method.slice(5)](sim,...mapped):C.Engine.prototype[method].apply(sim,mapped);}finally{assert.equal(JSON.stringify(e.b),before,'Planner changed live battle');assert.equal(JSON.stringify(profile),beforeProfile,'Planner changed live profile');methods.forEach((k,i)=>assert.equal(e[k],identities[i],'Planner replaced live method'));}
}
/** Rewrite only explicit player-planning calls in a QA controller. Production methods remain untouched. */
export function isolateBaselinePlanning(source,handle,profile){
 for(const [prefix,method]of [['e.predict(','predict'],['e.shotSeeds(','shotSeeds'],['e.bestShot(','bestShot'],['C.shotViable(e,','core:shotViable']]){
  let offset=0;for(;;){const start=source.indexOf(prefix,offset);if(start<0)break;const argStart=start+prefix.length;let depth=1,quote=null,escape=false,end=argStart;
   for(;end<source.length;end++){const c=source[end];if(quote){if(escape)escape=false;else if(c==='\\')escape=true;else if(c===quote)quote=null;continue;}if(c==='"'||c==="'"||c==='`'){quote=c;continue;}if(c==='(')depth++;if(c===')'&&--depth===0)break;}
   assert(end<source.length,'Unclosed explicit planning call');const args=source.slice(argStart,end),replacement=`${handle}.plan(e,${JSON.stringify(method)},[${args}],${profile})`;source=source.slice(0,start)+replacement+source.slice(end+1);offset=start+replacement.length;
  }
 }
 return source;
}
export function enableExpeditionBaseline(h,{out,stage,seed,policy}){
 if(process.env.HONRO_QA_BASELINE!=='story')return null;
 const {C}=h,receipt={schema:'honro-expedition-baseline/v1',stage,seed,policy,attempt:process.env.HONRO_QA_ATTEMPT||'initial',source:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),sourceDirty:execFileSync('git',['status','--short'],{encoding:'utf8'}).trim(),sourceTreeSha256:hash(execFileSync('git',['ls-tree','-r','HEAD','--','shared','game/config','game/engine','tools/map-forge','tools/environment'],{encoding:'utf8',maxBuffer:16e6})),requested:{key:'story',label:'원정',hp:1.05,damage:.92},entries:[],battles:[],planning:{calls:0},observations:[]};mkdirSync(out,{recursive:true});
 receipt.plan=(e,method,args,profile)=>detachedPrediction(C,e,method,args,profile,receipt.planning);
 const flush=()=>writeFileSync(out+'/baseline-condition.json',JSON.stringify(receipt,null,2));const original=h.load;
 h.load=function(input){let p=input;if(input.honroBattle){assert.equal(input.settings.difficulty,'story','Continue profile must already be expedition');assert.equal(input.honroBattle.difficulty,'story','Continue battle must already be expedition');}else{const prepared=expeditionProfile(input);p=prepared.profile;receipt.entries.push(prepared.receipt);}const app=original.call(h,p);
  const attach=()=>{const e=app.engine,b=e?.b;if(!b)return;const d=C.DIFFICULTIES[b.difficulty];assert.equal(b.difficulty,'story');assert.equal(app.profile.settings.difficulty,'story');assert.equal(d.name,'원정');assert.equal(d.hp,1.05);assert.equal(d.damage,.92);
   const ordinary=b.units.filter(u=>u.side===1&&!u.elite&&!u.boss&&!u.honroMidboss&&!u.honroFinalBoss&&!u.honroObjectiveTarget),units=ordinary.map(u=>({id:u.id,hp:u.maxHp,baseHp:u.combatBaseHp,attack:u.attack,baseAttack:u.combatBaseAttack,hpError:Math.abs(u.maxHp-u.combatBaseHp*d.hp),attackError:Math.abs(u.attack-u.combatBaseAttack*d.damage)}));
   const failures=units.filter(u=>!Number.isFinite(u.hpError)||!Number.isFinite(u.attackError)||u.hpError>1||u.attackError>1e-9);receipt.battles.push({stage:b.honroStage,actualKey:b.difficulty,label:d.name,hp:d.hp,damage:d.damage,engineSeed:b.seed,engineRng:b.rng,actionCap:b.enemyLimit,profileSha256:hash(app.profile),heroes:copy(b.units.filter(u=>u.side===0).map(u=>({id:u.id,level:u.level,hp:u.hp,maxHp:u.maxHp,equipmentIds:u.equipmentIds,loadout:u.loadout,ranks:u.ranks}))),ordinary:units,statFailures:failures});flush();assert.equal(failures.length,0,'Ordinary enemy difficulty stat application mismatch; inspect receipt, do not relax');
   if(!e.__qaBaselineObserved){Object.defineProperty(e,'__qaBaselineObserved',{value:true});const hurt=e.hurt.bind(e);e.hurt=(u,...args)=>{const hp=u.hp,shield=u.shield||0,r=hurt(u,...args);if(hp>u.hp||shield>(u.shield||0))receipt.observations.push({kind:'damage',round:b.round,target:u.id,side:u.side,owner:args[1],hp:hp-u.hp,shield:shield-(u.shield||0),maxHp:u.maxHp});return r;};const finish=e.finishAction.bind(e);e.finishAction=(...args)=>{const u=e.active,acted=u?.acted,r=finish(...args);if(u?.side===1&&!acted&&u.acted)receipt.observations.push({kind:'enemy-action',round:b.round,id:u.id,x:u.x,y:u.y,source:u.honroSpawnSource||'initial'});return r;};}
  };
  for(const name of ['launch','continue']){const fn=app[name].bind(app);app[name]=(...args)=>{const r=fn(...args);attach();return r;};}return app;
 };
 process.on('exit',flush);return receipt;
}
