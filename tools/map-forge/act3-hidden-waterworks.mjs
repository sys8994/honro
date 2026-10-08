/** Hidden collection depot: authored masonry, disconnected landings and recoverable M09 crossings.
 * This is a concealed store for things taken from Jeomungol, never the Mumeongsa foundry. */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {runtime} from '../../game/tests/helpers.mjs';
import {P,R,line,asset,put,terrain,pool,marker,players,stage,cityEnvironment,settle} from './act3-map-kit.mjs';
const clone=x=>JSON.parse(JSON.stringify(x));
const prefix='a3-waterworks:';
// Structural reference: NRICH Suwon Fortress, dressed stone waterbreaks and round sluice arches.
// https://portal.nrich.go.kr/kor/archeologyUsrView.do?idx=8861&menuIdx=567
function decor(p,s,id,art,bounds,collision=[]){const a=asset(`${prefix}${s.metadata.stageId}:${id}`,id,art,collision,bounds,'stone');a.tags.push('artificial-waterworks');a.params.rearOnly=!collision.length;put(p,s,a,id,0,0);return a;}
function podium(p,s,id,left,right,y,bottom){
 const body=[[left,y],[right,y],[right+65,bottom],[left-65,bottom]],w=right-left;
 let svg=`<defs><linearGradient id="${id}-stone" x1="0" y1="${y}" x2="0" y2="${bottom}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#556b69"/><stop offset=".45" stop-color="#2d474a"/><stop offset="1" stop-color="#142b33"/></linearGradient></defs>`+P(body,`url(#${id}-stone)`)+P([[left,y],[right,y],[right+5,y+45],[left-5,y+45]],'#8d9987')+R(left,y+8,w,9,'#bac1a3')+R(left-4,y+48,w+8,22,'#1b333a');
 // Large dressed-stone courses; staggered joints are construction, not noise.
 for(let row=0;row<5;row++){const yy=y+84+row*130;if(yy>bottom-60)break;svg+=line([[left-8,yy],[right+8,yy]],'#142f36',7);for(let x=left+80+(row%2)*155;x<right-35;x+=310)svg+=line([[x,yy],[x+5,Math.min(yy+124,bottom)]],'#18343b',5);}
 svg+=P([[right-90,y+72],[right+7,y+72],[right+61,bottom],[right-45,bottom]],'#203a40')+line([[left+18,y+72],[left-24,bottom]],'#536c69',12);
 decor(p,s,id,svg,[left-70,y-4,w+140,bottom-y+8],[body]);
}
function warehouse(p,s,id,x,y,w=750,h=620){
 const l=x-w/2,r=x+w/2,top=y-h;let art=R(l-65,top-90,w+130,h+90,'#253e42')+R(l-44,top-66,w+88,h+66,'#58655a')+R(l-15,top-33,w+30,h+33,'#132b32')+R(l+15,top+5,w-30,h-8,'#544e3c');
 for(let i=0;i<7;i++)art+=R(l+20+i*(w-40)/7,top+13,9,h-24,'#787255');
 art+=R(l+5,top+68,w-10,27,'#8a7954')+R(l+5,y-137,w-10,27,'#857551')+R(x-12,top+10,24,h-15,'#282f2b')+R(x-48,y-244,22,48,'#a7945c')+R(x+27,y-244,22,48,'#a7945c');
 art+=P([[x-112,y-350],[x-74,y-364],[x+118,y-152],[x+77,y-139]],'#c4b895')+P([[x+89,y-370],[x+121,y-342],[x-67,y-135],[x-107,y-162]],'#9e9d7f')+R(l-74,top-100,w+148,35,'#88927c')+R(l-61,top-65,31,h+65,'#788370')+R(r+28,top-65,31,h+65,'#485e58');
 decor(p,s,id,art,[l-80,top-110,w+160,h+120]);
}
function belongings(p,s,id,x,y,groupNumber){
 let a=R(x-180,y-38,355,32,'#6f6449')+R(x-164,y-15,18,15,'#3c4235')+R(x+129,y-15,18,15,'#3c4235');
 // Bundled household bowls, spoons, hoes and an individual-name tablet share one binding.
 a+=P([[x-125,y-64],[x-54,y-64],[x-62,y-39],[x-112,y-39]],'#a6a079')+P([[x-116,y-86],[x-47,y-86],[x-55,y-63],[x-105,y-63]],'#7c886d');
 for(const [dx,dy]of [[-32,-81],[-9,-68],[14,-92]])a+=line([[x+dx,y+dy],[x+dx+65,y+dy-75]],'#aa9f6f',7)+P([[x+dx+55,y+dy-77],[x+dx+70,y+dy-93],[x+dx+81,y+dy-82],[x+dx+71,y+dy-67]],'#b7ad7c');
 a+=line([[x+40,y-36],[x+143,y-239]],'#8b7550',13)+P([[x+124,y-247],[x+191,y-222],[x+171,y-179],[x+110,y-205]],'#697b73');
 a+=P([[x-38,y-192],[x+43,y-202],[x+60,y-74],[x-20,y-66]],'#b5a47b')+line([[x-17,y-177],[x+16,y-180]],'#414b41',5)+line([[x-13,y-162],[x+25,y-166]],'#414b41',5)+line([[x-8,y-146],[x+30,y-150]],'#414b41',5);
 a+=line([[x-137,y-114],[x+95,y-47],[x+137,y-111]],'#a98b56',9)+line([[x-58,y-208],[x-15,y-33]],'#b49a67',7);
 decor(p,s,id,a,[x-190,y-255,400,265]);s.design.act3.householdBundles??=[];s.design.act3.householdBundles.push({id,familyNumber:groupNumber,contents:['숟가락','놋그릇','농기구','이름표'],matches:'지상 희생자 명단',x,y});
}
function facility(p,s,pods,{deep=false}={}){
 cityEnvironment(p,s,{mood:'night',interior:true,ground:s.height-100});s.environment.skyVisible=false;s.environment.atmosphere.overrides={...s.environment.atmosphere.overrides,skyTop:'#07171e',skyBottom:'#142e36',hazeStrength:.08,mistStrength:.025,lightStrength:.03,waterBaseColor:'#0c2631',waterHighlightColor:'#527771'};
 const ceiling=deep?1000:1150,bottom=s.height+1500,waterY=deep?3690:3170;
 // A finite constructed chamber, with a great empty dark volume between the beam grid and the water.
 let wall=`<defs><linearGradient id="depot-wall" x1="0" y1="${ceiling}" x2="0" y2="${s.height}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#11262d"/><stop offset=".6" stop-color="#233e43"/><stop offset="1" stop-color="#091c26"/></linearGradient></defs>`+R(-16000,-10000,s.width+32000,s.height+13000,'#0a1b23')+R(-300,ceiling,s.width+600,s.height-ceiling,'url(#depot-wall)');

 // Rear hydraulic arches recede behind the usable quays. Voussoirs are radial dressed stones,
 // not a natural cave opening; wide dark recesses make the chamber larger than its walking surface.
 for(const [i,x] of (deep?[1900,4650,7420]:[2450,6110]).entries()){
  const cy=deep?2770:2500,rx=deep?940:820,ry=deep?1040:790;
  wall+=`<path d="M${x-rx-95} ${waterY+160}V${cy}A${rx+95} ${ry+90} 0 0 1 ${x+rx+95} ${cy}V${waterY+160}Z" fill="#30474a"/>`;
  wall+=`<path d="M${x-rx} ${waterY+160}V${cy}A${rx} ${ry} 0 0 1 ${x+rx} ${cy}V${waterY+160}Z" fill="#0d222b"/>`;
  for(let j=0;j<11;j++){const a=Math.PI+j*Math.PI/11+.014,b=Math.PI+(j+1)*Math.PI/11-.014,pt=(t,xx,yy)=>[x+Math.cos(t)*xx,cy+Math.sin(t)*yy];wall+=P([pt(a,rx+95,ry+90),pt(b,rx+95,ry+90),pt(b,rx,ry),pt(a,rx,ry)],j%3===0?'#52635b':'#3e5553');}
  wall+=R(x-rx-85,cy,72,waterY-cy+140,'#405851')+R(x+rx+14,cy,72,waterY-cy+140,'#273f43');
 }
 // Heavy Korean timber joists seated on stone corbels. No floating decorative planks.
 for(const x of [450,deep?3700:2900,deep?7300:6100]){
 wall+=P([[x-100,ceiling],[x+115,ceiling],[x+215,bottom],[x-180,bottom]],'#20383d')+P([[x-90,ceiling],[x-35,ceiling],[x-78,bottom],[x-169,bottom]],'#3b5251');
 wall+=R(x-172,ceiling+175,380,95,'#4a5145')+R(x-155,ceiling+270,348,43,'#69705a')+P([[x-153,ceiling+313],[x+184,ceiling+313],[x+92,ceiling+391],[x-75,ceiling+391]],'#394a42');
 }
 wall+=R(-300,ceiling+110,s.width+600,86,'#424b40')+R(-300,ceiling+111,s.width+600,18,'#6b7159')+R(-300,ceiling+195,s.width+600,55,'#101f24');
 for(const y of [waterY-310,waterY-105])wall+=line([[-300,y],[s.width+300,y]],'#52655a',10)+line([[-300,y+20],[s.width+300,y+20]],'#233d41',7);
 decor(p,s,'continuous-masonry-waterline',wall,[-16000,-10000,s.width+32000,s.height+13000]);
 for(let i=0;i<pods.length;i++){const q=pods[i];warehouse(p,s,'sealed-store-'+i,(q[0]+q[1])/2,q[2],Math.min(770,(q[1]-q[0])*.64),deep?650:530);podium(p,s,'stone-quay-'+i,...q,s.height+1300);}
 for(let i=0;i<pods.length-1;i++){const q=pods[i],z=pods[i+1];pool(s,'black-water-'+i,q[1]+5,z[0]-5,waterY,s.height+800);const x=q[1]-150,y=q[2];decor(p,s,'broken-haulway-'+i,R(x,y-110,140,25,'#615d47')+P([[x+120,y-108],[x+218,y-77],[x+182,y-42],[x+128,y-75]],'#7f7351')+R(x+10,y-110,18,110,'#686449')+line([[x+32,y-103],[x+191,y-53]],'#a08e62',6),[x,y-120,240,135]);}
 terrain(s,'deep-unwalkable-basin',[[-500,s.height+500],[s.width+500,s.height+500],[s.width+500,s.height+1500],[-500,s.height+1500]],'stone',{honroWaterworksBasin:true});
 s.design.act3.artContract={setting:'인공 지하 은폐 집하장',not:'자연동굴 또는 무명사 주조소',forms:['검은 수면','조적 석대','봉인 창고문','수위선','끊긴 운반로','큰 어둠'],deep};
}
function action(s,id,x,y,label){return marker(s,id,x,y,label,{action:true});}
function encounter(s,id,purpose,anchor,rows){const ids=[];for(const [i,[kind,x,y,elite=false]]of rows.entries()){const uid=`a3-${s.metadata.stageId}-${id}-${i}`;ids.push(uid);s.units.push({id:uid,kind,team:'enemy',x,y,facing:-1,spawnIndex:s.units.filter(u=>u.team==='enemy').length,behavior:'patrol',encounterGroup:id,stageOverrides:{honroCohort:id,honroAct3Encounter:1,honroAct3Elite:elite,honroEncounterRole:kind==='lantern'?'ranged':'frontline'}});}s.encounters.push({id,key:id,behavior:'patrol',unitIds:ids});s.design.act3.encounterPlan.groups.push({id,purpose,anchor});}
function base(g,id,name,w,h){const s=stage(g,id,name,w,h,'hidden-waterworks');s.initialState.honroWaterworksRevision=1;s.metadata.hiddenWaterworks=true;s.initialState.honroActiveLimit=2;s.design.act3.waterworksRevision=1;s.design.act3.party=['archer','mage'];s.design.act3.encounterPlan={version:2,groups:[],activeLimit:2};return s;}
function finish(g,p,s){s.units=s.units.filter(u=>u.team!=='player'||['archer','mage'].includes(u.kind));s.design.act3.requiredRoute=s.markers.map(m=>({x:m.x,y:m.y}));settle(g,p,s);const en=s.units.filter(u=>u.team==='enemy');Object.assign(s.design.act3.encounterPlan,{initial:en.length,elites:en.filter(u=>u.stageOverrides.honroAct3Elite).length});return s;}
export function buildWaterworks25(g,p){const s=base(g,25,'물 아래 묶인 이름',7200,4600),pods=[[0,2100,2700],[3200,7200,2700]];facility(p,s,pods);players(s,320,2700);action(s,'depot-entry-seal',1250,2700,'담허와 수로 봉인 살피기');marker(s,'stake-arrival-1',3520,2700,'두 동행이 건너편 석대에 모이기');action(s,'household-tally',5050,2700,'생활물품의 가족 번호 확인');marker(s,'waterworks-exit',6840,2700,'안쪽 집하장 입구로 이동',{type:'exit'});belongings(p,s,'family-bundle-17',4990,2700,'열일곱');belongings(p,s,'family-bundle-18',5560,2700,'열여덟');
 s.design.act3.crossings=[{id:'waterworks-first',from:{x:1860,y:2700},to:{x:3450,y:2700},fromZone:{left:1550,right:2100,y:2700},landing:{left:3200,right:7200,y:2700},checkpoint:{x:1570,y:2700},markerId:'stake-arrival-1'}];
 encounter(s,'seal-approach','입구 봉인을 지키는 들린 짐과 등불. 첫 진목 설치면은 비운다.','depot-entry-seal',[['picks',1060,2700],['lantern',1450,2700,true]]);encounter(s,'numbered-goods','건너편 착지면 뒤의 생활물품 무리. 가족 번호 조사면 동쪽을 막는다.','household-tally',[['picks',4480,2700,true],['minecart',4700,2700],['lantern',5410,2700]]);encounter(s,'inner-store','봉인창고 출구 앞에 남은 들린 운반도구.','waterworks-exit',[['picks',6040,2700],['lantern',6320,2700]]);return finish(g,p,s);}
