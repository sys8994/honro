import {createHash} from 'node:crypto';

// Transport packaging only: each part is an exact byte slice, not a new JSON
// object or lossy asset transform. Splits may cross UTF-8 characters; consumers
// concatenate bytes before decoding once.
export const webJsonPartBytes=4*1024*1024;
export const sha256=bytes=>createHash('sha256').update(bytes).digest('hex');
export async function emitJsonParts(name,value,emit,{maxBytes=webJsonPartBytes}={}){
  const body=JSON.stringify(value)+'\n',bytes=Buffer.from(body);
  if(bytes.length<=maxBytes)return emit('data',name,'json',body);
  const parts=[];
  for(let start=0,index=0;start<bytes.length;start+=maxBytes,index++){
    const chunk=bytes.subarray(start,Math.min(start+maxBytes,bytes.length));
    parts.push({path:await emit('data',`${name}-part-${String(index).padStart(3,'0')}`,'bin',chunk),bytes:chunk.length,sha256:sha256(chunk)});
  }
  return emit('data',name+'-parts','json',JSON.stringify({$honroJsonParts:1,bytes:bytes.length,sha256:sha256(bytes),parts})+'\n');
}
