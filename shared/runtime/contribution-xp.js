(function(G){'use strict';
// Data-only, deterministic accounting. No combat state or HeroProgress mutations.
const touch=s=>{s.sequence=(s.sequence||0)+1;};
const VERSION=4,finite=n=>Number.isFinite(n)?Math.max(0,n):0,sum=o=>Object.values(o||{}).reduce((n,v)=>n+finite(v),0);
const add=(o,k,n)=>{if(k&&finite(n)>0)o[k]=(o[k]||0)+n;};
function create(total,combat,actors,levels={}){
 const values=Object.values(levels).sort((a,b)=>a-b),median=values.length?values[Math.floor(values.length/2)]:1;
 return {version:VERSION,sequence:0,total:Math.round(total),combatLimit:Math.round(combat),actors:[...actors].sort(),factors:Object.fromEntries(actors.map(c=>[c,1+Math.min(.25,Math.max(0,median-(levels[c]||median))*.1)])),owners:{},enemies:{},objectives:{},objectiveEvidence:{},paid:{},spent:0,forfeited:0,combatSpent:0,completed:false};
}
function enemy(s,id,hp,weight=1){return s.enemies[id]??={id,hp:Math.max(1,finite(hp)),weight:Math.max(.01,finite(weight)),progress:0,damage:{},support:{},threats:{},wounds:{},controls:{},defeated:false,settled:false};}
function damage(s,id,liveProgress,actual,credits){const e=s.enemies[id];if(!e||s.completed)return 0;const progress=Math.min(e.hp,finite(liveProgress)),delta=Math.max(0,progress-e.progress);e.progress=Math.max(e.progress,progress);if(!delta)return 0;touch(s);const current=Math.min(delta,finite(actual)),valid=Object.entries(credits).filter(([cls])=>s.actors.includes(cls)),total=valid.reduce((n,[,v])=>n+finite(v),0),scale=total>actual?finite(actual)/total:1;let assigned=0;for(const [cls,n]of valid){const share=actual>0?finite(n)*scale/actual*current:0;assigned+=share;add(e.damage,cls,share/e.hp*100*e.weight);}add(e.damage,'_system',Math.max(0,delta-assigned)/e.hp*100*e.weight);return delta;}
// One high-water threat envelope per target and 10% enemy-HP progress band.
// Time, reloads and repeated equal-strength attacks cannot refill that envelope.
function threat(s,id,target,maxHp,hpBefore,loss,protections,liveProgress){const e=s.enemies[id];if(!e||s.completed)return;const band=Math.min(9,Math.floor(Math.min(e.progress,liveProgress??e.progress)/e.hp*10)),key=target+':'+band,raw=sum(protections),danger=Math.min(finite(hpBefore),finite(loss)+raw),prior=e.threats[key]||0,delta=Math.max(0,danger-prior);e.threats[key]=Math.max(prior,danger);if(!delta||!danger)return;touch(s);
 const scale=delta/danger,unit=100*e.weight/Math.max(1,maxHp),protectedAmount=Math.min(raw,Math.max(0,danger-loss));
 for(const [cls,n] of Object.entries(protections))if(s.actors.includes(cls))add(e.support,cls,n/Math.max(raw,1)*protectedAmount*scale*unit);
 const hurt=Math.min(loss,danger)*scale;if(hurt>0){const wounds=e.wounds[target]=(e.wounds[target]||[]).filter(w=>w.hp>0),same=wounds.find(w=>w.unit===unit);if(same)same.hp+=hurt;else wounds.push({hp:hurt,unit});}
}
function heal(s,target,actual,cls){let left=finite(actual);if(!left||s.completed)return 0;let points=0;for(const e of Object.values(s.enemies))for(const w of e.wounds[target]||[]){const n=Math.min(left,w.hp);w.hp-=n;left-=n;if(n>0)touch(s);if(s.actors.includes(cls)){add(e.support,cls,n*w.unit);points+=n*w.unit;}if(!left)break;}return points;}
function control(s,id,token,cls){const e=s.enemies[id];if(!e||s.completed||!s.actors.includes(cls)||e.controls[token]||Object.keys(e.controls).length>=2)return;touch(s);e.controls[token]=cls;add(e.support,cls,15*e.weight);}
function block(s,id,band,token,cls,damage){const e=s.enemies[id];if(!e||s.completed||!s.actors.includes(cls)||damage<=0)return;const blocks=e.blocks??={};if(blocks[band]||Object.values(blocks).some(v=>v.token===token)||Object.keys(blocks).length>=5)return;const points=3*e.weight*Math.min(1,damage/20);touch(s);blocks[band]={token,cls,points};add(e.support,cls,points);}
function objective(s,token,credits,points){if(s.completed||s.objectives[token])return false;const valid=Object.fromEntries(Object.entries(credits).filter(([cls,n])=>(s.actors.includes(cls)||cls==='_system')&&finite(n)>0)),total=sum(valid);if(!total)return false;touch(s);s.objectives[token]=Object.fromEntries(Object.entries(valid).map(([cls,n])=>[cls,n/total*finite(points)]));return true;}
function enemyScores(e){const out={...e.damage},support=sum(e.support),scale=Math.min(1,60*e.weight/Math.max(1,support)),progress=e.defeated?1:Math.min(1,e.progress/e.hp);for(const [cls,n] of Object.entries(e.support))add(out,cls,n*scale*progress);return out;}
function scores(s,id){const out={};for(const e of id?[s.enemies[id]].filter(Boolean):Object.values(s.enemies))for(const [cls,n] of Object.entries(enemyScores(e)))add(out,cls,n);if(!id)for(const o of Object.values(s.objectives))for(const [cls,n]of Object.entries(o))add(out,cls,n);for(const cls of Object.keys(out))out[cls]*=s.factors[cls]||1;return out;}
function apportion(amount,weights){const budget=Math.max(0,Math.floor(amount)),rows=Object.entries(weights).filter(([,n])=>finite(n)>0).sort(([a],[b])=>a.localeCompare(b)),total=rows.reduce((n,[,v])=>n+v,0);if(!total)return {};const exact=rows.map(([cls,n])=>({cls,value:Math.floor(budget*n/total),fraction:budget*n/total%1}));let left=budget-exact.reduce((n,r)=>n+r.value,0);for(const r of [...exact].sort((a,b)=>b.fraction-a.fraction||a.cls.localeCompare(b.cls))){if(left--<=0)break;r.value++;}return Object.fromEntries(exact.map(r=>[r.cls,r.value]));}
function reserve(s,amount,weights,caps={}){
 const n=Math.max(0,Math.min(Math.floor(amount),s.total-s.spent-s.forfeited));if(!n||!sum(weights))return {};
 const initial=apportion(n,weights),system=initial._system||0;delete initial._system;const grants={},players=Object.fromEntries(Object.entries(weights).filter(([cls,v])=>cls!=='_system'&&v>0));let left=n-system;
 while(left>0){const eligible=Object.fromEntries(Object.entries(players).filter(([cls])=>(caps[cls]??Infinity)>(grants[cls]||0)));if(!sum(eligible))break;const batch=apportion(left,eligible);let used=0;for(const[cls,v]of Object.entries(batch)){const accepted=Math.min(v,Math.max(0,(caps[cls]??Infinity)-(grants[cls]||0)));add(grants,cls,accepted);used+=accepted;}if(!used)break;left-=used;}
 touch(s);const paid=sum(grants);s.spent+=paid;s.forfeited+=n-paid;s.systemForfeited=(s.systemForfeited||0)+system;for(const[cls,v]of Object.entries(grants))add(s.paid,cls,v);return grants;
}
function reconcile(s){return {total:s.total,allocated:s.spent,forfeited:s.forfeited,pending:Math.max(0,s.total-s.spent-s.forfeited)};}
G.HonroContributionXP={VERSION,touch,create,enemy,damage,threat,heal,control,block,objective,scores,enemyScores,apportion,reserve,reconcile};
})(globalThis);
