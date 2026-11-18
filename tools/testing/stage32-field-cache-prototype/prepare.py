from pathlib import Path
import hashlib,json
root=Path('stage32-field-cache-prototype'); s=Path('stage32-native-budget-candidate/candidate.js').read_text(); assert hashlib.sha256(s.encode()).hexdigest()=='8c8fd33fc74ea89cca7895d01bd96b6a0928330b3b531a3c55671a181d3bbdc2'
frag='''const fieldCache={tiles:new Map(),asset:null,signature:null,bytes:0,hits:0,misses:0,evictions:0,fallbacks:0,peakBytes:0};
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
'''
s=s.replace('function material(c,asset){',frag+'function material(c,asset,useTiles=false){',1)
s=s.replace("const style=G.HonroVisualStyle?.key?.()||'',key=[w,h,...matrix,style].join('|');","const style=G.HonroVisualStyle?.key?.()||'',key=[w,h,...matrix,style,useTiles].join('|');",1)
s=s.replace(' cc.setTransform(...matrix);cc.translate(-5500,-1950);', ' if(useTiles&&cachedField(cc,c,asset,q,m,w,h,style)){counters.rasterizations++;counters.bytes=w*h*4;counters.peakBytes=Math.max(counters.peakBytes,counters.bytes);last={context:c,asset,key};return buffer;}\n cc.setTransform(...matrix);cc.translate(-5500,-1950);',1)
s=s.replace('cv=q&&material(c,field);','cv=q&&material(c,field,route?.nativeLive===true&&(nativeBudget||(originalOnly&&inheritedReplacement)));',1)
s=s.replace("if(route?.nativeLive!==true||!Number.isFinite(route.sceneScale)||route.sceneScale<=1.05)return false;","if(route?.nativeLive!==true||!Number.isFinite(route.sceneScale)||route.sceneScale<=1.05){fieldCacheDrop();return false;}",1)
s=s.replace('if(!admitted){nativeBudgetStats.rejected++;return false;}',"if(!admitted){fieldCacheDrop();nativeBudgetStats.rejected++;return false;}\n const cacheLimit=Math.floor(Math.min(24*1024*1024,Math.max(0,NATIVE_BUDGET_BYTES-projected))/FIELD_TILE_BYTES);while(fieldCache.tiles.size>cacheLimit){const key=fieldCache.tiles.keys().next().value,tile=fieldCache.tiles.get(key);tile.width=1;tile.height=1;fieldCache.tiles.delete(key);fieldCache.evictions++;}fieldCache.bytes=fieldCache.tiles.size*FIELD_TILE_BYTES;",1)
s=s.replace('stats:()=>({...counters,','stats:()=>({...counters,fieldCache:{bytes:fieldCache.bytes,hits:fieldCache.hits,misses:fieldCache.misses,evictions:fieldCache.evictions,fallbacks:fieldCache.fallbacks,peakBytes:fieldCache.peakBytes,tiles:fieldCache.tiles.size},',1)
s=s.replace('totalLogicalBytes:counters.bytes+transitionCounters.bytes+ssStats.scratchBytes','totalLogicalBytes:counters.bytes+transitionCounters.bytes+ssStats.scratchBytes+fieldCache.bytes',1)
s=s.replace('clear:()=>{for(const cv','clear:()=>{fieldCacheDrop();for(const cv',1)
(root/'candidate.js').write_text(s);(root/'baseline.js').write_text(Path('stage32-native-budget-candidate/candidate.js').read_text());(root/'fragment.js').write_text(frag)
(root/'scope.json').write_text(json.dumps({'experimental':True,'sourceBaselineSHA':'8c8fd33fc74ea89cca7895d01bd96b6a0928330b3b531a3c55671a181d3bbdc2','candidateSHA':hashlib.sha256(s.encode()).hexdigest(),'staticFieldOnly':True,'noProductionRegistration':True,'geometryUnchanged':True,'cacheBudgetBytes':24*1024*1024,'helperBudgetBytes':48*1024*1024},indent=2))
