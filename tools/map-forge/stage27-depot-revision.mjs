/** Stage 27 only. Explicit new-map authoring; never migrate serialized battles. */
import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {P,R,line,asset,put} from './act3-map-kit.mjs';
const prefix='stage27-depot-r1:';
export function applyStage27Depot(input){
 const p=structuredClone(input),s=p.stages.find(s=>s.metadata.stageId===27);
 if(s.initialState.honroDepotTerrainRevision===1)return p;
 const add=(id,art,bounds,collision=[])=>put(p,s,asset(prefix+id,id,art,collision,bounds,'wood'),prefix+id,0,0);
 // A low, wide timber haulage hall, not a second monumental sluice throat.
 // Rear forms have no outline or collision. Foreground quay edges retain the
 // existing four gate landing coordinates and unobstructed observation shots.
 let rear=`<defs><linearGradient id="depot-depth" x1="0" y1="1500" x2="0" y2="5700" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#10272f"/><stop offset=".55" stop-color="#243c40"/><stop offset="1" stop-color="#0c242c"/></linearGradient></defs>`+R(-16000,-10000,40200,30200,'#0a1c25')+R(-300,1400,8800,4500,'url(#depot-depth)');
 // Three masonry bearing masses terminate at the drowned floor. Broad uneven
 // mortar courses explain their load, rather than enormous freestanding bars.
 for(const [x,top,w]of[[240,2070,370],[3630,1760,490],[7500,1750,400]]){
  rear+=P([[x+45,top],[x+w-45,top],[x+w+80,5690],[x-75,5690]],'#31494b')+P([[x+45,top],[x+105,top],[x+30,5690],[x-75,5690]],'#3d5351')+P([[x+w-110,top],[x+w-45,top],[x+w+80,5690],[x+w-30,5690]],'#192f35');
  for(let row=0;row<9;row++){const y=top+130+row*395,width=w+row*15;rear+=P([[x+21-row*6,y],[x+width-38,y-14],[x+width-23,y+216],[x-row*6,y+240]],row%3===0?'#3b5050':'#2b4245')+P([[x+20-row*6,y],[x+width-38,y-14],[x+width-41,y+9],[x+18-row*6,y+23]],'#4a5b55');}
 }
 // Load bays sit behind the real quay levels. Their head beams rest on stone
 // corbels; the upper ledger alcove and drowned berth have unequal proportions.
 for(const [x,y,w,h]of[[600,4700,1020,650],[2490,4250,920,590],[4640,4850,1300,800],[6390,4400,1100,720],[1200,2600,1020,520]]){
  rear+=P([[x-30,y-h-70],[x+w+10,y-h-55],[x+w+35,y],[x-42,y]],'#304747')+R(x,y-h,w,h,'#0b232a');
  for(const [j,xx]of[x+25,x+w*.49,x+w-70].entries()){
   rear+=R(xx-19,y-h-25,101,h+25,'#223936')+R(xx,y-h,64,h,'#4b5144')+R(xx,y-h,14,h,'#626553')+R(xx+44,y-h,20,h,'#333f38');
   rear+=P([[xx-32,y-h+38],[xx+95,y-h+38],[xx+84,y-h+93],[xx-22,y-h+93]],'#655f49');
   rear+=P([[xx+34,y-h+100],[xx+173,y-h+230],[xx+198,y-h+205],[xx+65,y-h+73]],'#414b3f');
   rear+=P([[xx-38,y-52],[xx+104,y-52],[xx+121,y],[xx-50,y]],'#415550');
  }
  rear+=P([[x-25,y-h-20],[x+w+30,y-h-35],[x+w+35,y-h+39],[x-25,y-h+52]],'#4b5144')+P([[x-25,y-h-20],[x+w+30,y-h-35],[x+w+30,y-h-18],[x-25,y-h-2]],'#6a6c56');
  // Surviving plank skins stop short of open loading doors. Missing plank ends
  // show thickness and water staining, not a repeat barred-prison silhouette.
  for(const [j,xx]of[x+w*.58,x+w*.68,x+w*.78].entries()){
   const end=y-30-[35,0,95][j];rear+=P([[xx,y-h+58],[xx+w*.075,y-h+54],[xx+w*.075-7,end],[xx+8,end+15]],j===1?'#3d493f':'#35433c')+P([[xx+5,y-h+65],[xx+15,y-h+65],[xx+17,end-20],[xx+8,end-13]],'#52594a');
  }
  rear+=R(x+w*.56,y-180,w*.32,36,'#50513f');
 }
 // A stranded low-hulled freight boat belongs to the waterline, not the path.
 rear+=P([[1060,5410],[1510,5525],[3070,5525],[3510,5400],[3360,5760],[1640,5850],[1260,5700]],'#172c31')+P([[1060,5410],[1510,5510],[3070,5510],[3510,5400],[3410,5480],[3120,5580],[1510,5590]],'#4b5147');
 for(const [x,lean,h]of[[1510,-75,270],[1840,-25,330],[2250,30,300],[2740,65,340],[3140,105,240]])rear+=P([[x-24,5680],[x+24,5680],[x+lean+35,5680-h],[x+lean-9,5680-h]],'#3c4c45');
 rear+=P([[1360,5620],[3130,5600],[3370,5510],[3330,5560],[3140,5650],[1390,5670]],'#35453d');
 rear+=R(-300,5690,8800,2210,'#0b2531')+line([[-300,5706],[8500,5706]],'#567a78',9);
 const shell=s.elements.find(e=>e.id==='vertical-depot-shell');const a=asset(prefix+'rear-haulage-hall','수몰 목조 집하장 배면',rear,[],[-16000,-10000,40200,30200],'wood');p.library.push(a);shell.assetId=a.id;
 // Quays read as massive load-bearing structures, not thin parallel shelves.
 for(const [i,l,r,y,depth]of[[1,2450,3500,4250,370],[3,6150,7900,4400,570],[7,1100,2250,2600,300]]){
  const face=[[l,y+21],[r,y+21],[r,y+depth],[l+60,y+depth+45],[l,y+depth-20]];
  let v=P(face,'#364e4c')+P([[l,y+23],[r,y+23],[r,y+65],[l,y+65]],'#8b9078');
  for(const [j,x]of [l+90,l+(r-l)*.48,r-140].entries())v+=P([[x,y+68],[x+73,y+68],[x+105,y+depth+20],[x-30,y+depth+20]],j===1?'#56675a':'#41594f');
  v+=line([[l+12,y+depth*.6],[r-12,y+depth*.6]],'#243c3d',12);
  add('quay-face-'+i,v,[l,y,r-l,depth+50],[face]);
 }
 // Two-sided cargo loading incline. Low enough to return using ordinary walk;
 // its broad crest changes close-range sight lines, not mandatory progression.
 const mound=[[4900,4850],[5090,4750],[5230,4750],[5420,4850]];
 let cargo=P(mound,'#695e46','#172d31',5)+P([[5090,4750],[5230,4750],[5310,4792],[5010,4792]],'#a09167');
 for(const x of[4930,4990,5050,5320,5380])cargo+=line([[x,4848],[x+30,4825]],'#baaa78',6);
 cargo+=R(5100,4772,115,65,'#4c4937')+line([[5108,4780],[5208,4829]],'#918261',9);
 add('cargo-incline',cargo,[4895,4745,530,110],[mound]);
 // Replace decoration that falsely showed crates on the new approach plane.
 s.elements=s.elements.filter(e=>e.id!=='abandoned-loading-shed');
 // Low open timber shed: thick lintel, paired face planes and scarf joint.
 let crane=R(4780,4300,790,40,'#1b3030')+R(4780,4300,790,10,'#9b8962')+R(4790,4310,770,21,'#6f6248')+P([[4750,4290],[4950,4210],[5360,4210],[5600,4300],[5570,4320],[5330,4240],[4970,4240],[4780,4315]],'#34463f')+P([[4750,4290],[4950,4210],[5360,4210],[5360,4223],[4965,4230],[4768,4304]],'#737661');
 for(const [x,lean]of[[4800,1],[5520,-1]]){crane+=R(x-5,4340,48,510,'#1a3030')+R(x,4340,38,510,'#6b6048')+R(x+3,4340,8,510,'#a18d64')+P([[x+18,4340],[x+18+lean*126,4470],[x+34+lean*126,4452],[x+36,4330]],'#76684b')+R(x-13,4330,65,25,'#9a865d')+R(x-15,4807,68,43,'#526250');}
 crane+=R(5560,4230,38,620,'#283932')+R(5567,4230,9,620,'#8a7957')+R(5400,4240,420,33,'#78664a')+R(5400,4240,420,8,'#a48d63')+P([[5580,4280],[5740,4430],[5760,4412],[5600,4263]],'#62563e')+line([[5430,4273],[5430,4620]],'#8a8468',6)+P([[5400,4620],[5460,4620],[5445,4644],[5416,4644]],'#4a5a4c');
 add('loading-hoist',crane,[4740,4200,1100,660]);
 // Enemy identities, counts, cohorts and every objective are unchanged.
 const cart=s.units.find(u=>u.team==='enemy'&&u.kind==='minecart'&&u.x===5180);if(cart)cart.y=4750;
 const group=s.design.act3.encounterPlan.groups.find(q=>q.id==='lower-loading-store');
 if(group){group.description='수몰 부두의 운반수레가 적재 경사면을 점유하고 곡괭이가 낮은 출구를 지킨다. 양쪽 경사로로 접근·복귀할 수 있다.';for(const m of group.members||[])if(m.x===5180)m.y=4750;}
 s.initialState.honroDepotTerrainRevision=1;
 s.design.act3.depotRevision={version:1,kind:'drowned-timber-loading-quay',preserved:'four V3 crossings, objective revision, story anomaly, finite reinforcements and serialized saves',routes:[{id:'cargo-incline-return',points:[[4900,4850],[5090,4750],[5230,4750],[5420,4850]],role:'ordinary movement in both directions; low local firing crest, not a universal high point'}]};
 return p;
}
if(process.argv[1]===fileURLToPath(import.meta.url)){const file=process.argv[2]||'shared/data/campaign.json';await writeFile(file,JSON.stringify(applyStage27Depot(JSON.parse(await readFile(file,'utf8'))),null,2)+'\n');}
