// Production objective readers with explicit progress/death fixtures. These
// checks cover presentation only, not normal combat completion or browser UI.
import assert from 'node:assert/strict';
import {runtime,battlefield} from '../game/tests/helpers.mjs';

const g=await runtime({legacyMaps:false}),A=g.HonroAct2;
const condition='대상 적을 모두 제압';
for(const id of [11,16,18]){
 const {b,st,app}=battlefield(g,id),chapter=A;
 chapter.attach(app,app.engine);
 const steps=chapter.steps(b),clear=steps.find(s=>s.kind==='clear');
 assert(clear,'The fixture must retain a real authored clear objective');
 for(const step of steps){if(step.id===clear.id)break;chapter.memory(b).done[step.id]=true;}
 const before=JSON.stringify(b),state=g.HonroObjectives.state(b,st),help=g.HonroObjectives.help(app);
 const expected=clear.label+' · '+condition;
 assert.equal(state.checklist.find(q=>q.id===clear.id).text,expected);
 assert.equal(state.visibleChecklist.find(q=>q.id===clear.id).text,expected);
 assert.equal(help.checklist.find(q=>q.id===clear.id).text,expected);
 assert.equal(JSON.stringify(b),before,'Checklist/help reads must not alter the battle');
 console.log(`PASS Stage ${id}: generic clear checklist states a condition, not a fixed zero count`);
}

const {b,st,app}=battlefield(g,11),step=A.steps(b).find(s=>s.id==='clear-west');
A.memory(b).done['knot-west']=true;
const checkLive=()=>{
 const foes=A.enemiesFor(b,step),before=JSON.stringify(b),state=g.HonroObjectives.state(b,st),help=g.HonroObjectives.help(app);
 assert(foes.length>0);
 assert(state.currentInstruction.endsWith('남은 적 '+foes.length));
 assert(state.targets[0].label.endsWith('남은 적 '+foes.length));
 assert.equal(state.currentObjectiveId,'clear-west');
 assert.equal(help.checklist.find(q=>q.id==='clear-west').text,step.label+' · '+condition);
 assert.equal(JSON.stringify(b),before,'The live subgroup count and condition remain read-only');
 return foes;
};
const initial=checkLive();
assert(initial.length>1&&initial.length<b.units.filter(u=>u.side===1&&!u.dead&&u.hp>0).length,'The actual west subgroup differs from the total enemy count');
Object.assign(initial[0],{hp:0,dead:true});
assert.equal(checkLive().length,initial.length-1);
const saved=JSON.parse(JSON.stringify(b)),before=JSON.stringify(saved);
const resumed=g.HonroObjectives.help({...app,engine:{b:saved}});
assert.equal(resumed.checklist.find(q=>q.id==='clear-west').text,step.label+' · '+condition);
assert(resumed.currentInstruction.endsWith('남은 적 '+(initial.length-1)));
assert.equal(JSON.stringify(saved),before,'Reloaded progress is not migrated by display');

// Legacy snapshots use the same unambiguous condition without opting into new
// objectives, and a latched completed row stays completed after a later spawn.
delete saved.honroNarrativeRevision;delete saved.honroNarrativeContent;
A.memory(saved).done['clear-west']=true;
const historical=JSON.stringify(saved),row=g.HonroObjectives.state(saved,st).checklist.find(q=>q.id==='clear-west');
assert.equal(row.text,step.label+' · '+condition);assert.equal(row.done,true);
assert.equal(JSON.stringify(saved),historical);
console.log('PASS Stage 11: live cohort count, death update, saved/legacy state, and completion history are preserved');

// Chapter 14 already has a dedicated live-count checklist. Its presentation
// override must retain its own numbers rather than adopting the generic text.
const vertical=battlefield(g,14);A.attach(vertical.app,vertical.e);
const upper=A.steps(vertical.b).find(s=>s.id==='clear-upper');assert(upper);
const verticalBefore=JSON.stringify(vertical.b),upperCount=A.enemiesFor(vertical.b,upper).length;
const upperRow=g.HonroObjectives.help(vertical.app).checklist.find(q=>q.id===upper.id);
assert.equal(upperRow.text,upper.label+' · 남은 대상 '+upperCount+'명');
assert.equal(JSON.stringify(vertical.b),verticalBefore);
console.log('PASS Chapter 14 dedicated live-count checklist remains unchanged');
