/** Pure aggregation: failures and limits remain observations, never fabricated clears. */
export const OUTCOMES=['clear','defeat','timeout','error','cancelled','round-limit'];
export function summarize(rows,thresholds=null){
 const groups={};
 for(const r of rows){if(!OUTCOMES.includes(r.outcome))throw Error('Unknown outcome');const key=JSON.stringify([r.sourceHash,r.controllerHash??'unknown-controller',r.stage,r.policy,r.evaluation?.kind??'unclassified-purpose',r.cohortIdentity?.id??'unclassified-cohort',r.maxFrames??'unknown-frame-budget',r.maxWallSeconds??'unknown-wall-budget']);(groups[key]??=[]).push(r);}
 const technicalErrors=rows.filter(r=>['error','cancelled'].includes(r.outcome)),qualityBlockers=technicalErrors.filter(r=>(r.evaluation?.kind==='frozen-holdout'||r.requestedEvaluation?.kind==='frozen-holdout')).map(r=>({runId:r.runId,reason:'Technical error inside requested holdout; approval blocked'}));
 return {schema:'honro-quantitative-summary/v2',allAttempts:rows.length,technicalErrors:technicalErrors.length,normalPolicyFailures:rows.filter(r=>['defeat','timeout','round-limit'].includes(r.outcome)).length,unclassifiedAttempts:rows.filter(r=>!r.protocolRecorded||!r.cohortIdentity?.id).length,qualityBlockers,groups:Object.entries(groups).map(([key,rs])=>{
  const counts=Object.fromEntries(OUTCOMES.map(k=>[k,rs.filter(r=>r.outcome===k).length]));
  const rounds=rs.filter(r=>r.outcome==='clear').map(r=>r.round).sort((a,b)=>a-b),n=rounds.length;
  const normal=rs.length-counts.error-counts.cancelled;
  const seeds=rs.filter(r=>Number.isInteger(r.seed)).map(r=>r.seed),uniqueSeeds=new Set(seeds).size;
  return {key,cohort:{sourceHash:rs[0].sourceHash,controllerHash:rs[0].controllerHash??null,stage:rs[0].stage,policy:rs[0].policy,evaluation:rs[0].evaluation?.kind??null,cohortId:rs[0].cohortIdentity?.id??null,protocolRecorded:!!rs[0].protocolRecorded,maxFrames:rs[0].maxFrames??null,maxWallSeconds:rs[0].maxWallSeconds??null},uniqueSeeds,repeatedSeedAttempts:seeds.length-uniqueSeeds,independentSamplingEstablished:false,started:rs.length,counts,clearRateAll:n/rs.length,normalExecutions:normal,clearRateNormal:normal?n/normal:null,clearRounds:{n,mean:n?rounds.reduce((a,b)=>a+b,0)/n:null,median:n?(rounds[Math.floor((n-1)/2)]+rounds[Math.floor(n/2)])/2:null},runs:rs};
 }),gate:qualityBlockers.length?{status:'blocked',reason:'Technical errors in requested holdout; preserve the complete preregistered denominator.'}:thresholds?{status:'blocked',reason:'Threshold evaluation is not implemented; do not infer acceptance from summaries.'}:{status:'blocked',reason:'No reviewed, frozen design targets supplied.'},limits:['Policy-model evidence, not human difficulty or fun approval.','Wall execution seconds are not human play time.','Repeated identical policy seeds are not independent samples.']};
}
export function rng(seed){let s=seed>>>0;return()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;};}
