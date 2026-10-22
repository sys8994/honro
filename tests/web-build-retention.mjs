import assert from 'node:assert/strict';
import {planWebAssetRetention} from '../shared/web-build.mjs';

const asset=name=>({path:`web/runtime/${name}.1234567890abcdef.js`});
const common=asset('common'),first=asset('first'),second=asset('second'),third=asset('third'),fourth=asset('fourth');
const firstFiles=[common,first],secondFiles=[common,second],thirdFiles=[common,third];
assert.deepEqual(planWebAssetRetention(undefined,firstFiles),{previousFiles:[],previousGenerations:[],obsoleteFiles:[]});
const next=planWebAssetRetention({files:firstFiles},secondFiles);
assert.deepEqual(next,{previousFiles:[first],previousGenerations:[[first]],obsoleteFiles:[]});
const unchanged={files:secondFiles,previousFiles:next.previousFiles};
assert.deepEqual(planWebAssetRetention(unchanged,[...secondFiles].reverse()),next,'Identical builds preserve and migrate legacy previousFiles');
const thirdRelease=planWebAssetRetention(unchanged,thirdFiles);
assert.deepEqual(thirdRelease,{previousFiles:[second,first],previousGenerations:[[second],[first]],obsoleteFiles:[]},'Two prior releases survive');
const thirdManifest={files:thirdFiles,...thirdRelease};
assert.deepEqual(planWebAssetRetention(thirdManifest,thirdFiles),thirdRelease,'Identical builds do not age either retained generation');
assert.deepEqual(planWebAssetRetention(thirdManifest,[common,fourth]),{previousFiles:[third,second],previousGenerations:[[third],[second]],obsoleteFiles:[first]},'Only the third-oldest release expires');
assert.deepEqual(planWebAssetRetention(unchanged,firstFiles),{previousFiles:[second],previousGenerations:[[second],[]],obsoleteFiles:[]},'A reused asset remains current');
const unsafe={path:'web/runtime/../../outside.js'};
assert.deepEqual(planWebAssetRetention({files:[unsafe,first],previousFiles:[unsafe,third]},secondFiles),{previousFiles:[first,third],previousGenerations:[[first],[third]],obsoleteFiles:[]},'Retention stays within generated asset paths');
assert.deepEqual(planWebAssetRetention({files:thirdFiles,previousFiles:[first,second,unsafe],previousGenerations:[[second],[first,unsafe]]},[common,fourth]).obsoleteFiles,[first],'Cleanup ignores unsafe paths');
console.log('Web asset retention: two prior distinct releases, legacy migration, identical builds, asset reuse, and safe cleanup passed.');

const published={commit:'released-client',files:[first]};
let held={files:secondFiles,publishedGenerations:[published]};
for(const name of ['build-a','build-b','build-c','build-d']){const files=[common,asset(name)],plan=planWebAssetRetention(held,files);assert(plan.previousFiles.some(f=>f.path===first.path),'Published graph survives intermediate builds');assert(!plan.obsoleteFiles.some(f=>f.path===first.path));held={files,...plan,publishedGenerations:[published]};}
const bounded=planWebAssetRetention({files:thirdFiles,publishedGenerations:[{files:[first,unsafe]},{files:[second]},{files:[fourth]}]},thirdFiles);
assert.deepEqual(bounded.previousFiles,[first,second],'Only two published graphs retained, unsafe paths ignored');
console.log('Published client graphs remain bounded and do not age on intermediate builds');
