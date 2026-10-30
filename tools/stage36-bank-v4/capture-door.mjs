/** Actual production App renderer; ordinary recorded inputs reach door state.
 * DOM/audio are existing adapter doubles. Never an art-approval gate. */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {runtimeDigest} from '../stage31/probes.mjs';
import {createAppAdapter} from '../stage36-production/app-adapter.mjs';
const [file,out]=process.argv.slice(2);if(!out)throw Error('project output-directory required');
const source=await readFile(file),sourceSHA256=createHash('sha256').update(source).digest('hex'),runtimeSHA256=await runtimeDigest();
const tapeFile=process.argv[4]||'art/stage36-vector-production/ordinary-inputs.json',tapeBytes=await readFile(tapeFile),tapeSHA256=createHash('sha256').update(tapeBytes).digest('hex');
const p=JSON.parse(source),tape=JSON.parse(tapeBytes)[0];
const a=await createAppAdapter(p,'stage-36',{entryBuild:tape.entryBuild}),{app,g}=a;
await mkdir(out,{recursive:true});const manifest=[];
async function capture(state){const keys=['storyFrame','storyTween','goalFocus','editorView','skillPreview','manual','x','y','scale'];const saved=Object.fromEntries(keys.map(k=>[k,app.scene[k]])),size={width:app.scene.canvas.width,height:app.scene.canvas.height,cameraWidth:app.scene._cameraWidth,cameraHeight:app.scene._cameraHeight};Object.assign(app.scene,{storyFrame:null,storyTween:null,goalFocus:null,editorView:true,skillPreview:true});for(const v of p.production.cards['stage-36'].cameraViews){a.camera(v.x,v.y,v.scale);app.scene.canvas.width=v.width;app.scene.canvas.height=v.height;app.scene.render(app.engine,0,'',.6,false,0);const name=`${state}-${v.id}.png`;await writeFile(`${out}/${name}`,app.scene.canvas.toBuffer('image/png'));global.gc?.();manifest.push({file:name,state,view:v,actualCamera:{x:app.scene.x,y:app.scene.y,scale:app.scene.scale,width:app.scene.canvas.width,height:app.scene.canvas.height},door:structuredClone(app.engine.b.honroAct4PreviewState?.door),scope:a.scope+' Manual fixed-camera inspection; presentation framing temporarily suspended, no injected battle/event state.'});}Object.assign(app.scene,saved);Object.assign(app.scene.canvas,{width:size.width,height:size.height});app.scene._cameraWidth=size.cameraWidth;app.scene._cameraHeight=size.cameraHeight;}
assert.equal(app.engine.b.honroAct4PreviewState?.door?.phase,'standing');await capture('standing');let frames=0,done=false,firstFallenFrame=null,lastDoorPhase='standing';const transitions=[{frame:0,phase:lastDoorPhase}];
for(const input of tape.inputs){
 const engine=app.engine;
 const tick=()=>{a.tick();frames++;const phase=app.engine.b.honroAct4PreviewState?.door?.phase;if(phase!==lastDoorPhase){transitions.push({frame:frames,phase,door:structuredClone(app.engine.b.honroAct4PreviewState?.door)});lastDoorPhase=phase;}if(phase==='fallen'&&firstFallenFrame===null)firstFallenFrame=frames;};
 if(input.op==='advance'){for(let i=0;i<input.frames;i++)tick();}
 else if(input.op==='camera')a.camera(input.x,input.y,input.scale);else if(input.op==='next-dialogue')a.next();else if(input.op==='skip-dialogue')a.skip();else if(input.op==='close-modal')app.close();else if(input.op==='interact')a.interact();
 else if(app.canInput()){if(input.op==='select')app.selectHero(input.actor);else if(input.op==='move'){for(let i=0;i<input.frames;i++){if(app.canInput())engine.move(input.direction,g.HONRO_CORE.STEP);tick();}}else if(input.op==='jump')engine.jump();else if(input.op==='drop')app.drop();else if(input.op==='defend')app.defend();else if(input.op==='fire')engine.fire(input.skill,input.angle,input.power);}
 if(app.engine.b.honroAct4PreviewState?.door?.phase==='fallen'){await capture('fallen');done=true;break;}
}
const b=app.engine.b,terminal={phase:b.phase,round:b.round,active:b.active,heroes:b.units.filter(u=>u.side===0).map(u=>({id:u.id,x:u.x,y:u.y,hp:u.hp,dead:u.dead,moveLeft:u.moveLeft})),enemies:b.units.filter(u=>u.side===1&&!u.dead&&u.hp>0).map(u=>({id:u.id,x:u.x,y:u.y,hp:u.hp})),preview:structuredClone(b.honroAct4PreviewState),modalOpen:app.modal.classList.contains('open'),dialogueActive:!!app.dialogue,dialogueScalars:Object.fromEntries(Object.entries(app.dialogue||{}).filter(([k,v])=>['string','number','boolean'].includes(typeof v)))};
const sourceSHA256AtFinish=createHash('sha256').update(await readFile(file)).digest('hex'),runtimeSHA256AtFinish=await runtimeDigest(),tapeSHA256AtFinish=createHash('sha256').update(await readFile(tapeFile)).digest('hex');
await writeFile(`${out}/manifest.json`,JSON.stringify({sourceSHA256,sourceSHA256AtFinish,runtimeSHA256,runtimeSHA256AtFinish,tapeSHA256,tapeSHA256AtFinish,frames,firstFallenFrame,transitions,outcome:done?'standing-to-fallen':'historical-tape-did-not-reach-fallen',ordinaryInputTape:tapeFile,terminal,visualApproval:false,images:manifest},null,2));
assert.equal(sourceSHA256AtFinish,sourceSHA256);assert.equal(runtimeSHA256AtFinish,runtimeSHA256);assert.equal(tapeSHA256AtFinish,tapeSHA256);
if(!done)throw Error('Ordinary tape did not reach fallen door; terminal diagnostic manifest retained');assert.equal(terminal.preview.door.phase,'fallen');
console.log(JSON.stringify({out,frames,firstFallenFrame,images:manifest.length,visualApproval:false}));
