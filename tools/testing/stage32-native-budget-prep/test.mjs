import assert from 'node:assert/strict';import {plan,LIMIT} from './planner.mjs';import fs from 'node:fs';
const retained={material:1331*763*4,work:1331*290*4,color:4,body:4,ss:4*1024*1024,mask:4*1024*1024};
const rows=[];
for(const [name,cw,ch,dpr] of [['desktop1080',1920,1080,1],['phoneD2',390,696,2],['phoneD3',390,696,3],['4K',3840,2160,1]]){
 const w=cw*dpr,h=ch*dpr,s=1.65*dpr;const p=plan({width:w,height:h,matrix:[s,0,0,s,w/2-1650*s,h/2-1650*s],nativeLive:true,sceneScale:1.65,paintValid:true,retained});rows.push({name,...p});assert(p.afterRelease>=w*h*4);if(name!=='4K')assert(p.admissible);
}
assert(!plan({width:390,height:696,matrix:[1,0,0,1,0,0],nativeLive:false,sceneScale:1,paintValid:true,retained}).admissible);
assert(!plan({width:1920,height:1080,matrix:[1.65,0,0,1.65,0,0],nativeLive:true,sceneScale:1.65,paintValid:false,retained}).admissible);
assert.equal(LIMIT,50331648);fs.writeFileSync(new URL('./arithmetic.json',import.meta.url),JSON.stringify({ready:false,rows},null,2));console.log(rows.map(x=>[x.name,x.admissible,x.afterRelease,x.beforeRelease]));
