(function(G){'use strict';
// P1-1 monster placement (2026-11-23). Authored new entries only: a battle that
// is already saved keeps its population and positions. Every change keeps the
// unit ID, species, skills, rewards and objective links; it moves a unit to a
// place with a reason, holds it (fixed) or changes when it engages.
const clone=x=>JSON.parse(JSON.stringify(x));
const REVISION=1,skipped=[];
function walkTop(t,x){
 const ps=t.points,edges=t.properties?.honroWalkEdges;let best=null;
 const scan=idx=>{for(const i of idx){const a=ps[i],z=ps[(i+1)%ps.length];if(!a||!z||Math.abs(z.x-a.x)<.001)continue;
  if(x>=Math.min(a.x,z.x)-.001&&x<=Math.max(a.x,z.x)+.001){const y=a.y+(z.y-a.y)*(x-a.x)/(z.x-a.x);if(best===null||y<best)best=y;}}};
 // Authored walk edges first; projects without them (or older tests) use the polygon's upper hull at x.
 if(Array.isArray(edges)&&edges.length)scan(edges);if(best===null)scan(ps.map((_,i)=>i));
 return best;
}
function tools(s){
 const terrain=id=>{const t=s.terrains.find(t=>t.id===id);if(!t)throw Error('P1 placement: missing support '+s.metadata.stageId+'/'+id);return t;};
 const top=(id,x)=>{const y=walkTop(terrain(id),x);if(y===null)throw Error('P1 placement: '+id+' has no top at '+x);return Math.round(y*100)/100;};
 const unit=id=>{const u=s.units.find(u=>u.id===id);if(!u)throw Error('P1 placement: missing unit '+s.metadata.stageId+'/'+id);return u;};
 const move=(id,support,x,extra={})=>{const u=unit(id),y=top(support,x);Object.assign(u,{x,y},extra);if('spawnX' in u)u.spawnX=x;if('spawnY' in u)u.spawnY=y;
  if(u.stageOverrides&&'honroEncounterSupport' in u.stageOverrides)u.stageOverrides={...u.stageOverrides,honroEncounterSupport:support};return u;};
 return{terrain,top,unit,move};
}
const STAGES={
 // 1-4 Gate defense. Before: nine units strung across the basin floor x1476-2820.
 4(s){const {top,move}=tools(s),pos=s.design?.positioning;if(!pos?.clusterPositions)throw Error('P1 placement: stage4 positioning missing');
  const c=pos.clusterPositions;
  // Two rushers stay on the west slope: they are what reaches the refugee gate first.
  // Cart pocket: the fire spirit and one dog by the burned cart, the gallery archer above,
  // and a mourner on the gallery's west end who drops on whoever works the cart.
  move('foe-6','burned-gallery',2060);
  // The high west corridor is the player's alternative route; a lone ghost contests it.
  c['foe-0-cluster']={x:1600,y:top('west-shoulder',1600)};
  // East: a boar held on the pine ledge, a dog with the step archer, one slope sentinel.
  c['foe-3-cluster']={x:3060,y:top('fc-choice-4-gate-flank-pine',3060)};
  c['foe-4-cluster']={x:3200,y:top('east-step-1',3200)};
  pos.p1Placement={revision:REVISION,reason:{
   'gate-rush':'서쪽 비탈 두 마리가 피란문에 먼저 닿는다: 문 앞을 지킬지 먼저 정한다',
   'cart-pocket':'수레 옆 혼·산개와 회랑 위 사수·상두꾼: 수레를 정리하려면 회랑 위를 먼저 보거나 받아낸다',
   'west-corridor':'서쪽 높은 회랑의 그슨대 하나: 높은 길로 돌아가려면 먼저 상대한다',
   'east-slope':'소나무 턱의 멧돼지, 동쪽 계단의 산개와 사수, 비탈의 상두꾼: 동쪽으로 밀 때 단계별로 만난다'}};
  // Mid-siege pressure comes down the east pine slope, not the same basin line again.
  const mid={id:'siege-mid',when:{round:5},action:{type:'spawn',n:2,x:2980,kind:'hound'},text:'산개들이 동쪽 소나무 비탈을 타고 수레 뒤로 내려온다.',lines:[],once:true};
  const ev=s.events||(s.events=[]),i=ev.findIndex(e=>e.id==='siege-mid');if(i>=0)ev[i]=mid;else{const f=ev.findIndex(e=>e.id==='siege-0');ev.splice(f+1,0,mid);}
 }
,
 // 1-9 Windless yard. Before: 16 of 24 on the yard floor, eight in a row before the well.
 9(s){const {top,move}=tools(s);s.design??={};const pos=s.design.positioning??={version:1};const c=pos.clusterPositions??={};
  const at=(id,support,x)=>{c[id]={x,y:top(support,x)};};
  // West receiver: one archer and one dog hold it; the collapsed gallery carries a lone archer
  // and a mourner who drops on the receiver; a boar waits at the gallery foot to charge
  // whoever works the receiver (the rubble west of it is too close to the party start).
  at('foe-0-cluster','tactical-west-collapsed-gallery',1000);
  at('foe-1-cluster','tactical-west-collapsed-gallery',1300);
  at('foe-3-cluster','yard-floor',1180);
  // Well: dog, spirit and boar stay as the disruption at the well itself.
  // The upper route (rubble return -> root ascent) is guarded by three, not left empty.
  at('foe-4-cluster','tactical-west-rubble-return',1480);
  at('foe-7-cluster','tactical-east-root-ascent',2180);
  move('foe-9','tactical-east-root-ascent',2330);
  at('foe-11-cluster','yard-floor',2286);
  // Fliers keep their audited stations (explicit so the cluster solver cannot drift them).
  Object.assign(c,{'foe-2-cluster':{x:2670,y:1712},'foe-5-cluster':{x:2880,y:1752},'foe-6-cluster':{x:1200,y:2072}});
  // East: one archer and one dog at the receiver, a sniper on the stone shoulder,
  // a spirit on the shoulder's lip, and an outer patrol on the root return.
  at('foe-9-cluster','tactical-east-stone-shoulder',2580);
  at('foe-8-cluster','tactical-east-stone-shoulder',2950);
  move('foe-11','tactical-east-root-return',3150);
  at('foe-10-cluster','tactical-east-root-return',3330);
  pos.p1Placement={revision:REVISION,reason:{
   'west-receiver':'서쪽 받이진의 사수·산개, 회랑 발치의 멧돼지와 무너진 회랑 위 사수·상두꾼: 받이진을 준비하려면 회랑 위를 먼저 끊는다',
   'well':'우물의 산개·혼·멧돼지: 우물 앞을 지나 바닥길로 갈지 정한다',
   'upper-route':'잔해 회랑과 뿌리 오르막의 세 마리: 위쪽 길로 돌면 이들을 상대한다',
   'east-receiver':'동쪽 받이진의 사수·산개, 돌어깨 위 저격수와 혼: 동쪽 받이진은 높은 사선을 먼저 처리한다',
   'outer':'동쪽 뿌리 비탈의 도깨비불·산개: 바깥을 돌면 따로 만난다'}};
  // The evacuation beasts arrive at the east root-slope foot (still behind the evacuees'
  // route) instead of rebuilding the row in front of the well. Text and warning unchanged.
  const beasts=(s.events||[]).find(e=>e.id==='evac-beasts');if(!beasts||beasts.action?.type!=='spawn')throw Error('P1 placement: stage9 evac-beasts missing');
  beasts.action={...beasts.action,x:2450};
 },
 // 2-3 Hidden stone gate. Before: four carts in a row behind the gate (y~2200) and three
 // pickaxes in a row on the lower floor (y2850). Latch steps and the mason stay clear.
 13(s){const {move}=tools(s);
  // One cart is parked at the top of the forecourt slope: once roused it rolls down across
  // the mason's escort route, a short readable pressure before the gate.
  move('a2-enemy-9','act2-floor',1150);
  // Behind the gate one cart stays on the floor and one on the west ramp; the third waits on
  // the inner gallery and comes down its slope later.
  move('a2-enemy-13','tactical-inner-gallery',4470);
  // Two of the lower-floor pickaxes move up to the gallery: they own the line of fire over
  // the gate approach and the lower floor. The darkling and the named gate pickaxe stay below.
  move('a2-enemy-21','tactical-inner-gallery',4280);
  move('a2-enemy-20','tactical-inner-gallery',4640);
  (s.design??={}).p1Placement={revision:REVISION,reason:{
   'escort-cart':'앞마당 비탈 위 수레 하나: 석공을 데려갈 때 굴러 내려오는 길을 읽고 비켜선다',
   'gate-floor':'석문 뒤 바닥 수레와 서쪽 경사 수레: 문을 연 직후 맞는다',
   'gallery':'안쪽 회랑 위 곡괭이 둘과 수레 하나: 문 앞과 아래층을 내려다보는 사선을 먼저 끊거나 피한다',
   'lower':'아래층의 어둑시니와 석문 곡괭이: 아래로 내려가면 따로 상대한다'}};
 },
 // 2-4 Village without sun. Before: the upper-hamlet floor held a pick/cart front of five
 // across x1110-1780 (17 of 24 upper). Houses, bell, refuge and bridge stay untouched.
 14(s){const {move}=tools(s);
  // The refuge approach keeps only the elite pickaxe and one cart as its harassers.
  // One cart waits just past the house on the descent: it rolls after whoever goes down.
  move('v14-b6','v14-upper-hamlet',2250);
  // One pickaxe stands well down the descent, covering the slope and the flat from below.
  move('v14-b2','v14-upper-hamlet',2700);
  (s.design??={}).p1Placement={revision:REVISION,reason:{
   'refuge-approach':'정예 곡괭이와 수레 하나가 피난 다리로 가는 길을 견제한다: 주민을 옮기기 전에 둘을 정리하거나 길을 막는다',
   'descent':'집 너머 비탈의 수레와 아래쪽 곡괭이: 하강을 고르면 굴러오는 수레와 아래 사선을 함께 다룬다',
   'crown-road':'동쪽 왕관길과 아래 마당은 그대로: 하층은 채우지 않는다'}};
 },
 // 2-5 Road under water. Before: five fixed waterwheels in a row from the party start to the
 // sluice (x543-1276). Drain states, both routes and the sluice action are untouched.
 15(s){const {move}=tools(s);
  // The sluice keeps its two wheels (incl. the named drain wheel): the one real narrow point.
  // The other three each own a different route at a different time, none covering the sluice:
  move('a2-enemy-0','fc15-west-arch',2200);     // start of the high crown route
  move('a2-enemy-2','fc15-dry-basin-rim',3870); // the low road that opens after draining
  move('a2-enemy-4','fc15-east-arch',4880);     // the east arch before the exits
  (s.design??={}).p1Placement={revision:REVISION,reason:{
   'sluice':'수문 앞 물레 둘: 수문을 조작하려면 이 좁은 자리를 지난다',
   'high-route':'서쪽 아치의 물레: 고지길을 고르면 첫 턱에서 따로 맞는다',
   'low-route':'마른 웅덩이 둑의 물레: 배수 뒤 낮은 길을 고르면 그때 맞는다',
   'exit':'동쪽 아치의 물레: 두 출구 앞에서 마지막으로 읽고 넘는다'}};
 },
 // 2-6 Jamun temple. Before: 17 of 28 fire, stone lanterns in rows on the court floor and
 // three abreast before the archive. Kits/themes, monk rescue, key, archive and the density
 // response wave are kept; only where each lantern stands (and what it covers) changes.
 16(s){const {move}=tools(s);
  // Court: one lantern leaves the floor row for the processional upper walk, covering the
  // cloister stair approach instead of repeating the bridge lantern's line.
  move('a2-enemy-2','tm-processional-upper',2200);
  // Archive: a short response of the mourner and one lantern at the front; one lantern
  // watches the undercroft-stair climb from the hall east stone ledge; the elite rear lantern takes the walk above.
  move('a2-enemy-20','tm-east-stone-stair',5520);
  move('a2-enemy-23','tm-archive-walk',6109);
  (s.design??={}).p1Placement={revision:REVISION,reason:{
   'gate':'문 앞 곡괭이 둘과 계단 석등귀: 사찰 입구를 막는다',
   'court-cloister':'다리 석등귀와 위 참배길 석등귀: 승려를 구한 뒤 회랑 계단을 오를 때 위에서 엄호를 받는다',
   'hall':'전각 앞 곡괭이·수의귀·석등과 회랑 석등: 전각 앞은 진입을 막는 전열로 남는다',
   'archive':'기록함 앞 상두꾼과 석등귀 하나의 짧은 반응, 전각 동쪽 돌턱에서 오르막을 내려보는 석등귀와 위 통로의 정예 석등귀: 계단을 오를 때 위 두 사선을 함께 읽는다'}};
 },
 // 3-2 Old ledger. Before: the seal porch and the comparison yard were each five abreast at one
 // height (y5300 / y1200). Reports, register, comparison, exit and the left-heavy tower stay.
 22(s){const {move}=tools(s);
  // Seal porch: the elite stays as the local block at the archive door; the west pair stays.
  // The transition ledge up to the report crossing gets the archer and one ledger ghost:
  // climbing out of the court now means facing a line of fire from above.
  move('v22-a2','v22-report-approach',1180);
  move('v22-a5','v22-report-approach',1450);
  // Comparison yard: one archer covers the climb from mid-slope, one guard waits at the slope
  // foot; the yard itself is a single read-and-pass intervention of three.
  move('v22-g3','v22-comparison-mass',1800);
  move('v22-g1','v22-comparison-mass',1530);
  (s.design??={}).p1Placement={revision:REVISION,reason:{
   'seal-porch':'문 앞 정예와 서쪽 둘: 조사실 입구를 국소적으로 막는다',
   'transition':'보고고로 오르는 턱의 궁수와 장부귀: 마당을 벗어나 오를 때 위 사선을 먼저 처리하거나 빠르게 지난다',
   'comparison':'대조 비탈 아래 수비병과 비탈 중간 궁수, 마당의 장부귀·사수·수비병: 오르는 동안 두 번 끊기고 마당은 한 번 읽고 넘는다'}};
 },
 // 3-3 Missing cargo. Before: 40 in 14 groups, with rows of 4-5 on the west upper (y~3650),
 // the loading basin (y5100) and behind the sorting yard (y4620). IDs, guards, porter, records
 // and the exit stay; total and per-group roles stay — only spacing/height and gaps change.
 23(s){const {move}=tools(s);
  // Upper door: the pair at the door and the elite archer stay; one archer climbs to the
  // upper-store roof, one guard becomes a lone patrol further east, leaving a gap to slip by.
  move('s23-D-1','sy-roof-upper-store',3900);
  move('s23-D-3','sy-west-upper',4500);
  // Loading basin: one dog waits on the central flank walk and drops in from above.
  move('s23-C-5','sy-central-flank',3640);
  // Behind the sorting yard: the mourner takes the roof steps, the spirit the west sorting roof.
  move('s23-F-2','sy-roof-sorting-step-1',6890);
  move('s23-F-5','sy-roof-sorting-west',7340);
  (s.design??={}).p1Placement={revision:REVISION,reason:{
   'upper':'위층 문 앞 짝과 정예 궁수, 창고 지붕 궁수, 동쪽 단독 초계: 위층은 견제이며 그 사이로 빠질 틈이 있다',
   'loading':'짐꾼 길목의 정예·산개·혼과 옆 통로 위의 산개: 바닥 길목을 막고 위에서 뛰어든다',
   'sorting':'하역장 앞 정예·산개 짝, 지붕 계단의 상두꾼과 지붕 위 혼: 하역장 뒤는 위에서 움직이며 압박한다'}};
 },
 // 3-4 Hwigyeom's crest. Before: 16 of 26 shooters; both investigation approaches asked for
 // the same answer. Shrine, land register, both entrances and the split stay.
 24(s){const {move}=tools(s);
  // Crest-hall approach = high lines: one floor ledger ghost moves onto the garden gallery,
  // joining the hall-step archer and the hanging lantern over the crest room's exit.
  move('a3-24-crest-room-watch-1','family24-garden-gallery',2900);
  // Shrine approach = local, moving obstruction: a dog joins the mourner at the shrine-stair
  // foot, and the ledger ghost there becomes a single elevated shot from the west porch.
  move('a3-24-empty-court-watch-1','a3-foundation',4230);
  move('a3-24-shrine-approach-0','family24-shrine-west-porch',4600);
  (s.design??={}).p1Placement={revision:REVISION,reason:{
   'crest':'문장고 쪽은 높은 사선(계단 궁수, 회랑 장부귀, 등불): 엄폐와 사선 끊기로 접근한다',
   'shrine':'사당 쪽은 층계 아래 상두꾼·산개가 직접 길을 막고 서쪽 툇마루 장부귀 하나가 위에서 쏜다: 몸으로 밀고 지나간다',
   'empty-court':'빈 뜰은 정예 장부귀·사수·궁수와 등불: 입구 첫 교전'}};
 },
 // 3-9 Hyeonmuk's letter. Before: six abreast on the command platform at y2220 with ~90
 // spacing, and a front-only press on the inspection bridge. The letter, the platform event,
 // both routes and the 2+2 command-screen response units are untouched.
 29(s){const {move}=tools(s);
  // Command platform: the boss with two shields and the elite guard - a small close escort.
  // The platform archer becomes an independent harasser from the top of the upper ascent.
  move('a3-29-letter-store-guard-3','r29-upper-ascent',4420);
  // Inspection bridge: the front (dog, guard, spirit, archer) stays; one platform guard moves
  // to the inspection roof and drops onto the bridge from the side.
  move('a3-29-letter-store-guard-2','r29-inspection-roof',4500);
  (s.design??={}).p1Placement={revision:REVISION,reason:{
   'command':'한태록과 방패 둘·정예 수비병: 지휘대는 작은 근접 호위로 남는다',
   'ascent':'위 오르막 끝의 궁수: 지휘대를 칠 때 따로 견제하며 높은 길을 고르면 먼저 만난다',
   'bridge':'점검다리 앞의 산개·수비병·혼·궁수와 지붕 위 수비병: 아래 길은 정면과 옆을 함께 받는다'}};
 },
 // 3-10 Road left behind (on the reworked natural-rock terrain). Before: two rows of four on
 // the ferry court at y5470 (x4900-5230, x5630-6200). Ferry hold, barge switch, evacuation,
 // gathering, old-road exit and the V4 response wave are untouched.
 30(s){const {move}=tools(s);
  // West quay: the elite and the stone-step retainer hold it with one dog; the other dog
  // waits on the cape's descent and rushes in from above when the party climbs up.
  move('sf-dw2','sf-cape-east-descent',5620);
  // East quay: spirit, guard and the ambush archer stay; the reflection commander watches from
  // the cape-bank plank above and drops in once the quay is being taken.
  move('sf-de1','sf-cape-bank-link',5900);
  (s.design??={}).p1Placement={revision:REVISION,reason:{
   'quay-west':'서편 석단의 정예·산개·두억시니: 나루를 점거한 무리',
   'approach':'곶 내리막의 산개: 나루로 올라서면 위에서 달려든다',
   'quay-east':'반사벽 앞 혼·수비병·매복 사수와 다리판 위 주조귀: 동편을 치면 위에서 지휘관이 내려온다',
   'exit':'둑 위와 옛길 오르막·하역판: 출구 쪽 위협은 그대로'}};
 },
 // 4-3 Drained tidal path. Before: four groups of four on the low flat road at 157-180 spacing.
 // Tide states, both routes and the all-gather condition are untouched.
 33(s){const {move}=tools(s);
  // b: a choke at the first low rise - boar and dog hold it; the mourner and the water ghost
  // become a high-road lookout pair on the west arch that shoots down onto the low road.
  move('a4-33-b-3','approved33-upper',2560);
  move('a4-33-b-4','approved33-upper',2880);
  // c: the totem keeps the narrows by the water with the spirit; the mourner moves up to the
  // high road's middle (a single lookout), the archer ghost stays as low support.
  move('a4-33-c-1','approved33-upper',3780);
  // d: the knot-shroud and the guard keep the second choke; the mourner and the dog move to
  // the east climb, so the last stretch is a stair fight rather than a fourth row.
  move('a4-33-d-1','approved33-east-upper-stair',6300);
  move('a4-33-d-2','approved33-right-stair',6290);
  (s.design??={}).p1Placement={revision:REVISION,reason:{
   'low-chokes':'낮은 갯길은 두 병목(멧돼지·산개, 장승·혼)과 수의귀·수비병 한 지점: 물길을 끼고 지날 때 한 곳씩 뚫는다',
   'high-lookouts':'높은 길 서쪽 아치의 상두꾼·물귀신과 가운데 상두꾼: 위에서 아래 길을 내려본다. 높은 길로 가면 이들이 먼저다',
   'east-stairs':'동쪽 계단의 상두꾼과 산개: 마지막은 계단 싸움이다'}};
 },
 // 4-4 Wave-cut cliff. Before: four on the first rise, four on the middle and six on the summit
 // at regular spacing. Supports, shelter, real/false exits and gathering are untouched.
 34(s){const {move}=tools(s);
  // First rise: the lantern and one guard keep the climb; the spirit drops to the shore link
  // (a side threat on the shore path) and the knot-shroud waits at the switch-return.
  move('a4-34-g0-4','approved34-shore-link',2000);
  move('a4-34-g0-5','approved34-switch-return',1180);
  // Middle bridge: the commander archer and the mourner screen the cave bridge from its far end.
  move('a4-34-g0-8','approved34-cave-bridge',2760);
  move('a4-34-w-2','approved34-cave-bridge',3160);
  // Summit: the guardian and the lantern hold the top of the stairs; one guard and the mourner
  // become a lone east patrol and a lookout at the summit's east edge.
  move('a4-34-s-3','approved34-summit',5600);
  move('a4-34-s-2','approved34-upper-stairs',2600);
  (s.design??={}).p1Placement={revision:REVISION,reason:{
   'first-rise':'첫 오르막은 등불·수비병이 계단을 보고, 해안 연결로의 혼과 되돌림길의 수의귀가 옆을 친다: 어느 쪽으로 오를지 정한다',
   'bridge':'동굴 다리 끝의 상두꾼과 수비병: 다리를 건너는 동안 차폐를 쓴다',
   'summit':'정상 계단 꼭대기의 두억시니·등불, 위 계단 중턱의 수비병, 동쪽 끝 감시 상두꾼: 정상은 계단 위와 먼 끝을 따로 본다'}};
 },
 // 4-8 Misaligned sea cave. Before: five at ~180 spacing along the east upper road
 // (x5445-6165). Hidden passage, pursuit trigger, pursuer IDs and gathering are untouched.
 38(s){const {move}=tools(s);
  // The east row is dissolved: the archer ghost becomes a lone watcher on the east pillar
  // overhang; the guardian and one mourner block the exit end; the guard drops back down
  // the road leaving a readable gap between them.
  move('a4-38-e-2','approved38-upper',5250);
  move('a4-38-e-3','approved38-upper',4700);
  (s.design??={}).p1Placement={revision:REVISION,reason:{
   'east-upper':'동쪽 위길의 단독 사수와 입구 견제체 곁 수비병, 출구 앞 장승·상두꾼·수의귀: 그 사이 틈으로 읽고 지난다',
   'pursuit':'추격 두 기는 같은 ID로 구조 턱에 그대로'}};
 }
};
function author(project){
 return{...project,stages:project.stages.map(original=>{
  const n=original.metadata?.stageId,fn=STAGES[n];if(!fn||!Array.isArray(original.units))return original;
  if(original.initialState?.honroP1PlacementRevision===REVISION)return original;
  // A project variant without the audited supports/IDs (e.g. a geometry-only test
  // compile) keeps its original placement instead of a half-applied one.
  const s=clone(original);try{fn(s);}catch(error){skipped.push({stage:n,reason:String(error.message||error)});return original;}
  s.initialState={...(s.initialState||{}),honroP1PlacementRevision:REVISION};return s;
 })};
}
G.HonroP1Placement={REVISION,author,walkTop,skipped,stages:Object.keys(STAGES).map(Number)};
})(globalThis);
