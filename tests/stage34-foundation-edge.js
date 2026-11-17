(function(G){'use strict';
// Only the imported non-play foundation's artificial right/bottom canvas edge.
// Keep every source path, interior pixel and authored silhouette unchanged.
if(G.HonroStage34FoundationEdge)return;
const ID='approved34:coastal-foundation',MAX_PIXELS=8388608;
let column=null,row=null;const tiles=[];const stats={eligibleTiles:0,draws:0,columns:0,rows:0,allocations:0,bytes:0,peakBytes:0,fallbacks:0,lastFallback:null};
const fail=reason=>{stats.fallbacks++;stats.lastFallback=reason;return false;};
function strip(existing,w,h){if(!existing){existing=typeof G.OffscreenCanvas==='function'?new G.OffscreenCanvas(w,h):G.document?.createElement('canvas');if(!existing)return null;stats.allocations++;}if(existing.width!==w)existing.width=w;if(existing.height!==h)existing.height=h;return existing;}
function draw(c,l,b){
 if(b?.honroStage!==34||b?.honroCustom||l?.asset?.id!==ID)return false;
 if(l.x!==-1536||l.y!==-256||(l.scale??1)!==1||(l.rotation??0)!==0||l.asset.params?.nonplayEnvironment!==true||l.asset.params?.silhouetteUnderpaint!==false)return fail('unexpected-source-or-placement');
 const m=c.getTransform(),W=c.canvas?.width,H=c.canvas?.height;
 if(!Number.isInteger(W)||!Number.isInteger(H)||W<1||H<1||W*H>MAX_PIXELS||m.a<=0||m.d<=0||m.b!==0||m.c!==0)return fail('unsupported-device-transform');
 const right=m.a*7680+m.e,bottom=m.d*5888+m.f;
 if(!Number.isFinite(right)||!Number.isFinite(bottom))return fail('invalid-boundary');
 const x=Math.floor(right),y=Math.floor(bottom),hasColumn=x>=0&&x<W&&right-x>1e-7&&1-(right-x)>1e-7,hasRow=y>=0&&y<H&&bottom-y>1e-7&&1-(bottom-y)>1e-7;
 stats.eligibleTiles++;if(tiles.length<64)tiles.push({W,H,m:[m.a,m.b,m.c,m.d,m.e,m.f],right,bottom,hasColumn,hasRow});
 if(!hasColumn&&!hasRow)return false;
 let cc,rc;
 try{
  if(hasColumn){column=strip(column,1,H);cc=column?.getContext('2d');if(!cc)return fail('missing-column-context');cc.setTransform(1,0,0,1,0,0);cc.globalAlpha=1;cc.globalCompositeOperation='source-over';cc.filter='none';cc.clearRect(0,0,1,H);cc.drawImage(c.canvas,x,0,1,H,0,0,1,H);}
  if(hasRow){row=strip(row,W,1);rc=row?.getContext('2d');if(!rc)return fail('missing-row-context');rc.setTransform(1,0,0,1,0,0);rc.globalAlpha=1;rc.globalCompositeOperation='source-over';rc.filter='none';rc.clearRect(0,0,W,1);rc.drawImage(c.canvas,0,y,W,1,0,0,W,1);}
 }catch{return fail('backdrop-capture');}
 stats.bytes=((column?column.width*column.height:0)+(row?row.width*row.height:0))*4;stats.peakBytes=Math.max(stats.peakBytes,stats.bytes);
 G.HonroVectorArt.draw(c,l.asset,l);stats.draws++;
 c.save();try{c.setTransform(1,0,0,1,0,0);c.globalAlpha=1;c.globalCompositeOperation='source-over';c.filter='none';
  // No new clip is applied to source drawing. Clear only the fractional edge
  // device pixel and restore its exact prior backdrop, never adjacent pixels.
  if(hasColumn){c.clearRect(x,0,1,H);c.drawImage(column,x,0);stats.columns++;}
  if(hasRow){c.clearRect(0,y,W,1);c.drawImage(row,0,y);stats.rows++;}
 }finally{c.restore();}return true;
}
G.HonroStage34FoundationEdge={draw,stats:()=>({...stats,tiles:tiles.map(t=>({...t,m:[...t.m]})),maxPixels:MAX_PIXELS})};
})(globalThis);
