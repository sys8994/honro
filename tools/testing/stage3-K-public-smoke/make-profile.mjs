import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {pathToFileURL} from 'node:url';import{execFileSync}from'node:child_process';
const root=path.resolve(process.argv[2]),out=path.resolve(process.argv[3]);process.chdir(root);
assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),process.env.HONRO_EXPECTED_RELEASE_SHA);
const {appHarness,KEY}=await import(pathToFileURL(path.join(root,'tests/app-regression-helpers.mjs')));
const {load,profileThrough,finish,storage}=await appHarness({productionStory:true});const p=profileThrough(2);p.lastStage=3;p.settings.volume=0;p.settings.musicVolume=0;
const app=load(p);app.launch(3);finish(app);assert.equal(app.engine?.b?.honroStage,3);app.persist();const text=storage.get(KEY),saved=JSON.parse(text);assert.equal(saved.honroBattle?.honroStage,3);assert(!saved.settings.debugMode);fs.writeFileSync(out,text);
console.log('Synthetic official model-harness Stage3 profile, not user save or natural campaign play');
