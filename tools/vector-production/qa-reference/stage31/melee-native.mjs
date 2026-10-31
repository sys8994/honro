/** Forecast only: clone exact battle; native cast/physics. Never modifies measured battle. */
export function forecastMelee(C,b,actorId,targetId,angle,power=.5){
 const copy=structuredClone(b),sim=new C.Engine(copy,()=>{}),u=sim.unit(actorId),target=sim.unit(targetId),hits=[];
 const hurt=sim.hurt.bind(sim);sim.hurt=(t,...a)=>{const hp=t.hp,result=hurt(t,...a);if(t.hp<hp&&a[1]===actorId)hits.push({id:t.id,side:t.side,damage:hp-t.hp});return result;};
 const accepted=sim.fire('S00',angle,power);let frames=0;
 if(accepted)for(;frames<240&&copy.side===0&&!['won','lost'].includes(copy.phase);frames++){sim.tick(C.STEP);if(!copy.projectiles.length&&!u.meleeAction&&u.acted)break;}
 return {accepted,angle,power,frames,targetDamage:hits.filter(h=>h.id===targetId).reduce((n,h)=>n+h.damage,0),friendlyDamage:hits.filter(h=>h.side===0).reduce((n,h)=>n+h.damage,0),hits};
}
