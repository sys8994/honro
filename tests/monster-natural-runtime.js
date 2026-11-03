// Real browser App/renderer, deterministic clock and exported-file evidence sink.
// No live actor/terrain/resource/AI/warning-state assignments.
const plain=x=>JSON.parse(JSON.stringify(x));
const canonical=x=>JSON.stringify(x,(_k,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.entries(v).sort(([a],[b])=>a.localeCompare(b))):v);
function assert(value,message='Assertion failed'){if(!value)throw Error(message);}
assert.equal=(a,b,m)=>assert(a===b,m||`${a} !== ${b}`);assert.deepEqual=(a,b,m)=>assert(canonical(a)===canonical(b),m||'Deep equality failed');
let qaClock={now:()=>0};Object.defineProperty(performance,'now',{configurable:true,value:()=>qaClock.now()});
const g=new Proxy(window,{get:(o,k)=>k==='performance'?qaClock:o[k],set:(o,k,v)=>{if(k==='performance'){qaClock=v;return true;}o[k]=v;return true;}}),C=HONRO_CORE;
window.qa={events:[],captures:[],checkpoints:[],seen:new Set(),pending:[],lastCast:null,frames:0};
function qaObserve(){
 const a=HonroApp,e=a.engine,b=e?.b;if(!b)return;qa.frames++;const id=b.honroStage===5?'s5-cave-shade':'s8-15',k=e.unit(id),cast=k?.enemyEffectCast,signature=canonical({cast:cast||null,recovery:k?.enemyEffectRecovery||null,cooldown:k?.enemyEffectCooldown});
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
async function qaFinish(result){await Promise.all(qa.pending);if(qa.meta.preflight)await HonroApp.export();await qaWrite('natural-result.json',JSON.stringify({meta:qa.meta,result,preflightExport:qa.meta.preflight?qa.lastExport:null,frames:qa.frames,events:qa.events,checkpoints:qa.checkpoints,captures:qa.captures,final:plain(HonroApp.engine.b),scope:'Actual browser production App actions/renderer; deterministic clock and legal pre-entry reward fixture, not continuous prior campaign or manual pointer-only play.'}));}
window.qaCounter=async kind=>{
 const a=HonroApp,e=a.engine,b=e.b,ops=createPlayerOperations({app:a,g,C}),id=b.honroStage===5?'s5-cave-shade':'s8-15',caster=e.unit(id),u=e.active,cast=plain(caster.enemyEffectCast);
 assert(cast&&cast.seen&&cast.offered&&cast.target===u.id&&e.canAct(),'Branch must start from genuine offered target checkpoint');
 const before=plain(b),actions=[];let accepted=false;
 if(kind==='dodge'){
  const direction=u.x<cast.impact.x?-1:1;
  for(let n=0;n<500&&a.canInput()&&u.moveLeft>3&&Math.hypot(u.x-cast.impact.x,u.y-u.h*.45-cast.impact.y)<=cast.radius+u.r+12;n++){ops.move(direction,C.STEP);ops.frame();}
  accepted=ops.defend();actions.push({kind,direction,accepted,position:{x:u.x,y:u.y}});
 }else if(kind==='interrupt'){
  const sim=new C.Engine(plain(b)),su=sim.unit(u.id),sk=sim.unit(id);let choice=null;
  for(const sid of u.loadout){const s=C.SKILLS[sid];if(s.passive||!sim.canAfford(s,su,.5))continue;const aim=sim.bestShot(su,s,sk),v=C.shotViable(sim,su,s,sk,aim.angle,aim.power);if(v.ok&&v.risk<1&&v.enemyDamage>0){choice={sid,...aim};break;}}
  if(choice)accepted=ops.fire(choice.sid,choice.angle,choice.power);actions.push({kind,choice,accepted});
 }else{accepted=ops.defend();actions.push({kind:'accept-with-defense',accepted});}
 if(accepted)for(let n=0;n<30&&caster.enemyEffectCast&&!['won','lost'].includes(b.phase);n++){if(ops.ready()&&caster.enemyEffectCast){const other=e.active;ops.defend();actions.push({kind:'next-normal-defense',actor:other.id});}}
 await a.export();return {kind,accepted,actions,before,after:plain(b),exported:qa.lastExport,scope:'Branch diagnostic from one genuine naturally reached checkpoint; not independent win-rate trial'};
};
