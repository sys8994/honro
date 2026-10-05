/** Isolated current-objective fixtures on the production shared Canvas renderer.
 * These images are not normal combat completion, browser DOM/HUD or input QA. */
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {guidanceRuntime,canvas,guidanceFixture} from '../../tests/act2-guidance-helpers.mjs';
const g=await guidanceRuntime(),tag=process.argv[2]||'after',out=`_local/reports/act2-guidance/${tag}`;await mkdir(out,{recursive:true});
const cases=[
 {id:18,objective:'hold-silence',name:'hold-ready'},
 {id:18,objective:'hold-silence',name:'hold-outside',outside:true},
 {id:18,objective:'hold-silence',name:'hold-contested',contested:true},
 {id:19,objective:'hold-second',name:'hold-slope'},
 {id:15,objective:'shaft-pin',name:'shaft-target'},
 {id:18,objective:'upper-chain',name:'upper-binding-target'}
],results=[];
for(const row of cases)for(const portrait of [false,true]){
 const {b,e,step,marker,point}=guidanceFixture(g,row.id,row.objective,row),target=b.terrain.find(t=>t.id===row.objective),w=portrait?390:1440,h=portrait?844:960,cv=canvas(w,h),scene=new g.HonroScene(cv);
 Object.assign(scene,{x:target?target.x+target.w*.5:marker.x,y:target?(target.y+point.y)*.5:marker.y-230,scale:portrait?.42:.60,manual:true,time:2,missionTargets:g.HonroAct2.state(b).targets});
 const before=JSON.stringify(b);scene.render(e,0,'',.6,false,0);await new Promise(resolve=>setTimeout(resolve,20));scene.render(e,0,'',.6,false,0);assert.equal(JSON.stringify(b),before,'drawing changed battle');
 const file=`stage-${row.id}-${row.name}-${portrait?'portrait':'landscape'}.png`,bytes=cv.toBuffer('image/png');await writeFile(`${out}/${file}`,bytes);
 results.push({file,stage:row.id,objective:row.objective,kind:step.kind,source:'Production HonroMaps + Engine + HonroScene on Native Canvas; isolated current-objective fixture',sha256:createHash('sha256').update(bytes).digest('hex'),renderPure:true});console.log(tag,file);
}
await writeFile(`${out}/manifest.json`,JSON.stringify({tag,results,limitations:['Isolated fixture; not a normal-combat playthrough','Native Canvas; no browser UI/input or performance validation']},null,2)+'\n');
