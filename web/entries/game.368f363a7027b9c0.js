import {prefetchProject,yieldIfNeeded} from "../runtime/load-data.fb768c8f80789aa0.js";
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

const modules=[new URL("../runtime/game-art.6fd6d42035b08ea8.js",import.meta.url).href,
new URL("../runtime/title-scene.61979ebdf786fbaa.js",import.meta.url).href,
new URL("../runtime/ordered-common-1.b4e5a49a01772627.js",import.meta.url).href,
new URL("../runtime/shared-runtime-title-markup.3976b37b0afc8917.js",import.meta.url).href,
new URL("../runtime/HONRO_BGM_TRACKS.e05556f1dfcacaa2.js",import.meta.url).href,
new URL("../runtime/ordered-common-2.3cec807c9f833f8a.js",import.meta.url).href,
new URL("../runtime/HONRO_BALANCE.13532d7a009872b0.js",import.meta.url).href,
new URL("../runtime/HONRO_NARRATIVE_V0.e81971248dc062f7.js",import.meta.url).href,
new URL("../runtime/HONRO_SPLIT_V1.8b78ccf0dc8a4cec.js",import.meta.url).href,
new URL("../runtime/HONRO_OPEN_STRUCTURES.680dacb13bf865cc.js",import.meta.url).href,
new URL("../runtime/HONRO_WATERWORKS_V2.d36321df72e18caa.js",import.meta.url).href,
new URL("../runtime/ordered-common-3.3ac93048a2f3cc29.js",import.meta.url).href,
new URL("../runtime/ordered-common-4.007c8b780c5aae30.js",import.meta.url).href,
new URL("../runtime/ordered-common-5.9c52a7e5824c3306.js",import.meta.url).href,
new URL("../runtime/ordered-common-6.23560b09f8e73b60.js",import.meta.url).href,
new URL("../runtime/ordered-common-7.b090605eaf6ebc07.js",import.meta.url).href,
new URL("../runtime/campaign.c58f38ba6153f418.js",import.meta.url).href,
new URL("../runtime/ordered-common-8.13e952fc8746d065.js",import.meta.url).href,
new URL("../runtime/party-alias.766fe2b8e383d5c4.js",import.meta.url).href,
new URL("../runtime/ordered-common-9.21e5f252fcc0bbf6.js",import.meta.url).href,
new URL("../runtime/HONRO_ACT1_FAR_DATA.06faf0ab5dbfc8a1.js",import.meta.url).href,
new URL("../runtime/HONRO_ACT2_FAR_DATA.0de09acbad7a7af8.js",import.meta.url).href,
new URL("../runtime/HONRO_STAGE21_PAINTED.48a558c3fa9b5fab.js",import.meta.url).href,
new URL("../runtime/HONRO_PAINTED_PILOTS.b6ad42927164d009.js",import.meta.url).href,
new URL("../runtime/shared-assets-monsters-monsters-runtime.368b4c6c02e79e1f.js",import.meta.url).href,
new URL("../runtime/shared-assets-actors-actors-runtime.71936d333b9319d2.js",import.meta.url).href,
new URL("../runtime/ordered-common-10.ce552d00db22442e.js",import.meta.url).href,
new URL("../runtime/ordered-common-11.c5818964e3983d1d.js",import.meta.url).href,
new URL("../runtime/ordered-common-12.ff206c84ce6eaa71.js",import.meta.url).href,
new URL("../runtime/ordered-game-13.aa32dcc21060fc55.js",import.meta.url).href,
new URL("../runtime/shared-runtime-stage-rules.425c10ceb6d4b5ec.js",import.meta.url).href,
new URL("../runtime/ordered-game-14.8ad72fd7dc9cf424.js",import.meta.url).href,
new URL("../runtime/shared-runtime-training.3a315db50d1e4073.js",import.meta.url).href,
new URL("../runtime/shared-runtime-skill-preview.d6f92d54c62d72b0.js",import.meta.url).href,
new URL("../runtime/ordered-game-15.cd9ba5930cccc085.js",import.meta.url).href,
new URL("../runtime/ordered-game-16.6b557ce36797d6cc.js",import.meta.url).href].filter(file=>!true||globalThis.HONRO_EMBEDDED||globalThis.HONRO_PROJECT_MODE==='full'||!Object.values(globalThis.HONRO_OPTIONAL_MODULES).some(entry=>entry.url===file));
globalThis.HONRO_READY=(async()=>{try{
await globalThis.HonroStartup?.firstPaint();
let styleError;const stylesReady=Promise.all(["web/styles/game-vendor-ui-arcfall-layout.1f32e36e2a18d5f7.css","web/styles/game-vendor-style.3661f7f5254538f8.css","web/styles/game-src-hud.24def713b6266561.css","web/styles/game-src-presentation.67f428fcefcc01d3.css","web/styles/game-src-controls.17c60131092f54c2.css","web/styles/game-src-unit-info.a60fa5389408ecc4.css","web/styles/game-src-training.14cb5dad15d2ff89.css","web/styles/game-src-guide.3d713683085e2ae7.css","web/styles/game-src-skill-presentation.9ec958bbd6c09493.css","web/styles/game-src-journey.a5012cfff7c84466.css","web/styles/game-src-title.fce8cc484f3f2b0a.css","web/styles/game-src-fonts.9251c095ef93d0b1.css","web/styles/game-src-act3-void.bc0568cbc4ae56e4.css"].map(file=>new Promise((resolve,reject)=>{const link=document.createElement('link');link.rel='stylesheet';link.href=new URL('../../'+file,import.meta.url).href;link.onload=resolve;link.onerror=()=>reject(Error('Style load failed: '+file));document.head.append(link);}))).catch(error=>{styleError=error;});
const preloaded=new Set();
for(let i=0;i<modules.length;i++){
 if(i===2&&!globalThis.HONRO_EMBEDDED&&globalThis.HONRO_PROJECT_MODE!=='full')prefetchProject("web/data/campaign.763d4599e7bc353a.json");
 for(let n=i;n<Math.min(modules.length,i+12);n++){const href=modules[n];if(preloaded.has(href))continue;preloaded.add(href);const link=document.createElement('link');link.rel='modulepreload';link.href=href;link.fetchPriority='low';document.head.append(link);}
 if(i===modules.length-1){await stylesReady;if(styleError)throw styleError;}
 const file=modules[i];await import(file);globalThis.HonroStartup?.progress(file.includes('ordered-common')?'게임 규칙과 풍경 준비':file.includes('ordered-game')?'동행과 조작 준비':file.includes('game-art')||file.includes('title-')?'첫 화면 준비':'장소 자료 준비',i+1,modules.length);await yieldIfNeeded();
}
await globalThis.HONRO_APP_READY;globalThis.HonroStartup?.ready();
if(location.hash==='#autostage2')HonroApp.launch(2);}
catch(error){if(globalThis.HonroStartup)globalThis.HonroStartup.failed(error);else{const host=document.getElementById('app');if(host)host.textContent='불러오지 못했습니다. 새로고침해 주세요.';}throw error;}})();
