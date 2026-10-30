import vm from 'node:vm';
/** Actual App entry paint, fixed inspection camera; not browser DOM/HUD. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {runtimeDigest} from '../stage31/probes.mjs';
const [file,out,nText]=process.argv.slice(2),hash=x=>createHash('sha256').update(x).digest('hex');
if(!nText){await mkdir(out,{recursive:true});for(let n=31;n<=40;n++)execFileSync(process.execPath,['--expose-gc',import.meta.filename,file,out,String(n)],{stdio:'inherit'});process.exit(0);}
const n=Number(nText),p=JSON.parse(await readFile(file)),projectHash=hash(JSON.stringify(p)),runtime=await runtimeDigest(),adapter=[31,35].includes(n)?'../density-qa/native-entry.mjs':`../stage${n}-production/app-adapter.mjs`,{createAppAdapter}=await import(adapter);
const tape=JSON.parse(await readFile(n===35||n===36?`art/stage${n}-vector-production/ordinary-inputs.json`:`tools/density-qa/tapes/stage${n}.json`))[0];
const a=await createAppAdapter(p,`stage-${n}`,{entryBuild:tape.entryBuild,...(n===40?{preparedProof:'valid'}:{})}),{app,g}=a;
vm.runInContext(await readFile('art/act4-silhouette-v3/sea/authored-far-art-blue-dawn.js','utf8'),g);vm.runInContext(await readFile('art/act4-silhouette-v3/sea/vector-art-body-edge.js','utf8'),g);for(const k of ['_screenWorldCache','_screenBackgroundCache','_screenForegroundCache','_staticWorldCache','_backgroundCache','_domainTiles'])app.scene[k]=null;app.scene.render(app.engine,0,'',.6,false,0);for(let i=0;i<60&&!g.HonroAuthoredFarArt.ready(n,app.engine.b.honroPreviewFar);i++)await new Promise(r=>setTimeout(r,50));
for(let i=0;i<60;i++){if(app.dialogue)a.skip();a.tick({render:false});}
const frames=[];await mkdir(`${out}/${n}`,{recursive:true});
Object.assign(app.scene,{storyFrame:null,storyTween:null,goalFocus:null,editorView:true,skillPreview:true,manual:true});
for(const v of p.production.cards[`stage-${n}`].cameraViews.filter(v=>['normal','mobile','party','detail'].includes(v.id))){app.scene.canvas.width=v.width;app.scene.canvas.height=v.height;Object.assign(app.scene,{x:v.x,y:v.y,scale:v.scale,manual:true});app.scene.render(app.engine,0,'',.6,false,0);const actual={x:app.scene.x,y:app.scene.y,scale:app.scene.scale,width:app.scene.canvas.width,height:app.scene.canvas.height};assert.deepEqual(actual,{x:v.x,y:v.y,scale:v.scale,width:v.width,height:v.height});const name=`${v.id}.png`;await writeFile(`${out}/${n}/${name}`,app.scene.canvas.toBuffer('image/png'));frames.push({file:name,requested:v,actual});}
assert.equal(await runtimeDigest(),runtime);assert.equal(hash(JSON.stringify(JSON.parse(await readFile(file)))),projectHash);
const report={stage:n,projectSHA256:projectHash,runtimeSHA256:runtime,entryBuild:tape.entryBuild,preparedPriorProof:n===40?'valid explicit fixture, not linked campaign':null,sceneScope:a.scope,scope:'Actual App launch plus isolated candidate authored-far-art-blue-dawn.js + vector-art-body-edge.js overrides; NOT shipped runtime.  no actor or event state injected. Fixed inspection camera only. Native Canvas image, DOM/HUD/audio fixtures, no browser/mobile FPS or art approval.',frames};await writeFile(`${out}/${n}/manifest.json`,JSON.stringify(report,null,2));console.log(JSON.stringify({stage:n,images:frames.length,projectHash}));
