() => {
  if (!globalThis.HonroApp || document.documentElement.dataset.honroReady !== 'true') throw Error('initial stock title not ready');
  if (HonroApp.engine?.b?.honroStage === 3 || HonroApp.scene?._honroClouds != null)
    throw Error('the first Stage 3 dynamic artwork might already be active');
  const fixed = Object.freeze([60000,60016,60032,60048,60064,60096,60196,60296,60396,60496,60596,60696,60796,60896,60996]);
  const perf = performance, proto = Object.getPrototypeOf(perf), native = proto.now.bind(perf);
  if (Object.hasOwn(perf,'now') || Object.hasOwn(globalThis,'__honroStage3Clock') || native() >= fixed[0])
    throw Error('test clock unavailable or already passed frozen first timestamp');
  const untouched = [Date, setTimeout, requestAnimationFrame, performance.timeOrigin];
  let phase = 0;
  Object.defineProperty(perf,'now',{value:()=>fixed[phase],writable:false,enumerable:false,configurable:true});
  Object.defineProperty(globalThis,'__honroStage3Clock',{configurable:true,enumerable:false,
    value:Object.freeze({
      set(i) {
        if (!Number.isInteger(i) || i<phase || i>=fixed.length || i>phase+1) throw Error('not a declared monotonic step');
        phase=i;
        return this.law();
      },
      law() {
        if (Date!==untouched[0] || setTimeout!==untouched[1] || requestAnimationFrame!==untouched[2]
            || performance.timeOrigin!==untouched[3] || perf.now()!==fixed[phase])
          throw Error('received unexpected clock or unrelated timer mutation');
        return {phase,ms:fixed[phase],sameStandardTimers:true};
      },
      restore() {
        if (!delete perf.now || !delete globalThis.__honroStage3Clock || perf.now!==proto.now)
          throw Error('failed to restore native performance');
        return true;
      }
    })
  });
  return __honroStage3Clock.law();
}
