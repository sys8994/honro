/** Production App objective adapter. DOM/audio/frame scheduling are doubles;
 * actual movement, combat, Story transitions and Act4 events are not replaced. */
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {runtimeEntries} from '../../shared/build.mjs';
import {createCanvas,Image as NativeImage,Path2D,DOMMatrix} from '@napi-rs/canvas';
import {appHarness,plain} from '../../tests/app-regression-helpers.mjs';
export async function createAppAdapter(project,stageId,{entryBuild='unspent',width=1440,height=900}={}){
 process.env.HONRO_ACT4_RELEASE='1';const h=await appHarness({productionStory:true}),g=h.g,n=project.stages.find(s=>s.id===stageId)?.metadata?.stageId;
 if(n!==37)throw Error('Objective adapter currently supports Stage37 only; other stages remain unverified.');
 let now=0;g.performance={now:()=>now};
 const nativeCanvas=()=>{const c=createCanvas(width,height);Object.defineProperties(c,{clientWidth:{get:()=>c.width},clientHeight:{get:()=>c.height}});c.getBoundingClientRect=()=>({left:0,top:0,right:c.width,bottom:c.height,width:c.width,height:c.height});c.checkVisibility=()=>true;c.closest=()=>null;return c;};
 class Image extends NativeImage{set src(v){super.src=typeof v==='string'&&v.startsWith('data:')?Buffer.from(v.split(',')[1],'base64'):v;}get src(){return super.src;}}
 Object.assign(g,{innerWidth:width,innerHeight:height,Image,Path2D,DOMMatrix,devicePixelRatio:1,matchMedia:()=>({matches:false}),navigator:{userAgent:'stage37-native-app'}});
 const create=g.document.createElement,get=g.document.getElementById;
 g.document.createElement=tag=>tag==='canvas'?nativeCanvas():create(tag);
 g.document.createTextNode=text=>({textContent:text});
 g.document.getElementById=id=>{if(id==='battlecanvas'){if(!h.nodes.has(id))h.nodes.set(id,nativeCanvas());return h.nodes.get(id);}const node=get(id);if(id==='story-line'){const html=get('dialogue-root').innerHTML||'';const match=html.match(/<p id="story-line"[^>]*>([\s\S]*?)<\/p>/);node.textContent=match?match[1].replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'"):'';}return node;};
 const baseNames=new Set((await runtimeEntries({vector:false,render:false,productionStory:true})).map(v=>v.name));
 for(const part of await runtimeEntries({vector:true,render:true,productionStory:true}))if(!baseNames.has(part.name))vm.runInContext(part.code,g);
 g.HONRO_PROJECT=plain(project);
 g.HONRO_APP_READY=Promise.resolve();g.HONRO_ACT4_PREVIEW_SEEDS=JSON.parse(await readFile('shared/data/act4/reviewed.json','utf8'));
 const p=h.profileThrough(36);p.lastStage=37;for(const cls of p.recruited)p.heroes[cls].xp=g.HonroProgression.xpAt(g.HonroProgression.plan(37).entryLevel);const training=[];if(entryBuild!=='unspent'&&!['campaign-balanced-v1','campaign-spent-v1'].includes(entryBuild))throw Error('Unknown earned-SP entry build');
 if(['campaign-balanced-v1','campaign-spent-v1'].includes(entryBuild)){const C=g.HONRO_CORE,wanted={archer:['A01','A14','A02','A05'],mage:['M01','M06','M02','M03'],knight:['S00','S01','S06','S04'],occultist:['O01','O02','O03','O06']};
  for(const cls of p.recruited){const hero=p.heroes[cls];for(let i=0;i<(entryBuild==='campaign-spent-v1'?18:6);i++)training.push({cls,type:'stat',accepted:C.investStat(hero,cls)});for(const id of wanted[cls])for(let i=0;i<(entryBuild==='campaign-spent-v1'?5:3);i++)training.push({cls,id,accepted:C.train(hero,id)});if(entryBuild==='campaign-spent-v1')while(C.pointsLeft(hero,cls)>0){if(!C.investStat(hero,cls))break;training.push({cls,type:'remaining-earned-stat',accepted:true});}p.loadouts[cls]=wanted[cls].filter(id=>hero.ranks[id]>0);training.push({cls,earned:C.pointsEarned(hero),spent:C.pointsSpent(hero,cls),left:C.pointsLeft(hero,cls),ranks:plain(hero.ranks)});}
 }const app=h.load(p);g.HonroApp=app;const query=app.root.querySelector.bind(app.root);app.root.querySelector=selector=>{const n=query(selector);if(n&&!n.getBoundingClientRect)n.getBoundingClientRect=()=>({left:0,top:0,right:0,bottom:0,width:0,height:0});return n;};
 for(const name of ['interactions','act4-art','act4-maps','act4-coast-maps','act4-coast-art','act4-events','act4-coast-events','act4-campaign'])vm.runInContext(await readFile('shared/runtime/'+name+'.js','utf8'),g);
 app.launch(37);app.close();if(app.engine?.b.honroStage!==37)throw Error('Production App did not launch the declared stage.');
 // Load the stage-authored far image before replay; no inspector-only far override.
 app.scene.render(app.engine,0,'',.6,false,0);for(let i=0;i<60&&!g.HonroAuthoredFarArt.ready(37,app.engine.b.honroPreviewFar);i++)await new Promise(r=>setTimeout(r,50));

 let renderTick=0;
 return{g,app,engine:app.engine,training,entryBuild,scope:'Prepared stage-entry profile; production App events; Native Canvas Scene initializes authored far art, then renders every60 physics ticks after combat until actual signal/gesture receipts complete; raster caches explicitly disposed for bounded native-harness memory; DOM/audio are doubles, story text parsed from real rendered HTML. Not a browser/campaign playthrough.',
  skip(){if(app.dialogue)g.HonroStory.next(app);else for(const fn of h.listeners.get('keydown')||[])fn({code:'Escape',repeat:false,preventDefault(){},target:{tagName:'BODY'}});},
  tick(){now+=g.HONRO_CORE.STEP*1000;g.HonroStory.tick(app,now);if(!app.dialogue&&!app.modal.classList.contains('open')&&!g.HonroStory.turnPaused(app,now)){app.engine.tick(g.HONRO_CORE.STEP);app.checkMission(app.engine);}g.HonroAct4TerrainPreview.observe(app,g.HONRO_CORE.STEP);if(++renderTick%60===0&&app.engine.b.honroAct4PreviewState?.observed?.signal===undefined&&!app.engine.b.units.some(u=>u.side===1&&!u.dead&&u.hp>0)){app.scene.render(app.engine,g.HONRO_CORE.STEP*60,'',.6,false,0);for(const key of ['_screenWorldCache','_screenBackgroundCache','_screenForegroundCache','_staticWorldCache','_backgroundCache']){const old=app.scene[key];if(old?.canvas){old.canvas.width=1;old.canvas.height=1;}app.scene[key]=null;}for(const t of app.scene._domainTiles?.tiles?.values()||[]){t.canvas.width=1;t.canvas.height=1;}app.scene._domainTiles=null;}if(renderTick%120===0)globalThis.gc?.();},
  interact(){return g.HonroAct4TerrainPreview.interact(app);},
  success(){const b=app.engine.b,q=b.honroAct4PreviewState;return !!(b.phase==='won'&&q?.complete);},
  state(){return plain({phase:app.engine.b.phase,objective:app.engine.b.honroAct4PreviewState,units:app.engine.b.units.map(u=>({id:u.id,x:u.x,y:u.y,hp:u.hp,dead:u.dead}))});}
 };
}
