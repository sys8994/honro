import {prefetchProject,yieldIfNeeded} from "../runtime/load-data.fb768c8f80789aa0.js";
globalThis.HONRO_PROJECT_MODE="full";globalThis.HONRO_PLAYTEST_URL="web/entries/game.e099f29cd8393cc3.html?embedded=1";
const modules=[new URL("../runtime/ordered-common-1.b4e5a49a01772627.js",import.meta.url).href,
new URL("../runtime/shared-runtime-title-markup.3976b37b0afc8917.js",import.meta.url).href,
new URL("../runtime/HONRO_BGM_TRACKS.e05556f1dfcacaa2.js",import.meta.url).href,
new URL("../runtime/ordered-common-2.3cec807c9f833f8a.js",import.meta.url).href,
new URL("../runtime/HONRO_BALANCE.13532d7a009872b0.js",import.meta.url).href,
new URL("../runtime/HONRO_NARRATIVE_V0.e81971248dc062f7.js",import.meta.url).href,
new URL("../runtime/HONRO_SPLIT_V1.8b78ccf0dc8a4cec.js",import.meta.url).href,
new URL("../runtime/HONRO_OPEN_STRUCTURES.680dacb13bf865cc.js",import.meta.url).href,
new URL("../runtime/HONRO_WATERWORKS_V2.d36321df72e18caa.js",import.meta.url).href,
new URL("../runtime/ordered-common-3.8f3953fdcc41cc9b.js",import.meta.url).href,
new URL("../runtime/ordered-common-4.007c8b780c5aae30.js",import.meta.url).href,
new URL("../runtime/ordered-common-5.9c52a7e5824c3306.js",import.meta.url).href,
new URL("../runtime/ordered-common-6.23560b09f8e73b60.js",import.meta.url).href,
new URL("../runtime/ordered-common-7.7f9d22327d07d68a.js",import.meta.url).href,
new URL("../runtime/campaign.0ed9992cf926f504.js",import.meta.url).href,
new URL("../runtime/ordered-common-8.13e952fc8746d065.js",import.meta.url).href,
new URL("../runtime/party-alias.766fe2b8e383d5c4.js",import.meta.url).href,
new URL("../runtime/ordered-common-9.21e5f252fcc0bbf6.js",import.meta.url).href,
new URL("../runtime/HONRO_ACT1_FAR_DATA.06faf0ab5dbfc8a1.js",import.meta.url).href,
new URL("../runtime/HONRO_ACT2_FAR_DATA.0de09acbad7a7af8.js",import.meta.url).href,
new URL("../runtime/HONRO_STAGE21_PAINTED.48a558c3fa9b5fab.js",import.meta.url).href,
new URL("../runtime/HONRO_PAINTED_PILOTS.78ce1147ad10e7ec.js",import.meta.url).href,
new URL("../runtime/shared-assets-monsters-monsters-runtime.368b4c6c02e79e1f.js",import.meta.url).href,
new URL("../runtime/shared-assets-actors-actors-runtime.71936d333b9319d2.js",import.meta.url).href,
new URL("../runtime/ordered-common-10.ce552d00db22442e.js",import.meta.url).href,
new URL("../runtime/ordered-common-11.c5818964e3983d1d.js",import.meta.url).href,
new URL("../runtime/ordered-common-12.0bf4f96930d5367c.js",import.meta.url).href,
new URL("../runtime/shared-runtime-stage-rules.425c10ceb6d4b5ec.js",import.meta.url).href,
new URL("../runtime/workshop-app.3dcb579d65e74da0.js",import.meta.url).href];
globalThis.HONRO_READY=(async()=>{try{

const preloaded=new Set();
for(let i=0;i<modules.length;i++){
 if(i===2&&!globalThis.HONRO_EMBEDDED&&globalThis.HONRO_PROJECT_MODE!=='full')prefetchProject("web/data/campaign.e478a34879171416.json");
 for(let n=i;n<Math.min(modules.length,i+12);n++){const href=modules[n];if(preloaded.has(href))continue;preloaded.add(href);const link=document.createElement('link');link.rel='modulepreload';link.href=href;link.fetchPriority='low';document.head.append(link);}
 
 const file=modules[i];await import(file);globalThis.HonroStartup?.progress(file.includes('ordered-common')?'게임 규칙과 풍경 준비':file.includes('ordered-game')?'동행과 조작 준비':file.includes('game-art')||file.includes('title-')?'첫 화면 준비':'장소 자료 준비',i+1,modules.length);await yieldIfNeeded();
}
}
catch(error){if(globalThis.HonroStartup)globalThis.HonroStartup.failed(error);else{const host=document.getElementById('app');if(host)host.textContent='불러오지 못했습니다. 새로고침해 주세요.';}throw error;}})();
