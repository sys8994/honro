/** Production SVG material and local-geometry contract checks using the shared renderer. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {readFile, mkdir, writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {compileSVG} from '../tools/environment/build-act2-art.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),dir=path.join(root,'shared/assets/environment/act3-architecture');
const manifest=JSON.parse(await readFile(path.join(dir,'production-manifest.json'),'utf8'));
const require=createRequire(import.meta.url),native=require('@napi-rs/canvas');
const g=vm.createContext({Path2D:native.Path2D});vm.runInContext(await readFile(path.join(root,'shared/map/vector-art.js'),'utf8'),g);
const flat=n=>[n,...(n.children||[]).flatMap(flat)];
assert.equal(manifest.status,'production-art');assert.equal(manifest.assets.length,10);
const report=[];
for(const a of manifest.assets){
 const source=await readFile(path.join(dir,a.file),'utf8');assert(Buffer.byteLength(source)<16000,`${a.id} byte budget`);
 assert(!/<(?:image|script|foreignObject|filter|use|pattern|text)\b|\bhref\s*=|\bon\w+\s*=/i.test(source));
 const vector=compileSVG(source),[x,y,w,h]=vector.viewBox;
 assert.deepEqual(JSON.parse(JSON.stringify(g.HonroVectorArt.validate(vector))),[]);
 assert.deepEqual({x,y,w,h},a.reference.bounds);assert.deepEqual(a.reference.foot,{x:0,y:0});assert.deepEqual(a.collision,[]);
 const cache=g.HonroVectorArt.prepare(vector);assert(cache.pathCount<90,`${a.id} path budget`);
 const cv=native.createCanvas(w+80,h+80),c=cv.getContext('2d'),ox=40-x,oy=40-y;
 g.HonroVectorArt.draw(c,{vector,anchor:a.reference.foot},{x:ox,y:oy,scale:1});
 const px=c.getImageData(0,0,cv.width,cv.height).data;let painted=0;
 for(let iy=0;iy<cv.height;iy++)for(let ix=0;ix<cv.width;ix++){const alpha=px[(iy*cv.width+ix)*4+3];if(alpha>8){painted++;assert(ix>=40&&ix<40+w&&iy>=40&&iy<40+h,`${a.id} paint outside viewBox`);}}
 assert(painted>1000);
 for(const [gx,gy] of a.groundContacts){assert.equal(gy,0);assert(c.getImageData(ox+gx,oy-3,1,1).data[3]>200,`${a.id} ground contact`);assert.equal(c.getImageData(ox+gx,oy+2,1,1).data[3],0,`${a.id} ground leak`);}
 for(const r of a.clearRegions){const p=c.getImageData(ox+r.x,oy+r.y,r.w,r.h).data;for(let i=3;i<p.length;i+=4)assert.equal(p[i],0,`${a.id}/${r.name} transparent passage`);}
 for(const f of a.floorSurfaces||[])for(let xx=f.x1+4;xx<f.x2-4;xx+=47)assert(c.getImageData(ox+xx,oy+f.y+2,1,1).data[3]>180,`${a.id}/${f.name} painted floor`);
 for(const solid of a.suggestedSolids||[]){
  const m=native.createCanvas(cv.width,cv.height),mc=m.getContext('2d');mc.beginPath();solid.points.forEach(([sx,sy],i)=>i?mc.lineTo(ox+sx,oy+sy):mc.moveTo(ox+sx,oy+sy));mc.closePath();mc.fill();const mp=mc.getImageData(0,0,m.width,m.height).data;let all=0,missing=0;for(let i=3;i<mp.length;i+=4)if(mp[i]>200){all++;if(px[i]<64)missing++;}assert(all>100);assert(missing/all<.006,`${a.id}/${solid.name} solid exceeds artwork: ${missing}/${all}`);m.width=1;m.height=1;
 }
 const roof=flat(vector.root).find(n=>n.id===a.roof.groupId);assert(roof,`${a.id} roof group`);c.clearRect(0,0,cv.width,cv.height);g.HonroVectorArt.draw(c,{vector:{...vector,root:{tag:'g',children:[roof]}}},{x:ox,y:oy,scale:1});const rp=c.getImageData(0,0,cv.width,cv.height).data,b=a.roof.bounds;
 for(let yy=0;yy<cv.height;yy++)for(let xx=0;xx<cv.width;xx++)if(rp[(yy*cv.width+xx)*4+3]>8)assert(xx-ox>=b.x&&xx-ox<b.x+b.w&&yy-oy>=b.y&&yy-oy<b.y+b.h,`${a.id} roof bounds`);
 for(const [width,height] of [[390,300],[760,500],[1440,960]]){const mobile=native.createCanvas(width,height),ctx=mobile.getContext('2d'),scale=Math.min((width-18)/w,(height-28)/h);g.HonroVectorArt.draw(ctx,{vector,anchor:a.reference.foot},{x:width/2,y:height-14,scale});const m=ctx.getImageData(0,0,width,height).data;let count=0;for(let i=3;i<m.length;i+=4)if(m[i]>8)count++;assert(count>300,`${a.id} size ${width} renders`);mobile.width=1;mobile.height=1;}
 report.push({id:a.id,bytes:Buffer.byteLength(source),paths:cache.pathCount,groundContacts:a.groundContacts.length,transparentRegions:a.clearRegions.length,floors:(a.floorSurfaces||[]).length,solids:(a.suggestedSolids||[]).length});cv.width=1;cv.height=1;
}
const output=path.join(root,'_local/reports/act3-architecture');await mkdir(output,{recursive:true});await writeFile(path.join(output,'validation.json'),JSON.stringify({passed:true,renderer:'HonroVectorArt / Native Canvas',assets:report,limits:['Geometry and Native pixel contract only','Map placement, actual collision reachability, browser and performance are separate checks']},null,2)+'\n');
console.log('PASS 10 Act 3 production SVGs: bounded vectors, local contacts, transparent passages, painted floors, solid/art agreement, 390/760/1440 viewport rendering');
