import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {stalledUpperSupport} from './stage23-support-policy.mjs';
const trace=JSON.parse(await readFile('review/stage23/normal-input-observation.json','utf8')),states=new Map(),decisions=[];
for(const a of trace.actions.filter(a=>a.op==='role-position'&&a.to.phase==='west-support')){
 const state=states.get(a.hero)||{};states.set(a.hero,state);
 if(stalledUpperSupport(state,{round:a.round,npcX:a.npc.x,npcY:a.npc.y,heroY:a.to.y}))decisions.push({round:a.round,hero:a.hero,npcX:a.npc.x,heroX:a.to.x,route:'west-upper-return'});
}
assert(decisions.some(d=>d.hero==='archer'));assert(decisions.some(d=>d.hero==='mage'));
for(const kind of ['advancing','nearby']){const state={};for(let round=1;round<8;round++)assert(!stalledUpperSupport(state,{round,npcX:kind==='advancing'?round*100:3000,npcY:5000,heroY:kind==='nearby'?4900:3650}));}
const once={};for(let n=0;n<20;n++)assert(!stalledUpperSupport(once,{round:1,npcX:3000,npcY:5000,heroY:3650}));
await writeFile('review/stage23/support-policy.json',JSON.stringify({scope:'Read-only replay of preserved R18 action trace into test-controller state; not combat replay or victory.',passed:true,decisions},null,2));console.log('PASS historical stalled upper-support decisions, advancing and same-floor controls');
