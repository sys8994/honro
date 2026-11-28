import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {buildCore} from '../game/engine/build.mjs';
import {projectAuthors} from '../shared/build.mjs';
import {unpackJson} from '../shared/json-pool.mjs';
import {writeGenerated} from '../shared/write-generated.mjs';
import {minify} from 'terser';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.dirname(here);
const read = file => fs.readFile(path.join(root, file), 'utf8');
const out = path.join(here, 'generated');
async function emit(name, source) {
  const hash = createHash('sha256').update(source).digest('hex').slice(0,16);
  const filename = name + '.' + hash + '.mjs';
  await writeGenerated(path.join(out,filename),source);
  return 'topview/generated/' + filename;
}
export async function buildTopview() {
  await fs.mkdir(out, {recursive:true});
  const manifest = JSON.parse(await read('web/manifest.json'));
  const core = await emit('core', (await minify(await buildCore(), {compress:false,mangle:false})).code);
  const loader = await emit('campaign-loader', (await read('shared/web-loader.js')).replace('/* JSON_POOL_DECODER */',unpackJson.toString()));
  const chapter = await emit('chapter', `import {loadCampaign} from './${path.basename(loader)}';
globalThis.HONRO_PROJECT=await loadCampaign(${JSON.stringify(manifest.project)},[${projectAuthors.join(',')}],{firstStage:1});`);
  const files = manifest.files.map(entry => entry.path);
  const gameArt = files.find(f => /^web\/runtime\/game-art\.[a-f0-9]+\.js$/.test(f));
  const title = files.find(f => /^web\/runtime\/title-scene\.[a-f0-9]+\.js$/.test(f));
  if (!gameArt || !title) throw Error('Missing native title and character presentation');
  const modules = [gameArt, title];
  let cores=0, projects=0, apps=0;
  for (const file of [...manifest.common, ...manifest.gameOnly]) {
    if (/\/campaign\.[a-f0-9]+\.js$/.test(file)) { modules.push(chapter); projects++; continue; }
    const body=await read(file);
    if (body.includes('globalThis.HONRO_CORE={')) {modules.push(core);cores++;continue;}
    if (body.includes('this.profileStore.initial') && body.includes('G.HonroApp=')) {
      // Pages excludes shared/. Publish these exact native sources in the same boot order.
      for (const name of ['profile-store','objectives','mission','main']) {
        if (name==='main') modules.push('topview/src/install.mjs');
        modules.push(await emit('native-'+name, await read('shared/runtime/'+name+'.js')));
      }
      apps++;
      break;
    }
    modules.push(file);
  }
  if (cores!==1 || projects!==1 || apps!==1) throw Error('Native module ownership changed');
  const metadata={modules,styles:manifest.styles,nativeEntry:manifest.gameEntry};
  await writeGenerated(path.join(out,'native.json'),JSON.stringify(metadata,null,2)+'\n');
  const template = await read('topview/index.html');
  if (!template.includes('<base href="../">')) throw Error('Missing topview entry base');
  const publicHtml = template.replace('<base href="../">','<base href="./">');
  for (const entry of ['index.html','HONRO.html']) await writeGenerated(path.join(root,entry),publicHtml);
  const live = new Set([...modules,loader].map(file => path.basename(file)));
  for (const file of await fs.readdir(out)) {
    if (/^(core|chapter|campaign-loader|native-profile-store|native-objectives|native-mission|native-main)\.[a-f0-9]{16}\.mjs$/.test(file) && !live.has(file)) await fs.unlink(path.join(out,file));
  }
  console.log('Topview chapter ready, '+modules.length+' native/adapter modules');
  return publicHtml;
}
if (process.argv[1] && import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href) await buildTopview();
