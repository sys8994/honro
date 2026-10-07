// Deterministic production Scene frames. This is Native Canvas evidence, not
// browser CSS/input QA or a normal-combat playthrough.
import assert from 'node:assert/strict';import vm from 'node:vm';
import {mkdir,readFile,writeFile}from'node:fs/promises';
import {guidanceRuntime,canvas}from'../../tests/act2-guidance-helpers.mjs';
const g=await guidanceRuntime(),out='_local/reports/story-staging/native';await mkdir(out,{recursive:true});
let now=0;g.performance={now:()=>now};
const node=()=>({innerHTML:'',children:[],querySelector:()=>({focus(){},insertAdjacentHTML(){}}),classList:{contains:()=>false,toggle(){}},insertAdjacentHTML(){}}),host=node();
g.document.body=node();g.document.getElementById=id=>id==='dialogue-root'?host:null;g.HONRO_STORY_PORTRAITS=new Proxy({},{get:()=>({src:'data:image/png;base64,'})});
vm.runInContext(await readFile('shared/runtime/story.js','utf8'),g);
const map=g.HONRO_PROJECT.stages[8],b=g.HonroMaps.createBattle(map,g.HONRO_PROJECT);g.HonroStageRules.sanitizeStageBattle(b);const e=new g.HONRO_CORE.Engine(b,()=>{},false),cv=canvas(1280,720),scene=new g.HonroScene(cv);Object.assign(scene,{x:850,y:2390,scale:.82,manual:true});
const app={engine:e,scene,profile:{honroNarrative:[],seen:{}},stage:g.HONRO_CONTENT.stages[8],screen:'battle',modal:node(),actorBoundary:b.active,done:false,dialogue:null,cancelInput(){},persist(){},audio:{play(s){sounds.push(s);}},speakerUnits(who){return b.units.filter(u=>u.name===who||u.side===0&&g.HONRO_CONTENT.hero[u.cls]?.name===who);},canSpeak(who){const units=this.speakerUnits(who);return units.some(u=>!u.dead&&u.hp>0)||!Object.values(g.HONRO_CONTENT.hero).some(h=>h.name===who);}};
const sounds=[],frames=[];
async function capture(name){const before=JSON.stringify(b);scene.render(e,0,'',.6,false,0);await new Promise(r=>setTimeout(r,25));scene.render(e,0,'',.6,false,0);assert.equal(JSON.stringify(b),before,'renderer is read-only');const file=`${name}.png`;await writeFile(`${out}/${file}`,cv.toBuffer('image/png'));frames.push({file,time:now,camera:{x:scene.x,y:scene.y,scale:scene.scale},actor:b.units.find(u=>u.id==='npc-sodan')?{x:b.units.find(u=>u.id==='npc-sodan').x,y:b.units.find(u=>u.id==='npc-sodan').y,pose:b.units.find(u=>u.id==='npc-sodan').honroScenePose}:null,caption:app.dialogue?.staging?.steps[app.dialogue.staging.cursor]?.caption||app.dialogue?.lines[app.dialogue.index]?.[1]||''});console.log(file);}
// Show the actual doorway before the trigger, including its absence from roster.
scene.x=3350;scene.y=2300;await capture('00-hidden-doorway');scene.x=850;scene.y=2390;
b.honroState.receivers=1;g.HonroStoryStaging.request(app,g.HonroStoryStaging.ID,{marker:'receiver-west'});
const targets=new Map([[0,'01-bell'],[600,'02-pan'],[1200,'03-walk'],[1900,'04-hold-bell'],[2400,'05-speaking']]);
for(now=0;now<=2600;now+=50){g.HonroStory.tick(app,now);if(targets.has(now))await capture(targets.get(now));}
assert(app.dialogue.staging.complete);assert.equal(b.units.find(u=>u.id==='npc-sodan').x,3274);assert.equal(sounds.filter(s=>s==='sodanBell').length,1);
const sample=g.HONRO_CORE.AudioEngine.samples('sodanBell',24000);assert(sample.length>10000);assert([...sample].every(Number.isFinite));assert(Math.max(...sample.map(Math.abs))>.05);
const pcm=Buffer.alloc(44+sample.length*2);pcm.write('RIFF',0);pcm.writeUInt32LE(pcm.length-8,4);pcm.write('WAVEfmt ',8);pcm.writeUInt32LE(16,16);pcm.writeUInt16LE(1,20);pcm.writeUInt16LE(1,22);pcm.writeUInt32LE(24000,24);pcm.writeUInt32LE(48000,28);pcm.writeUInt16LE(2,32);pcm.writeUInt16LE(16,34);pcm.write('data',36);pcm.writeUInt32LE(sample.length*2,40);sample.forEach((x,i)=>pcm.writeInt16LE(Math.round(Math.max(-1,Math.min(1,x))*32767),44+i*2));await writeFile(`${out}/sodan-bell.wav`,pcm);
await writeFile(`${out}/manifest.json`,JSON.stringify({mode:'Production Scene + Native Canvas, explicit trigger fixture',frames,sounds,limits:['No actual browser overlay, keyboard/touch or speaker playback verification.','First receiver state and actor boundary are explicit isolated-render fixtures.']},null,2));
scene._worldTileCache?.tiles?.clear();cv.width=cv.height=1;
