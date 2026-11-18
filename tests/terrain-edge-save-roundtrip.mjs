/** Candidate artwork compatibility only. Native production model, no real storage/play claim. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {runtimeParts} from '../shared/build.mjs';
const g=vm.createContext({console,structuredClone,performance,setTimeout,clearTimeout});g.window=g;
for(const source of await runtimeParts({vector:false,render:false,productionStory:true}))vm.runInContext(source,g);
const plain=v=>JSON.parse(JSON.stringify(v)),p=g.HONRO_PROJECT,S=g.HonroProfileStore,results=[];
for(let stageId=1;stageId<=16;stageId++){
 const stage=p.stages.find(s=>s.metadata?.stageId===stageId);
 const battle=plain(g.HonroMaps.createBattle(stage,p,undefined,{origin:'campaign'}));
 const before=JSON.stringify(battle),packed=S.compactBattleArt(battle);
 assert.equal(JSON.stringify(battle),before,'Packing mutated battle '+stageId);
 const restored=JSON.parse(JSON.stringify(packed)),library=p.library;p.library=[];
 try{assert(S.restoreBattleArt(restored),'Provider-independent restore '+stageId);}finally{p.library=library;}
 assert.deepEqual(restored,battle,'Exact source-art/battle roundtrip '+stageId);
 const inline=plain(battle);assert(S.restoreBattleArt(inline));assert.deepEqual(inline,battle,'Legacy inline roundtrip '+stageId);
 const items=b=>[...(b.honroLandmarks||[]),...(b.honroElements||[]),...(b.honroEnvironment?.placements||[])];
 const sites=items(restored).filter(i=>i.asset?.id?.startsWith('act1-site:'));
 if(stageId===3||stageId===7){assert(sites.length>0);assert(!packed.honroLocalArtTable,'Site artwork intentionally remains inline under existing codec');}
 results.push({stage:stageId,table:!!packed.honroLocalArtTable,siteAssetsInline:sites.length,exactRoundtrip:true});
}
console.log(JSON.stringify({passed:true,results,limits:'Independent native model and JSON only; no browser quota, user-save access, campaign completion or public UI proof.'}));
