// Deployment encoding only; never modify approved identity PNGs.
import sharp from 'sharp';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const sourceDir='art/portraits/npc-game-tone-v3',out='_local/reports/npc-game-tone-v3',hash=b=>createHash('sha256').update(b).digest('hex');
await mkdir(out,{recursive:true});const install=process.argv.includes('--install'),rows=install?JSON.parse(await readFile(out+'/encoding-candidates.json','utf8')):[];
if(!install)for(const source of JSON.parse(await readFile(sourceDir+'/manifest.json','utf8'))){
 const file=sourceDir+'/'+source.id+'.png',png=await readFile(file);if(hash(png)!==source.sha256)throw Error(file+' SHA');
 for(const [width,quality]of [[512,94],[768,94],[768,'lossless']]){
  const reference=await sharp(png).resize(width).ensureAlpha().raw().toBuffer(),encoded=await sharp(png).resize(width).webp(quality==='lossless'?{lossless:true,effort:6}:{quality,alphaQuality:100,smartSubsample:true,effort:6}).toBuffer(),pixels=await sharp(encoded).ensureAlpha().raw().toBuffer();let error=0,weight=0,alphaChanged=0;
  for(let i=0;i<reference.length;i+=4){const a=reference[i+3]/255;alphaChanged+=reference[i+3]!==pixels[i+3];for(let c=0;c<3;c++){error+=(reference[i+c]-pixels[i+c])**2*a;weight+=a;}}
  const target=out+'/'+source.id+'-'+width+'-'+quality+'.webp';await writeFile(target,encoded);rows.push({id:source.id,source:file,sourceSha256:source.sha256,width,height:width*1.5,quality,file:target,bytes:encoded.length,sha256:hash(encoded),alphaChangedPixels:alphaChanged,weightedPsnr:error?10*Math.log10(255**2/(error/weight)):null});
 }
}
await writeFile(out+'/encoding-candidates.json',JSON.stringify(rows,null,2)+'\n');console.log(JSON.stringify([512,768].flatMap(width=>[94,'lossless'].map(quality=>({width,quality,bytes:rows.filter(r=>r.width===width&&r.quality===quality).reduce((n,r)=>n+r.bytes,0)}))).filter(r=>r.bytes)));
if(install){
 const config=JSON.parse(await readFile('game/config/npc-portraits.json','utf8')),selected=rows.filter(r=>r.width===768&&r.quality===94),dest='shared/assets/portraits/npc-game-tone-v3';
 if(selected.length!==9)throw Error('Generate and review nine candidates first');await mkdir(dest,{recursive:true});
 for(const r of selected){const id=r.id==='keeper'?'keeper_ritual':r.id,a=config.assets[id],k=r.width/a.width,bytes=await readFile(r.file);if(hash(bytes)!==r.sha256||hash(await readFile(r.source))!==r.sourceSha256)throw Error(id+' hash');
  a.identityMaster??={file:a.source,sha256:a.sourceSha256};a.file=dest+'/'+r.id+'.webp';a.source=r.source;a.sourceSha256=r.sourceSha256;a.sourceCommit='c21cfd1192606ff6181bdf7f6a69ac60a79a62ce';a.width=r.width;a.height=r.height;
  for(const box of [a.head,a.bust,a.framing?.dialogue?.face])if(box)for(const key of Object.keys(box))box[key]*=k;if(a.framing?.dialogue?.maxHeight)a.framing.dialogue.maxHeight*=k;await writeFile(a.file,bytes);
 }
 await writeFile('game/config/npc-portraits.json',JSON.stringify(config,null,2)+'\n');await writeFile(dest+'/encoding.json',JSON.stringify({operation:'768x1152 WebP quality94, alpha100; deployment resize/encoding only',sourceCommit:'c21cfd1192606ff6181bdf7f6a69ac60a79a62ce',rows:selected},null,2)+'\n');
}
