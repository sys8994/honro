/** Pure aggregation: failures and limits remain observations, never fabricated clears. */
export const OUTCOMES=['clear','defeat','timeout','error','cancelled','round-limit'];
export function summarize(rows,thresholds=null){
 const groups={};
 for(const r of rows){if(!OUTCOMES.includes(r.outcome))throw Error('Unknown outcome');const key=[r.sourceHash,r.stage,r.policy].join(':');(groups[key]??=[]).push(r);}
 return {schema:'honro-quantitative-summary/v1',groups:Object.entries(groups).map(([key,rs])=>{
  const counts=Object.fromEntries(OUTCOMES.map(k=>[k,rs.filter(r=>r.outcome===k).length]));
  const rounds=rs.filter(r=>r.outcome==='clear').map(r=>r.round).sort((a,b)=>a-b),n=rounds.length;
  const normal=rs.length-counts.error-counts.cancelled;
  return {key,started:rs.length,counts,clearRateAll:n/rs.length,normalExecutions:normal,clearRateNormal:normal?n/normal:null,clearRounds:{n,mean:n?rounds.reduce((a,b)=>a+b,0)/n:null,median:n?(rounds[Math.floor((n-1)/2)]+rounds[Math.floor(n/2)])/2:null},runs:rs};
 }),gate:thresholds?{status:'blocked',reason:'Threshold evaluation is not implemented; do not infer acceptance from summaries.'}:{status:'blocked',reason:'No reviewed, frozen design targets supplied.'},limits:['Policy-model evidence, not human difficulty or fun approval.','Wall execution seconds are not human play time.','Repeated identical policy seeds are not independent samples.']};
}
export function rng(seed){let s=seed>>>0;return()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;};}
