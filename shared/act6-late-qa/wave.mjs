export function due(ledger,{round,unlocked,done,population,side},plan){
 if(ledger.rounds.filter(v=>v.action==='spawn').length>=(plan.loop.maxSquads??Infinity)||ledger.closed||!unlocked||done||side!==0||!Number.isSafeInteger(round)||round<1||ledger.rounds.some(o=>o.round===round)||ledger.epoch!==null&&round<ledger.epoch)return null;
 const epoch=ledger.epoch??round,index=(round-epoch)%plan.fronts.length,front=plan.fronts[index];
 return {round,action:population>=plan.loop.maxAliveNewWave?'capped':'spawn',front:front.id,u:front.u,line:front.line,id:'finale-edge-own-r'+round};
}
export function commit(ledger,request){
 if(ledger.rounds.some(o=>o.round===request.round))throw Error('duplicate wave round');
 if(ledger.epoch===null)ledger.epoch=request.round;
 ledger.rounds.push(request);
 return request;
}
