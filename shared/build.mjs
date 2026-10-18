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
export const modelFiles=['action-prompts','content','story-content-v0','story-content','terrain-space','map-engine','battlefield-layouts',
  'split-campaign','campaign-map-revision','stake-crossing','contribution-xp','progression','encounters','world','act1-roster','difficulty','allies','mission','objectives','objective-contributions','combat-status','authored','act2-content','act2-plan','act2-drama','act2','stage11-ravine-encounters','stage17-worksite','stage16-temple','act3-content','act3-encounters','act3-objectives','objective-revision','stage18-bell','stage30-ferry','stage12-quarry','stage23-escort','objective-guidance','journey-content','act3-journey','story-staging','story-direction','stage8-bier','encounter-density','stage14-vertical','stage22-vertical','route-branches','narrative-revision','stage11-trace-exit','stage2-airborne','stage5-waterfall-geometry','stage5-waterfall','quest-targets','story-canon-v1','bell-anomaly','act3-void','evidence-quests'];

// This is the only bundle manifest. Game, Stage view and playtest use it.
export async function runtimeEntries({vector=true,render=true,app=false}={}) {
  const parts=[];
  const code=(name,code)=>parts.push({name,code});
  const file=async source=>code(source,await read(source));
  const data=(name,value)=>parts.push({name,global:name,data:value,code:'globalThis.'+name+'='+JSON.stringify(value)+';'});
  const bgm=(await readdir(path.join(root,'assets/bgm'))).filter(f=>/^[0-9]{2}.*\.mp3$/i.test(f)).sort();
  if(bgm.length!==5||bgm.some((f,i)=>!f.startsWith(String(i+1).padStart(2,'0'))))throw Error('BGM prefixes 01 through 05 required');
  await file('shared/runtime/fullscreen-input.js');
  await file('shared/runtime/title-markup.js');
  data('HONRO_BGM_TRACKS',bgm.map(f=>'assets/bgm/'+f));
  code('engine/core',await buildCore());
  data('HONRO_BALANCE',JSON.parse(await read('game/config/balance.json')));
  data('HONRO_NARRATIVE_V0',JSON.parse(await read('shared/data/narrative-legacy-v0.json')));
  data('HONRO_SPLIT_V1',JSON.parse(await read('shared/data/split-campaign-v1.json')));
  data('HONRO_OPEN_STRUCTURES',JSON.parse(await read('shared/data/open-structures.json')));
  data('HONRO_WATERWORKS_V2',JSON.parse(await read('shared/data/waterworks-v2-content.json')));
  for(const name of modelFiles)await file(`shared/runtime/${name}.js`);
  await file('shared/runtime/camera.js');
  for(const name of ['bounds','environment','geometry','terrain-domain','stage7-reentry','platform-passages','open-structures','projectile-targets','visual-style','vector-art','space-layout','schema','units','compiler','commands'])await file(`shared/map/${name}.js`);
  let project=applyCavernTransitionLayers(applyCavernPlaceLayers(await applyAct1SceneComposition(await applyAct2SceneComposition(await applyAct2VectorArt(JSON.parse(await read('shared/data/campaign.json'))))),{existingOnly:true}),{existingOnly:true});
  project=await authorAct23QuestRedesign(project);
  applyOpenStructures(project);
  project=applyCityTacticalRoutes(project);
  project=applyStage9And13Tactical(project);
  project=applyTacticalCityResponses(project);
  project=applyTacticalWaveWarnings(project);
  project=applyStoryAnomalyEnvironment(project);
  project=applyStage28RecordCourt(project);
  project=applyPlaceEncounters(project);
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
    const act1Backdrops={};
    for(const [key,file] of [['mountains','act1-far.svg'],['gorge','act1-gorge.svg'],['dawn','act2-dawn.svg'],['act3','act3-far.svg']]){
      const svg=Buffer.from((await readFile(path.join(root,'shared/assets/environment',file),'utf8')).replace(/\bstroke="[^"]*"/g,'stroke="none"'));
      act1Backdrops[key]='data:image/svg+xml;base64,'+svg.toString('base64');
    }
    data('HONRO_ACT1_FAR_DATA',act1Backdrops);
    const act2Backdrops={};
    for(const [key,file] of [['clouded','act2-clouded-granite.svg'],['dawn','act2-dawn.svg'],['stage11-ravine','stage11-ravine-far.svg'],['stage11-ravine-readable','stage11-ravine-far-readable.svg']])act2Backdrops[key]='data:image/svg+xml;base64,'+Buffer.from((await readFile(path.join(root,'shared/assets/environment',file),'utf8')).replace(/\bstroke="[^"]*"/g,'stroke="none"')).toString('base64');
    data('HONRO_ACT2_FAR_DATA',act2Backdrops);
    const painted21=JSON.parse(await read('shared/assets/environment/stage21/painted.json'));
    for(const [key,file] of Object.entries(painted21.images)){
      const ext=path.extname(file).slice(1),mime=ext==='jpg'?'jpeg':ext;
      painted21.images[key]='data:image/'+mime+';base64,'+(await readFile(path.join(root,'shared/assets/environment/stage21',file))).toString('base64');
    }
    data('HONRO_STAGE21_PAINTED',painted21);
    const pilots=JSON.parse(await read('shared/assets/environment/painted-pilots/manifest.json'));
    for(const [key,file] of Object.entries(pilots.images))pilots.images[key]='data:image/webp;base64,'+(await readFile(path.join(root,'shared/assets/environment/painted-pilots',file))).toString('base64');
    data('HONRO_PAINTED_PILOTS',pilots);
    await file('shared/assets/monsters/monsters.runtime.js');
    await file('shared/assets/actors/actors.runtime.js');
    for(const name of ['renderer','art-dark','terrain-skirt','environment-art','map-art-polish','monster-vector','actor-vector','elements','environment-renderer','cave-enclosure','act2-spatial-art','stage11-landscape-art','act2-art','act3-art','act1-spatial-art','terrain-readability','stage18-bell-art','stage30-ferry-art','stage12-quarry-art','stage23-escort-art','stage8-bier-art','object-damage','combat-feedback','story-act1-art','stage5-waterfall-art','story-act23-art','narrative-art','quest-target-art','story-anomaly-art','visual-hierarchy'])await file(`shared/runtime/${name}.js`);
  }
  if(render)await file('shared/runtime/stage21-painted-art.js');
  if(render)await file('shared/runtime/painted-pilots-art.js');
  if(render)await file('shared/runtime/stage1-location-art.js');
  if(render)await file('shared/runtime/stage2-location-art.js');
  if(render)await file('shared/runtime/stage3-location-art.js');
  if(app){
    await file('game/vendor/ui/fa.js');
    for(const name of ['portraits','ui-bridge','stage-rules','audio','story','interactions','unit-info','training','skill-preview','journey-art','rest-journey','main'])
      await file(`shared/runtime/${name}.js`);
  }else await file('shared/runtime/stage-rules.js');
  return parts;
}

// Keep the same authoring order for native consumers and the external web loader.
export const projectAuthors=['HonroAct1Roster','HonroObjectiveRevision','HonroNarrativeRevision','HonroStage2Airborne','HonroBellAnomaly','HonroStoryCanonV1'];
export const authorProjectExpression=value=>projectAuthors.reduce((value,name)=>`${name}.author(${value})`,value);
export async function runtimeParts(options={}) {
  return (await runtimeEntries(options)).map(entry=>entry.code);
}
