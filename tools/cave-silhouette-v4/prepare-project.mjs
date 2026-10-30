import {runtime} from '../../game/tests/helpers.mjs';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
process.env.HONRO_ACT4_RELEASE='1';
const g=await runtime({legacyMaps:false});
const p=JSON.parse(JSON.stringify(g.HONRO_PROJECT));
const w=JSON.parse(await readFile('shared/data/act4/world.json'));
p.library=[...new Map([...p.library,...w.library].map(a=>[a.id,a])).values()];
p.stages=[structuredClone(w.stages.find(s=>s.id==='stage-38'))];p.activeStageId='stage-38';
p.production={version:1,cards:{'stage-38':{cameraViews:[
{id:'normal',x:1800,y:2400,scale:.53,width:1440,height:900},
{id:'roof-detail',x:2000,y:2200,scale:.94,width:1440,height:900},
{id:'mobile',x:1900,y:2400,scale:.53,width:720,height:1100},
{id:'entry-roof',x:2900,y:2650,scale:.53,width:1400,height:900},
{id:'whole',x:3600,y:2300,scale:.21,width:1600,height:1000}
]}}};
await mkdir('_local/reports/cave-silhouette-v4',{recursive:true});
await writeFile('_local/reports/cave-silhouette-v4/baseline.json',JSON.stringify(p));
console.log('Baseline frozen; source unchanged');
