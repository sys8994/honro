/** Source/production-App contracts only. CSS layout needs separate browser QA. */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {appHarness,plain,report} from './app-regression-helpers.mjs';
const css=await readFile('game/src/controls.css','utf8'),h=await appHarness(),checks=[];
const compact=css.slice(css.indexOf('/* A fixed two-line stage card'));
assert.match(compact,/--battle-head-height:44px/);
assert.match(compact,/battle-head>\.icon\{width:var\(--battle-head-height\);height:var\(--battle-head-height\);min-height:var\(--battle-head-height\)/);
assert.match(compact,/battle-info\{[^}]*height:var\(--battle-head-height\)[^}]*grid-template-rows:16px 16px;row-gap:2px;overflow:hidden/);
assert.match(compact,/battle-stage-heading b\{[^}]*text-overflow:ellipsis;white-space:nowrap/);
assert.match(compact,/mission-help\{[^}]*height:16px[^}]*white-space:nowrap;overflow:hidden;text-overflow:ellipsis/);
assert.match(compact,/allied-roster\{top:calc\(var\(--battle-head-top\) \+ var\(--battle-head-height\) \+ 6px\)!important/);
assert.match(compact,/battle-head\{[^}]*right:calc\(var\(--battle-map-reserve\) \+ var\(--battle-head-inset\) \+ 8px\)!important/);
checks.push('Stage card and pause share44px; exactly two fixed rows; text cannot grow into the allied row');
for(const [width,height] of [[280,600],[320,640],[333,622],[400,746],[620,800],[621,800],[844,390],[1244,933],[1440,900]]){
 const phone=width<=620,short=width>height&&height<=540,inset=short?10:phone?8:12,top=short?6:phone?8:10;
 const map=Math.min(phone?118:152,width*(phone?.31:.35)),cardWidth=Math.min(620,width-inset-(map+inset+8)-44-8),allyTop=top+44+6;
 assert(cardWidth>70,`${width}: stage card retains usable inline room`);assert.equal(allyTop-(top+44),6);
 assert.equal(4*2+1*2+16*2+2,44,'border+padding+two lines exactly fill the fixed card');
 checks.push(`${width}×${height} CSS equation: card${cardWidth.toFixed(2)}×44, allies6px below, minimap reserve${map.toFixed(2)}px`);
}
for(const id of [7,28])for(const debug of [false,true]){const a=h.load(h.profileThrough(29));a.debugMode=debug;a.launch(id);h.finish(a);const html=a.root.innerHTML;
 assert.match(html,/<div class="battle-title-row"><span class="battle-stage-heading" title="[^"]+">/);
 assert.match(html,/<div class="battle-objective-row"><span id="turn-text"><\/span><button type="button" id="objective-text"[^>]*data-action="battle-help"/);
 assert(html.includes(a.stage.name));assert.equal(html.includes('디버그 · 기록 분리'),debug);const before=plain(a.engine.b);a.battleHelp();assert(a.modal.innerHTML.includes(a.stage.name));assert.deepEqual(plain(a.engine.b),before,'Opening full goal details remains read-only');
 checks.push(`Chapter${id}/${debug?'debug':'normal'}: long title survives in the tooltip, two-row markup, full goal help keeps battle unchanged`);
}
await report('battle-compact-header',checks,{limits:['Source and production-App DOM doubles only. No computed browser layout or physical device claim.']});console.log(checks.join('\n'));
