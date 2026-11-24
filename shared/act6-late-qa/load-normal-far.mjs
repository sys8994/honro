import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const get=(n)=>readFile(new URL(n,import.meta.url));
const sha=b=>createHash('sha256').update(b).digest('hex');
export async function loadNormalFar(){
 const raw=await get('EARLY-FAR.json');
 assert.equal(sha(raw), '08783124bae59d71bc72dfb7aee57efe26a99eeb4f85257e9378b56aa910d8c4');
 const manifest=JSON.parse(raw),extras=[];
 assert.equal(manifest.schema,'honro-act6-stagefar-51-57/v1');
 assert.deepEqual(Object.keys(manifest.rows),['51','52','53','54','55','56','57']);
 for(const [id,row] of Object.entries(manifest.rows)){
  assert.deepEqual(Object.keys(row.plates).sort(),id==='51'?['portrait','wide']:['wide']);
  for(const [kind,plate] of Object.entries(row.plates)){
   assert.equal(plate.stage,+id);assert.equal(plate.mime,'image/webp');
   const stem='act6-far-'+id+'-'+kind,file=stem+'.'+plate.sha.slice(0,16)+'.webp';
   assert.equal(plate.path,'/web/graphics/'+file);
   const bytes=await get('early-art/'+file);
   assert.equal(bytes.length,plate.bytes);assert.equal(sha(bytes),plate.sha);extras.push({stem,plate,bytes});
  }
 }
 return {manifest,extras};
}
