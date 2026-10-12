(function(G){'use strict';
// Evidence lives in the stage ledger, so retries cannot refill a goal. No
// positions, elapsed rounds or nearby bystanders earn points by themselves.
const hero=u=>!!u&&u.side===0&&!u.summoned&&!u.enthrall&&!!u.cls;
const alive=u=>hero(u)&&!u.dead&&u.hp>0;
const state=b=>b?.honroCustom?null:b?.honroGrowth?.ledger?.stages?.[b.honroStage]?.contribution;
function evidence(b){const s=state(b);if(!s||s.version!==4)return null;const mem=s.objectiveEvidence??={};mem.terrain??={};mem.escorts??={};mem.arrivals??={};return mem;}
function owner(b,id){const source=typeof id==='object'?id?.id:id;let u=typeof id==='object'?id:b.units.find(u=>u.id===id),seen=new Set();while(u&&(u.summoned||u.enthrall)&&!seen.has(u.id)){seen.add(u.id);u=b.units.find(v=>v.id===(u.summonOwner||u.enthrall?.owner));}if(hero(u))return u;const saved=state(b),cls=saved?.owners?.[source]||(saved?.actors?.includes(source)?source:null);return cls?(b.units.find(v=>hero(v)&&v.cls===cls)||{id:cls,cls,side:0}):null;}
function contributors(b,actors){const out={};for(const item of actors||[]){if(!item)continue;if(item.id==='_system'){const weight=item.weight??1;if(Number.isFinite(weight)&&weight>0)out._system=(out._system||0)+weight;continue;}const u=owner(b,item.id??item),weight=item.weight??1;if(u&&Number.isFinite(weight)&&weight>0)out[u.id]=(out[u.id]||0)+weight;}return Object.entries(out).map(([id,weight])=>({id,weight}));}
function award(b,key,actors,points=20){if(!evidence(b)||!(points>0))return false;const list=contributors(b,actors);return list.length?G.HonroProgression.objective(b,'goal:'+key,list,points):false;}
function observe(b,actors){if(!evidence(b))return;const travel=b.honroState.objectiveTravel??={};for(const u of actors.filter(alive))travel[u.id]={x:u.x,y:u.y};}
function movement(b,actor,provider,from,to){if(!evidence(b)||!alive(actor)||!owner(b,provider)||!from||!to||Math.hypot(to.x-from.x,to.y-from.y)<1)return;
 (b.honroState.objectiveGateTravel??={})[actor.id]={provider:owner(b,provider).id,from:{x:from.x,y:from.y},to:{x:to.x,y:to.y},round:b.round,end:b.teamEnds?.[0]||0};
}
function arrivalContributors(b,actors,inside){const out=[];for(const u of actors.filter(alive)){const receipt=b.honroState.objectiveGateTravel?.[u.id],provider=receipt&&owner(b,receipt.provider),gate=provider&&provider.id!==u.id&&receipt.round===b.round&&receipt.end===(b.teamEnds?.[0]||0)&&!inside(receipt.from)&&inside(receipt.to)&&Math.hypot(u.x-receipt.to.x,u.y-receipt.to.y)<=200;out.push({id:u.id,weight:gate ? .75 : 1});if(gate){out.push({id:provider.id,weight:.25});delete b.honroState.objectiveGateTravel[u.id];}}return out;}
function arrive(b,key,actors,inside,points=20){return award(b,'reach:'+key,arrivalContributors(b,actors,inside),points);}
// Rescue entry is an actual outside→inside movement into a safe working area.
// Merely ticking while someone is already beside the resident earns nothing.
function approach(b,key,actors,point,radius=220,safe=true){const mem=evidence(b);if(!mem||!safe||!point||mem.arrivals[key])return false;const inside=p=>Math.abs(p.y-point.y)<=150&&Math.hypot(p.x-point.x,(p.y-point.y)*.75)<=radius;
 const arrivals=actors.filter(alive).filter(u=>{const old=b.honroState.objectiveTravel?.[u.id]||b.honroState.objectiveGateTravel?.[u.id]?.from;return old&&!inside(old)&&inside(u)&&Math.hypot(u.x-old.x,u.y-old.y)>1;});if(!arrivals.length)return false;
 const actor=arrivals.find(u=>u.id===b.active)||arrivals[0];award(b,'approach:'+key,arrivalContributors(b,[actor],inside),18);mem.arrivals[key]=true;return true;
}
function interact(b,key,actor,{rescue=false,progress=false}={}){return award(b,'interact:'+key,[actor],rescue&&evidence(b)?.arrivals[key]||progress?2:5);}
function maintain(b,key,h,guards,progressed,rounds,continuous,intervalEnded=false){if(!evidence(b))return;const ids=guards.filter(alive).map(u=>u.id),prior=h.contributionGuards;
 if(progressed){const sustained=(prior||[]).filter(id=>ids.includes(id));if(h.progress<=rounds)award(b,'hold:'+key+':'+h.progress,sustained.length?sustained.map(id=>({id})):[{id:'_system',weight:1}],20/Math.max(1,rounds));h.contributionGuards=ids;}
 else if(intervalEnded&&continuous)h.contributionGuards=ids;
 else if(!continuous)h.contributionGuards=[];
 else h.contributionGuards=prior===undefined?ids:prior.filter(id=>ids.includes(id));
}
function terrain(e,t,beforeHp,source){const b=e.b,mem=evidence(b);if(!mem||!t?.id||!Number.isFinite(beforeHp)||!Number.isFinite(t.hp)||t.hp>=beforeHp)return;
 const authored=(G.HonroAct2?.active(b)?G.HonroAct2.steps(b):G.HonroAct3?.active(b)?G.HonroAct3.steps(b):[]).some(s=>s.kind==='destroy'&&s.id===t.id);
 if(!authored&&!t.honroSeal&&!t.honroBlocker&&t.id!=='sodan-binding')return;
 const r=mem.terrain[t.id]??={maxDamage:0,maxHp:Math.max(1,t.maxHp||beforeHp),weights:{}},lost=Math.max(0,Math.min(beforeHp,beforeHp-t.hp));
 t.honroContributionDamage=Math.min(r.maxHp,(t.honroContributionDamage||0)+lost);const delta=Math.max(0,t.honroContributionDamage-r.maxDamage);r.maxDamage=Math.max(r.maxDamage,t.honroContributionDamage);
 const u=owner(b,source);if(delta&&u){let support=null;if(b.honroStage===5&&t.id==='cliff-cleat'){const ritual=b.honroState.ritual,holder=ritual?.active&&owner(b,ritual.holderId),m=b.honroMarkers.find(m=>m.id==='receiver-5');if(alive(holder)&&holder.cls==='mage'&&m&&Math.abs(holder.x-m.x)<=125&&Math.abs(holder.y-m.y)<=80)support=holder;}
  r.weights[u.id]=(r.weights[u.id]||0)+delta*(support&&support.id!==u.id ? .6 : 1);if(support&&support.id!==u.id)r.weights[support.id]=(r.weights[support.id]||0)+delta*.4;
 }
 if(t.hp<=0||t.broken){const rows=Object.entries(r.weights).map(([id,weight])=>({id,weight})),known=rows.reduce((sum,r)=>sum+r.weight,0);rows.push({id:'_system',weight:Math.max(0,r.maxHp-known)});award(b,'terrain:'+t.id,rows,20);}
}
function finishEscort(b,key){const r=evidence(b)?.escorts[key];if(!r||!r.maxProgress)return false;const rows=Object.entries(r.weights).map(([id,weight])=>({id,weight})),known=rows.reduce((n,r)=>n+r.weight,0);rows.push({id:'_system',weight:Math.max(0,1-known)});return award(b,'escort:'+key,rows,20);}
function escort(b,key,npc,goal,actors,before,radius=170){const mem=evidence(b);if(!mem||!npc||!goal||!before)return;const r=mem.escorts[key]??={distance:Math.max(1,Math.hypot(before.x-goal.x,before.y-goal.y)-radius),maxProgress:0,weights:{}};
 const fraction=p=>Math.min(1,Math.max(0,1-Math.max(0,Math.hypot(p.x-goal.x,p.y-goal.y)-radius)/r.distance)),progress=fraction(npc),prior=fraction(before),delta=Math.max(0,progress-Math.max(r.maxProgress,prior));r.maxProgress=Math.max(r.maxProgress,prior,progress);
 const rows=contributors(b,actors),weight=rows.reduce((n,r)=>n+r.weight,0),moved=Math.hypot(npc.x-before.x,npc.y-before.y)>.001;if(delta&&moved&&weight)for(const row of rows)r.weights[row.id]=(r.weights[row.id]||0)+delta*row.weight/weight;
 if(progress>=1)finishEscort(b,key);
}
// The engine can confirm a win before the next mission tick (e.g. a final jump).
function beforeComplete(b,st){if(!evidence(b))return;if(st?.objective==='arrival'){const exit=b.honroMarkers.find(m=>m.type==='exit')||b.honroMapAnchors?.exit||{x:b.width-180},arrived=b.units.filter(u=>alive(u)&&u.x>=exit.x-120);if(arrived.length)arrive(b,'arrival',[arrived.find(u=>u.id===b.active)||arrived[0]],p=>p.x>=exit.x-120);}if(st?.objective==='rescue')finishEscort(b,'rescue-carrier');}
G.HonroObjectiveContributions={evidence,owner,award,observe,movement,arrive,approach,interact,maintain,terrain,escort,finishEscort,beforeComplete};
})(globalThis);
