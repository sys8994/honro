
(function(G){'use strict';
const S=G.HonroScene.prototype,draw=S.landmark,paths=new WeakMap();
const VERTICAL_SCALE=2.65;
function strips(asset){
 let rows=paths.get(asset);if(rows)return rows;
 const map=asset.params.contactMapping;
 rows=map.slice(1).map(([u1,v1,x1,y1],i)=>{
  const [u0,v0,x0,y0]=map[i],sx=(x1-x0)/(u1-u0);
  // Align the traced face to two consecutive road points. Adjacent strips
  // agree at every height on their shared edge and retain the original fill.
  const slope=((y1-y0)-(v1-v0)*VERTICAL_SCALE)/(u1-u0);
  return {x0,x1,matrix:[sx,slope,0,VERTICAL_SCALE,x0-sx*u0,y0-slope*u0-v0*VERTICAL_SCALE]};
 });
 paths.set(asset,rows);return rows;
}
S.landmark=function(c,l){
 if(l.asset?.id!=='act3-handoff:21:bedrock')return draw.call(this,c,l);
 const b=this.battle,floor=b?.honroWorldTerrain?.find(t=>t.id==='a3-foundation')||b?.terrain?.find(t=>t.id==='a3-foundation');
 if(!floor||floor.broken)return;
 const raw=G.HonroVisualStyle.raw(c),rows=strips(l.asset),m=raw.getTransform();
 raw.save();
 const ps=G.HONRO_CORE.poly(floor);raw.beginPath();ps.forEach(({x,y},i)=>i?raw.lineTo(x,y):raw.moveTo(x,y));raw.closePath();raw.clip();
 const minX=-m.e/m.a,maxX=(raw.canvas.width-m.e)/m.a;
 for(const {x0,x1,matrix} of rows){
  if(x1<minX||x0>maxX)continue;
  const px=x=>m.a?(Math.round(x*m.a+m.e)-m.e)/m.a:x;
  const left=px(x0),right=px(x1);
  raw.save();raw.beginPath();raw.rect(left,0,right-left,b.height+1600);raw.clip();raw.transform(...matrix);
  G.HonroVectorArt.draw(raw,l.asset,{x:0,y:0});raw.restore();
 }
 raw.restore();
};
})(globalThis);
