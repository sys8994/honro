import{createCanvas,Path2D}from'@napi-rs/canvas';import vm from'node:vm';import assert from'node:assert/strict';import{readFile,writeFile,mkdir}from'node:fs/promises';
const root='_local/reports/density-rollout',out=root+'/storage-silhouette-4x',g={Path2D};vm.createContext(g);vm.runInContext(await readFile('shared/map/vector-art.js','utf8'),g);await mkdir(out,{recursive:true});const results=[];
for(const n of[32,34,37])for(const side of['left']){const buffers=[];for(const which of['before','after']){const file=which==='before'?`${root}/review-round3/${n}/project.json`:`${root}/storage-optimized/${n}/candidate-project.json`,p=JSON.parse(await readFile(file)),s=p.stages[0],views=p.production.cards[s.id].cameraViews,party=views.find(v=>v.id==='party'),v=side==='left'?{x:0,y:party.y,scale:.28,width:1440,height:900}:views.find(v=>v.id==='right-domain'),factor=4,c=createCanvas(v.width*factor,v.height*factor),ctx=c.getContext('2d');ctx.translate((v.width/2-v.x*v.scale)*factor,(v.height/2-v.y*v.scale)*factor);ctx.scale(v.scale*factor,v.scale*factor);for(const e of s.elements.filter(e=>e.assetId.includes('body')&&e.assetId.includes('-domain-'+side))){const a=p.library.find(a=>a.id===e.assetId);assert.deepEqual([e.x,e.y,e.scale||1],[0,0,1]);assert.equal(g.HonroVectorArt.validate(a.vector).length,0);g.HonroVectorArt.draw(ctx,a,{x:0,y:0});}buffers.push(ctx.getImageData(0,0,v.width*factor,v.height*factor).data);await writeFile(`${out}/${n}-${side}-${which}.png`,c.toBuffer('image/png'));}let alpha128DifferentPixels=0,maxRGBA=0,differentChannels=0;for(let i=0;i<buffers[0].length;i++){const d=Math.abs(buffers[0][i]-buffers[1][i]);maxRGBA=Math.max(maxRGBA,d);differentChannels+=d>0;if(i%4===3)alpha128DifferentPixels+=(buffers[0][i]>=128)!==(buffers[1][i]>=128);}results.push({stage:n,side,alpha128DifferentPixels,maxRGBA,differentChannels});}
await writeFile(out+'/report.json',JSON.stringify({scope:'Transparent actual vector renderer of all reflected-domain parts in original order. Silhouette comparison is alpha128 at normal wide camera, not a browser performance claim.',results},null,2));console.log(JSON.stringify(results));
// Analysis only: compare alpha-mask distance at4×, no image modification.
const {execFileSync}=await import('node:child_process');
execFileSync('python',['-c',`import json,numpy as np
from PIL import Image
from scipy.ndimage import distance_transform_edt
from pathlib import Path
root=Path('${out}'); results=[]
for n in [32,34,37]:
 a=np.asarray(Image.open(root/f'{n}-left-before.png'))[:,:,3]>=128
 b=np.asarray(Image.open(root/f'{n}-left-after.png'))[:,:,3]>=128
 d=max(float(distance_transform_edt(~b)[a].max()),float(distance_transform_edt(~a)[b].max()))
 css=d/4*.53/.28
 results.append(dict(stage=n,alpha128DifferentPixels=int((a!=b).sum()),hausdorffSupersamplePixels=d,normalCSSpx=css,thresholdNormalCSSpx=.5,pass_=css<=.5))
(root/'hausdorff.json').write_text(json.dumps(results,indent=2))
assert all(r['pass_'] for r in results)
print(json.dumps(results))`],{stdio:'inherit'});
