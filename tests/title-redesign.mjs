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
assert(main.includes('aria-label="혼로"')&&main.includes('class="title-roman" aria-hidden="true">HONRO'));
let bytes=0;for(const file of ['landscape.webp','portrait.webp','landscape.jpg','portrait.jpg','wordmark.png'])bytes+=(await stat('shared/assets/environment/title/'+file)).size;
assert(bytes<800000,`title art encoded budget: ${bytes}`);
const h=await appHarness(),a=h.reload(),fresh=plain(a.profile);
h.g.HONRO_TITLE_SCENE='<picture class="title-painting"></picture>';h.g.HONRO_TITLE_LOGO='data:image/png;base64,AA==';
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
 a.showTitle();assert.equal(a.root.innerHTML,html,'repeated title entry stable');
}
h.g.HONRO_TITLE_LOGO='';a.showTitle();assert(a.root.innerHTML.includes('<span class="title-logo-fallback">혼로</span>'));
console.log(`PASS title contracts: separate art + fallback + accessibility + no delay; 5 save-state branches and repeat entry; ${bytes} encoded bytes. Browser and art approval are separate.`);
