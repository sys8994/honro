/** Stage13 visual-only authored planes and opt-in common asset variants.
 * Existing terrain, objectives, actors, routes and shared originals are intact. */
import {readFileSync,writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {compileSVG} from './build-act2-art.mjs';
const round=n=>Math.round(n*100)/100;
const path=(d,fill)=>`<path fill="${fill}" d="${d}"/>`;
const nodeCount=n=>1+(n.children||[]).reduce((sum,c)=>sum+nodeCount(c),0);
function grade(t,x,roof=false){
 const hits=t.points.flatMap((a,i)=>{const b=t.points[(i+1)%t.points.length];return Math.abs(b.x-a.x)>.01&&x>=Math.min(a.x,b.x)&&x<=Math.max(a.x,b.x)?[a.y+(b.y-a.y)*(x-a.x)/(b.x-a.x)]:[];});
 if(!hits.length)throw Error('No live solid section '+t.id+' at '+x);return roof?Math.max(...hits):Math.min(...hits);
}
export function applyStage13VectorFinish(project){
 const stage=project.stages.find(s=>s.metadata?.stageId===13),space=stage.design.space,floor=stage.terrains.find(t=>t.id==='act2-floor'),roof=stage.terrains.find(t=>t.id==='cave-roof'),planes=[];
 const add=(terrainId,id,fill,points)=>planes.push({terrainId,stage13Finish:true,id,fill,points:points.map(p=>p.map(round))});
 const onFloor=(id,fill,ps)=>add(floor.id,id,fill,ps.map(([x,d])=>[x,grade(floor,x)+d]));
 const onRoof=(id,fill,ps)=>add(roof.id,id,fill,ps.map(([x,d])=>[x,grade(roof,x,true)-d]));
 // Authored stepped shared edges. Both neighbours traverse the same vertices,
 // so a broken ledge is part of the mother rock rather than a closed sticker.
 const sharedFace=(keys,nodes,edges)=>keys.flatMap((key,i)=>{const next=keys[(i+1)%keys.length],forward=edges[key+'>'+next],back=edges[next+'>'+key];return[nodes[key],...(forward||back?.slice().reverse()||[])];});
 // Replace the old generic isolated block wash inside each unchanged solid.
 // The shared painter still supplies the real walking lip/rim after these fills.
 add(floor.id,'mother-rock-base','#4b626d',floor.points.map(p=>[p.x,p.y]));
 add(roof.id,'vault-base','#344d5b',roof.points.map(p=>[p.x,p.y]));
 // The west exposure shares its broken bedding down through the whole front,
 // including the overscan visible in overview. No huge diagonal triangular bed
 // remains under a thin decorated surface. Junctions and returns are authored
 // unequally, with different terminations rather than a repeated normalized mesh.
 onFloor('bed-threshold','#455e6b',[[3270,520],[5870,26],[6400,950],[5500,4200],[3650,1640]]);
 onFloor('bed-inner','#4e6671',[[5870,26],[9100,26],[9100,4200],[5500,4200],[6400,950]]);
 const westNodes={
  a:[-500,40],b:[350,45],c:[900,45],d:[1450,40],e:[2070,65],f:[2720,45],g:[3310,45],
  h:[-500,420],i:[210,310],j:[720,390],k:[1110,290],l:[1550,410],m:[2100,320],n:[2540,470],o:[2940,330],p:[3400,240],
  q:[-500,900],r:[80,770],s:[620,690],t:[1000,870],u:[1480,720],v:[1890,950],w:[2350,820],x:[2880,780],y:[3270,520],
  A:[-400,1450],B:[330,1300],C:[850,1420],D:[1320,1210],E:[1800,1500],F:[2260,1300],G:[2760,1460],H:[3210,1270],I:[3650,1640],
  J:[-500,2250],K:[100,1900],L:[700,2200],M:[1200,1910],N:[1710,2200],O:[2190,1980],P:[2730,2180],Q:[3270,2010],R:[3800,2230],
  S:[-450,3200],T:[430,3020],U:[1130,2900],V:[1780,2950],W:[2400,2800],X:[3060,2870],Y:[3900,3000],
  entryTurn:[1120,550],entrySeat:[1380,580],entryDeep:[990,1130],masonTurn:[1800,580],masonSeat:[2270,530],entryLower:[1450,1030],masonLower:[2070,1100]};
 const westEdges={
  'b>i':[[300,160],[330,225]],'d>l':[[1500,160],[1465,240]],
  'j>k':[[840,404],[1000,346]],'l>m':[[1630,434],[1760,426],[1890,464],[1980,370]],
  'n>o':[[2710,492],[2790,430]],'i>r':[[170,440],[225,495]],
  't>u':[[1140,910],[1250,816]],'m>v':[[2100,540],[2015,580],[2050,713],[1940,758]],
  'w>x':[[2510,840],[2600,785]],'v>E':[[1930,1120],[1835,1230]],
  'B>C':[[510,1352],[675,1324]],'D>E':[[1440,1260],[1540,1240],[1640,1425]],
  'F>G':[[2470,1366],[2560,1360]],'G>H':[[2900,1490],[3030,1350]],
  'B>K':[[280,1545],[340,1630],[190,1750]],'M>N':[[1350,2000],[1470,1960],[1550,2115]],
  'O>P':[[2380,2030],[2470,2000],[2610,2140]],'Q>R':[[3430,2000],[3520,2110]],
  'K>T':[[220,2250],[180,2450],[370,2590]],'N>V':[[1620,2370],[1770,2460]],
  'k>entryTurn':[[1080,390],[1160,420],[1135,490]],'entryTurn>t':[[1150,650],[1060,690]],
  'entryTurn>entrySeat':[[1240,600],[1300,570]],'l>entrySeat':[[1480,450],[1470,500]],
  't>entryDeep':[[1070,960],[1020,1025]],'entryDeep>C':[[1010,1215],[915,1260]],
  'm>masonTurn':[[2020,450],[1910,460]],'masonTurn>v':[[1770,710],[1860,790]],
  'm>masonSeat':[[2160,400],[2240,414]],'masonSeat>w':[[2250,655],[2330,700]],
  'u>entryLower':[[1550,850],[1450,890]],'entryLower>D':[[1470,1110],[1380,1140]],
  'v>masonLower':[[1940,1020],[2015,1025]],'masonLower>F':[[2130,1200],[2220,1215]]};
 const westFace=(id,fill,keys)=>onFloor('west-bed-'+id,fill,sharedFace(keys,westNodes,westEdges));
 for(const [id,fill,keys]of [
  ['outer-shoulder','#5c7379',['a','b','i','h']],['entry-seat','#697e80',['b','c','k','j','i']],
  ['entry-fold','#60787c',['c','d','l','k']],['mason-shoulder','#6d8081',['d','e','m','l']],
  ['mason-cleave','#60787f',['e','f','o','n','m']],['mason-return','#59727b',['f','g','p','o']],
  ['outer-return','#4f6974',['h','i','r','q']],['entry-inset','#57727a',['i','j','s','r']],
  ['entry-ledge','#6a8082',['j','k','entryTurn','t','s']],['entry-ledge-seat','#60797e',['k','l','entrySeat','entryTurn']],['entry-ledge-return','#526f79',['l','u','t','entryTurn','entrySeat']],
  ['mason-inset','#536d76',['l','m','v','masonTurn']],['mason-inset-return','#607880',['v','u','l','masonTurn']],
  ['mason-ledge','#667e81',['m','n','w','masonSeat']],['mason-ledge-return','#58737c',['w','v','m','masonSeat']],['east-return','#5b757e',['n','o','p','y','x','w']],
  ['outer-bed','#465f6c',['q','r','B','A']],['outer-shoulder-return','#5b747b',['r','s','C','B']],
  ['entry-deep-fold','#506c76',['s','t','entryDeep','C']],['entry-deep-fold-return','#5a757d',['t','D','C','entryDeep']],
  ['entry-step','#637b7f',['t','u','entryLower','D']],['entry-step-return','#566f79',['u','v','E','D','entryLower']],
  ['mason-undercut','#455f6c',['v','w','F','masonLower']],['mason-undercut-return','#516e78',['F','E','v','masonLower']],['mason-backstep','#58727b',['w','x','G','F']],
  ['gate-return','#4b6773',['x','y','H','G']],['gate-deep-seat','#536e78',['y','p','I','H']],
  ['outer-shadow','#3c5766',['A','B','K','J']],['outer-step','#526e77',['B','C','L','K']],
  ['entry-shadow','#435f6c',['C','D','M','L']],['entry-deep-seat','#526d77',['D','E','N','M']],
  ['central-shadow','#3e5a69',['E','F','O','N']],['central-ledge','#526e78',['F','G','P','O']],
  ['east-shadow','#425e6c',['G','H','Q','P']],['gate-deep-return','#4c6773',['H','I','R','Q']],
  ['outer-low','#3b5665',['J','K','T','S']],['entry-low-step','#496570',['K','L','M','U','T']],
  ['entry-low-shadow','#3a5666',['M','N','V','U']],['mason-low-step','#4a6773',['N','O','W','V']],
  ['central-low','#3d5969',['O','P','Q','X','W']],['east-low-step','#466370',['Q','R','Y','X']]
 ])westFace(id,fill,keys);
 // Several finite cavities belong to the bed junctions. Each terminates into
 // the neighbouring face and has its own depth; they are not a rim on every face.
 onFloor('west-entry-recess','#2d4856',[[720,390],[840,404],[1000,346],[1110,290],[1085,342],[1020,388],[810,472],[751,447]]);
 onFloor('west-entry-lip','#88978e',[[720,390],[840,404],[1000,346],[1110,290],[1090,314],[1004,365],[841,425],[743,408]]);
 onFloor('west-mason-recess','#2a4656',[[1550,410],[1630,434],[1760,426],[1890,464],[1840,521],[1650,507],[1585,470]]);
 onFloor('west-central-split','#294452',[[1890,950],[1930,948],[1975,1080],[2070,1130],[2125,1290],[2090,1260],[2022,1158],[1930,1120]]);
 onFloor('west-deep-pocket','#2b4858',[[330,1300],[510,1352],[675,1324],[850,1420],[786,1493],[643,1430],[470,1454],[370,1380]]);
 onFloor('west-deep-seat','#6f8586',[[330,1300],[510,1352],[675,1324],[850,1420],[815,1434],[670,1353],[511,1376],[365,1328]]);
 onFloor('west-mason-low-pocket','#2b4858',[[2260,1300],[2470,1366],[2560,1360],[2760,1460],[2700,1550],[2550,1443],[2390,1446],[2280,1365]]);
 onFloor('west-east-joint','#2b4857',[[2880,780],[2910,789],[2860,962],[2940,1055],[2960,1190],[2916,1151],[2893,1066],[2817,978]]);
 onFloor('west-entry-inner-pocket','#314e5b',[[1150,650],[1060,690],[1040,790],[1000,870],[1050,845],[1090,737],[1178,699]]);
 onFloor('west-mason-inner-pocket','#304c59',[[2100,320],[2020,450],[1910,460],[1800,580],[1840,574],[1950,502],[2050,492],[2120,375]]);
 onFloor('west-mason-inner-seat','#81918c',[[2100,320],[2020,450],[1910,460],[1800,580],[1825,570],[1920,477],[2030,469],[2100,351]]);
 // The threshold bed is stepped, not a full-width repeated horizontal stripe.
 onFloor('threshold-seat','#6d8083',[[3440,35],[3740,32],[3970,140],[4330,105],[4530,225],[4210,360],[3820,325],[3600,190]]);
 onFloor('threshold-foundation','#526e78',[[3970,140],[4330,105],[4710,35],[4970,70],[4830,410],[4530,490],[4210,360],[4530,225]]);
 onFloor('gallery-west-cut','#617c82',[[4970,70],[5210,50],[5480,190],[5320,390],[5050,440],[4830,410]]);
 onFloor('gallery-return','#57737d',[[5480,190],[5670,60],[5900,50],[6070,270],[5800,430],[5570,470],[5320,390]]);
 onFloor('gallery-deep','#405d6d',[[5050,440],[5320,390],[5570,470],[5800,430],[6100,750],[5710,1080],[5180,970]]);
 onFloor('inner-turn','#607b80',[[6210,70],[6480,45],[6700,220],[6560,460],[6270,510],[6070,270]]);
 onFloor('inner-level-bed','#546f78',[[6700,220],[6980,55],[7420,55],[7710,210],[7370,470],[6950,520],[6560,460]]);
 // The gate forecourt is a stepped exposure, not four pale full-screen facets.
 // Unequal shared junctions describe bedding interrupted by substantial breaks.
 const gateNodes={a:[3310,45],b:[3780,35],c:[4210,35],d:[4780,35],e:[5110,45],f:[5680,45],g:[6050,50],h:[6500,65],
  i:[3400,240],j:[3880,210],k:[4330,180],l:[4850,310],m:[5260,220],n:[5790,270],o:[6170,220],p:[6580,300],
  q:[3270,520],r:[3650,470],s:[4200,560],t:[4670,430],u:[5300,550],v:[5690,460],w:[6260,520],x:[6500,500],
  A:[3400,910],B:[3900,850],C:[4390,940],D:[4870,860],E:[5350,930],F:[5820,870],G:[6330,920],H:[6720,850]};
 const gateFace=(id,fill,keys)=>onFloor('gate-stratum-'+id,fill,keys.map(k=>gateNodes[k]));
 for(const [id,fill,keys]of [
  ['west-upper','#607276',['a','b','j','i']],['seat-upper','#5d7278',['b','c','k','j']],['door-upper','#566d74',['c','d','l','k']],
  ['east-upper','#60767b',['d','e','m','l']],['gallery-upper','#586f77',['e','f','n','m']],['gallery-turn','#62777b',['f','g','o','n']],['far-upper','#516b75',['g','h','p','o']],
  ['west-fold','#4b636d',['i','j','r','q']],['west-return','#566e75',['j','k','s','r']],['seat-return','#4b626d',['k','l','t','s']],
  ['door-return','#516a73',['l','m','u','t']],['gallery-pocket','#4b646f',['m','n','v','u']],['gallery-face','#536c75',['n','o','w','v']],['far-return','#49636f',['o','p','x','w']],
  ['west-deep','#405965',['q','r','B','A']],['seat-deep','#4b646e',['r','s','C','B']],['door-deep','#425b67',['s','t','D','C']],
  ['east-deep','#4c6570',['t','u','E','D']],['gallery-deep','#405c6a',['u','v','F','E']],['turn-deep','#4b6570',['v','w','G','F']],['far-deep','#3c5867',['w','x','H','G']]
 ])gateFace(id,fill,keys);
 // Three finite overhang cavities share the strata junctions. Broad broken
 // shadow lips have unequal depth; they are neither hairline scratches nor caps
 // attached to every polygon. The thin walking rim remains the real top edge.
 onFloor('gate-west-pocket','#2d4653',[[3750,214],[3970,194],[4200,206],[4330,180],[4270,238],[4190,316],[4030,285],[3860,264]]);
 onFloor('gate-west-ledge','#788682',[[3750,214],[3970,194],[4200,206],[4330,180],[4282,202],[4170,222],[3970,211],[3808,235]]);
 onFloor('gate-seat-pocket','#2f4957',[[4330,180],[4362,194],[4520,290],[4625,313],[4670,430],[4613,390],[4585,338],[4480,316],[4350,237]]);
 onFloor('gate-gallery-pocket','#2a4655',[[5300,550],[5400,526],[5545,537],[5690,460],[5705,495],[5565,587],[5420,574],[5340,599]]);
 onFloor('gate-gallery-ledge','#778782',[[5300,550],[5400,526],[5545,537],[5690,460],[5705,473],[5550,555],[5400,542],[5320,567]]);
 // The unchanged ceiling silhouette is filled by connected courses below;
 // the former three enormous triangular vault layers are no longer authored.
 // Offset vault courses continue into the mother rock above the lintel.
 // Shared irregular edges replace the enormous triangular front planes locally.
 const vaultNodes={a:[4120,35],b:[4540,40],c:[4950,35],d:[5500,40],e:[5860,50],f:[6380,45],g:[6780,75],
  h:[4220,350],i:[4650,300],j:[5070,520],k:[5660,330],l:[6030,420],m:[6590,290],n:[6870,400],
  o:[4150,830],p:[4630,990],q:[5260,810],r:[5660,1040],s:[6250,940],t:[6680,850],
  u:[4280,1460],v:[4860,1570],w:[5400,1440],x:[5940,1540],y:[6510,1500],z:[7040,1450]};
 Object.assign(vaultNodes,{
  aa:[7140,45],ab:[7630,60],ac:[8120,60],ad:[8650,50],ae:[9300,50],
  ba:[7250,410],bb:[7820,520],bc:[8350,390],bd:[8940,480],be:[9400,400],
  ca:[7140,970],cb:[7700,1040],cc:[8270,890],cd:[8860,1120],ce:[9500,1000],
  da:[7480,1520],db:[8000,1630],dc:[8600,1440],dd:[9220,1650],
  qa:[4200,2200],qb:[4800,2360],qc:[5360,2100],qd:[5920,2260],qe:[6470,2140],qf:[7030,2400],qg:[7590,2200],qh:[8220,2340],qi:[8800,2200],qj:[9360,2350],
  ra:[4280,3100],rb:[4890,3250],rc:[5500,3040],rd:[6100,3260],re:[6710,3180],rf:[7300,3270],rg:[7940,3150],rh:[8580,3330],ri:[9250,3120],
  seamTurn:[5450,650],throatTurn:[5970,710],eastTurn:[6440,600],turnSeat:[6660,1250],eastSeat:[6200,1200],throatSeat:[5510,1260],crownSeat:[6240,1780],outerSeat:[7220,1230]});
 const vaultEdges={
  'u>v':[[4410,1530],[4580,1490]],'v>w':[[4930,1550],[5140,1710],[5260,1750]],
  'x>y':[[6100,1580],[6230,1510]],'z>da':[[7160,1545],[7300,1455]],
  'cb>cc':[[7790,1060],[7950,1000],[8090,1010]],'ba>ca':[[7330,610],[7210,720]],
  'bc>cc':[[8290,530],[8370,635],[8250,750]],'db>dc':[[8180,1640],[8310,1510],[8460,1550]],
  'qb>qc':[[4970,2390],[5100,2280]],'qd>qe':[[6030,2300],[6170,2230],[6310,2250]],
  'qf>qg':[[7180,2440],[7310,2280],[7430,2310]],'qh>qi':[[8380,2380],[8500,2240]],
  'v>qb':[[4840,1800],[4890,1900],[4770,2100]],'y>qe':[[6550,1740],[6545,1850],[6440,1980]],
  'da>qg':[[7540,1750],[7470,1890],[7580,2010]],'qh>rh':[[8250,2550],[8400,2620],[8320,2820]],
  'ra>rb':[[4430,3140],[4560,3060],[4700,3190]],'rc>rd':[[5660,3140],[5820,3090]],
  're>rf':[[6890,3210],[7030,3160],[7160,3260]],'rg>rh':[[8120,3280],[8280,3220]],
  'k>seamTurn':[[5630,490],[5490,520],[5500,580]],'seamTurn>q':[[5410,720],[5330,720]],
  'l>throatTurn':[[6090,500],[6050,590],[5960,610]],'throatTurn>r':[[5850,800],[5800,915]],
  'm>eastTurn':[[6540,430],[6440,465]],'eastTurn>s':[[6360,735],[6400,800],[6290,850]],
  'r>throatSeat':[[5680,1125],[5580,1140]],'throatSeat>w':[[5480,1340],[5420,1370]],
  's>eastSeat':[[6320,1040],[6270,1120]],'eastSeat>x':[[6130,1325],[6060,1330],[6010,1450]],
  'y>turnSeat':[[6600,1420],[6580,1340]],'turnSeat>t':[[6730,1070],[6660,1000]],
  'ca>outerSeat':[[7250,1050],[7180,1100]],'outerSeat>z':[[7150,1345],[7070,1360]],
  'y>crownSeat':[[6410,1560],[6450,1665],[6320,1690]],'crownSeat>qd':[[6150,1930],[6040,1930],[6020,2100]]};
 const vaultFace=(id,fill,keys)=>onRoof('vault-course-'+id,fill,sharedFace(keys,vaultNodes,vaultEdges));
 for(const [id,fill,keys]of [
  ['nose','#5e737b',['a','b','i','h']],['lintel','#61767c',['b','c','j','i']],['east-seat','#526b76',['c','d','k','j']],['throat','#5b727c',['d','e','l','k']],['recess','#486371',['e','f','m','l']],['turn','#526b77',['f','g','n','m']],
  ['west-upper','#405a68',['h','i','p','o']],['lintel-upper','#4a6470',['i','j','q','p']],
  ['seam-upper','#425e6c',['j','k','seamTurn','q']],['seam-upper-return','#4e6975',['k','r','q','seamTurn']],
  ['throat-upper','#4c6672',['k','l','throatTurn','r']],['throat-upper-return','#59737b',['l','s','r','throatTurn']],
  ['east-upper','#405d6c',['l','m','eastTurn','s']],['east-upper-return','#4b6875',['m','t','s','eastTurn']],
  ['west-high','#4c626d',['o','p','v','u']],['central-high','#405b69',['p','q','w','v']],
  ['throat-high','#4a626e',['q','r','throatSeat','w']],['throat-high-return','#56717b',['r','x','w','throatSeat']],
  ['east-high','#3d5969',['r','s','eastSeat','x']],['east-high-return','#4b6875',['s','y','x','eastSeat']],
  ['turn-high','#465f6d',['s','t','turnSeat','y']],['turn-high-return','#536e79',['t','z','y','turnSeat']],
  ['outer-nose','#5c737d',['g','aa','ba','n']],['outer-seat','#526d79',['aa','ab','bb','ba']],['outer-return','#5d757d',['ab','ac','bc','bb']],['far-nose','#496675',['ac','ad','bd','bc']],['far-seat','#526c78',['ad','ae','be','bd']],
  ['outer-inset','#3d5a69',['n','ba','ca','t']],['outer-fold','#4a6673',['ba','bb','cb','ca']],['outer-shoulder','#536d78',['bb','bc','cc','cb']],['far-inset','#3e5b6c',['bc','bd','cd','cc']],['far-return','#486572',['bd','be','ce','cd']],
  ['outer-high','#46616e',['t','ca','outerSeat','z']],['outer-high-return','#526d77',['ca','da','z','outerSeat']],['outer-high-step','#516b75',['ca','cb','db','da']],['far-high','#3b5869',['cb','cc','dc','db']],['far-high-step','#48636f',['cc','cd','ce','dd','dc']],
  ['west-crown','#3a5665',['u','v','qb','qa']],['crown-shoulder','#4c6570',['v','w','qc','qb']],['crown-step','#425d6b',['w','x','qd','qc']],
  ['central-crown','#526a73',['x','y','crownSeat','qd']],['central-crown-step','#425e6e',['y','qe','qd','crownSeat']],['central-crown-return','#3b5969',['y','z','qf','qe']],
  ['outer-crown','#4b6571',['z','da','qg','qf']],['outer-crown-inset','#3d5a6b',['da','db','qh','qg']],['far-crown','#4c6672',['db','dc','qi','qh']],['far-crown-return','#3d5869',['dc','dd','qj','qi']],
  ['west-upper-cut','#4b626e',['qa','qb','rb','ra']],['upper-inset','#3c5767',['qb','qc','rc','rb']],['upper-step','#4a6470',['qc','qd','rd','rc']],['upper-central','#3d5869',['qd','qe','re','rd']],
  ['upper-fold','#4b6470',['qe','qf','rf','re']],['upper-outer','#405c6c',['qf','qg','rg','rf']],['upper-return','#4d6672',['qg','qh','rh','rg']],['upper-far','#3c5869',['qh','qi','qj','ri','rh']]
 ])vaultFace(id,fill,keys);
 onRoof('vault-lintel-cavity','#233d4b',[[4540,40],[4650,300],[4800,340],[5100,430],[5060,355],[4840,284],[4680,245]]);
 onRoof('vault-east-cavity','#284554',[[5440,40],[5570,330],[5770,386],[6030,420],[5970,350],[5750,321],[5610,285]]);
 onRoof('vault-seated-edge','#82918d',[[4540,40],[4565,60],[4675,277],[4840,313],[4800,340],[4650,300]]);
 // Finite recesses connect high courses to the same lower vault; no isolated
 // suspended blocks, repeated rim stamps or tiny crack/particle texture.
 onRoof('vault-crown-pocket','#243f50',[[4860,1570],[4930,1550],[5140,1710],[5260,1750],[5290,1820],[5100,1800],[4920,1630]]);
 onRoof('vault-crown-ledge','#748b89',[[4860,1570],[4930,1550],[5140,1710],[5260,1750],[5250,1780],[5117,1743],[4900,1599]]);
 onRoof('vault-crown-split','#233e4e',[[6470,2140],[6510,2152],[6500,1990],[6600,1870],[6570,1720],[6550,1740],[6545,1850],[6440,1980]]);
 onRoof('vault-outer-pocket','#294757',[[7700,1040],[7790,1060],[7950,1000],[8090,1010],[8270,890],[8240,955],[8090,1090],[7890,1120],[7790,1135]]);
 onRoof('vault-outer-seat','#7b908d',[[7700,1040],[7790,1060],[7950,1000],[8090,1010],[8270,890],[8250,918],[8095,1042],[7955,1031],[7795,1093]]);
 onRoof('vault-upper-pocket','#284555',[[5920,2260],[6030,2300],[6170,2230],[6310,2250],[6470,2140],[6430,2200],[6300,2330],[6150,2304],[6030,2355]]);
 onRoof('vault-far-joint','#233f50',[[8220,2340],[8250,2340],[8290,2175],[8410,2040],[8390,1860],[8350,1885],[8360,2015],[8220,2150]]);
 onRoof('vault-throat-inner-pocket','#294757',[[6250,940],[6320,1040],[6270,1120],[6200,1200],[6205,1250],[6310,1155],[6380,1100],[6360,1030]]);
 onRoof('vault-throat-inner-seat','#738c89',[[6250,940],[6320,1040],[6270,1120],[6200,1200],[6210,1215],[6300,1135],[6340,1050]]);
 onRoof('vault-turn-inner-pocket','#2a4859',[[6510,1500],[6600,1420],[6580,1340],[6660,1250],[6680,1260],[6630,1360],[6660,1460],[6550,1540]]);
 // Small existing solid ledges retain their live thickness and paths.
 for(const id of ['tactical-entry-shoulder','tactical-inner-gallery']){
  const t=stage.terrains.find(t=>t.id===id),top=t.points.slice(0,t.properties.honroWalkEdges.length+1),last=top.at(-1),first=top[0],mid=top[2];
  add(id,id+'-front','#657a7b',[[first.x,first.y+12],[mid.x,mid.y+12],[last.x,last.y+14],[last.x,last.y+45],[mid.x+35,mid.y+105],[first.x+80,first.y+46]]);
  add(id,id+'-return','#4b6470',[[mid.x,mid.y+12],[last.x,last.y+14],[last.x,last.y+45],[mid.x+35,mid.y+105],[mid.x-110,mid.y+75]]);
 }
 space.terrainPlanes=[...(space.terrainPlanes||[]).filter(p=>!p.transitionLayer&&!p.stage13Finish),...planes];
 const variants=[];
 function variant(baseId,id,extra,{bounds,under=''}={}){
  const old=project.library.find(a=>a.id===baseId);if(!old?.vector||old.collision.length)throw Error('Expected non-colliding common vector '+baseId);
  const b=bounds||old.bounds||old.reference.bounds;
  let source=old.vector.source.replace(/viewBox="[^"]+"/,`viewBox="${b.x} ${b.y} ${b.w} ${b.h}"`);
  if(under)source=source.replace(/(<svg[^>]+>)/,'$1'+under);
  source=source.replace('</svg>',extra+'</svg>');const vector=compileSVG(source);
  const asset={...structuredClone(old),id,name:old.name+' · 석문 작업장 접합',vector,bounds:b,reference:{...old.reference,bounds:b},params:{...old.params,sourceAsset:baseId,stage13FinishRevision:1,nodeCount:nodeCount(vector.root)}};
  const i=project.library.findIndex(a=>a.id===id);if(i<0)project.library.push(asset);else project.library[i]=asset;variants.push({baseId,id});return id;
 }
 const shelter=variant('act2:scene-work-shelter','stage13:mason-work-shelter',
  path('M-216-212L-198-211-163-170-174-158-210-195Z M179-211L191-210 161-176 145-170 145-181Z','#887454')+
  path('M-61-205L-53-205-53-129-61-127Z M-25-204L-18-204-14-150-21-150Z M13-204L20-204 20-120 13-120Z','#8b7b5d')+
  path('M-211-199L-200-199-201-190-212-190Z M179-201L190-201 190-191 179-191Z M-138-76L-122-76-120-62-136-62Z','#263a3d')+
  path('M-116-94L-70-96-65-88-112-86Z M-24-99L-3-99 1-87-17-86Z','#8a9690')+
  path('M83-31L120-39 147-24 109-14Z M154-7L181-17 207-8 180-1Z','#77857f'));
 const house=variant('act2:cave-house-lean','stage13:mason-stone-house',
  path('M-148-104L-96-105-70-92-143-91Z M-144-77L-73-78-87-64-142-61Z M79-102L112-103 122-75 81-70Z M83-48L129-50 135-22 86-21Z','#5d6d6c')+
  path('M-93-105L-88-91-101-79-98-63 M84-70L92-51','#354c52')+
  path('M-140-110L-130-110-130-98-140-98Z M66-111L76-111 76-99 66-99Z','#9a8966'),
  {bounds:{x:-205,y:-220,w:410,h:330},under:path('M-186-1L154-1 181 76 121 65-63 11-186 14Z','#344b50')+path('M121 3L166 15 181 76 155 64Z','#52676a')});
 const hoist=variant('act2:hoist-frame','stage13:mason-hoist-frame',
  path('M-11-315L-3-315-2-125-8-117Z M-8-129L-20-91-16-86 0-123 9-107 15-110-4-137Z','#a08c65')+
  path('M-159-398L-123-400-123-388-159-386Z M132-399L169-401 170-389 132-387Z M-140-365L-128-355-119-366-133-377Z M131-366L142-377 153-365 141-356Z','#99815a')+
  path('M-148-392L-136-392-136-386-148-386Z M145-391L156-391 156-385 145-385Z','#2b3633')+
  path('M142 5L179 5 191 74 155 64Z','#463d31')+path('M150 4L160 5 170 65 155 64Z','#8c7552')+
  path('M143 62L185 70 199 82 168 92 139 76Z','#5d6f70'),{bounds:{x:-210,y:-465,w:430,h:565}});
 const threshold=variant('act2:scene-stone-threshold','stage13:stone-threshold-joint',
  // Broad asymmetric worked jambs and three offset header stones. Their rear
  // shoulders disappear into the ceiling rather than outlining a pasted frame.
  path('M-578-859L-431-944-313-872-310-603-379-528-561-551Z','#5a6d71')+
  path('M-561-551L-379-528-310-603-304-290-369-218-547-246Z','#4e646b')+
  path('M-547-246L-369-218-304-290-300 12-410 39-570 8Z','#5a6e72')+
  path('M310-855L431-920 564-865 590-527 413-482 309-560Z','#526b73')+
  path('M309-560L413-482 590-527 568-194 423-230 310-192Z','#60757b')+
  path('M310-192L423-230 568-194 614 23 459 52 310 12Z','#4c656e')+
  path('M-602-862L-548-971-248-1003-191-900-230-809-535-806Z','#60767c')+
  path('M-248-1003L94-1044 168-950 122-811-230-809-191-900Z','#6d8084')+
  path('M94-1044L442-981 607-872 538-803 122-811 168-950Z','#586f79')+
  path('M-535-806L-230-809 122-811 538-803 518-773 300-780-309-773-542-782Z','#223b47')+
  path('M-379-528L-310-603-310-565-356-510-542-525-561-551Z M413-482L590-527 584-500 430-457 310-531 309-560Z','#293f49')+
  path('M-548-971L-248-1003-191-900-211-874-263-981-558-945Z M94-1044L442-981 486-950 423-959 112-1019Z','#84928e')+
  path('M-439-449L-372-460-305-450-307-433-382-442-442-430Z M270-342L338-330 435-321 433-308 341-317 270-326Z','#7b898c')+
  path('M-437-688L-337-700-322-641-361-548-425-559Z M293-672L393-701 418-633 397-537 335-552Z','#516b72')+
  path('M-331-701L-319-698-320-642-359-546-370-552-335-645Z M337-553L349-553 366-478 355-461 344-473Z','#243e4a')+
  path('M-507 4L-371 6-308 28-244 30-249 86-391 64-525 26Z M238 29L367 15 487 32 519 74 371 80 250 91Z','#344e59'),
  {bounds:{x:-680,y:-1250,w:1360,h:1360},under:path('M-655-4L-650-685-560-1070-318-1180-170-1050-220-807-330-778-331 25Z M300 25L300-800 470-1080 655-974 666-560 640 43Z','#304955')+path('M-136-805L-101-1130 5-1242 131-1149 211-921 321-805 103-825Z','#344e5c')+path('M-101-1130L-48-1111 22-916 103-825-136-805Z','#4c6570')});
 const replacements={'a2-scene-13-mason-workbench':shelter,'a2-13-0':house,'a2-13-1':hoist,'a2-scene-13-stone-boundary':threshold};
 for(const e of stage.elements)if(replacements[e.id])e.assetId=replacements[e.id];
 for(const e of space.scenery)if(replacements[e.elementId||e.id])e.assetId=replacements[e.elementId||e.id];
 // Two small reused work-residue groups, behind actors and supported by the
 // unchanged floor. Existing Library collision remains empty.
 stage.elements=stage.elements.filter(e=>!e.stage13Finish);
 space.scenery=space.scenery.filter(e=>!e.stage13Finish);
 for(const [suffix,x,scale,roomId]of [['mason',2640,.22,'mason-ledge'],['threshold',3840,.24,'stone-threshold']]){
  const assetId='stage12:quarry-carrier-rubble',id='stage13-finish-rubble-'+suffix,y=grade(floor,x)-4;
  const asset=project.library.find(a=>a.id===assetId);if(!asset?.vector||asset.collision.length)throw Error('Expected existing visual work residue');
  stage.elements.push({id,assetId,x,y,scale,rotation:0,snap:false,layer:'back',depthLayer:'L1',stage13Finish:true});
  space.scenery.push({id,elementId:id,assetId,roomId,surfaceId:'floor-main',x,y,scale,footOffset:-4,visualOnly:true,stage13Finish:true});
 }
 stage.design.stoneFinish={revision:1,source:'common-space-terrainPlanes-and-opt-in-library-variants',planeCount:planes.length,variants,scope:'visual material and decoration only; geometry/actors/goals unchanged'};
 return project;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const file='shared/data/campaign.json',p=JSON.parse(readFileSync(file,'utf8'));applyStage13VectorFinish(p);writeFileSync(file,JSON.stringify(p)+'\n');console.log('Stage13 material planes and non-colliding common variants only.');}
