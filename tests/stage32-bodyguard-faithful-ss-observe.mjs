import assert from 'node:assert/strict';
/** Text-only instrumentation of a copied test runtime string. Never writes files.
 * Production and native candidate input must remain on disk unchanged. */
export function instrumentSS(code){
 const needle='for(let j=0;j<3;j++)data[k+j]=rgb[j];ssStats.corrected++;';
 assert.equal(code.split(needle).length,2,'Expected one exact original SS final write');
 const hook="if(G.__stage32SSObserve)G.__stage32SSObserve(c,q,m,x,sy+y+y0,data[k],data[k+1],data[k+2],rgb[0],rgb[1],rgb[2]);";
 const result=code.replace(needle,hook+needle);
 assert.equal(result.replace(hook,''),code,'Instrumentation must be exactly reversible');
 return result;
}
/** Serialize into the fixture AFTER runtime registration, BEFORE first render.
 * coverageD is the unchanged V2 coverage.svgpath. No new canvas/readback/buffer.
 * Coordinates are BODY source and world coordinates, not final Scene pixels.
 * Every changed write is counted; repeated/overlapping tile writes are NOT unique
 * scene pixels. Point ownership is diagnostic only, not continuous AA proof. */
export function installSSObservation(coverageD){
 const coverage=new Path2D(coverageD),MAX_SAMPLES=10000,MAX_PLANES=32;
 const result={scope:'SS final RGB write events; finite center ownership, not full-pixel AA or visual proof. Diagnostics not performance.',changedWrites:0,inNativeCoverage:0,outsideNativeCoverage:0,outsideApron:0,owners:Array(26).fill(0),worldBBox:null,sourceBBox:null,maxChannelDelta:0,samples:[],planes:[],planeOverflow:0};
 const bbox=(b,x,y)=>b?[Math.min(b[0],x),Math.min(b[1],y),Math.max(b[2],x),Math.max(b[3],y)]:[x,y,x,y];
 globalThis.__stage32SSObserve=function(c,q,m,x,y,r,g,b,nr,ng,nb){
  const wx=(x+.5-m.e)/(m.a/2.2),wy=(y+.5-m.f)/(m.d/2.2),sx=wx/2.2,sy=wy/2.2;
  if(![wx,wy,sx,sy].every(Number.isFinite))throw Error('Invalid SS observation transform');
  const matrix=[m.a,m.b,m.c,m.d,m.e,m.f],planeKey=[c.canvas.width,c.canvas.height,...matrix].join('|');
  let plane=result.planes.find(p=>p.key===planeKey);if(!plane){if(result.planes.length<MAX_PLANES){plane={key:planeKey,canvas:[c.canvas.width,c.canvas.height],matrix,changedWrites:0};result.planes.push(plane);}else result.planeOverflow++;}if(plane)plane.changedWrites++;
  let native=false,apron=false,owner=-1,gray=false;
  c.save();try{c.setTransform(1,0,0,1,0,0);native=c.isPointInPath(coverage,sx,sy);apron=c.isPointInPath(q.apron,wx,wy);for(let i=q.paths.length-1;i>=0;i--){const p=q.paths[i];if(c.isPointInPath(p.path,sx,sy,p.rule)){owner=p.sourceIndex;gray=!!p.gray&&c.isPointInPath(p.gray,sx,sy,p.rule);break;}}}finally{c.restore();}
  result.changedWrites++;result[native?'inNativeCoverage':'outsideNativeCoverage']++;if(!apron)result.outsideApron++;result.owners[owner+1]++;
  result.worldBBox=bbox(result.worldBBox,wx,wy);result.sourceBBox=bbox(result.sourceBBox,sx,sy);result.maxChannelDelta=Math.max(result.maxChannelDelta,Math.abs(nr-r),Math.abs(ng-g),Math.abs(nb-b));
  if(result.samples.length<MAX_SAMPLES)result.samples.push({world:[wx,wy],source:[sx,sy],device:[x,y],matrix,canvas:[c.canvas.width,c.canvas.height],native,apron,owner,gray,oldRGB:[r,g,b],newRGB:[nr,ng,nb]});
 };
 // Stop immediately after the initial validated Scene renders. No bench/no-op
 // overhead afterwards. Never leave enabled during performance measurements.
 globalThis.__stage32SSObservation={result,stop(){delete globalThis.__stage32SSObserve;return structuredClone(result);}};
}
