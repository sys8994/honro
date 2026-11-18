import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {pathToFileURL} from 'node:url';import{execFileSync}from'node:child_process';
const root=path.resolve(process.argv[2]),out=path.resolve(process.argv[3]);process.chdir(root);
assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),process.env.HONRO_EXPECTED_RELEASE_SHA);
// The stock model helper intentionally uses vector:false. That creates an old-art
// saved snapshot, which public continuation correctly preserves. Build a test-only
// copy using the same official runtimeParts but production vector assets instead.
const helper=fs.readFileSync(path.join(root,'tests/app-regression-helpers.mjs'),'utf8');
const hook="import {runtime} from '../game/tests/helpers.mjs';";
assert.equal(helper.split(hook).length,2);
const runtimeCode=`const runtime=async({productionStory=false}={})=>{const context=vm.createContext({console,performance,structuredClone});const{runtimeParts}=await import(${JSON.stringify(pathToFileURL(path.join(root,'shared/build.mjs')).href)});for(const source of await runtimeParts({vector:true,render:false,productionStory}))vm.runInContext(source,context);return context;};`;
const {appHarness,KEY}=await import('data:text/javascript;base64,'+Buffer.from(helper.replace(hook,runtimeCode)).toString('base64'));

const {g,load,profileThrough,finish,storage}=await appHarness({productionStory:true});const p=profileThrough(2);p.lastStage=3;p.settings.volume=0;p.settings.musicVolume=0;
const app=load(p);app.launch(3);finish(app);assert.equal(app.engine?.b?.honroStage,3);
const liveBody=JSON.parse(JSON.stringify(app.engine.b.honroLandmarks.find(x=>x.asset?.id==='act1-site:3:body').asset));
app.persist();const text=storage.get(KEY),saved=JSON.parse(text);assert.equal(saved.honroBattle?.honroStage,3);assert(!saved.settings.debugMode);
const{createHash}=await import('node:crypto'),sha=a=>createHash('sha256').update(JSON.stringify(a)).digest('hex');
const{runtimeEntries}=await import(pathToFileURL(path.join(root,'shared/build.mjs')));const entries=await runtimeEntries({vector:true,render:true,app:true,productionStory:true}),project=entries.find(e=>e.project).project;
const rawBody=project.library.find(a=>a.id==='act1-site:3:body');const rawSHA=sha(rawBody);assert.equal(rawSHA,'ea8b604fa02da75d49eab049427abec1f49aa78cd571a5da87a012ae64a1efad','Pinned source builder must still contain accepted K asset');
const storedBody=saved.honroBattle.honroLandmarks.find(x=>x.asset?.id==='act1-site:3:body').asset;
const restored=JSON.parse(JSON.stringify(saved.honroBattle));assert(g.HonroProfileStore.restoreBattleArt(restored),'Official synthetic snapshot restore failed');
const restoredBody=JSON.parse(JSON.stringify(restored.honroLandmarks.find(x=>x.asset?.id==='act1-site:3:body').asset));assert.deepEqual(restoredBody,liveBody,'Official saved-art restoration must preserve entire actual compiled BODY');
const evidence={release:process.env.HONRO_EXPECTED_RELEASE_SHA,rawAcceptedBodySHA:rawSHA,runtimeProjectBodySHA:sha(g.HONRO_PROJECT.library.find(a=>a.id==='act1-site:3:body')),liveBodySHA:sha(liveBody),storedBodySHA:sha(storedBody),restoredBodySHA:sha(restoredBody),entireCompiledBodyRoundtripExact:true,vector:true,renderDouble:true,userSave:false};
fs.writeFileSync(out,text);fs.writeFileSync(out+'.provenance.json',JSON.stringify(evidence,null,2));console.log(JSON.stringify(evidence));
console.log('Synthetic official vector App model snapshot; compare mounted public art to official restored compiled snapshot, not pre-compilation source asset.');
