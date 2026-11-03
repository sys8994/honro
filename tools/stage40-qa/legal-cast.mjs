/** Planner-only current-state rollout. Never changes live state or advances enemy
 * turns. Evaluates the complete physical projectile chain, not one endpoint. */
export function evaluateLegalCast(C,b,actorId,id,angle,power,{maxSteps=1440}={}){
 const beforeText=JSON.stringify(b),sim=new C.Engine(JSON.parse(beforeText),()=>{},true),u=sim.unit(actorId),before=new Map(sim.b.units.map(v=>[v.id,{hp:v.hp,shield:v.shield||0,side:v.side}])),hits=[];
 if(sim.active?.id!==actorId)return {legal:false,reason:'not-active'};
 const hurt=sim.hurt.bind(sim);sim.hurt=(v,...args)=>{const old=v.hp,shield=v.shield||0,out=hurt(v,...args);if(old!==v.hp||shield!==(v.shield||0))hits.push({id:v.id,side:v.side,hp:Math.max(0,old-v.hp),shield:Math.max(0,shield-(v.shield||0)),source:args[1]});return out;};
 if(!sim.fire(id,angle,power))return {legal:false,reason:'cast-rejected'};
 let steps=0;while(sim.b.projectiles.length&&steps<maxSteps){for(const p of [...sim.b.projectiles])if(sim.b.projectiles.includes(p))sim.stepProjectile(p,C.STEP);steps++;}
 let enemyDamage=0,friendlyDamage=0;const targets=[];for(const v of sim.b.units){const old=before.get(v.id);if(!old)continue;const loss=Math.max(0,old.hp-v.hp)+Math.max(0,old.shield-(v.shield||0));if(v.side!==u.side&&loss){enemyDamage+=loss;targets.push(v.id);}else if(v.id!==u.id)friendlyDamage+=loss;}
 if(JSON.stringify(b)!==beforeText)throw Error('Detached planner mutated live battle');
 return {legal:true,complete:sim.b.projectiles.length===0,steps,enemyDamage,friendlyDamage,targets,hits,landing:{x:u.x,y:u.y,dead:u.dead},safe:sim.b.projectiles.length===0&&friendlyDamage===0};
}
