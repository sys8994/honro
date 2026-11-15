(function(G){'use strict';
const S=G.HonroScene.prototype,base=S.terrain,live=S.liveWater;
S.terrain=function(c,t){if(!t.honroAct5Painted)return base.call(this,c,t);};
S.liveWater=function(c,b){
 live?.call(this,c,b);
 if(!G.HonroAct5.active(b))return;
 const mode=b.honroState.act5?.field,sites=b.honroMap.act5.sites;
 if([45,50].includes(b.honroStage)){
  const ground=sites.procession||sites.view;
  c.save();c.strokeStyle='#b2a7bb47';c.lineWidth=2.2;
  for(let i=0;i<13;i++){
   const x=(ground.x*.63+(this.time*19+i*173)%(b.width*.67)),y=ground.y-310-Math.sin(x/660)*105-i%3*31;
   c.beginPath();c.moveTo(x-10,y+13);c.quadraticCurveTo(x+3,y-9,x+13,y+3);c.stroke();
  }
  c.restore();
 }
 if(![46,47,48,49].includes(b.honroStage))return;
 c.save();
 for(const zone of b.physics?.regions||[]){
  if(!zone.projectileOnly)continue;
  const up=zone.gravityScale<0,span=up?zone.h:zone.h*.68;
  c.strokeStyle=up?'#a9c8d975':'#8598ac5b';c.lineWidth=2.6;
  c.beginPath();
  for(let i=0;i<19;i++){
   const x=zone.x+zone.w*(.15+(i%6)*.13)+Math.sin(i*1.6)*12;
   const y=zone.y+19+((this.time*(up?-145:205)+span*5+83*i)%span+span)%span;
   c.moveTo(x,y);c.lineTo(x+(up?4:-4),y+(up?-23:32));
  }
  c.stroke();
 }
 if(b.honroStage===48&&mode==='stable'){
  c.strokeStyle='#b7c9c873';c.lineWidth=2;c.beginPath();
  for(let i=0;i<13;i++){
   const x=sites.center.x-260+i*43,y=sites.center.y-480+(this.time*172+i*59)%427;
   c.moveTo(x,y);c.lineTo(x-1,y+21);
  }
  c.stroke();
 }
 const memory=b.honroState.act5||{step:0};
 for(const key of ['memory','stakeOne','stakeTwo','center']){
  const p=sites[key],step=b.honroMap.act5.flow.findIndex(r=>r[0]==='use'&&r[1]===key);
  if(!p||step<0||step>=memory.step||mode==='shutdown')continue;
  c.strokeStyle=mode==='reverse'?'#b88caa':'#a6c6b0';c.lineWidth=3;
  c.beginPath();c.moveTo(p.x,p.y);c.lineTo(p.x,p.y-53);c.moveTo(p.x-13,p.y-41);c.lineTo(p.x+13,p.y-41);c.stroke();
 }
 c.restore();
};
})(globalThis);
