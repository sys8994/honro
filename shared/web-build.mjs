import {packJson,unpackJson} from './json-pool.mjs';
import {readFile,mkdir,unlink} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {root,runtimeEntries,projectAuthors} from './build.mjs';
import {writeGenerated} from './write-generated.mjs';
import sharp from 'sharp';
import {minify} from 'terser';
import {planWebAssetRetention,selectPublishedGenerations,publishedRetention} from './web-retention.mjs';

const read=async p=>(await readFile(path.join(root,p),'utf8')).replace(/\r\n/g,'\n');
const hash=body=>createHash('sha256').update(body).digest('hex');
const quote=JSON.stringify;
const gameStyles=['game/vendor/ui/arcfall-layout.css','game/vendor/style.css',...['hud','presentation','controls','unit-info','training','guide','skill-presentation','journey','title','fonts','act3-void','act-endings','skill-icons','clear-report'].map(n=>`game/src/${n}.css`)];
const vectorGlobals=new Set(['shared/assets/party/party.runtime.js','shared/assets/monsters/monsters.runtime.js','shared/assets/actors/actors.runtime.js']);
const cssTag=file=>`<link rel="stylesheet" href="${file}">`;
const scriptTag=file=>`<script type="module" src="${file}"></script>`;
const relative=(from,to)=>{const p=path.posix.relative(path.posix.dirname(from),to);return p.startsWith('.')?p:'./'+p;};
const urlExpression=(from,to)=>`new URL(${quote(relative(from,to))},import.meta.url).href`;

// Plain runtime scripts communicate through explicit globals. Keep their module
// scope isolated and their patch order exact, including the existing yields.
// Async data modules remain separate barriers; never Promise.all their imports.
export function orderedScriptSource(entries,loader){
  return `import {yieldIfNeeded} from ${quote(loader)};\n`+entries.map(entry=>{
    const isolated=`(()=>{\n'use strict';\n${entry.code}\n})();\n`;
    new vm.Script(isolated,{filename:entry.name}); // Reject module syntax/TLA here.
    return `// ${entry.name}\n${isolated}await yieldIfNeeded();\n`;
  }).join('');
}

export {planWebAssetRetention} from './web-retention.mjs';

