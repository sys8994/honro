import {writeFile,readFile} from 'node:fs/promises';
import {runtime} from '../../game/tests/helpers.mjs';
import {createStage12Compact} from './stage12-compact.mjs';
import {createStage13Compact} from './stage13-compact.mjs';
import {createStage14Compact} from './stage14-compact.mjs';
import {createStage15Compact} from './stage15-compact.mjs';
import {createStage16Compact} from './stage16-compact.mjs';
import {createStage17Compact} from './stage17-compact.mjs';
import {createStage18Compact,createStage19Compact} from './stage18-19-compact.mjs';
import {createStage20Compact} from './stage20-compact.mjs';
process.env.HONRO_ACT2_COMPACT='0';
const selected=new Set(JSON.parse(await readFile('game/config/act2-compact.json','utf8')).stages);
// Keep the compact card's references aligned with the actual retained actors
// and split polygon edges. Archived source metadata remains untouched.
function finish(d){
 const s=d.stage,space=s.design?.space,ids=new Set(s.units.map(u=>u.id));
 if(selected.has(s.metadata.stageId)){s.metadata.compactStatus='selected-layout';for(const[k,v]of Object.entries(s.design||{}))if(k.startsWith('compact')&&v&&typeof v==='object')v.status='selected-layout';}
 if(space){
  space.encounterSites=(space.encounterSites||[]).filter(e=>!e.unitId||ids.has(e.unitId));
  for(const surf of space.surfaces||[]){
   const t=s.terrains.find(t=>t.id===surf.terrainId);if(!t)continue;
   // Ceiling annotations use the projected polygon's inside perimeter, just
   // like the source (all edges except the outer closing edge at index0).
   if(surf.role==='ceiling'){const pts=t.playProjection?g.HonroTerrainDomain.projection(t).points:t.points;surf.edgeIndices=Array.from({length:Math.max(0,pts.length-1)},(_,i)=>i+1);}
   else if(t.properties?.honroWalkEdges?.length)surf.edgeIndices=[...t.properties.honroWalkEdges];
  }
 }
 for(const z of s.environment?.zones||[]){z.from=Math.max(0,z.from);z.to=Math.min(s.height,z.to);z.blend=Math.max(0,Math.min(z.blend||0,(z.to-z.from)*.45));}
 if(s.environment?.zones?.length)s.environment.zones.at(-1).to=s.height;
 delete s.design.targetRounds;delete s.design.expectedMinutes;return d;
}
const g=await runtime({legacyMaps:false,productionStory:true}),d=createStage12Compact(g.HONRO_PROJECT);
finish(d);await writeFile('shared/data/act2/stage12-compact-package.json',JSON.stringify({revision:1,previousMapRevision:512,mapRevision:612,...d})+'\n');
console.log(JSON.stringify({width:d.stage.width,height:d.stage.height,enemies:d.stage.units.filter(u=>u.team==='enemy').length,assets:d.assets.length,art:d.artStats}));
if(process.argv.includes('--stage13')){const d=finish(createStage13Compact(g.HONRO_PROJECT));await writeFile('shared/data/act2/stage13-compact-package.json',JSON.stringify({revision:1,previousMapRevision:513,mapRevision:613,...d})+'\n');console.log(JSON.stringify({stage:13,width:d.stage.width,height:d.stage.height,initial:d.stage.units.filter(u=>u.team==='enemy').length,assets:d.assets.length}));}
if(process.argv.includes('--stage14')){const d=finish(createStage14Compact(g.HONRO_PROJECT));await writeFile('shared/data/act2/stage14-compact-package.json',JSON.stringify({revision:1,previousMapRevision:514,mapRevision:614,...d})+'\n');console.log(JSON.stringify({stage:14,width:d.stage.width,height:d.stage.height,initial:d.stage.units.filter(u=>u.team==='enemy').length,assets:d.assets.length}));}
if(process.argv.includes('--stage15')){const d=finish(createStage15Compact(g.HONRO_PROJECT));await writeFile('shared/data/act2/stage15-compact-package.json',JSON.stringify({revision:1,previousMapRevision:515,mapRevision:615,...d})+'\n');console.log(JSON.stringify({stage:15,width:d.stage.width,height:d.stage.height,initial:d.stage.units.filter(u=>u.team==='enemy').length,assets:d.assets.length}));}
for(const [id,make]of [[16,createStage16Compact],[17,createStage17Compact],[18,createStage18Compact],[19,createStage19Compact],[20,createStage20Compact]])if(process.argv.includes('--stage'+id)||process.argv.includes('--remaining')){const d=finish(make(g.HONRO_PROJECT));await writeFile(`shared/data/act2/stage${id}-compact-package.json`,JSON.stringify({revision:1,previousMapRevision:500+id,mapRevision:600+id,...d})+'\n');console.log(JSON.stringify({stage:id,width:d.stage.width,height:d.stage.height,initial:d.stage.units.filter(u=>u.team==='enemy').length,assets:d.assets.length}));}
