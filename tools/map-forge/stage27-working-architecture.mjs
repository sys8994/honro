/** Stage27 artwork-only refinement of existing collidable structural assets.
 * Gallery polygons, one-way flags, objectives and save contracts are retained;
 * three roof polygons are translated to reachable eaves. New asset IDs leave serialized older scenes self-contained. */
import {readFile,writeFile} from 'node:fs/promises';import{fileURLToPath}from'node:url';
import {P,R,line,asset} from './act3-map-kit.mjs';
const prefix='stage27-depot-r3:';
export function applyStage27WorkingArchitecture(input){const p=structuredClone(input),s=p.stages[26];if(s.elements.some(e=>e.assetId===prefix+'gallery-0'))return p;
 const replace=(e,svg,bounds)=>{const old=p.library.find(a=>a.id===e.assetId),a=asset(prefix+e.id,old.name,svg,[],bounds||[old.bounds.x,old.bounds.y,old.bounds.w,old.bounds.h],old.material);a.collision=structuredClone(old.collision);a.oneWay=old.oneWay;a.tags=[...old.tags];a.params={...old.params};p.library.push(a);e.assetId=a.id;};
 for(let i=0;i<8;i++){const e=s.elements.find(e=>e.id==='gallery-'+i),old=p.library.find(a=>a.id===e.assetId),q=old.collision[0],l=Math.min(...q.map(q=>q.x)),r=Math.max(...q.map(q=>q.x)),y=Math.min(...q.map(q=>q.y)),bottom=Math.max(...q.map(q=>q.y)),w=r-l,h=bottom-y,poly=q.map(q=>[q.x,q.y]),wood=[4,6,7].includes(i);
 let art=P(poly,wood?'#554a37':'#465951','#142b2b',5)+P([[l,y],[r,y],[r-8,y+17],[l+12,y+23]],wood?'#a8976e':'#a3a58a')+P([[l+8,y+24],[r-12,y+19],[r-20,y+48],[l+12,y+57]],wood?'#72634a':'#788778');
 if(h>500){
  // Unequal courses, a broad pier face and recessed mortar beds: massive quay.
  art+=P([[l+35,y+78],[l+w*.37,y+78],[l+w*.31,bottom],[l+18,bottom]],'#526354')+P([[l+w*.78,y+78],[r-20,y+78],[r-30,bottom],[l+w*.67,bottom]],'#2e4541');
  for(let row=0;row<7;row++){const yy=y+95+row*184;let x=l+30;for(let j=0;x<r-40;j++){const width=Math.min([275,360,230][(j+row)%3],r-25-x);art+=P([[x+8,yy+9],[x+width-14,yy],[x+width-5,yy+143],[x+19,yy+153]],['#607264','#4b6258','#52675b'][(j+row)%3])+P([[x+8,yy+9],[x+width-14,yy],[x+width-13,yy+16],[x+17,yy+25]],'#82907a');x+=width;}}
  art+=P([[l+100,y+430],[l+310,y+422],[l+300,y+805],[l+115,y+818]],'#263f3b')+P([[l+100,y+430],[l+135,y+450],[l+145,y+818],[l+115,y+818]],'#6a7b69');
 }else if(wood){
  art+=R(l+12,y+58,w-25,36,'#332f25')+R(l+12,y+58,w-25,9,'#897657');
  for(const x of[l+55,l+w*.4,r-110]){art+=P([[x,y+28],[x+72,y+28],[x+68,y+99],[x+8,y+99]],'#715e42')+R(x+12,y+37,46,47,'#433e2e')+R(x+20,y+42,16,16,'#af9767');}
  // Long scarf joint, not triangular floating brackets.
  art+=P([[l+w*.58,y+59],[l+w*.65,y+59],[l+w*.65,y+74],[l+w*.72,y+74],[l+w*.72,y+91],[l+w*.58,y+91]],'#a18c60');
 }else{
  for(const [j,x]of [l+20,l+w*.32,l+w*.68].entries()){const width=[w*.29,w*.33,w*.28][j];art+=P([[x+4,y+37],[x+width-8,y+31],[x+width-12,y+88],[x+10,y+95]],j===1?'#667765':'#596e61')+line([[x+9,y+42],[x+width-16,y+37]],'#9ba18a',4);}
 }
 replace(e,art,[l-5,y-5,w+10,h+10]);
 }
 // Roofs remain exactly the original one-way surfaces, with compact eaves and
 // wood bearing rather than generic rectangular ledges. No decorative tall finials.
 for(const id of['loading-office-roof','far-passage-roof','ledger-room-roof']){const e=s.elements.find(e=>e.id===id),old=p.library.find(a=>a.id===e.assetId),original=old.collision[0],floor={'loading-office-roof':4250,'far-passage-roof':4400,'ledger-room-roof':2600}[id],dy=floor-180-original[0].y,q=original.map(v=>({x:v.x,y:v.y+dy})),l=q[0].x,r=q[1].x,y=q[0].y,b=q[2].y;let a=P(q.map(q=>[q.x,q.y]),'#4d5144','#182d2b',5)+P([[l,y],[r,y],[r,y+15],[l,y+18]],'#929781')+R(l+6,y+22,r-l-12,21,'#6d705d')+R(l+10,b-34,r-l-20,27,'#574936');for(let x=l+35;x<r-20;x+=110)a+=P([[x,y+18],[x+58,y+16],[x+69,y+43],[x-8,y+44]],'#687461')+R(x+6,b-31,33,22,'#9b835a');// Bearing posts and stone feet are visual only, allowing below-jump/drop.
 const posts=[l+42,r-70];let bearing=R(l+34,b-5,r-l-68,15,'#564936');for(const x of posts)bearing+=R(x-9,b+5,35,floor-b-24,'#443e2f')+R(x-5,b+7,10,floor-b-28,'#827050')+P([[x-19,floor-23],[x+34,floor-23],[x+42,floor],[x-27,floor]],'#667268')+R(x-14,b+10,45,13,'#907950');a=bearing+a;replace(e,a,[l-6,y-6,r-l+12,floor-y+12]);p.library.at(-1).collision=[q];}
 for(const [id,x,y,w]of[['far-sealed-store',7490,4400,420],['ledger-vault',1530,2600,330]]){const e=s.elements.find(e=>e.id===id),l=x-w/2;let v=R(l-22,y-174,w+44,174,'#40574e')+R(l,y-164,w,164,'#172d27')+R(l+18,y-156,w-36,156,'#55563d');for(let j=0;j<6;j++)v+=R(l+25+j*(w-50)/6,y-148,12,143,'#93815a');v+=R(l+8,y-129,w-16,15,'#8b7853')+R(l+8,y-48,w-16,17,'#a18b5e')+R(x-10,y-110,20,52,'#b3a27b');replace(e,v,[l-24,y-178,w+48,182]);}
 // Tall rear columns and beams are scenery. Replace free-floating decorative
 // water ribbons with water clinging to a contradictory rear drainage channel.
 const rear=s.elements.find(e=>e.id==='vertical-depot-shell'),old=p.library.find(a=>a.id===rear.assetId),a=structuredClone(old);a.id=prefix+'rear-drainage';a.name='높이가 어긋난 하역 배수로';const ribbonColors=new Set(['#334a44','#506058','#2e4942','#617068','#52675f']);a.vector.root.children=a.vector.root.children.filter(n=>!ribbonColors.has(n.fill));
 let art=P([[2660,2920],[3450,2630],[3830,2606],[3830,2644],[3450,2674],[2660,2964]],'#3d554b')+P([[2670,2927],[3450,2640],[3830,2617],[3830,2627],[3450,2654],[2670,2940]],'#718176')+P([[3970,2850],[4620,2990],[4930,2710],[4930,2745],[4630,3033],[3970,2890]],'#2c473c');
 // At the break, water still runs horizontally across a dark disconnected joint;
 // the receiving stone gutter resumes lower and at a different vanishing point.
 art+=P([[3830,2617],[4020,2617],[4020,2631],[3830,2631]],'#63776b')+P([[4008,2631],[4020,2631],[4020,2876],[4008,2871]],'#425c4d');
 // Right rear work bay: stone sill with a shut timber sluice, its wet lower edge
 // above the apparent receiving channel. Familiar facilities disagree physically.
 art+=P([[4320,3100],[4760,3160],[4780,3190],[4315,3134]],'#415249')+P([[4370,2850],[4660,2888],[4660,3135],[4370,3095]],'#182b23');
 for(let j=0;j<5;j++){const x=4376+j*54;art+=P([[x,2860+j*7],[x+39,2865+j*7],[x+39,3103+j*7],[x,3097+j*7]],j%2?'#344133':'#2b3b2d');}art+=P([[4355,2934],[4680,2975],[4680,3000],[4355,2959]],'#4a503d');
 const extra=asset(prefix+'water','연결 모순 배수면',art,[],[2600,2500,2500,900]);a.vector.root.children.push(...extra.vector.root.children);p.library.push(a);rear.assetId=a.id;
 return p;}
if(process.argv[1]===fileURLToPath(import.meta.url)){const file=process.argv[2]||'shared/data/campaign.json';await writeFile(file,JSON.stringify(applyStage27WorkingArchitecture(JSON.parse(await readFile(file,'utf8'))),null,2)+'\n');}
