import assert from 'node:assert/strict';
import {readFile,readdir,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
const tracks=JSON.parse(await readFile('shared/data/bgm.json','utf8'));
const expected=tracks.map(t=>`${t.id}_${t.place}_${t.title}.mp3`);
assert.equal(new Set(expected).size,27);
assert.deepEqual(tracks.map(t=>t.file),expected);
const files=(await readdir('assets/bgm')).filter(f=>/\.mp3$/i.test(f));
const report={verified:[],missing:expected.filter(f=>!files.includes(f)),unexpected:files.filter(f=>!expected.includes(f))};
for(const t of tracks){
 if(report.missing.includes(t.file))continue;
 const path='assets/bgm/'+t.file,bytes=await readFile(path);
 const hash=createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');assert.equal(hash,t.gitBlob,t.file);
 const probe=spawnSync(process.env.FFPROBE||'ffprobe',['-v','error','-show_entries','format=duration:stream=codec_name,sample_rate,channels:format_tags:stream_tags','-of','json',path],{encoding:'utf8'});
 assert.equal(probe.status,0,probe.error?.message||probe.stderr);const metadata=JSON.parse(probe.stdout);
 assert.equal(metadata.streams.length,1,t.file);assert.equal(metadata.streams[0].codec_name,'mp3');assert.ok(Number(metadata.format.duration)>0);
 assert.deepEqual(metadata.format.tags||{},{});assert.deepEqual(metadata.streams[0].tags||{},{});assert.equal(bytes[0],0xff);assert.notEqual(bytes.toString('ascii',bytes.length-128,bytes.length-125),'TAG');
 const decode=spawnSync(process.env.FFMPEG||'ffmpeg',['-v','error','-xerror','-i',path,'-map','0:a:0','-f','null','-'],{encoding:'utf8'});assert.equal(decode.status,0,decode.error?.message||decode.stderr);
 report.verified.push({...t,bytes:bytes.length,duration:Number(metadata.format.duration),audio:metadata.streams[0],decode:'full file to null; original bytes unchanged'});
}
await mkdir('_local/reports',{recursive:true});await writeFile('_local/reports/bgm-assets.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));assert.deepEqual(report.unexpected,[]);assert.deepEqual(report.missing,[],'Required attachment bytes are missing; do not build or integrate');
