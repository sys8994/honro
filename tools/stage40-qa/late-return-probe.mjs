/** Actual R21 saved-state functional continuation. Prior whole run remains
 * failed. No reset, resources changed, or round-budget acceptance claimed. */
import assert from 'node:assert/strict';
import {writeFile,mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {createFinale} from './bootstrap.mjs';
import {completeNativeReturn} from './return-inputs.mjs';
const out='/tmp/stage40-late-return-41690685003';await mkdir(out,{recursive:true});
const raw=execFileSync('xz',['-dc','tools/stage40-qa/records/41690685003-final-storage.json.xz']);
assert.equal(createHash('sha256').update(raw).digest('hex'),'a83ec3c644b23fa613ff81f7d13853c2b6dc3b5e1f2e44de0a40d2ad5935737e');
const profilePath=out+'/input.json';await writeFile(profilePath,raw);
const ctx=await createFinale({profilePath,entryRound:21});const {b,e,app,ops,g}=ctx;
ops.ready();ops.frame();for(let i=0;i<360&&(g.HonroStory.turnPaused(app,ops.now)||!e.grounded(e.active));i++)ops.frame();
assert.equal(b.round,21);assert.equal(b.units.filter(u=>u.side===1&&!u.dead&&u.hp>0).length,0);
const saved=JSON.parse(raw);for(const u of b.units){const old=saved.honroBattle.units.find(v=>v.id===u.id);assert(old);assert.equal(u.hp,old.hp);assert.equal(!!u.dead,!!old.dead);}
const events=[],result={sourceRun:41690685003,entryRound:21,originalWholeRunPassed:false,functionalPassed:false,scope:'Late saved-state normal controls; native DOM/clock doubles, not browser or quantitative acceptance'};
try{result.returnResult=completeNativeReturn({...ctx,functionalContinuation:true,record:v=>events.push(v)});result.functionalPassed=true;}
catch(error){result.failure=String(error.stack||error);}
result.final={round:b.round,phase:b.phase,heroes:b.units.filter(u=>u.side===0&&!u.summoned&&!u.honroAct4Resident).map(u=>({id:u.id,hp:u.hp,dead:u.dead,x:u.x,y:u.y})),residents:b.units.filter(u=>u.honroAct4Resident).map(u=>({id:u.id,hp:u.hp,dead:u.dead,x:u.x,y:u.y})),escort:b.honroAct4PreviewState.returnEscort};
await writeFile(out+'/result.json',JSON.stringify({...result,events},null,2));console.log(JSON.stringify(result));if(!result.functionalPassed)process.exitCode=1;
