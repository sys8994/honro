() => {
  if (!globalThis.HonroApp || document.documentElement.dataset.honroReady !== 'true') throw Error('initial stock title not ready');
  if (HonroApp.engine?.b?.honroStage === 3 || HonroApp.scene?._honroClouds != null)
    throw Error('the first Stage 3 dynamic artwork might already be active');
  const fixed = Object.freeze([60000,60016,60032,60048,60064,60096,60196,60296,60396,60496,60596,60696,60796,60896,60996]);
  const perf = performance, proto = Object.getPrototypeOf(perf), native = proto.now;
  const td = HonroTimeOfDay, sceneProto = HonroScene.prototype;
  const sky = Object.getOwnPropertyDescriptor(td,'sky'), tone = Object.getOwnPropertyDescriptor(sceneProto,'environmentTone');
  if (Object.hasOwn(perf,'now') || Object.hasOwn(globalThis,'__honroStage3Clock') ||
      !sky?.configurable || typeof sky.value!=='function' || !tone?.configurable || typeof tone.value!=='function')
    throw Error('native synchronous test render wrappers unavailable');
  const untouched = [Date, setTimeout, requestAnimationFrame, performance.timeOrigin];
  let phase=0, active=0;
  function scope(base, receiver, args, battle) {
    if (battle?.honroStage!==3 || battle.honroCustom!==false) return Reflect.apply(base,receiver,args);
    if (active || Object.hasOwn(perf,'now') || perf.now!==native) throw Error('nested or unexpected time patch');
    Object.defineProperty(perf,'now',{value:()=>fixed[phase],writable:false,enumerable:false,configurable:true});
    active++;
    try {
      const result=Reflect.apply(base,receiver,args);
      if (result && typeof result.then==='function') throw Error('native time must be synchronous only');
      return result;
    } finally {
      active--;
      if (!delete perf.now || perf.now!==native) throw Error('failed to restore native performance before gameplay');
    }
  }
  const wrapSky=function(...args){return scope(sky.value,this,args,args[4]);};
  const wrapTone=function(...args){return scope(tone.value,this,args,args[3]);};
  Object.defineProperty(td,'sky',{...sky,value:wrapSky});
  Object.defineProperty(sceneProto,'environmentTone',{...tone,value:wrapTone});
  Object.defineProperty(globalThis,'__honroStage3Clock',{configurable:true,enumerable:false,
    value:Object.freeze({
      set(i) {
        if (!Number.isInteger(i) || i<phase || i>=fixed.length || i>phase+1) throw Error('not a declared monotonic step');
        phase=i;
        return this.law();
      },
      law() {
        if (Date!==untouched[0] || setTimeout!==untouched[1] || requestAnimationFrame!==untouched[2] ||
            performance.timeOrigin!==untouched[3] || active || Object.hasOwn(perf,'now') || perf.now!==native ||
            td.sky!==wrapSky || sceneProto.environmentTone!==wrapTone)
          throw Error('outside native Stage 3 sky or tone the clock must remain native');
        return {phase,ms:fixed[phase],sameStandardTimers:true};
      },
      restore() {
        this.law();
        Object.defineProperty(td,'sky',sky);
        Object.defineProperty(sceneProto,'environmentTone',tone);
        return delete globalThis.__honroStage3Clock && td.sky===sky.value && sceneProto.environmentTone===tone.value && perf.now===native;
      }
    })
  });
  return __honroStage3Clock.law();
}
