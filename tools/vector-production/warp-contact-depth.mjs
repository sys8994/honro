/** Reuse authored contact artwork, preserving relative depth under two polylines.
 * Only affine transforms, source symbols and physically derived clips are made.
 * This is authoring geometry, not newly invented decorative art or art approval. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync,writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
const g=vm.createContext({});vm.runInContext(readFileSync(new URL('../../shared/map/vector-art.js',import.meta.url),'utf8'),g);
function profile(points){assert(points.length>1);const p=structuredClone(points).sort((a,b)=>a.x-b.x);for(let i=0;i<p.length;i++){assert(Number.isFinite(p[i].x)&&Number.isFinite(p[i].y));if(i)assert(p[i].x>p[i-1].x,'Strictly increasing profile required');}return p;}
function line(p,x){for(let i=1;i<p.length;i++)if(x>=p[i-1].x-1e-8&&x<=p[i].x+1e-8){const a=p[i-1],b=p[i],m=(b.y-a.y)/(b.x-a.x);return{m,b:a.y-m*a.x};}throw Error('Profile does not cover '+x);}
const at=(p,x)=>{const q=line(p,x);return q.m*x+q.b;};
export function warpContactDepth(source,{id,sourceTop,targetTop,start,end,depth=80,depthScale=1,alternateMirror=true}){
 assert.deepEqual(source.collision,[]);assert(source.vector?.root);assert(typeof id==='string');assert(end>start&&depth>0);assert(Number.isFinite(depthScale)&&depthScale>0&&depthScale<=1,'Depth scale must be >0 and <=1');
 const src=profile(sourceTop),dst=profile(targetTop),sx0=src[0].x,sx1=src.at(-1).x,width=sx1-sx0;
 assert(start>=dst[0].x&&end<=dst.at(-1).x);const asset=structuredClone(source),v=asset.vector;
 const symbol='contact-source';assert(!v.symbols?.[symbol]);v.symbols={...v.symbols,[symbol]:v.root};v.clips={...v.clips};const children=[],segments=[];
 for(let tile=0,x0=start;x0<end-1e-8;tile++,x0+=width){const x1=Math.min(end,x0+width),a=alternateMirror&&tile%2?-1:1,b=a===1?x0-sx0:x0+sx1;
  const cuts=[...new Set([x0,x1,...src.map(p=>a*p.x+b).filter(x=>x>x0&&x<x1),...dst.map(p=>p.x).filter(x=>x>x0&&x<x1)])].sort((a,b)=>a-b);
  for(let i=1;i<cuts.length;i++){const lo=cuts[i-1],hi=cuts[i],mid=(lo+hi)/2,ss=line(src,(mid-b)/a),tt=line(dst,mid),c=tt.m*a-depthScale*ss.m,f=tt.m*b+tt.b-depthScale*ss.b,key='contact-slice-'+segments.length;
   v.clips[key]=[`M${lo} -40000H${hi}V40000H${lo}Z`];children.push({tag:'g',clipPath:key,pixelSnapClip:true,children:[{tag:'g',transform:[a,c,0,depthScale,b,f],children:[{tag:'use',symbol}]}]});
   for(const x of[lo,mid,hi]){const sx=(x-b)/a;assert(Math.abs(depthScale*at(src,sx)+c*sx+f-at(dst,x))<1e-6,'Top mapping mismatch');}
   segments.push({tile,lo,hi,mirror:a===-1,transform:[a,c,0,depthScale,b,f]});
  }
 }
 const top=[{x:start,y:at(dst,start)},...dst.filter(p=>p.x>start&&p.x<end),{x:end,y:at(dst,end)}];
 v.clips['contact-band']= [top.map((p,i)=>(i?'L':'M')+p.x+' '+p.y).join(' ')+top.slice().reverse().map(p=>'L'+p.x+' '+(p.y+depth)).join(' ')+'Z'];
 v.root={tag:'g',clipPath:'contact-band',children};const y0=Math.min(...top.map(p=>p.y)),y1=Math.max(...top.map(p=>p.y))+depth;
 asset.id=id;asset.bounds={x:start,y:y0,w:end-start,h:y1-y0};asset.reference={...asset.reference,bounds:{...asset.bounds},foot:{x:start,y:at(dst,start)}};v.viewBox=[start,y0,end-start,y1-y0];asset.params={...asset.params,semanticLayer:'SURFACE',contactWarp:{version:1,source:source.id,start,end,depth,depthScale,scaleX:1,alternateMirror,sourceTop:src,targetTop:dst}};
 const errors=Array.from(g.HonroVectorArt.validate(v));assert.deepEqual(errors,[],'Expanded vector exceeds runtime budget');let expandedNodes=0,maxDepth=0,maxPathChars=0;const walk=(n,d=0)=>{expandedNodes++;maxDepth=Math.max(maxDepth,d);maxPathChars=Math.max(maxPathChars,n.d?.length||0);if(n.tag==='use')walk(v.symbols[n.symbol],d+1);for(const c of n.children||[])walk(c,d+1);};walk(v.root);
 return{asset,report:{source:source.id,target:id,segments,expandedNodes,maxDepth,maxPathChars,symbolCount:Object.keys(v.symbols).length,bytes:Buffer.byteLength(JSON.stringify(asset)),sourceBytes:Buffer.byteLength(JSON.stringify(source)),sourcePathDataUnchanged:true,depthScale,artProportionVariant:depthScale!==1,collision:[],visualApproval:false,scope:'Exact affine relative-depth mapping; original source paths shared, original physics unchanged. depthScale != 1 is intentional art proportion change, not raw-fidelity optimization. Palette/repetition/seam review required.'}};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const[sourceFile,configFile,out]=process.argv.slice(2);if(!out)throw Error('source-asset config output-asset required');const source=JSON.parse(readFileSync(sourceFile)),config=JSON.parse(readFileSync(configFile)),result=warpContactDepth(source,config);writeFileSync(out,JSON.stringify(result.asset));writeFileSync(out.replace(/\.json$/,'.report.json'),JSON.stringify(result.report,null,2));console.log(JSON.stringify({...result.report,segments:result.report.segments.length}));}
