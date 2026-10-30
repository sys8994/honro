/** Piecewise affine foot fit for an existing noncolliding reused frame. */
import assert from'node:assert/strict';
export function fitGroundedFrame(source,{width,instance,terrainPoints,id}){
 const a=structuredClone(source);assert.deepEqual(a.collision,[]);const fit=width/a.bounds.w,b={x:a.bounds.x*fit,y:a.bounds.y*fit,w:a.bounds.w*fit,h:a.bounds.h*fit},lo=b.x,hi=b.x+b.w;
 const points=terrainPoints.filter(p=>p.y<20000).sort((a,b)=>a.x-b.x),localX=x=>(x-instance.x)/instance.scale;
 const ground=x=>{const wx=instance.x+x*instance.scale;for(let i=1;i<points.length;i++){const p=points[i-1],q=points[i];if(wx>=p.x&&wx<=q.x&&q.x>p.x)return(p.y+(q.y-p.y)*(wx-p.x)/(q.x-p.x)-instance.y)/instance.scale;}throw Error('Source frame outside existing terrain');};
 assert(Math.abs(ground(0))<1e-6,'Original centerfoot is not on terrain');const cuts=[...new Set([lo,hi,...points.map(p=>localX(p.x)).filter(x=>x>lo&&x<hi)])].sort((a,b)=>a-b),symbol='grounded-frame-source';
 assert(!a.vector.symbols?.[symbol]);a.vector.symbols={...a.vector.symbols,[symbol]:{tag:'g',transform:[fit,0,0,fit,0,0],children:[a.vector.root]}};a.vector.clips={...a.vector.clips};const children=[],segments=[],ys=[];
 for(let i=1;i<cuts.length;i++){const x0=cuts[i-1],x1=cuts[i],m=(ground(x1)-ground(x0))/(x1-x0),offset=ground(x0)-m*x0,key='grounded-frame-slice-'+i;a.vector.clips[key]=[`M${x0} -10000H${x1}V10000H${x0}Z`];children.push({tag:'g',clipPath:key,pixelSnapClip:true,children:[{tag:'g',transform:[1,m,0,1,0,offset],children:[{tag:'use',symbol}]}]});segments.push({x0,x1,slope:m,offset});for(const x of[x0,x1])for(const y of[b.y,b.y+b.h])ys.push(y+m*x+offset);}
 a.id=id;a.vector.root={tag:'g',children};a.bounds={...b,y:Math.min(...ys),h:Math.max(...ys)-Math.min(...ys)};a.reference={...a.reference,bounds:structuredClone(a.bounds)};a.params={...a.params,groundFit:{fit,segments,centerFootPreserved:true,scope:'Intentional source-frame fit to original support profile. Every sourcebaseline point maps to existingground. Instance/collision unchanged; roof beams may bend at existing slope transitions.'}};return a;
}
