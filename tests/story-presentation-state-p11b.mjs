// Production story/save differential, DOM/audio/frame doubles; pixels checked separately.
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
import {readFile,writeFile} from 'node:fs/promises';
import {appHarness,plain} from './app-regression-helpers.mjs';
const base='d1e45a0fe72507a695dbdcf00f1141fee357b1dd';
async function run(source){const h=await appHarness();vm.runInContext(source,h.g);const S=h.g.HonroStory;let a=h.load(h.profileThrough(0));a.launch(1);h.finish(a);
 const lines=[['서술','& < > " \'',{kind:'narration'}],['길 위의 기록','& < > " \''],['서술','& < > " \'',{kind:'narration'}]],sounds=[];a.audio.play=id=>sounds.push(id);
 S.start(a,lines,{title:'fixture'});const states=[];const snap=()=>states.push({dialogue:plain(a.dialogue),seen:plain(a.profile.seen),history:plain(a.profile.honroNarrative)});snap();
 for(let i=0;i<5;i++)S.draw(a);assert.deepEqual(sounds,['dialogue']);S.previous(a);assert.equal(a.dialogue.index,0);S.next(a);snap();S.previous(a);snap();S.next(a);S.save(a);
 const saved=plain(a.dialogue);a=h.reload();h.click('continue');assert.deepEqual(plain(a.dialogue),saved);snap();S.next(a);snap();S.finish(a);snap();S.finish(a);assert.equal(a.dialogue,null);
 const profile=plain(a.profile);profile.honroBattle.session="fixture-session";profile.honroBattle.honroReport.attempt="fixture-attempt";return {states,sounds,profile};
}
const old=await run(execFileSync('git',['show',`${base}:shared/runtime/story.js`],{encoding:'utf8'})),current=await run(await readFile('shared/runtime/story.js','utf8'));
assert.deepEqual(current,old);
const source=await readFile('shared/runtime/story.js','utf8'),baseline=execFileSync('git',['show',`${base}:shared/runtime/story.js`],{encoding:'utf8'});
// All mechanics and staging logic outside the narrowly changed presentation span are exact.
assert.equal(source.slice(0,source.indexOf('function storyCopy(')),baseline.slice(0,baseline.indexOf('function narration(')));
assert.equal(source.slice(source.indexOf('function finish(app,')),baseline.slice(baseline.indexOf('function finish(app,')));
assert(source.includes('if(G.HonroStoryStaging?.draw(app,node)){controls(node,app);return;}'));
await writeFile('_local/reports/story-presentation-p11b/state.json',JSON.stringify({equal:true,transitions:current.states.length,sounds:current.sounds,actualContinue:true,mechanicsOutsidePresentationExact:true},null,2));
console.log('PASS baseline/current story state, previous/next/skip/Continue, sound dedup and unchanged mechanics/staging return');
