/** Fit reviewed native path artwork to an explicit support profile. No art/physics generation.
 * Source contact anchors are authored/reviewed input, NEVER inferred from pixels.
 * Exact piecewise affine relative-depth mapping. Intentional deformation is not optimization.
 */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync,writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {Path2D,PathOp,FillType} from '@napi-rs/canvas';
const runtime=vm.createContext({});vm.runInContext(readFileSync(new URL('../../shared/map/vector-art.js',import.meta.url),'utf8'),runtime);
const identity=[1,0,0,1,0,0];
const mult=(a,b)=>[a[0]*b[0]+a[2]*b[1],a[1]*b[0]+a[3]*b[1],a[0]*b[2]+a[2]*b[3],a[1]*b[2]+a[3]*b[3],a[0]*b[4]+a[2]*b[5]+a[4],a[1]*b[4]+a[3]*b[5]+a[5]];
const matrix=([a,b,c,d,e,f])=>({a,b,c,d,e,f});
function profile(input){assert(Array.isArray(input)&&input.length>=2);const p=input.map(v=>Array.isArray(v)?{x:v[0],y:v[1]}:{...v});for(let i=0;i<p.length;i++){assert(Number.isFinite(p[i].x)&&Number.isFinite(p[i].y));if(i)assert(p[i].x>p[i-1].x,'Contact profile X must strictly increase');}return p;}
function line(p,x){for(let i=1;i<p.length;i++)if(x>=p[i-1].x-1e-7&&x<=p[i].x+1e-7){const a=p[i-1],b=p[i],m=(b.y-a.y)/(b.x-a.x);return{m,b:a.y-m*a.x};}throw Error('Outside reviewed contact profile');}
function at(p,x){const l=line(p,x);return l.m*x+l.b;}
function sourcePaths(node,parent=identity,out=[],inherited={fill:'#000000',stroke:'none',fillRule:'nonzero'}){
 assert(!node.clipPath&&(node.opacity===undefined||node.opacity===1),'Source clips/group opacity need separate review');const m=node.transform?mult(parent,node.transform):parent,style={...inherited,...node};
 if(node.tag==='path'){assert(style.stroke==='none','Stroke bounds unsupported; convert stroke to path');if(style.fill!=='none'){const p=new Path2D(node.d);p.setFillType(style.fillRule==='evenodd'?FillType.EvenOdd:FillType.Winding);out.push(p.transform(matrix(m)));(out.styles??=[]).push({fill:style.fill,fillRule:style.fillRule,opacity:1,stroke:'none'});}}
 else{assert.equal(node.tag,'g','Only normalized path/group native assets accepted');for(const c of node.children||[])sourcePaths(c,m,out,style);}return out;
}
export function fitModule(source,config){
 assert.deepEqual(source.collision,[],'Artwork must not supply collision');assert(!source.vector.symbols&&!source.vector.clips,'Input must be plain imported module');assert(config.id);
 let sp=profile(config.sourceTop),tp=profile(config.targetTop);const reviewedSourceTop=structuredClone(sp),reviewedTargetTop=structuredClone(tp),depthScale=config.depthScale??1;assert(Number.isFinite(depthScale)&&depthScale>0);
 const sx0=sp[0].x,sx1=sp.at(-1).x,tx0=tp[0].x,tx1=tp.at(-1).x,a=(tx1-tx0)/(sx1-sx0),b=tx0-a*sx0;
 const paths=sourcePaths(source.vector.root),rawBounds=paths.map(p=>p.computeTightBounds()),sourceBounds=[Math.min(...rawBounds.map(q=>q[0])),Math.min(...rawBounds.map(q=>q[1])),Math.max(...rawBounds.map(q=>q[2])),Math.max(...rawBounds.map(q=>q[3]))];
 assert(sourceBounds.every(Number.isFinite));
 const overhangLeft=Math.max(0,sx0-sourceBounds[0]),overhangRight=Math.max(0,sourceBounds[2]-sx1);
 if(overhangLeft>1e-4||overhangRight>1e-4){assert(config.decorativeOverhangMaxSourceUnits>=Math.max(overhangLeft,overhangRight),'Reviewed source top must span full artwork X bounds, or explicitly authorize bounded decorative overhang; do not silently crop');
  for(const [sx,side] of [[sourceBounds[0],'left'],[sourceBounds[2],'right']]){if(side==='left'&&sx>=sx0||side==='right'&&sx<=sx1)continue;const endpoint=side==='left'?sx0:sx1,sl=line(sp,endpoint),tx=a*sx+b,tl=line(tp,side==='left'?tx0:tx1),q={x:sx,y:sl.m*sx+sl.b},t={x:tx,y:tl.m*tx+tl.b};if(side==='left'){sp.unshift(q);tp.unshift(t);}else{sp.push(q);tp.push(t);}}
 }
 const baked=paths.map(()=>new Path2D());
 const cuts=[...new Set([tx0,tx1,...sp.map(p=>a*p.x+b),...tp.map(p=>p.x)])].sort((x,y)=>x-y),segments=[],children=[],clips={},bounds=[];
 for(let i=1;i<cuts.length;i++){
  const lo=cuts[i-1],hi=cuts[i],mid=(lo+hi)/2,ss=line(sp,(mid-b)/a),tt=line(tp,mid),c=tt.m*a-depthScale*ss.m,f=tt.m*b+tt.b-depthScale*ss.b,transform=[a,c,0,depthScale,b,f],key='module-slice-'+segments.length;
  const transformed=paths.map(p=>new Path2D(p).transform(matrix(transform))),all=transformed.map(p=>p.computeTightBounds()),y0=Math.min(...all.map(q=>q[1]))-1,y1=Math.max(...all.map(q=>q[3]))+1;
  clips[key]=[`M${lo} ${y0}H${hi}V${y1}H${lo}Z`];children.push({tag:'g',clipPath:key,pixelSnapClip:true,children:[{tag:'g',transform,children:[{tag:'use',symbol:'native-module'}]}]});
  const clip=new Path2D();clip.rect(lo,y0,hi-lo,y1-y0);for(const [pi,p] of transformed.entries()){p.op(clip,PathOp.Intersect);if(config.bakeGeometry)baked[pi].op(p,PathOp.Union);if(p.toSVGString()){bounds.push(p.computeTightBounds());for(const [j,d] of (config.forbiddenPaths||[]).entries()){const overlap=new Path2D(p);overlap.op(new Path2D(d),PathOp.Intersect);assert(!overlap.toSVGString(),`Art overlaps protected corridor ${j}; change placement/source art, not physics`);}}}
  for(const x of[lo,mid,hi]){const sx=(x-b)/a;assert(Math.abs(c*sx+depthScale*at(sp,sx)+f-at(tp,x))<1e-6);}
  segments.push({lo,hi,transform});
 }
 assert(bounds.length);const [x,y,x1,y1]=[Math.min(...bounds.map(q=>q[0])),Math.min(...bounds.map(q=>q[1])),Math.max(...bounds.map(q=>q[2])),Math.max(...bounds.map(q=>q[3]))];
 const asset=structuredClone(source);asset.id=config.id;asset.name=config.name||config.id;asset.bounds={x,y,w:x1-x,h:y1-y};asset.anchor={x:0,y:0};asset.foot={x:tx0,y:tp[0].y};asset.reference={...asset.reference,bounds:{...asset.bounds},foot:{...asset.foot}};asset.vector={version:1,viewBox:[x,y,x1-x,y1-y],symbols:{'native-module':structuredClone(source.vector.root)},clips,root:{tag:'g',children}};
 if(config.bakeGeometry){
  const bakedChildren=[];const quant=d=>d.replace(/[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?/g,n=>String(Math.round(Number(n)*10000)/10000));
  for(const [pi,shape] of baked.entries()){
   function tile(box,depth=0){const p=new Path2D(shape),clip=new Path2D();clip.rect(box[0],box[1],box[2]-box[0],box[3]-box[1]);p.op(clip,PathOp.Intersect);const d=quant(p.toSVGString());if(!d)return;if(d.length<=58000){bakedChildren.push({tag:'path',...paths.styles[pi],fillRule:p.getFillTypeString(),d});return;}assert(depth<12,'Baked partition depth exceeded');const mid=(box[0]+box[2])/2;tile([box[0],box[1],mid,box[3]],depth+1);tile([mid,box[1],box[2],box[3]],depth+1);}
   const box=shape.computeTightBounds();tile([box[0]-1,box[1]-1,box[2]+1,box[3]+1]);
  }
  asset.vector={version:1,viewBox:[x,y,x1-x,y1-y],root:{tag:'g',children:bakedChildren}};
 }
 asset.params={...asset.params,semanticLayer:config.semanticLayer||'REAR',nativeContactFit:{sourceId:source.id,sourceTop:reviewedSourceTop,targetTop:reviewedTargetTop,decorativeOverhangSourceUnits:{left:overhangLeft,right:overhangRight},depthScale,horizontalScale:a,intentionalDeformation:true,contactReviewed:false}};
 const errors=Array.from(runtime.HonroVectorArt.validate(asset.vector));assert.deepEqual(errors,[],'Expanded runtime budget exceeded; reduce profile/module complexity, never raise limits');
 let nodes=0,maxDepth=0,maxPathChars=0;function count(n,d=0){nodes++;maxDepth=Math.max(maxDepth,d);maxPathChars=Math.max(maxPathChars,n.d?.length||0);if(n.tag==='use')count(asset.vector.symbols[n.symbol],d+1);for(const c of n.children||[])count(c,d+1);}count(asset.vector.root);
 return{asset,report:{sourceId:source.id,targetId:asset.id,sourceBounds,outputBounds:asset.bounds,sourceTop:reviewedSourceTop,targetTop:reviewedTargetTop,extendedArtProfile:{source:sp,target:tp},decorativeOverhangSourceUnits:{left:overhangLeft,right:overhangRight},segments,scaleX:a,depthScale,nodes,maxDepth,maxPathChars,serializedBytes:Buffer.byteLength(JSON.stringify(asset)),sourceGeometryUnchanged:!config.bakeGeometry,bakedGeometry:!!config.bakeGeometry,bakedCoordinateGridWorldUnits:config.bakeGeometry?.0001:0,originalSourceMutated:false,protectedCorridorsChecked:(config.forbiddenPaths||[]).length,collision:[],mappingErrorAtAnchors:0,visualApproval:'NOT REVIEWED',scope:'Reviewed source-contact fit only. Does not infer contact, generate shadow colliders, close corridors or approve deformed art.'}};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const[s,c,o]=process.argv.slice(2);assert(o,'source asset + contact config + output asset required');const result=fitModule(JSON.parse(readFileSync(s)),JSON.parse(readFileSync(c)));writeFileSync(o,JSON.stringify(result.asset));writeFileSync(o.replace(/\.json$/,'.report.json'),JSON.stringify(result.report,null,2)+'\n');console.log(JSON.stringify(result.report));}
