/** M05-only geometry. Visual hashing never consumes the battle RNG. */
function mix(value:number){
 value=Math.imul(value^(value>>>16),0x7feb352d);
 value=Math.imul(value^(value>>>15),0x846ca68b);
 return (value^(value>>>16))>>>0;
}
export function cheonroeVisualSeed(strike:number,target:string){
 let hash=2166136261;
 for(const char of `${strike}:${target}`)hash=Math.imul(hash^char.charCodeAt(0),16777619);
 return mix(hash);
}
export function cheonroeLightningPaths(x:number,y:number,x2:number,y2:number,phase:number,seed:number){
 // Domain-separated samples: adjacent targets/segments cannot just shift one sine path.
 const sample=(domain:number,index=0)=>mix(seed^Math.imul(phase+1,0x9e3779b1)^Math.imul(domain,0x85ebca6b)^Math.imul(index+1,0xc2b2ae35))/4294967296;
 const dx=x2-x,dy=y2-y,len=Math.hypot(dx,dy)||1,n=Math.max(8,Math.min(64,Math.ceil(len/28))),nx=-dy/len,ny=dx/len;
 const amp=Math.min(48,Math.max(11,len*.075))*(.82+sample(1)*.36);
 const spans=Array.from({length:n},(_,i)=>.45+sample(2,i)*1.1),total=spans.reduce((a,b)=>a+b,0);
 let distance=0,side=sample(3)<.5?-1:1;
 const trunk=[{x,y}];
 for(let i=1;i<n;i++){
  distance+=spans[i-1];const q=distance/total;
  if(sample(4,i)<.78)side=-side;
  const off=side*(.3+sample(5,i)*.7)*amp*Math.sin(Math.PI*q);
  trunk.push({x:x+dx*q+nx*off,y:y+dy*q+ny*off});
 }
 trunk.push({x:x2,y:y2});
 const forks:{x:number;y:number}[][]=[];
 for(let i=0;i<6;i++){
  // Six stratified but independently displaced origins; asymmetric directions.
  const index=Math.max(1,Math.min(n-1,Math.floor(n*(.12+i*.125+sample(6,i)*.09)))),at=trunk[index];
  const side=sample(7,i)<.5?-1:1,reach=Math.min(155,len*.24)*.6*(.85+sample(8,i)*.3),forward=.18+sample(9,i)*.44;
  const ex=at.x+dx/len*reach*forward+nx*reach*side,ey=at.y+dy/len*reach*forward+ny*reach*side;
  forks.push(Array.from({length:6},(_,j)=>{
   const q=j/5,off=j===0||j===5?0:(sample(10+i,j)*2-1)*reach*.17;
   return {x:at.x+(ex-at.x)*q+nx*off,y:at.y+(ey-at.y)*q+ny*off};
  }));
 }
 return {trunk,forks};
}
