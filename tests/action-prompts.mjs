import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
const g=await runtime({legacyMaps:false});
const keyPrompt=/(?:E(?:키|를|로| 또는)|(?:^|[ ·])E(?:[ ·]|$)|\[E\])/;
function leaves(value,path='$',out=[]){if(typeof value==='string')out.push([path,value]);else if(value&&typeof value==='object')for(const [k,v]of Object.entries(value))leaves(v,path+'.'+k,out);return out;}
for(let id=1;id<=30;id++){
 const {b,st,app}=battlefield(g,id);
 // Objective initialization can create lazy state. Subsequent presentation is read-only.
 g.HonroObjectives.state(b,st);const before=JSON.stringify(b);
 const help=g.HonroObjectives.help(app);
 for(const [path,text]of leaves(help))assert(!keyPrompt.test(text),`Stage ${id} ${path}: ${text}`);
 for(const [path,text]of leaves(st))if(/\.(guide|goal)$/.test(path))assert(!keyPrompt.test(text),`Stage ${id} ${path}: ${text}`);
 assert.equal(JSON.stringify(b),before,`Stage ${id}: rendering preserves battle`);
}
let legacyGuides=0;
for(const name of ['narrative-legacy-v0','split-campaign-v1']){
 const old=JSON.parse(await readFile(`shared/data/${name}.json`,'utf8')),before=JSON.stringify(old);
 for(const [path,text]of leaves(old))if(path.endsWith('.guide')&&keyPrompt.test(text)){
  legacyGuides++;const display=g.HonroActionPrompts.text(text);assert(!keyPrompt.test(display),path);
  assert.deepEqual(display.match(/\d+/g),text.match(/\d+/g),'turn counts unchanged');
 }
 assert.equal(JSON.stringify(old),before,'legacy data remains immutable');
}
assert.equal(legacyGuides,12);
for(const [old,display]of [['주민 2 곁에서 E를 누르세요','주민 2 곁에서 구조하세요'],['받이진 1 앞에서 E를 누르세요','받이진 1을 활성화하세요'],['휘겸 · 숨은 기록실 열기 · E','휘겸 · 숨은 기록실 열기']]){assert.equal(g.HonroActionPrompts.text(old),display);assert.equal(g.HonroActionPrompts.text(display),display);}
assert.equal(g.HonroActionPrompts.text('석축 E 점프 입구 · E 상호작용'),'석축 E 점프 입구 · E 상호작용','region names and explicit key tables stay accurate');
const source=await readFile('shared/runtime/interactions.js','utf8');
const listeners={},host={dataset:{},innerHTML:''};g.document={getElementById:()=>host,addEventListener:(kind,fn)=>listeners[kind]=fn};
vm.runInContext(source,g);
let gateUses=0,prevented=0;
const b={round:1,teamEnds:[0],honroMarkers:[],honroState:{}},u={id:'mage',side:0,x:0,y:0,gateTurn:null};
const app={engine:{b,active:u,gateCandidate:()=>({id:'gate',x:0,y:0}),useGate:()=>{gateUses++;return true;},manualDive:()=>false,turnArrow:()=>false},canInput:()=>true,updateHUD(){},dirty:false};
g.HonroApp=app;
g.HonroInteractions.key(app,{code:'KeyE',repeat:false,preventDefault(){prevented++;}});
assert.equal(gateUses,1);assert.equal(prevented,1);
listeners.click({target:{closest:()=>({dataset:{contextInteract:'skillGate-gate'}})}});
assert.equal(gateUses,2,'touch/click shares the same interaction');
assert(!host.innerHTML.includes('keycap'),'context label has no E badge');
console.log('PASS: 30 active stage guides/HUDs; 12 immutable legacy guide displays; keyboard and touch gate actions');
