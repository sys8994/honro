/** The production inspector, with only its DOM shell stubbed. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const g=vm.createContext({console,document:{addEventListener(){},getElementById(){return null;}},HonroScene:class{},HonroWorld:{archetypes:{}}});vm.runInContext(readFileSync('shared/runtime/unit-info.js','utf8'),g);const I=g.HonroUnitInfo;
const held={id:'held',side:1,x:100,y:200,r:20,h:80,hp:100,dead:false,eaterCapturedBy:'prison'},prison={id:'prison',side:1,x:300,y:200,r:35,h:110,hp:200,dead:false,summoned:true,summonKind:'eater',eaterCaptureCount:1,summonExpires:3};
const a={screen:'battle',engine:{b:{units:[held,prison],round:1}},scene:{scale:1,world:(x,y)=>({x,y}),canvas:{style:{}}},modal:{classList:{contains:()=>false}}};
for(const touch of [false,true]){assert.equal(I.pick(a,{x:100,y:160},touch),null);assert.equal(I.pick(a,{x:300,y:145},touch),prison);}
I.hover(a,{x:100,y:160});assert.equal(a.scene.hoverUnitId,null);assert.equal(a.scene.canvas.style.cursor,'');assert.equal(I.show(a,held),false);
assert.match(I.description(prison,a.engine.b),/포획/);assert(!I.description(prison,a.engine.b).includes('동맹군 턴에 행동'));
delete held.eaterCapturedBy;assert.equal(I.pick(a,{x:100,y:160}),held,'Released survivor becomes inspectable again');
console.log('PASS real inspector excludes captive mouse/touch/hover/show, describes prison, and restores released targets');
