/** UI dispatch fixture, not screenshot/visual acceptance. */
import assert from 'node:assert/strict';import vm from 'node:vm';import fs from 'node:fs';
class Scene{unit(){return 'native-unit';}}
const g={HonroScene:Scene};vm.runInNewContext(fs.readFileSync('shared/runtime/act4-pilot-combat.js','utf8'),g);vm.runInNewContext(fs.readFileSync('shared/runtime/act4-pilot-art.js','utf8'),g);
const b={honroAct4Preview:40,honroFinalDefenseRevision:2,honroAct4Official:1},scene=new Scene();scene.scale=1;scene.actorEngine={b};let labels=[];const c={save(){},restore(){},strokeText(){},fillText(t){labels.push(t);}};
const major={side:1,boss:40,honroAct4FinaleBoss:true,name:'포구의 들린 장승',h:160,hp:100,x:0,y:0};assert.equal(scene.unit(c,major),'native-unit');assert.deepEqual(labels,['보스 · 포구의 들린 장승']);
labels=[];scene.unit(c,{...major,boss:0,honroAct4FinaleBoss:false,honroPilotMidboss:'harbor',name:'선착장 포격귀'});assert.deepEqual(labels,['중간보스 · 선착장 포격귀']);
for(const u of [{...major,dead:true},{...major,side:0},{...major,hp:0},{...major,eaterCapturedBy:'eater'},{...major,boss:0,honroAct4FinaleBoss:false}]){labels=[];scene.unit(c,u);assert.equal(labels.length,0);}
scene.scale=.1;labels=[];scene.unit(c,major);assert.equal(labels.length,0,'Do not cover distant actors with long labels');console.log('PASS native base rendering retained, boss/miniboss label distinction and hidden/dead/distant exclusions; no art acceptance');
