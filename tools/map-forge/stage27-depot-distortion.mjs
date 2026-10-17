/** Stage 27 only: versioned artwork replacement. All existing gameplay,
 * structural polygons, actors, objectives and the void scene remain untouched.
 * Apply after working-architecture when upgrading an existing authored project. */
import {readFile,writeFile} from 'node:fs/promises';import {fileURLToPath} from 'node:url';
import {P,R,line,asset} from './act3-map-kit.mjs';
const prefix='stage27-depot-r4:',id=prefix+'misconnected-rear';
const bounds=[-16000,-10000,40200,30200];
function portal(x,y,w,h,matrix){
 // Identical scarf-jointed door proportions repeat at incompatible orientations.
 // No bright sill: these openings are deep in the rear space, not landing cues.
 const v=P([[0,0],[w,17],[w+45,h],[w-65,h],[w-75,120],[87,103],[75,h],[-45,h]],'#293b35')
  +P([[89,108],[w-77,124],[w-67,h],[76,h]],'#071917')
  +P([[0,0],[w,17],[w,54],[2,39]],'#4a5141')
  +P([[5,43],[66,50],[53,h],[-37,h]],'#39483b')
  +P([[w-60,55],[w-7,58],[w+35,h],[w-64,h]],'#1b302b')
  +P([[38,70],[180,215],[210,185],[76,47]],'#374234')
  +P([[w-155,81],[w-111,83],[w-80,h*.83],[w-118,h*.82]],'#1e332b')
  +R(w*.46,92,31,h*.56,'#20372d');
 return `<g transform="matrix(${matrix||`1 0 0 1 ${x} ${y}`})">${v}</g>`;
}
export function applyStage27Distortion(input){
 const p=structuredClone(input),s=p.stages.find(s=>s.metadata.stageId===27),e=s?.elements.find(e=>e.id==='vertical-depot-shell');
 if(!e)throw Error('Stage27 depot shell is required');
 if(e.assetId===id)return p;
 const old=p.library.find(a=>a.id===e.assetId);
 if(!/^stage27-depot-r[123]:/.test(old?.id||''))throw Error('Apply Stage27 depot revision before distortion');
 // Do not darken an already-darkened r2/r3 vector or append to its old motifs.
 // The replacement is authored from fixed colours and keeps the shell footprint.
 let art=R(-16000,-10000,40200,30200,'#07191f')
  +`<defs><linearGradient id="depot-impossible-depth" x1="1400" y1="1700" x2="6200" y2="5700" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#142b2d"/><stop offset=".46" stop-color="#0a211f"/><stop offset="1" stop-color="#142e2c"/></linearGradient></defs>`
  +P([[-300,1470],[3930,1310],[8550,1500],[8550,5840],[-300,5840]],'url(#depot-impossible-depth)');
 // The hall folds back on itself: two broad bearing walls recede toward one
 // vanishing region, while the next nested hall opens across their return face.
 art+=P([[320,1900],[1290,1720],[2400,2070],[3030,5660],[260,5660]],'#1b302e')
  +P([[440,2060],[1080,1960],[1390,5590],[350,5590]],'#243a33')
  +P([[1260,1820],[2400,2070],[3030,5660],[2180,5660]],'#0b2223')
  +P([[7170,1700],[7980,1840],[8380,5690],[6670,5690],[6120,2820]],'#1c332f')
  +P([[7310,1990],[7860,2090],[8120,5690],[7350,5690]],'#263d34')
  +P([[5450,1570],[6610,1750],[6210,2960],[5680,3490],[5050,3240]],'#122a27');
 // Familiar loading openings recur in a vertical wall, a sideways wall and an
 // upside-down bay. Their enormous dark interiors make the contradiction legible.
 art+=portal(1880,2430,890,1160)
  +portal(3570,1670,890,1160)
  +portal(0,0,890,1160,'0 1 -1 0 6930 2400')
  +portal(0,0,890,1160,'-0.82 0 0 -0.82 4740 5050');
 // Receding nested silhouettes occupy one opening, not a wall of small repeats.
 art+=portal(3900,2050,510,740)
  +portal(4110,2310,280,460)
  +P([[4290,2490],[4415,2500],[4395,2790],[4280,2790]],'#081c1b');
 // A haulage corridor joins the side of an upright door and emerges on a
 // different plane. Only its dark side faces are drawn, avoiding fake platforms.
 art+=P([[2570,3490],[3480,3150],[4190,3270],[5130,2800],[5390,2900],[4240,3460],[3540,3350],[2610,3670]],'#1d352e')
  +P([[2610,3530],[3480,3220],[4210,3350],[5160,2880],[5190,2930],[4220,3420],[3510,3310],[2620,3610]],'#112a26')
  +P([[4790,4380],[5840,3860],[6470,4110],[7140,3610],[7250,3780],[6500,4300],[5830,4070],[4820,4540]],'#1b362e');
 // Columns vanish into clear gaps and continue displaced above them. Unequal
 // broad planes, mortise mouths and loaded capitals replace uniform banding.
 for(const [x,y,w,h]of [[2950,3510,195,1810],[3330,1720,180,1110],[5200,3870,230,1630],[4920,1800,190,1350]]){
  art+=P([[x,y],[x+w,y+15],[x+w+40,y+h],[x-40,y+h]],'#263d32')
   +P([[x+8,y+19],[x+w*.31,y+24],[x+w*.22,y+h],[x-23,y+h]],'#384a3b')
   +P([[x+w*.7,y+22],[x+w,y+15],[x+w+40,y+h],[x+w*.7,y+h]],'#112b25')
   +P([[x-28,y-20],[x+w+30,y-3],[x+w+35,y+62],[x-35,y+52]],'#3a4536');
 }
 art+=`<defs><linearGradient id="depot-water-depth" x1="3100" y1="3100" x2="4800" y2="4300" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#46665b"/><stop offset=".45" stop-color="#284b45"/><stop offset="1" stop-color="#3c5b52"/></linearGradient></defs>`;
 // One substantial drainage course turns sideways and then climbs the rear
 // wall. Its water stays broad and continuous while the masonry changes plane.
 art+=`<path d="M2280 5330C2890 5260 3020 4810 3270 4310C3490 3900 3990 3810 4470 3950C4930 4090 5360 3990 5570 3580C5770 3200 5610 2770 6010 2220L6260 2310C5950 2800 6080 3220 5840 3700C5580 4240 4970 4400 4380 4210C4000 4090 3720 4160 3520 4540C3210 5130 2990 5490 2320 5540Z" fill="#203c3a"/>`;
 art+=`<path d="M2320 5350C2920 5260 3070 4800 3320 4340C3520 3930 4000 3875 4450 4020C4700 4100 4990 4110 5230 3980L5280 3985C5450 3870 5580 3720 5640 3580C5810 3210 5735 2800 6080 2260L6190 2295C6080 2440 6040 2590 5990 2730L5965 2720C5900 2940 5945 3160 5840 3430L5810 3410C5820 3690 5620 3950 5400 4100L5360 4078C5090 4320 4710 4290 4420 4170C4060 4040 3630 4070 3440 4500L3400 4490C3230 4880 2960 5440 2320 5510Z" fill="url(#depot-water-depth)"/>`;
 // Sparse broken reflections follow the water, with unequal widths and dark
 // interruptions. They never form a continuous road-like centre stripe.
 art+=`<path d="M2500 5368Q2730 5324 2820 5220L2800 5255Q2660 5370 2500 5381Z M3090 4860Q3165 4690 3230 4580L3210 4650Q3150 4810 3103 4872Z M3490 4230Q3610 4125 3750 4095L3820 4090Q3650 4130 3510 4240Z M3930 4070Q4100 4060 4260 4105L4240 4116Q4090 4080 3950 4085Z M4440 4160Q4580 4202 4695 4190L4730 4208Q4580 4220 4440 4175Z M5020 4180Q5200 4145 5310 4050L5290 4080Q5170 4180 5030 4192Z M5650 3660Q5710 3490 5720 3370L5734 3310Q5745 3510 5670 3670Z M5860 2780Q5890 2620 5960 2480L5976 2460Q5910 2630 5875 2790Z" fill="#658071"/>`;
 art+=P([[4070,3972],[4120,3975],[4150,4100],[4110,4090]],'#223d35')
  +P([[4140,3985],[4190,3995],[4210,4120],[4180,4110]],'#1d392f')
  +P([[4290,4030],[4320,4040],[4340,4145],[4310,4135]],'#2b473a');
 // At the two sharp changes of plane, pale wash and loose curved spray
 // spread outside the dark wet edge. These are sparse static ink-water forms.
 art+=`<path d="M3180 4470Q3300 4200 3510 4140Q3340 4350 3350 4580Q3270 4500 3180 4470Z" fill="#527265" opacity=".2"/>`
  +`<path d="M5480 3810Q5700 3480 5730 3190Q5860 3400 5740 3700Q5640 3810 5480 3810Z" fill="#4d6d5f" opacity=".19"/>`
  +`<path d="M3260 4450Q3240 4320 3370 4260M3300 4490Q3290 4370 3420 4330M5660 3660Q5770 3580 5760 3460M5710 3700Q5810 3600 5800 3520" fill="none" stroke="#5b7b69" stroke-width="6" opacity=".65"/>`;
 // A mismatched reflection: the upright door lies sideways across this tilted
 // wet face, far from any opening above it. Broad smears, no glowing particles.
 art+=P([[3650,4570],[4560,4460],[5110,4780],[4130,4910]],'#142e2c')
  +P([[3820,4610],[4350,4550],[4450,4604],[3900,4660]],'#354f43')
  +P([[3980,4700],[4040,4680],[4275,4790],[4215,4800]],'#425a49')
  +P([[4370,4635],[4420,4630],[4660,4750],[4620,4760]],'#2c493a')
  +P([[4190,4820],[4760,4760],[4780,4780],[4250,4850]],'#304a3e');
 // The displaced doorway reflection breaks into wet streaks, so it has no
 // continuous bright rim that could be mistaken for a usable floor.
 // A stranded freight hull fixes the true basin orientation under the impossible
 // space above. It is painted behind the real masonry quays and live water.
 art+=P([[1060,5410],[1510,5525],[3070,5525],[3510,5400],[3360,5760],[1640,5850],[1260,5700]],'#122a2c')
  +P([[1060,5410],[1510,5510],[3070,5510],[3510,5400],[3410,5480],[3120,5580],[1510,5590]],'#3e4e3f');
 for(const [x,lean,h]of [[1510,-75,270],[2250,30,300],[3140,105,240]])art+=P([[x-24,5680],[x+24,5680],[x+lean+35,5680-h],[x+lean-9,5680-h]],'#2e4438');
 art+=R(-300,5690,8800,2210,'#0b2531')+line([[-300,5706],[8500,5706]],'#567a78',9)
  +P([[5620,5720],[6100,5720],[6210,6190],[6080,6420],[5670,6260]],'#29443d')
  +P([[5680,5750],[6030,5750],[6130,6160],[6040,6330],[5730,6220]],'#0b2220')
  +P([[5690,5750],[5720,5750],[5790,6235],[5750,6210]],'#4b6051');
 const a=asset(id,'어긋나 되돌아오는 검은 집하장의 깊이',art,[],bounds,'wood');a.params={...old.params,rearOnly:true,artRevision:4};
 // Replace only this revision if a previous partial export left an unused asset.
 p.library=p.library.filter(a=>!a.id.startsWith(prefix));p.library.push(a);e.assetId=id;
 return p;
}
if(process.argv[1]===fileURLToPath(import.meta.url)){const file=process.argv[2]||'shared/data/campaign.json';await writeFile(file,JSON.stringify(applyStage27Distortion(JSON.parse(await readFile(file,'utf8'))),null,2)+'\n');}
