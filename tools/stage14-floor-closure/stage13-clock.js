() => {
 const a=globalThis.HonroApp, perf=performance, proto=Object.getPrototypeOf(perf), native=proto.now.bind(perf);
 if(!a || document.documentElement.dataset.honroReady!=='true' || a.engine?.b?.honroStage===13 ||
    a.scene?._honroClouds!=null || Object.hasOwn(perf,'now') ||
    Object.hasOwn(globalThis,'__honroS13Clock') || native()>=60000) throw Error('Stage13 pre-launch clock scope');
 const origin=perf.timeOrigin,standard=[Date,setTimeout,requestAnimationFrame,Math.random];
 let step=0,ms=60000;
 Object.defineProperty(perf,'now',{configurable:true,enumerable:false,writable:false,value:()=>ms});
 Object.defineProperty(globalThis,'__honroS13Clock',{configurable:true,value:Object.freeze({
  set(i,m){
   if(!Number.isInteger(i)||i!==step+1||!Number.isInteger(m)||m<=ms||m-ms>100)throw Error('clock steps must follow the predeclared range');
   step=i;ms=m;return this.law();
  },
  law(){
   if(perf.timeOrigin!==origin||perf.now()!==ms||Date!==standard[0]||setTimeout!==standard[1]||
     requestAnimationFrame!==standard[2]||Math.random!==standard[3])throw Error('unexpected non-test clock mutation');
   return {step,ms};
  },
  observe(){
   const b=a.engine.b,s=a.scene,e=HonroTimeOfDay.entry(b),q=s._honroClouds,clock=this.law();
   if(b.honroStage!==13||!b.honroCanonical||b.honroCustom!==false||b.honroMapOrigin!=='campaign'||
     b.round!==1||b.phase!=='aim'||!e||e.start!=='13:30'||e.sky===false||e.clock===false||
     !q||q.at!==clock.ms||!Number.isFinite(q.x)||!Number.isFinite(q.v))throw Error('exact Stage13 native timeline and cloud not witnessed');
   return {...clock,x:q.x,v:q.v,at:q.at,wind:Number.isFinite(b.wind)?b.wind:0,backing:[s.canvas.width,s.canvas.height],
      nativeTimeline:{start:e.start,end:e.end,profile:e.profile??'default',density:e.clouds??.7}};
  },
  restore(){
   return delete perf.now && delete globalThis.__honroS13Clock && perf.now===proto.now;
  }
 })});
 return __honroS13Clock.law();
}
