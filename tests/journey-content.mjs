/** Pure content contracts; no gameplay or browser claims. Reconstructed. */
import assert from 'node:assert/strict';
import vm from 'node:vm';import {readFile} from 'node:fs/promises';
const g=vm.createContext({HONRO_CORE:{SKILLS:{}},HONRO_BALANCE:{stages:Array.from({length:20},()=>({entryLevel:1}))}});
for(const name of ['content','story-content','act2-content','act2-drama','journey-content'])vm.runInContext(await readFile(`shared/runtime/${name}.js`,'utf8'),g);
const J=g.HonroJourneyContent,H=g.HONRO_CONTENT,plain=x=>JSON.parse(JSON.stringify(x));
assert.equal(J.places.length,20);assert.deepEqual(plain(J.interludeSources),Object.fromEntries(H.stages.map(s=>[s.id,plain(s.narration)])));
for(let id=1;id<=20;id++){const p=J.at(id),lines=J.interlude(id);assert.equal(p.event,H.stages[id-1].name);assert(lines.length>=2);assert(lines.every(l=>l[0]==='서술'?l[2].kind==='narration'&&l[2].presentation==='inline':!l[2].kind&&!l[2].art));assert(p.map.every(Number.isFinite));assert.equal(p.layer,id<13?'surface':'underground');const locked={cleared:{},recruited:['archer'],seen:{}};if(id>1)assert.deepEqual(plain(J.required(locked,id)),[]);assert.deepEqual(plain(J.optional(locked,id,'occultist')),[]);}
assert.deepEqual(Array.from({length:20},(_,i)=>i+1).filter(id=>J.transitionAfter(id)==='direct'),[1,9,18]);assert.equal(J.at(18).place,J.at(19).place);assert.equal(J.ending.layer,'surface');assert.equal(J.at('bad'),null);console.log('PASS 20 source narration snapshots, authored speech/narration roles, recruitment/layer boundaries and authored urgent links');
