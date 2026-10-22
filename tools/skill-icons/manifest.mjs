import {readFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {skillInventory} from './inventory.mjs';

export const manifestPath='shared/assets/skill-icons/v1/manifest.json';
export async function validateSkillIcons({allowPending=false,manifest=null}={}){
 const source=manifest||JSON.parse(await readFile(manifestPath,'utf8')),inventory=await skillInventory();
 const hashes=new Map();let totalBytes=0,maxBytes=0;
 const expected=inventory.skills.map(s=>s.id),entries=source.icons||{},errors=[],pending=[],ready=[];
 if(source.schemaVersion!==1)errors.push('schemaVersion must be 1');
 if(!['pending','approved'].includes(source.artReview))errors.push('artReview must be pending or approved');
 for(const id of Object.keys(entries))if(!expected.includes(id))errors.push(`Unexpected skillID: ${id}`);
 for(const id of expected){
  const item=entries[id],file=`shared/assets/skill-icons/v1/${id}.webp`;
  if(!item){errors.push(`Missing manifest skillID: ${id}`);continue;}
  if(item.file!==file)errors.push(`${id}: file must be ${file}`);
  if(!['pending','ready'].includes(item.status)){errors.push(`${id}: invalid status`);continue;}
  let bytes;try{bytes=await readFile(file);}catch(e){if(e.code!=='ENOENT')throw e;}
  if(item.status==='pending'){
   pending.push(id);
   if(bytes)errors.push(`${id}: file exists but is still pending; supply checksum and mark ready`);
   if(item.sha256!==null)errors.push(`${id}: pending checksum must be null`);
   continue;
  }
  if(!bytes){errors.push(`${id}: READY FILE MISSING: ${file}`);continue;}
  if(bytes.toString('ascii',0,4)!=='RIFF'||bytes.toString('ascii',8,12)!=='WEBP')errors.push(`${id}: expected WebP bytes`);
  const hash=createHash('sha256').update(bytes).digest('hex');
  if(hash!==item.sha256)errors.push(`${id}: SHA-256 mismatch`);
  if(hashes.has(hash))errors.push(`${id}: duplicate image bytes with ${hashes.get(hash)}`);else hashes.set(hash,id);
  totalBytes+=bytes.length;maxBytes=Math.max(maxBytes,bytes.length);
  try{const image=sharp(bytes),meta=await image.metadata();await image.raw().toBuffer();if(meta.format!=='webp'||meta.width!==256||meta.height!==256)errors.push(`${id}: expected decodable 256x256 WebP`);}catch{errors.push(`${id}: image decode failed`);}
  ready.push(id);
 }
 for(const file of await readdir('shared/assets/skill-icons/v1'))if(file.endsWith('.webp')&&!expected.includes(file.slice(0,-5)))errors.push(`Unmapped image file: ${file}`);
 const complete=errors.length===0&&pending.length===0&&ready.length===expected.length&&source.artReview==='approved';
 if(!allowPending&&!complete)errors.push(`INCOMPLETE: ${ready.length}/${expected.length} files ready, ${pending.length} pending; art review ${source.artReview}`);
 return {source,expected,ready,pending,errors,complete,totalBytes,maxBytes,uniqueImages:hashes.size,status:complete?'complete':'awaiting-parent-images-and-art-review'};
}
if(process.argv[1]?.endsWith('/manifest.mjs')){
 const result=await validateSkillIcons({allowPending:process.argv.includes('--allow-pending')});
 console.log(JSON.stringify({status:result.status,complete:result.complete,expected:result.expected.length,ready:result.ready.length,pending:result.pending.length,totalBytes:result.totalBytes,maxBytes:result.maxBytes,uniqueImages:result.uniqueImages,errors:result.errors},null,2));
 if(result.errors.length)process.exitCode=1;
}
