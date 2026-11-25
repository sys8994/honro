import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import {spawnSync} from 'node:child_process';
const sha=v=>createHash('sha256').update(v).digest('hex');
const {makeQaMain}=await import('../../shared/act6-app-qa.mjs');
const {normal60EndingSource}=await import('../../shared/act6-normal-ending-qa/emit.mjs');
const {prepareEndingReplan}=await import('../../shared/act6-ending-replan/build.mjs');
const raw=await readFile('shared/runtime/main.js','utf8');
const journey=await readFile('shared/act6-journey/journey.inc.js','utf8');
const terrain=await readFile('shared/act6-terrain-art/paint-scene.inc.js','utf8');
const descriptor={releaseEnabled:true,basePath:'/honro/',boundary:{build:'proof-only'},journeyMap:{},normalEndingAssets:{'dawn-pc.webp':'pc','dawn-mobile.webp':'mobile'}};
const before=JSON.stringify(descriptor);
const artifact=await prepareEndingReplan({root:process.cwd(),emit:(_folder,name,ext)=>'web/graphics/'+name+'.'+ext,descriptor});
assert.equal(before,JSON.stringify(descriptor));
assert.equal(artifact.assets.track,'/honro/assets/bgm/main.mp3');
// Exact production ending DOM generation, raw pinned App and additive paths.
// Full signed source and release manifests are checked independently after build.
const source='const qa51=(()=>{const descriptor=/* SIGNED_ASSET */;const normal60Stock=true;\n'+await normal60EndingSource()+
 '\n      function eligible(app,id){}\nfunction mountNormalFar(){}\nfunction dispose(){disposeNormalFar(app);active.delete(app);}\nreturn {active:app=>active.has(app),mountNormalFar,};})();\n';
const old=makeQaMain(raw,source,descriptor,terrain,journey);
const next=makeQaMain(raw,source,descriptor,terrain,journey,artifact);
new vm.Script(old);new vm.Script(next);
assert(next.includes('act6EndingReplan.installDebug(this)'));
for(const field of ['afterFinalCommit','request.terminalSha!==proof.rawSHA',"request.finalScene!=='later-return'",'!sameSize(f.size,viewport)'])if(old.includes(field))assert(next.includes(field));
const ret=spawnSync('git',['hash-object','assets/bgm/main.mp3'],{encoding:'utf8'});assert.equal(ret.stdout.trim(),'12fa25bef170b60de432272743efe44b16bdd50d');
console.log(JSON.stringify({rawMain:sha(raw),normal60Original:sha(await normal60EndingSource()),untouchedInput:sha(source),afterPresentation:sha(next),assets:artifact.assets},null,2));
