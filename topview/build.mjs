import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
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
// Use the original first-paint markup, responsive paintings, ink logo and startup controller.
async function titleShell(manifest, base) {
  const packet = manifest.files.find(f => /^web\/data\/HONRO_TITLE_ART\.[a-f0-9]+\.json$/.test(f.path));
  const assets = JSON.parse(await read(packet.path));
  const art = Object.fromEntries(Object.entries(assets).map(([key,value]) => [key,value.$honroAsset]));
  const context = vm.createContext({});
  vm.runInContext(await read('game/vendor/ui/fa.js'),context);
  vm.runInContext(await read('shared/runtime/title-markup.js'),context);
  const markup = context.HonroTitleMarkup.render({scene:context.HonroTitleMarkup.scene(art),logo:art.logo,hanja:art.hanja,loading:true,settingsIcon:context.HonroFA.icon('gear','',19)});
  const body = (await read('game/templates/body.html')).replace('<!--HONRO_STARTUP_TITLE-->',markup);
  const preloads = [['landscape','(orientation: landscape)'],['portrait','(orientation: portrait)'],['logo',''],['hanja','']].map(([key,media]) => `<link rel="preload" as="image" href="${art[key]}"${media?' media="'+media+'"':''} fetchpriority="high">`).join('');
  return `<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><base href="${base}"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover"><meta name="theme-color" content="#101b20"><title>혼로 · HONRO</title><style>${await read('game/src/title.css')}</style>${preloads}<link rel="stylesheet" href="topview/style.css"></head>${body}<script>${await read('shared/runtime/startup-shell.js')}</script><script type="module" src="topview/src/boot.mjs"></script></body></html>
`;
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
      for (const name of ['profile-store','objectives','mission','combat-feedback','main']) {
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
  const publicHtml = await titleShell(manifest,'./');
  await writeGenerated(path.join(here,'index.html'),publicHtml.replace('<base href="./">','<base href="../">'));
  for (const entry of ['index.html','HONRO.html']) await writeGenerated(path.join(root,entry),publicHtml);
  const live = new Set([...modules,loader].map(file => path.basename(file)));
  for (const file of await fs.readdir(out)) {
    if (/^(core|chapter|campaign-loader|native-combat-feedback|native-profile-store|native-objectives|native-mission|native-main)\.[a-f0-9]{16}\.mjs$/.test(file) && !live.has(file)) await fs.unlink(path.join(out,file));
  }
  console.log('Topview chapter ready, '+modules.length+' native/adapter modules');
  return publicHtml;
}
if (process.argv[1] && import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href) await buildTopview();
