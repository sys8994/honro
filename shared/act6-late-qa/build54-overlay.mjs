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
 const alt=JSON.parse(await get('55-ROW.json')),bytes55=gunzipSync(Buffer.from((await get('55-packet.gzip.b64')).toString(),'base64'),{maxOutputLength:1024*1024});
 const sha55=createHash('sha256').update(bytes55).digest('hex');
 assert.equal(alt.sha256,sha55);assert.equal(alt.bytes,bytes55.length);assert.equal(alt.path,'/web/data/act6-qa-chapter-55.'+sha55.slice(0,16)+'.json');
 const third=JSON.parse(await get('56-ROW.json')),bytes56=gunzipSync(Buffer.from((await get('56-packet.gzip.b64')).toString(),'base64'),{maxOutputLength:1024*1024});
 const sha56=createHash('sha256').update(bytes56).digest('hex');
 assert.equal(third.sha256,sha56);assert.equal(third.bytes,bytes56.length);assert.equal(third.path,'/web/data/act6-qa-chapter-56.'+sha56.slice(0,16)+'.json');
 const fourth=JSON.parse(await get('57-ROW.json')),bytes57=gunzipSync(Buffer.from((await get('57-packet.gzip.b64')).toString(),'base64'),{maxOutputLength:1024*1024});
 const sha57=createHash('sha256').update(bytes57).digest('hex');
 assert.equal(fourth.sha256,sha57);assert.equal(fourth.bytes,bytes57.length);assert.equal(fourth.path,'/web/data/act6-qa-chapter-57.'+sha57.slice(0,16)+'.json');
 const fifth=JSON.parse(await get('58-ROW.json')),bytes58=gunzipSync(Buffer.from((await get('58-packet.gzip.b64')).toString(),'base64'),{maxOutputLength:1024*1024});
 const sha58=createHash('sha256').update(bytes58).digest('hex');
 assert.equal(fifth.sha256,sha58);assert.equal(fifth.bytes,bytes58.length);assert.equal(fifth.path,'/web/data/act6-qa-chapter-58.'+sha58.slice(0,16)+'.json');
 const last=JSON.parse(await get('59-ROW.json')),bytes59=gunzipSync(Buffer.from((await get('59-packet.gzip.b64')).toString(),'base64'),{maxOutputLength:1024*1024});
 const sha59=createHash('sha256').update(bytes59).digest('hex');
 assert.equal(last.sha256,sha59);assert.equal(last.bytes,bytes59.length);assert.equal(last.path,'/web/data/act6-qa-chapter-59.'+sha59.slice(0,16)+'.json');
 const ending=JSON.parse(await get('60-ROW.json')),bytes60=gunzipSync(Buffer.from((await get('60-packet.gzip.b64')).toString(),'base64'),{maxOutputLength:1024*1024});
 const sha60=createHash('sha256').update(bytes60).digest('hex');
 assert.equal(ending.sha256,sha60);assert.equal(ending.bytes,bytes60.length);assert.equal(ending.path,'/web/data/act6-qa-chapter-60.'+sha60.slice(0,16)+'.json');
 const far59Bytes=await get('stage59-far-q94-derived.webp');
 const far59SHA=createHash('sha256').update(far59Bytes).digest('hex');
 assert.equal(far59SHA,'e1b0e699a8349a0af93f4717b06ef4a7ddffa5b4abf15261cd3881d3691383e1');
 assert.equal(far59Bytes.length,280846);
 const far59='web/graphics/act6-qa-art-59.'+far59SHA.slice(0,16)+'.webp';
 const farEarly=JSON.parse(await get('EARLY-FAR.json')),extras=[];
 assert.equal(farEarly.schema,'honro-act6-stagefar-51-57/v1');
 assert.deepEqual(Object.keys(farEarly.rows),['51','52','53','54','55','56','57']);
 for(const [id,r] of Object.entries(farEarly.rows))for(const [kind,plate] of Object.entries(r.plates)){
  assert.equal(plate.stage,+id);assert.equal(plate.mime,'image/webp');
  const stem='act6-far-'+id+'-'+kind,file=stem+'.'+plate.sha.slice(0,16)+'.webp';
  assert.equal(plate.path,'/web/graphics/'+file);
  const bytes=await get('early-art/'+file);
  assert.equal(bytes.length,plate.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),plate.sha);
  extras.push({stem,bytes,sha:plate.sha});
 }
 assert.equal(extras.length,8);
 const far58File='act6-far-58-wide.696fd1dfe489567e.webp',wide58=await get('early-art/'+far58File),sha58Far=createHash('sha256').update(wide58).digest('hex');
 assert.equal(wide58.length,343208);assert.equal(sha58Far,'696fd1dfe489567e8032a3f2a2a8be45539ddae488e67baf01f37f82c382e22d');
 extras.push({stem:'act6-far-58-wide',bytes:wide58,sha:sha58Far});

 const far60=JSON.parse(await get('FAR60.json')),stem60='act6-far-60-playable';
 const fname60=stem60+'.'+far60.sha.slice(0,16)+'.webp',art60=await get('early-art/'+fname60);
 assert.equal(far60.path,'/web/graphics/'+fname60);
 assert.equal(far60.schema,'honro-act6-playable-far60/v1');
 assert.equal(far60.bytes,art60.length);assert.equal(far60.sha,createHash('sha256').update(art60).digest('hex'));
 extras.push({stem:stem60,bytes:art60,sha:far60.sha});
 return {descriptor:{...descriptor,farEarly,far60,visual59:{path:"/"+far59,sha256:far59SHA},lateRows:{54:row,55:alt,56:third,57:fourth,58:fifth,59:last,60:ending}},visual:[...extras,{stem:"act6-qa-art-59",bytes:far59Bytes,sha:far59SHA},{stem:"act6-dawn-pc",bytes:await get("dawn-pc.webp"),sha:"cb000c13e990325498c7996f423b6b459cc586d8ee4d20912b7a1db79944e25f"},{stem:"act6-dawn-mobile",bytes:await get("dawn-mobile.webp"),sha:"56e249516f335f8762883a94715a49043aee8c4598847d27c90f15289f461a61"}],assets:[{name:row.path.slice(1),bytes},{name:alt.path.slice(1),bytes:bytes55},{name:third.path.slice(1),bytes:bytes56},{name:fourth.path.slice(1),bytes:bytes57},{name:fifth.path.slice(1),bytes:bytes58},{name:last.path.slice(1),bytes:bytes59},{name:ending.path.slice(1),bytes:bytes60}],finish:source=>extendStage53QaMain(source,true)};
}
