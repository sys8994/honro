import {readFile,readdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {buildCore} from '../game/engine/build.mjs';
import {buildMonsters} from '../tools/monster-forge/build.mjs';
import {buildParty} from '../tools/party-forge/build.mjs';
import {applyAct1SceneComposition} from '../tools/environment/act1-scene-composition.mjs';
import {applyAct2SceneComposition} from '../tools/environment/act2-scene-composition.mjs';
import {applyAct2VectorArt} from '../tools/environment/build-act2-art.mjs';
import {buildActors} from '../tools/actor-forge/build.mjs';

export const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=async p=>(await readFile(path.join(root,p),'utf8')).replace(/\r\n/g,'\n');
export const modelFiles=['content','story-content','terrain-space','map-engine','battlefield-layouts',
  'progression','encounters','world','act1-roster','difficulty','allies','mission','objectives','combat-status','authored','act2-content','act2-plan','act2-drama','act2','act3-content','act3-objectives','journey-content','act3-journey'];

// This is the only bundle manifest. Game, Stage view and playtest use it.
export async function runtimeParts({vector=true,render=true,app=false}={}) {
  const bgm=(await readdir(path.join(root,'assets/bgm'))).filter(f=>/^[0-9]{2}.*\.mp3$/i.test(f)).sort();
  if(bgm.length!==5||bgm.some((f,i)=>!f.startsWith(String(i+1).padStart(2,'0'))))throw Error('BGM prefixes 01 through 05 required');
  const parts=['globalThis.HONRO_BGM_TRACKS='+JSON.stringify(bgm.map(f=>'assets/bgm/'+f))+';',await buildCore(), 'globalThis.HONRO_BALANCE='+await read('game/config/balance.json')+';'];
  for(const name of modelFiles)parts.push(await read(`shared/runtime/${name}.js`));
  parts.push(await read('shared/runtime/camera.js'));
  for(const name of ['bounds','environment','geometry','terrain-domain','stage7-reentry','platform-passages','projectile-targets','vector-art','space-layout','schema','units','compiler','commands'])parts.push(await read(`shared/map/${name}.js`));
  const project=await applyAct1SceneComposition(await applyAct2SceneComposition(await applyAct2VectorArt(JSON.parse(await read('shared/data/campaign.json')))));
  parts.push('globalThis.HONRO_PROJECT=HonroAct1Roster.author('+JSON.stringify(project)+');');
  if(vector){
    await buildParty();
    parts.push(await read('shared/runtime/party-rig.js'));
    parts.push(await read('shared/assets/party/party.runtime.js'));
    parts.push((await read('shared/assets/rebuild-game-adapter.mjs')).replace(/^export /gm,'')+
      '\nglobalThis.HonroArcherVisual=HonroArcherVisual;globalThis.HonroPartyVisual=HonroPartyVisual;');
  }
  if(render){
    await buildMonsters();
    await buildActors();
    const act1Backdrops={};
    for(const [key,file] of [['mountains','act1-far.svg'],['gorge','act1-gorge.svg'],['dawn','act2-dawn.svg']]){
      const svg=await readFile(path.join(root,'shared/assets/environment',file));
      act1Backdrops[key]='data:image/svg+xml;base64,'+svg.toString('base64');
    }
    parts.push('globalThis.HONRO_ACT1_FAR_DATA='+JSON.stringify(act1Backdrops)+';');
    const act2Backdrops={};
    for(const [key,file] of [['clouded','act2-clouded-granite.svg'],['dawn','act2-dawn.svg']])act2Backdrops[key]='data:image/svg+xml;base64,'+(await readFile(path.join(root,'shared/assets/environment',file))).toString('base64');
    parts.push('globalThis.HONRO_ACT2_FAR_DATA='+JSON.stringify(act2Backdrops)+';');
    parts.push(await read('shared/assets/monsters/monsters.runtime.js'));
    parts.push(await read('shared/assets/actors/actors.runtime.js'));
    for(const name of ['renderer','art-dark','terrain-skirt','environment-art','map-art-polish','monster-vector','actor-vector','elements','environment-renderer','cave-enclosure','act2-spatial-art','act2-art','act3-art','act1-spatial-art','terrain-readability'])parts.push(await read(`shared/runtime/${name}.js`));
  }
  if(app){
    for(const name of ['journey.js','ui/fa.js'])parts.push(await read('game/vendor/'+name));
    parts.push(await read('shared/runtime/act2-journey.js'));
    for(const name of ['portraits','ui-bridge','stage-rules','audio','story','interactions','unit-info','training','skill-preview','journey-art','rest-journey','main'])
      parts.push(await read(`shared/runtime/${name}.js`));
  }else parts.push(await read('shared/runtime/stage-rules.js'));
  return parts;
}
