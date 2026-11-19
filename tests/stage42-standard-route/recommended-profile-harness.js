// QA only, run as an expression in a separate loaded HONRO.html page on localhost.
// No checkpoint injection, input event synthesis, profile write, or campaign project edit.
async ({baseRaw, detailRaw, gateRaw, westRaw=null, buildVisual})=>{
 const must=(b,s)=>{if(!b)throw Error(s)};
 const eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
 const hex=async s=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))].map(x=>x.toString(16).padStart(2,'0')).join('');
 must(['127.0.0.1','localhost'].includes(location.hostname)&&location.pathname.endsWith('/HONRO.html'),'Use only disposable localhost player');
 must(localStorage.length===0&&sessionStorage.length===0&&window.HonroQaStorageAttempts?.length===0,'Only a newly isolated browser context');
 await HONRO_APP_READY;
 await HonroCampaignLoader.ensureStage(42);
 window.HonroQaStorageCheck.stage='after-stage-loader';
 const app=HonroApp,old=HONRO_PROJECT,st=old.stages.find(s=>s.id==='stage-42'&&s.metadata?.stageId===42&&s.metadata.campaign===true);
 must(st&&st.width===6500&&st.design.act5.encounterVersion===6&&st.playBounds.right===6500,'Wrong canonical Stage42');
 must((await Promise.all([baseRaw,detailRaw,gateRaw].map(hex))).join('/')===
  'a9f3200d572681ad29a0e80449f916f49565faf90d9bd8506e6d274d7eaf37e5/3d742fd6c0eee6d72225c8da52d75bac185e0cad18702de4c42d1c2bebdc8ead/7bccd505aa75875344914567f689d56a4f29f21de49ca1f98549dcca4ff6a103','Wrong actual pointer-authored visual receipt');
 // buildVisual is a callable registered by disposable bundler, never read/eval from a receipt.
 must(buildVisual===undefined&&typeof window.HonroQaBuildNewStage42Visual==='function','Verified scoped QA compiler not installed');
 const authored=await HonroQaBuildNewStage42Visual(baseRaw,detailRaw,gateRaw,westRaw),v=authored.stages[0];
 const ids=new Set(authored.library.map(a=>a.id)),roleCount=westRaw===null?15:16;
 must(westRaw===null?!ids.has('new-stage42-upper-west-palisade'):ids.has('new-stage42-upper-west-palisade'),'West exact visual owner missing');
 must(authored.stages.length===1&&v.id==='stage-42-whole-native-blockout'&&!v.terrains.length&&!v.units.length&&!v.events.length&&!v.markers.length&&ids.size===roleCount&&['stage42-native-gate-open-prop','new-stage42-upper-deck-taper','new-stage42-reversible-palisade-ladder'].every(id=>ids.has(id))&&authored.library.every(a=>!a.collision.length&&/^(new-stage42-|stage42-native-gate-)/.test(a.id))&&v.elements.every(e=>ids.has(e.assetId)),'Visual-only gate source scope not exact');
 must(eq(v.playBounds,st.playBounds)&&eq(v.terrainBounds,st.terrainBounds)&&v.height===st.height,'Published and art experiment domains differ');
 const plan=HonroProgression.plan(42);
 must(westRaw&&await hex(westRaw)==='53b235379b01e360db9cdac3d5d5aa70cbe891c8bc27230bcd42a86dddac4b30'&&Number.isFinite(plan.entryLevel),'Only actual multiface and official planned entry accepted');
 let profile=HonroMaps.profileFor(st);
 const expectedXP=HonroProgression.xpAt(plan.entryLevel);
 must(profile.recruited.length>0&&profile.recruited.every(c=>profile.heroes[c]?.xp===expectedXP),'Recommended official profile was not at exact entry XP');
 must(eq([...profile.recruited].sort(),[...HonroStageRules.stageParty(42)].sort()),'Official recommended map roster disagrees with stock campaign stage party');
 profile.party=[...profile.recruited];
 const levels=profile.recruited.map(c=>[c,HONRO_CORE.levelOf(profile.heroes[c])]);
 // App uses this new in-memory object; normal profile/save hooks remain untouched.
 must(app.screen==='title'&&!app.engine&&!app.customMap&&!app.debugMode,'Fresh disposable title required');
 // ProfileStore refuses persistent writes in embedded mode; additionally block app persist before mount.
 must(Object.getOwnPropertyDescriptor(app,'persist')===undefined,'Unexpected existing persist override');
 Object.defineProperty(app,'persist',{value:()=>false,configurable:true});
 app.profile=profile;app.stageId=42;
 window.HonroQaStorageCheck.stage='isolated-stock-equipment-entry';
 must(typeof window.HonroStage42EquipmentEntryInMemory==='function','Isolated equipment entry guard absent');
 const entryEquipment=window.HonroStage42EquipmentEntryInMemory(app,window,()=>localStorage.length+sessionStorage.length+HonroQaStorageAttempts.length);
 profile=app.profile;
 const entry=HONRO_CONTENT.stages.find(s=>s.id===42);
 // Compile two independent copies to assert that modifying presentation only cannot change any physical/event input.
 const toPortable=b=>JSON.parse(JSON.stringify({stage:b.honroStage,origin:b.honroMapOrigin,canonical:b.honroCanonical,custom:b.honroCustom,terrain:b.terrain,world:b.honroWorldTerrain,markers:b.honroMarkers,events:b.honroEvents,authoredEvents:b.honroAuthoredEvents,actors:b.units.map(u=>[u.id,u.cls,u.side,u.x,u.y,u.spawnX,u.spawnY,u.honroAct5Escort]),map:b.honroMap,objectives:b.honroObjectives,bounds:b.honroPlayBounds,anchors:b.honroMapAnchors}));
 // Normal official campaign creation is the authority for launch state.
 const once=structuredClone(st);
 const artStage={...once,elements:structuredClone(v.elements),environment:{...structuredClone(st.environment),placements:[]}};
 const newProject={...old,library:structuredClone(authored.library),stages:[artStage]};
 const stock=HONRO_TOOLS.makeWorld(entry,structuredClone(profile),false),newBattle=HonroMaps.createBattle(artStage,newProject,structuredClone(profile),{origin:'campaign'});
 must(eq(toPortable(stock),toPortable(newBattle)),'Terrain/NPC/objective/marker drift vs official Stage42');
 must(HonroAct5.active(newBattle)&&newBattle.honroCustom===false&&newBattle.honroLandmarks.length===roleCount&&newBattle.honroLandmarks.every(e=>ids.has(e.asset?.id)),'Act5 inactive or unexpected old art');
 must(newBattle.honroEnvironment.placements.length===0,'Old scoped environment placements leaked');
 const links=newBattle.honroMap.act5.links;
 must(links.length===2&&links[0].id==='a5-cross-0'&&links[1].id==='a5-cross-1'&&links[0].to.x===links[1].x&&links[1].to.x===links[0].x,'Missing original reversible ladder');
 app.stage=entry;app.stageId=42;app.training=false;
 window.HonroQaStorageCheck.stage='mount-and-entry';
 HonroStageRules.sanitizeStageBattle(newBattle);app.mount(newBattle,{freshReport:true,reportScope:'debug'});
 // Preserve original intro and stock planning/mission ticking.
 HonroRestJourney.startEntry(app,entry.name);
 const terrainInitial=JSON.stringify(app.engine.b.terrain);
 window.HonroQaObserveStage42=()=>{
  const e=app.engine,b=e.b,u=e.active,m=b.honroState.act5;
  return {phase:b.phase,round:b.round,step:m?.step??0,side:b.side,active:u?.id,x:u?.x,y:u?.y,move:u?.moveLeft,dialogue:!!app.dialogue,canInput:app.canInput(),grounded:!!(u&&e.grounded(u)),errors:app.lastError??null,keys:[...app.keys],unchangedTerrain:JSON.stringify(b.terrain)===terrainInitial,storeSize:localStorage.length+sessionStorage.length,storageWriteAttempts:window.HonroQaStorageAttempts.length,eligible:HonroInteractions.candidates(app).filter(q=>q.ok).map(q=>q.marker.id),escorts:b.units.filter(u=>u.honroAct5Escort).map(({id,hp,x,y})=>({id,hp,x,y})),wave:m?.waves??{},drumStart:m?.drumStart??null};
 };
 return {stageId:42,profileBasis:"HonroMaps.profileFor(st)",recommendedEntryLevel:plan.entryLevel,roleCount,entryEquipment,levels,links,units:stock.units.length,colliders:stock.terrain.length,phase:app.engine.b.phase,scope:'Fresh production geometry/runtime, isolated verified authored visual art, no saved real player state'};
}
