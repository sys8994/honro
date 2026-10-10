/** Host CSS/build contracts only; actual layout and input are checked by the browser test. */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const read=p=>readFile(new URL('../'+p,import.meta.url),'utf8');
const css=await read('workshop/src/style.css');
const rules=[...css.replace(/\/\*[\s\S]*?\*\//g,'').matchAll(/([^{}]+)\{([^{}]*)\}/g)];
const rule=selector=>{
 const match=rules.find(([,key])=>key.trim()===selector);
 assert(match,`Missing layout rule: ${selector}`);
 return Object.fromEntries(match[2].split(';').filter(Boolean).map(s=>s.trim().split(/:(.*)/s).slice(0,2)));
};
assert.equal(rule('#app')['grid-template-columns'],'minmax(0,1fr)','Toolbar min-content must not widen the implicit app track');
assert.equal(rule('#app')['grid-template-rows'],'auto minmax(0,1fr) 24px','Wrapped header owns its actual height');
for(const selector of ['.topbar','.top-actions','.play-controls'])assert.equal(rule(selector)['flex-wrap'],'wrap',selector);
assert.equal(rule('.workspace')['min-width'],'0');
assert.equal(rule('.tabs').height,'44px','Tabs keep a usable height when the header wraps');
assert.equal(rule('#playView.active').display,'grid');
assert.equal(rule('#playView.active')['grid-template-rows'],'auto minmax(0,1fr)');
assert.equal(rule('.play-controls').height,undefined,'Controls must not retain a fixed single-row height');
assert.equal(rule('.play-controls>.btn').flex,'none','Stop and launch buttons must not shrink their text');
assert.equal(rule('#runtimeHost').position,'relative','Iframe follows the measured control row, not a fixed top offset');
assert.equal(rule('#runtimeHost').inset,undefined);
assert.equal(rule('#runtimeHost')['min-height'],'0');
assert.equal(rule('#runtimeFrame').width,'100%');
assert.equal(rule('#runtimeFrame').height,'100%');
assert.equal(rule('#runtimeFrame').transform,undefined,'Never scale a desktop-sized iframe to hide overflow');

const workshop=await read('HONRO_WORKSHOP.html'),game=await read('HONRO.html');
assert.equal(workshop.match(/<style>([\s\S]*?)<\/style>/)[1],css,'Generated Workshop contains the current source CSS');
const script=workshop.match(/<script>([\s\S]*)<\/script>/)[1];
const start=script.indexOf('globalThis.HONRO_PLAYTEST_HTML=');
assert(start>=0);
const restore=script.slice(start,script.indexOf('\n',start));
const context={document:{currentScript:{textContent:script}}};
vm.runInNewContext(restore,context);
assert.equal(context.HONRO_PLAYTEST_HTML,game,'Real generated Playtest uses the exact standalone Game document');
console.log('PASS Workshop responsive host CSS and generated Game/iframe identity (not browser geometry or input)');
