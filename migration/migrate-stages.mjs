import vm from 'node:vm';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {fileURLToPath,pathToFileURL} from 'node:url';
import path from 'node:path';
import {buildCore} from '../game/engine/build.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>readFile(path.join(root,p),'utf8');
export async function legacyRuntime(){
 const g=vm.createContext({console,performance,structuredClone});vm.runInContext(await buildCore(),g);
 // Reproduce the historical map import with its historical loadouts. The active
 // runtime migrates these IDs when instantiating units; authored geometry stays frozen.
 vm.runInContext(`{
  const C=HONRO_CORE;
  for(const s of Object.values(C.SKILLS))if(s.legacyId){const {legacyId,enemyOnly,...old}=s;C.SKILLS[legacyId]={...old,id:legacyId};}
  const defaults=C.defaults;
  C.defaults=()=>{const p=defaults();for(const [cls,second] of [['archer','A05'],['mage','M03']]){p.heroes[cls].ranks[second]=1;p.loadouts[cls]=[C.baseSkill(cls),second];}p.heroes.knight.ranks={S01:1,S09:1};p.loadouts.knight=['S01','S09'];for(const h of Object.values(p.heroes)){delete h.skillRevision;delete h.martialRevision;}return p;};
 }`,g);
 g.HONRO_BALANCE=JSON.parse(await read('game/config/balance.json'));
 for(const f of ['content','terrain-space','map-engine','battlefield-layouts','progression','encounters'])vm.runInContext(await read(`shared/runtime/${f}.js`),g);
 for(const f of ['rc21-stage-maps','rc21-world'])vm.runInContext(await read(`migration/legacy/${f}.js`),g);
 for(const f of ['difficulty','allies','mission','stage-rules','objectives','combat-status'])vm.runInContext(await read(`shared/runtime/${f}.js`),g);
 for(const f of ['environment','schema','units'])vm.runInContext(await read(`shared/map/${f}.js`),g);
 return g;
}
export async function migrate(){
 const g=await legacyRuntime(),stages=[],clone=x=>JSON.parse(JSON.stringify(x));
 for(const st of g.HONRO_CONTENT.stages){
  const p=g.HONRO_CORE.defaults();p.recruited=g.HonroStageRules.stageParty(st.id);
  for(const cls of p.recruited)p.heroes[cls].xp=g.HonroProgression.xpAt(g.HonroProgression.plan(st.id).entryLevel);
  const b=g.HonroWorld.build(st,p,false,'archer','A01'),s=g.HonroMaps.emptyStage(`stage-${st.id}`,st.name,st.w,st.h);
  s.metadata={stageId:st.id,campaign:true,source:'HONRO RC21',mapRevision:20};s.backdrop=st.theme;
  s.environment={preset:g.HonroEnvironment.SCENE_PRESETS[s.backdrop],placements:g.HonroEnvironment.makePlacements({...s,environment:null})};
  s.terrains=b.terrain.map(t=>{
   const {vertices,x,y,w,h,id,mat,oneWay,indestructible,...properties}=clone(t);
   return{id,name:id,type:'solid',points:vertices,baseMaterial:mat,oneWay:!!oneWay,breakable:!indestructible,properties,layer:'terrain',detail:{spacing:18,roughness:0,seed:1,optimizeEpsilon:0}};
  });
  s.materials=b.honroSurfaceZones.map(m=>({...clone(m),terrainId:m.support}));
  s.elements=b.honroLandmarks.map((l,i)=>({...clone(l),id:l.id||`landmark-scatter-${i}`,assetId:'builtin:'+l.kind,scale:l.size??1,rotation:0,snap:false,layer:l.layer||'back'}));
  s.units=b.units.map(u=>{const data=clone(u);delete data.critChance;delete data.critMultiplier;return({...data,kind:g.HonroUnits.kindOf(u),team:u.side===0?'player':u.side===1?'enemy':u.honroCivilian?'npc':'ally',runtimeTemplate:true});});
  s.events=clone(b.honroEvents);s.markers=clone(b.honroMarkers);
  s.encounters=[...new Set(b.units.map(u=>u.honroCluster).filter(Boolean))].map(id=>({id:'encounter:'+id,key:id,unitIds:b.units.filter(u=>u.honroCluster===id).map(u=>u.id)}));
  s.objectives=[{id:'campaign-goal',type:'campaign',label:st.goal}];
  s.anchors=clone(b.honroMapAnchors);s.design=clone(b.honroMap);s.routes=clone(b.honroRoute);s.detailStats=clone(b.honroDetailStats);
  s.initialState=clone(b);
  for(const key of ['units','terrain','honroEvents','honroMarkers','honroLandmarks','honroSurfaceZones','honroMapAnchors','honroMap','honroRoute','honroDetailStats','heroes','startXP','session','honroGrowth','difficulty','skillRevision','martialRevision'])delete s.initialState[key];
  stages.push(s);
 }
 const library=JSON.parse(await read('shared/data/elements.json'));
 for(const kind of new Set(stages.flatMap(s=>s.elements.map(e=>e.kind))))library.push({id:'builtin:'+kind,name:kind,category:'native',renderer:'landmark',kind,visual:[],collision:[],anchor:{x:0,y:0},sockets:[],tags:['HONRO'],params:{},bounds:{x:-400,y:-650,w:800,h:650}});
 const project=g.HonroMaps.normalize({schema:'honro-map',version:3,name:'HONRO · Stage 1–10',library,stages,activeStageId:'stage-1',settings:{grid:40,snap:true,autosave:true,adaptiveLOD:true},meta:{source:'RC21',notes:'Lossless compiled geometry migration'}});
 const errors=g.HonroMaps.validate(project).filter(x=>x.level==='err');if(errors.length)throw Error(JSON.stringify(errors));
 return project;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
 const baseline=await migrate(),g=await legacyRuntime();
 for(const file of ['shared/map/geometry.js','shared/map/commands.js','workshop/recipes/stage12-forest-basin.js','workshop/recipes/stage36-place-design.js'])vm.runInContext(await read(file),g);
 const first=g.HonroCommands.apply(baseline,g.HonroStage12Design.commands(baseline));
 const project=g.HonroCommands.apply(first,g.HonroStage36Places.commands(first));
 // The authored Stage 10 boss balance was adjusted after the original import.
 const sodan=project.stages[9].units.find(u=>u.id==='boss'&&u.cls==='occultist');
 if(sodan){sodan.attack=3.377988734638485;sodan.combatBaseAttack=2.9120592539986943;}
 await mkdir(path.join(root,'shared/data'),{recursive:true});
 await writeFile(path.join(root,'shared/data/campaign.json'),JSON.stringify(project,null,2)+'\n');
 console.log(`Migrated ${project.stages.length} stages and replayed the Stage 1–6 Workshop designs`);
}
