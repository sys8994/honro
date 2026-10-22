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
 // Replace the old generic isolated block wash inside each unchanged solid.
 // The shared painter still supplies the real walking lip/rim after these fills.
 add(floor.id,'mother-rock-base','#4b626d',floor.points.map(p=>[p.x,p.y]));
 add(roof.id,'vault-base','#344d5b',roof.points.map(p=>[p.x,p.y]));
 // Four long oblique beds form one mother-rock exposure. Their lower edges
 // are far below the normal camera; no detached stone body or tiled boulder.
 onFloor('bed-west','#5d7076',[[-450,26],[1650,26],[2100,380],[1600,1150],[-450,4200]]);
 onFloor('bed-mason','#526a73',[[1650,26],[3780,26],[4400,600],[3560,1700],[1600,1150],[2100,380]]);
 onFloor('bed-threshold','#455e6b',[[3780,26],[5870,26],[6400,950],[5500,4200],[3560,1700],[4400,600]]);
 onFloor('bed-inner','#4e6671',[[5870,26],[9100,26],[9100,4200],[5500,4200],[6400,950]]);
 onFloor('deep-bed','#344e5e',[[-450,4200],[1600,1150],[3560,1700],[5500,4200],[9100,4200],[9100,6500],[-450,6500]]);
 // Unequal interlocking cleavages follow the descent and the mason's workface.
 // Shared node names are the shared boundary, not independent capped stones.
 const nodes={A:[780,55],B:[1250,40],C:[1580,220],D:[1940,65],E:[2240,75],F:[2510,220],G:[2880,65],H:[3310,200],K:[900,350],L:[1340,390],M:[1700,500],N:[2110,430],O:[2470,580],P:[2820,430],Q:[3240,650],R:[1760,40],S:[2720,45],T:[3430,50]};
 const cut=(id,color,keys)=>onFloor(id,color,keys.map(k=>nodes[k]));
 cut('entry-left-cleavage','#687d80',['A','B','C','L','K']);
 cut('entry-long-shoulder','#5c737b',['B','R','D','C']);
 cut('entry-fold','#61777d',['C','D','E','N','M','L']);
 cut('mason-front','#708387',['E','S','G','F','N']);
 cut('mason-lower-return','#5b747c',['F','G','P','O','N']);
 cut('mason-east-face','#5f7880',['G','T','H','Q','P']);
 cut('lower-shared-bed','#4d6975',['N','O','Q','P']);
 // The threshold bed is stepped, not a full-width repeated horizontal stripe.
 onFloor('threshold-seat','#6d8083',[[3440,35],[3740,32],[3970,140],[4330,105],[4530,225],[4210,360],[3820,325],[3600,190]]);
 onFloor('threshold-foundation','#526e78',[[3970,140],[4330,105],[4710,35],[4970,70],[4830,410],[4530,490],[4210,360],[4530,225]]);
 onFloor('gallery-west-cut','#617c82',[[4970,70],[5210,50],[5480,190],[5320,390],[5050,440],[4830,410]]);
 onFloor('gallery-return','#57737d',[[5480,190],[5670,60],[5900,50],[6070,270],[5800,430],[5570,470],[5320,390]]);
 onFloor('gallery-deep','#405d6d',[[5050,440],[5320,390],[5570,470],[5800,430],[6100,750],[5710,1080],[5180,970]]);
 onFloor('inner-turn','#607b80',[[6210,70],[6480,45],[6700,220],[6560,460],[6270,510],[6070,270]]);
 onFloor('inner-level-bed','#546f78',[[6700,220],[6980,55],[7420,55],[7710,210],[7370,470],[6950,520],[6560,460]]);
 const fissure=(fn,id,ps,fill='#2f4a57')=>fn(id,fill,ps);
 fissure(onFloor,'entry-short-cleft',[[1580,220],[1597,218],[1530,310],[1550,365],[1535,375],[1510,309]]);
 fissure(onFloor,'mason-joint',[[2240,75],[2254,77],[2210,220],[2118,428],[2102,430],[2190,215]]);
 fissure(onFloor,'threshold-joint',[[4330,105],[4346,111],[4535,220],[4470,292],[4453,295],[4517,227]]);
 fissure(onFloor,'gallery-short-joint',[[5480,190],[5496,192],[5425,285],[5330,388],[5316,390],[5407,277]]);
 onFloor('entry-edge-light','#a2aaa36a',[[1250,40],[1265,43],[1580,218],[1577,230],[1430,142]]);
 onFloor('mason-edge-light','#9ca99b5b',[[2110,430],[2240,400],[2470,580],[2454,582],[2240,415]]);
 onFloor('threshold-edge-light','#a6aaa35b',[[3740,32],[3970,140],[3960,151],[3741,47]]);
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
 // The old doorway ceiling stays the only silhouette. Broad reverse-dipping
 // planes link its nose to the darker inner vault; joints are finite fragments.
 add(roof.id,'vault-west','#405864',[[3820,-800],[4900,-1000],[5560,900],[5300,2200],[4760,3100],[4200,2600]]);
 add(roof.id,'vault-central','#4c626b',[[4900,-1000],[6400,-1500],[7200,0],[6500,1500],[5800,2900],[5300,2200],[5560,900]]);
 add(roof.id,'vault-east','#374f5d',[[6400,-1500],[9300,-2100],[9300,3600],[6800,2700],[5800,2900],[6500,1500],[7200,0]]);
 onRoof('nose-front','#637880',[[3960,80],[4260,45],[4450,170],[4430,470],[4150,620],[4050,330]]);
 onRoof('nose-seat','#526c77',[[4260,45],[4540,50],[4830,260],[4670,540],[4430,470],[4450,170]]);
 onRoof('lintel-mother-rock','#6a7d82',[[4540,50],[4840,38],[5100,180],[5000,430],[4830,260]]);
 onRoof('vault-west-bed','#58727c',[[4840,38],[5270,55],[5390,280],[5200,490],[5000,430],[5100,180]]);
 onRoof('vault-inner-bed','#4c6875',[[5270,55],[5660,40],[5820,230],[5660,440],[5390,280]]);
 onRoof('vault-shoulder','#5a737e',[[5660,40],[6000,55],[6200,330],[5980,520],[5820,230]]);
 onRoof('vault-recess','#3e5c6c',[[6000,55],[6380,45],[6740,150],[6560,480],[6200,330]]);
 onRoof('nose-joint','#243f4f',[[4430,470],[4445,470],[4470,330],[4458,165],[4445,170],[4451,330]]);
 onRoof('vault-joint','#304d5c',[[5100,180],[5114,180],[5180,310],[5209,486],[5194,490],[5164,315]]);
 onRoof('vault-edge-light','#9da99f5b',[[4540,50],[4549,64],[4830,270],[4830,260],[4700,151]]);
 // Offset vault courses continue into the mother rock above the lintel.
 // Shared irregular edges replace the enormous triangular front planes locally.
 const vaultNodes={a:[4120,35],b:[4540,40],c:[4950,35],d:[5500,40],e:[5860,50],f:[6380,45],g:[6780,75],
  h:[4220,350],i:[4650,300],j:[5070,520],k:[5660,330],l:[6030,420],m:[6590,290],n:[6870,400],
  o:[4150,830],p:[4630,990],q:[5260,810],r:[5660,1040],s:[6250,940],t:[6680,850],
  u:[4280,1460],v:[4860,1570],w:[5400,1440],x:[5940,1540],y:[6510,1500],z:[7040,1450]};
 const vaultFace=(id,fill,keys)=>onRoof('vault-course-'+id,fill,keys.map(k=>vaultNodes[k]));
 for(const [id,fill,keys]of [
  ['nose','#5e737b',['a','b','i','h']],['lintel','#61767c',['b','c','j','i']],['east-seat','#526b76',['c','d','k','j']],['throat','#5b727c',['d','e','l','k']],['recess','#486371',['e','f','m','l']],['turn','#526b77',['f','g','n','m']],
  ['west-upper','#405a68',['h','i','p','o']],['lintel-upper','#4a6470',['i','j','q','p']],['seam-upper','#425e6c',['j','k','r','q']],['throat-upper','#4c6672',['k','l','s','r']],['east-upper','#405d6c',['l','m','t','s']],
  ['west-high','#4c626d',['o','p','v','u']],['central-high','#405b69',['p','q','w','v']],['throat-high','#4a626e',['q','r','x','w']],['east-high','#3d5969',['r','s','y','x']],['turn-high','#465f6d',['s','t','z','y']]
 ])vaultFace(id,fill,keys);
 onRoof('vault-lintel-cavity','#233d4b',[[4540,40],[4650,300],[4800,340],[5100,430],[5060,355],[4840,284],[4680,245]]);
 onRoof('vault-east-cavity','#284554',[[5440,40],[5570,330],[5770,386],[6030,420],[5970,350],[5750,321],[5610,285]]);
 onRoof('vault-seated-edge','#82918d',[[4540,40],[4565,60],[4675,277],[4840,313],[4800,340],[4650,300]]);
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
