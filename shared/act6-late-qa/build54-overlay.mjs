import {gunzipSync} from 'node:zlib';
import fs from 'node:fs/promises';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
import {extendStage53QaMain} from './shape-54-source.mjs';
export async function createStage54QaOverlay({enabled,descriptor,assertDisposableRoot,root}={}){
 if(enabled!==true)return null;
 assert.equal(typeof assertDisposableRoot,'function');await assertDisposableRoot(root);
 assert.equal(descriptor.origin,'http://127.0.0.1:18861');assert.deepEqual(Object.keys(descriptor.rows),['51','52','53']);assert.equal(descriptor.lateRows,undefined);
 const get=(filename)=>fs.readFile(new URL(filename,import.meta.url));
 const [manifest,encoded]=await Promise.all([get('54-ROW.json'),get('54-packet.gzip.b64')]),row=JSON.parse(manifest),bytes=gunzipSync(Buffer.from(encoded.toString(),'base64'),{maxOutputLength:1024*1024});
 const digest=createHash('sha256').update(bytes).digest('hex');
 assert.equal(row.sha256,digest);assert.equal(row.bytes,bytes.length);assert.equal(row.path,'/web/data/act6-qa-chapter-54.'+digest.slice(0,16)+'.json');
 return {descriptor:{...descriptor,lateRows:{54:row}},asset:{name:row.path.slice(1),bytes},finish:source=>extendStage53QaMain(source,true)};
}
