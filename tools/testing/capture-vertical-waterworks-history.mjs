// Run only after the C map review. The B comparison revision is immutable.
// Usage: node tools/testing/capture-vertical-waterworks-history.mjs <reviewed-C-commit>
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
async function contractContent(read){const balance=JSON.parse(read('game/config/balance.json')),g=vm.createContext({HONRO_CORE:{SKILLS:{}},HONRO_BALANCE:balance,HonroWorld:{archetypes:{}}});for(const name of ['content','story-content','act2-content','act2-plan','act2-drama','act3-content'])vm.runInContext(read(`shared/runtime/${name}.js`),g);return {content:JSON.parse(JSON.stringify(g.HONRO_CONTENT)),balance};}
const baseline='9032b3c4ef0509461ad31c5be9d91264d8becabc',approved=process.argv[2];assert(approved,'An explicitly reviewed C commit is required');
const git=(...args)=>execFileSync('git',args,{encoding:'utf8',maxBuffer:64*1024*1024});
const revision=r=>git('rev-parse',r+'^{commit}').trim(),beforeRevision=revision(baseline),afterRevision=revision(approved);
const read=r=>name=>git('show',r+':'+name),before=JSON.parse(read(beforeRevision)('shared/data/campaign.json')),after=JSON.parse(read(afterRevision)('shared/data/campaign.json'));
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
assert.deepEqual(after.library.slice(0,before.library.length),before.library,'C may only append assets to the entire immutable B Library');
const assets=after.library.slice(before.library.length);assert(assets.length);assert(assets.every(a=>a.id.startsWith('a3-waterworks-v3:')),'Only dedicated C asset IDs');
for(let i=0;i<30;i++)if(![24,26].includes(i))assert.deepEqual(after.stages[i],before.stages[i],'Unaffected canonical stage '+(i+1));
const bc=await contractContent(read(beforeRevision)),ac=await contractContent(read(afterRevision)),rows=[],keyOrders=[];
function diff(a,b,path,stage,domain){if(JSON.stringify(a)===JSON.stringify(b))return;if(a&&b&&!Array.isArray(a)&&!Array.isArray(b)&&typeof a==='object'&&typeof b==='object'){if(JSON.stringify(Object.keys(a))!==JSON.stringify(Object.keys(b)))keyOrders.push({domain,stage,path,before:Object.keys(a),after:Object.keys(b)});for(const k of new Set([...Object.keys(a),...Object.keys(b)]))diff(a[k],b[k],[...path,k],stage,domain);return;}rows.push({domain,stage,path,hasBefore:a!==undefined,hasAfter:b!==undefined,...(a!==undefined?{before:a}:{}),...(b!==undefined?{after:b}:{})});}
for(const id of [25,27]){diff(before.stages[id-1],after.stages[id-1],[],id,'map');diff(bc.content.stages[id-1],ac.content.stages[id-1],[],id,'content');}
const fixture={version:1,beforeRevision,afterRevision,beforeProjectSha256:hash(before),afterProjectSha256:hash(after),scope:'Exact C 25/27 map and content deltas only; unchanged fields remain visible. Additive C artwork is independently removed after exact ID/order/value checks. Original B/A and older fixtures are never rewritten.',hashes:[25,27].map(id=>({stage:id,beforeSha256:hash(before.stages[id-1]),afterSha256:hash(after.stages[id-1])})),library:{beforeLength:before.library.length,beforeSha256:hash(before.library),afterSha256:hash(after.library),assets:assets.map(a=>({id:a.id,sha256:hash(a)}))},rows,keyOrders};
writeFileSync('tests/fixtures/vertical-waterworks-history-delta.json',JSON.stringify(fixture,null,2)+'\n');console.log('Captured reviewed C → B:',rows.length,'paths,',assets.length,'exact additive assets');
