// Real browser App/renderer, deterministic clock and exported-file evidence sink.
// No live actor/terrain/resource/AI/warning-state assignments.
const plain=x=>JSON.parse(JSON.stringify(x));
const canonical=x=>JSON.stringify(x,(_k,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.entries(v).sort(([a],[b])=>a.localeCompare(b))):v);
function assert(value,message='Assertion failed'){if(!value)throw Error(message);}
assert.equal=(a,b,m)=>assert(a===b,m||`${a} !== ${b}`);assert.deepEqual=(a,b,m)=>assert(canonical(a)===canonical(b),m||'Deep equality failed');
let qaClock={now:()=>0};Object.defineProperty(performance,'now',{configurable:true,value:()=>qaClock.now()});
const g=new Proxy(window,{get:(o,k)=>k==='performance'?qaClock:o[k],set:(o,k,v)=>{if(k==='performance'){qaClock=v;return true;}o[k]=v;return true;}}),C=HONRO_CORE;
window.qa={events:[],captures:[],checkpoints:[],seen:new Set(),pending:[],waves:[],waveCaptures:new Set(),lastCast:null,frames:0};
function qaObserve(){
 const a=HonroApp,e=a.engine,b=e?.b;if(!b)return;qa.frames++;const id=b.honroStage===5?'s5-cave-shade':'s8-15',k=e.unit(id),cast=k?.enemyEffectCast,signature=canonical({cast:cast||null,recovery:k?.enemyEffectRecovery||null,cooldown:k?.enemyEffectCooldown});
 if(b.honroStage===8){const source='stage8-settled-crows',w=b.honroState?.stage8Bier?.warnings?.[source],entry=b.honroState?.stage8Bier?.entries?.[source],crows=b.units.filter(u=>u.honroSpawnSource===source),sig=canonical({status:w?.status,opportunity:w?.opportunity,ids:entry?.ids,actors:crows.map(u=>({id:u.id,hp:u.hp,lastAct:u.lastAct,dead:u.dead}))});
  if(sig!==qa.lastWave){qa.lastWave=sig;qa.waves.push({frame:qa.frames,round:b.round,phase:b.phase,active:b.active,warning:plain(w||null),entry:plain(entry||null),crows:plain(crows),heroes:plain(e.heroesAlive())});const label=entry?'crows-admitted':w?.opportunity?'crows-response':w?'crows-warning':null;if(label&&!qa.waveCaptures.has(label)){qa.waveCaptures.add(label);qa.captures.push({label,canvas:a.scene.canvas.toDataURL('image/png'),frame:qa.frames,round:b.round,scope:'Canvas-only natural frame, no camera reposition'});}}
 }
 if(qa.haltAtCrowBirth&&!qa.haltedAtCrowBirth&&b.honroState?.stage8Bier?.entries?.['stage8-settled-crows']){qa.haltedAtCrowBirth=true;throw Error('QA_CROW_BIRTH_BOUNDARY');}
 if(signature!==qa.lastCast){qa.lastCast=signature;qa.events.push({frame:qa.frames,round:b.round,phase:b.phase,active:b.active,pilot:plain(k||null),heroes:plain(e.heroesAlive()),camera:{x:a.scene.x,y:a.scene.y,scale:a.scene.scale},paused:!!a.dialogue||!!HonroStory.turnPaused(a,performance.now())||a.modal.classList.contains('open'),cast:plain(cast||null)});}
 if(cast?.seen&&cast.offered&&cast.target===e.active?.id&&a.canInput()&&!qa.seen.has(cast.serial)&&!qa.checkpointRequested){
  qa.checkpointRequested=true;qa.seen.add(cast.serial);const label=`pilot-${id}-${cast.serial}`,before=canonical(b),canvas=a.scene.canvas.toDataURL('image/png');
  // The production export captures this exact naturally reached state before
  // any next input. Its downloaded JSON, not a forged profile, is retained.
  qa.captureExport={label,battle:canonical(b)};const pending=a.export();assert(canonical(b)===before,'Export changed natural encounter');qa.pending.push(pending);qa.captures.push({label,canvas,frame:qa.frames,round:b.round});
 }
}
window.qaAttach=(entry,meta)=>{
 const a=HonroApp;qa.entry=entry;qa.meta=meta;qa.originalEvent=a.event;
 const hurt=a.engine?.hurt?.bind(a.engine);qa.damage=[];if(hurt)a.engine.hurt=(u,...args)=>{const before={hp:u.hp,shield:u.shield},result=hurt(u,...args),hp=before.hp-u.hp,shield=before.shield-u.shield;if(hp>0||shield>0)qa.damage.push({frame:qa.frames,round:a.engine.b.round,owner:args[1],target:u.id,hp,shield,before,after:{hp:u.hp,shield:u.shield}});return result;};
 const frame=a.frame.bind(a);a.frame=now=>{frame(now);qaObserve();};
 const exp=a.export.bind(a);a.export=(...args)=>{qa.pendingExport=exp(...args);return qa.pendingExport;};
 a.downloadProfile=text=>{const p=JSON.parse(text);qa.lastExport=p;if(qa.captureExport&&canonical(p.honroBattle)===qa.captureExport.battle){qa.checkpoints.push({label:qa.captureExport.label,profile:p});qa.captureExport=null;}};
};
window.qaInstall=async(entry,meta)=>{
 qaAttach(entry,meta);const a=HonroApp;
 a.close();a.stopBattle();const p=plain(entry.profile||entry);assert(!p.honroBattle,'Fresh entry must not import battle');p.settings.difficulty='story';a.profile=a.normalProfile=p;a.prev=0;
 await HonroCampaignLoader.ensureStage(meta.stage);a.launch(meta.stage);
};
async function qaSink(name,data){let timer;try{await Promise.race([window.qaEvidence(name,data),new Promise((_resolve,reject)=>{timer=setTimeout(()=>reject(Error('Evidence sink timeout '+name)),20000);})]);}finally{clearTimeout(timer);}}
async function qaWrite(name,data){if(/round-[0-9]+\.json$/.test(name))await qaSink(name.replace('.json','.canvas.png'),HonroApp.scene.canvas.toDataURL('image/png'));await qaSink(name,data);}
async function qaFinish(result){await Promise.all(qa.pending);if(qa.meta.preflight)await HonroApp.export();await qaWrite('natural-result.json',JSON.stringify({meta:qa.meta,result,preflightExport:qa.meta.preflight?qa.lastExport:null,frames:qa.frames,events:qa.events,waves:qa.waves,checkpoints:qa.checkpoints,captures:qa.captures,final:plain(HonroApp.engine.b),scope:'Actual browser production App actions/renderer; deterministic clock and legal pre-entry reward fixture, not continuous prior campaign or manual pointer-only play.'}));}
window.qaCounter=async kind=>{
 const a=HonroApp,e=a.engine,b=e.b,ops=createPlayerOperations({app:a,g,C}),id=b.honroStage===5?'s5-cave-shade':'s8-15',caster=e.unit(id),u=e.active,cast=plain(caster.enemyEffectCast);
 assert(cast&&cast.seen&&cast.offered&&cast.target===u.id&&e.canAct(),'Branch must start from genuine offered target checkpoint');
 const imported=plain(b),readyBefore={canInput:!!a.canInput(),dialogue:!!a.dialogue,turnPaused:!!HonroStory.turnPaused(a),frames:ops.frames};
 ops.frame();assert(ops.ready(3000),'Restored App did not finish ordinary UI settling');assert(b.active===u.id&&b.round===imported.round&&!u.acted&&caster.enemyEffectCast?.serial===cast.serial&&!caster.enemyEffectCast.responded,'UI settling consumed natural response');
 const before=plain(b),actions=[],readyAfter={canInput:!!a.canInput(),dialogue:!!a.dialogue,turnPaused:!!HonroStory.turnPaused(a),frames:ops.frames};let accepted=false;
 if(kind==='dodge'){
  const direction=u.x<cast.impact.x?-1:1;
  for(let n=0;n<500&&u.moveLeft>3&&Math.hypot(u.x-cast.impact.x,u.y-u.h*.45-cast.impact.y)<=cast.radius+u.r+12;n++){assert(ops.ready(3000),'Normal UI pause did not settle during dodge');ops.move(direction,C.STEP);ops.frame();}
  assert(ops.ready(3000));const outside=Math.hypot(u.x-cast.impact.x,u.y-u.h*.45-cast.impact.y)>cast.radius+u.r;accepted=ops.defend();actions.push({kind,direction,accepted,outside,position:{x:u.x,y:u.y}});assert(accepted&&outside,'Dodge must really move outside warning and consume a normal defense action');
 }else if(kind==='interrupt'){
  const sim=new C.Engine(plain(b)),su=sim.unit(u.id),sk=sim.unit(id);let choice=null;
  for(const sid of u.loadout){const s=C.SKILLS[sid];if(s.passive||!sim.canAfford(s,su,.5))continue;if(s.martial&&s.branch==='sword'&&s.damage>0){const angle=Math.atan2(su.y-su.h*.58-(sk.y-sk.h*.5),sk.x-su.x)*180/Math.PI,power=1;if(C.meleeContains(sim,su,sk,C.meleeRange(su,s,power),-angle*Math.PI/180,C.meleeSpan(su,s,power))){choice={sid,angle,power,method:'production meleeContains'};break;}continue;}const aim=sim.bestShot(su,s,sk),v=C.shotViable(sim,su,s,sk,aim.angle,aim.power);if(v.ok&&v.risk<1&&v.enemyDamage>0){choice={sid,...aim};break;}}
  if(choice){accepted=ops.fire(choice.sid,choice.angle,choice.power);assert(accepted,'Available interrupt must consume an actual App fire');}actions.push({kind,choice,accepted,unavailable:!choice});
 }else{accepted=ops.defend();assert(accepted,'Accept branch must consume real App defense');actions.push({kind:'accept-with-defense',accepted});}
 if(accepted)for(let n=0;n<30&&caster.enemyEffectCast&&!['won','lost'].includes(b.phase);n++){if(ops.ready()&&caster.enemyEffectCast){const other=e.active;ops.defend();actions.push({kind:'next-normal-defense',actor:other.id});}}
 await a.export();return {kind,accepted,actions,imported,readyBefore,readyAfter,before,after:plain(b),exported:qa.lastExport,scope:'Branch diagnostic from one genuine naturally reached checkpoint; not independent win-rate trial'};
};