export function buildWaterworks27(g,p){const s=base(g,27,'검은 집하장',9600,5200),pods=[[0,1700,3300],[2850,4100,2750],[5100,6500,3450],[7700,9600,2850]];facility(p,s,pods,{deep:true});players(s,330,3300);action(s,'depot-route-ledger',1180,3300,'끊긴 운반로의 순서 확인');
 const crossings=[{id:'upper-quay',from:{x:1480,y:3300},to:{x:3090,y:2750},fromZone:{left:1150,right:1700,y:3300},landing:{left:2850,right:4100,y:2750},checkpoint:{x:1220,y:3300}},{id:'lower-quay',from:{x:3900,y:2750},to:{x:5340,y:3450},fromZone:{left:3550,right:4100,y:2750},landing:{left:5100,right:6500,y:3450},checkpoint:{x:3630,y:2750}},{id:'sealed-quay',from:{x:6280,y:3450},to:{x:7940,y:2850},fromZone:{left:5950,right:6500,y:3450},landing:{left:7700,right:9600,y:2850},checkpoint:{x:5940,y:3450}}];
 crossings.forEach((c,i)=>{c.markerId='stake-arrival-'+(i+1);marker(s,c.markerId,c.to.x+50,c.to.y,'두 동행이 다음 석대에 모이기');});s.design.act3.crossings=crossings;
 action(s,'family-manifest',8830,2850,'가족 번호와 지상 명단 맞추기');marker(s,'deep-depot-exit',9320,2850,'합류할 출구로 이동',{type:'exit'});belongings(p,s,'numbered-family-bundle',3770,2750,'스물하나');belongings(p,s,'sunk-family-tools',6030,3450,'스물둘');belongings(p,s,'manifest-bundle',8730,2850,'열일곱');
 encounter(s,'entry-hauling-remnants','낮은 입구 석대의 들린 운반 도구. 첫 출발면은 비움.','depot-route-ledger',[['minecart',950,3300],['lantern',1180,3300]]);encounter(s,'high-numbered-store','높은 석대 창고의 원거리 등불. 착지 안전면 동쪽에 배치.','stake-arrival-1',[['picks',3730,2750,true],['lantern',3940,2750]]);encounter(s,'lower-loading-store','낮은 수위선의 무거운 짐과 도구. 다음 출발 전 제거.','stake-arrival-2',[['minecart',5960,3450,true],['picks',6200,3450]]);encounter(s,'sealed-manifest-store','마지막 봉인창고의 등불과 들린 육신. 집결면은 비운다.','family-manifest',[['possessedGuard',8580,2850,true],['lantern',8990,2850]]);return finish(g,p,s);}
export function applyHiddenWaterworks(g,input,{representativesOnly=true}={}){let p=clone(input);p.library=p.library.filter(a=>!a.id.startsWith(prefix));for(const build of [buildWaterworks25,buildWaterworks27]){const s=build(g,p);p.stages[p.stages.findIndex(t=>t.metadata.stageId===s.metadata.stageId)]=s;}p=g.HonroMaps.finalize(g.HonroTerrainDomain.author(p));return p;}
if(process.argv[1]===fileURLToPath(import.meta.url)){const input=process.argv[2]||'shared/data/campaign.json',out=process.argv[3]||'_local/reports/hidden-waterworks/project.json';const g=await runtime({legacyMaps:false}),p=applyHiddenWaterworks(g,JSON.parse(await readFile(input,'utf8')));await mkdir(out.split('/').slice(0,-1).join('/'),{recursive:true});await writeFile(out,JSON.stringify(p,null,2)+'\n');console.log(out);}
