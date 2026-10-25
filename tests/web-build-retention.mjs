import assert from 'node:assert/strict';
import {planWebAssetRetention,selectPublishedGenerations,graphSha256,safeWebAsset,validateAsset} from '../shared/web-retention.mjs';

const asset=name=>({path:`web/runtime/${name}.1234567890abcdef.js`});
const font={path:'web/fonts/hangul-common.1234567890abcdef.woff2',bytes:12,sha256:'f'.repeat(64)};
assert(safeWebAsset(font));assert.doesNotThrow(()=>validateAsset(font));
assert(!safeWebAsset({...font,path:'web/fonts/../../escape.woff2'}));
assert(!safeWebAsset({...font,path:'web/fonts/nested/escape.woff2'}));
const fontPublication={sourceSha:'1'.repeat(40),publishedAt:'2026-10-25T00:00:00Z',publishedAtPrecision:'instant',evidence:'confirmed Pages fixture',files:[font],graphSha256:graphSha256([font])};
const fontPlan=planWebAssetRetention({files:[font],publishedGenerations:[fontPublication]},[],{now:Date.parse('2026-10-26T00:00:00Z')});
assert(fontPlan.previousFiles.some(f=>f.path===font.path));assert(!fontPlan.obsoleteFiles.some(f=>f.path===font.path));
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
assert.deepEqual(planWebAssetRetention(unchanged,firstFiles),{previousFiles:[second],previousGenerations:[[second]],obsoleteFiles:[]},'A reused asset remains current');
const unsafe={path:'web/runtime/../../outside.js'};
assert.deepEqual(planWebAssetRetention({files:[unsafe,first],previousFiles:[unsafe,third]},secondFiles),{previousFiles:[first,third],previousGenerations:[[first],[third]],obsoleteFiles:[]},'Retention stays within generated asset paths');
assert.deepEqual(planWebAssetRetention({files:thirdFiles,previousFiles:[first,second,unsafe],previousGenerations:[[second],[first,unsafe]]},[common,fourth]).obsoleteFiles,[first],'Cleanup ignores unsafe paths');
console.log('Web asset retention: two prior distinct releases, legacy migration, identical builds, asset reuse, and safe cleanup passed.');

