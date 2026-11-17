/** Compare dumped isolated Chrome DOM to the identical Node Native fixture. */
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
const [browserPath,nativePath,output]=process.argv.slice(2);
if(!browserPath||!nativePath)throw Error('Usage: node tests/handoff-tile-browser-result.mjs CHROME-DUMP.html FIXTURE.html.native.json [SUMMARY.json]');
const html=await readFile(browserPath,'utf8'),match=html.match(/<pre id="result">(.*?)<\/pre>/s);assert(match,'Missing executed fixture result');
const browser=JSON.parse(match[1].replaceAll('&quot;','"').replaceAll('&lt;','<').replaceAll('&gt;','>').replaceAll('&amp;','&'));
const native=JSON.parse(await readFile(nativePath,'utf8'));
assert(browser.userAgent.includes('Chrome'),'Actual Chrome required');assert.deepEqual(browser.metadata,native.metadata,'Exactly identical runtime and assets required');
assert.equal(browser.rows.length,94);assert.equal(browser.comparison21.length,32);
const key=r=>`${r.asset}/${r.strip}/${r.density}`;
const byKey=new Map(native.rows.map(r=>[key(r),r]));
const rows=browser.rows.map(b=>{const n=byKey.get(key(b));assert(n);assert.equal(b.total,n.total);assert.equal(b.width,n.width);assert.equal(b.height,n.height);return{asset:b.asset,strip:b.strip,density:b.density,x0:b.x0,x1:b.x1,total:b.total,browserNonzero:b.nonzero,nativeNonzero:n.nonzero,browserMeanAlpha:b.meanAlpha,nativeMeanAlpha:n.meanAlpha,nativeMissingFraction:(b.nonzero-n.nonzero)/b.total};});
const stage21={comparisons:browser.comparison21.length,maxMeanAlphaDelta:Math.max(...browser.comparison21.map(r=>r.meanAlphaDelta)),maxMeanChannelDelta:Math.max(...browser.comparison21.map(r=>r.meanChannelDelta)),maxSingleChannelDelta:Math.max(...browser.comparison21.map(r=>r.maxDelta)),rows:browser.comparison21.map(r=>({strip:r.strip,density:r.density,differentPixels:r.differentPixels,maxDelta:r.maxDelta,meanAlphaDelta:r.meanAlphaDelta,meanChannelDelta:r.meanChannelDelta}))};
// Diagnostic, not an artistic pass gate. Preserve all differences; antialiasing
// and resampling may prevent exact pixel identity even for equivalent masks.
const report={scope:'Actual Chrome isolated production compositor diagnostic only; no game, save, public UI or artistic acceptance.',userAgent:browser.userAgent,metadata:browser.metadata,rows,stage21,largeNativeLosses:rows.filter(r=>r.nativeMissingFraction>.1),chromeEmptyStrips:rows.filter(r=>r.browserNonzero===0)};
if(output)await writeFile(output,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report));
