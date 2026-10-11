/** Lightweight production finale event with fixed distant-position snapshots.
 * Not a normal combat, projectile, renderer or browser test. */
import assert from 'node:assert/strict';import vm from 'node:vm';import {readFile} from 'node:fs/promises';
const legacy=JSON.parse(await readFile('shared/data/narrative-legacy-v0.json','utf8'));
const g=vm.createContext({HONRO_CORE:{SKILLS:{}},HONRO_NARRATIVE_V0:legacy,HonroNarrativeRevision:{active:b=>b.honroNarrativeRevision===1&&!b.honroCustom},HonroObjectives:{state:()=>({complete:false})}});
for(const f of ['content','story-content','mission'])vm.runInContext(await readFile(`shared/runtime/${f}.js`,'utf8'),g);
const S=g.HonroStoryContent,plain=v=>JSON.parse(JSON.stringify(v));
assert.equal(S.finaleMidpoint().length,4);assert.equal(S.cooperationDefense().length,6);
assert.match(S.finaleMidpoint()[1][1],/제 목소리.*여기서 지키고.*매듭에 집중/);
assert.match(S.finaleMidpoint()[3][1],/양옆 진이 받고/);
assert.match(S.cooperationDefense()[4][1],/다가오는 것들은 제가 막겠습니다/);
assert.doesNotMatch(JSON.stringify([S.finaleMidpoint(),S.cooperationDefense()]),/바로 앞에 있습니다|앞은 제가 보고|양옆은 내가 받네/);
for(const fresh of [true,false]){
 const boss={id:'boss',x:4000,y:1200,hp:100},archer={id:'archer',x:500,y:1700,hp:100,side:0};
 const hs={sodanCoop:true,finaleRevision:2,finaleAnchor:{x:boss.x,y:boss.y},finaleLastEnemyEnd:2,finaleDefenseTurns:2,coopHold:2,finaleWave:6};
 const b={honroStage:10,...(fresh?{honroNarrativeRevision:1}:{}),honroState:hs,teamEnds:[2,3],side:0,units:[boss,archer]},speeches=[];
 const app={stage:g.HONRO_CONTENT.stages[9],actorBoundary:'archer',engine:{b,unit:id=>b.units.find(u=>u.id===id)},sayLines:lines=>speeches.push(plain(lines))};
 const position=JSON.stringify(b.units.map(u=>({id:u.id,x:u.x,y:u.y})));
 g.HonroMission.finale(app);assert.equal(speeches.length,1);assert.equal(hs.coopHold,3);assert.equal(hs.finaleDefenseTurns,3);assert.equal(JSON.stringify(b.units.map(u=>({id:u.id,x:u.x,y:u.y}))),position,'wording never relocates either person');
 assert.deepEqual(speeches[0],fresh?plain(S.finaleMidpoint()):legacy.finaleMidpoint,'fresh/legacy event chooses the correct original payload');
 g.HonroMission.finale(app);assert.equal(speeches.length,1,'midpoint still fires once at the existing boundary');
}
assert(legacy.finaleMidpoint.some(l=>l[1].includes('바로 앞에 있습니다')),'frozen V0 remains exact');
console.log('PASS distant-party protection wording, real finale midpoint once-only event, unchanged positions/turn progress and explicit V0 dispatch.');
