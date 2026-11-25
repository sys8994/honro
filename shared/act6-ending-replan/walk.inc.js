// Walk only the disposable rendered clone. Never tick or rewrite the won battle.
function endingV2Walk({frame,b,node,sc,fork,size,stage,paint,sample}){
 const gate=frame.geo.gate,ground=b.terrain.find(t=>t.id===frame.geo.floor);
 const actors=b.units.filter(u=>u.side===0&&!u.summoned),ids=['knight','archer','mage','occultist'];
 if(!ground||actors.length!==4)return null;
 b.units=ids.map(cls=>actors.find(u=>u.cls===cls));
 if(b.units.some(u=>!u))return null;
 b.projectiles=[];b.fields=[];b.events=[];
 b.honroStage60Quiet=true;
 const portrait=size.w<size.h, starts=b.units.map((u,i)=>gate[0]-62-i*39);
 const distance=216, end=starts.map(x=>x+distance);
 const point=x=>G.HONRO_CORE.topAt(ground,x);
 if([...starts,...end].some(x=>!Number.isFinite(point(x))))return null;
 let position=0,prev=0,signature=null;
 function setup(p){
  for(const [i,u] of b.units.entries()){
   const x=starts[i]+distance*p;
   Object.assign(u,{x,y:point(x),moving:p>0&&p<1?.08:0,walking:0,facing:1,jumping:false,airborne:false,vx:0,vy:0,walkPhase:p*32});
  }
  const median=(b.units[0].x+b.units.at(-1).x)/2;
  sc.scale=portrait?Math.min(1.06,size.w/334):1.18;
  sc.x=median+(portrait?15:38);
  sc.y=point(median)-size.h*(portrait?.09:.13)/sc.scale;
  sc.walkTime=p*3.4;sc.time=2+p;
 }
 setup(0);
 function walk(p){
  if(typeof p!=='number'||p<prev||p>1||!node.isConnected)return false;
  const former=position;
  setup(p);try{paint();signature=sample(node);}catch{setup(former);return false;}
  if(!signature){setup(former);return false;}
  position=prev=p;return true;
 }
 return {walk,walked:()=>position,signature:()=>signature};
}
