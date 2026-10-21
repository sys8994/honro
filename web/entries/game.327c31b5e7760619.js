import {prefetchProject,prefetchData,yieldIfNeeded} from "../runtime/load-data.0a232e94ad0af727.js";
globalThis.HONRO_EMBEDDED=new URLSearchParams(location.search).get('embedded')==='1';
globalThis.HONRO_OPTIONAL_MODULES={"training":{url:new URL("../runtime/shared-runtime-training.3a315db50d1e4073.js",import.meta.url).href,global:"HonroTraining"},"skill-preview":{url:new URL("../runtime/shared-runtime-skill-preview.d6f92d54c62d72b0.js",import.meta.url).href,global:"HonroSkillPreview"}};
(function(G){'use strict';
// Embedded/full pages already execute these scripts in their original order.
// Game requests them only on use; an unsuccessful module URL needs a new retry
// query because browsers remember failed dynamic imports for that exact URL.
const pending=new Map(),failures=new Map();
G.HonroOptionalRuntime={load(name){
 const entry=G.HONRO_OPTIONAL_MODULES[name];
 if(!entry)return Promise.reject(Error('Unknown optional runtime '+name));
 if(G[entry.global])return Promise.resolve(G[entry.global]);
 if(pending.has(name))return pending.get(name);
 const url=new URL(entry.url),attempt=failures.get(name)||0;
 if(attempt)url.searchParams.set('honroRetry',attempt);
 const task=import(url.href).then(()=>{
  if(!G[entry.global])throw Error('Optional runtime did not register '+name);
  return G[entry.global];
 }).catch(error=>{if(pending.get(name)===task)pending.delete(name);failures.set(name,attempt+1);throw error;});
 pending.set(name,task);return task;
}};
})(globalThis);

