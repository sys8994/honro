import{readFile,writeFile,mkdir}from'node:fs/promises';
await mkdir('_local/collision-index',{recursive:true});
const source=await readFile('tools/collision-index-review/fixtures/math-baseline.ts','utf8');
const helper=`
// Exact snapshot validation deliberately supports in-place authored vertex edits.
const edgeGroupsCache=new WeakMap<Vec[],{coords:number[];groups:{lo:number;hi:number;left:number;right:number;top:number;bottom:number;span:number}[]}>();
function edgeGroups(pts:Vec[]){
 let c=edgeGroupsCache.get(pts),valid=!!c&&c.coords.length===pts.length*2;
 if(valid)for(let i=0;i<pts.length;i++)if(c!.coords[i*2]!==pts[i].x||c!.coords[i*2+1]!==pts[i].y){valid=false;break;}
 if(valid)return c!.groups;
 const coords:number[]=[],groups:{lo:number;hi:number;left:number;right:number;top:number;bottom:number;span:number}[]=[];
 for(const p of pts)coords.push(p.x,p.y);
 for(let lo=0;lo<pts.length;lo+=16){const hi=Math.min(lo+16,pts.length);let left=Infinity,right=-Infinity,top=Infinity,bottom=-Infinity,span=0;
  for(let i=lo;i<hi;i++){const p=pts[i],q=pts[(i+1)%pts.length];left=Math.min(left,p.x,q.x);right=Math.max(right,p.x,q.x);top=Math.min(top,p.y,q.y);bottom=Math.max(bottom,p.y,q.y);span=Math.max(span,Math.abs(q.x-p.x)+Math.abs(q.y-p.y));}
  groups.push({lo,hi,left,right,top,bottom,span});
 }
 edgeGroupsCache.set(pts,{coords,groups});return groups;
}
`;
let candidate=source.replace('export function segmentTerrain(',helper+'\nexport function segmentTerrain(');
const start=candidate.indexOf('export function segmentTerrain('),end=candidate.indexOf('/** Projectile-only',start);
let method=candidate.slice(start,end);
method=method.replace('    for(let i=0;i<pts.length;i++){',`    const groups=pts.length>=32?edgeGroups(pts):[{lo:0,hi:pts.length,left:-Infinity,right:Infinity,top:-Infinity,bottom:Infinity,span:Infinity}];
    const groupLeft=Math.min(a.x,b.x)-Math.abs(pad),groupRight=Math.max(a.x,b.x)+Math.abs(pad),groupTop=Math.min(a.y,b.y)-Math.abs(pad),groupBottom=Math.max(a.y,b.y)+Math.abs(pad);
    for(const group of groups){
      // Deliberately wider than the original per-edge gate, including signed
      // padding and floating-point reassociation of the maximum edge span.
      const margin=2e-7+2e-8*(Math.abs(dx)+Math.abs(dy)+group.span);
      if(group.right<groupLeft-margin||group.left>groupRight+margin||group.bottom<groupTop-margin||group.top>groupBottom+margin)continue;
      for(let i=group.lo;i<group.hi;i++){`);
method=method.replace('    return best;','    }\n    return best;');
candidate=candidate.slice(0,start)+method+candidate.slice(end);
const ps=candidate.indexOf('export function segmentPlatformSurface('),pe=candidate.indexOf('export function escapeHTML',ps);
let pm=candidate.slice(ps,pe);
pm=pm.replace('    for(let i=0;i<pts.length;i++){',`    const margin=Math.abs(pad)*2+epsilon*(2+Math.abs(dx)+Math.abs(dy));
    const left=Math.min(a.x,b.x)-margin,right=Math.max(a.x,b.x)+margin,top=Math.min(a.y,b.y)-margin,bottom=Math.max(a.y,b.y)+margin;
    const groups=pts.length>=32?edgeGroups(pts):[{lo:0,hi:pts.length,left:-Infinity,right:Infinity,top:-Infinity,bottom:Infinity,span:Infinity}];
    for(const group of groups){
      if(group.right<left||group.left>right||group.bottom<top||group.top>bottom)continue;
      for(let i=group.lo;i<group.hi;i++){`);
pm=pm.replace('        if(ex<=epsilon)continue;',`        if(Math.max(p.x,q.x)<left||Math.min(p.x,q.x)>right||Math.max(p.y,q.y)<top||Math.min(p.y,q.y)>bottom)continue;
        if(ex<=epsilon)continue;`);
pm=pm.replace('    return best;','    }\n    return best;');
candidate=candidate.slice(0,ps)+pm+candidate.slice(pe);
const originalSolid=source.slice(source.indexOf('export function segmentTerrain('),source.indexOf('/** Projectile-only')).replace('    if (!skipEdges', '    if(t.vertices && t.vertices.length>=32)return indexedSegmentTerrain(a,b,t,pad,skipEdges);\n    if (!skipEdges');
const originalPlatform=source.slice(source.indexOf('export function segmentPlatformSurface('),source.indexOf('export function escapeHTML')).replace('    const pts=', '    if(t.vertices && t.vertices.length>=32)return indexedSegmentPlatformSurface(a,b,t,pad);\n    const pts=');
candidate=candidate.replace('export function segmentTerrain(', 'function indexedSegmentTerrain(').replace('export function segmentPlatformSurface(', 'function indexedSegmentPlatformSurface(');
candidate+='\n'+originalSolid+'\n'+originalPlatform;
await writeFile('_local/collision-index/math-candidate.ts',candidate);
await writeFile('_local/collision-index/math-baseline.ts',source);
