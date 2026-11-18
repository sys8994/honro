import assert from'node:assert/strict';
const marker='G.HonroStage32FoundationArt={draw';
export const insertion=`
/* TEST_ONLY_COMPONENT_PROFILE_BEGIN */
const profile={functions:{},canvas:{},scope:'Instrumented diagnostic submission timings, not clean cost acceptance'},stack=[];
function measured(name,fn,bucket){return function(...args){const start=G.performance.now(),frame={child:0,name};stack.push(frame);try{return fn.apply(this,args);}finally{const ms=G.performance.now()-start;stack.pop();if(stack.length)stack[stack.length-1].child+=ms;const q=bucket[name]??={calls:0,inclusiveMs:0,selfMs:0};q.calls++;q.inclusiveMs+=ms;q.selfMs+=ms-frame.child;}};}
geometry=measured('geometry',geometry,profile.functions);
material=measured('foundationMaterialBuffer',material,profile.functions);
bitmap=measured('bitmap',bitmap,profile.functions);
coherentColor=measured('SS2',coherentColor,profile.functions);
nativeJunction=measured('nativeCoverage',nativeJunction,profile.functions);
internalGraySeam=measured('internalBand',internalGraySeam,profile.functions);
draw=measured('helperDrawRecursive',draw,profile.functions);
const proto=G.CanvasRenderingContext2D.prototype,restores=[];
for(const name of ['fill','clip','drawImage','getImageData','putImageData','clearRect','fillRect']){const original=proto[name],meters={};proto[name]=function(...a){if(!stack.length)return original.apply(this,a);const label=stack[stack.length-1].name+'::'+name;const meter=meters[label]??=measured(label,original,profile.canvas);return meter.apply(this,a);};restores.push(()=>proto[name]=original);}
G.__stage32ComponentProfile={snapshot:()=>JSON.parse(JSON.stringify(profile)),restore:()=>{for(const f of restores)f();}};
/* TEST_ONLY_COMPONENT_PROFILE_END */
`;
export function instrument(source){assert.equal(source.split(marker).length,2);const transformed=source.replace(marker,insertion+marker);assert.equal(transformed.replace(insertion,''),source);return transformed;}
