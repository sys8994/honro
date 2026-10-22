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
  path('M-439-449L-372-460-305-450-307-433-382-442-442-430Z M270-342L338-330 435-321 433-308 341-317 270-326Z','#7b898c')+
  path('M-437-688L-337-700-322-641-361-548-425-559Z M293-672L393-701 418-633 397-537 335-552Z','#516b72')+
  path('M-331-701L-319-698-320-642-359-546-370-552-335-645Z M337-553L349-553 366-478 355-461 344-473Z','#243e4a')+
  path('M-507 4L-371 6-308 28-244 30-249 86-391 64-525 26Z M238 29L367 15 487 32 519 74 371 80 250 91Z','#344e59'),
  {bounds:{x:-530,y:-1250,w:1060,h:1360},under:path('M-136-805L-101-1130 5-1242 131-1149 211-921 321-805 103-825Z','#344e5c')+path('M-101-1130L-48-1111 22-916 103-825-136-805Z','#4c6570')});
 const replacements={'a2-scene-13-mason-workbench':shelter,'a2-13-0':house,'a2-13-1':hoist,'a2-scene-13-stone-boundary':threshold};
 for(const e of stage.elements)if(replacements[e.id])e.assetId=replacements[e.id];
 for(const e of space.scenery)if(replacements[e.elementId||e.id])e.assetId=replacements[e.elementId||e.id];
 stage.design.stoneFinish={revision:1,source:'common-space-terrainPlanes-and-opt-in-library-variants',planeCount:planes.length,variants,scope:'visual material and decoration only; geometry/actors/goals unchanged'};
 return project;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const file='shared/data/campaign.json',p=JSON.parse(readFileSync(file,'utf8'));applyStage13VectorFinish(p);writeFileSync(file,JSON.stringify(p)+'\n');console.log('Stage13 material planes and non-colliding common variants only.');}
