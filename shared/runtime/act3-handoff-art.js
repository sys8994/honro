
(function(G){'use strict';
const S=G.HonroScene.prototype,draw=S.landmark,paths=new WeakMap();
const D=G.HonroTerrainDomain,landmarks=D.materialLandmarks,viewCache=new WeakMap();

function support(b,asset){
 const id=asset.params.terrainId||'a3-foundation';
 return D.render(b).find(t=>t.id===id&&!t.broken)||b.terrain.find(t=>t.id===id&&!t.broken);
}

D.materialLandmarks=function(b){
 const base=landmarks(b);
 if(b.honroCustom||!b.honroCanonical||b.honroStage<21||b.honroStage>30)return base;
 const project=G.HONRO_PROJECT,artId=project?.stages.find(s=>s.metadata?.stageId===b.honroStage)?.design?.act3HandoffArt;
 if(!artId)return base;
 const old=viewCache.get(b);
 if(old?.base===base&&old.artId===artId)return old.result;
 const asset=project.library.find(a=>a.id===artId);
 if(!asset)return base;
 const floor=support(b,asset);
 if(!floor)return base;
 const vertices=G.HONRO_CORE.poly(floor);
 if(!asset.params.contactMapping.every(([, ,x,y])=>vertices.some(p=>Math.abs(p.x-x)<.01&&Math.abs(p.y-y)<.01)))return base;
 // Resolve art from the loaded chapter, never serialize it in a battle.
 const placement={id:artId,kind:'canonical-element',asset,x:0,y:0,scale:1,layer:'front',depthLayer:'L1'};
 const result=[...base.filter(l=>l.asset?.id!==artId),placement];
 viewCache.set(b,{base,artId,result});return result;
};

function strips(asset){
 let rows=paths.get(asset);if(rows)return rows;
 const map=asset.params.contactMapping,verticalScale=asset.params.verticalScale??2.65;
 rows=map.slice(1).map(([u1,v1,x1,y1],i)=>{
  const [u0,v0,x0,y0]=map[i],sx=(x1-x0)/(u1-u0);
  // Align the traced face to two consecutive road points. Adjacent strips
  // agree at every height on their shared edge and retain the original fill.
  const slope=((y1-y0)-(v1-v0)*verticalScale)/(u1-u0);
  return {x0,x1,y0,y1,u0,u1,v0,v1,tiles:new Map(),matrix:[sx,slope,0,verticalScale,x0-sx*u0,y0-slope*u0-v0*verticalScale]};
 });
 paths.set(asset,rows);return rows;
}
// Isolate each painted section so its transparent edge reveals the native
// cliff. Cache the resolved vector at two display densities, independent of pan.
function faceTile(asset,row,density){
 if(row.tiles.has(density))return row.tiles.get(density);
 const {x0,x1,y0,y1,u0,u1,v0,v1,matrix}=row;
 const [,sourceY,,sourceHeight]=asset.params.sourceViewBox;
 const bottom=sourceY+sourceHeight;
 const top=Math.floor(Math.min(y0,y1))-2;
 const height=Math.ceil(Math.max(y0,y1)-top+(bottom-Math.min(v0,v1))*matrix[3])+2;
 const canvas=document.createElement('canvas');
 canvas.width=Math.ceil((x1-x0)*density);canvas.height=Math.ceil(height*density);
 const ctx=canvas.getContext('2d');
 const sx=canvas.width/(x1-x0),sy=canvas.height/height;
 ctx.setTransform(sx,0,0,sy,-x0*sx,-top*sy);
 ctx.transform(...matrix);
 G.HonroVectorArt.draw(ctx,asset,{x:0,y:0});
 ctx.globalCompositeOperation='destination-in';
 const fade=ctx.createLinearGradient(0,bottom-33,0,bottom-2);
 fade.addColorStop(0,'#000');fade.addColorStop(1,'#0000');
 ctx.fillStyle=fade;ctx.fillRect(u0,-2000,u1-u0,bottom+2100);
 if(asset.params.edgeFade){
  ctx.setTransform(sx,0,0,sy,-x0*sx,-top*sy);
  const [left,right]=asset.params.edgeFade;
  if(right&&x1>right[0]){
   const gradient=ctx.createLinearGradient(right[0],0,right[1],0);
   gradient.addColorStop(0,'#000');gradient.addColorStop(1,'#0000');
   ctx.fillStyle=gradient;ctx.fillRect(x0,top,x1-x0,height);
  }
  if(left&&x0<left[1]){
   const gradient=ctx.createLinearGradient(left[0],0,left[1],0);
   gradient.addColorStop(0,'#0000');gradient.addColorStop(1,'#000');
   ctx.fillStyle=gradient;ctx.fillRect(x0,top,x1-x0,height);
  }
 }
 const tile={canvas,top,height};row.tiles.set(density,tile);return tile;
}

S.landmark=function(c,l){
 if(!l.asset?.id?.startsWith('act3-handoff:')||!l.asset.params?.contactMapping)return draw.call(this,c,l);
 const b=this.battle,asset=l.asset,floor=b&&support(b,asset);
 if(!floor)return;
 const raw=G.HonroVisualStyle.raw(c),rows=strips(l.asset),m=raw.getTransform();
 raw.save();
 const ps=G.HONRO_CORE.poly(floor);raw.beginPath();ps.forEach(({x,y},i)=>i?raw.lineTo(x,y):raw.moveTo(x,y));raw.closePath();raw.clip();
 const minX=-m.e/m.a,maxX=(raw.canvas.width-m.e)/m.a;
 const px=x=>(Math.round(x*m.a+m.e)-m.e)/m.a;
 for(const row of rows){
  const {x0,x1,matrix}=row;
  if(x1<minX||x0>maxX)continue;
  const left=px(x0),right=px(x1);
  if(right<=left)continue;
  if(asset.params.blendFace){
   const tile=faceTile(asset,row,m.a>1?1.15:.72);
   raw.drawImage(tile.canvas,left,tile.top,right-left,tile.height);
   continue;
  }
  raw.save();raw.beginPath();raw.rect(left,0,right-left,b.height+1600);raw.clip();raw.transform(...matrix);
  G.HonroVectorArt.draw(raw,l.asset,{x:0,y:0});raw.restore();
 }
 raw.restore();
};
})(globalThis);
