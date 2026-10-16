/** Background-only second pass. No serialized battle, actor, objective, material
 * pool, collision, gravity, trigger or camera mutation. */
import {readFile,writeFile} from 'node:fs/promises';import {fileURLToPath} from 'node:url';
import {P,R,asset} from './act3-map-kit.mjs';
const id='stage27-depot-r2:misconnected-rear';
export function applyStage27Distortion(input){
 const p=structuredClone(input),s=p.stages.find(s=>s.metadata.stageId===27),e=s.elements.find(e=>e.id==='vertical-depot-shell');if(e.assetId===id)return p;
 const old=p.library.find(a=>a.id===e.assetId);if(!old?.id.startsWith('stage27-depot-r1:'))throw Error('Apply Stage27 depot revision before distortion');
 const a=structuredClone(old);a.id=id;a.name='어긋나 이어지는 집하장 배면';
 function dark(v){if(Array.isArray(v))return v.map(dark);if(v&&typeof v==='object')return Object.fromEntries(Object.entries(v).map(([k,x])=>[k,dark(x)]));if(typeof v==='string'&&/^#[0-9a-f]{6}$/i.test(v))return '#'+[1,3,5].map(i=>Math.round(parseInt(v.slice(i,i+2),16)*.43).toString(16).padStart(2,'0')).join('');return v;}
 a.vector=dark(a.vector);
 let art='';
 // Same dock aperture reappears above and across its own rear passage. Frame
 // proportions repeat exactly while their implied floor heights cannot join.
 for(const [x,y]of[[2750,2310],[3610,1960],[4070,2640]]){
  art+=R(x,y,470,520,'#182826')+R(x+42,y+48,386,472,'#071211')+R(x+49,y+57,19,450,'#344039')+R(x+391,y+57,24,450,'#202f2a')+P([[x-30,y-14],[x+495,y+9],[x+490,y+58],[x-24,y+39]],'#354037');
  art+=P([[x+38,y+92],[x+160,y+223],[x+184,y+201],[x+61,y+69]],'#27372e')+R(x+285,y+70,45,395,'#223129')+R(x+345,y+70,31,310,'#192a24');
 }
 // Rear floor converges upward, then resumes below its own missing joint.
 art+=P([[2630,2920],[3450,2630],[3850,2600],[3850,2680],[3440,2690],[2630,3030]],'#293b33')+P([[2630,2920],[3450,2630],[3850,2600],[3850,2620],[3450,2656],[2630,2944]],'#3a473b');
 art+=P([[3970,2820],[4620,2960],[4940,2690],[4940,2760],[4630,3060],[3970,2920]],'#20342c');
 // A column stops in open dark space and continues displaced above that gap.
 art+=P([[3210,3050],[3310,3050],[3332,3560],[3200,3560]],'#24382e')+P([[3370,1780],[3470,1795],[3445,2570],[3350,2550]],'#273a30')+R(3350,2525,112,43,'#39453a');
 // Broad, unoutlined water ribbons bend sideways and rise along the rear wall.
 // They are vector scenery, not particle effects or altered fluid physics.
 art+='<path d="M2900 3570C2840 3310 2860 3160 3120 3110C3380 3060 3520 3170 3710 3000C3860 2870 3810 2670 4010 2490L4050 2520C3890 2710 3930 2910 3760 3050C3560 3240 3360 3130 3130 3180C2930 3230 2960 3390 2960 3570Z" fill="#334a44"/>';
 art+='<path d="M2910 3510C2870 3270 2930 3180 3160 3150C3450 3120 3570 3210 3750 3020L3770 2990C3560 3160 3420 3080 3150 3125C2890 3165 2850 3290 2910 3510Z" fill="#506058"/>';
 art+='<path d="M4530 3240C4650 3060 4640 2920 4470 2840C4320 2760 4250 2790 4170 2640L4200 2610C4320 2740 4390 2720 4510 2790C4720 2910 4700 3100 4560 3260Z" fill="#2e4942"/>';
 // Narrow broken highlights and translucent-looking inner planes distinguish
 // water from the broad straight timber floors, without glowing particles.
 art+='<path d="M2938 3480C2925 3320 2990 3220 3160 3195L3260 3190C3040 3225 2990 3300 2980 3420Z M3360 3170C3520 3200 3660 3150 3750 3060L3790 3010C3690 3160 3510 3220 3360 3195Z M3840 2820C3865 2710 3910 2620 4000 2530L4018 2539C3940 2650 3900 2750 3870 2840Z" fill="#617068"/>';
 art+='<path d="M4520 3180C4610 3060 4580 2930 4480 2880L4410 2845C4570 2890 4660 3040 4550 3200Z M4200 2670L4240 2720 4330 2770 4290 2765Z" fill="#52675f"/>';
 // A shallow rear wet plane carries the same opening upside-down, shifted
 // sideways from all three frames. This is painted scenery, not a new pool.
 art+=P([[3970,3200],[4670,3270],[4870,3450],[4090,3370]],'#102624')+P([[4070,3230],[4490,3270],[4570,3370],[4170,3330]],'#334b43')+P([[4130,3248],[4430,3276],[4495,3340],[4205,3315]],'#0a1d1b')+P([[4160,3254],[4185,3256],[4250,3320],[4220,3317]],'#456055')+P([[4385,3270],[4410,3273],[4475,3334],[4450,3332]],'#2c4239');
 // In the basin, a reflected portal lies under an empty gap, not its source.
 art+=P([[5610,5720],[6050,5720],[6120,6190],[6030,6420],[5680,6270]],'#263c37')+P([[5670,5750],[5990,5750],[6040,6150],[5980,6320],[5720,6220]],'#0b1c1b')+P([[5690,5740],[5710,5740],[5765,6240],[5740,6210]],'#40534a');
 const q=asset(id+'-forms','불일치하는 배면 시설과 물',art,[],[2600,1750,3600,4700],'wood');a.vector.root.children.push(...q.vector.root.children);a.collision=[];p.library.push(a);e.assetId=id;return p;
}
if(process.argv[1]===fileURLToPath(import.meta.url)){const file=process.argv[2]||'shared/data/campaign.json';await writeFile(file,JSON.stringify(applyStage27Distortion(JSON.parse(await readFile(file,'utf8'))),null,2)+'\n');}
