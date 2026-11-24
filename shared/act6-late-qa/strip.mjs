const assert=(v,m='invalid native sweep surface')=>{if(!v)throw Error(m);};
export function buildStrip(e,C){
 const t=e.b.terrain.find(v=>v.id==='finale-cutout-near-body');
 assert(t&&!t.broken);
 const radius=13, footprint=[];
 for(let x=3295;x>=3043;x-=12){
  const top=C.topAt(t,x), support=e.contactSurface(x,top-2,top+2);
  assert(support?.t.id===t.id&&Math.abs(top-support.y)<1e-5);
  footprint.push({x,y:support.y-22,ground:support.y,support:t.id});
 }
 for(let i=1;i<footprint.length;i++){
  const a=footprint[i-1],z=footprint[i];
  assert(e.projectileCollision(a,z,radius,'qa-immediate-bridge-threat',[],false)==null,'sweep intersects terrain '+JSON.stringify([a,z]));
 }
 return {owner:'qa-immediate-bridge-threat',footprint,radius};
}
export function contacts(e,strip){
 const out=[];
 for(const u of e.b.units){
  if(u.side!==0||u.dead||u.hp<=0||u.summoned||u.honroVisualOnly||!e.attackAllows(u,strip.owner))continue;
  for(let i=1;i<strip.footprint.length;i++){
   const a=strip.footprint[i-1],z=strip.footprint[i], hit=e.damageSweep(u,a,z,strip.radius);
   if(hit){out.push({u,index:i,contact:{x:a.x+(z.x-a.x)*hit.t,y:a.y+(z.y-a.y)*hit.t}});break;}
  }
 }
 return out;
}
