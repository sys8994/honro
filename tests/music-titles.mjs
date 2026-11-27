import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const catalog=JSON.parse(await readFile('shared/data/bgm.json','utf8'));
const g=vm.createContext({HONRO_BGM_METADATA:catalog});vm.runInContext(await readFile('shared/runtime/music-titles.js','utf8'),g);
assert.equal(catalog.length,27);
for(const item of catalog)for(const source of ['assets/bgm/'+item.file,'https://example.test/honro/assets/bgm/'+encodeURIComponent(item.file)+'?v=current#stream']){
 const title=item.file.slice(0,-4).split('_')[2];
 assert.equal(g.HonroMusicTitles.titleFor(source),title);assert.equal(g.HonroMusicTitles.titles[item.id],title);
}
assert.equal(g.HonroMusicTitles.titles['01'],'혼로');
assert.doesNotThrow(()=>g.HonroMusicTitles.titleFor('assets/bgm/%E0%A4%A.mp3'));
console.log('PASS 27 filenames and display titles, including encoded media URLs');
