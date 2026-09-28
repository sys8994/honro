import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath,pathToFileURL} from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
import {runtimeParts} from '../shared/build.mjs';

const here=path.dirname(fileURLToPath(import.meta.url)),root=path.dirname(here);
const base=path.join(here,'vendor');
const read=p=>readFile(p,'utf8').then(s=>s.replace(/\r\n/g,'\n'));
const sha=s=>createHash('sha256').update(s).digest('hex');

export async function buildGame({vector=true,destination=path.join(root,'HONRO.html')}={}) {
  const reference=await read(path.join(here,'templates/body.html'));
  const shared=await runtimeParts({vector,app:true});
  const logo=await readFile(path.join(root,'assets','rc11','honro-logo.png'));
  const title='globalThis.HONRO_TITLE_IMAGE=null;globalThis.HONRO_TITLE_LOGO="data:image/png;base64,'+logo.toString('base64')+'";';
  const stageArt={};for(let i=1;i<=10;i++){const buf=await readFile(path.join(root,'assets','rc11',`stage-${String(i).padStart(2,'0')}.jpg`));stageArt[i]='data:image/jpeg;base64,'+buf.toString('base64');}
  const parts=[title,'globalThis.HONRO_STAGE_INTRO_ART='+JSON.stringify(stageArt)+';',...shared];
  const portraits=JSON.parse(await read(path.join(here,'config/story-portraits.json')));
  for(const entry of Object.values(portraits))if(entry.image){const ext=path.extname(entry.image).toLowerCase(),mime={'.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml'}[ext];assert.ok(mime,'Supported portrait image required');entry.src='data:'+mime+';base64,'+(await readFile(path.resolve(root,entry.image))).toString('base64');}
  parts.push('globalThis.HONRO_STORY_PORTRAITS='+JSON.stringify(portraits)+';');
  // Preserve the existing developer hash entry, with no save reset or timing patch.
  parts.push("if(location.hash==='#autostage2'){HonroApp.launch(2);}");
  const css=(await read(path.join(base,'ui/arcfall-layout.css')))+'\n'+await read(path.join(base,'style.css'))+'\n'+await read(path.join(here,'src/hud.css'))+'\n'+await read(path.join(here,'src/presentation.css'))+'\n'+await read(path.join(here,'src/controls.css'))+'\n'+await read(path.join(here,'src/unit-info.css'))+'\n'+await read(path.join(here,'src/training.css'));
  const shell=reference;
  const html=`<!doctype html>\n<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover"><meta name="theme-color" content="#101b20"><title>혼로 · HONRO</title><style>${css}</style></head>${shell}<script>${parts.join('\n').replace(/<\/script/gi,'<\\/script')}</script></body></html>\n`;
  assert.ok(!/id="honro-06\d.*(?:patch|script)/.test(html),'No runtime patch stack');
  await writeFile(destination,html);
  if(vector){
    await mkdir(path.join(here,'../_local/game-reports'),{recursive:true});
    await writeFile(path.join(here,'../_local/game-reports/build.json'),JSON.stringify({entry:'HONRO.html',source:['shared/runtime','shared/engine/src','game/config/balance.json','shared/assets/rebuild-game-adapter.mjs','shared/assets/party.v006.runtime.js'],character_art:{seol_o:'v006',other_party:'v006'},baseline:'standalone-code-handoff',shell_sha256:sha(reference),html_bytes:Buffer.byteLength(html),html_sha256:sha(html),vector:true,external_runtime_dependencies:0,external_assets:['assets/bgm/01..05 MP3'],engine_change:'Shared HONRO runtime, canonical maps and streamed BGM; RC21 renderer caching, gameplay and authored campaign geometry preserved.'},null,2)+'\n');
  }
  return html;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){await buildGame();console.log('Built HONRO.html (offline playable game)');}