const now=Date.parse('2026-10-22T15:00:00Z'),day=86400000;
const publishedAsset=n=>({path:`web/runtime/published-${n}.${String(n).repeat(16)}.js`,bytes:1,sha256:String(n).repeat(64)});
const release=(n,age)=>{const files=[publishedAsset(n)];return {sourceSha:String(n).repeat(40),publishedAt:new Date(now-age*day).toISOString(),publishedAtPrecision:'instant',evidence:'Synthetic test publication',graphSha256:graphSha256(files),files};};
const releases=[release(1,1),release(2,2),release(3,3),release(4,6),release(5,8)];
assert.deepEqual(selectPublishedGenerations(releases,{now}),releases.slice(0,4),'All real releases inside seven days, not only two');
const expected=selectPublishedGenerations(releases,{now:now+30*day});assert.deepEqual(expected,releases.slice(0,2),'Latest two remain even after the entire window expires');
const duplicate={...releases[0],sourceSha:'a'.repeat(40)};
assert.deepEqual(selectPublishedGenerations([duplicate,...releases],{now}),[duplicate,...releases.slice(1,4)],'Identical graph is one slot with the newest source attestation');
const dateOnly={...release(6,0),publishedAt:'2026-10-22',publishedAtPrecision:'day',publicationOrder:1};
assert(selectPublishedGenerations([release(1,-1),release(2,-1),dateOnly],{now:Date.parse('2026-10-29T23:59:59Z')}).includes(dateOnly),'Day precision conservatively protects seven full days after the publication day');
assert(!selectPublishedGenerations([release(1,-1),release(2,-1),dateOnly],{now:Date.parse('2026-10-30T00:00:00Z')}).includes(dateOnly));
const sameDay=[1,2,3].map(n=>({...release(n,0),publishedAt:'2026-10-22',publishedAtPrecision:'day',publicationOrder:n}));
assert.deepEqual(selectPublishedGenerations(sameDay,{now:now+30*day}),[sameDay[2],sameDay[1]],'Attested same-day publication order, not registration order, determines latest two');
let held={files:secondFiles,publishedGenerations:releases.slice(0,4)};
for(const name of ['build-a','build-b','build-c','build-d']){const files=[common,asset(name)],plan=planWebAssetRetention(held,files,{now});for(const g of releases.slice(0,4))assert(plan.previousFiles.some(f=>f.path===g.files[0].path),'Intermediate builds never age a real publication');held={files,...plan,publishedGenerations:releases.slice(0,4)};}
const expiry=planWebAssetRetention({files:thirdFiles,previousFiles:releases.flatMap(g=>g.files),publishedGenerations:releases},thirdFiles,{now});
assert.deepEqual(expiry.obsoleteFiles,releases[4].files,'Only expired graphs outside latest two can be cleaned up');
const aged=planWebAssetRetention({...held,publishedGenerations:releases.slice(0,4)},held.files,{now:now+30*day});
assert(releases.slice(2,4).every(g=>aged.obsoleteFiles.some(f=>f.path===g.files[0].path)));assert(releases.slice(0,2).every(g=>!aged.obsoleteFiles.some(f=>f.path===g.files[0].path)));
const separated=planWebAssetRetention({files:releases[0].files,previousGenerations:[firstFiles,secondFiles],publishedGenerations:releases.slice(0,4)},thirdFiles,{now});
assert.deepEqual(separated.previousGenerations,[[first],[second]],'Already published graph consumes no intermediate slot');
assert.throws(()=>selectPublishedGenerations([{commit:'legacy',files:firstFiles}],{now}),/metadata|immutable asset/,'Undated registrations require attested migration');
assert.throws(()=>selectPublishedGenerations([{...releases[0],graphSha256:'0'.repeat(64)}],{now}),/metadata/);
assert.throws(()=>selectPublishedGenerations([{...releases[0],publishedAt:'2026-99-22'}],{now}),/timestamp/);
assert.throws(()=>selectPublishedGenerations([release(1,-1)],{now}),/future/);
console.log('Published retention: seven-day window, latest-two floor, day precision, fake-clock expiry, graph deduplication, metadata fail-closed and independent two-build slots passed.');

