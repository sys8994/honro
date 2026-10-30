import assert from'node:assert/strict';
import{officialWorldIdentity}from'./official-world-identity.mjs';
/** Production App objective adapter. DOM/audio/frame scheduling are doubles;
 * actual movement, combat, Story transitions and Act4 events are not replaced. */
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {runtimeEntries} from '../../shared/build.mjs';
import {createCanvas,Image as NativeImage,Path2D,DOMMatrix} from '@napi-rs/canvas';
import {appHarness,plain} from '../../tests/app-regression-helpers.mjs';
export async function createAppAdapter(project,stageId,{entryBuild='campaign-balanced-v1',savedStorage=null}={}){
 process.env.HONRO_ACT4_RELEASE='1';const h=await appHarness({productionStory:true}),g=h.g,n=project.stages.find(s=>s.id===stageId)?.metadata?.stageId;
 if(!(n>=31&&n<=40))throw Error('Linked Act4 adapter supports31–40 only.');
 if(!savedStorage&&n!==31)throw Error('Only31 may receive a prepared entry profile; later stages require actual previous storage.');
 let now=0,pendingRenderSeconds=0;g.performance={now:()=>now};
 const nativeCanvas=()=>{const c=createCanvas(1440,900);Object.defineProperties(c,{clientWidth:{get:()=>c.width},clientHeight:{get:()=>c.height}});c.getBoundingClientRect=()=>({left:0,top:0,width:c.width,height:c.height});c.checkVisibility=()=>true;c.closest=()=>null;return c;};
 class Image extends NativeImage{set src(v){super.src=typeof v==='string'&&v.startsWith('data:')?Buffer.from(v.split(',')[1],'base64'):v;}get src(){return super.src;}}
 Object.assign(g,{Image,Path2D,DOMMatrix,devicePixelRatio:1,matchMedia:()=>({matches:false}),navigator:{userAgent:'stage31-native-app'}});
 const create=g.document.createElement,get=g.document.getElementById;
 g.document.createElement=tag=>tag==='canvas'?nativeCanvas():create(tag);
 g.document.createTextNode=text=>({textContent:text});
 g.document.getElementById=id=>{if(id==='battlecanvas'){if(!h.nodes.has(id))h.nodes.set(id,nativeCanvas());return h.nodes.get(id);}const node=get(id);node.replaceChildren??=function(...children){this.children=[...children];this.textContent=children.map(c=>c.textContent||'').join('');};if(id==='story-line'){const html=get('dialogue-root').innerHTML||'';const match=html.match(/<p id="story-line"[^>]*>([\s\S]*?)<\/p>/);node.textContent=match?match[1].replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'"):'';}return node;};
 const baseNames=new Set((await runtimeEntries({vector:false,render:false,productionStory:true})).map(v=>v.name));
 for(const part of await runtimeEntries({vector:true,render:true,productionStory:true}))if(!baseNames.has(part.name))vm.runInContext(part.code,g);
 const officialIdentity=await officialWorldIdentity(project,g.HONRO_PROJECT);
 g.HONRO_APP_READY=Promise.resolve();g.HONRO_ACT4_PREVIEW_SEEDS=JSON.parse(await readFile('shared/data/act4/reviewed.json','utf8'));
 const p=savedStorage?JSON.parse(savedStorage['honro-first-act-profile-1']):h.profileThrough(30);if(!savedStorage){p.lastStage=31;for(const cls of p.recruited)p.heroes[cls].xp=g.HonroProgression.xpAt(g.HonroProgression.plan(31).entryLevel);}const training=[];if(entryBuild!=='unspent'&&!['campaign-balanced-v1','campaign-spent-v1'].includes(entryBuild))throw Error('Unknown earned-SP entry build');
 if(!savedStorage&&['campaign-balanced-v1','campaign-spent-v1'].includes(entryBuild)){const C=g.HONRO_CORE,wanted={archer:['A01','A14','A02','A05'],mage:['M01','M06','M02','M03'],knight:['S00','S01','S06','S04'],occultist:['O01','O02','O03','O06']};
  for(const cls of p.recruited){const hero=p.heroes[cls];for(let i=0;i<(entryBuild==='campaign-spent-v1'?18:6);i++)training.push({cls,type:'stat',accepted:C.investStat(hero,cls)});for(const id of wanted[cls])for(let i=0;i<(entryBuild==='campaign-spent-v1'?5:3);i++)training.push({cls,id,accepted:C.train(hero,id)});if(entryBuild==='campaign-spent-v1')while(C.pointsLeft(hero,cls)>0){if(!C.investStat(hero,cls))break;training.push({cls,type:'remaining-earned-stat',accepted:true});}p.loadouts[cls]=wanted[cls].filter(id=>hero.ranks[id]>0);training.push({cls,earned:C.pointsEarned(hero),spent:C.pointsSpent(hero,cls),left:C.pointsLeft(hero,cls),ranks:plain(hero.ranks)});}
 }if(savedStorage)for(const[k,v]of Object.entries(savedStorage))h.storage.set(k,v);const app=savedStorage?h.reload():h.load(p);g.HonroApp=app;const query=app.root.querySelector.bind(app.root);app.root.querySelector=selector=>{const n=query(selector);if(n&&!n.getBoundingClientRect)n.getBoundingClientRect=()=>({left:0,top:0,right:0,bottom:0,width:0,height:0});return n;};
 for(const name of ['interactions','act4-art','act4-maps','act4-coast-maps','act4-coast-art','act4-events','act4-coast-events','act4-campaign'])vm.runInContext(await readFile('shared/runtime/'+name+'.js','utf8'),g);
 if(savedStorage){if(!app.profile.honroBattle)throw Error('Cold boundary requires actual next-stage battle save');app.continue();}else app.launch(31);app.close();if(app.engine?.b.honroStage!==n)throw Error('Production App did not launch the declared stage.');
 const coldEntryState=JSON.parse(JSON.stringify({units:app.engine.b.units,objective:app.engine.b.honroAct4PreviewState,round:app.engine.b.round,active:app.engine.b.active,phase:app.engine.b.phase,terrain:app.engine.b.terrain}));
 // Load the stage-authored far image before replay; no inspector-only far override.
 app.scene.render(app.engine,0,'',.6,false,0);for(let i=0;i<60&&!g.HonroAuthoredFarArt.ready(n,app.engine.b.honroPreviewFar);i++)await new Promise(r=>setTimeout(r,50));

 assert(g.HonroAct4Content.active(app.engine.b),'Official Act4 campaign marker required');
 assert(!app.customMap&&!app.debugMode&&!app.training&&!app.engine.b.honroCustom,'Linked run must remain official campaign, never custom/imported/training/debug');
 return {g,app,coldEntryState,officialIdentity,training,entryBuild,storage:h.storage,finishDialogue:()=>h.finish(app),
 next(){g.HonroStory.next(app);},
 skip(){if(app.dialogue)g.HonroStory.finish(app);else for(const fn of h.listeners.get('keydown')||[])fn({code:'Escape',repeat:false,preventDefault(){},target:{tagName:'BODY'}});},
 tick({render=true}={}){now+=g.HONRO_CORE.STEP*1000;g.HonroStory.tick(app,now);const paused=!!(app.dialogue||app.modal.classList.contains('open')||g.HonroStory.turnPaused(app,now));if(!paused){app.engine.tick(g.HONRO_CORE.STEP);app.checkMission(app.engine);}g.HonroAct4TerrainPreview.observe(app,g.HONRO_CORE.STEP);if(!paused)pendingRenderSeconds+=g.HONRO_CORE.STEP;if(render){app.renderBattleFrame(app.engine,paused?0:pendingRenderSeconds,paused?0:pendingRenderSeconds,paused);pendingRenderSeconds=0;}},
 interact(){return g.HonroAct4TerrainPreview.interact(app);},
 scope:"Linked Act4 actual App entry. Prepared profile only for31; every later entry cold-loads exact previous storage with no XP/flags reset. Native Canvas Scene with accumulated unpaused presentation time between sparse paints. DOM/audio/scheduling fixtures; ordinary-input ticks with actual Scene rendering, not continuous camera-history evidence. No actor/event injection. Native evidence only, not browser or automatic gameplay approval."};
}
