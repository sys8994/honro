// Encoding only. Preserve parent PNG masters, full native size and visible RGBA.
import sharp from 'sharp';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const dir='art/portraits/npc-plain-v2',out='shared/assets/portraits/npc-plain-v2',sha=b=>createHash('sha256').update(b).digest('hex');
const manifest=JSON.parse(await readFile(dir+'/manifest.json','utf8')),rows=[];
await mkdir(out,{recursive:true});
for(const entry of manifest.assets){
 const source=dir+'/'+entry.file,original=await readFile(source);if(sha(original)!==entry.sha256)throw Error(entry.id+' source SHA');
 const file=out+'/'+entry.id+'.webp',encoded=await sharp(original).webp({lossless:true,effort:6}).toBuffer(),a=await sharp(original).ensureAlpha().raw().toBuffer(),b=await sharp(encoded).ensureAlpha().raw().toBuffer();let visible=0,alpha=0;
 for(let i=0;i<a.length;i++)if(a[i]!==b[i]){if(i%4===3)alpha++;else if(a[i-i%4+3])visible++;}
 if(alpha||visible)throw Error(entry.id+' visible RGBA changed');await writeFile(file,encoded);rows.push({...entry,source,file,bytes:encoded.length,encodedSha256:sha(encoded),visibleChangedChannels:visible,alphaChangedChannels:alpha});
}
await writeFile(out+'/encoding.json',JSON.stringify({operation:'full-resolution lossless WebP, no creative edits',rows},null,2)+'\n');console.log(rows.map(r=>({id:r.id,bytes:r.bytes})));
