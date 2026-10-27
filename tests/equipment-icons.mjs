import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import sharp from 'sharp';
const items=JSON.parse(await readFile('game/docs/equipment/honro_equipment_52_v03.json')).items,manifest=JSON.parse(await readFile('web/manifest.json')),approved='ef7c3ae158ea0e2f147b73374d972e0940a20fd3';let bytes=0;
const sha=b=>createHash('sha256').update(b).digest('hex');
for(const item of items){const file=item.iconAssetProposal,data=await readFile(file),meta=await sharp(data).metadata();assert.equal(meta.width,256);assert.equal(meta.height,256);assert.equal(meta.format,'webp');bytes+=data.length;const blob=execFileSync('git',['rev-parse',`${approved}:${file}`],{encoding:'utf8'}).trim(),actual=execFileSync('git',['hash-object','--stdin'],{input:data,encoding:'utf8'}).trim();assert.equal(actual,blob,item.itemId+' approved source bytes');const out=manifest.files.find(r=>r.path.startsWith('web/graphics/honro_equipment_icons-'+item.itemId+'.'));assert(out,item.itemId+' active web graph');assert.equal(out.sha256,sha(data));assert.equal(sha(await readFile(out.path)),sha(data));}
assert.equal(items.length,52);assert.equal(bytes,637782);console.log('PASS52 final256px icons: approved Git blobs and active web graph bytes identical;637782 bytes');
