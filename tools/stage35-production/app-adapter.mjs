/** Production App objective adapter. DOM/audio/frame scheduling are doubles;
 * actual movement, combat, Story transitions and Act4 events are not replaced. */
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {appHarness,plain} from '../../tests/app-regression-helpers.mjs';
export async function createAppAdapter(project,stageId,{entryBuild='unspent'}={}){
 process.env.HONRO_ACT4_RELEASE='1';const h=await appHarness({productionStory:true}),g=h.g,n=project.stages.find(s=>s.id===stageId)?.metadata?.stageId;
 if(n!==35)throw Error('Objective adapter currently supports Stage35 only; other stages remain unverified.');
 let now=0;g.performance={now:()=>now};
 g.HONRO_PROJECT=plain(project);g.HonroScene.prototype.landmark=function(){};g.HonroScene.prototype.background=function(){};g.HonroScene.prototype.render=function(){};g.HonroScene.prototype.size=function(){return{w:1440,h:900,d:1};};
 g.HonroScene.prototype.storyRelease=function(camera){Object.assign(this,camera);};g.HonroScene.prototype.minimap=function(){};
 g.HONRO_APP_READY=Promise.resolve();g.HONRO_ACT4_PREVIEW_SEEDS=JSON.parse(await readFile('shared/data/act4/reviewed.json','utf8'));
 const p=h.profileThrough(34);p.lastStage=35;for(const cls of p.recruited)p.heroes[cls].xp=g.HonroProgression.xpAt(g.HonroProgression.plan(35).entryLevel);const training=[];if(entryBuild!=='unspent'&&!['campaign-balanced-v1','campaign-spent-v1'].includes(entryBuild))throw Error('Unknown earned-SP entry build');
 if(['campaign-balanced-v1','campaign-spent-v1'].includes(entryBuild)){const C=g.HONRO_CORE,wanted={archer:['A01','A14','A02','A05'],mage:['M01','M06','M02','M03'],knight:['S00','S01','S06','S04'],occultist:['O01','O02','O03','O06']};
  for(const cls of p.recruited){const hero=p.heroes[cls];for(let i=0;i<(entryBuild==='campaign-spent-v1'?18:6);i++)training.push({cls,type:'stat',accepted:C.investStat(hero,cls)});for(const id of wanted[cls])for(let i=0;i<(entryBuild==='campaign-spent-v1'?5:3);i++)training.push({cls,id,accepted:C.train(hero,id)});if(entryBuild==='campaign-spent-v1')while(C.pointsLeft(hero,cls)>0){if(!C.investStat(hero,cls))break;training.push({cls,type:'remaining-earned-stat',accepted:true});}p.loadouts[cls]=wanted[cls].filter(id=>hero.ranks[id]>0);training.push({cls,earned:C.pointsEarned(hero),spent:C.pointsSpent(hero,cls),left:C.pointsLeft(hero,cls),ranks:plain(hero.ranks)});}
 }const app=h.load(p);g.HonroApp=app;
 for(const name of ['interactions','act4-art','act4-maps','act4-coast-maps','act4-coast-art','act4-events','act4-coast-events','act4-campaign'])vm.runInContext(await readFile('shared/runtime/'+name+'.js','utf8'),g);
 app.launch(35);app.close();if(app.engine?.b.honroStage!==35)throw Error('Production App did not launch the declared stage.');
 app.scene.canvas={clientWidth:1440,clientHeight:900,getBoundingClientRect:()=>({left:0,top:0,width:1440,height:900})};
 return{g,app,engine:app.engine,training,entryBuild,scope:'Prepared stage-entry profile; production App events; DOM/audio are doubles. Not a browser/campaign playthrough.',
  skip(){if(app.dialogue)g.HonroStory.finish(app);else for(const fn of h.listeners.get('keydown')||[])fn({code:'Escape',repeat:false,preventDefault(){},target:{tagName:'BODY'}});},
  tick(){if(!app.scene.canvas)app.scene.canvas={clientWidth:1440,clientHeight:900,getBoundingClientRect:()=>({left:0,top:0,width:1440,height:900})};now+=g.HONRO_CORE.STEP*1000;g.HonroStory.tick(app,now);if(!app.dialogue&&!app.modal.classList.contains('open')&&!g.HonroStory.turnPaused(app,now)){app.engine.tick(g.HONRO_CORE.STEP);app.checkMission(app.engine);}g.HonroAct4TerrainPreview.observe(app,g.HONRO_CORE.STEP);},
  interact(){return g.HonroAct4TerrainPreview.interact(app);},
  success(){const b=app.engine.b,q=b.honroAct4PreviewState;return !!(b.phase==='won'&&q?.complete);},
  state(){return plain({phase:app.engine.b.phase,objective:app.engine.b.honroAct4PreviewState,units:app.engine.b.units.map(u=>({id:u.id,x:u.x,y:u.y,hp:u.hp,dead:u.dead}))});}
 };
}
