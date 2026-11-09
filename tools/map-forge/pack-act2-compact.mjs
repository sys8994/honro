import {writeFile} from 'node:fs/promises';
import {runtime} from '../../game/tests/helpers.mjs';
import {createStage12Compact} from './stage12-compact.mjs';
import {createStage13Compact} from './stage13-compact.mjs';
import {createStage14Compact} from './stage14-compact.mjs';
import {createStage15Compact} from './stage15-compact.mjs';
process.env.HONRO_ACT2_COMPACT='0';
const g=await runtime({legacyMaps:false,productionStory:true}),d=createStage12Compact(g.HONRO_PROJECT);
await writeFile('shared/data/act2/stage12-compact-package.json',JSON.stringify({revision:1,previousMapRevision:512,mapRevision:612,...d})+'\n');
console.log(JSON.stringify({width:d.stage.width,height:d.stage.height,enemies:d.stage.units.filter(u=>u.team==='enemy').length,assets:d.assets.length,art:d.artStats}));
if(process.argv.includes('--stage13')){const d=createStage13Compact(g.HONRO_PROJECT);await writeFile('shared/data/act2/stage13-compact-package.json',JSON.stringify({revision:1,previousMapRevision:513,mapRevision:613,...d})+'\n');console.log(JSON.stringify({stage:13,width:d.stage.width,height:d.stage.height,initial:d.stage.units.filter(u=>u.team==='enemy').length,assets:d.assets.length}));}
if(process.argv.includes('--stage14')){const d=createStage14Compact(g.HONRO_PROJECT);await writeFile('shared/data/act2/stage14-compact-package.json',JSON.stringify({revision:1,previousMapRevision:514,mapRevision:614,...d})+'\n');console.log(JSON.stringify({stage:14,width:d.stage.width,height:d.stage.height,initial:d.stage.units.filter(u=>u.team==='enemy').length,assets:d.assets.length}));}
if(process.argv.includes('--stage15')){const d=createStage15Compact(g.HONRO_PROJECT);await writeFile('shared/data/act2/stage15-compact-package.json',JSON.stringify({revision:1,previousMapRevision:515,mapRevision:615,...d})+'\n');console.log(JSON.stringify({stage:15,width:d.stage.width,height:d.stage.height,initial:d.stage.units.filter(u=>u.team==='enemy').length,assets:d.assets.length}));}
