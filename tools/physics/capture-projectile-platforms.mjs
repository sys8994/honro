/** Production Scene and real projectile steps. Native evidence, not browser input.
 * The before panel replays the former solid projectile policy on the same scene;
 * it is a policy A/B, not a claim to run an entire historical checkout. */
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {guidanceRuntime,canvas} from '../../tests/act2-guidance-helpers.mjs';
import {projectilePlatformProject,projectilePlatformCases} from '../../tests/fixtures/projectile-platform-arena.mjs';
const g=await guidanceRuntime(),C=g.HONRO_CORE,out='_local/reports/projectile-platforms/native',results=[],project=projectilePlatformProject(g);
await mkdir(out,{recursive:true});
await writeFile(`${out}/projectile-platform-arena.json`,g.HonroMaps.serialize(project));
class SolidProjectileEngine extends C.Engine{
 collision(a,c,r,owner,hit,units,skip,terrain){return super.collision(a,c,r,owner,hit,units,skip,terrain,false);}
}
for(const fixture of projectilePlatformCases)for(const mode of ['before','after']){
 const p=structuredClone(project),st=p.stages[0];if(fixture.solid)st.terrains[1].oneWay=false;
 if(fixture.slope){st.terrains[1].points=[{x:350,y:860},{x:2950,y:580},{x:2950,y:650},{x:350,y:930}];}
 const b=g.HonroMaps.createBattle(st,p),u=b.units.find(v=>v.cls===C.SKILLS[fixture.skill].cls&&v.side===0);
 Object.assign(u,{x:800,y:1000,loadout:[fixture.skill],ranks:{[fixture.skill]:1},angle:fixture.angle,lastPower:fixture.power,focus:10000,maxFocus:10000,acted:false,cooldowns:{}});
 Object.assign(b,{units:[u],active:u.id,phase:'aim',side:0,wind:0,fields:[],drafts:[],waters:[],projectiles:[],stakes:[],volley:undefined});
 const Engine=mode==='before'?SolidProjectileEngine:C.Engine,e=new Engine(b);e.checkEnd=()=>false;
 const predicted=e.predict(u,C.SKILLS[fixture.skill],fixture.angle,fixture.power);
 assert(e.fire(fixture.skill,fixture.angle,fixture.power));const shot=b.projectiles[0],path=[{x:shot.x,y:shot.y}],hits=[];
 const impact=e.impact.bind(e);e.impact=(p,h)=>{hits.push({x:h.x,y:h.y,normal:h.n,terrain:h.terrain?.id});impact(p,h);};
 for(let i=0;i<1600&&b.projectiles.includes(shot);i++){e.stepProjectile(shot,C.STEP);path.push({x:shot.x,y:shot.y});}
 assert(!b.projectiles.includes(shot));const error=Math.hypot(predicted.x-shot.x,predicted.y-shot.y);assert(error<.1,'Native fixture guide/live parity');
 const cv=canvas(1280,800),scene=new g.HonroScene(cv);Object.assign(scene,{manual:true,editorView:true,skillPreview:true,x:1450,y:590,scale:.65,time:2});
 const state=JSON.stringify(b);scene.render(e,0,'',fixture.power,false,0);await new Promise(r=>setTimeout(r,20));scene.render(e,0,'',fixture.power,false,0);assert.equal(JSON.stringify(b),state);
 // Test-only overlay of recorded positions, not a substituted game renderer.
 const c=cv.getContext('2d');c.save();c.translate(cv.width/2,cv.height/2);c.scale(scene.scale,scene.scale);c.translate(-scene.x,-scene.y);
 c.strokeStyle='#f2d59b';c.lineWidth=2.5/scene.scale;c.beginPath();path.forEach((v,i)=>i?c.lineTo(v.x,v.y):c.moveTo(v.x,v.y));c.stroke();
 for(const h of hits){c.fillStyle='#efab93';c.beginPath();c.arc(h.x,h.y,5/scene.scale,0,Math.PI*2);c.fill();}c.restore();
 c.fillStyle='#112027ee';c.fillRect(0,0,1280,80);c.fillStyle='#eee7d6';c.font='20px sans-serif';c.fillText(`${mode==='before'?'이전 충돌 규칙':'하이브리드 규칙'} · ${fixture.label}`,25,32);c.font='15px sans-serif';c.fillText('Native 공통 Scene + 실제 비행 기록(금색). 브라우저·입력·정상 전투 완료 증거는 별도입니다.',25,61);
 const file=`${fixture.id}-${mode}.png`;await writeFile(`${out}/${file}`,cv.toBuffer('image/png'));
 results.push({mode,fixture:fixture.id,file,skill:fixture.skill,angle:fixture.angle,power:fixture.power,holdSeconds:e.chargeDuration(u,C.SKILLS[fixture.skill])*fixture.power,points:path.length,hits,guideError:error,installation:b.stakes[0]||b.units.find(v=>v.summoned),renderPure:JSON.stringify(b)===state});
 for(const t of scene._domainTiles?.tiles.values()||[])t.canvas.width=1;scene._domainTiles?.tiles.clear();scene._staticWorldCache=null;cv.width=1;global.gc?.();console.log(file);
}
await writeFile(`${out}/manifest.json`,JSON.stringify({commit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),scope:'Production Engine/Scene Native policy A/B with test-only recorded-path overlay. Before disables only the new directional collision flag. No browser/GPU/input or deployment claim.',project:'projectile-platform-arena.json',results},null,2)+'\n');
