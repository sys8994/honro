import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile,readdir} from 'node:fs/promises';
const g=vm.createContext({});vm.runInContext(await readFile('shared/runtime/music-titles.js','utf8'),g);
const expected=['떠나지 못한 이들을 위해','고갯길의 징조','머리 위의 불길','재가 흩날리는 밤','산 자와 남은 자'];
const files=(await readdir('assets/bgm')).filter(f=>f.endsWith('.mp3')).sort();assert.equal(files.length,5);
for(const [i,file] of files.entries())for(const source of ['assets/bgm/'+file,'https://example.test/honro/assets/bgm/'+encodeURIComponent(file)+'?v=old#stream']){
 assert.equal(g.HonroMusicTitles.titleFor(source),expected[i]);
 assert.equal(g.HonroMusicTitles.titles[String(i+1).padStart(2,'0')],expected[i]);
}
assert.equal(g.HonroMusicTitles.titleFor('assets/bgm/99%20battle%20theme%20-%20낯선%20곡.mp3'),'낯선 곡');
assert.doesNotThrow(()=>g.HonroMusicTitles.titleFor('assets/bgm/%E0%A4%A.mp3'));
console.log('PASS five approved titles across retained and encoded URLs; readable fallback; no prefixes or file extension');
