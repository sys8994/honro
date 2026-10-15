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
 let rear=R(-16000,-10000,40200,30200,'#0a1c25')+R(-300,1400,8800,4500,'#183138');
 for(const [x,y,w,h]of[[470,2070,2450,2450],[3160,1800,2320,3660],[5850,1770,2040,3660]]){
  rear+=R(x,y,w,h,'#122830')+R(x+50,y+70,w-100,h-70,'#203a3d');
  for(const xx of[x+90,x+w*.51,x+w-100])rear+=R(xx,y+100,64,h-100,'#344748')+R(xx+12,y+100,12,h-100,'#46554f');
  for(const yy of[y+140,y+h*.55])rear+=R(x,yy,w,80,'#384b49')+R(x,yy+62,w,25,'#10272d');
  rear+=P([[x+70,y+210],[x+400,y+490],[x+435,y+450],[x+115,y+180]],'#384a45');
 }
 // Long loading apertures, closed wooden panels and drowned lower cargo bays.
 for(const [x,y,w,h]of[[260,3520,1020,900],[2700,3100,700,1020],[6300,2800,1090,1450]]){
  rear+=R(x-40,y-60,w+80,h+100,'#344e4e')+R(x,y,w,h,'#0b232b');
  for(let xx=x+25;xx<x+w;xx+=125)rear+=R(xx,y+20,87,h-30,'#293d39');
  rear+=R(x,y+h*.38,w,36,'#465047')+R(x,y+h*.75,w,32,'#35443f');
 }
 rear+=P([[0,5490],[1580,5480],[2190,5560],[3100,5510],[3600,5580],[4390,5540],[4400,6100],[0,6100]],'#263f43');
 // Partial flat-bottom transport hull: asymmetrical surviving ribs, no fantasy prow.
 rear+=P([[1120,5390],[1500,5540],[3130,5540],[3570,5360],[3380,5760],[1640,5850],[1300,5700]],'#182e33');
 rear+=P([[1120,5390],[1510,5525],[3100,5525],[3570,5360],[3480,5470],[3140,5600],[1510,5600]],'#4a5147');
 for(const [x,lean,h]of[[1510,-75,270],[1840,-25,330],[2250,30,300],[2740,65,340],[3140,105,240]])rear+=P([[x-24,5680],[x+24,5680],[x+lean+35,5680-h],[x+lean-9,5680-h]],'#3c4c45');
 rear+=R(-300,5690,8800,2210,'#0b2531')+line([[-300,5706],[8500,5706]],'#567a78',9);
 const shell=s.elements.find(e=>e.id==='vertical-depot-shell');const a=asset(prefix+'rear-haulage-hall','수몰 목조 집하장 배면',rear,[],[-16000,-10000,40200,30200],'wood');p.library.push(a);shell.assetId=a.id;
 // Quays read as massive load-bearing structures, not thin parallel shelves.
 for(const [i,l,r,y,depth]of[[1,2450,3500,4250,370],[3,6150,7900,4400,570],[7,1100,2250,2600,300]]){
  const face=[[l,y+21],[r,y+21],[r,y+depth],[l+60,y+depth+45],[l,y+depth-20]];
  let v=P(face,'#364e4c')+P([[l,y+23],[r,y+23],[r,y+65],[l,y+65]],'#8b9078');
  for(const [j,x]of [l+90,l+(r-l)*.48,r-140].entries())v+=P([[x,y+68],[x+73,y+68],[x+105,y+depth+20],[x-30,y+depth+20]],j===1?'#56675a':'#41594f');
  v+=line([[l+12,y+depth*.6],[r-12,y+depth*.6]],'#243c3d',12);
  add('quay-face-'+i,v,[l,y,r-l,depth+50]);
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
 let crane=R(5530,4070,45,780,'#534f3a')+R(5535,4070,9,780,'#a28d61')+R(5320,4080,510,43,'#776347')+P([[5545,4120],[5740,4310],[5770,4290],[5580,4100]],'#594e39')+line([[5350,4120],[5350,4540]],'#847e62',8)+P([[5315,4540],[5385,4540],[5370,4565],[5330,4565]],'#3a4d46');
 add('loading-hoist',crane,[5310,4060,530,800]);
 // Enemy identities, counts, cohorts and every objective are unchanged.
 const cart=s.units.find(u=>u.team==='enemy'&&u.kind==='minecart'&&u.x===5180);if(cart)cart.y=4750;
 const group=s.design.act3.encounterPlan.groups.find(q=>q.id==='lower-loading-store');
 if(group){group.description='수몰 부두의 운반수레가 적재 경사면을 점유하고 곡괭이가 낮은 출구를 지킨다. 양쪽 경사로로 접근·복귀할 수 있다.';for(const m of group.members||[])if(m.x===5180)m.y=4750;}
 s.initialState.honroDepotTerrainRevision=1;
 s.design.act3.depotRevision={version:1,kind:'drowned-timber-loading-quay',preserved:'four V3 crossings, objective revision, story anomaly, finite reinforcements and serialized saves',routes:[{id:'cargo-incline-return',points:[[4900,4850],[5090,4750],[5230,4750],[5420,4850]],role:'ordinary movement in both directions; low local firing crest, not a universal high point'}]};
 return p;
}
if(process.argv[1]===fileURLToPath(import.meta.url)){const file=process.argv[2]||'shared/data/campaign.json';await writeFile(file,JSON.stringify(applyStage27Depot(JSON.parse(await readFile(file,'utf8'))),null,2)+'\n');}
