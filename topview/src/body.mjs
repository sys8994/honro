// The ground anchor stays at the feet. Projectiles use a plane raised to bow height.
// Dimensions below are measured inside the painted pose cells in map pixels.
export const bowPlane = 26;
const bodies = {
  damheo:[64,.54,.16,.30],hwigyeom:[66,.55,.17,.31],sodan:[60,.52,.16,.29],
  porter:[61,.51,.20,.27],medium:[60,.52,.19,.27],villager:[58,.50,.18,.29],villager_woman:[57,.50,.19,.27],
  possessed:[62,.53,.19,.28],mourner:[64,.49,.22,.27],shade:[66,.52,.19,.30],lantern:[35,.54,.25,.28],
  warden:[76,.50,.19,.31],ferry_warden:[80,.52,.24,.33],pier_warden:[78,.45,.30,.29],
  empty_bier:[77,.48,.43,.31],funeral_bier:[72,.46,.44,.30],litter:[42,.44,.77,.25],
  binding:[52,.52,.20,.30],ruin_gate:[82,.44,.64,.32],
  seolo: [64, .55, .16, .30], woodcutter: [42, .54, .20, .30],
  hound: [63, .36, .16, .20], boar: [70, .37, .20, .21],
  stag: [75, .43, .17, .19], crow: [46, .33, .26, .15],
  bat: [40, .29, .28, .13], ghost: [60, .48, .14, .25]
};
export const spriteSize = kind => bodies[kind][0];
export function actorKind(u) {
  if(u.id==='npc-woodcutter')return 'woodcutter';
  if(u.honroObjectiveTarget)return 'binding';
  if(u.id==='midboss-stage3')return 'ferry_warden';
  if(u.id==='midboss-stage6')return 'pier_warden';
  if(u.name==='설오'||u.side===0&&u.cls==='archer')return 'seolo';
  if(u.name==='담허'||u.side===0&&u.cls==='mage')return 'damheo';
  if(u.name==='휘겸'||u.side===0&&u.cls==='knight')return 'hwigyeom';
  if(u.name==='소단'||u.side===0&&u.cls==='occultist')return 'sodan';
  if(['점복무녀','연실','춘례'].includes(u.name))return 'medium';
  if(u.name?.includes('도깨비불')||u.name==='시종 꼭두')return 'lantern';
  const kind=u.honroVariant||u.honroType;
  if(kind==='bier')return u.side===1?'empty_bier':'funeral_bier';
  if(kind==='ally')return u.allyRole==='porter'||u.name==='백산'?'porter':u.name==='월이'?'villager_woman':'villager';
  return ({civilian:'litter',gate:'ruin_gate',human:'possessed'})[kind]||(bodies[kind]?kind:'ghost');
}
export function actorBody(u) {
  const kind=actorKind(u),[size,chest,width,height]=bodies[kind]||bodies.ghost;
  const lift=!u.dead&&(kind==='crow'||kind==='bat'||kind==='lantern')?12:0;
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
