() => {
 const native=HonroTimeOfDay.sky;
 const performanceObject=window.performance;
 const normal=performanceObject.now;
 const own=Object.getOwnPropertyDescriptor(performanceObject,'now');
 if(typeof native!=='function'||typeof normal!=='function'||own?.configurable===false)throw Error('Native layer clock cannot be safely controlled');
 const frozen=41000;
 let calls=0,restores=0,active=false;
 function restoreClock(){if(own)Object.defineProperty(performanceObject,'now',own);else delete performanceObject.now;}
 const observed=function(...q){
  const b=q[4];
  if(b?.honroStage!==13)return Reflect.apply(native,this,q);
  if(active||performanceObject.now!==normal)throw Error('Unexpected clock nesting');
  active=true;
  Object.defineProperty(performanceObject,'now',{value:()=>frozen,configurable:true,writable:true});
  try {calls++;return Reflect.apply(native,this,q);}
  finally {restoreClock();active=false;restores++;if(performanceObject.now!==normal)throw Error('Native clock not restored immediately');}
 };
 HonroTimeOfDay.sky=observed;
 window.__stage13SkyReceipt=()=>{
  const s=HonroApp.scene,b=HonroApp.engine.b,th=s._honroClouds,entry=HonroTimeOfDay.entry(b);
  if(active||performanceObject.now!==normal||calls!==restores||HonroTimeOfDay.sky!==observed)throw Error('Native clock or layer scope not restored');
  if(!th||th.x!==0||th.v!==0||th.at!==frozen||entry.sky===false||entry.clock===false||(entry.clouds??.7)<=0)throw Error('Native painted clouds did not use the expected real texture phase');
  return {calls,restores,paintedNativeLayer:true,x:th.x,v:th.v,at:th.at,
    stage:b.honroStage,round:b.round,day:entry.day,targetMinutes:HonroTimeOfDay.targetMinutes(entry,b.round),
    clockRemainsNative:performanceObject.now===normal};
 };
 window.__restoreStage13Sky=()=>{
  if(active||calls!==restores||performanceObject.now!==normal)throw Error('Unexpected state when restoring native sky');
  HonroTimeOfDay.sky=native;
  if(HonroTimeOfDay.sky!==native||Object.getOwnPropertyDescriptor(performanceObject,'now')?.value!==own?.value)throw Error('Failed cleanup');
 };
}
