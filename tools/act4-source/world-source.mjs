/** Lossless source transport. Chunks are literal UTF-8, never compressed or reserialized. */
import {readFile,writeFile,mkdir,rename,rm,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
export const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
export const defaultDirectory=path.join(root,'shared/data/act4');
export const chunkBytes=2*1024*1024;
const sha=b=>createHash('sha256').update(b).digest('hex');
const decode=b=>new TextDecoder('utf-8',{fatal:true}).decode(b);
async function atomic(file,bytes){const tmp=file+'.tmp-'+process.pid;try{await writeFile(tmp,bytes);await rename(tmp,file);}finally{await rm(tmp,{force:true});}}
export async function readWorldSource(directory=defaultDirectory){
 const manifest=JSON.parse(await readFile(path.join(directory,'world.parts/manifest.json'),'utf8'));
 if(manifest.version!==1||manifest.encoding!=='utf-8'||!Array.isArray(manifest.parts)||!manifest.parts.length)throw Error('Invalid Act4 world source manifest');
 const parts=[];
 for(const [i,entry] of manifest.parts.entries()){
  const expected=`part-${String(i).padStart(3,'0')}.jsonpart`;
  if(entry.file!==expected||!Number.isSafeInteger(entry.bytes)||entry.bytes<1||entry.bytes>chunkBytes||!/^[a-f0-9]{64}$/.test(entry.sha256))throw Error('Invalid Act4 source part: '+entry.file);
  const bytes=await readFile(path.join(directory,'world.parts',entry.file));
  if(bytes.length!==entry.bytes||sha(bytes)!==entry.sha256)throw Error('Act4 source part checksum mismatch: '+entry.file);
  decode(bytes);parts.push(bytes);
 }
 const bytes=Buffer.concat(parts);
 if(bytes.length!==manifest.bytes||sha(bytes)!==manifest.sha256)throw Error('Act4 world source checksum mismatch');
 JSON.parse(decode(bytes));
 return {bytes,manifest};
}
export async function materializeWorld({directory=defaultDirectory}={}){
 const {bytes,manifest}=await readWorldSource(directory),file=path.join(directory,'world.json');
 let current;try{current=await readFile(file);}catch(e){if(e.code!=='ENOENT')throw e;}
 if(current&&!current.equals(bytes))throw Error('Act4 world.json has unpacked edits. Run npm run act4:source:pack to preserve intended edits; do not overwrite them.');
 if(!current)await atomic(file,bytes);
 return {file,bytes:bytes.length,sha256:manifest.sha256,created:!current};
}
export async function packWorld({directory=defaultDirectory}={}){
 const bytes=await readFile(path.join(directory,'world.json'));JSON.parse(decode(bytes));
 const parts=[],folder=path.join(directory,'world.parts');await mkdir(folder,{recursive:true});
 for(let start=0;start<bytes.length;){
  let end=Math.min(bytes.length,start+chunkBytes);
  while(end<bytes.length&&(bytes[end]&0xc0)===0x80)end--;
  const part=bytes.subarray(start,end);decode(part);
  const file=`part-${String(parts.length).padStart(3,'0')}.jsonpart`;
  await atomic(path.join(folder,file),part);parts.push({file,bytes:part.length,sha256:sha(part)});start=end;
 }
 const manifest={version:1,encoding:'utf-8',bytes:bytes.length,sha256:sha(bytes),parts};
 await atomic(path.join(folder,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
 for(const name of await readdir(folder))if(/^part-\d+\.jsonpart$/.test(name)&&!parts.some(p=>p.file===name))await rm(path.join(folder,name));
 const verified=await readWorldSource(directory);if(!verified.bytes.equals(bytes))throw Error('Act4 pack roundtrip failed');
 return manifest;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const command=process.argv[2]||'materialize';
 if(!['pack','materialize','check'].includes(command))throw Error('Usage: world-source.mjs [pack|materialize|check]');
 const result=command==='pack'?await packWorld():command==='check'?(await readWorldSource()).manifest:await materializeWorld();
 console.log(JSON.stringify({operation:command,bytes:result.bytes,sha256:result.sha256,parts:result.parts?.length,created:result.created}));
}
