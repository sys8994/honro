/** Actual production App renderer; ordinary recorded inputs reach door state.
 * DOM/audio are existing adapter doubles. Never an art-approval gate. */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createAppAdapter} from '../stage36-production/app-adapter.mjs';
const [file,out]=process.argv.slice(2);if(!out)throw Error('project output-directory required');
const p=JSON.parse(await readFile(file,'utf8')),tape=JSON.parse(await readFile('art/stage36-vector-production/ordinary-inputs.json','utf8'))[0];
const a=await createAppAdapter(p,'stage-36',{entryBuild:tape.entryBuild}),{app,g}=a;
await mkdir(out,{recursive:true});const manifest=[];
async function capture(state){const keys=['storyFrame','storyTween','goalFocus','editorView','skillPreview','manual','x','y','scale'];const saved=Object.fromEntries(keys.map(k=>[k,app.scene[k]])),size={width:app.scene.canvas.width,height:app.scene.canvas.height,cameraWidth:app.scene._cameraWidth,cameraHeight:app.scene._cameraHeight};Object.assign(app.scene,{storyFrame:null,storyTween:null,goalFocus:null,editorView:true,skillPreview:true});for(const v of p.production.cards['stage-36'].cameraViews){a.camera(v.x,v.y,v.scale);app.scene.canvas.width=v.width;app.scene.canvas.height=v.height;app.scene.render(app.engine,0,'',.6,false,0);const name=`${state}-${v.id}.png`;await writeFile(`${out}/${name}`,app.scene.canvas.toBuffer('image/png'));manifest.push({file:name,state,view:v,actualCamera:{x:app.scene.x,y:app.scene.y,scale:app.scene.scale,width:app.scene.canvas.width,height:app.scene.canvas.height},door:structuredClone(app.engine.b.honroAct4PreviewState?.door),scope:a.scope+' Manual fixed-camera inspection; presentation framing temporarily suspended, no injected battle/event state.'});}Object.assign(app.scene,saved);Object.assign(app.scene.canvas,{width:size.width,height:size.height});app.scene._cameraWidth=size.cameraWidth;app.scene._cameraHeight=size.cameraHeight;}
await capture('standing');let frames=0,done=false;
for(const input of tape.inputs){
 const engine=app.engine;
 const tick=()=>{a.tick();frames++;};
 if(input.op==='advance'){for(let i=0;i<input.frames;i++)tick();}
 else if(input.op==='camera')a.camera(input.x,input.y,input.scale);else if(input.op==='next-dialogue')a.next();else if(input.op==='skip-dialogue')a.skip();else if(input.op==='close-modal')app.close();else if(input.op==='interact')a.interact();
 else if(app.canInput()){if(input.op==='select')app.selectHero(input.actor);else if(input.op==='move'){for(let i=0;i<input.frames;i++){if(app.canInput())engine.move(input.direction,g.HONRO_CORE.STEP);tick();}}else if(input.op==='jump')engine.jump();else if(input.op==='drop')app.drop();else if(input.op==='defend')app.defend();else if(input.op==='fire')engine.fire(input.skill,input.angle,input.power);}
 if(app.engine.b.honroAct4PreviewState?.door?.phase==='fallen'){await capture('fallen');done=true;break;}
}
if(!done)throw Error('Ordinary tape did not reach fallen door');
await writeFile(`${out}/manifest.json`,JSON.stringify({frames,visualApproval:false,images:manifest},null,2));console.log(JSON.stringify({out,frames,images:manifest.length,visualApproval:false}));
