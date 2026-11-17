import {readFile,writeFile} from 'node:fs/promises';import path from 'node:path';import assert from 'node:assert/strict';import {createCanvas,loadImage} from '@napi-rs/canvas';
const dir=process.argv[2],views=['portrait-bl','desktop-br','portrait-tl','desktop-tl'],out=[];
const load=async(v,w)=>JSON.parse(await readFile(path.join(dir,`stage7-${v}-${w}.json`),'utf8'));
const pixels=async(v,w)=>{const im=await loadImage(await readFile(path.join(dir,`stage7-${v}-${w}.png`)));const c=createCanvas(im.width,im.height);const x=c.getContext('2d');x.drawImage(im,0,0);return x.getImageData(0,0,im.width,im.height).data;};
for(const view of views){const b=await load('baseline',view),r=await load('rejected',view),c=await load('candidate',view);
 for(const q of [r,c])for(const key of ['stage','stageSha256','physicsSha256','camera','width','height','dpr','seed','time'])assert.deepEqual(q[key],b[key],key);
 assert.equal(c.bodySha256,b.bodySha256,'Optimized original body mismatch');assert.notEqual(r.bodySha256,b.bodySha256,'Rejected body unexpectedly equals baseline');
 const p=await pixels('candidate',view),metrics={};
 for(const [variant,z]of [['baseline',await pixels('baseline',view)],['rejected',await pixels('rejected',view)]]){let changed=0,max=0;for(let i=0;i<p.length;i+=4){let d=0;for(let j=0;j<4;j++)d=Math.max(d,Math.abs(p[i+j]-z[i+j]));if(d)changed++;max=Math.max(max,d);}metrics[variant]={changed,max};}
 out.push({view,originalBodyExact:true,physicsCameraStageExact:true,metrics,visualReview:'PENDING'});
}
assert(out.filter(r=>r.view.endsWith('bl')||r.view.endsWith('br')).some(r=>r.metrics.rejected.changed>0),'Must exclude actual rejected rendering');
await writeFile(path.join(dir,'comparison.json'),JSON.stringify({scope:'Three-way synthetic Chrome. Not public UI/device/gameplay or completed outer repair.',out},null,2));console.log(JSON.stringify(out));