// Generated files are immutable by content. Stable HTML names remain the public entrypoints.
export async function buildWeb({vector=true,destination=path.join(root,'HONRO.html')}={}) {
  let previous;try{previous=JSON.parse(await read('web/manifest.json'));}catch(e){if(e.code!=='ENOENT')throw e;}
  const retentionNow=Date.now(),publishedGenerations=selectPublishedGenerations(previous?.publishedGenerations,{now:retentionNow});
  // A build must fail before cleanup if a retained original is unavailable or changed.
  for(const g of publishedGenerations)for(const file of g.files){const bytes=await readFile(path.join(root,file.path));if(bytes.length!==file.bytes||hash(bytes)!==file.sha256)throw Error('Retained immutable asset mismatch: '+file.path);}
  const files=new Map();
  async function emit(folder,name,extension,body){
    // Strip comments/whitespace only. Keep names, statements and patch order;
    // do not fold expressions, mangle properties or move execution boundaries.
    if(extension==='js'&&(folder==='runtime'||folder==='entries')){
      body=(await minify(body,{module:true,compress:false,mangle:false,format:{comments:false}})).code+'\n';
    }
    const bytes=Buffer.isBuffer(body)?body:Buffer.from(body),sha256=hash(bytes);
    const stem=name.replace(/\.[cm]?js$/,'').replace(/[^a-zA-Z0-9_-]+/g,'-');
    const file=`web/${folder}/${stem}.${sha256.slice(0,16)}.${extension}`;
    await mkdir(path.dirname(path.join(root,file)),{recursive:true});
    // writeGenerated compares UTF-8; binary art must retain its exact bytes.
    if(!files.has(file)){
      if(Buffer.isBuffer(body)){
        const {writeFile}=await import('node:fs/promises');
        let same=false;try{same=(await readFile(path.join(root,file))).equals(bytes);}catch(e){if(e.code!=='ENOENT')throw e;}
        if(!same)await writeFile(path.join(root,file),bytes);
      }else await writeGenerated(path.join(root,file),body);
      files.set(file,{path:file,bytes:bytes.length,sha256});
    }
    return file;
  }
  const json=(name,value)=>emit('data',name,'json',JSON.stringify(value)+'\n');
  function assetPaths(value){const paths=[],at=[];const visit=node=>{if(!node||typeof node!=='object')return;if(node.$honroAsset){paths.push([...at]);return;}for(const key in node)if(node[key]&&typeof node[key]==='object'){at.push(Array.isArray(node)?Number(key):key);visit(node[key]);at.pop();}};visit(value);return paths;}
  async function externalize(value,name){
    if(typeof value==='string'){
      const data=/^data:(image\/[\w+.-]+|audio\/(?:mpeg|wav));base64,([\s\S]+)$/.exec(value);
      if(data){const ext={'image/svg+xml':'svg','image/jpeg':'jpg','image/png':'png','image/webp':'webp','audio/mpeg':'mp3','audio/wav':'wav'}[data[1]];assert(ext,'Supported image data URI');return {$honroAsset:await emit('graphics',name,ext,Buffer.from(data[2],'base64'))};}
      return value;
    }
    if(Array.isArray(value))return Promise.all(value.map((v,i)=>externalize(v,`${name}-${i}`)));
    if(value&&typeof value==='object')return Object.fromEntries(await Promise.all(Object.entries(value).map(async([k,v])=>[k,await externalize(v,`${name}-${k}`)])));
    return value;
  }
  const loader=await emit('runtime','load-data','js',(await read('shared/web-loader.js')).replace('/* JSON_POOL_DECODER */',unpackJson.toString()));
  // All runtime modules live in the same directory, including content-hashed data loaders.
  const loaderImport=`import {loadData,loadProject} from ${quote('./'+path.posix.basename(loader))};\n`;
  const moduleData=new Map();
  const dataModule=async(name,values)=>{
    const records=[];
    for(const [global,value]of Object.entries(values)){const external=await externalize(value,global.toLowerCase());records.push([global,await json(global,external),assetPaths(external)]);}
    const file=await emit('runtime',name,'js',loaderImport+records.map(([global,file,refs])=>`globalThis.${global}=await loadData(${quote(file)},${quote(refs)},${quote({svgSources:global==='HONRO_ACT1_FAR_DATA'})});`).join('\n')+'\n');
    moduleData.set(file,records.map(([,file])=>file));return file;
  };
  const entries=await runtimeEntries({vector,app:true}),common=[],gameOnly=[],optionalModules={};
  const appStart=entries.findIndex(e=>e.name==='game/vendor/ui/fa.js');
  assert(appStart>0,'Game application boundary required');
  let projectManifest,pending=[],pendingBytes=0,groupNumber=0;
  async function flushScripts(target){
    if(!pending.length)return;
    target.push(await emit('runtime',`ordered-${target===common?'common':'game'}-${++groupNumber}`,'js',orderedScriptSource(pending,'./'+path.posix.basename(loader))));
    pending=[];pendingBytes=0;
  }
  for(let i=0;i<entries.length;i++){
    const entry=entries[i],target=i<appStart?common:gameOnly;let file;
    if(entry.global==='HONRO_WATERWORKS_V2'){
      const group=entries.slice(i,i+4);
      assert.deepEqual(group.map(e=>e.global),['HONRO_WATERWORKS_V2','HONRO_NARRATIVE_CATALOGUE','HONRO_NARRATIVE_COMPAT','HONRO_STAGE_CONTRACTS']);
      await flushScripts(target);
      const value=await externalize(Object.fromEntries(group.map(e=>[e.global,e.data])),'narrative-data');
      const packet=await json('narrative-data',packJson(value));
      file=await emit('runtime','narrative-data','js',loaderImport+`Object.assign(globalThis,await loadData(${quote(packet)},${quote(assetPaths(value))},{jsonPool:true}));\n`);
      moduleData.set(file,[packet]);target.push(file);i+=3;continue;
    }
    if(entry.global==='HONRO_JOURNEY_MAPS'){
      for(const act of entry.data.acts)act.url={$honroAsset:await emit('graphics',`journey-map-act${act.act}`,'webp',await readFile(path.join(root,act.asset)))};
    }
    if(entry.global==='HONRO_SKILL_ICON_MANIFEST'){
      for(const [id,item]of Object.entries(entry.data.icons)){
        // Emit only supplied files. URL hydration does not fetch the image.
        item.url=item.status==='ready'?{$honroAsset:await emit('graphics',`skill-icon-${id}`,'webp',await readFile(path.join(root,item.file)))}:null;
      }
    }
    if(entry.name==='shared/runtime/act-endings-content.js'){
      // Resolve art at build time, without fetching it at startup. Missing
      // parent-supplied portraits retain the existing landscape presentation.
      const context={HONRO_ACT_ENDINGS:JSON.parse(await read('shared/data/narrative-current.json')).actEndings};
      for(const [stage,ending]of Object.entries(context.HONRO_ACT_ENDINGS)){
        for(const key of ['image','portraitImage']){
          const source=ending[key];if(!source)continue;
          let bytes;try{bytes=await readFile(path.join(root,source));}catch(error){
            if(key!=='portraitImage'||error.code!=='ENOENT')throw error;
            ending[key]=null;continue;
          }
          ending[key]=await emit('graphics',`ending-${stage}-${key}`,'webp',bytes);
        }
      }
      entry.code=`globalThis.HONRO_ACT_ENDINGS=${quote(context.HONRO_ACT_ENDINGS)};`;
    }
    if(i===appStart)await flushScripts(common);
    if(entry.optional){
      await flushScripts(target);
      const file=await emit('runtime',entry.name,'js',entry.code+'\n');
      optionalModules[entry.optional]={file,global:entry.optional==='training'?'HonroTraining':'HonroSkillPreview'};
      target.push(file);continue;
    }
    // These two scripts also have independent title/Workshop consumers.
    const independent=entry.name==='shared/runtime/title-markup.js'||entry.name==='shared/runtime/stage-rules.js';
    if(!entry.project&&!entry.global&&!vectorGlobals.has(entry.name)&&!independent){
      const bytes=Buffer.byteLength(entry.code);
      if(pendingBytes+bytes>192*1024)await flushScripts(target);
      pending.push(entry);pendingBytes+=bytes;continue;
    }
    await flushScripts(target);
    if(entry.project){
      const {library,stages,...base}=entry.project;
      const externalLibrary=await externalize(library,'library');
      // Dependency closure includes placements and asset references nested inside assets.
      // Shared assets are one bounded bundle; each chapter owns its remaining closure.
      const byId=new Map(externalLibrary.map(asset=>[asset.id,asset]));
      function dependencies(value,found=new Set()){
        if(typeof value==='string'&&byId.has(value)&&!found.has(value)){
          found.add(value);for(const [key,child]of Object.entries(byId.get(value)))if(key!=='id')dependencies(child,found);
        }else if(value&&typeof value==='object')for(const child of Object.values(value))dependencies(child,found);
        return found;
      }
      const needed=stages.map(stage=>dependencies(stage)),shared=new Set(externalLibrary.filter(asset=>needed.filter(ids=>ids.has(asset.id)).length>=2).map(asset=>asset.id));
      const sharedAssets=externalLibrary.filter(asset=>shared.has(asset.id));
      const manifest={base:await json('campaign-base',base),library:await json('campaign-library',externalLibrary),stages:[],unitTemplates:stages.flatMap(stage=>stage.units.filter(unit=>unit.kind?.startsWith('boss:'))).filter((unit,index,all)=>all.findIndex(other=>other.kind===unit.kind)===index),catalog:stages.map(stage=>({id:stage.id,name:stage.name,width:stage.width,height:stage.height,backdrop:stage.backdrop,metadata:stage.metadata,pending:true})),shared:await json('campaign-shared',sharedAssets),stageLibraries:[],assetPaths:{base:assetPaths(base),library:assetPaths(externalLibrary),stages:[],shared:assetPaths(sharedAssets),stageLibraries:[]}};
      for(let n=0;n<stages.length;n++){const stage=await externalize(stages[n],`chapter-${n+1}`);manifest.stages.push(await json('chapter-'+String(n+1).padStart(2,'0'),stage));manifest.assetPaths.stages.push(assetPaths(stage));const assets=externalLibrary.filter(asset=>needed[n].has(asset.id)&&!shared.has(asset.id));manifest.stageLibraries.push(await json('chapter-'+String(n+1).padStart(2,'0')+'-assets',assets));manifest.assetPaths.stageLibraries.push(assetPaths(assets));}
      projectManifest=await json('campaign',manifest);
      file=await emit('runtime','campaign','js',`import {loadCampaign} from ${quote('./'+path.posix.basename(loader))};\nglobalThis.HONRO_PROJECT=await loadCampaign(${quote(projectManifest)},[${projectAuthors.join(',')}],{full:globalThis.HONRO_PROJECT_MODE==='full'||globalThis.HONRO_EMBEDDED});\n`);
    }else if(entry.global){
      file=await dataModule(entry.name,{[entry.global]:entry.data});
    }else if(vectorGlobals.has(entry.name)){
      const context={};vm.runInNewContext(entry.code,context);
      // HONRO_ARCHER is an alias of the already loaded party asset, not a duplicate JSON.
      delete context.HONRO_ARCHER;
      file=await dataModule(entry.name,context);
      if(entry.name.includes('/party/')){const data=file;file=await emit('runtime','party-alias','js',`import ${quote('./'+path.posix.basename(data))};\nglobalThis.HONRO_ARCHER=globalThis.HONRO_PARTY.seol_o;\n`);moduleData.set(file,moduleData.get(data));}
    }else file=await emit('runtime',entry.name,'js',entry.code+'\n');
    target.push(file);
  }
  await flushScripts(gameOnly);
  const stageRules=gameOnly.find(file=>file.includes('shared-runtime-stage-rules.'));
  assert(stageRules,'Stage View rules required');
  const styles=[];for(const source of gameStyles)styles.push(await emit('styles',source.replace(/\.css$/,''),'css',await read(source)));
  const workshopStyle=await emit('styles','workshop','css',await read('workshop/src/style.css'));
  const art={};
  for(const [key,file]of Object.entries({landscape:'landscape.webp',portrait:'portrait.webp',landscapeFallback:'landscape.jpg',portraitFallback:'portrait.jpg',logo:'wordmark.png',hanja:'hanja-wordmark.png'})){
    let body=await readFile(path.join(root,'shared/assets/environment/title',file)),extension=path.extname(file).slice(1);
    if(key==='logo'||key==='hanja'){body=await sharp(body).resize({width:key==='hanja'?1200:660,withoutEnlargement:true}).webp({lossless:true,effort:6}).toBuffer();extension='webp';}
    art[key]={$honroAsset:await emit('graphics','title-'+key,extension,body)};
  }
  const stageArt={};for(let n=1;n<=10;n++)stageArt[n]={$honroAsset:await emit('graphics',`stage-${String(n).padStart(2,'0')}`,'jpg',await readFile(path.join(root,'assets/rc11',`stage-${String(n).padStart(2,'0')}.jpg`)))};
  const portraits=JSON.parse(await read('game/config/story-portraits.json'));
  for(const entry of Object.values(portraits)){
    if(entry.image)entry.src={$honroAsset:await emit('graphics','portrait-'+path.parse(entry.image).name,path.extname(entry.image).slice(1),await readFile(path.resolve(root,entry.image)))};
    // URLs are metadata only: portrait pixels are requested by visible UI, never title preload.
    for(const [expression,asset]of Object.entries(entry.approvedPortrait?.expressions||{}))if(asset.file)asset.src={$honroAsset:await emit('graphics',`portrait-${entry.approvedPortrait.id}-${expression}`,'webp',await readFile(path.resolve(root,asset.file)))};
  }
  const npcPortraits=JSON.parse(await read('game/config/npc-portraits.json'));
  for(const asset of Object.values(npcPortraits.assets)){asset.src={$honroAsset:await emit('graphics','npc-portrait-'+asset.id,'webp',await readFile(path.resolve(root,asset.file)))};for(const [id,variant]of Object.entries(asset.expressions||{}))if(variant.file&&variant.status!=='pending')variant.src={$honroAsset:await emit('graphics','npc-portrait-'+asset.id+'-'+id,'webp',await readFile(path.resolve(root,variant.file)))};}
  const titleData=await dataModule('game-art',{HONRO_TITLE_ART:art,HONRO_STAGE_INTRO_ART:stageArt,HONRO_STORY_PORTRAITS:portraits,HONRO_NPC_PORTRAITS:npcPortraits});
  const titleMarkup=common.find(file=>file.includes('shared-runtime-title-markup.'));
  assert(titleMarkup,'Shared first-paint title template required');
  const titleScene=await emit('runtime','title-scene','js',`import ${quote('./'+path.posix.basename(titleMarkup))};\nconst art=globalThis.HONRO_TITLE_ART;
globalThis.HONRO_TITLE_LOGO=art.logo;globalThis.HONRO_TITLE_HANJA=art.hanja;
globalThis.HONRO_TITLE_SCENE=globalThis.HonroTitleMarkup.scene(art);
`);
  async function bootstrap(name,modules,{game=false,playtest}={}){
    const placeholder=`web/entries/${name}.js`;
    const urls=modules.map(file=>urlExpression(placeholder,file));
    const dataHints=modules.filter(file=>moduleData.has(file)).map(file=>`[${urlExpression(placeholder,file)}]:${quote(moduleData.get(file))}`).join(',');
    const optionalSource=game?`globalThis.HONRO_OPTIONAL_MODULES={${Object.entries(optionalModules).map(([name,entry])=>`${quote(name)}:{url:${urlExpression(placeholder,entry.file)},global:${quote(entry.global)}}`).join(',')}};\n${await read('shared/runtime/optional-runtime-loader.js')}\n`:'';
    return emit('entries',name,'js',`import {prefetchProject,prefetchData,yieldIfNeeded} from ${quote(relative(placeholder,loader))};\n${game?"globalThis.HONRO_EMBEDDED=new URLSearchParams(location.search).get('embedded')==='1';\n":''}${playtest?'globalThis.HONRO_PROJECT_MODE="full";globalThis.HONRO_PLAYTEST_URL='+quote(playtest)+';\n':''}${optionalSource}const modules=[${urls.join(',\n')}].filter(file=>!${game}||globalThis.HONRO_EMBEDDED||globalThis.HONRO_PROJECT_MODE==='full'||!Object.values(globalThis.HONRO_OPTIONAL_MODULES).some(entry=>entry.url===file));
globalThis.HONRO_READY=(async()=>{try{
${game?`let styleError;const stylesReady=Promise.all(${quote(styles)}.map(file=>new Promise((resolve,reject)=>{const link=document.createElement('link');link.rel='stylesheet';link.href=new URL('../../'+file,import.meta.url).href;link.onload=resolve;link.onerror=()=>reject(Error('Style load failed: '+file));document.head.append(link);}))).catch(error=>{styleError=error;});`:''}
// Start bounded network work while the title paints; execute only after firstPaint.
const dataHints={${dataHints}},preloaded=new Set();
if(!globalThis.HONRO_EMBEDDED&&globalThis.HONRO_PROJECT_MODE!=='full')prefetchProject(${quote(projectManifest)});
for(let i=0;i<modules.length;i++){
 for(let n=i;n<Math.min(modules.length,i+12);n++){const href=modules[n];if(preloaded.has(href))continue;preloaded.add(href);prefetchData(dataHints[href]||[]);const link=document.createElement('link');link.rel='modulepreload';link.href=href;link.fetchPriority='low';document.head.append(link);}
 ${game?'if(i===0)await globalThis.HonroStartup?.firstPaint();if(i===modules.length-1){await stylesReady;if(styleError)throw styleError;}':''}
 const file=modules[i];await import(file);globalThis.HonroStartup?.progress(file.includes('ordered-common')?'게임 규칙과 풍경 준비':file.includes('ordered-game')?'동행과 조작 준비':file.includes('game-art')||file.includes('title-')?'첫 화면 준비':'장소 자료 준비',i+1,modules.length);await yieldIfNeeded();
}
${game?"await globalThis.HONRO_APP_READY;globalThis.HonroStartup?.ready();\nif(location.hash==='#autostage2')HonroApp.launch(2);":''}}
catch(error){if(globalThis.HonroStartup)globalThis.HonroStartup.failed(error);else{const host=document.getElementById('app');if(host)host.textContent='불러오지 못했습니다. 새로고침해 주세요.';}throw error;}})();
`);
  }
  const gameEntry=await bootstrap('game',[titleData,titleScene,...common,...gameOnly],{game:true});
  const shell=await read('game/templates/body.html'),criticalStyle=await read('game/src/title.css'),startup=await read('shared/runtime/startup-shell.js');
  const titleContext=vm.createContext({});vm.runInContext(entries.find(e=>e.name==='game/vendor/ui/fa.js').code,titleContext);vm.runInContext(await read('shared/runtime/title-markup.js'),titleContext);
  const titleArt=Object.fromEntries(Object.entries(art).map(([key,value])=>[key,value.$honroAsset]));
  const initialTitle=titleContext.HonroTitleMarkup.render({scene:titleContext.HonroTitleMarkup.scene(titleArt),logo:titleArt.logo,hanja:titleArt.hanja,loading:true,settingsIcon:titleContext.HonroFA.icon('gear','',19)});
  const imagePreloads=[['landscape','(orientation: landscape)'],['portrait','(orientation: portrait)'],['logo',''],['hanja','']].map(([key,media])=>`<link rel="preload" as="image" href="${titleArt[key]}"${media?` media="${media}"`:''} fetchpriority="high">`).join('');
  const gameHtml=(base='',embedded=false)=>`<!doctype html>\n<html lang="ko"><head><meta charset="utf-8">${base}<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover"><meta name="theme-color" content="#101b20"><title>혼로 · HONRO</title><script>globalThis.HONRO_EMBEDDED=new URLSearchParams(location.search).get('embedded')==='1';if(HONRO_EMBEDDED)document.documentElement.classList.add('honro-embedded');</script><style>${criticalStyle}</style>${embedded?'':imagePreloads}</head>${shell.replace('<!--HONRO_STARTUP_TITLE-->',embedded?'':initialTitle)}${embedded?'':`<script>${startup}</script>`}${scriptTag(gameEntry)}</body></html>\n`;
  const gameDocument=await emit('entries','game','html',gameHtml('<base href="../../">',true));
  const editorModule=await emit('runtime','workshop-app','js',await read('workshop/src/app.js'));
  const workshopEntry=await bootstrap('workshop',[...common,stageRules,editorModule],{playtest:gameDocument+'?embedded=1'});
  const workshopHtml=(await read('workshop/src/index.html')).replace('<style>/*STYLE*/</style>',cssTag(workshopStyle)).replace('<script>/*SCRIPT*/</script>',scriptTag(workshopEntry));
  await writeGenerated(destination,gameHtml());
  await writeGenerated(path.join(root,'index.html'),gameHtml());
  await writeGenerated(path.join(root,'HONRO_WORKSHOP.html'),workshopHtml);
  await writeGenerated(path.join(root,'workshop/HONRO_MAP_WORKSHOP.html'),'<!doctype html><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=../HONRO_WORKSHOP.html"><a href="../HONRO_WORKSHOP.html">HONRO Workshop</a>');
  const currentFiles=[...files.values()].sort((a,b)=>a.path.localeCompare(b.path));
  const {previousFiles,previousGenerations,obsoleteFiles}=planWebAssetRetention(previous,currentFiles,{now:retentionNow});
  const manifest={version:1,game:'HONRO.html',workshop:'HONRO_WORKSHOP.html',playtest:gameDocument+'?embedded=1',project:projectManifest,gameEntry,workshopEntry,common,gameOnly,optionalModules,styles,workshopStyle,files:currentFiles,previousFiles,previousGenerations,publishedRetention,publishedGenerations};
  await writeGenerated(path.join(root,'web/manifest.json'),JSON.stringify(manifest,null,2)+'\n');
  for(const file of obsoleteFiles)try{await unlink(path.join(root,file.path));}catch(e){if(e.code!=='ENOENT')throw e;}
  await mkdir(path.join(root,'_local/reports/web-split'),{recursive:true});
  const summary={gameBytes:Buffer.byteLength(gameHtml()),workshopBytes:Buffer.byteLength(workshopHtml),files:files.size,playtest:manifest.playtest};
  await writeGenerated(path.join(root,'_local/reports/web-split/build.json'),JSON.stringify(summary,null,2)+'\n');
  console.log(JSON.stringify(summary));
  return gameHtml();
}
