/** Source + production App title contracts. DOM is a double; not browser or art approval. */
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {appHarness,plain} from './app-regression-helpers.mjs';
const css=await readFile('game/src/title.css','utf8'),build=await readFile('game/build.mjs','utf8'),main=await readFile('shared/runtime/main.js','utf8');
assert(build.includes('orientation: portrait')&&build.includes('portrait.webp')&&build.includes('landscape.webp'));
assert(build.includes('portrait.jpg')&&build.includes('landscape.jpg'),'format fallback for both authored compositions');
assert(!build.includes('title-first-ferry.svg')&&!build.includes('title-wordmark.svg'),'old tree/H artwork no longer consumed');
assert(css.includes('prefers-reduced-motion:reduce')&&css.includes('focus-visible'));
assert(!css.includes('title-arrive')&&!css.includes('animation:title'),'no entrance delay or moving backdrop');
assert(css.includes('pointer-events:none')&&css.includes('object-position:right bottom'));
assert(main.includes('onerror="this.hidden=true;this.nextElementSibling.hidden=false"'),'readable logo failure fallback');
assert(main.includes('aria-label="혼로"')&&main.includes('class="title-hanja" aria-hidden="true"')&&main.includes('class="title-hangul" aria-hidden="true"'));
assert(!main.includes('class="title-roman"'),'exactly two title tiers, no legacy Roman third tier');
assert(build.includes("titleAsset('hanja-wordmark.png','image/png')")&&build.includes('globalThis.HONRO_TITLE_HANJA='));
const hanja=await readFile('shared/assets/environment/title/hanja-wordmark.png');
assert.equal(hanja.toString('hex',0,8),'89504e470d0a1a0a');
assert.equal(hanja.readUInt32BE(16),1859);assert.equal(hanja.readUInt32BE(20),846);assert.equal(hanja[25],6,'RGBA PNG preserves alpha');
assert(css.includes('aspect-ratio:1859/846')&&css.includes('aspect-ratio:1.85'),'failure fallback reserves the complete title footprint');
assert(css.includes('left:97%;top:48%')&&css.includes('flex-direction:column;width:11.5%'),'upright Hangul sits at the lower-right of Hanja');
assert(css.includes('aspect-ratio:575/550')&&css.includes('left:-91.304347826%')&&css.includes('clip-path:polygon'),'complementary source clips preserve the full Hangul brush tips');
assert(!css.includes('rotate('),'the whole word must never rotate');
assert(main.includes('feTurbulence type="fractalNoise"')&&main.includes('feComposite in2="SourceGraphic" operator="in"'),'stationary organic ink colors only the approved alpha');
let bytes=0;for(const file of ['landscape.webp','portrait.webp','landscape.jpg','portrait.jpg','wordmark.png','hanja-wordmark.png'])bytes+=(await stat('shared/assets/environment/title/'+file)).size;
assert(bytes<1650000,`title art encoded budget: ${bytes}`);
const h=await appHarness(),a=h.reload(),fresh=plain(a.profile);
h.g.HONRO_TITLE_SCENE='<picture class="title-painting"></picture>';h.g.HONRO_TITLE_LOGO='data:image/png;base64,AA==';h.g.HONRO_TITLE_HANJA='data:image/png;base64,AA==';
for(const c of [
 {label:'fresh',changes:{},text:'길을 열다',actions:['rest']},
 {label:'progress',changes:{cleared:{1:{}}},text:'여정 이어가기',actions:['rest']},
 {label:'saved battle',changes:{honroBattle:{stageId:1}},text:'이어서 걷기',actions:['continue','rest']},
 {label:'interrupted story',changes:{honroJourney:{story:{id:'test'}},honroBattle:{stageId:1}},text:'쉼터 대화 이어가기',actions:['rest','continue']},
 {label:'interrupted story without battle',changes:{honroJourney:{story:{id:'test'}}},text:'쉼터 대화 이어가기',actions:['rest']},
]){
 a.profile={...plain(fresh),...c.changes};const before=JSON.stringify(a.profile);a.showTitle();const html=a.root.innerHTML;
 assert(html.includes(c.text),c.label);const group=html.match(/<div class="title-actions">(.*?)<\/div>/s)[1];
 assert.deepEqual([...group.matchAll(/data-action="(.*?)"/g)].map(m=>m[1]),c.actions,c.label);
 assert.equal(JSON.stringify(a.profile),before,'title rendering cannot change saves');
 for(const action of ['settings','import-map','journal'])assert(html.includes(`data-action="${action}"`));
 assert(html.includes('<h1 class="title-brand" aria-label="혼로">')&&html.includes('<picture'));
 assert.equal((html.match(/class="title-hanja"/g)||[]).length,1);assert.equal((html.match(/class="title-hangul"/g)||[]).length,1);
 assert(html.indexOf('title-hanja')<html.indexOf('title-hangul'));assert(html.includes('>魂路</span>')&&html.includes('>혼</span>')&&html.includes('>로</span>'));
 assert.equal((html.match(/class="honro-logo honro-logo-hangul"/g)||[]).length,2);
 assert(html.indexOf('title-reading-glyph-0')<html.indexOf('title-reading-glyph-1'));
 assert.equal((html.match(/id="honro-title-ink"/g)||[]).length,1,'one stationary title ink filter per render');
 a.showTitle();assert.equal(a.root.innerHTML,html,'repeated title entry stable');
}
h.g.HONRO_TITLE_HANJA='';a.showTitle();assert(a.root.innerHTML.includes('<span class="title-logo-fallback">魂路</span>'));assert(a.root.innerHTML.includes('honro-logo-hangul'));
h.g.HONRO_TITLE_LOGO='';a.showTitle();assert(a.root.innerHTML.includes('<span class="title-reading-fallback">혼</span>')&&a.root.innerHTML.includes('<span class="title-reading-fallback">로</span>')); assert(!a.root.innerHTML.includes('class="honro-logo '),'both missing images retain exact readable two-tier text');
console.log(`PASS title contracts: confirmed 魂路 + upright lower-right 혼/로 + alpha-preserving ash ink; separate art + fallback + accessibility + no delay; 5 save-state branches and repeat entry; ${bytes} encoded bytes. Browser and art approval are separate.`);
