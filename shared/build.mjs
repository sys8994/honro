import {validateSkillIcons} from '../tools/skill-icons/manifest.mjs';
import {applyCommonCartArt} from '../tools/environment/common-cart-art.mjs';
import {applyStage13VectorFinish} from '../tools/environment/stage13-vector-finish.mjs';
import {applyGeologyArt} from '../tools/environment/build-geology-art.mjs';
import {applyStage10Positioning} from '../tools/map-forge/stage10-positioning.mjs';
import {applyStage7Positioning} from '../tools/map-forge/stage7-positioning.mjs';
import {applyStage6Positioning} from '../tools/map-forge/stage6-positioning.mjs';
import {applyStage4Positioning} from '../tools/map-forge/stage4-positioning.mjs';
import {applyStage3Positioning} from '../tools/map-forge/stage3-positioning.mjs';
import {applyStage2Positioning} from '../tools/map-forge/stage2-positioning.mjs';
import {applyStage1Positioning} from '../tools/map-forge/stage1-positioning.mjs';
import {restBackdropData} from '../tools/environment/rest-backdrop-assets.mjs';
import {vectorKitRuntime} from '../tools/environment/vector-kit-runtime.mjs';
import {applyPlaceEncounters} from '../tools/map-forge/act3-place-encounters-20261017.mjs';
import {applyStage28RecordCourt} from '../tools/map-forge/stage28-record-court.mjs';
import {applyStoryAnomalyEnvironment} from '../tools/map-forge/story-anomaly-revision.mjs';
import {applyTacticalWaveWarnings} from '../tools/map-forge/tactical-wave-warnings.mjs';
import {applyTacticalCityResponses} from '../tools/map-forge/tactical-city-responses.mjs';
import {applyStage9And13Tactical} from '../tools/map-forge/stage9-13-tactical.mjs';
import {applyCityTacticalRoutes} from '../tools/map-forge/city-tactical-routes.mjs';
import {authorAct23QuestRedesign} from '../tools/map-forge/act23-quest-redesign.mjs';
import {applyOpenStructures} from '../tools/map-forge/open-structure-policy.mjs';
import {applyCavernTransitionLayers} from '../tools/map-forge/cavern-transition-layers.mjs';
import {readFile,readdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {buildCore} from '../game/engine/build.mjs';
import {buildMonsters} from '../tools/monster-forge/build.mjs';
import {buildParty} from '../tools/party-forge/build.mjs';
import {applyCavernPlaceLayers} from '../tools/map-forge/cavern-place-layers.mjs';
import {applyAct1SceneComposition} from '../tools/environment/act1-scene-composition.mjs';
import {applyAct2SceneComposition} from '../tools/environment/act2-scene-composition.mjs';
import {applyAct2VectorArt} from '../tools/environment/build-act2-art.mjs';
import {buildActors} from '../tools/actor-forge/build.mjs';

export const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=async p=>(await readFile(path.join(root,p),'utf8')).replace(/\r\n/g,'\n');
export const modelFiles=['action-prompts','narrative-catalogue','content','story-content-v0','story-content-v1','story-content','terrain-space','map-engine','battlefield-layouts',
  'clear-report','split-campaign','campaign-map-revision','stake-crossing','contribution-xp','progression','profile-store','encounters','world','act1-roster','difficulty','allies','sodan-withdrawal','mission','objectives','objective-contributions','combat-status','authored','act2-content','act2','stage11-ravine-encounters','stage17-worksite','stage16-temple','act3-content','act3-encounters','act3-objectives','objective-revision','stage18-bell','stage30-ferry','stage12-quarry','stage23-escort','objective-guidance','journey-content','act3-journey','story-staging','story-direction','story-framing','stage8-bier','encounter-density','stage14-vertical','stage22-vertical','route-branches','narrative-revision','stage11-trace-exit','stage2-airborne','stage5-waterfall-geometry','stage5-waterfall','stage5-positioning','quest-targets','story-canon-v1','bell-anomaly','act3-void','evidence-quests','stage2-layered-road','act2-pacing'];

modelFiles.push('player-turn-order','stage11-quest-simplification','stage14-rescue-gates','stage15-drain-contact','stage18-short-quest','keeper-ritual','stage19-farewell');
modelFiles.push('act23-v4','act23-v4-act2','act23-v4-act2-scenes','act23-v4-stage18','act23-v4-act3','act23-v4-city','act23-v4-stage29','act23-v4-stage30','act23-v4-ch11-scenes','act23-v4-reviewed','act23-v4-reviewed-chapters','act23-v4-reviewed12','act23-v4-reviewed13','act23-v4-reviewed14','act23-v4-reviewed15','act23-v4-reviewed16','act23-v4-reviewed17','act23-v4-reviewed18','act23-v4-reviewed19','act23-v4-reviewed20','act23-v4-reviewed-common','act23-v4-ch21-scenes','act23-v4-ch21-reviewed','act23-v4-ch22-reviewed','act3-v4-reviewed-core','act23-v4-ch23-reviewed','act23-v4-ch24-reviewed','act3-v4-reviewed-waterworks','act23-v4-ch25-reviewed','act23-v4-ch27-reviewed','act23-v4-ch26-reviewed','act23-v4-ch28-reviewed','act23-v4-ch29-reviewed','act23-v4-ch30-reviewed');
// Every ID has one owner; a duplicate bank entry is a build error.
export async function skillAudioData(){
  const base=JSON.parse(await read('shared/assets/sfx/skills-v2/manifest.json'));
  const weapons=JSON.parse(await read('shared/assets/sfx/weapons-v3/manifest.json'));
  const arrows=JSON.parse(await read('shared/assets/sfx/weapons-v3/arrow-hits.json'));
  const thunder={...JSON.parse(await read('shared/assets/sfx/weapons-v3/cheonroe_thunder.json')),file:'cheonroe_thunder.mp3'};
  const bowstring={...JSON.parse(await read('shared/assets/sfx/bowstring-v4/manifest.json')),id:'bow_release',file:'bowstring_release.mp3'};
  const banks=[
    ['skills-v2',Object.entries(base.assets)],
    ['weapons-v3',weapons.assets.map(a=>[a.id,{...a,processing:weapons.processing}])],
    ['weapons-v3',arrows.assets.map(a=>[a.id,{...a,workTitle:'Fleshy Fight Sounds',processing:arrows.processing}])],
    ['weapons-v3',[[thunder.id,thunder]]],
    ['bowstring-v4',[[bowstring.id,bowstring]]]
  ],assets={};
  for(const [folder,entries]of banks)for(const [id,metadata]of entries){
    if(Object.hasOwn(assets,id))throw Error('Duplicate skill audio asset ID: '+id);
    const asset={...metadata};asset.src='data:audio/'+(asset.file.endsWith('.wav')?'wav':'mpeg')+';base64,'+(await readFile(path.join(root,'shared/assets/sfx',folder,asset.file))).toString('base64');assets[id]=asset;
  }
  return {version:3,assets};
}
// This is the only bundle manifest. Game, Stage view and playtest use it.
export async function runtimeEntries({vector=true,render=true,app=false}={}) {
  const parts=[];
  const code=(name,code)=>parts.push({name,code});
  const file=async source=>code(source,await read(source));
  const data=(name,value)=>parts.push({name,global:name,data:value,code:'globalThis.'+name+'='+JSON.stringify(value)+';'});
  const bgmMetadata=JSON.parse(await read('shared/data/bgm.json'));
  const bgm=(await readdir(path.join(root,'assets/bgm'))).filter(f=>/\.mp3$/i.test(f)).sort();
  const expectedBgm=['main.mp3',...Array.from({length:6},(_,i)=>`battle-${i+1}.mp3`)];
  if(bgm.length!==7||JSON.stringify(bgmMetadata.map(t=>t.file))!==JSON.stringify(expectedBgm)||bgmMetadata.some(t=>!bgm.includes(t.file)))throw Error('BGM requires exactly main.mp3 and battle-1.mp3 through battle-6.mp3');
  await file('shared/runtime/fullscreen-input.js');
  await file('shared/runtime/title-markup.js');
  data('HONRO_BGM_TRACKS',bgmMetadata.map(t=>'assets/bgm/'+t.file));
  data('HONRO_BGM_METADATA',bgmMetadata.map(({id,file,title})=>({id,file,title})));
  const skillImages=await validateSkillIcons({allowPending:true});
  if(skillImages.errors.length)throw Error(skillImages.errors.join('\n'));
  data('HONRO_SKILL_ICON_MANIFEST',{...skillImages.source,complete:skillImages.complete,icons:Object.fromEntries(Object.entries(skillImages.source.icons).map(([id,item])=>[id,{...item,url:item.status==='ready'?item.file:null}]))});
  code('engine/core',await buildCore());
  code('shared/environment-vector-kit',await vectorKitRuntime());
  data('HONRO_BALANCE',JSON.parse(await read('game/config/balance.json')));
  data('HONRO_NARRATIVE_V0',JSON.parse(await read('shared/data/narrative-legacy-v0.json')));
  data('HONRO_SPLIT_V1',JSON.parse(await read('shared/data/split-campaign-v1.json')));
  data('HONRO_OPEN_STRUCTURES',JSON.parse(await read('shared/data/open-structures.json')));
  data('HONRO_WATERWORKS_V2',JSON.parse(await read('shared/data/waterworks-v2-content.json')));
  data('HONRO_NARRATIVE_CATALOGUE',JSON.parse(await read('shared/data/narrative-current.json')));
  data('HONRO_NARRATIVE_COMPAT',JSON.parse(await read('shared/data/narrative-compat-v1.json')));
  data('HONRO_STAGE_CONTRACTS',JSON.parse(await read('shared/data/stage-contracts.json')));
  data('HONRO_ACT23_V4_PHASE_A',process.env.HONRO_ACT23_V4_PHASE_A==='1');
  const reviewed11=process.env.HONRO_ACT23_V4_PHASE_A==='1'&&process.env.HONRO_ACT23_V4_PHASE_B_CH11==='1';
  data('HONRO_ACT23_V4_PHASE_B_CH11',reviewed11);
  data('HONRO_ACT23_V4_REVIEWED',reviewed11?JSON.parse(await read('shared/data/reviewed/act23-v4-ch11.json')):null);
  const reviewedStages=process.env.HONRO_ACT23_V4_PHASE_A==='1'?(process.env.HONRO_ACT23_V4_PHASE_B_STAGES||'').split(',').map(Number).filter(n=>[12,13,14,15,16,17,18,19,20].includes(n)):[];
  data('HONRO_ACT23_V4_PHASE_B_STAGES',reviewedStages);
  const reviewedChapters={};for(const n of reviewedStages)reviewedChapters[n]=JSON.parse(await read('shared/data/reviewed/act23-v4-ch'+n+'.json'));
  data('HONRO_ACT23_V4_REVIEWED_CHAPTERS',reviewedChapters);
  const reviewedCommon=process.env.HONRO_ACT23_V4_PHASE_A==='1'&&process.env.HONRO_ACT23_V4_PHASE_B_COMMON==='1';
  data('HONRO_ACT23_V4_REVIEWED_COMMON',reviewedCommon?JSON.parse(await read('shared/data/reviewed/act23-v4-common.json')):null);
  // Only completed, explicitly opted-in Act3 bindings enter a private build.
  const reviewedAct3Stages=[21,22,23,24,25,26,27,28,29,30];
  const reviewedAct3=Object.fromEntries(reviewedAct3Stages.map(id=>[id,process.env.HONRO_ACT23_V4_PHASE_A==='1'&&process.env['HONRO_ACT23_V4_PHASE_B_CH'+id]==='1']));
  for(const id of reviewedAct3Stages){data('HONRO_ACT23_V4_PHASE_B_CH'+id,reviewedAct3[id]);data('HONRO_ACT23_V4_REVIEWED_CH'+id,(id===21?Object.values(reviewedAct3).some(Boolean):reviewedAct3[id])?JSON.parse(await read('shared/data/reviewed/act23-v4-ch'+id+'.json')):null);}
  data('HONRO_PORTRAIT_VARIANTS',JSON.parse(await read('game/config/portrait-variants.json')));
  for(const name of modelFiles)await file(`shared/runtime/${name}.js`);
  await file('shared/runtime/camera.js');
  await file('shared/runtime/attack-camera.js');
  await file('shared/runtime/reinforcement-camera.js');
  for(const name of ['bounds','environment','geometry','terrain-domain','stage7-reentry','platform-passages','open-structures','projectile-targets','visual-style','vector-art','space-layout','schema','units','compiler','commands'])await file(`shared/map/${name}.js`);
  let project=applyCavernTransitionLayers(applyCavernPlaceLayers(await applyAct1SceneComposition(await applyAct2SceneComposition(await applyAct2VectorArt(JSON.parse(await read('shared/data/campaign.json'))))),{existingOnly:true}),{existingOnly:true});
  project=await applyGeologyArt(project);
  project=applyCommonCartArt(project);
  project=await authorAct23QuestRedesign(project);
  applyOpenStructures(project);
  project=applyCityTacticalRoutes(project);
  project=applyStage9And13Tactical(project);
  project=applyTacticalCityResponses(project);
  project=applyTacticalWaveWarnings(project);
  project=applyStoryAnomalyEnvironment(project);
  project=applyStage28RecordCourt(project);
  project=applyPlaceEncounters(project);
  project=applyStage1Positioning(project);
  project=applyStage2Positioning(project);
  project=applyStage3Positioning(project);
  project=applyStage4Positioning(project);
  project=applyStage6Positioning(project);
  project=applyStage7Positioning(project);
  project=applyStage10Positioning(project);
  // Preserve the opted-in Stage13 finish after legacy transition/scenery authors.
  // Their terrain/routes remain canonical; this final pass changes art only.
  if(project.stages.some(s=>s.metadata?.stageId===13&&s.design?.stoneFinish?.revision===1))project=applyStage13VectorFinish(project);
  parts.push({name:'campaign',project,code:'globalThis.HONRO_PROJECT='+authorProjectExpression(JSON.stringify(project))+';'});
  if(vector){
    await buildParty();
    await file('shared/runtime/party-rig.js');
    await file('shared/assets/party/party.runtime.js');
    code('shared/assets/rebuild-game-adapter.mjs',(await read('shared/assets/rebuild-game-adapter.mjs')).replace(/^export /gm,'')+
      '\nglobalThis.resolveRebuildCharacter=resolveRebuildCharacter;globalThis.HonroArcherVisual=HonroArcherVisual;globalThis.HonroPartyVisual=HonroPartyVisual;');
  }
  if(render){
    await buildMonsters();
    await buildActors();
    const farewell={};for(const [key,file]of [['farewell','farewell-spirit.svg'],['bound','bound-spirit.svg']]){const svg=await read('art/spirits/farewell-v1/'+file);farewell[key]=[...svg.matchAll(/<path fill="([^"]+)" d="([^"]+)"\s*\/>/g)].map(([,fill,d])=>({fill,d}));if(farewell[key].length!==12)throw Error('Approved farewell SVG paths changed: '+file);}
    data('HONRO_FAREWELL_SPIRITS',farewell);
    const act1Backdrops={};
    for(const [key,file] of [['mountains','act1-far.svg'],['gorge','act1-gorge.svg'],['dawn','act2-dawn.svg'],['act3','act3-far.svg']]){
      const svg=Buffer.from((await readFile(path.join(root,'shared/assets/environment',file),'utf8')).replace(/\bstroke="[^"]*"/g,'stroke="none"'));
      act1Backdrops[key]='data:image/svg+xml;base64,'+svg.toString('base64');
    }
    data('HONRO_ACT1_FAR_DATA',act1Backdrops);
    const act2Backdrops={};
    for(const [key,file] of [['clouded','act2-clouded-granite.svg'],['dawn','act2-dawn.svg'],['stage11-ravine','stage11-ravine-far.svg'],['stage11-ravine-readable','stage11-ravine-far-readable.svg']])act2Backdrops[key]='data:image/svg+xml;base64,'+Buffer.from((await readFile(path.join(root,'shared/assets/environment',file),'utf8')).replace(/\bstroke="[^"]*"/g,'stroke="none"')).toString('base64');
    data('HONRO_ACT2_FAR_DATA',act2Backdrops);
    data('HONRO_REST_BACKDROPS',await restBackdropData());
    const far=JSON.parse(await read('shared/assets/environment/campaign-far/manifest.json'));
    for(const [key,file] of Object.entries(far.images))far.images[key]='data:image/webp;base64,'+(await readFile(path.join(root,'shared/assets/environment/campaign-far',file))).toString('base64');
    data('HONRO_AUTHORED_FAR',far);
    await file('shared/assets/monsters/monsters.runtime.js');
    await file('shared/assets/actors/actors.runtime.js');
    for(const name of ['renderer','art-dark','terrain-skirt','environment-art','map-art-polish','monster-vector','actor-vector','act23-v4-ch21-art','act3-v4-reviewed-rest','elements','environment-renderer','cave-enclosure','act2-spatial-art','stage11-landscape-art','keeper-ritual-art','act2-art','act3-art','act1-spatial-art','terrain-readability','geology-art','geology-rear-support','stage2-layered-road-art','stage18-bell-art','stage30-ferry-art','stage12-quarry-art','stage23-escort-art','stage8-bier-art','object-damage','combat-feedback','story-act1-art','stage5-waterfall-art','stage5-positioning-art','story-act23-art','narrative-art','stage19-farewell-art','quest-target-art','act3-v4-reviewed-actors','story-anomaly-art','visual-hierarchy'])await file(`shared/runtime/${name}.js`);
  }
  if(render)await file('shared/runtime/authored-far-art.js');
  if(app){
    data('HONRO_SKILL_AUDIO',await skillAudioData());
    data('HONRO_MUKJONG_AUDIO',{src:'data:audio/mpeg;base64,'+(await readFile(path.join(root,'shared/assets/sfx/mukjong-b.mp3'))).toString('base64')});
    data('HONRO_JOURNEY_MAPS',JSON.parse(await read('shared/assets/journey-maps/v1/manifest.json')));
    await file('shared/runtime/tooltips.js');
    await file('game/vendor/ui/fa.js');
    await file('shared/runtime/skill-images.js');
    await file('shared/runtime/camp-renderer.js');
    for(const name of ['campaign-entry','portraits','npc-portraits','ui-bridge','stage-rules','music-titles','audio','mukjong-audio','story','act3-v4-reviewed-documents','mukjong-pitch-dialogue','act-endings-content','act-endings','interactions','unit-info','training','skill-preview','journey-art','journey-images','rest-journey','menu-ui','clear-report-ui','main']){
      await file(`shared/runtime/${name}.js`);
      // Metadata only: native/full consumers retain the same scripts and order.
      if(name==='training'||name==='skill-preview')parts.at(-1).optional=name;
    }
  }else await file('shared/runtime/stage-rules.js');
  return parts;
}

// Keep the same authoring order for native consumers and the external web loader.
export const projectAuthors=['HonroAct1Roster','HonroObjectiveRevision','HonroNarrativeRevision','HonroStage2Airborne','HonroBellAnomaly','HonroStoryCanonV1','HonroEvidenceQuests','HonroAct2Pacing','HonroNarrativeCatalogue','HonroStage11Quest','HonroStage14Rescue','HonroStage16Temple','HonroAct23V4'];
export const authorProjectExpression=value=>projectAuthors.reduce((value,name)=>`${name}.author(${value})`,value);
export async function runtimeParts(options={}) {
  return (await runtimeEntries(options)).map(entry=>entry.code);
}
