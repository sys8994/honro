(function(G){'use strict';
// Data-only, deterministic accounting. No combat state or HeroProgress mutations.
const VERSION=4,finite=n=>Number.isFinite(n)?Math.max(0,n):0,sum=o=>Object.values(o||{}).reduce((n,v)=>n+finite(v),0);
const add=(o,k,n)=>{if(k&&finite(n)>0)o[k]=(o[k]||0)+n;};
function create(total,combat,actors,levels={}){
 const values=Object.values(levels).sort((a,b)=>a-b),median=values.length?values[Math.floor(values.length/2)]:1;
 return {version:VERSION,total:Math.round(total),combatLimit:Math.round(combat),actors:[...actors].sort(),factors:Object.fromEntries(actors.map(c=>[c,1+Math.min(.25,Math.max(0,median-(levels[c]||median))*.1)])),owners:{},enemies:{},objectives:{},objectiveEvidence:{},paid:{},spent:0,forfeited:0,combatSpent:0,completed:false};
}
function enemy(s,id,hp,weight=1){return s.enemies[id]??={id,hp:Math.max(1,finite(hp)),weight:Math.max(.01,finite(weight)),progress:0,damage:{},support:{},threats:{},wounds:{},controls:{},defeated:false,settled:false};}
function damage(s,id,liveProgress,actual,credits){const e=s.enemies[id];if(!e||s.completed)return 0;const progress=Math.min(e.hp,finite(liveProgress)),delta=Math.max(0,progress-e.progress);e.progress=Math.max(e.progress,progress);if(!delta||!actual)return 0;const total=sum(credits),scale=total>actual?actual/total:1;for(const [cls,n] of Object.entries(credits))if(s.actors.includes(cls))add(e.damage,cls,finite(n)*scale/actual*delta/e.hp*100*e.weight);return delta;}
// One high-water threat envelope per target and 10% enemy-HP progress band.
// Time, reloads and repeated equal-strength attacks cannot refill that envelope.
function threat(s,id,target,maxHp,hpBefore,loss,protections){const e=s.enemies[id];if(!e||s.completed)return;const band=Math.min(9,Math.floor(e.progress/e.hp*10)),key=target+':'+band,raw=sum(protections),danger=Math.min(finite(hpBefore),finite(loss)+raw),prior=e.threats[key]||0,delta=Math.max(0,danger-prior);e.threats[key]=Math.max(prior,danger);if(!delta||!danger)return;
 const scale=delta/danger,unit=100*e.weight/Math.max(1,maxHp),protectedAmount=Math.min(raw,Math.max(0,danger-loss));
 for(const [cls,n] of Object.entries(protections))if(s.actors.includes(cls))add(e.support,cls,n/Math.max(raw,1)*protectedAmount*scale*unit);
 const hurt=Math.min(loss,danger)*scale;if(hurt>0)(e.wounds[target]??=[]).push({hp:hurt,unit});
}
function heal(s,target,actual,cls){let left=finite(actual);if(!left||s.completed)return 0;let points=0;for(const e of Object.values(s.enemies))for(const w of e.wounds[target]||[]){const n=Math.min(left,w.hp);w.hp-=n;left-=n;if(s.actors.includes(cls)){add(e.support,cls,n*w.unit);points+=n*w.unit;}if(!left)break;}return points;}
function control(s,id,token,cls){const e=s.enemies[id];if(!e||s.completed||!s.actors.includes(cls)||e.controls[token]||Object.keys(e.controls).length>=2)return;e.controls[token]=cls;add(e.support,cls,15*e.weight);}
function objective(s,token,credits,points){if(s.completed||s.objectives[token])return false;const valid=Object.fromEntries(Object.entries(credits).filter(([cls,n])=>s.actors.includes(cls)&&finite(n)>0)),total=sum(valid);if(!total)return false;s.objectives[token]=Object.fromEntries(Object.entries(valid).map(([cls,n])=>[cls,n/total*finite(points)]));return true;}
function enemyScores(e){const out={...e.damage},support=sum(e.support),scale=Math.min(1,60*e.weight/Math.max(1,support)),progress=e.defeated?1:Math.min(1,e.progress/e.hp);for(const [cls,n] of Object.entries(e.support))add(out,cls,n*scale*progress);return out;}
function scores(s,id){const out={};for(const e of id?[s.enemies[id]].filter(Boolean):Object.values(s.enemies))for(const [cls,n] of Object.entries(enemyScores(e)))add(out,cls,n);if(!id)for(const o of Object.values(s.objectives))for(const [cls,n]of Object.entries(o))add(out,cls,n);for(const cls of Object.keys(out))out[cls]*=s.factors[cls]||1;return out;}
function apportion(amount,weights){const budget=Math.max(0,Math.floor(amount)),rows=Object.entries(weights).filter(([,n])=>finite(n)>0).sort(([a],[b])=>a.localeCompare(b)),total=rows.reduce((n,[,v])=>n+v,0);if(!total)return {};const exact=rows.map(([cls,n])=>({cls,value:Math.floor(budget*n/total),fraction:budget*n/total%1}));let left=budget-exact.reduce((n,r)=>n+r.value,0);for(const r of [...exact].sort((a,b)=>b.fraction-a.fraction||a.cls.localeCompare(b.cls))){if(left--<=0)break;r.value++;}return Object.fromEntries(exact.map(r=>[r.cls,r.value]));}
function reserve(s,amount,weights){const n=Math.max(0,Math.min(Math.floor(amount),s.total-s.spent-s.forfeited)),grants=n>0?apportion(n,weights):{};if(!Object.keys(grants).length)return {};s.spent+=n;for(const [cls,v]of Object.entries(grants))add(s.paid,cls,v);return grants;}
function reconcile(s){return {total:s.total,allocated:s.spent,forfeited:s.forfeited,pending:Math.max(0,s.total-s.spent-s.forfeited)};}
G.HonroContributionXP={VERSION,create,enemy,damage,threat,heal,control,objective,scores,enemyScores,apportion,reserve,reconcile};
})(globalThis);
