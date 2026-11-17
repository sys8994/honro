import{readFile,writeFile}from'node:fs/promises';import assert from'node:assert/strict';import path from'node:path';import{createCanvas,loadImage}from'@napi-rs/canvas';
const dir=process.argv[2],rows=[],expected={lower:'db362ea1c2fd5a85e9ec2a00dab8a1d1ddf0398d1e814c85d1e814c85d1bb4f147eae065b',left:'433ee070c4a868b336687a58438066bcafef57af8e108316d74a487c1da77b65'};
expected.lower='db362ea1c2fd5a85e9ec2a00dab8a1d1ddf0398d1e814c85d1bb4f147eae065b';
for(const view of ['lower','left']){
 const names=['candidate','spatial','transition'],data=await Promise.all(names.map(v=>readFile(path.join(dir,`stage32-${v}-${view}.json`),'utf8').then(JSON.parse)));
 assert.equal(data[0].pngSha256,expected[view],'Frozen baseline changed');
 const pixels=await Promise.all(names.map(async v=>{const im=await loadImage(path.join(dir,`stage32-${v}-${view}.png`)),c=createCanvas(im.width,im.height).getContext('2d');c.drawImage(im,0,0);return c.getImageData(0,0,im.width,im.height).data;}));
 const differences=[];for(let n=1;n<3;n++){for(const k of ['camera','width','height','physicsSha256','battleSha256','sourceCanonicalSha256','vectorSHA','sourcePathHashes','runtimeSha256'])assert.deepEqual(data[0][k],data[n][k],k);let changed=0,alpha=0,aboveRoadBuffer=0;for(let k=0;k<pixels[0].length;k+=4){if(pixels[0][k+3]!==pixels[n][k+3])alpha++;let d=false;for(let c=0;c<4;c++)d ||= pixels[0][k+c]!==pixels[n][k+c];if(d){changed++;const y=Math.floor(k/4/1331),wy=data[0].camera.y+(y-763/2)/.6;if(wy<=1380)aboveRoadBuffer++;}}assert.equal(alpha,0,'Alpha changed');assert.equal(aboveRoadBuffer,0,'Road/walk buffer changed');differences.push({variant:names[n],changed,alpha,aboveRoadBuffer});}
 rows.push({view,differences,performance:Object.fromEntries(names.map((v,i)=>[v,data[i].performanceReport])),visualAcceptance:'PENDING; candidate PNG is not a golden and no equality with experimental spatial output is required'});
}
await writeFile(path.join(dir,'original-band-performance-comparison.json'),JSON.stringify(rows,null,2));console.log(JSON.stringify(rows));
