import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const catalog=JSON.parse(await readFile('shared/data/bgm.json','utf8'));
const g=vm.createContext({HONRO_BGM_METADATA:catalog});vm.runInContext(await readFile('shared/runtime/music-titles.js','utf8'),g);
const expected=['혼로','장막 너머의 음','하늘의 그림자','산 자와 남은 자','불길의 춤','암막','불완전한 의식'];
assert.equal(catalog.length,7);
for(const [i,item] of catalog.entries())for(const source of ['assets/bgm/'+item.file,'https://example.test/honro/assets/bgm/'+encodeURIComponent(item.file)+'?v=current#stream']){
 assert.equal(g.HonroMusicTitles.titleFor(source),expected[i]);assert.equal(g.HonroMusicTitles.titles[item.id],expected[i]);
}
assert.equal(g.HonroMusicTitles.titleFor('assets/bgm/'+encodeURIComponent('[battle 6] ]불완전한 의식.mp3')),'불완전한 의식');
assert.doesNotThrow(()=>g.HonroMusicTitles.titleFor('assets/bgm/%E0%A4%A.mp3'));
console.log('PASS seven attachment display titles, encoded URLs and bracket typo; metadata only (asset bytes checked separately)');
