/* QA-only synchronous observer. Install on an already attached Engine instance.
 * Does not read time, RNG, execute queries, or write battle state. It records
 * bounded data after original methods return; rendered visibility is separate. */
(function(G){'use strict';
function install(e,meta={},max=100000){
 if(!e||e.__qaObservation)throw Error('invalid/already observed engine');
 const rows=[], originals={}, failures={count:0},roles=u=>u?{id:u.id??null,side:u.side??null,role:u.honroAct4Resident?'resident':u.honroPilotMidboss?'pilot-midboss':u.side===0?'hero':u.side===1?'enemy':'other'}:null;
 const state=()=>{const b=e.b,q=b.honroAct4PreviewState||{};return{stage:b.honroStage??b.stageId??null,run:b.session??null,round:b.round,side:b.side,phase:b.phase,shot:b.shot,tide:q.tide?.phase??null,netOpen:!!q.netOpen,exitStable:!!q.exitStable,rescued:!!q.rescued,complete:!!q.complete,failure:q.failure??null};};
 function add(x){try{if(rows.length<max)rows.push(x);else failures.count++;}catch{failures.count++;}}
 function wrap(name,make){const original=e[name];if(typeof original!=='function')return;originals[name]=original;e[name]=function(...args){let capture;try{capture=make.before?.(args);}catch{failures.count++;}let result,thrown;try{result=original.apply(this,args);return result;}catch(err){thrown=true;throw err;}finally{try{const x=make.after(args,capture,result,thrown);if(x)add({kind:name,...x,...state()});}catch{failures.count++;}}};}
 wrap('fire',{before:a=>({actor:roles(e.active),angle:a[1],power:a[2]}),after:(a,c,v,t)=>({actor:c?.actor,skill:a[0],angle:c?.angle,power:c?.power,ai:!!a[3],outcome:t?'exception':v?'fired':'not-fired'})});
 wrap('hurt',{before:a=>({target:roles(a[0]),hp:a[0]?.hp,shield:a[0]?.shield??0}),after:(a,c,v,t)=>({target:c?.target,owner:typeof a[2]==='string'?a[2]:'unknown',skill:a[4]?.skill??a[7]??a[8]?.skill??'unknown',source:a[6]??'normal',direct:!!a[3],attempted:a[1],hpBefore:c?.hp,hpAfter:a[0]?.hp,shieldBefore:c?.shield,shieldAfter:a[0]?.shield??0,outcome:t?'exception':((a[0]?.hp??0)+(a[0]?.shield??0)<(c?.hp??0)+(c?.shield??0)?'damage':'no-hp-shield-loss')})});
 wrap('walk',{before:a=>({actor:roles(a[0]),x:a[0]?.x,y:a[0]?.y}),after:(a,c,v,t)=>{const dx=(a[0]?.x??0)-(c?.x??0),dy=(a[0]?.y??0)-(c?.y??0);return{actor:c?.actor,direction:a[1],dx,dy,outcome:t?'exception':dx||dy?'moved':'no-movement'};}});
 wrap('enemyAction',{before:()=>({actor:roles(e.active),intent:e.active?.intent??null}),after:(a,c,v,t)=>({actor:c?.actor,intentBefore:c?.intent,intentAfter:e.active?.intent??null,outcome:t?'exception':'called'})});
 wrap('finishAction',{before:()=>({actor:roles(e.active),acted:e.active?.acted??null}),after:(a,c,v,t)=>({actor:c?.actor,actedBefore:c?.acted,reviewed:!!a[0],outcome:t?'exception':'finished-action'})});
 const api={meta,rows,failures,sample(label,extra={}){add({kind:'sample',label,...state(),...extra});},uninstall(){for(const [k,v]of Object.entries(originals))e[k]=v;delete e.__qaObservation;}};
 Object.defineProperty(e,'__qaObservation',{configurable:true,value:api});return api;
}
G.HonroQAObserver={install};
})(globalThis);
