import assert from 'node:assert/strict';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
const g=await runtime({legacyMaps:false}),checks=[];
function check(name,fn){fn();checks.push(name);console.log('PASS',name);}
for(let id=1;id<=30;id++)check(`Stage ${id}: finish/failure/current task comes from the actual battle`,()=>{
 const {b,st}=battlefield(g,id),before=JSON.stringify(b),s=g.HonroObjectives.state(b,st);
 assert(s.summary&&s.completionText&&s.failureText);assert(!s.summary.includes('안전 확보'));assert.equal(s.minimumRound,1);
 const prepared=JSON.stringify(b);assert.deepEqual(g.HonroObjectives.state(b,st),s);assert.equal(JSON.stringify(b),prepared,'display is stable and read-only after objective initialization');
 if(id>10){assert.equal(s.checklist.length,(id>=21?g.HonroAct3.steps(b):g.HonroAct2.steps(b)).length);assert(s.summary.startsWith('완료 0/'));}
});
check('Early arrival is not blocked by a pacing floor',()=>{const {b,st}=battlefield(g,1),exit=b.honroMarkers.find(m=>m.type==='exit');b.units.find(u=>u.side===0).x=exit.x;assert.equal(b.round,1);assert(g.HonroObjectives.state(b,st).complete);});
for(const [id,key,value,hold] of [[3,'ledger',true,1],[7,'rescuedCount',3,2],[9,'receivers',2,2]])check(`Stage ${id}: genuine post-objective protection is preserved`,()=>{const {b,st}=battlefield(g,id);b.honroState[key]=value;b.honroState.objectiveReadyRound=b.round;assert(!g.HonroObjectives.state(b,st).complete);b.round+=hold;assert(g.HonroObjectives.state(b,st).complete);});
check('Eight-round evacuation remains a real timed objective',()=>{const {b,st}=battlefield(g,4);b.round=8;assert(!g.HonroObjectives.state(b,st).complete);b.round=9;assert(g.HonroObjectives.state(b,st).complete);});
check('Sodan still requires six full enemy ends after cooperation',()=>{const {b,st}=battlefield(g,10);Object.assign(b.honroState,{sodanCoop:true,coopHold:5});assert(!g.HonroObjectives.state(b,st).complete);b.honroState.coopHold=6;assert(g.HonroObjectives.state(b,st).complete);});
check('Stage 22 exposes the actual exit and class, and follows saved ordered steps',()=>{const {b,st}=battlefield(g,22);assert.match(g.HonroObjectives.state(b,st).completionText,/관창/);assert.match(g.HonroObjectives.state(b,st).summary,/휘겸/);b.honroAct3Steps=[{id:'saved-exit',label:'저장된 관창 출구',kind:'reach'}];b.honroMarkers.push({id:'saved-exit',type:'exit',x:100,y:100});const s=g.HonroObjectives.state(b,st);assert.equal(s.checklist.length,1);assert.match(s.completionText,/저장된 관창 출구/);});
check('Help supplies the exact summary, checklist and ending without spending an action',()=>{const {b,st}=battlefield(g,27);const input={engine:{b},stage:st};const help=g.HonroObjectives.help(input),before=JSON.stringify(b);assert(help.checklist.length);assert.match(help.failureText,/12번째/);g.HonroObjectives.help(input);assert.equal(JSON.stringify(b),before);});
console.log('PASS',checks.length,'objective clarity checks; source/state fixtures, not normal play');
