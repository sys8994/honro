import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const sha=b=>createHash('sha256').update(b).digest('hex');
const get=x=>readFile(new URL(x,import.meta.url));
export async function loadNormalFinalFar(){
 const json=await get('FAR60.json');
 assert.equal(sha(json),'f305a9bc58109d4f9725177254bcb27549c5fa6477cc7eed1251d9ca0720cd27');
 const plate=JSON.parse(json),stem='act6-far-60-playable',
 bytes=await get('early-art/act6-far-60-playable.13785df44a84667e.webp');
 assert.equal(sha(bytes),plate.sha);assert.equal(bytes.length,plate.bytes);
 assert.equal(plate.path,'/web/graphics/'+stem+'.'+plate.sha.slice(0,16)+'.webp');
 return {plate,bytes,stem};
}
