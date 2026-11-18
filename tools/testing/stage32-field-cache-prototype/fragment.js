const fieldCache={tiles:new Map(),asset:null,signature:null,bytes:0,hits:0,misses:0,evictions:0,fallbacks:0,peakBytes:0};
const FIELD_TILE=512,FIELD_PAD=2,FIELD_TILE_BYTES=(FIELD_TILE+2*FIELD_PAD)**2*4;
function fieldCacheDrop(){for(const t of fieldCache.tiles.values()){t.width=1;t.height=1;}fieldCache.tiles.clear();fieldCache.bytes=0;fieldCache.asset=null;fieldCache.signature=null;}
function cachedField(cc,c,asset,q,m,w,h,style){
 const base=nativeBudgetStats.last?.projected??Infinity,budget=Math.min(24*1024*1024,Math.max(0,NATIVE_BUDGET_BYTES-base));
 const countLimit=Math.floor(budget/FIELD_TILE_BYTES),x0=Math.floor(-m.e/FIELD_TILE),x1=Math.floor((w-m.e-1)/FIELD_TILE),y0=Math.floor(-m.f/FIELD_TILE),y1=Math.floor((h-m.f-1)/FIELD_TILE);
 if(m.b!==0||m.c!==0||m.a<=0||m.d<=0||(x1-x0+1)*(y1-y0+1)>countLimit){fieldCache.fallbacks++;fieldCacheDrop();return false;}
 const sig=[m.a,m.d,style].join('|');if(fieldCache.asset!==asset||fieldCache.signature!==sig){fieldCacheDrop();fieldCache.asset=asset;fieldCache.signature=sig;}
 while(fieldCache.tiles.size>countLimit){const k=fieldCache.tiles.keys().next().value,t=fieldCache.tiles.get(k);t.width=1;t.height=1;fieldCache.tiles.delete(k);fieldCache.evictions++;}
 for(let ty=y0;ty<=y1;ty++)for(let tx=x0;tx<=x1;tx++){
  const key=tx+','+ty;let tile=fieldCache.tiles.get(key);
  if(tile){fieldCache.hits++;fieldCache.tiles.delete(key);fieldCache.tiles.set(key,tile);}else{
   while(fieldCache.tiles.size>=countLimit){const k=fieldCache.tiles.keys().next().value,t=fieldCache.tiles.get(k);t.width=1;t.height=1;fieldCache.tiles.delete(k);fieldCache.evictions++;}
   tile=G.document.createElement('canvas');tile.width=FIELD_TILE+2*FIELD_PAD;tile.height=FIELD_TILE+2*FIELD_PAD;const tc=tile.getContext('2d');
   tc.setTransform(m.a,0,0,m.d,FIELD_PAD-tx*FIELD_TILE,FIELD_PAD-ty*FIELD_TILE);tc.translate(-5500,-1950);tc.scale(7.2,7.2);tc.transform(...q.fieldTransform);for(const n of q.field){tc.fillStyle=n.fill;tc.fill(n.path);}
   fieldCache.tiles.set(key,tile);fieldCache.misses++;
  }
  cc.drawImage(tile,FIELD_PAD,FIELD_PAD,FIELD_TILE,FIELD_TILE,tx*FIELD_TILE+m.e,ty*FIELD_TILE+m.f,FIELD_TILE,FIELD_TILE);
 }
 fieldCache.bytes=fieldCache.tiles.size*FIELD_TILE_BYTES;fieldCache.peakBytes=Math.max(fieldCache.peakBytes,fieldCache.bytes);return true;
}
