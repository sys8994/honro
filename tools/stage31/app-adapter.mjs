/** Production App objective adapter. DOM/audio/frame scheduling are doubles;
 * actual movement, combat, Story transitions and Act4 events are not replaced. */
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {appHarness,plain} from '../../tests/app-regression-helpers.mjs';
export async function createAppAdapter(project,stageId){
 process.env.HONRO_ACT4_RELEASE='1';const h=await appHarness({productionStory:true}),g=h.g,n=project.stages.find(s=>s.id===stageId)?.metadata?.stageId;
 if(n!==31)throw Error('Objective adapter currently supports Stage31 only; other stages remain unverified.');
 g.HONRO_PROJECT=plain(project);g.HonroScene.prototype.landmark=function(){};g.HonroScene.prototype.background=function(){};g.HonroScene.prototype.render=function(){};g.HonroScene.prototype.size=function(){return{w:1440,h:900,d:1};};
 g.HonroScene.prototype.storyRelease=function(camera){Object.assign(this,camera);};g.HonroScene.prototype.minimap=function(){};
 g.HONRO_APP_READY=Promise.resolve();g.HONRO_ACT4_PREVIEW_SEEDS=JSON.parse(await readFile('shared/data/act4/reviewed.json','utf8'));
 const p=h.profileThrough(30);p.lastStage=31;for(const cls of p.recruited)p.heroes[cls].xp=g.HonroProgression.xpAt(g.HonroProgression.plan(31).entryLevel);const app=h.load(p);g.HonroApp=app;
 for(const name of ['interactions','act4-art','act4-maps','act4-coast-maps','act4-coast-art','act4-events','act4-coast-events','act4-campaign'])vm.runInContext(await readFile('shared/runtime/'+name+'.js','utf8'),g);
 app.launch(31);app.close();if(app.engine?.b.honroStage!==31)throw Error('Production App did not launch the declared stage.');
 app.scene.canvas={clientWidth:1440,clientHeight:900,getBoundingClientRect:()=>({left:0,top:0,width:1440,height:900})};
 return{g,app,engine:app.engine,scope:'Prepared stage-entry profile; production App events; DOM/audio are doubles. Not a browser/campaign playthrough.',
  skip(){if(app.dialogue)g.HonroStory.finish(app);else for(const fn of h.listeners.get('keydown')||[])fn({code:'Escape',repeat:false,preventDefault(){},target:{tagName:'BODY'}});},
  tick(){if(!app.dialogue){app.engine.tick(g.HONRO_CORE.STEP);app.checkMission(app.engine);}g.HonroAct4TerrainPreview.observe(app,g.HONRO_CORE.STEP);},
  interact(){return g.HonroAct4TerrainPreview.interact(app);},
  success(){const b=app.engine.b,q=b.honroAct4PreviewState;return !!(b.phase==='won'&&q?.complete&&q.boat?.phase==='boarded');},
  state(){return plain({phase:app.engine.b.phase,objective:app.engine.b.honroAct4PreviewState,units:app.engine.b.units.map(u=>({id:u.id,x:u.x,y:u.y,hp:u.hp,dead:u.dead}))});}
 };
}
