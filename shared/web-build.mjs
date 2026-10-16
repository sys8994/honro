import {readFile,mkdir,unlink} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {root,runtimeEntries,authorProjectExpression} from './build.mjs';
import {writeGenerated} from './write-generated.mjs';

const read=async p=>(await readFile(path.join(root,p),'utf8')).replace(/\r\n/g,'\n');
const hash=body=>createHash('sha256').update(body).digest('hex');
const quote=JSON.stringify;
const gameStyles=['game/vendor/ui/arcfall-layout.css','game/vendor/style.css',...['hud','presentation','controls','unit-info','training','guide','skill-presentation','journey','title','fonts','act3-void'].map(n=>`game/src/${n}.css`)];
const vectorGlobals=new Set(['shared/assets/party/party.runtime.js','shared/assets/monsters/monsters.runtime.js','shared/assets/actors/actors.runtime.js']);
const cssTag=file=>`<link rel="stylesheet" href="${file}">`;
const scriptTag=file=>`<script type="module" src="${file}"></script>`;
const relative=(from,to)=>{const p=path.posix.relative(path.posix.dirname(from),to);return p.startsWith('.')?p:'./'+p;};
const urlExpression=(from,to)=>`new URL(${quote(relative(from,to))},import.meta.url).href`;

// Generated files are immutable by content. Stable HTML names remain the public entrypoints.
export async function buildWeb({vector=true,destination=path.join(root,'HONRO.html')}={}) {
  let previous;try{previous=JSON.parse(await read('web/manifest.json'));}catch(e){if(e.code!=='ENOENT')throw e;}
  const files=new Map();
  async function emit(folder,name,extension,body){
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
  async function externalize(value,name){
    if(typeof value==='string'){
      const data=/^data:(image\/[\w+.-]+);base64,([\s\S]+)$/.exec(value);
      if(data){const ext={'image/svg+xml':'svg','image/jpeg':'jpg','image/png':'png','image/webp':'webp'}[data[1]];assert(ext,'Supported image data URI');return {$honroAsset:await emit('graphics',name,ext,Buffer.from(data[2],'base64'))};}
      return value;
    }
    if(Array.isArray(value))return Promise.all(value.map((v,i)=>externalize(v,`${name}-${i}`)));
    if(value&&typeof value==='object')return Object.fromEntries(await Promise.all(Object.entries(value).map(async([k,v])=>[k,await externalize(v,`${name}-${k}`)])));
    return value;
  }
  const loader=await emit('runtime','load-data','js',`const root=new URL('../../',import.meta.url);
const requests=new Map();
function request(file,text=false){const url=new URL(file,root).href,key=url+'|'+text;if(!requests.has(key))requests.set(key,fetch(url).then(response=>{if(!response.ok)throw Error('Load failed: '+response.status+' '+url);return text?response.text():response.json();}));return requests.get(key);}
async function hydrate(value){if(!value||typeof value!=='object')return value;if(value.$honroAsset){const url=new URL(value.$honroAsset,root).href;if(value.$honroAsset.endsWith('.svg')){globalThis.HONRO_SVG_SOURCES??=Object.create(null);globalThis.HONRO_SVG_SOURCES[url]=await request(value.$honroAsset,true);}return url;}if(Array.isArray(value))return Promise.all(value.map(hydrate));return Object.fromEntries(await Promise.all(Object.entries(value).map(async([k,v])=>[k,await hydrate(v)])));}
export async function loadData(file){return hydrate(await request(file));}
export async function loadProject(file){const manifest=await request(file);const [base,library,stages]=await Promise.all([loadData(manifest.base),loadData(manifest.library),Promise.all(manifest.stages.map(loadData))]);return {...base,library,stages};}
`);
  // All runtime modules live in the same directory, including content-hashed data loaders.
  const loaderImport=`import {loadData,loadProject} from ${quote('./'+path.posix.basename(loader))};\n`;
  const dataModule=async(name,values)=>{
    const records=[];
    for(const [global,value]of Object.entries(values))records.push([global,await json(global,await externalize(value,global.toLowerCase()))]);
    return emit('runtime',name,'js',loaderImport+records.map(([global,file])=>`globalThis.${global}=await loadData(${quote(file)});`).join('\n')+'\n');
  };
  const entries=await runtimeEntries({vector,app:true}),common=[],gameOnly=[];
  const appStart=entries.findIndex(e=>e.name==='game/vendor/ui/fa.js');
  assert(appStart>0,'Game application boundary required');
  let projectManifest;
  for(let i=0;i<entries.length;i++){
    const entry=entries[i];let file;
    if(entry.project){
      const {library,stages,...base}=entry.project;
      const manifest={base:await json('campaign-base',base),library:await json('campaign-library',await externalize(library,'library')),stages:[]};
      for(let n=0;n<stages.length;n++)manifest.stages.push(await json('chapter-'+String(n+1).padStart(2,'0'),await externalize(stages[n],`chapter-${n+1}`)));
      projectManifest=await json('campaign',manifest);
      file=await emit('runtime','campaign','js',loaderImport+`globalThis.HONRO_PROJECT=${authorProjectExpression('await loadProject('+quote(projectManifest)+')')};\n`);
    }else if(entry.global){
      file=await dataModule(entry.name,{[entry.global]:entry.data});
    }else if(vectorGlobals.has(entry.name)){
      const context={};vm.runInNewContext(entry.code,context);
      // HONRO_ARCHER is an alias of the already loaded party asset, not a duplicate JSON.
      delete context.HONRO_ARCHER;
      file=await dataModule(entry.name,context);
      if(entry.name.includes('/party/'))file=await emit('runtime','party-alias','js',`import ${quote('./'+path.posix.basename(file))};\nglobalThis.HONRO_ARCHER=globalThis.HONRO_PARTY.seol_o;\n`);
    }else file=await emit('runtime',entry.name,'js',entry.code+'\n');
    (i<appStart?common:gameOnly).push(file);
  }
  const stageRules=gameOnly[entries.slice(appStart).findIndex(e=>e.name==='shared/runtime/stage-rules.js')];
  assert(stageRules,'Stage View rules required');
  const styles=[];for(const source of gameStyles)styles.push(await emit('styles',source.replace(/\.css$/,''),'css',await read(source)));
  const workshopStyle=await emit('styles','workshop','css',await read('workshop/src/style.css'));
  const art={};
  for(const [key,file]of Object.entries({landscape:'landscape.webp',portrait:'portrait.webp',landscapeFallback:'landscape.jpg',portraitFallback:'portrait.jpg',logo:'wordmark.png',hanja:'hanja-wordmark.png'}))art[key]={$honroAsset:await emit('graphics','title-'+key,path.extname(file).slice(1),await readFile(path.join(root,'shared/assets/environment/title',file)))};
  const stageArt={};for(let n=1;n<=10;n++)stageArt[n]={$honroAsset:await emit('graphics',`stage-${String(n).padStart(2,'0')}`,'jpg',await readFile(path.join(root,'assets/rc11',`stage-${String(n).padStart(2,'0')}.jpg`)))};
  const portraits=JSON.parse(await read('game/config/story-portraits.json'));
  for(const entry of Object.values(portraits))if(entry.image)entry.src={$honroAsset:await emit('graphics','portrait-'+path.parse(entry.image).name,path.extname(entry.image).slice(1),await readFile(path.resolve(root,entry.image)))};
  const titleData=await dataModule('game-art',{HONRO_TITLE_ART:art,HONRO_STAGE_INTRO_ART:stageArt,HONRO_STORY_PORTRAITS:portraits});
  const titleScene=await emit('runtime','title-scene','js',`const art=globalThis.HONRO_TITLE_ART;
globalThis.HONRO_TITLE_LOGO=art.logo;globalThis.HONRO_TITLE_HANJA=art.hanja;
globalThis.HONRO_TITLE_SCENE=\`<picture class="title-painting"><source media="(orientation: portrait)" type="image/webp" srcset="\${art.portrait}"><source media="(orientation: portrait)" type="image/jpeg" srcset="\${art.portraitFallback}"><source type="image/webp" srcset="\${art.landscape}"><img src="\${art.landscapeFallback}" alt="" decoding="async" fetchpriority="high" onerror="this.hidden=true"></picture>\`;
`);
  async function bootstrap(name,modules,{game=false,playtest}={}){
    const placeholder=`web/entries/${name}.js`;
    const urls=modules.map(file=>urlExpression(placeholder,file));
    return emit('entries',name,'js',`${game?"globalThis.HONRO_EMBEDDED=new URLSearchParams(location.search).get('embedded')==='1';\n":''}${playtest?'globalThis.HONRO_PLAYTEST_URL='+quote(playtest)+';\n':''}const modules=[${urls.join(',\n')}];
for(const href of modules){const link=document.createElement('link');link.rel='modulepreload';link.href=href;document.head.append(link);}
globalThis.HONRO_READY=(async()=>{try{for(const file of modules)await import(file);${game?"\nif(location.hash==='#autostage2')HonroApp.launch(2);":''}}
catch(error){const host=document.getElementById('app');if(host)host.textContent='불러오지 못했습니다. 새로고침해 주세요.';throw error;}})();
`);
  }
  const gameEntry=await bootstrap('game',[titleData,titleScene,...common,...gameOnly],{game:true});
  const shell=await read('game/templates/body.html');
  const gameHtml=(base='')=>`<!doctype html>\n<html lang="ko"><head><meta charset="utf-8">${base}<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover"><meta name="theme-color" content="#101b20"><title>혼로 · HONRO</title>${styles.map(cssTag).join('')}</head>${shell}${scriptTag(gameEntry)}</body></html>\n`;
  const gameDocument=await emit('entries','game','html',gameHtml('<base href="../../">'));
  const editorModule=await emit('runtime','workshop-app','js',await read('workshop/src/app.js'));
  const workshopEntry=await bootstrap('workshop',[...common,stageRules,editorModule],{playtest:gameDocument+'?embedded=1'});
  const workshopHtml=(await read('workshop/src/index.html')).replace('<style>/*STYLE*/</style>',cssTag(workshopStyle)).replace('<script>/*SCRIPT*/</script>',scriptTag(workshopEntry));
  await writeGenerated(destination,gameHtml());
  await writeGenerated(path.join(root,'HONRO_WORKSHOP.html'),workshopHtml);
  await writeGenerated(path.join(root,'workshop/HONRO_MAP_WORKSHOP.html'),'<!doctype html><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=../HONRO_WORKSHOP.html"><a href="../HONRO_WORKSHOP.html">HONRO Workshop</a>');
  const manifest={version:1,game:'HONRO.html',workshop:'HONRO_WORKSHOP.html',playtest:gameDocument+'?embedded=1',project:projectManifest,gameEntry,workshopEntry,common,gameOnly,styles,workshopStyle,files:[...files.values()].sort((a,b)=>a.path.localeCompare(b.path))};
  await writeGenerated(path.join(root,'web/manifest.json'),JSON.stringify(manifest,null,2)+'\n');
  for(const file of previous?.files||[])if(!files.has(file.path)&&/^web\/(runtime|entries|data|styles|graphics)\/[\w.-]+$/.test(file.path))try{await unlink(path.join(root,file.path));}catch(e){if(e.code!=='ENOENT')throw e;}
  await mkdir(path.join(root,'_local/reports/web-split'),{recursive:true});
  const summary={gameBytes:Buffer.byteLength(gameHtml()),workshopBytes:Buffer.byteLength(workshopHtml),files:files.size,playtest:manifest.playtest};
  await writeGenerated(path.join(root,'_local/reports/web-split/build.json'),JSON.stringify(summary,null,2)+'\n');
  console.log(JSON.stringify(summary));
  return gameHtml();
}
