// Deployment encoding only: no resize, crop, color adjustment or creative edits.
import sharp from 'sharp';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const sha=b=>createHash('sha256').update(b).digest('hex'),rows=[];
await mkdir('shared/assets/portraits/approved-v1',{recursive:true});
for(const id of ['seoro','damheo','hwigyeom','sodan']){
 const master=`art/portraits/approved-v1/${id}.png`,source=id==='seoro'?'art/portraits/runtime-derivatives-v1/seoro-base-clean.png':master,file=`shared/assets/portraits/approved-v1/${id}.webp`,identity=await readFile(master),original=await readFile(source),encoded=await sharp(original).webp({lossless:true,effort:6}).toBuffer();
 const left=await sharp(original).ensureAlpha().raw().toBuffer(),right=await sharp(encoded).ensureAlpha().raw().toBuffer();let changed=0,visibleChanged=0,alphaChanged=0;
 for(let i=0;i<left.length;i++)if(left[i]!==right[i]){changed++;if(i%4===3)alphaChanged++;else if(left[i-i%4+3])visibleChanged++;}
 if(visibleChanged||alphaChanged)throw Error(id+': visible RGBA changed');await writeFile(file,encoded);
 rows.push({id,identityMaster:master,identityMasterSha256:sha(identity),identityMasterBytes:identity.length,encodingSource:source,encodingSourceSha256:sha(original),encodingSourceBytes:original.length,file,width:1024,height:1536,encodedSha256:sha(encoded),encodedBytes:encoded.length,changedChannels:changed,visibleChangedChannels:visibleChanged,alphaChangedChannels:alphaChanged});
}
await writeFile('shared/assets/portraits/approved-v1/encoding.json',JSON.stringify({schema:2,operation:'encodingSource PNG to full-resolution lossless WebP; identity masters untouched; source derivative may be parent-generated and is not pixel-identical to identity master',comparison:'changed/visibleChanged/alphaChanged channels compare encodingSource against encoded WebP only',rows},null,2)+'\n');console.log(rows);
