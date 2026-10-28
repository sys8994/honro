// Exact-shape candidate via Skia path Boolean intersection; raster QA still required.
import {readFileSync} from 'node:fs';
import {Path2D,PathOp,FillType} from '@napi-rs/canvas';
const input=JSON.parse(readFileSync(0,'utf8')),original=new Path2D(input.d);original.setFillType(input.fillRule==='evenodd'?FillType.EvenOdd:FillType.Winding);
const bounds=original.computeTightBounds(),pad=1,initial=[bounds[0]-pad,bounds[1]-pad,bounds[2]+pad,bounds[3]+pad],parts=[];
function cut(box,depth=0){
 const path=new Path2D(input.d);path.setFillType(input.fillRule==='evenodd'?FillType.EvenOdd:FillType.Winding);
 const rect=new Path2D();rect.rect(box[0],box[1],box[2]-box[0],box[3]-box[1]);path.op(rect,PathOp.Intersect);
 const d=path.toSVGString();if(!d)return;const tight=path.computeTightBounds(),epsilon=1e-3;if(tight[0]<box[0]-epsilon||tight[1]<box[1]-epsilon||tight[2]>box[2]+epsilon||tight[3]>box[3]+epsilon)throw Error('Skia intersection failed containment: '+JSON.stringify({box,tight}));
 if(d.length<=(input.limit||40000)){parts.push({d,fillRule:path.getFillTypeString(),box});return;}
 if(depth>=12||parts.length>=128)throw Error('Partition exceeds depth/node allowance '+JSON.stringify({box,depth,parts:parts.length,length:d.length,bounds:path.computeTightBounds()}));
 const axis=0,mid=(box[axis]+box[axis+2])/2,a=[...box],b=[...box];a[axis+2]=mid;b[axis]=mid;cut(a,depth+1);cut(b,depth+1);
}
cut(initial);console.log(JSON.stringify({parts,sourceBounds:bounds,operation:'Skia intersect; non-overlapping rectangles; original geometry input for every tile'}));
