// Presentation fixtures, not normal-input completion or combat balance evidence.
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
const g=await runtime({legacyMaps:false}),H=g.HonroStage11RavineEncounters,checks=[];
const nodes=new Map(),node=id=>nodes.get(id)||nodes.set(id,{textContent:'',setAttribute(){}}).get(id);
g.document={getElementById:node,addEventListener(){}};
vm.runInContext(await readFile('shared/runtime/interactions.js','utf8'),g);
const plain=v=>JSON.parse(JSON.stringify(v));
function make(){
 const q=battlefield(g,11),{b,e,app}=q,a=g.HonroAct2.memory(b);
 for(const s of g.HonroAct2.steps(b)){if(s.id==='resident')break;a.done[s.id]=true;}
 const m=b.honroMarkers.find(m=>m.id==='resident'),spirit=e.unit(m.spiritId),sodan=e.heroesAlive().find(u=>u.cls==='occultist'),archer=e.heroesAlive().find(u=>u.cls==='archer');
 for(const foe of e.alive(1))if(foe!==spirit)foe.x=1000;
 Object.assign(sodan,{x:m.x,y:m.y});Object.assign(archer,{x:m.x,y:m.y});b.active=sodan.id;b.side=0;b.phase='aim';
 app.canInput=()=>true;app.scene={};g.HonroObjectives.state(b,q.st);
 return {...q,m,spirit,sodan,archer};
}
function check(name,fn){fn();checks.push(name);console.log('PASS',name);}
function text(q,expected){
 const before=JSON.stringify(q.b),s=g.HonroObjectives.state(q.b,q.st);assert.equal(s.currentObjectiveId,'resident');assert.equal(s.currentInstruction,expected);
 g.HonroObjectives.refresh(q.app);assert.equal(node('objective-text').textContent,expected,'Actual lexical HUD path');
 assert.equal(g.HonroObjectives.help(q.app).guide,expected,'Actual help path');assert.equal(JSON.stringify(q.b),before,'Guidance is read-only');
 return g.HonroInteractions.eligibility(q.app,q.m);
}
check('nearby threat first, exact count and boundary, without showing later E/weakening steps',()=>{
 const q=make(),foes=q.e.alive(1).filter(u=>u!==q.spirit).slice(0,4);
 Object.assign(foes[0],{x:q.m.x+359,y:q.m.y});Object.assign(foes[1],{x:q.m.x-240,y:q.m.y});Object.assign(foes[2],{x:q.m.x+360,y:q.m.y});Object.assign(foes[3],{x:q.m.x,y:q.m.y,honroSubdued:true});
 const rule=text(q,'주민 주변의 적 2명을 처치하세요');assert.equal(rule.ok,false);assert.equal(rule.reason,'주변 들림을 먼저 제압하세요');
 q.sodan.x-=1200;text(q,'주민 주변의 적 2명을 처치하세요');assert.equal(g.HonroInteractions.eligibility(q.app,q.m).reason,'더 가까이 이동','Approach does not conceal the upcoming area hazard in HUD');
});
check('living spirit above 40% shows only weakening; exact 40% switches to Sodan E',()=>{
 const q=make();q.spirit.hp=q.spirit.maxHp*.4+.01;assert.equal(text(q,'붙은 혼의 체력을 40% 이하로 낮추세요').ok,false);
 q.spirit.hp=q.spirit.maxHp*.4;assert.equal(text(q,'소단으로 주민에게 다가가 E').ok,true);
 q.b.active=q.archer.id;assert.equal(text(q,'소단으로 주민에게 다가가 E').ok,false,'Archer cannot extract a living spirit');
});
check('dead Sodan gets legal defeat alternative, then any companion E after spirit defeat',()=>{
 const q=make();q.sodan.hp=0;q.sodan.dead=true;q.b.active=q.archer.id;
 assert.equal(text(q,'주민에게 붙은 혼을 제압하세요').ok,false);
 q.spirit.hp=q.spirit.maxHp*.3;assert.equal(text(q,'주민에게 붙은 혼을 제압하세요').ok,false);
 q.spirit.hp=0;q.spirit.dead=true;assert.equal(text(q,'동행으로 주민에게 다가가 E').ok,true);
});
check('defeated or subdued spirit never asks for nonexistent weakening or Sodan',()=>{
 const q=make();q.b.active=q.archer.id;q.spirit.hp=0;q.spirit.dead=true;assert.equal(text(q,'동행으로 주민에게 다가가 E').ok,true);
 q.spirit.dead=false;q.spirit.hp=q.spirit.maxHp*.2;q.spirit.honroSubdued=true;assert.equal(text(q,'동행으로 주민에게 다가가 E').ok,true);
});
check('every other stage, old draft revision and non-rescue objective have byte-equal presentation',()=>{
 const original=H.rescueInstruction;
 for(let id=1;id<=30;id++){
  const q=battlefield(g,id);g.HonroObjectives.state(q.b,q.st);const after=plain(g.HonroObjectives.state(q.b,q.st));H.rescueInstruction=()=>null;
  try{assert.deepEqual(plain(g.HonroObjectives.state(q.b,q.st)),after,'Stage '+id);}finally{H.rescueInstruction=original;}
 }
 for(const revision of [undefined,1]){const q=make();if(revision===undefined)delete q.b.honroStage11EncounterRevision;else q.b.honroStage11EncounterRevision=revision;
  const after=plain(g.HonroObjectives.state(q.b,q.st));H.rescueInstruction=()=>null;try{assert.deepEqual(plain(g.HonroObjectives.state(q.b,q.st)),after);}finally{H.rescueInstruction=original;}
 }
});
await mkdir('_local/reports/stage11-ravine-completion',{recursive:true});
await writeFile('_local/reports/stage11-ravine-completion/rescue-guidance.json',JSON.stringify({checks,scope:'Read-only current-step text; unchanged production eligibility, snapshots and all other chapters. No normal-input victory claim.'},null,2)+'\n');
