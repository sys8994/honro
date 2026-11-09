import {writeFile} from 'node:fs/promises';
import {runtime} from '../../game/tests/helpers.mjs';
import {createStage12Compact} from './stage12-compact.mjs';
process.env.HONRO_ACT2_COMPACT='0';
const g=await runtime({legacyMaps:false,productionStory:true}),d=createStage12Compact(g.HONRO_PROJECT);
await writeFile('shared/data/act2/stage12-compact-package.json',JSON.stringify({revision:1,previousMapRevision:512,mapRevision:612,...d})+'\n');
console.log(JSON.stringify({width:d.stage.width,height:d.stage.height,enemies:d.stage.units.filter(u=>u.team==='enemy').length,assets:d.assets.length,art:d.artStats}));
