/** Pure controller planner, not game logic or gameplay acceptance. */
export function freezePlan({round,upperWest,lowerWest,idleRounds=0}) {
 const total=upperWest+lowerWest,phase=idleRounds>=2?'pause':total===0?'east':'west';
 return Object.freeze({round,upperWest,lowerWest,total,phase});
}
export function decision(plan,{cls,support,x}) {
 const lower=cls==='knight'||cls==='occultist',lane=lower?'lower':'upper';
 if(plan.phase==='pause')return {action:'pause',lane,drop:false};
 if(plan.phase==='east')return {action:'approach',lane,drop:false,goal:({archer:5850,mage:5600,knight:4800,occultist:4400})[cls],phase:'east'};
 if(lower){const groundedLow=support==='approved31-low-flank';return {action:'approach',lane,goal:groundedLow?(cls==='knight'?2450:2100):1810,drop:!groundedLow&&support==='approved31-entry'&&x>=1800&&x<1830,phase:'west'};}
 return {action:'approach',lane,drop:false,goal:plan.total<=8||plan.round>=3?(cls==='archer'?2450:2750):(cls==='archer'?315:600),phase:'west'};
}
/** Manual R10 continuation: exact inspected survivors/remaining targets. */
export function cleanupDecision({cls,support,x,enemyIds}){
 if(cls==='archer')return support==='approved31-upper-east'?{action:'approach',lane:'upper',goal:6098,drop:x>=6090&&x<=6110,phase:'manual-safe-stairs'}:{action:'approach',lane:'return',goal:5760,drop:false,phase:'manual-return-fire'};
 if(cls==='knight')return{action:'approach',lane:'lower',goal:enemyIds.includes('pilot31-lookout-return-5')?4480:enemyIds.includes('pilot31-lookout-return-2')?3900:5200,drop:false,phase:'manual-lower-cleanup'};
 return{action:'pause',drop:false};
}
export function westTwoCleanup(plan,actor,guardAlive){
 if(plan.phase==='east'||!['knight','occultist'].includes(actor.cls))return decision(plan,actor);
 return{action:'approach',lane:'lower',drop:false,phase:'manual-west-two',goal:actor.cls==='knight'?(guardAlive?2840:3070):(guardAlive?2700:2900)};
}
export function pursuingDecision(plan,actor,targets){
 const base=decision(plan,actor),lower=['knight','occultist'].includes(actor.cls);if(!lower||plan.phase==='pause')return base;
 const eligible=targets.filter(t=>!t.dead&&t.y>2200&&(plan.phase==='west'?t.id.includes('west-'):!t.id.includes('west-')));
 if(!eligible.length||plan.phase==='west'&&plan.upperWest>0)return base;
 const candidates=eligible.sort((a,z)=>(a.role==='bind'?500:0)+Math.abs(a.x-actor.x)-(z.role==='bind'?500:0)-Math.abs(z.x-actor.x));const t=candidates[0];
 const side=t.x>=actor.x?1:-1,distance=actor.cls==='knight'?60:450,desired=t.x-side*distance;
 return{action:'approach',lane:'lower',phase:plan.phase,drop:false,target:t.id,targetPosition:{x:t.x,y:t.y},goal:Math.max(actor.x-1000,Math.min(actor.x+1000,desired)),maxAdvance:1000};
}
/** Upper duo joins east return through previously verified x6098 drop, not over rock mass. */
export function coordinatedCleanup(plan,actor,targets,allies=[]){
 const base=pursuingDecision(plan,actor,targets);if(plan.phase!=='east'||!['archer','mage'].includes(actor.cls))return base;
 if(actor.support!=='approved31-east-return'&&actor.support!=='approved31-low-flank'&&!allies.some(u=>u.cls==='knight'&&!u.dead&&u.x>=5100&&u.support==='approved31-east-return'))return base;
 if(actor.support!=='approved31-east-return'&&actor.support!=='approved31-low-flank')return{action:'approach',lane:'upper',phase:'east-safe-stairs',goal:6098,drop:actor.support==='approved31-upper-east'&&actor.x>=6090&&actor.x<=6110};
 const ts=targets.filter(t=>!t.dead&&t.y>1900).sort((a,z)=>Math.abs(a.x-actor.x)-Math.abs(z.x-actor.x));const t=ts[0];if(!t)return{...base,goal:actor.x};
 const desired=Math.min(6000,t.x+(actor.cls==='mage'?500:350));return{action:'approach',lane:'return',phase:'east-crossfire',goal:Math.max(actor.x-1000,Math.min(actor.x+1000,desired)),drop:false,target:t.id,maxAdvance:1000};
}
