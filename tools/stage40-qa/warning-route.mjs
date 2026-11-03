/** React only to an already rendered current warning, not future enemy plans. */
export function currentWarnings(b){return b.units.filter(u=>u.side===1&&!u.dead).map(u=>({source:u.id,target:u.honroPilotCombat?.target})).filter(x=>x.target?.seen);}
export function warningEscapeGoal(e,u,{surface,separated}){
 const threats=currentWarnings(e.b).filter(x=>Math.hypot(u.x-x.target.x,(u.y-u.h*.5)-x.target.y)<230);
 if(!threats.length)return null;const support=surface(u),connected=new Set(['approved40-departure-ramp','a4-return-deck']),options=[];
 for(const dx of [-270,270,-190,190]){const x=u.x+dx,f=e.contactSurface(x,u.y-320,u.y+320);if(!f)continue;const id=f.t.id,y=f.y;
  if(id!==support&&!(connected.has(id)&&connected.has(support)))continue;
  if(Math.hypot(dx,y-u.y)>u.moveLeft-60||!separated(e.b,u,x,y,12))continue;
  if(threats.some(x0=>Math.hypot(x-x0.target.x,(y-u.h*.5)-x0.target.y)<230))continue;
  options.push({x,y,kind:'seen-warning-evade',sources:threats.map(t=>t.source),support:id});
 }
 // Prefer supported uphill space; never create a jump/drop/teleport to escape.
 return options.sort((a,z)=>a.y-z.y||Math.abs(a.x-u.x)-Math.abs(z.x-u.x))[0]||null;
}
