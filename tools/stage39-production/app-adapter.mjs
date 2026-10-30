/** Production App objective adapter. DOM/audio/frame scheduling are doubles;
 * actual movement, combat, Story transitions and Act4 events are not replaced. */
import vm from 'node:vm';
import {createCanvas,clearAllCache,Image as NativeImage,Path2D,DOMMatrix} from '@napi-rs/canvas';
import {runtimeEntries} from '../../shared/build.mjs';
import {readFile} from 'node:fs/promises';
import {appHarness,plain} from '../../tests/app-regression-helpers.mjs';
export async function createAppAdapter(project,stageId,{entryBuild='unspent',renderEvery=300}={}){
 process.env.HONRO_ACT4_RELEASE='1';const h=await appHarness({productionStory:true}),g=h.g,n=project.stages.find(s=>s.id===stageId)?.metadata?.stageId;
 if(n!==39)throw Error('Objective adapter currently supports Stage39 only; other stages remain unverified.');
 let now=0;g.performance={now:()=>now};
 const makeCanvas=(w=1440,h=900)=>{const cv=createCanvas(w,h);Object.defineProperties(cv,{clientWidth:{get:()=>cv.width},clientHeight:{get:()=>cv.height}});cv.getBoundingClientRect=()=>({left:0,top:0,width:cv.width,height:cv.height});cv.parentElement={append(){}};return cv;};
 class Image extends NativeImage{set src(v){super.src=typeof v==='string'&&v.startsWith('data:')?Buffer.from(v.split(',')[1],'base64'):v;}get src(){return super.src;}}
 Object.assign(g,{Image,Path2D,DOMMatrix,devicePixelRatio:1,matchMedia:()=>({matches:false}),navigator:{userAgent:'stage39-native-app'}});
 const get=g.document.getElementById;g.document.getElementById=id=>{const n=get(id);n.replaceChildren??=function(){};return n;};g.document.createTextNode=text=>({textContent:text});
 const create=g.document.createElement;g.document.createElement=tag=>tag==='canvas'?makeCanvas(300,150):create(tag);h.nodes.set('battlecanvas',makeCanvas());
 const entries=await runtimeEntries({vector:true,render:true});let loading=false;for(const row of entries){if(row.name==='shared/runtime/party-rig.js')loading=true;if(loading)vm.runInContext(row.code,g);if(row.name==='shared/runtime/authored-far-art.js')break;}
 g.HONRO_PROJECT=plain(project);g.HonroScene.prototype.minimap=function(){};
 g.HONRO_APP_READY=Promise.resolve();g.HONRO_ACT4_PREVIEW_SEEDS=JSON.parse(await readFile('shared/data/act4/reviewed.json','utf8'));
 const p=h.profileThrough(38);p.lastStage=39;for(const cls of p.recruited)p.heroes[cls].xp=g.HonroProgression.xpAt(g.HonroProgression.plan(39).entryLevel);const training=[];if(entryBuild!=='unspent'&&!['campaign-balanced-v1','campaign-spent-v1'].includes(entryBuild))throw Error('Unknown earned-SP entry build');
 if(['campaign-balanced-v1','campaign-spent-v1'].includes(entryBuild)){const C=g.HONRO_CORE,wanted={archer:['A01','A14','A02','A05'],mage:['M01','M06','M02','M03'],knight:['S00','S01','S06','S04'],occultist:['O01','O02','O03','O06']};
  for(const cls of p.recruited){const hero=p.heroes[cls];for(let i=0;i<(entryBuild==='campaign-spent-v1'?18:6);i++)training.push({cls,type:'stat',accepted:C.investStat(hero,cls)});for(const id of wanted[cls])for(let i=0;i<(entryBuild==='campaign-spent-v1'?5:3);i++)training.push({cls,id,accepted:C.train(hero,id)});if(entryBuild==='campaign-spent-v1')while(C.pointsLeft(hero,cls)>0){if(!C.investStat(hero,cls))break;training.push({cls,type:'remaining-earned-stat',accepted:true});}p.loadouts[cls]=wanted[cls].filter(id=>hero.ranks[id]>0);training.push({cls,earned:C.pointsEarned(hero),spent:C.pointsSpent(hero,cls),left:C.pointsLeft(hero,cls),ranks:plain(hero.ranks)});}
 }const app=h.load(p);g.HonroApp=app;
 for(const name of ['interactions','act4-art','act4-maps','act4-coast-maps','act4-coast-art','act4-events','act4-coast-events','act4-campaign'])vm.runInContext(await readFile('shared/runtime/'+name+'.js','utf8'),g);
 app.launch(39);app.close();if(app.engine?.b.honroStage!==39)throw Error('Production App did not launch the declared stage.');
 let ticks=0;app.scene.manual=false;app.scene.skillPreview=false;
 app.scene.render(app.engine,0,app.selected,app.power,false,0);for(let tries=0;tries<100&&!g.HonroAuthoredFarArt.ready(39,app.engine.b.honroPreviewFar);tries++)await new Promise(r=>setTimeout(r,50));
 return{g,app,engine:app.engine,training,entryBuild,scope:'Prepared earned-SP stage-entry profile; real App/Engine/Native Canvas events and sparse actual scene rendering every300 simulation frames (bounded snapshot evidence, not continuous rendered play); DOM/audio/storage scheduling are doubles, not browser or chapters1–38 playthrough.',
  skip(){if(app.dialogue)g.HonroStory.finish(app);else for(const fn of h.listeners.get('keydown')||[])fn({code:'Escape',repeat:false,preventDefault(){},target:{tagName:'BODY'}});},
  tick(){now+=g.HONRO_CORE.STEP*1000;g.HonroStory.tick(app,now);if(!app.dialogue&&!app.modal.classList.contains('open')&&!g.HonroStory.turnPaused(app,now)){app.engine.tick(g.HONRO_CORE.STEP);app.checkMission(app.engine);}g.HonroAct4TerrainPreview.observe(app,g.HONRO_CORE.STEP);if(++ticks%renderEvery===0){app.scene.render(app.engine,g.HONRO_CORE.STEP*renderEvery,app.selected,app.power,false,g.HONRO_CORE.STEP*renderEvery);if(ticks%120===0){clearAllCache();global.gc?.();}if(process.env.S39_DIAGNOSTICS&&ticks%300===0)console.log('NATIVE',ticks,app.engine.b.phase,Math.round(process.memoryUsage().rss/1048576),app.scene.renderCacheStats());}},
  interact(){return g.HonroAct4TerrainPreview.interact(app);},
  success(){const b=app.engine.b,q=b.honroAct4PreviewState;return !!(b.phase==='won'&&q?.complete);},
  state(){return plain({phase:app.engine.b.phase,objective:app.engine.b.honroAct4PreviewState,units:app.engine.b.units.map(u=>({id:u.id,x:u.x,y:u.y,hp:u.hp,dead:u.dead}))});}
 };
}