// Exercise registration against a tiny independent Git repository. Failures must
// leave both the active bytes and manifest untouched, even after staging a restore.
const {mkdtemp,mkdir,writeFile,readFile,rm}=await import('node:fs/promises');
const {execFileSync,spawnSync}=await import('node:child_process');
const {createHash}=await import('node:crypto');
const {tmpdir}=await import('node:os');
const {fileURLToPath}=await import('node:url');
const path=(await import('node:path')).default;
const dir=await mkdtemp(path.join(tmpdir(),'honro-web-retention-'));
const cli=fileURLToPath(new URL('../tools/release/retain-published-web.mjs',import.meta.url));
const git=(...args)=>execFileSync('git',args,{cwd:dir,encoding:'utf8',stdio:['pipe','pipe','pipe']}).trim();
try{
  git('init','-q');git('config','user.email','retention-test@example.invalid');git('config','user.name','Retention fixture');await mkdir(path.join(dir,'web/runtime'),{recursive:true});
  const makeFile=async(name,text)=>{const bytes=Buffer.from(text),sha256=createHash('sha256').update(bytes).digest('hex'),file={path:`web/runtime/${name}.${sha256.slice(0,16)}.js`,bytes:bytes.length,sha256};await writeFile(path.join(dir,file.path),bytes);return file;};
  const snapshot=async(files,label)=>{await writeFile(path.join(dir,'web/manifest.json'),JSON.stringify({files,previousFiles:[],previousGenerations:[]}));git('add','.');git('commit','-qm',label);return git('rev-parse','HEAD');};
  const a=await makeFile('a','original-a'),aSha=await snapshot([a],'published a');
  const b=await makeFile('b','original-b'),bSha=await snapshot([b],'published b');
  const active=await makeFile('active','current-active'),activeSha=await snapshot([active],'unpublished active');
  const activeBytes=await readFile(path.join(dir,active.path));
  const history=[aSha,bSha].map((sourceSha,i)=>({sourceSha,publishedAt:new Date(Date.now()-(2-i)*60000).toISOString(),publishedAtPrecision:'instant',evidence:'Synthetic isolated Git fixture'}));
  await writeFile(path.join(dir,'history.json'),JSON.stringify(history));await rm(path.join(dir,a.path));
  const run=()=>spawnSync(process.execPath,[cli,'--history','history.json'],{cwd:dir,encoding:'utf8'});
  let result=run();assert.equal(result.status,0,result.stderr);assert.equal(JSON.parse(result.stdout).restored.length,1);assert.deepEqual(await readFile(path.join(dir,a.path)),Buffer.from('original-a'));
  const registered=await readFile(path.join(dir,'web/manifest.json'));result=run();assert.equal(result.status,0,result.stderr);assert.deepEqual(await readFile(path.join(dir,'web/manifest.json')),registered,'Repeated registration is byte-idempotent');
  assert.deepEqual(JSON.parse(registered).files,[active],'Published graphs never enter the active graph');assert.deepEqual(await readFile(path.join(dir,active.path)),activeBytes);
  await rm(path.join(dir,a.path));await writeFile(path.join(dir,b.path),'tampered');result=run();assert.notEqual(result.status,0);assert.match(result.stderr,/refusing overwrite/);assert.deepEqual(await readFile(path.join(dir,'web/manifest.json')),registered);await assert.rejects(readFile(path.join(dir,a.path)),/ENOENT/,'No partial restore before validation completes');
  await writeFile(path.join(dir,b.path),'original-b');await writeFile(path.join(dir,'history.json'),JSON.stringify([{...history[0],sourceSha:'f'.repeat(40)}]));result=run();assert.notEqual(result.status,0);assert.deepEqual(await readFile(path.join(dir,'web/manifest.json')),registered);
  // A manifest without its original Git blob must not count as a publication.
  const missing={...a,path:'web/runtime/missing.0123456789abcdef.js'};await writeFile(path.join(dir,'web/manifest.json'),JSON.stringify({files:[missing],previousFiles:[],previousGenerations:[]}));git('add','web/manifest.json');git('commit','-qm','unavailable source fixture');const missingSha=git('rev-parse','HEAD');await writeFile(path.join(dir,'web/manifest.json'),registered);await writeFile(path.join(dir,'history.json'),JSON.stringify([{...history[0],sourceSha:missingSha}]));result=run();assert.notEqual(result.status,0);assert.match(result.stderr,/source blob unavailable/);assert.deepEqual(await readFile(path.join(dir,'web/manifest.json')),registered);assert.deepEqual(await readFile(path.join(dir,active.path)),activeBytes);
  // The committed manifest's hash claim is checked against Git source bytes too.
  const badFile=await makeFile('wronghash','invalid-source-hash');await writeFile(path.join(dir,'web/manifest.json'),JSON.stringify({files:[{...badFile,sha256:'0'.repeat(64)}],previousFiles:[],previousGenerations:[]}));git('add','web/manifest.json',badFile.path);git('commit','-qm','wrong source hash fixture');const wrongSha=git('rev-parse','HEAD');await writeFile(path.join(dir,'web/manifest.json'),registered);await writeFile(path.join(dir,'history.json'),JSON.stringify([{...history[0],sourceSha:wrongSha}]));result=run();assert.notEqual(result.status,0);assert.match(result.stderr,/source hash mismatch/);assert.deepEqual(await readFile(path.join(dir,'web/manifest.json')),registered);
  console.log('Registration: Git original restoration, idempotence, active-byte isolation, unavailable history/hash rejection and no partial writes passed.');
}finally{await rm(dir,{recursive:true,force:true});}
