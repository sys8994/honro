/** Read-only priority inspection on detached actual saved checkpoint. Not gameplay acceptance. */
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createFinale} from './bootstrap.mjs';
const dir=process.argv[2];assert(dir);const profilePath=dir+'/r24-profile.json';await writeFile(profilePath,execFileSync('xz',['-dc',dir+'/basic/final-storage.json.xz'],{maxBuffer:128e6}));
const saved=JSON.parse(await readFile(profilePath,'utf8'));const {C,e,b,ops}=await createFinale({profilePath,entryRound:saved.honroBattle.round});ops.ready();const original=JSON.stringify(b);await writeFile(dir+'/queue-input-battle.json.xz',execFileSync('xz',['-zc'],{input:original,maxBuffer:128e6}));const sim=new C.Engine(JSON.parse(original),()=>{},true);assert.equal(sim.b.side,0);
for(let i=0;i<100000&&sim.b.side===0;i++)sim.switchTeam();
assert.equal(sim.b.side,1);assert.equal(JSON.stringify(b),original);
const rows=sim.b.units.filter(u=>u.side===1&&!u.dead).map(u=>{const p=sim.enemyQueuePriority(u);return{id:u.id,tier:p?.tier,band:p?.band,distance:p?.distance,lastAct:u.lastAct,queued:sim.b.queue.includes(u.id),hp:u.hp,phase:u.honroPilotCombat?.phase,target:u.honroPilotCombat?.target};});
const result={scope:'Detached actual save priority inspection, no live battle writes',round:b.round,enemyLimit:b.enemyLimit,queue:sim.b.queue,rows};
await writeFile(dir+'/pending-warning-queue.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
