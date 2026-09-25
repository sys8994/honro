import {readFile,readdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {buildCore} from '../game/engine/build.mjs';

export const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=async p=>(await readFile(path.join(root,p),'utf8')).replace(/\r\n/g,'\n');
export const modelFiles=['content','story-content','terrain-space','map-engine','battlefield-layouts',
  'progression','encounters','world','difficulty','allies','mission','objectives','combat-status','authored'];

// This is the only bundle manifest. Game, Stage view and playtest use it.
export async function runtimeParts({vector=true,render=true,app=false}={}) {
  const bgm=(await readdir(path.join(root,'assets/bgm'))).filter(f=>/^[0-9]{2}.*\.mp3$/i.test(f)).sort();
  if(bgm.length!==5||bgm.some((f,i)=>!f.startsWith(String(i+1).padStart(2,'0'))))throw Error('BGM prefixes 01 through 05 required');
  const parts=['globalThis.HONRO_BGM_TRACKS='+JSON.stringify(bgm.map(f=>'assets/bgm/'+f))+';',await buildCore(), 'globalThis.HONRO_BALANCE='+await read('game/config/balance.json')+';'];
  for(const name of modelFiles)parts.push(await read(`shared/runtime/${name}.js`));
  parts.push(await read('shared/runtime/camera.js'));
  for(const name of ['geometry','schema','units','compiler','commands'])parts.push(await read(`shared/map/${name}.js`));
  parts.push('globalThis.HONRO_PROJECT='+await read('shared/data/campaign.json')+';');
  if(vector){
    parts.push(await read('shared/assets/party.v006.runtime.js'));
    parts.push((await read('shared/assets/rebuild-game-adapter.mjs')).replace(/^export /gm,'')+
      '\nglobalThis.HonroArcherVisual=HonroArcherVisual;globalThis.HonroPartyVisual=HonroPartyVisual;');
  }
  if(render)for(const name of ['renderer','art-dark','elements'])parts.push(await read(`shared/runtime/${name}.js`));
  if(app){
    for(const name of ['journey.js','ui/fa.js'])parts.push(await read('game/vendor/'+name));
    for(const name of ['ui-bridge','stage-rules','audio','story','interactions','unit-info','main'])
      parts.push(await read(`shared/runtime/${name}.js`));
  }else parts.push(await read('shared/runtime/stage-rules.js'));
  return parts;
}
