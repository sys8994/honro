/** Native renderer fixtures only. No physical/event overrides are used as play evidence. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {createCanvas} from '@napi-rs/canvas';
import {createAppAdapter} from '../stage40-production/app-adapter.mjs';
const reference=process.argv[2]||'e6d6b07',out='_local/reports/stage31-production/arrival-boat-hook';
const p=JSON.parse(await readFile('art/stage40-vector-production/official-project.json')),world=JSON.parse(await readFile('shared/data/act4/world.json'));
p.stages.push(world.stages.find(s=>s.metadata.stageId===31));
const oldSource=execFileSync('git',['show',reference+':shared/runtime/act4-events.js'],{encoding:'utf8'});
const before=await createAppAdapter(p,'stage-40',{eventsSource:oldSource}),after=await createAppAdapter(p,'stage-40');
const clone=x=>JSON.parse(JSON.stringify(x)),rows=[],sha=x=>createHash('sha256').update(x).digest('hex');
await mkdir(out,{recursive:true});
const pixels=cv=>Buffer.from(cv.getContext('2d').getImageData(0,0,cv.width,cv.height).data);
async function shot(a,n){const {app,g}=a;if(app.engine.b.honroStage!==n){app.stopBattle();app.launch(n);app.close();}const s=app.scene;Object.assign(s,{x:n===31?500:3100,y:1800,scale:.6,manual:true,time:2,editorView:true,skillPreview:true});s.render(app.engine,0,'',.6,false,0);for(let i=0;i<100&&!g.HonroAuthoredFarArt.ready(n,app.engine.b.honroPreviewFar);i++)await new Promise(r=>setTimeout(r,20));s.render(app.engine,0,'',.6,false,0);return s.canvas;}
for(const n of [31,40]){const x=await shot(before,n),y=await shot(after,n);assert(pixels(x).equals(pixels(y)));assert(x.toBuffer('image/png').equals(y.toBuffer('image/png')));rows.push({check:'no-opt-in-full-native-scene',stage:n,pngByteIdentical:true,sha256:sha(pixels(y))});}
await shot(after,31);const {g,app}=after,b=app.engine.b,s=app.scene,original=b.honroAct4PreviewDynamic.find(l=>l.asset.id==='a4:boat');assert(original);
const ferry=JSON.parse(await readFile('art/stage40-vector-production/boat-asset.json'));ferry.id='fixture:arrival-ferry';ferry.vector.root={tag:'g',transform:[1,0,0,1,0,10],children:[ferry.vector.root]};ferry.vector.viewBox[1]+=10;ferry.bounds.y+=10;ferry.reference.bounds.y+=10;g.HONRO_PROJECT.library.push(ferry);
const fallback=pixels(await shot(after,31));for(const [id,a] of [['fixture:missing',null],['fixture:colliding',{...ferry,id:'fixture:colliding',collision:[{x:0,y:0,w:1,h:1}]}],['fixture:nonvector',{...ferry,id:'fixture:nonvector',vector:null}]]){if(a)g.HONRO_PROJECT.library.push(a);b.honroMap.vectorArrivalBoatAssetId=id;assert(pixels(await shot(after,31)).equals(fallback));rows.push({check:'invalid-opt-in-fallback',id,pixelIdentical:true});}
b.honroMap.vectorArrivalBoatAssetId=ferry.id;
for(const pose of [{name:'waiting',x:500,y:1735,scale:.6},{name:'approach',x:6185,y:1822.5,scale:.8},{name:'docked',x:6470,y:1910,scale:1}]){
 if(pose.name==='docked')assert.equal(pose.y-50*pose.scale,1860);
 const l={...original,...pose},snapshot=JSON.stringify({b,l,library:g.HONRO_PROJECT.library});
 const cv=createCanvas(800,400),c=cv.getContext('2d');c.translate(400-pose.x,220-pose.y);const transform=c.getTransform();s.battle=b;s.landmark(c,l);
 assert.equal(JSON.stringify({b,l,library:g.HONRO_PROJECT.library}),snapshot);assert.deepEqual(c.getTransform(),transform);assert.equal(original.asset.id,'a4:boat');
 const expected=createCanvas(800,400),ec=expected.getContext('2d');ec.translate(400-pose.x,220-pose.y);before.app.scene.battle=clone(b);before.app.scene.landmark(ec,{...l,asset:ferry});assert(pixels(cv).equals(pixels(expected)));
 await writeFile(`${out}/${pose.name}.png`,cv.toBuffer('image/png'));rows.push({check:'selected-actual-ferry-exact-painter',pose,pixelIdenticalToDirectAsset:true,dataUnchanged:true,paintDeckY:pose.y-50*pose.scale,collisionDeckY:pose.name==='docked'?1860:null});
}
const docked={...original,x:6470,y:1910,scale:1};Object.assign(original,docked);const prior=JSON.stringify(b);Object.assign(s,{x:6440,y:1900,scale:1,manual:true,editorView:true,skillPreview:true,storyTween:null,storyFrame:null,goalFocus:null,cinematic:null,_backgroundCache:null,_staticWorldCache:null});s.render(app.engine,0,'',.6,false,0);assert.equal(s.x,6440,'Native dock camera retained');assert.equal(JSON.stringify(b),prior);await writeFile(out+'/docked-shore-native.png',s.canvas.toBuffer('image/png'));rows.push({check:'docked-shore-renderer-fixture',scope:'Direct boat pose on real native shore; not arrival event or boarding proof',paintDeckY:1860,physicalDeckY:1860});
await shot(after,40);const other=after.app.engine.b;other.honroMap.vectorArrivalBoatAssetId=ferry.id;assert(pixels(await shot(after,40)).equals(pixels(await shot(before,40))));rows.push({check:'Stage40-ignores-arrival-option',pixelIdentical:true});
await writeFile(out+'/result.json',JSON.stringify({reference,scope:'Native production full-scene parity and isolated actual-asset paint poses. Not browser or campaign-clear evidence. Actual40 hull is translated+10localY only in the scoped31 paint fixture; dock painted deck and unchanged physical contact are1860. Foot/anchor remain0.',pass:true,rows},null,2));console.log('PASS',rows.length,'native arrival boat checks');
