/** Detached current-state analysis only. Does not control or mutate live play. */
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createFinale} from './bootstrap.mjs';
import {evaluateLegalCast} from './legal-cast.mjs';
const file=process.argv[2],out=process.argv[3];assert(file&&out);
const snapshot=JSON.parse(execFileSync('xz',['-dc',file],{maxBuffer:128e6}));
const {C}=await createFinale();const b=snapshot.battle,e=new C.Engine(b,()=>{},true),actions=[];
const source=execFileSync('git',['show','4401960108d77714d41be9f5eee175b5324d86e8:tools/stage40-qa/diagnostic-finishing.mjs'],{encoding:'utf8'}); // Frozen historical nominal policy, never silently adopt later selection changes.
let body=source.slice(source.indexOf('function plan()'),source.indexOf('function healing()'));
body=body.replace('let best=null;','let best=null,candidates=[];').replace('if(!(x.score>0&&(!best||x.score>best.score)))return;','if(!(x.score>0))return;').replace('x.score=complete.enemyDamage;best=x;','x.score=complete.enemyDamage;best=x;candidates.push(x);').replace('return best;','return candidates;');
const candidates=new Function('C','b','e','actions','evaluateLegalCast','assert',body+';return plan();')(C,b,e,actions,evaluateLegalCast,assert);
const unique=[...new Map(candidates.map(x=>[[x.id,x.angle.toFixed(3),x.power.toFixed(4)].join(':'),x])).values()];
const results=[];for(const c of unique){const rows=[];for(const da of [-1,0,1])for(const dp of [-.05,0,.05])rows.push({da,dp,...evaluateLegalCast(C,b,e.active.id,c.id,c.angle+da,Math.max(0,Math.min(1,c.power+dp)))});const safe=rows.every(x=>x.safe),minimum=Math.min(...rows.map(x=>x.enemyDamage||0));results.push({choice:c,safe,minimum,rows});}
results.sort((a,z)=>(z.safe?z.minimum:0)-(a.safe?a.minimum:0)||z.choice.score-a.choice.score);
await writeFile(out,JSON.stringify({scope:'Detached captured current-state candidate robustness, no live action or full-stage acceptance',snapshot:file,count:unique.length,results},null,2));
console.log(JSON.stringify({count:unique.length,best:results.slice(0,8).map(({rows,...r})=>r)},null,2));
