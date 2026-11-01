/** Passive diagnostic recorder. This is raw evidence, NOT a quality verdict.
 * Calls the original methods exactly once, preserving this, return and throws.
 * Never infers critical hits, successful jumps or attribution from a keypress.
 */
const copy=x=>JSON.parse(JSON.stringify(x));
export function observeEngine(engine,{metadata={},clock=()=>0}={}){
 const events=[],originals=new Map();let previous=null,closed=false;
 const unit=u=>({id:u.id,side:u.side,hp:u.hp,maxHp:u.maxHp,shield:u.shield||0,x:u.x,y:u.y,h:u.h,dead:!!u.dead,elite:!!u.elite,boss:!!u.boss,miniboss:!!u.honroMidboss,moveLeft:u.moveLeft,focus:u.focus});
 const state=()=>({round:engine.b.round,phase:engine.b.phase,side:engine.b.side,active:engine.b.active,shot:engine.b.shot,units:engine.b.units.map(unit)});
 const emit=(type,data)=>events.push({seq:events.length,time:clock(),type,...copy(data)});
 function sample(label='tick'){
  if(closed)throw Error('Recorder already closed');
  const now=state();
  if(!previous)emit('initial',{state:now});
  else{
   const old=new Map(previous.units.map(u=>[u.id,u]));
   const changed=now.units.filter(u=>JSON.stringify(u)!==JSON.stringify(old.get(u.id)));
   const removed=previous.units.filter(u=>!now.units.some(v=>v.id===u.id)).map(u=>u.id);
   const frame=({...now,units:undefined}),before=({...previous,units:undefined});
   if(changed.length||removed.length||JSON.stringify(frame)!==JSON.stringify(before))emit('state-delta',{label,frame,units:changed,removed});
  }
  previous=now;
 }
 sample('attach');
 for(const method of ['fire','jump','drop','wait','hurt']){
  if(typeof engine[method]!=='function')continue;
  const own=Object.getOwnPropertyDescriptor(engine,method),original=engine[method];
  const wrapper=function(...args){
   const b=this.b,actor=this.active?.id;
   const call=method==='hurt'?{target:args[0]?.id,amount:args[1],owner:args[2],direct:!!args[3],projectile:args[4]&&{id:args[4].id,shot:args[4].shot,owner:args[4].owner,skill:args[4].skill},damageSource:args[6]||'normal'}:{arguments:args};
   emit('call',{method,actor,round:b.round,shot:b.shot,call});
   try{const result=Reflect.apply(original,this,args);emit('return',{method,result:result===undefined?null:result});sample(method);return result;}
   catch(error){emit('throw',{method,message:String(error?.message||error)});sample(method);throw error;}
  };
  originals.set(method,{own,wrapper});engine[method]=wrapper;
 }
 return {sample,finish(outcome){sample('finish');closed=true;for(const [name,{own,wrapper}] of originals){if(engine[name]!==wrapper)throw Error('Observed method replaced during recording: '+name);if(own)Object.defineProperty(engine,name,own);else delete engine[name];}emit('terminal',{outcome,state:state()});return {schema:'honro-engine-observations-v1',metadata:copy(metadata),scope:'Diagnostic native observations; not normalized acceptance events, browser proof or human success-rate evidence.',events};}};
}
