import assert from 'node:assert/strict';
import {runtime} from '../game/tests/helpers.mjs';
const g=await runtime({legacyMaps:false}),H=g.HONRO_CONTENT,plain=x=>JSON.parse(JSON.stringify(x));
for(const [id,cast]of [[25,['설오','담허']],[26,['휘겸','소단','주민']],[27,['설오','담허']]]){const s=H.stages[id-1];for(const l of [...s.story,...Object.values(s.beats).flat(),...s.outro,...s.failure])assert(cast.includes(l[0]),id+' absent speaker '+l[0]);}
for(const id of [26,28])assert(!H.stages[id-1].steps.some(s=>['hold','destroy'].includes(s.kind)),'no repeated defense/filler breakables '+id);
const text=id=>JSON.stringify(H.stages[id-1]),facts=text(26)+text(28);
for(const key of ['주민 전원을 죽였','무명사','대종','유골과 재','수거량','작위 박탈','추방','폐쇄와 제압','사후 보고','대도사'])assert(facts.includes(key),'preserved fact '+key);
for(const key of ['숟가락','농기구','이름표','가족 번호','같은 이름'])assert((text(25)+text(27)+text(28)).includes(key));
assert(!text(27).includes('폐쇄와 제압'));assert(text(28).includes('주민 전원을 죽이라는 명령은 없습니다'));
assert(text(29).includes('현묵의 현재 상태는 미상'));assert(text(30).includes('옛길은 끊겨'));
for(const id of [25,27]){const s=H.stages[id-1];for(const lines of Object.values(s.beats))for(const [,line]of lines)assert(!/이 구간에서는 수련하지|사람을 골라|진목을 누르/.test(line),'UI manual kept out of dialogue');}
const p=g.HONRO_PROJECT;for(const id of [25,26,27,28])assert.deepEqual(plain(p.stages[id-1].initialState.honroAct3Steps),plain(H.stages[id-1].steps));
console.log('PASS hidden-depot story: present speakers, failure cast, retained evidence, reunion reveal order, no repeated holds or filler breakables');