const modules=[new URL("../runtime/game-art.ad9d8e1a32bcae4f.js",import.meta.url).href,
new URL("../runtime/title-scene.b7038b215c94d974.js",import.meta.url).href,
new URL("../runtime/ordered-common-1.34ccbd385cc5a8c6.js",import.meta.url).href,
new URL("../runtime/shared-runtime-title-markup.c70d54ab71314be8.js",import.meta.url).href,
new URL("../runtime/HONRO_BGM_TRACKS.076b094ee031e182.js",import.meta.url).href,
new URL("../runtime/ordered-common-2.6980ba5fcf1d445d.js",import.meta.url).href,
new URL("../runtime/ordered-common-3.1aaee3a3d90610e4.js",import.meta.url).href,
new URL("../runtime/HONRO_BALANCE.de30fc1f735f1813.js",import.meta.url).href,
new URL("../runtime/HONRO_NARRATIVE_V0.3af6dde531c0f25a.js",import.meta.url).href,
new URL("../runtime/HONRO_SPLIT_V1.9da54103e545d993.js",import.meta.url).href,
new URL("../runtime/HONRO_OPEN_STRUCTURES.62d3e81d0c736881.js",import.meta.url).href,
new URL("../runtime/HONRO_WATERWORKS_V2.0d993a6bc18f95b2.js",import.meta.url).href,
new URL("../runtime/ordered-common-4.187079f2bf4cbe8c.js",import.meta.url).href,
new URL("../runtime/ordered-common-5.2ac44ba074d2bf54.js",import.meta.url).href,
new URL("../runtime/ordered-common-6.d6a13c388886465a.js",import.meta.url).href,
new URL("../runtime/ordered-common-7.f5970d9a4f568cad.js",import.meta.url).href,
new URL("../runtime/ordered-common-8.f3e8300c9b9f7cb6.js",import.meta.url).href,
new URL("../runtime/campaign.44bb50b7b517778d.js",import.meta.url).href,
new URL("../runtime/ordered-common-9.793a4fc99b4da026.js",import.meta.url).href,
new URL("../runtime/party-alias.6caa7e596c841bd5.js",import.meta.url).href,
new URL("../runtime/ordered-common-10.49e89ebb8fab9ddc.js",import.meta.url).href,
new URL("../runtime/HONRO_ACT1_FAR_DATA.048c5929000e14e1.js",import.meta.url).href,
new URL("../runtime/HONRO_ACT2_FAR_DATA.dda20ab5b64de4d7.js",import.meta.url).href,
new URL("../runtime/HONRO_REST_BACKDROPS.8bbba14828b7fdef.js",import.meta.url).href,
new URL("../runtime/HONRO_STAGE21_PAINTED.00cd028b658b4d01.js",import.meta.url).href,
new URL("../runtime/HONRO_PAINTED_PILOTS.e6fc22316cab65d4.js",import.meta.url).href,
new URL("../runtime/HONRO_AUTHORED_FAR.58133f0eadb5855e.js",import.meta.url).href,
new URL("../runtime/shared-assets-monsters-monsters-runtime.fbe578de964ead07.js",import.meta.url).href,
new URL("../runtime/shared-assets-actors-actors-runtime.85c7f2345f217b35.js",import.meta.url).href,
new URL("../runtime/ordered-common-11.aace182f6e2eebc3.js",import.meta.url).href,
new URL("../runtime/ordered-common-12.ee4ed528d4784fc3.js",import.meta.url).href,
new URL("../runtime/ordered-common-13.f3afd8680a2020c2.js",import.meta.url).href,
new URL("../runtime/ordered-game-14.caed63494e1798a8.js",import.meta.url).href,
new URL("../runtime/shared-runtime-stage-rules.425c10ceb6d4b5ec.js",import.meta.url).href,
new URL("../runtime/ordered-game-15.c320ce81cf7c7400.js",import.meta.url).href,
new URL("../runtime/shared-runtime-training.3a315db50d1e4073.js",import.meta.url).href,
new URL("../runtime/shared-runtime-skill-preview.d6f92d54c62d72b0.js",import.meta.url).href,
new URL("../runtime/ordered-game-16.75111eca456c7dae.js",import.meta.url).href,
new URL("../runtime/ordered-game-17.4d4328819be60f93.js",import.meta.url).href].filter(file=>!true||globalThis.HONRO_EMBEDDED||globalThis.HONRO_PROJECT_MODE==='full'||!Object.values(globalThis.HONRO_OPTIONAL_MODULES).some(entry=>entry.url===file));
globalThis.HONRO_READY=(async()=>{try{
let styleError;const stylesReady=Promise.all(["web/styles/game-vendor-ui-arcfall-layout.1f32e36e2a18d5f7.css","web/styles/game-vendor-style.3661f7f5254538f8.css","web/styles/game-src-hud.24def713b6266561.css","web/styles/game-src-presentation.67f428fcefcc01d3.css","web/styles/game-src-controls.17c60131092f54c2.css","web/styles/game-src-unit-info.a60fa5389408ecc4.css","web/styles/game-src-training.14cb5dad15d2ff89.css","web/styles/game-src-guide.3d713683085e2ae7.css","web/styles/game-src-skill-presentation.9ec958bbd6c09493.css","web/styles/game-src-journey.ead378cd3458d2a3.css","web/styles/game-src-title.fce8cc484f3f2b0a.css","web/styles/game-src-fonts.9251c095ef93d0b1.css","web/styles/game-src-act3-void.bc0568cbc4ae56e4.css"].map(file=>new Promise((resolve,reject)=>{const link=document.createElement('link');link.rel='stylesheet';link.href=new URL('../../'+file,import.meta.url).href;link.onload=resolve;link.onerror=()=>reject(Error('Style load failed: '+file));document.head.append(link);}))).catch(error=>{styleError=error;});
// Start bounded network work while the title paints; execute only after firstPaint.
const dataHints={[new URL("../runtime/game-art.ad9d8e1a32bcae4f.js",import.meta.url).href]:["web/data/HONRO_TITLE_ART.bac34e5d294496b2.json","web/data/HONRO_STAGE_INTRO_ART.2fd23f2b329a0e27.json","web/data/HONRO_STORY_PORTRAITS.159ad9f6f88f53a2.json"],[new URL("../runtime/HONRO_BGM_TRACKS.076b094ee031e182.js",import.meta.url).href]:["web/data/HONRO_BGM_TRACKS.1fda0fbf388636f0.json"],[new URL("../runtime/HONRO_BALANCE.de30fc1f735f1813.js",import.meta.url).href]:["web/data/HONRO_BALANCE.e066899ab958f2b8.json"],[new URL("../runtime/HONRO_NARRATIVE_V0.3af6dde531c0f25a.js",import.meta.url).href]:["web/data/HONRO_NARRATIVE_V0.1b1a16777125d7dc.json"],[new URL("../runtime/HONRO_SPLIT_V1.9da54103e545d993.js",import.meta.url).href]:["web/data/HONRO_SPLIT_V1.8a0557450bffb24e.json"],[new URL("../runtime/HONRO_OPEN_STRUCTURES.62d3e81d0c736881.js",import.meta.url).href]:["web/data/HONRO_OPEN_STRUCTURES.bd10fa99a7eaab14.json"],[new URL("../runtime/HONRO_WATERWORKS_V2.0d993a6bc18f95b2.js",import.meta.url).href]:["web/data/HONRO_WATERWORKS_V2.7d653f087d5ae12f.json"],[new URL("../runtime/party-alias.6caa7e596c841bd5.js",import.meta.url).href]:["web/data/HONRO_PARTY.16d29c28ac7225c7.json","web/data/HONRO_PARTY_ART.62c967e06066946d.json"],[new URL("../runtime/HONRO_ACT1_FAR_DATA.048c5929000e14e1.js",import.meta.url).href]:["web/data/HONRO_ACT1_FAR_DATA.a7bedbfe9c843e9f.json"],[new URL("../runtime/HONRO_ACT2_FAR_DATA.dda20ab5b64de4d7.js",import.meta.url).href]:["web/data/HONRO_ACT2_FAR_DATA.55de354dd4cecfc3.json"],[new URL("../runtime/HONRO_REST_BACKDROPS.8bbba14828b7fdef.js",import.meta.url).href]:["web/data/HONRO_REST_BACKDROPS.59a3076127863c24.json"],[new URL("../runtime/HONRO_STAGE21_PAINTED.00cd028b658b4d01.js",import.meta.url).href]:["web/data/HONRO_STAGE21_PAINTED.4df0062da3191cc0.json"],[new URL("../runtime/HONRO_PAINTED_PILOTS.e6fc22316cab65d4.js",import.meta.url).href]:["web/data/HONRO_PAINTED_PILOTS.6d84c3845b695bb3.json"],[new URL("../runtime/HONRO_AUTHORED_FAR.58133f0eadb5855e.js",import.meta.url).href]:["web/data/HONRO_AUTHORED_FAR.f922b0b5e5066247.json"],[new URL("../runtime/shared-assets-monsters-monsters-runtime.fbe578de964ead07.js",import.meta.url).href]:["web/data/HONRO_MONSTERS.fbfeb788663e09e1.json"],[new URL("../runtime/shared-assets-actors-actors-runtime.85c7f2345f217b35.js",import.meta.url).href]:["web/data/HONRO_ACTORS.ac87812035ed3e58.json"]},preloaded=new Set();
if(!globalThis.HONRO_EMBEDDED&&globalThis.HONRO_PROJECT_MODE!=='full')prefetchProject("web/data/campaign.7591bd6f8ac27e99.json");
for(let i=0;i<modules.length;i++){
 for(let n=i;n<Math.min(modules.length,i+12);n++){const href=modules[n];if(preloaded.has(href))continue;preloaded.add(href);prefetchData(dataHints[href]||[]);const link=document.createElement('link');link.rel='modulepreload';link.href=href;link.fetchPriority='low';document.head.append(link);}
 if(i===0)await globalThis.HonroStartup?.firstPaint();if(i===modules.length-1){await stylesReady;if(styleError)throw styleError;}
 const file=modules[i];await import(file);globalThis.HonroStartup?.progress(file.includes('ordered-common')?'게임 규칙과 풍경 준비':file.includes('ordered-game')?'동행과 조작 준비':file.includes('game-art')||file.includes('title-')?'첫 화면 준비':'장소 자료 준비',i+1,modules.length);await yieldIfNeeded();
}
await globalThis.HONRO_APP_READY;globalThis.HonroStartup?.ready();
if(location.hash==='#autostage2')HonroApp.launch(2);}
catch(error){if(globalThis.HonroStartup)globalThis.HonroStartup.failed(error);else{const host=document.getElementById('app');if(host)host.textContent='불러오지 못했습니다. 새로고침해 주세요.';}throw error;}})();
