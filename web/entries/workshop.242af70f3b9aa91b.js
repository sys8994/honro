import {prefetchProject,prefetchData,yieldIfNeeded} from "../runtime/load-data.0a232e94ad0af727.js";
globalThis.HONRO_PROJECT_MODE="full";globalThis.HONRO_PLAYTEST_URL="web/entries/game.756b8464650090fa.html?embedded=1";
const modules=[new URL("../runtime/ordered-common-1.34ccbd385cc5a8c6.js",import.meta.url).href,
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
new URL("../runtime/shared-runtime-stage-rules.425c10ceb6d4b5ec.js",import.meta.url).href,
new URL("../runtime/workshop-app.3dcb579d65e74da0.js",import.meta.url).href].filter(file=>!false||globalThis.HONRO_EMBEDDED||globalThis.HONRO_PROJECT_MODE==='full'||!Object.values(globalThis.HONRO_OPTIONAL_MODULES).some(entry=>entry.url===file));
globalThis.HONRO_READY=(async()=>{try{

// Start bounded network work while the title paints; execute only after firstPaint.
const dataHints={[new URL("../runtime/HONRO_BGM_TRACKS.076b094ee031e182.js",import.meta.url).href]:["web/data/HONRO_BGM_TRACKS.1fda0fbf388636f0.json"],[new URL("../runtime/HONRO_BALANCE.de30fc1f735f1813.js",import.meta.url).href]:["web/data/HONRO_BALANCE.e066899ab958f2b8.json"],[new URL("../runtime/HONRO_NARRATIVE_V0.3af6dde531c0f25a.js",import.meta.url).href]:["web/data/HONRO_NARRATIVE_V0.1b1a16777125d7dc.json"],[new URL("../runtime/HONRO_SPLIT_V1.9da54103e545d993.js",import.meta.url).href]:["web/data/HONRO_SPLIT_V1.8a0557450bffb24e.json"],[new URL("../runtime/HONRO_OPEN_STRUCTURES.62d3e81d0c736881.js",import.meta.url).href]:["web/data/HONRO_OPEN_STRUCTURES.bd10fa99a7eaab14.json"],[new URL("../runtime/HONRO_WATERWORKS_V2.0d993a6bc18f95b2.js",import.meta.url).href]:["web/data/HONRO_WATERWORKS_V2.7d653f087d5ae12f.json"],[new URL("../runtime/party-alias.6caa7e596c841bd5.js",import.meta.url).href]:["web/data/HONRO_PARTY.16d29c28ac7225c7.json","web/data/HONRO_PARTY_ART.62c967e06066946d.json"],[new URL("../runtime/HONRO_ACT1_FAR_DATA.048c5929000e14e1.js",import.meta.url).href]:["web/data/HONRO_ACT1_FAR_DATA.a7bedbfe9c843e9f.json"],[new URL("../runtime/HONRO_ACT2_FAR_DATA.dda20ab5b64de4d7.js",import.meta.url).href]:["web/data/HONRO_ACT2_FAR_DATA.55de354dd4cecfc3.json"],[new URL("../runtime/HONRO_REST_BACKDROPS.8bbba14828b7fdef.js",import.meta.url).href]:["web/data/HONRO_REST_BACKDROPS.59a3076127863c24.json"],[new URL("../runtime/HONRO_STAGE21_PAINTED.00cd028b658b4d01.js",import.meta.url).href]:["web/data/HONRO_STAGE21_PAINTED.4df0062da3191cc0.json"],[new URL("../runtime/HONRO_PAINTED_PILOTS.e6fc22316cab65d4.js",import.meta.url).href]:["web/data/HONRO_PAINTED_PILOTS.6d84c3845b695bb3.json"],[new URL("../runtime/HONRO_AUTHORED_FAR.58133f0eadb5855e.js",import.meta.url).href]:["web/data/HONRO_AUTHORED_FAR.f922b0b5e5066247.json"],[new URL("../runtime/shared-assets-monsters-monsters-runtime.fbe578de964ead07.js",import.meta.url).href]:["web/data/HONRO_MONSTERS.fbfeb788663e09e1.json"],[new URL("../runtime/shared-assets-actors-actors-runtime.85c7f2345f217b35.js",import.meta.url).href]:["web/data/HONRO_ACTORS.ac87812035ed3e58.json"]},preloaded=new Set();
if(!globalThis.HONRO_EMBEDDED&&globalThis.HONRO_PROJECT_MODE!=='full')prefetchProject("web/data/campaign.7591bd6f8ac27e99.json");
for(let i=0;i<modules.length;i++){
 for(let n=i;n<Math.min(modules.length,i+12);n++){const href=modules[n];if(preloaded.has(href))continue;preloaded.add(href);prefetchData(dataHints[href]||[]);const link=document.createElement('link');link.rel='modulepreload';link.href=href;link.fetchPriority='low';document.head.append(link);}
 
 const file=modules[i];await import(file);globalThis.HonroStartup?.progress(file.includes('ordered-common')?'게임 규칙과 풍경 준비':file.includes('ordered-game')?'동행과 조작 준비':file.includes('game-art')||file.includes('title-')?'첫 화면 준비':'장소 자료 준비',i+1,modules.length);await yieldIfNeeded();
}
}
catch(error){if(globalThis.HonroStartup)globalThis.HonroStartup.failed(error);else{const host=document.getElementById('app');if(host)host.textContent='불러오지 못했습니다. 새로고침해 주세요.';}throw error;}})();
