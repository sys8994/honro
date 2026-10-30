/** Isolated in-memory official import/continue path. Never user/public storage. */
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {adapter} from './adapter.mjs';
const [file,output]=process.argv.slice(2);if(!file||!output)throw Error('profile.json output.json');
const bytes=await readFile(file),profile=JSON.parse(bytes),a=await adapter(31);
const imported=await a.importProfile(profile);
assert(imported.replaced,'Official file-import callback must replace the old in-memory profile');
assert.equal(imported.stage,31);assert.equal(imported.battleStage,31);assert.equal(a.app.screen,'title');
a.app.continue();assert.equal(a.app.engine?.b.honroStage,31);assert.equal(a.app.stageId,31);
assert(!a.app.debugMode&&!a.app.training&&!a.app.customMap);
const result={kind:'isolated-official-profile-import-regression',profileSHA256:createHash('sha256').update(bytes).digest('hex'),imported,resumedStage:a.app.stageId,world:{width:a.app.engine.b.width,height:a.app.engine.b.height},heroes:a.app.engine.b.units.filter(u=>u.side===0).map(u=>({id:u.id,hp:u.hp})),limit:'Official change callback/importText/replaceProfile/continue and actual App; synthetic DOM file-picker and in-memory storage, not browser chooser proof.'};
await writeFile(output,JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(result));
