(function(G){'use strict';
const C=G.HONRO_CORE,B=G.HonroBounds,INK='#0c191f';
function path(points){const p=new Path2D();points.forEach(([x,y],i)=>i?p.lineTo(x,y):p.moveTo(x,y));p.closePath();return p;}
// Slice the actual collision contour only to find the visual join. No generated
// point is ever inserted into the terrain or serialized into a battle.
function intervals(t,axis,value){const pts=C.poly(t),other=axis==='x'?'y':'x',hits=[];
 for(let i=0;i<pts.length;i++){const a=pts[i],b=pts[(i+1)%pts.length];if((a[axis]<=value&&b[axis]>value)||(b[axis]<=value&&a[axis]>value))hits.push(a[other]+(b[other]-a[other])*(value-a[axis])/(b[axis]-a[axis]));}
 hits.sort((a,b)=>a-b);const spans=[];for(let i=0;i+1<hits.length;i+=2)spans.push([hits[i],hits[i+1]]);return spans;
}
function prepare(b,coverage){const bottom=coverage.bottom,base=b.height,skirts=[],edges=[],facets=[];
 for(const t of b.terrain||[]){if(t.broken||t.honroElementCollision||t.oneWay)continue;
  for(const [left,right] of intervals(t,'y',base-.5)){
   if(right-left<1)continue;const col=G.HonroTerrainPalette(t)[2];
   skirts.push({path:path([[left,base-24],[right,base-24],[right,bottom],[left,bottom]]),col});
   // Broad mineral planes, fading into the same ink as the surrounding abyss.
   const depth=Math.min(1800,(right-left)*.7),y=base+160;
   if(right-left>400)facets.push(path([[left+(right-left)*.08,y],[left+(right-left)*.32,y+depth*.13],[left+(right-left)*.47,y+depth],[left+(right-left)*.21,y+depth*.7]]));
  }
 }
 for(const side of [-1,1]){const edge=side<0?0:b.width,inside=edge-side*.5;
  // Continue only foundation contours. Floating platforms and their gaps stay
  // untouched. The end of a combat area is not automatically a precipice.
  const candidates=(b.terrain||[]).filter(t=>!t.broken&&!t.oneWay&&!t.honroElementCollision&&!t.honroCeiling).flatMap(t=>{
   const spans=intervals(t,'x',inside);if(!spans.some(span=>span[1]>=base-1))return[];
   // A folded cliff can cross one vertical slice more than once. Continue
   // its exposed crest when those slices almost touch, not the lower fold.
   const foundation=spans.findIndex(span=>span[1]>=base-1);let first=foundation;
   while(first>0&&spans[first][0]-spans[first-1][1]<=12)first--;
   return[{t,span:[spans[first][0],spans[foundation][1]]}];});
  candidates.sort((a,b)=>a.span[0]-b.span[0]);const q=candidates[0];if(!q)continue;
  const top=q.span[0],sample=180,inner=intervals(q.t,'x',edge-side*sample)[0],
   slope=Math.max(-.55,Math.min(.55,(top-(inner?.[0]??top))/sample)),extent=side<0?edge-coverage.left:coverage.right-edge,
   amplitude=Math.min(220,90+(base-top)*.055),phase=(b.honroStage||1)*.43+side*.7,x=d=>edge+side*d,
   y=d=>top+slope*800*(1-Math.exp(-d/800))+amplitude*(1-Math.exp(-d/600))*(-.55*Math.sin(d/1250)+.3*(Math.sin(d/3100+phase)-Math.sin(phase))),pts=[[edge,top]];
  // Fixed world spacing keeps the landform stationary through pan and resize.
  // A few broad shoulders replace the old repeated flat plateau.
  for(let d=280;d<extent;d+=280)pts.push([x(d),y(d)]);pts.push([x(extent),y(extent)]);
  const crest=new Path2D();pts.forEach(([px,py],i)=>i?crest.lineTo(px,py):crest.moveTo(px,py));
  edges.push({path:path([...pts,[x(extent),bottom],[edge-side*24,bottom],[edge-side*24,top+24]]),crest,t:q.t,edge,side,extent,top});
 }
 return{skirts,edges,facets,coverage,base,paths:skirts.length+edges.length*2+facets.length};
}
G.HonroScene.prototype.terrainSkirt=function(c,b,w,h){
 if(b.honroCaveEnvelope&&G.HonroCaveRock)return G.HonroCaveRock.enclosure.call(this,c,b,w,h);
 const coverage=B.visual(b,w,h,this.scale),key=[b.sceneVersion||0,b.width,b.height,coverage.left,coverage.top,coverage.right,coverage.bottom].join(':');
 let q=this._terrainSkirt;if(!q||q.key!==key||q.terrain!==b.terrain){q={...prepare(b,coverage),key,terrain:b.terrain};this._terrainSkirt=q;this._skirtBuilds=(this._skirtBuilds||0)+1;}
 // A world-anchored atmospheric abyss covers any aspect ratio, including a
 // custom floating map. It is neither a standable surface nor a rectangle rim.
 c.save();const v=coverage,deep=c.createLinearGradient(0,b.height+180,0,b.height+1900);deep.addColorStop(0,'#0c191f00');deep.addColorStop(1,INK);c.fillStyle=deep;c.fillRect(v.left,b.height+180,v.right-v.left,Math.max(0,v.bottom-b.height-180));
 for(const edge of q.edges){const pal=G.HonroTerrainPalette(edge.t),grad=c.createLinearGradient(0,edge.t.y,0,edge.t.y+Math.min(edge.t.h,420));grad.addColorStop(0,pal[0]);grad.addColorStop(.22,pal[1]);grad.addColorStop(1,pal[2]);c.fillStyle=grad;c.fill(edge.path);
  c.save();c.clip(edge.path);
  const mist=c.createLinearGradient(edge.edge,0,edge.edge+edge.side*edge.extent,0);mist.addColorStop(0,'#687a7200');mist.addColorStop(.22,'#687a720a');mist.addColorStop(1,'#687a7240');c.fillStyle=mist;c.fill(edge.path);c.restore();
  const rim=c.createLinearGradient(edge.edge,0,edge.edge+edge.side*Math.min(edge.extent,1800),0);rim.addColorStop(0,edge.t.mat==='earth'?'#aabd9999':'#bfc4b299');rim.addColorStop(1,'#bfc4b200');c.strokeStyle=rim;c.lineWidth=2;c.stroke(edge.crest);
 }
 for(const skirt of q.skirts){c.fillStyle=skirt.col;c.fill(skirt.path);}
 c.fillStyle='#63777310';for(const facet of q.facets)c.fill(facet);
 // Fade the joined rock mass to the surrounding abyss without a hard bottom.
 const fade=c.createLinearGradient(0,b.height+140,0,b.height+1850);fade.addColorStop(0,'#0c191f00');fade.addColorStop(1,INK);c.fillStyle=fade;
 for(const skirt of q.skirts)c.fill(skirt.path);for(const edge of q.edges)c.fill(edge.path);
 c.restore();this.overscanStats={bounds:coverage,paths:q.paths,builds:this._skirtBuilds};
};
})(globalThis);
