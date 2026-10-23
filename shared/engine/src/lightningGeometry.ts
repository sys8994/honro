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
type Point={x:number;y:number};
const pathCache=new Map<string,{trunk:Point[];forks:Point[][];twigs:Point[][]}>();
export function cheonroeLightningPaths(x:number,y:number,x2:number,y2:number,phase:number,seed:number){
 const key=[x,y,x2,y2,phase,seed].join(':');const cached=pathCache.get(key);if(cached)return cached;
 // Domain-separated visual samples never consume the simulation RNG.
 const sample=(domain:number,index=0)=>mix(seed^Math.imul(phase+1,0x9e3779b1)^Math.imul(domain,0x85ebca6b)^Math.imul(index+1,0xc2b2ae35))/4294967296;
 const dx=x2-x,dy=y2-y,len=Math.hypot(dx,dy)||1,n=Math.max(8,Math.min(40,Math.ceil(len/40))),nx=-dy/len,ny=dx/len;
 const amp=Math.min(11,Math.max(2,len*.019))*(.82+sample(1)*.36);
 const spans=Array.from({length:n},(_,i)=>.45+sample(2,i)*1.1),total=spans.reduce((a,b)=>a+b,0);
 let distance=0,side=sample(3)<.5?-1:1;const trunk=[{x,y}],fractions=[0];
 for(let i=1;i<n;i++){
  distance+=spans[i-1];const q=distance/total;
  if(sample(4,i)<.32)side=-side;
  const off=side*(.3+sample(5,i)*.7)*amp*Math.sin(Math.PI*q);
  trunk.push({x:x+dx*q+nx*off,y:y+dy*q+ny*off});fractions.push(q);
 }
 trunk.push({x:x2,y:y2});fractions.push(1);
 const at=(q:number)=>{let i=0;while(i<n-1&&fractions[i+1]<q)i++;const t=(q-fractions[i])/(fractions[i+1]-fractions[i]);return{x:trunk[i].x+(trunk[i+1].x-trunk[i].x)*t,y:trunk[i].y+(trunk[i+1].y-trunk[i].y)*t};};
 const count=18+Math.floor(sample(6)*5),secondary=10+Math.floor(sample(7)*5),forks:Point[][]=[],twigs:Point[][]=[];
 const levels=Array.from({length:count},(_,i)=>.12+sample(8,i)*.79).sort((a,b)=>a-b);
 const twigged=new Set(Array.from({length:count},(_,i)=>i).sort((a,b)=>sample(9,a)-sample(9,b)).slice(0,secondary));
 for(let i=0;i<count;i++){
  const q=levels[i],origin=at(q),side=sample(10,i)<.52?-1:1;
  const reach=Math.min(83,len*.145)*(.25+sample(11,i)*.75),down=Math.min(len*(1-q)*.85,Math.min(75,len*.13)*(.24+sample(12,i)*.76));
  const point=(across:number,forward:number)=>({x:origin.x+nx*side*reach*across+dx/len*down*forward,y:origin.y+ny*side*reach*across+dy/len*down*forward});
  const fork=[origin,point(.35,.18),point(.55,.55),point(.84,.68),point(1,1)];forks.push(fork);
  if(twigged.has(i)){
   const a=fork[2],r=reach*(.16+sample(13,i)*.14),d=down*(.3+sample(14,i)*.25);
   twigs.push([a,{x:a.x+nx*side*r*.32+dx/len*d*.62,y:a.y+ny*side*r*.32+dy/len*d*.62},{x:a.x+nx*side*r+dx/len*d,y:a.y+ny*side*r+dy/len*d}]);
  }
 }
 const result={trunk,forks,twigs};pathCache.set(key,result);if(pathCache.size>96)pathCache.delete(pathCache.keys().next().value!);return result;
}
