import {runtime} from '../../game/tests/helpers.mjs';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
process.env.HONRO_ACT4_RELEASE='1';
const g=await runtime({legacyMaps:false});
const p=JSON.parse(JSON.stringify(g.HONRO_PROJECT));
const w=JSON.parse(await readFile('shared/data/act4/world.json'));
p.library=[...new Map([...p.library,...w.library].map(a=>[a.id,a])).values()];
p.stages=[structuredClone(w.stages.find(s=>s.id==='stage-34'))];p.activeStageId='stage-34';
p.production={version:1,cards:{'stage-34':{cameraViews:[
{id:'normal',x:1800,y:3900,scale:.53,width:1440,height:900},
{id:'roof-detail',x:2400,y:3550,scale:.94,width:1440,height:900},
{id:'mobile',x:2200,y:3900,scale:.53,width:720,height:1100},
{id:'tip',x:3150,y:3550,scale:.94,width:1440,height:900},
{id:'whole',x:3800,y:3700,scale:.175,width:1600,height:1000}
]}}};
await mkdir('_local/reports/cave34-silhouette-v4',{recursive:true});
await writeFile('_local/reports/cave34-silhouette-v4/baseline.json',JSON.stringify(p));
console.log('Baseline frozen; source unchanged');
