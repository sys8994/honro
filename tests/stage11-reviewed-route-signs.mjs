/** Focused native sign-copy regression. No battle progression or geometry writes. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {Path2D} from '@napi-rs/canvas';
const source=await readFile('shared/runtime/stage11-landscape-art.js','utf8');
const g=vm.createContext({Path2D,HONRO_CORE:{},HonroScene:class{},HonroAct2:{},HonroAct3:{},HonroNarrativeCatalogue:{},HonroWorld:{},HonroObjectives:{},HonroJourneyContent:{}});
vm.runInContext(await readFile('shared/runtime/act23-v4.js','utf8'),g);
vm.runInContext(source,g);
const scene={scale:.4,x:6750,y:8750,canvas:{clientWidth:1440,clientHeight:900}},texts=[];
const c={save(){},restore(){},measureText:s=>({width:s.length*14}),fillRect(){},fillText:s=>texts.push(s),beginPath(){},moveTo(){},lineTo(){},stroke(){}};
function render(b){texts.length=0;const before=JSON.stringify(b);g.HonroStage11LandscapeArt.routeSigns(c,b,scene);assert.equal(JSON.stringify(b),before);return [...texts];}
const legacy={honroStage:11,honroStage11LandscapeRevision:1};
assert(render({...legacy,honroAct23V4Revision:1}).includes('← 서측 회귀 · 선택   |   아래 바위길 →'));
assert(render(legacy).includes('← 서측 회귀 · 선택   |   주민 암대 →'));
assert(render({...legacy,honroAct23V4Revision:1,honroCustom:true}).includes('← 서측 회귀 · 선택   |   주민 암대 →'));
assert(render({...legacy,honroAct23V4Revision:1,honroMapOrigin:'workshop'}).includes('← 서측 회귀 · 선택   |   주민 암대 →'));
assert.deepEqual(render({...legacy,honroStage:12,honroAct23V4Revision:1}),[]);
assert.deepEqual(render({...legacy,honroStage11LandscapeRevision:undefined}),[]);
console.log('PASS current Stage 11 geographical sign, legacy/custom/Workshop compatibility, other-stage opt-out, render purity');
