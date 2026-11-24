// Pure test driver + recorder; never put in browser production graph.
const key=(x)=>JSON.stringify(x);
const eq=(x,y)=>key(x)===key(y);
const simple=('tick move jump drop wait fire gate contextual chart interact finish-walk select').split(' ');
const guard=(v,t)=>{if(!v)throw Error(t);};
const round=(v)=>Number.isFinite(v)?+v.toFixed(5):null;
export const pose=(e,actor=e.active)=>({id:actor?.id??null,x:round(actor?.x),y:round(actor?.y),hp:round(actor?.hp),grounded:actor?e.grounded(actor):null,phase:e.b.phase,round:e.b.round,side:e.b.side});
export function recordNative(e,{stage,hz,poses=true}){
 const rows=[];let depth=0;
 function capture(op,args,perform,check=false){
  guard(simple.includes(op),'unknown input to recorder');
  if(depth)return perform();
  const before=check&&poses?pose(e):null;
  depth++;let ret;try{ret=perform();}finally{depth--;}
  const accepted=check?(typeof ret==='boolean'?ret:(ret&&typeof ret.ok==='boolean'?ret.ok:null)):null;
  const after=check&&poses?pose(e):null;
  const previous=rows.at(-1);
  if(!check&&previous?.op===op&&eq(args,previous.args)&&!previous.before)previous.times++;
  else rows.push({op,args,times:1,...(check?{before,after,accepted}:{})});
  return ret;
 }
 for(const [orig,op] of Object.entries({tick:'tick',move:'move',jump:'jump',drop:'drop',wait:'wait',fire:'fire',useGate:'gate',select:'select'})){
  if(typeof e[orig]!=='function')continue;
  const f=e[orig].bind(e);
  e[orig]=(...a)=>{
   const args=op==='jump'||op==='drop'?[a[0]?.id??e.active?.id??null]:a;
   return capture(op,args,()=>f(...a),!['tick','move'].includes(op));
  };
 }
 return {capture,seal(meta={}){return {schema:'honro-authored-replay-input/v1',stage,hz,commands:rows.slice(),...meta};}};
}
export function* driveNative(Engine,initialEngine,trace,affinity){
 const e=initialEngine;
 guard(e instanceof Engine,'not a live stock Engine');
 guard(affinity?.stage?.()===trace?.stage&&affinity?.engine?.()===e&&affinity?.trusted?.(trace)===true,'untrusted replay/stock App owner');
 guard(trace?.schema==='honro-authored-replay-input/v1'&&[60,120].includes(trace.hz)&&Array.isArray(trace.commands)&&trace.commands.length<=200000,'bad trace');
 const assertPose=(a,b)=>{
   if(!a)return;const id=affinity.actorId?.(a.id)??a.id;
   guard(id===b.id&&a.round===b.round&&a.phase===b.phase&&a.side===b.side&&a.grounded===b.grounded&&Math.abs(a.x-b.x)<=.008&&Math.abs(a.y-b.y)<=.008&&Math.abs(a.hp-b.hp)<=.001,'sealed actor pose mismatch: '+key({expected:a,actual:b}));
 };
 const h=1/trace.hz;let ticks=0,ops=0;
 for(const r of trace.commands){
  guard(r&&simple.includes(r.op)&&Array.isArray(r.args)&&Number.isInteger(r.times)&&r.times>0&&r.times<=100000,'not a legal command shape');
  guard(r.times===1||['tick','move'].includes(r.op),'cannot repeat a state boundary');
  assertPose(r.before,pose(e));
  const a=r.args;let returned;
  for(let i=0;i<r.times;i++){
   guard(affinity.engine()===e&&affinity.stage()===trace.stage&&++ops<=500000,'live engine replaced/overflow');
   switch(r.op){
    case 'tick':
      guard(a.length===1&&a[0]===h,'wrong tick rate');
      if(affinity.tick)affinity.tick(h);else e.tick(h);ticks++;break;
    case 'move':guard([-1,0,1].includes(a[0])&&a[1]===h&&a.length===2,'wrong move');e.move(...a);break;
    case 'jump':case 'drop':{
      const id=affinity.actorId?.(a[0])??a[0];guard(a.length===1&&id===e.active?.id,'cannot control non-active body');
      returned=e[r.op](e.active);break;}
    case 'wait':guard(a.length===0,'bad wait');returned=e.wait();break;
    case 'fire':guard(a.length===3&&typeof a[0]==='string'&&/^[A-Z][A-Z0-9]{1,6}$/.test(a[0])&&Number.isFinite(a[1])&&a[1]>=-360&&a[1]<=360&&a[2]>0&&a[2]<=1,'bad fire');returned=e.fire(...a);break;
    case 'finish-walk':guard([58,60].includes(trace.stage)&&a.length===0,'noncombat finish-walk only for 58 and 60');returned=yield {kind:'finish-walk'};break;
    case 'select':guard(a.length===1&&typeof a[0]==='string','bad actor selection');returned=yield {kind:'select',id:a[0]};break;
    case 'gate':guard(a.length===0,'bad gate');returned=yield {kind:'gate'};break;
    case 'contextual':guard(a.length===3&&typeof a[0]==='string'&&Number.isFinite(a[1])&&a[2]>0&&a[2]<=1,'bad contextual cast');returned=yield {kind:'contextual',id:a[0],angle:a[1],power:a[2]};break;
    case 'chart':case 'interact':guard(a.length===1&&typeof a[0]==='string'&&a[0].length<90,'bad objective input');returned=yield {kind:r.op,id:a[0]};break;
   }
  }
  // Record wanted accept/reject outcome only for command stages; position must
  // still independently match. Host cannot inject cooldown/flag/HP via trace.
  if(typeof r.accepted==='boolean')guard((typeof returned==='boolean'?returned:returned?.ok)===r.accepted,'native input accept/reject changed '+r.op);
  assertPose(r.after,pose(e));
 }
 return {stage:trace.stage,phase:e.b.phase,round:e.b.round,ticks,ops,pose:pose(e)};
}
