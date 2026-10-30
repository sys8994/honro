/** Conservative per-App-frame provenance; raw distance is never silently relabeled effective. */
const categories=['normalGround','qualifiedJump','qualifiedDrop','pendingEpisode','scriptedOrGate','involuntaryOrSkill','unclassified'];
export const movementAudit=()=>({version:1,classification:'conservative-intent-and-landing-qualified; unclassified is not acceptance evidence',categories:Object.fromEntries(categories.map(k=>[k,{dx:0,dy:0,frames:0}]))});
const add=(a,key,dx,dy,frames=1)=>{const row=a.categories[key];row.dx+=dx;row.dy+=dy;row.frames+=frames;};
export function auditFrame(a,p,v,{episode,commandedProgress=false}={}){
 const dx=Math.abs(v.x-p.x),dy=Math.abs(v.y-p.y);let category;
 if(v.recoveries!==p.recoveries||v.gateTurn!==p.gateTurn||v.recovering||p.recovering){category='scriptedOrGate';if(episode)episode.invalidMovement=true;}
 else if(v.airborne||p.airborne||v.specialMotion||p.specialMotion){category='involuntaryOrSkill';if(episode)episode.invalidMovement=true;}
 else if(episode){category='pendingEpisode';episode.audit??={dx:0,dy:0,frames:0};episode.audit.dx+=dx;episode.audit.dy+=dy;episode.audit.frames++;}
 else if(commandedProgress&&p.grounded&&v.grounded)category='normalGround';else category='unclassified';
 add(a,category,dx,dy);return category;
}
export function closeEpisode(a,episode,qualifiedKind){
 const d=episode?.audit;if(!d)return;add(a,'pendingEpisode',-d.dx,-d.dy,-d.frames);
 add(a,!episode.invalidMovement&&qualifiedKind==='jump'?'qualifiedJump':!episode.invalidMovement&&qualifiedKind==='drop'?'qualifiedDrop':'unclassified',d.dx,d.dy,d.frames);episode.measuredDistance={...d};delete episode.audit;
}
export function walkOffStart(p,v,intent,actorId,hasEpisode){
 if(!p.grounded||v.grounded||hasEpisode||intent?.actor!==actorId||intent.step?.kind!=='walk-off')return null;
 return {x:p.x,y:p.y,support:p.support,supportFace:p.supportFace,kind:'walk-off',goal:intent.step.to,routeLeg:intent.step};
}
