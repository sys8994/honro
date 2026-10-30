/** Production App objective adapter. DOM/audio/frame scheduling are doubles;
 * actual movement, combat, Story transitions and Act4 events are not replaced. */
import vm from 'node:vm';
import{mkdirSync,writeFileSync}from'node:fs';
import{createCanvas,Image as NativeImage,Path2D,DOMMatrix}from'@napi-rs/canvas';
import{runtimeEntries}from'../../shared/build.mjs';
import {readFile} from 'node:fs/promises';
import {appHarness,plain} from '../../tests/app-regression-helpers.mjs';
export async function createAppAdapter(project,stageId,{entryBuild='unspent',captureDir=null}={}){
 process.env.HONRO_ACT4_RELEASE='1';const h=await appHarness({productionStory:true}),g=h.g,n=project.stages.find(s=>s.id===stageId)?.metadata?.stageId;
 if(n!==36)throw Error('Objective adapter currently supports Stage36 only; other stages remain unverified.');
 let now=0;g.performance={now:()=>now};
 function canvas(w=1440,h=900){const c=createCanvas(w,h);Object.defineProperties(c,{clientWidth:{get:()=>c.width},clientHeight:{get:()=>c.height}});c.getBoundingClientRect=()=>({left:0,top:0,width:c.width,height:c.height});return c;}
 class Image extends NativeImage{set src(v){super.src=typeof v==='string'&&v.startsWith('data:')?Buffer.from(v.split(',')[1],'base64'):v;}get src(){return super.src;}}
 Object.assign(g,{Image,Path2D,DOMMatrix,devicePixelRatio:1,matchMedia:()=>({matches:false}),navigator:{userAgent:'production-native-app'}});
 const create=g.document.createElement;g.document.createElement=(tag)=>tag==='canvas'?canvas(300,150):create(tag);
 const get=g.document.getElementById;g.document.getElementById=id=>{if(id==='battlecanvas'){if(!h.nodes.has(id))h.nodes.set(id,canvas());return h.nodes.get(id);}return get(id);};
 // DOM parses the actual Story-produced markup; receipts are never assigned directly.
 Object.defineProperty(get('story-line'),'textContent',{get(){const html=get('dialogue-root').innerHTML;return (html.match(/id="story-line"[^>]*>([\s\S]*?)<\/p>/)?.[1]||'').replace(/<[^>]+>/g,'').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&#39;/g,"'").replace(/&quot;/g,'"');}});
 const entries=await runtimeEntries({vector:true,render:true});const start=entries.findIndex(e=>e.name==='shared/runtime/party-rig.js');for(const entry of entries.slice(start))vm.runInContext(entry.code,g);
 g.HONRO_PROJECT=plain(project);g.HonroScene.prototype.minimap=function(){};
 g.HONRO_APP_READY=Promise.resolve();g.HONRO_ACT4_PREVIEW_SEEDS=JSON.parse(await readFile('shared/data/act4/reviewed.json','utf8'));
 const p=h.profileThrough(35);p.lastStage=36;for(const cls of p.recruited)p.heroes[cls].xp=g.HonroProgression.xpAt(g.HonroProgression.plan(36).entryLevel);const training=[];if(entryBuild!=='unspent'&&!['campaign-balanced-v1','campaign-spent-v1'].includes(entryBuild))throw Error('Unknown earned-SP entry build');
 if(['campaign-balanced-v1','campaign-spent-v1'].includes(entryBuild)){const C=g.HONRO_CORE,wanted={archer:['A01','A14','A02','A05'],mage:['M01','M06','M02','M03'],knight:['S00','S01','S06','S04'],occultist:['O01','O02','O03','O06']};
  for(const cls of p.recruited){const hero=p.heroes[cls];for(let i=0;i<(entryBuild==='campaign-spent-v1'?18:6);i++)training.push({cls,type:'stat',accepted:C.investStat(hero,cls)});for(const id of wanted[cls])for(let i=0;i<(entryBuild==='campaign-spent-v1'?5:3);i++)training.push({cls,id,accepted:C.train(hero,id)});if(entryBuild==='campaign-spent-v1')while(C.pointsLeft(hero,cls)>0){if(!C.investStat(hero,cls))break;training.push({cls,type:'remaining-earned-stat',accepted:true});}p.loadouts[cls]=wanted[cls].filter(id=>hero.ranks[id]>0);training.push({cls,earned:C.pointsEarned(hero),spent:C.pointsSpent(hero,cls),left:C.pointsLeft(hero,cls),ranks:plain(hero.ranks)});}
 }const app=h.load(p);g.HonroApp=app;
 for(const name of ['interactions','act4-art','act4-maps','act4-coast-maps','act4-coast-art','act4-events','act4-coast-events','act4-campaign'])vm.runInContext(await readFile('shared/runtime/'+name+'.js','utf8'),g);
 app.launch(36);app.close();if(app.engine?.b.honroStage!==36)throw Error('Production App did not launch the declared stage.');
 let frames=0,lastRenderFrame=0;const renders=[],captured=new Set();if(captureDir)mkdirSync(captureDir,{recursive:true});
 // Demand-decode the actual stage far painting before timed input; this changes no battle state.
 app.scene.render(app.engine,0,'',.6,false,0);for(let i=0;i<60&&!g.HonroAuthoredFarArt.ready(36,app.engine.b.honroPreviewFar);i++)await new Promise(resolve=>setTimeout(resolve,50));if(!g.HonroAuthoredFarArt.ready(36,app.engine.b.honroPreviewFar))throw Error('Stage36 far painting not decoded');
 return{g,app,engine:app.engine,training,entryBuild,renders,
  next(){g.HonroStory.next(app);},
  camera(x,y,scale=.6){Object.assign(app.scene,{x,y,scale,manual:true,storyTween:null,cinematic:null});},scope:'Prepared stage-entry profile; production App events; DOM/audio are doubles. Not a browser/campaign playthrough.',
  skip(){if(app.dialogue)g.HonroStory.finish(app);else for(const fn of h.listeners.get('keydown')||[])fn({code:'Escape',repeat:false,preventDefault(){},target:{tagName:'BODY'}});},
  tick(){if(!app.scene.canvas)app.scene.canvas={clientWidth:1440,clientHeight:900,getBoundingClientRect:()=>({left:0,top:0,width:1440,height:900})};now+=g.HONRO_CORE.STEP*1000;g.HonroStory.tick(app,now);if(!app.dialogue&&!app.modal.classList.contains('open')&&!g.HonroStory.turnPaused(app,now)){app.engine.tick(g.HONRO_CORE.STEP);app.checkMission(app.engine);}g.HonroAct4TerrainPreview.observe(app,g.HONRO_CORE.STEP);frames++;const q=app.engine.b.honroAct4PreviewState;if(q?.door&&q.door.phase!=='standing'&&q.door.renderedAt===undefined&&frames%30===0){const renderDt=(frames-lastRenderFrame)*g.HONRO_CORE.STEP;app.scene.render(app.engine,renderDt,'',.6,false,renderDt);lastRenderFrame=frames;const tag=q.door.phase==='fallen'?'fallen':q.door.time>.45?'falling-mid':'falling-start';if(captureDir&&!captured.has(tag)){writeFileSync(captureDir+'/'+tag+'.png',app.scene.canvas.toBuffer('image/png'));captured.add(tag);}renders.push({frame:frames,phase:q.door.phase,renderedAt:q.door.renderedAt,camera:{x:app.scene.x,y:app.scene.y,scale:app.scene.scale}});}},
  interact(){return g.HonroAct4TerrainPreview.interact(app);},
  success(){const b=app.engine.b,q=b.honroAct4PreviewState;return !!(b.phase==='won'&&q?.complete);},
  state(){return plain({phase:app.engine.b.phase,objective:app.engine.b.honroAct4PreviewState,units:app.engine.b.units.map(u=>({id:u.id,x:u.x,y:u.y,hp:u.hp,dead:u.dead}))});}
 };
}
