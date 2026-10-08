/** V3: solid, finite maintenance galleries. Every lit sill is a real landing.
 * Projectile and body physics remain the shared runtime's unmodified rules. */
import {P,R,line,asset,put,terrain,pool,marker,players,cityEnvironment,stairs,ramp} from './act3-map-kit.mjs';
export const VERTICAL_PLANS={
 25:{width:5600,height:6800,water:5980,pods:[[0,1700,5400],[1950,3750,4950],[2300,3300,4500],[100,1180,4050],[1480,2650,3600],[3350,5350,3600],[1300,3240,3150]],shots:[[1550,2100],[3550,3100],[1450,1050],[1050,1650],[2500,3500],[3550,3080]],names:['하부 수문턱','동쪽 정비실','중앙 점검창','서쪽 전망대','상층 물받이','맞은편 검문실','상층 봉인회랑']},
 27:{width:8200,height:7200,water:5690,pods:[[0,1650,4700],[2450,3500,4250],[4500,6000,4850],[6150,7900,4400],[6180,6900,3950],[4500,5080,3500],[3350,4250,3050],[1100,2250,2600]],shots:[[1500,2140],[3350,4650],[5700,6300],[7100,6660],[5430,4930],[4750,4100],[3500,2970]],names:['운반로 입구','상부 하역창','수몰 하역대','맞은편 봉인통로','회수 점검창','배수 회랑','윗층 대조대','명세 보관실']}
};
function slab(p,s,k,i,q){const [l,r,y]=q,w=r-l,d=i===0?s.height-y+650:(s.metadata.stageId===27&&i===2?s.height-y+600:104);const poly=[[l,y],[r,y],[r,y+d-22],[r-52,y+d],[l+40,y+d],[l,y+d-30]];
 let art=P(poly,'#435f60')+P([[l,y],[r,y],[r-8,y+20],[l+5,y+23]],'#a5ac94')+P([[l+6,y+28],[r-8,y+24],[r-29,y+67],[l+22,y+72]],'#6c7d71')+line([[l+12,y+7],[r-12,y+7]],'#d2c8a0',5);
 for(let x=l+26,j=0;x<r-20;x+=175,j++)art+=line([[x,y+28],[x+(j%2?8:-7),y+69]],'#2c494e',4);
 if(d>400){art+=P([[l+30,y+130],[l+w*.26,y+130],[l+w*.31,y+d],[l-4,y+d]],'#536d69')+P([[r-130,y+120],[r-20,y+120],[r-30,y+d],[r-270,y+d]],'#263f48');for(let row=0;row<6;row++){const yy=y+140+row*185;let xx=l+35;for(let j=0;xx<r-60;j++){const ww=Math.min([278,341,226,309][(row+j)%4],r-35-xx);art+=P([[xx+5,yy+5],[xx+ww-8,yy],[xx+ww-2,yy+147],[xx+12,yy+160]],['#4c6562','#405b5b','#49615d'][(row+j)%3])+line([[xx+12,yy+10],[xx+ww-17,yy+7]],'#6c7b6c',4);xx+=ww;}}}
 // Broad stone corbels support thin galleries without filling the shaft below.
 for(const x of [l+80,r-80])art+=P([[x-45,y+d-5],[x+48,y+d-5],[x+18,y+d+100],[x-10,y+d+132]],'#334e54')+P([[x-45,y+d-5],[x-10,y+d+132],[x-42,y+d+83]],'#61776d');
 k.decor(p,s,'gallery-'+i,art,[l-5,y-5,w+10,d+145],[poly]);
 k.lamp(p,s,'gallery-lamp-'+i,i?l+95:r-230,y);
 // Number boards use marks rather than floating UI arrows.
 const xx=i?l+220:r-350;let board=R(xx-44,y-176,90,105,'#73694c')+R(xx-39,y-169,80,89,'#b5a377');for(let z=0;z<=i;z++)board+=line([[xx-29+(z%4)*17,y-151+Math.floor(z/4)*31],[xx-29+(z%4)*17,y-130+Math.floor(z/4)*31]],'#4b5346',5);k.decor(p,s,'haul-number-'+i,board,[xx-50,y-180,105,115]);
}
function wornStair(id,w,rise,{left=false}={}){
 const depth=154,top=x=>left?-rise+x*rise/w:-x*rise/w,poly=[[0,top(0)],[w,top(w)],[w,top(w)+depth],[0,top(0)+depth]];
 let art=`<defs><linearGradient id="stair-stone" x1="0" y1="${-rise}" x2="0" y2="${depth}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#718175"/><stop offset="1" stop-color="#304a51"/></linearGradient></defs>`+P(poly,'url(#stair-stone)');
 for(let x=0,i=0;x<w;x+=68,i++){const r=Math.min(w,x+68),a=top(x),b=top(r);art+=P([[x+3,a+13],[r-3,b+13],[r-3,b+89],[x+3,a+110]],i%3===0?'#596f68':'#4e6562')+line([[x+5,a+17],[r-6,b+17]],'#9b9f85',4)+line([[r-2,b+21],[r-2,b+102]],'#2a464e',4);}
 art+=P([[0,top(0)+115],[w,top(w)+115],[w,top(w)+depth],[0,top(0)+depth]],'#253f49')+line([[0,top(0)+5],[w,top(w)+5]],'#b4b399',9)+line([[0,top(0)+123],[w,top(w)+123]],'#6a7c70',6);
 return asset(id,'닳은 석재 경사 회랑과 두꺼운 조적 지지부',art,[poly],[-4,-rise-8,w+8,rise+depth+16],'stone');
}
function solid(p,s,k,id,poly,color='#304a50'){
 const xs=poly.map(q=>q[0]),ys=poly.map(q=>q[1]),l=Math.min(...xs),r=Math.max(...xs),t=Math.min(...ys),b=Math.max(...ys),w=r-l,h=b-t;
 let art=`<defs><linearGradient id="${id}-face" x1="${l}" y1="${t}" x2="${r}" y2="${b}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#4e6766"/><stop offset=".3" stop-color="${color}"/><stop offset="1" stop-color="#1c3641"/></linearGradient></defs>`+P(poly,`url(#${id}-face)`)+line(poly.slice(0,2),'#7e8b77',7);
 if(poly.length===4){art+=P([[l+6,t+10],[l+Math.min(34,w*.2),t+14],[l+Math.min(39,w*.23),b-5],[l+7,b-5]],'#64796c');if(w>500)art+=P([[l+w*.56,t+14],[r-16,t+12],[r-26,t+h*.62],[l+w*.71,t+h*.72]],'#29444b');for(let yy=t+170,row=0;yy<b-40;yy+=225,row++)art+=line([[l+15,yy],[r-15,yy+8]],'#182f39',5)+line([[l+w*(row%2?.42:.62),yy-100],[l+w*(row%2?.42:.62),yy+1]],'#29444c',4);}
 k.decor(p,s,id,art,[l-6,t-6,w+12,h+12],[poly]);
}
function chamber(p,s,k,plan,id){cityEnvironment(p,s,{mood:'night',interior:true,ground:plan.water});s.environment.skyVisible=false;Object.assign(s.environment.atmosphere.overrides,{skyTop:'#081821',skyBottom:'#132f38',hazeStrength:.085,mistStrength:.035,lightStrength:.025,waterBaseColor:'#102b36',waterHighlightColor:'#769084'});
 let art=R(-16000,-10000,s.width+32000,s.height+23000,'#0a1c25')+`<defs><linearGradient id="shaft-wall" x1="0" y1="1400" x2="0" y2="${plan.water}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#172e35"/><stop offset=".65" stop-color="#28434a"/><stop offset="1" stop-color="#0b242e"/></linearGradient></defs>`+R(-300,1100,s.width+600,plan.water-1100,'url(#shaft-wall)');
 if(id===25){
  // One massive sluice throat, recessed counterweight channel and asymmetrical beams.
  art+=P([[2470,1600],[2950,1600],[3070,5800],[2310,5800]],'#0b222c')+P([[2380,1450],[2470,1600],[2310,5800],[2190,5800]],'#3b5558')+P([[2950,1600],[3080,1460],[3230,5800],[3070,5800]],'#182f38');
  art+=R(2510,1980,370,3330,'#203e46')+R(2560,2030,48,3210,'#496268')+R(2780,2030,53,3210,'#102b35');
  for(const y of [2080,3340,4730])art+=P([[2100,y],[3300,y-22],[3320,y+90],[2090,y+105]],'#1d363d')+line([[2130,y+12],[3270,y-6]],'#30484a',9);
  art+=`<path d="M425 5740V3220Q440 2820 880 2790Q1250 2830 1280 3250V5740Z" fill="#102833"/><path d="M4220 5590V2460Q4560 1980 5060 2460V5590Z" fill="#122a33"/>`;
 }else{
  // A cathedral-sized haulage chamber with a submerged dock and staggered sealed ports.
  art+=P([[3800,1520],[4000,1320],[4300,1320],[4540,1580],[4680,5900],[3500,5900]],'#122c37')+P([[3760,1700],[3890,1520],[3670,5900],[3480,5900]],'#39555b');
  for(const [x,y,w,h] of [[1850,5100,1480,1790],[5020,5430,1940,2470],[6440,3700,1160,1690]]){
   art+=`<path d="M${x-w/2-60} ${y}V${y-h+350}Q${x} ${y-h-360} ${x+w/2+60} ${y-h+350}V${y}Z" fill="#354e52"/><path d="M${x-w/2} ${y}V${y-h+360}Q${x} ${y-h-240} ${x+w/2} ${y-h+360}V${y}Z" fill="#0d2530"/>`;
  }
  art+=P([[350,5550],[1110,5380],[1540,5470],[2160,5440],[2300,5720],[2200,6110],[350,6120]],'#29464d')+P([[5880,5610],[6450,5460],[7160,5540],[7850,5430],[8360,5740],[8300,6290],[5850,6290]],'#28444b');
 }
 for(const [x0,x1,topY] of (id===25?[[2280,2460,1610],[2940,3130,1640]]:[[3750,3960,1600],[840,1100,1520]])){
  art+=P([[x0-25,topY-60],[x1+18,topY-30],[x1+70,plan.water],[x0-85,plan.water]],'#203b45');
  for(let yy=topY,j=0;yy<plan.water-100;yy+=238,j++){const drift=(yy-topY)/(plan.water-topY)*35;art+=P([[x0-drift+7,yy+7],[x1+drift-5,yy],[x1+drift+2,yy+220],[x0-drift+3,yy+230]],j%3===0?'#3b5659':'#304c52')+line([[x0-drift+13,yy+15],[x1+drift-12,yy+8]],'#536a64',5);}
 }
 for(const yy of [plan.water-360,plan.water-150])art+=line([[-150,yy],[s.width+150,yy]],'#3d5956',10)+line([[-150,yy+24],[s.width+150,yy+24]],'#19363f',8);
 art+=R(-300,plan.water,s.width+600,s.height-plan.water+1700,'#0b2531')+line([[-300,plan.water+16],[s.width+300,plan.water+16]],'#567a78',9);
 for(const x of (id===25?[670,2740,4570]:[1190,4050,6980]))art+=P([[x-90,plan.water],[x+95,plan.water],[x+160,plan.water+210],[x+45,plan.water+520],[x+90,plan.water+940],[x-110,plan.water+700],[x-55,plan.water+300]],'#203f49');
 for(const [x,y,w] of (id===25?[[60,3900,190],[3270,3350,190],[5250,2300,200]]:[[30,2300,210],[7850,1980,230],[3140,2430,180]])){art+=P([[x,y],[x+w,y+50],[x+w*1.6,plan.water+200],[x-w*.3,plan.water+200]],'#29454c')+P([[x,y],[x+w*.22,y+12],[x+w*.4,plan.water+200],[x-w*.3,plan.water+200]],'#405b5c');}
 k.decor(p,s,'vertical-depot-shell',art,[-16000,-10000,s.width+32000,s.height+23000]);
 // Real continuous top mass prevents over-the-world shots; galleries provide local ceilings.
 solid(p,s,k,'masonry-vault',[[0,1050],[s.width,1050],[s.width,1530],[s.width*.78,1660],[s.width*.45,1550],[s.width*.17,1740],[0,1650]],'#243e46');
 pool(s,'deep-basin-water',0,s.width,plan.water,s.height+700);s.materials.at(-1).reflections=[{x:s.width*.30,width:250,height:970},{x:s.width*.68,width:350,height:800}];
 terrain(s,'deep-unwalkable-basin',[[-500,s.height+500],[s.width+500,s.height+500],[s.width+500,s.height+1500],[-500,s.height+1500]],'stone',{honroWaterworksBasin:true});
}
export function buildVerticalWaterworks(g,p,id,k){const plan=VERTICAL_PLANS[id],s=k.base(g,id,id===25?'물 아래 묶인 이름':'검은 집하장',plan.width,plan.height);s.initialState.honroWaterworksRevision=3;s.design.act3.waterworksRevision=3;s.design.act3.kind=id===25?'vertical-sluice-maintenance-shaft':'sunken-loading-hall-return-galleries';chamber(p,s,k,plan,id);plan.pods.forEach((q,i)=>slab(p,s,k,i,q));players(s,300,plan.pods[0][2]);
 const walkingLinks=id===25?[2]:[0,4,6];const cs=plan.shots.map(([x,tx],i)=>({x,tx,i})).filter(q=>!walkingLinks.includes(q.i)).map(({x,tx,i},j)=>{const a=plan.pods[i],z=plan.pods[i+1],left=Math.max(a[0]+35,x-125),right=Math.min(a[1]-25,x+125),c={id:`vertical-${id}-${i+1}`,from:{x,y:a[2]},to:{x:tx,y:z[2]},fromZone:{left,right,y:a[2]},landing:{left:z[0]+20,right:z[1]-20,y:z[2]},checkpoint:{x,y:a[2]},markerId:'stake-arrival-'+(j+1),label:plan.names[i+1]};marker(s,c.markerId,tx,z[2],`두 동행이 ${plan.names[i+1]}에 모이기`);return c;});s.design.act3.crossings=cs;
 for(const [key,x,y,w,rise] of (id===25?[['west-maintenance-stairs',1180,4500,1120,450]]:[['entry-haul-stairs',1650,4700,800,-450],['return-inspection-stairs',5080,3950,1100,450],['manifest-stairs',2250,3050,1100,450]])){put(p,s,wornStair('a3-waterworks-v3:'+id+':'+key,w,Math.abs(rise),{left:rise>0}),key,x,y);}

 // A usable observation recess is deliberately the wrong firing position. Its low
 // stone roof blocks the arc; walking back to the lit opening reveals the next sill.
 if(id===25){solid(p,s,k,'inspection-room-roof',[[2660,4660],[3300,4660],[3300,4770],[2660,4770]]);solid(p,s,k,'inspection-room-east-wall',[[3240,4660],[3300,4660],[3300,4790],[3240,4790]]);k.warehouse(p,s,'maintenance-recess',3060,4950,300,230);solid(p,s,k,'west-lookout-roof',[[0,3400],[730,3400],[730,3510],[0,3510]]);solid(p,s,k,'west-lookout-wall',[[0,3400],[130,3400],[130,4050],[0,4050]]);k.decor(p,s,'west-lookout-recess',R(130,3510,600,540,'#172f35')+R(170,3590,390,300,'#3d554e')+line([[365,3590],[365,3890]],'#827d5d',13)+line([[170,3740],[560,3740]],'#827d5d',13),[130,3510,600,540]);solid(p,s,k,'upper-checkpoint-roof',[[4180,2900],[5500,2900],[5500,3020],[4180,3020]]);solid(p,s,k,'upper-checkpoint-east-wall',[[5330,2900],[5500,2900],[5500,5980],[5330,5980]]);solid(p,s,k,'sluice-side-pier',[[2590,3704],[2650,3704],[2650,4300],[2590,4300]]);k.warehouse(p,s,'upper-checkpoint',4980,3600,400,340);put(p,s,wornStair('a3-waterworks-v3:25:lookout-stair',330,150,{left:true}), 'lookout-stair',4700,3600);solid(p,s,k,'lookout-balcony',[[4500,3450],[4700,3450],[4700,3510],[4500,3510]]);k.inspectionDais(p,s,2160,3150);k.warehouse(p,s,'great-sealed-store',1840,3150,350,270);
  k.action(s,'depot-entry-seal',1080,5400,'담허와 수로 봉인 살피기');k.action(s,'household-tally',2400,3150,'생활물품의 가족 번호 확인');marker(s,'waterworks-exit',1760,3150,'안쪽 집하장 입구로 이동',{type:'exit'});k.belongings(p,s,'family-bundle-17',2380,3150,'열일곱');k.belongings(p,s,'family-bundle-18',2770,3150,'열여덟');
  k.encounter(s,'seal-approach','입구 정비 도구와 등불. 첫 발사창을 비운다.','depot-entry-seal',[['picks',900,5400],['lantern',1120,5400,true]]);k.encounter(s,'numbered-goods','전망 통로 끝의 도구, 사격창 뒤로 분리.','stake-arrival-2',[['picks',310,4050,true],['lantern',560,4050]]);k.encounter(s,'inner-store','검문실 뒤쪽에 남은 운반 도구.','stake-arrival-4',[['picks',4580,3600],['minecart',4810,3600],['lantern',5090,3600]]);
 }else{solid(p,s,k,'loading-office-roof',[[2380,3930],[3080,3930],[3080,4020],[2380,4020]]);solid(p,s,k,'loading-office-east-wall',[[3020,3930],[3080,3930],[3080,4070],[3020,4070]]);k.loadingShed(p,s,5180,4850);solid(p,s,k,'far-passage-roof',[[6960,3550],[8080,3550],[8080,3710],[6960,3710]]);solid(p,s,k,'far-passage-wall',[[7900,3550],[8080,3550],[8080,6600],[7900,6600]]);solid(p,s,k,'far-passage-buttress',[[6150,4504],[6340,4504],[6460,6600],[6000,6600]]);k.warehouse(p,s,'far-sealed-store',7490,4400,580,490);solid(p,s,k,'ledger-room-roof',[[850,1870],[2090,1870],[2090,2010],[850,2010]]);solid(p,s,k,'ledger-room-west-wall',[[850,1870],[1100,1870],[1100,3300],[850,3300]]);k.warehouse(p,s,'ledger-vault',1530,2600,510,430);k.inspectionDais(p,s,3610,3050);
  k.action(s,'depot-route-ledger',1130,4700,'끊긴 운반로의 순서 확인');k.action(s,'family-manifest',1790,2600,'가족별 적재 명세 챙기기');marker(s,'deep-depot-exit',1260,2600,'합류할 출구로 이동',{type:'exit'});k.belongings(p,s,'numbered-family-bundle',2600,4250,'스물하나');k.belongings(p,s,'sunk-family-tools',5170,4850,'스물둘');k.belongings(p,s,'manifest-bundle',2110,2600,'열일곱');
  k.encounter(s,'entry-hauling-remnants','입구 운반도구, 첫 발사면은 비움.','depot-route-ledger',[['minecart',960,4700],['lantern',1170,4700]]);k.encounter(s,'lower-loading-store','수몰 하역장의 운반도구, 착지면과 분리.','stake-arrival-1',[['minecart',5180,4850,true],['picks',5420,4850]]);k.encounter(s,'sealed-manifest-store','맞은편 봉인통로 안쪽의 잔재.','stake-arrival-2',[['possessedGuard',7330,4400,true],['lantern',7600,4400]]);k.encounter(s,'high-numbered-store','명세 보관실의 마지막 수비, 도착창은 비움.','family-manifest',[['picks',1950,2600,true],['lantern',2220,2600]]);
 }
 const bx=id===25?2610:3440,by=id===25?3600:4250;
 const broken=[[bx,by-12],[bx+48,by-12],[bx+90,by+16],[bx+69,by+40],[bx+39,by+10],[bx,by+10]];k.decor(p,s,'broken-haul-bridge',P(broken,'#887553')+line([[bx+6,by-9],[bx+43,by-9],[bx+77,by+13]],'#b39c6c',4)+P([[bx+56,by+36],[bx+142,by+106],[bx+122,by+124],[bx+49,by+59]],'#4b5043'),[bx-4,by-18,155,150],[broken]);
 s.design.act3.optionalRoutes=[{id:'observation-return',description:'낮은 천장의 전망자리에서 수직 구조를 살핀 뒤 열린 사격창으로 돌아온다.',points:(id===25?[[2110,4950],[2780,4950],[3550,4950]]:[[2510,4250],[2780,4250],[3350,4250]]).map(([x,y])=>({x,y}))}];s.design.act3.artContract={setting:'인공 지하 은폐 집하장',not:'자연동굴 또는 무명사 주조소',forms:id===25?['수직 수문축','정비창','상층 검문회랑','봉인문']:['수몰 하역장','맞은편 봉인통로','층별 회수회랑','명세 보관실'],deep:id===27};k.finish(g,p,s);
 // Disconnected crossings are graph edges; ordinary routes are the connected
 // walking components between those edges, never x-sorted marker positions.
 const walks=id===25?[
  ['entry',[[300,5400],[1080,5400],[1550,5400]]],
  ['choose-open-window',[[2110,4950],[2780,4950],[3550,4950]]],
  ['west-stair-return',[[3100,4500],[2300,4500],[1180,4050],[1050,4050]]],
  ['upper-water-trough',[[1740,3600],[2500,3600]]],
  ['far-checkpoint',[[3500,3600],[3550,3600]]],
  ['household-record',[[3000,3150],[2400,3150],[1760,3150]]]
 ]:[
  ['entry-stair-and-window',[[300,4700],[1130,4700],[1650,4700],[2450,4250],[2780,4250],[3350,4250]]],
  ['sunken-loading-floor',[[4900,4850],[5700,4850]]],
  ['sealed-passage-return',[[6330,4400],[7100,4400]]],
  ['inspection-stair-return',[[6660,3950],[6180,3950],[5080,3500],[4750,3500]]],
  ['manifest-stair',[[4100,3050],[3350,3050],[2250,2600],[1790,2600],[1260,2600]]]
 ];
 s.design.act3.walkingComponents=walks.map(([id,points])=>({id,points:points.map(([x,y])=>({x,y}))}));s.design.act3.requiredRoute=s.design.act3.walkingComponents.flatMap(q=>q.points);return s;
}
