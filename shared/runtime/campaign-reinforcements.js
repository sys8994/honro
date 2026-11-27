(function(G){'use strict';
// Fresh campaign responses. Each approach names a reachable section of the
// route, and each squad member has its own actual arrival surface and role.
const guard=(support,x,y,kind='possessedGuard')=>({support,x,y,kind,role:'frontline'});
const bow=(support,x,y,kind='possessedArcher')=>({support,x,y,kind,role:'crossfire'});
const rows={
 24:[
  ['hall-return',2300,2460,'뒤쪽 사랑채 처마에 활을 든 형체가 올라선다.',[
   bow('hall-west-side-wing:collision:0',1490,2426),guard('a3-foundation',1195,2665)],['family-crest']],
  ['shrine-side',4120,2550,'사당 옆 회랑에서 장부귀가 나온다. 위 처마에서도 활시위 소리가 난다.',[
   guard('a3-foundation',4490,2540,'archiveFiend'),bow('family-ancestral-shrine:collision:0',5020,2020)]],
 ],
 25:[
  ['lower-gallery',2080,4950,'아래 수로의 점검로에서 창대 끄는 소리가 난다.',[
   guard('gallery-1:collision:0',2670,4950),bow('gallery-2:collision:0',2620,4500)],['depot-entry-seal']],
  ['upper-store',1720,3600,'안쪽 보관실의 회랑에서 장부귀가 걸어 나온다.',[
   guard('gallery-4:collision:0',2440,3600,'archiveFiend')]],
 ],
 26:[
  ['casting-yard',2060,2420,'주조터 위 판자길이 울린다. 작업대 뒤쪽에서도 무언가 움직인다.',[
   guard('work-loft:collision:0',2490,2300,'kilnFiend'),bow('work-loft:collision:0',3090,2300)],['hidden-latch']],
  ['workshop-bank',4080,2300,'주민이 숨은 집 너머 강둑에 두 형체가 올라선다.',[
   guard('a3-foundation',5420,2310,'kilnFiend'),bow('artisan-refuge-house:collision:0',5020,1962)]],
 ],
 27:[
  ['cargo-ramp',4630,4850,'낮은 화물칸 안쪽에서 발소리가 겹친다.',[
   guard('gallery-2:collision:0',5540,4850,'archiveFiend'),bow('gallery-2:collision:0',5830,4850)],['stake-arrival-1']],
  ['return-stair',6390,3950,'되돌아가는 돌계단 위에서 경비 둘이 나타난다.',[
   guard('return-inspection-stairs:collision:0',5920,3840),bow('return-inspection-stairs:collision:0',5580,3700)]],
 ],
 28:[
  ['west-veranda',2180,2570,'불길이 잦아든 서쪽 행랑 위에서 궁귀가 자리를 잡는다.',[
   bow('s28-west-service-canopy:collision:0',2450,2245),guard('s28-west-veranda',2310,2540)],['fire-screen','water-release']],
  ['annex-awning',4720,2490,'동쪽 기록 별채의 처마와 위층에서 활시위가 울린다.',[
   bow('s28-east-record-annex-roof:collision:0',4770,2189),bow('s28-annex-east-awning:collision:0',5100,2295)],['party-reunion']],
 ],
 31:[
  ['ridge',3140,1410,'능선 앞쪽 돌턱에서 혼 둘이 일어난다.',[
   guard('approved31-upper-west',3510,1060,'hound'),bow('approved31-upper-west',3780,1120,'shade')]],
  ['return-bank',3650,3030,'낮은 둑 안쪽에서 산개 울음이 들린다. 자갈턱에도 혼이 나타난다.',[
   guard('approved31-low-flank',4080,3065,'hound'),bow('approved31-low-flank',4535,3078,'ghost')]],
 ],
 32:[
  ['quay-stair',780,850,'포구 돌계단 너머에서 산개가 짖고, 위 골목에도 그림자가 비친다.',[
   guard('approved32-entry',1330,847,'hound'),bow('approved32-upper-alley',1470,774,'shade')]],
  ['yard-bank',2050,1030,'안마당 돌담 너머에서 두 혼이 돌아 나온다.',[
   guard('approved32-yard',2500,1033,'hound'),bow('approved32-yard',2750,1015,'ghost')]],
 ],
 33:[
  ['low-shore',2720,3100,'갯길 앞의 돌무더기와 지나온 둑에서 혼들이 일어난다.',[
   guard('approved33-low',3550,3390,'hound'),bow('approved33-low',3770,3500,'shade'),bow('approved33-low',2250,2930,'ghost')]],
  ['cliff-road',2580,1340,'위 해안길의 꺾인 턱에서 혼 둘이 길을 가른다.',[
   guard('approved33-upper',3060,1180,'mourner'),bow('approved33-upper',3610,1220,'ghost')]],
 ],
 34:[
  ['western-switch',1870,1720,'가파른 돌계단의 위아래에서 상여추가 돌을 긁는다.',[
   guard('approved34-mid-rise',2150,1700,'mourner'),bow('approved34-mid-return',1700,1535,'shade')]],
  ['cave-mouth',4060,2480,'굴 안쪽 높은 계단에서 혼이 내려다본다. 낮은 턱에도 그림자가 붙는다.',[
   bow('approved34-cave-stairs',4658,2467,'ghost'),guard('approved34-cave-floor',4290,2553,'hound')]],
 ],
 35:[
  ['bamboo-crossing',2650,1490,'쓰러진 대 너머에서 산개가 짖고, 반대편도 대가 흔들린다.',[
   guard('approved35-bamboo-span',3160,1520,'hound'),bow('approved35-middle-clearing',2290,1570,'shade')]],
  ['upper-grove',3110,840,'위 대숲의 굽은 돌길에서 혼들이 일어난다.',[
   bow('approved35-upper-clearing',3500,850,'ghost'),guard('approved35-upper-clearing',3920,920,'mourner')]],
 ],
 36:[
  ['forge-yard',670,1230,'빈 작업장 뒤에서 발소리가 난다. 돌계단 쪽에서도 혼이 나타난다.',[
   guard('approved36-court',1680,1345,'hound'),bow('approved36-workshop',1080,1250,'shade')]],
  ['abandoned-house',2160,1335,'안마당 위 처마 아래서 혼들이 다시 일어난다.',[
   guard('approved36-house-front',2600,1180,'mourner'),bow('approved36-house-front',2940,1200,'ghost')]],
 ],
 37:[
  ['lower-hoist',925,1140,'아래 돌길에서 산개 울음이 난다. 윗길 난간에도 그림자가 비친다.',[
   guard('approved37-lower-road',1420,1113,'hound'),bow('approved37-middle-road',1534,843,'shade')]],
  ['signal-approach',1650,390,'곶 위로 오르는 길에서 혼이 움직인다.',[
   guard('approved37-hoist-deck',1690,680,'mourner'),bow('approved37-upper-road',2288,271,'ghost')]],
 ],
 38:[
  ['middle-grotto',2000,2650,'굴 아래 진입로를 따라 혼이 밀려온다.',[
   guard('approved38-middle',2470,2630,'hound'),bow('approved38-probe-stair',3040,2550,'shade')]],
  ['outer-ridge',4450,1775,'굴을 돌아가는 위쪽 능선에서 혼 둘이 고개를 든다.',[
   bow('approved38-upper',4770,1530,'ghost'),guard('approved38-upper',5420,1350,'mourner')]],
 ],
 39:[
  ['wreck-gallery',1800,830,'부서진 배 뒤쪽의 높은 길에 혼 둘이 나타난다.',[
   bow('approved39-upper',2270,866,'ghost'),guard('approved39-upper',2480,880,'hound')]],
  ['wreck-stern',2570,1890,'부러진 선미 쪽에서 혼이 따라온다. 아래 그물 쪽 길을 살피자.',[
   guard('approved39-wreck-deck',2054,1525,'mourner'),bow('approved39-wreck-deck',2194,1644,'shade')]],
 ],
 40:[
  ['return-west-bank',2680,2240,'마른 둑 앞쪽의 급경사에서 발소리가 난다. 주민이 선착장으로 가는 길이다.',[
   guard('approved40-coast-west',3265,2370,'hound'),bow('approved40-coast-west',3460,2390,'shade')]],
 ],
};
function prepareFresh(b){
 const waves=rows[b.honroStage];
 if(!waves||!b.honroCanonical||b.honroCustom||b.honroMapOrigin!=='campaign'||b.honroCampaignReinforcements===1)return;
 if(b.honroStage<31?!G.HonroAct23V4?.active(b):!G.HonroAct4Content?.active(b))return;
 for(const [key,x,y,warning,squad,objectives] of waves){
  // A blocked entrance can use nearby footholds on the same piece of ground.
  // Each option still reserves every member before changing the battle.
  const shifts=[0,64,-64,128,-128,192,-192].map(dx=>squad.map(()=>dx));
  shifts.push(...squad.flatMap((_,i)=>[96,-96].map(dx=>squad.map((_,j)=>i===j?dx:0))));
  const options=shifts.map(shift=>squad.map((m,i)=>{
   const px=m.x+shift[i],contact=G.HonroMapEngine.surfaceY(b.terrain,px,m.y,m.support);
   return contact&&Math.abs(contact.y-m.y)<180?{...m,type:'spawn',n:1,spacing:0,x:px,y:contact.y}:null;
  })).filter(members=>members.every(Boolean));
  if(!options.length)throw Error(`Missing reinforcement contact ${b.honroStage}/${key}`);
  const [actions,...alternates]=options,id=`campaign-response-${b.honroStage}-${key}`;
  b.honroEvents.push({id,once:true,honroDensityResponse:1,honroCampaignReinforcement:true,
   honroDensityTrigger:{region:{x,y,width:460,height:330},objectives},honroDensityAlternatives:alternates,
   entry:{x:actions[0].x,y:actions[0].y},warning,text:'증원 등장 · '+actions.length+'기',
   action:{type:'multi',actions,honroDensityResponse:1,source:id}});
 }
 const cap=G.HonroEncounters.populationCap(b),opening=b.units.filter(u=>u.side===1).length;
 b.honroEncounterDensityPopulationCap=Math.max(cap,opening)+waves.reduce((n,w)=>n+w[4].length,0);
 b.honroCampaignReinforcements=1;
 b.honroDensityQueueReserve=1;
}
G.HonroCampaignReinforcements={prepareFresh};
})(globalThis);
