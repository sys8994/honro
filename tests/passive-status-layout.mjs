/** Production passive presentation + DOM sink contracts; browser geometry is a separate gate. */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runtime} from '../game/tests/helpers.mjs';
const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE,S=g.HonroCombatStatus,host={hidden:true,innerHTML:'',dataset:{}},trigger={dataset:{},removeAttribute(key){delete this[key];}};
g.document={getElementById:id=>id==='combat-passives'?host:id==='combat-status'?{querySelector:()=>trigger}:null};
let count=0;
const check=(name,fn)=>{fn();count++;console.log('PASS',name);};
const unit=(cls,ranks={})=>({id:'qa-'+cls,cls,ranks,jucheon:0,jucheonReady:false,swordChain:[],harmony:false});
check('all four companion selections clear or replace the previous passive state without mutating combat',()=>{
 for(const u of [unit('mage',{MP05:1}),unit('archer'),unit('knight',{SP04:1}),unit('occultist'),unit('mage')]){
  const before=JSON.stringify(u);S.passives({},u);assert.equal(JSON.stringify(u),before);
  const visible=!!(u.ranks.MP05||u.ranks.SP04);assert.equal(host.hidden,!visible);assert.equal(!!trigger.dataset.passive,visible);if(!visible)assert.equal(host.innerHTML,'');
 }
});
check('Jucheon zero, intermediate, full and overflow states keep a live bounded accessible meter',()=>{
 for(const rank of [1,4,8])for(const fraction of [0,.5,1,1.2]){
  const u=unit('mage',{MP05:rank});u.jucheon=C.JUCHEON_THRESHOLD[rank-1]*fraction;u.jucheonReady=fraction>=1;const p=S.passivePresentation(u);S.passives({},u);
  const percent=Math.min(100,Math.round(fraction*100));assert.match(p.html,new RegExp(`aria-valuenow="${percent}"`));assert.match(p.html,/role="meter"/);assert.equal(trigger.dataset.passiveLabel,'주천');assert.equal(host.hidden,false);assert.match(p.html,/passive-short/);assert.match(p.html,/passive-full/);if(u.jucheonReady)assert.match(p.description,/주천완성/);
 }
});
check('sword-chain icons preserve each linked family and the ready harmony label',()=>{
 for(const chain of [[],['sword'],['sword','rush'],['sword','rush','blade']])for(const ready of [false,true]){
  const u=unit('knight',{SP04:8});u.swordChain=chain;u.harmony=ready;const p=S.passivePresentation(u);S.passives({},u);
  assert.equal((p.html.match(/class="linked"/g)||[]).length,chain.length);for(const token of ['검술','돌격','검기','data-short="검"','data-short="돌"','data-short="기"'])assert(p.html.includes(token));assert.equal(trigger.dataset.passiveLabel,ready?'합세':'연세');assert.equal(host.hidden,false);
 }
});
check('action restrictions do not erase live passive progress or own gameplay state',()=>{
 for(const cls of ['mage','knight'])for(const flags of [{bound:2},{stun:1},{curseTurns:3},{acted:true},{dead:true,hp:0}]){
  const u={...unit(cls,cls==='mage'?{MP05:1}:{SP04:1}),...flags,jucheon:50,swordChain:['sword']},before=JSON.stringify(u);S.passives({},u);assert.equal(host.hidden,false);assert.equal(JSON.stringify(u),before);
 }
});
const vendor=await readFile('game/vendor/style.css','utf8');
const status=await readFile('shared/runtime/combat-status.js','utf8'),ui=await readFile('shared/runtime/ui-bridge.js','utf8'),controls=await readFile('game/src/controls.css','utf8'),presentation=await readFile('game/src/skill-presentation.css','utf8');
check('one live passive host belongs to the existing clickable status button, never a resource overlay',()=>{
 assert.equal((status.match(/id="combat-passives"/g)||[]).length,1);assert.match(status,/<span id="combat-passives"[^>]*><\/span><\/button>/);assert(!ui.includes('id="combat-passives"'));
 assert.match(controls,/\.combat-passives\{position:static;display:inline-flex/);assert(!/\.combat-passives\{[^}]*position:absolute/.test(controls));
 assert.match(presentation,/status-trigger\[data-passive\]>\.status-glyph\{display:none\}/);assert.match(presentation,/status-trigger\[data-passive\]::after\{content:attr\(data-passive-label\)\}/);
 assert.match(presentation,/combat-passives\{width:28px;height:20px;justify-content:center\}/);assert.match(presentation,/combat-status\[data-limited=true\]/);
 assert.match(status,/trigger.onkeydown=trigger.onkeyup=/,'Status remains keyboard-safe');
});
check('portrait passive content fits the unchanged 36px status control without reserving another HUD row',()=>{
 const button=36,content=20,label=9,gap=1;assert(content+label+gap<=button-2);assert(28<=button-2);
 const start=presentation.indexOf('/* Live passive state'),end=presentation.indexOf('/* Small portrait-phone trim:',start),patch=presentation.slice(start,end);assert(!/--hud-(?:height|roster-height|vitals-height)|grid-template-rows|padding:/.test(patch.replace(/padding:0/g,'')));
 assert.match(presentation,/--hud-roster-height:36px;--hud-vitals-height:18px;--joystick-lift:4px/);
});
check('phone mission header reserves the unchanged minimap lane instead of overlapping it',()=>{
 const patch=controls.slice(controls.indexOf('/* Keep phone mission text'));
 assert.match(vendor,/battle-head\{left:7px!important;right:7px!important/,'legacy important edge needs an explicit scoped override');
 assert.match(patch,/@media\(max-width:620px\)/);
 assert.match(patch,/battle-head\{left:8px!important;right:calc\(31vw \+ 16px\)!important;gap:8px\}/);
 assert.match(patch,/battle-head>\.icon\{flex:none\}/);
 assert.match(patch,/battle-info\{flex:1;min-width:0;max-width:100%;box-sizing:border-box;overflow-wrap:anywhere\}/);
 assert(!/font-size:|#minimap\{|--hud-height/.test(patch));
 for(const width of [280,320,333,360,400,620]){
  const headerRight=width-(width*.31+16),mapLeft=width-8-width*.31;
  assert(Math.abs(mapLeft-headerRight-8)<1e-9);
  assert(headerRight-8-44-8>100,'mission area keeps at least 100px beside pause');
 }
});
console.log(`${count} passive HUD groups passed; actual browser layout remains separately verified.`);
