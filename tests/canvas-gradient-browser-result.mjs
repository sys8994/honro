import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const html=await readFile(process.argv[2],'utf8'),match=html.match(/<pre id="result">(.*?)<\/pre>/s);
assert(match,'Browser did not execute the independent canvas fixture');
const report=JSON.parse(match[1].replaceAll('&amp;','&').replaceAll('&lt;','<').replaceAll('&gt;','>'));
assert(report.userAgent.includes('Chrome'),'Expected actual Chrome browser');
assert.equal(report.equal,true,'Transformed Canvas2D gradient differs from identity in browser');
assert(report.rows[0].alpha[0]===255&&report.rows[0].alpha[3]===0);
console.log(JSON.stringify({...report,scope:'Actual isolated browser Canvas2D unit only, not production gameplay or public UI approval.'}));
