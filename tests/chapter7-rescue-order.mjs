/** Lightweight production content/entry scheduler, not combat/browser evidence. */
import assert from 'node:assert/strict';import vm from 'node:vm';import {readFile} from 'node:fs/promises';
const g=vm.createContext({HONRO_CORE:{SKILLS:{}},HonroEncounters:{pending:()=>0}});
for(const name of ['content','story-content','objectives','objective-guidance'])vm.runInContext(await readFile(`shared/runtime/${name}.js`,'utf8'),g);
const S=g.HonroStoryContent,st=g.HONRO_CONTENT.stages[6],plain=v=>JSON.parse(JSON.stringify(v));
const hero={id:'archer',cls:'archer',name:'설오',side:0,hp:100,x:0,y:500,h:80};
const fixture=()=>{const b={honroStage:7,honroNarrativeRevision:1,honroState:{flags:{}},round:1,width:4000,units:[hero],terrain:[],honroMarkers:[],honroMapAnchors:{}};return{stage:st,canSpeak:()=>true,engine:{b,active:hero,heroesAlive:()=>[hero]}};};
for(const interlude of [false,true]){
 const app=fixture(),rows=g.HonroObjectives.entry(app,{interlude}),method=rows.findIndex(l=>l[0]==='담허'&&l[1].includes('줄은 자르지 말고'));
 assert(method>=0&&method<7,'method is in the initial locked entry, including normal interlude:false');
 assert.match(rows[method][1],/손을 잡아 몸부터 가누게/);assert.match(rows[method][1],/가까이서 붙은 혼을 떼어/);
 assert(!JSON.stringify(rows).includes('빈 기둥'));
 const pending=app.engine.b.honroState.deferredStory;assert(!JSON.stringify(pending).includes('빈 기둥'));assert(!JSON.stringify(pending).includes('줄은 자르지 말고'));
 if(interlude===false)assert.equal(pending.length,0,'normal entry needs no round-2 briefing');
}
assert.equal(st.storyFollowups.length,0,'new chapter7 never schedules the obsolete method');
const saved={lines:[['설오','묶인 줄을 잘라드리면 됩니까?',{storyId:'act1-v6:entry-follow-7-0',afterAction:3}],['담허','먼저 빈 기둥으로 옮겨 받아야 해.',{storyId:'act1-v6:entry-follow-7-0'}]]};
for(const rescuedCount of [0,1,2,3]){
 const app=fixture();app.engine.b.honroState.rescuedCount=rescuedCount;const before=JSON.stringify([app.engine.b,saved]),rows=S.resolveDeferred(app,saved);
 assert.equal(rows.length,rescuedCount?0:1,'first completed rescue suppresses already-scheduled method');
 if(!rescuedCount){assert.match(rows[0][1],/줄은 자르지 말고/);assert.equal(rows[0][2].afterAction,3);assert.equal(rows[0][2].storyId,saved.lines[0][2].storyId);}
 assert.equal(JSON.stringify([app.engine.b,saved]),before,'queue resolving is read-only');
}
const app=fixture();app.engine.b.honroState.rescuedCount=1;
const other={lines:[['덕수','덕수요. 목수 덕수… 제발 내 손 좀 잡아주시오.',{storyId:'act1-v6:entry-follow-7-0'}]]};
assert.deepEqual(plain(S.resolveDeferred(app,other)),other.lines,'unrelated deferred speech survives');
const testimony=S.interaction(app,{action:'rescue',target:'resident-1',label:'덕수'});assert(!JSON.stringify(testimony).includes('빈 기둥'));assert(!JSON.stringify(testimony).includes('줄은 자르지 말고'));
const v0=await readFile('shared/runtime/story-content-v0.js','utf8');assert(v0.includes('먼저 빈 기둥으로 옮겨 받아야 해.'),'frozen historical script untouched');
console.log('PASS Chapter7 method precedes first input, normal entry has no deferred tutorial, saved old fresh tutorial drops after one rescue, unrelated speech and V0 remain intact.');
