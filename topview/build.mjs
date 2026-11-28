import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {buildCore} from '../game/engine/build.mjs';
import {projectAuthors} from '../shared/build.mjs';
import {unpackJson} from '../shared/json-pool.mjs';
import {minify} from 'terser';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.dirname(here);
const read = file => fs.readFile(path.join(root, file), 'utf8');
const manifest = JSON.parse(await read('web/manifest.json'));
const out = path.join(here, 'generated');
await fs.mkdir(out, {recursive:true});
async function emit(name, source) {
  const hash = createHash('sha256').update(source).digest('hex').slice(0,16);
  const filename = name + '.' + hash + '.mjs';
  await fs.writeFile(path.join(out,filename),source);
  return 'topview/generated/' + filename;
}
const core = await emit('core', (await minify(await buildCore(), {compress:false,mangle:false})).code);
const loader = await emit('campaign-loader', (await read('shared/web-loader.js')).replace('/* JSON_POOL_DECODER */',unpackJson.toString()));
const chapter = await emit('chapter', `import {loadCampaign} from './${path.basename(loader)}';
globalThis.HONRO_PROJECT=await loadCampaign(${JSON.stringify(manifest.project)},[${projectAuthors.join(',')}],{firstStage:1});`);
const modules = [];
// Native asset packets are shared by content hash. Choose the two standalone
// native modules by their registrations so a changed grouping fails loudly.
const files=manifest.files.map(entry=>entry.path);
const gameArt=files.find(f=>/^web\/runtime\/game-art\.[a-f0-9]+\.js$/.test(f));
const title=files.find(f=>/^web\/runtime\/title-scene\.[a-f0-9]+\.js$/.test(f));
if (!gameArt || !title) throw Error('Missing native title and character presentation');
modules.push(gameArt,title);
let cores=0, projects=0, apps=0;
for (const file of [...manifest.common, ...manifest.gameOnly]) {
  if (/\/campaign\.[a-f0-9]+\.js$/.test(file)) { modules.push(chapter); projects++; continue; }
  const body=await read(file);
  if (body.includes('globalThis.HONRO_CORE={')) {modules.push(core);cores++;continue;}
  if (body.includes('this.profileStore.initial') && body.includes('G.HonroApp=')) {
    modules.push('shared/runtime/profile-store.js','shared/runtime/objectives.js','shared/runtime/mission.js','topview/src/install.mjs','shared/runtime/main.js');apps++;break;
  }
  modules.push(file);
}
if (cores!==1 || projects!==1 || apps!==1) throw Error('Native module ownership changed');
const metadata={modules,styles:manifest.styles,nativeEntry:manifest.gameEntry};
await fs.writeFile(path.join(out,'native.json'),JSON.stringify(metadata,null,2)+'\n');
const live=new Set([path.basename(core),path.basename(chapter),path.basename(loader)]);
for(const file of await fs.readdir(out))if(/^(core|chapter|campaign-loader)\.[a-f0-9]{16}\.mjs$/.test(file)&&!live.has(file))await fs.unlink(path.join(out,file));
console.log('Topview chapter ready, '+modules.length+' native/adapter modules');
