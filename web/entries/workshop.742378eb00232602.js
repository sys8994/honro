import {prefetchProject,prefetchData,yieldIfNeeded} from "../runtime/load-data.60b63bd7d9d5af82.js";
globalThis.HONRO_PROJECT_MODE="full";globalThis.HONRO_PLAYTEST_URL="web/entries/game.ad40d8e2a7bec913.html?embedded=1";
const modules=[new URL("../runtime/ordered-common-1.b90980f983e0304d.js",import.meta.url).href,
new URL("../runtime/shared-runtime-title-markup.3976b37b0afc8917.js",import.meta.url).href,
new URL("../runtime/HONRO_BGM_TRACKS.8183477a4872f6a6.js",import.meta.url).href,
new URL("../runtime/ordered-common-2.097b2927c3c38c0b.js",import.meta.url).href,
new URL("../runtime/ordered-common-3.e1856ec64c787e65.js",import.meta.url).href,
new URL("../runtime/HONRO_BALANCE.ead88f3d9b670254.js",import.meta.url).href,
new URL("../runtime/HONRO_NARRATIVE_V0.c81f5e9266d6d06a.js",import.meta.url).href,
new URL("../runtime/HONRO_SPLIT_V1.fe1bd10ce56181e2.js",import.meta.url).href,
new URL("../runtime/HONRO_OPEN_STRUCTURES.10ceeb69a6df342c.js",import.meta.url).href,
new URL("../runtime/HONRO_WATERWORKS_V2.9735a0c493b64ee7.js",import.meta.url).href,
new URL("../runtime/ordered-common-4.33460e5675f12089.js",import.meta.url).href,
new URL("../runtime/ordered-common-5.33efaaf98b2f6071.js",import.meta.url).href,
new URL("../runtime/ordered-common-6.acf03aa763ca027f.js",import.meta.url).href,
new URL("../runtime/ordered-common-7.41ebd8c9ffc412fd.js",import.meta.url).href,
new URL("../runtime/ordered-common-8.be150d154838fc77.js",import.meta.url).href,
new URL("../runtime/campaign.c5ce1e36a56bc8a0.js",import.meta.url).href,
new URL("../runtime/ordered-common-9.9864947017dc6137.js",import.meta.url).href,
new URL("../runtime/party-alias.b19b3e88a3b965c3.js",import.meta.url).href,
new URL("../runtime/ordered-common-10.4546edfd464ff837.js",import.meta.url).href,
new URL("../runtime/HONRO_ACT1_FAR_DATA.c067a494dcc5f919.js",import.meta.url).href,
new URL("../runtime/HONRO_ACT2_FAR_DATA.852b2a988d0764bf.js",import.meta.url).href,
new URL("../runtime/HONRO_REST_BACKDROPS.a6937a62382f4091.js",import.meta.url).href,
new URL("../runtime/HONRO_STAGE21_PAINTED.f43a09de9ac8b0ed.js",import.meta.url).href,
new URL("../runtime/HONRO_PAINTED_PILOTS.92a7a1bab144051e.js",import.meta.url).href,
new URL("../runtime/HONRO_AUTHORED_FAR.c9728fddbd7f2de9.js",import.meta.url).href,
new URL("../runtime/shared-assets-monsters-monsters-runtime.63ca9e9192ae871d.js",import.meta.url).href,
new URL("../runtime/shared-assets-actors-actors-runtime.c11822d74d18722f.js",import.meta.url).href,
new URL("../runtime/ordered-common-11.42c3d3bd61f34f59.js",import.meta.url).href,
new URL("../runtime/ordered-common-12.baf735a46de4f8a5.js",import.meta.url).href,
new URL("../runtime/shared-runtime-stage-rules.425c10ceb6d4b5ec.js",import.meta.url).href,
new URL("../runtime/workshop-app.3dcb579d65e74da0.js",import.meta.url).href].filter(file=>!false||globalThis.HONRO_EMBEDDED||globalThis.HONRO_PROJECT_MODE==='full'||!Object.values(globalThis.HONRO_OPTIONAL_MODULES).some(entry=>entry.url===file));
globalThis.HONRO_READY=(async()=>{try{

const dataHints={[new URL("../runtime/HONRO_BGM_TRACKS.8183477a4872f6a6.js",import.meta.url).href]:["web/data/HONRO_BGM_TRACKS.1fda0fbf388636f0.json"],[new URL("../runtime/HONRO_BALANCE.ead88f3d9b670254.js",import.meta.url).href]:["web/data/HONRO_BALANCE.e066899ab958f2b8.json"],[new URL("../runtime/HONRO_NARRATIVE_V0.c81f5e9266d6d06a.js",import.meta.url).href]:["web/data/HONRO_NARRATIVE_V0.1b1a16777125d7dc.json"],[new URL("../runtime/HONRO_SPLIT_V1.fe1bd10ce56181e2.js",import.meta.url).href]:["web/data/HONRO_SPLIT_V1.8a0557450bffb24e.json"],[new URL("../runtime/HONRO_OPEN_STRUCTURES.10ceeb69a6df342c.js",import.meta.url).href]:["web/data/HONRO_OPEN_STRUCTURES.bd10fa99a7eaab14.json"],[new URL("../runtime/HONRO_WATERWORKS_V2.9735a0c493b64ee7.js",import.meta.url).href]:["web/data/HONRO_WATERWORKS_V2.7d653f087d5ae12f.json"],[new URL("../runtime/party-alias.b19b3e88a3b965c3.js",import.meta.url).href]:["web/data/HONRO_PARTY.16d29c28ac7225c7.json","web/data/HONRO_PARTY_ART.62c967e06066946d.json"],[new URL("../runtime/HONRO_ACT1_FAR_DATA.c067a494dcc5f919.js",import.meta.url).href]:["web/data/HONRO_ACT1_FAR_DATA.a7bedbfe9c843e9f.json"],[new URL("../runtime/HONRO_ACT2_FAR_DATA.852b2a988d0764bf.js",import.meta.url).href]:["web/data/HONRO_ACT2_FAR_DATA.55de354dd4cecfc3.json"],[new URL("../runtime/HONRO_REST_BACKDROPS.a6937a62382f4091.js",import.meta.url).href]:["web/data/HONRO_REST_BACKDROPS.59a3076127863c24.json"],[new URL("../runtime/HONRO_STAGE21_PAINTED.f43a09de9ac8b0ed.js",import.meta.url).href]:["web/data/HONRO_STAGE21_PAINTED.4df0062da3191cc0.json"],[new URL("../runtime/HONRO_PAINTED_PILOTS.92a7a1bab144051e.js",import.meta.url).href]:["web/data/HONRO_PAINTED_PILOTS.6d84c3845b695bb3.json"],[new URL("../runtime/HONRO_AUTHORED_FAR.c9728fddbd7f2de9.js",import.meta.url).href]:["web/data/HONRO_AUTHORED_FAR.f922b0b5e5066247.json"],[new URL("../runtime/shared-assets-monsters-monsters-runtime.63ca9e9192ae871d.js",import.meta.url).href]:["web/data/HONRO_MONSTERS.fbfeb788663e09e1.json"],[new URL("../runtime/shared-assets-actors-actors-runtime.c11822d74d18722f.js",import.meta.url).href]:["web/data/HONRO_ACTORS.ac87812035ed3e58.json"]},preloaded=new Set();
if(!globalThis.HONRO_EMBEDDED&&globalThis.HONRO_PROJECT_MODE!=='full')prefetchProject("web/data/campaign.013864b0814842e6.json");
for(let i=0;i<modules.length;i++){
 for(let n=i;n<Math.min(modules.length,i+12);n++){const href=modules[n];if(preloaded.has(href))continue;preloaded.add(href);prefetchData(dataHints[href]||[]);const link=document.createElement('link');link.rel='modulepreload';link.href=href;link.fetchPriority='low';document.head.append(link);}
 
 const file=modules[i];await import(file);globalThis.HonroStartup?.progress(file.includes('ordered-common')?'게임 규칙과 풍경 준비':file.includes('ordered-game')?'동행과 조작 준비':file.includes('game-art')||file.includes('title-')?'첫 화면 준비':'장소 자료 준비',i+1,modules.length);await yieldIfNeeded();
}
}
catch(error){if(globalThis.HonroStartup)globalThis.HonroStartup.failed(error);else{const host=document.getElementById('app');if(host)host.textContent='불러오지 못했습니다. 새로고침해 주세요.';}throw error;}})();
