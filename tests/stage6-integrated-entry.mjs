/** Existing earned-XP fixture allocation, not continuous campaign evidence. */
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {appHarness} from './app-regression-helpers.mjs';
import {focusedProfile} from '../tools/stage6-prototype/focused-profile.mjs';
const h=await appHarness({productionStory:true});
const profile=JSON.parse(await readFile('game/docs/stage-review/stage06-bridge/evidence/entry-profile.json')).profile;
const allocation=focusedProfile(h.g,profile);profile.settings.debugMode=false;profile.settings.difficulty='story';
await mkdir('_local/reports/stage6-art-preview',{recursive:true});
await writeFile('_local/reports/stage6-art-preview/integrated-entry.json',JSON.stringify({scope:'Existing earned-XP fixture, focused legal allocation, story difficulty; not continuous campaign',profile,allocation}));
console.log('Prepared bounded Stage6 entry fixture; no battle actor changes.');
