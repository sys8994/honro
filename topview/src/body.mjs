// The ground anchor stays at the feet. Projectiles use a plane raised to bow height.
// Dimensions below are measured inside the painted pose cells in map pixels.
export const bowPlane = 26;
const bodies = {
  seolo: [64, .55, .16, .30], woodcutter: [42, .54, .20, .30],
  hound: [63, .36, .16, .20], boar: [70, .37, .20, .21],
  stag: [75, .43, .17, .19], crow: [46, .33, .26, .15],
  bat: [40, .29, .28, .13], ghost: [60, .48, .14, .25]
};
export const spriteSize = kind => bodies[kind][0];
export function actorKind(u) {
  return u.id==='npc-woodcutter'?'woodcutter':u.side===0?'seolo':u.honroVariant||u.honroType;
}
export function actorBody(u) {
  const kind=actorKind(u),[size,chest,width,height]=bodies[kind]||bodies.ghost;
  const lift=!u.dead&&(kind==='crow'||kind==='bat')?12:0;
  const heading=u.tvHeading,side=heading?Math.abs(heading.x):1;
  const broad=['hound','boar','stag'].includes(kind)?1+.55*side:1;
  return {kind,size,lift,chest:size*chest+lift,rx:size*width*broad,ry:size*height};
}
export function strikeVolume(u,projection) {
  const b=actorBody(u),offset=projection.inverse(b.rx,bowPlane-b.chest),extent=projection.inverse(b.rx,b.ry);
  return {x:u.x,y:u.y-u.h*.5+offset.y,rx:extent.x,ry:extent.y};
}
export function sweptTorso(a,z,v,r) {
  const rx=v.rx+r,ry=v.ry+r,dx=(z.x-a.x)/rx,dy=(z.y-a.y)/ry,x=(a.x-v.x)/rx,y=(a.y-v.y)/ry;
  const len=dx*dx+dy*dy,dot=x*dx+y*dy,c=x*x+y*y-1,disc=dot*dot-len*c;
  if(!len||disc<0||c>0&&dot>=0)return null;
  const t=c<=0?0:(-dot-Math.sqrt(disc))/len;
  if(t<0||t>1)return null;
  const nx=(x+t*dx)/rx,ny=(y+t*dy)/ry,n=Math.hypot(nx,ny)||1;
  return {x:a.x+t*(z.x-a.x),y:a.y+t*(z.y-a.y),t,n:{x:nx/n,y:ny/n}};
}
