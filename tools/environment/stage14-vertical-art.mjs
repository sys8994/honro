/** Fresh Stage 14 place-making. All shapes are original editable SVG paths.
 * The homes, rails and lamps are rear scenery, never substitute collision.
 * Build after final vertical geometry so every foot uses the actual walk edge. */
import {compileSVG} from './build-act2-art.mjs';
import {v14Y} from '../map-forge/stage14-vertical-geometry.mjs';

export const STAGE14_VERTICAL_ART_PREFIX='stage14:vertical-';
const PREFIX=STAGE14_VERTICAL_ART_PREFIX,ELEMENT='v14-art-',N=v=>Math.round(v*1000)/1000;
const C={ink:'#152a30',stone:'#596865',stoneLight:'#89918a',stoneDark:'#33494c',wall:'#7f8471',wallLight:'#a3a28a',wallDark:'#485c54',wood:'#5f5140',woodLight:'#9a8967',woodDark:'#343e34',roof:'#445555',roofLight:'#77817a',roofDark:'#263c43',paper:'#a59c79',inside:'#192c2e',gold:'#caa974'};
const path=(d,fill,stroke='',width=1,id='')=>`<path${id?` id="${id}"`:''} d="${d}" fill="${fill}"${stroke?` stroke="${stroke}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"`:''}/>`;
const poly=(ps,fill,stroke='',width=1,id='')=>path('M'+ps.map(p=>p.map(N).join(' ')).join('L')+'Z',fill,stroke,width,id);
const line=(ps,stroke,width=1,id='')=>path('M'+ps.map(p=>p.map(N).join(' ')).join('L'),'none',stroke,width,id);
const rect=(x,y,w,h,fill,id='')=>path(`M${N(x)} ${N(y)}h${N(w)}v${N(h)}h${N(-w)}Z`,fill,'',1,id);
const group=(id,body,x=0,y=0)=>`<g id="${id}"${x||y?` transform="translate(${N(x)} ${N(y)})"`:''}>${body}</g>`;
const ellipse=(x,y,rx,ry,fill,id='')=>path(`M${N(x-rx)} ${N(y)}a${rx} ${ry} 0 1 0 ${rx*2} 0a${rx} ${ry} 0 1 0 ${-rx*2} 0Z`,fill,'',1,id);
const countNodes=node=>1+(node.children||[]).reduce((sum,n)=>sum+countNodes(n),0);
function asset(key,name,body,box,{role='building',category='architecture',feet=[0],extra={}}={}){
 const source=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${box.join(' ')}"><title>${name}</title><desc>Original pure vector village art. ${extra.rearOnly===false?'Exact terrain-interior surface dressing':'Rear scenery only'}; no embedded image, interactive object, or collision.</desc>${body}</svg>`,vector=compileSVG(source),[x,y,w,h]=box,nodeCount=countNodes(vector.root);
 if(nodeCount>120)throw Error('Stage14 art node budget exceeded: '+key);
 return{id:PREFIX+key,name,category,environmentRole:role,visual:[],vector,collision:[],anchor:{x:0,y:0},sockets:[],tags:['stage14-vertical','visual-only','editable-native-vector','korean-cavern'],params:{artRevision:1,nodeCount,rearOnly:true,collisionSource:'none',footXs:feet,...extra},bounds:{x,y,w,h},reference:{heightM:h/60,bounds:{x,y,w,h},foot:{x:0,y:0},scaleRange:[.35,2],backgroundRange:[.35,2]}};
}
function register(project,a){const i=project.library.findIndex(v=>v.id===a.id);if(i<0)project.library.push(a);else project.library[i]=a;return a;}
function walkEdges(stage,support){const terrain=stage.terrains.find(t=>t.id===support);if(!terrain)throw Error('Stage14 art needs terrain '+support);const ids=terrain.properties?.honroWalkEdges||stage.design.space.surfaces.find(s=>s.terrainId===support)?.edgeIndices;if(!ids)throw Error('Stage14 art needs declared walk edges '+support);return ids.map(i=>[terrain.points[i],terrain.points[(i+1)%terrain.points.length]]).filter(([a,z])=>a&&z&&Math.abs(a.x-z.x)>.001);}
function actualY(stage,support,x){for(const[a,z]of walkEdges(stage,support))if(x>=Math.min(a.x,z.x)-.001&&x<=Math.max(a.x,z.x)+.001){const y=a.y+(z.y-a.y)*(x-a.x)/(z.x-a.x),authored=v14Y(support,x);if(Math.abs(y-authored)>.01)throw Error('Stage14 art geometry/source mismatch '+support+' @ '+x);return y;}throw Error('Stage14 art foot outside support '+support+' @ '+x);}
function flatSlot(stage,support,wanted,halfWidth){const slots=walkEdges(stage,support).filter(([a,z])=>Math.abs(a.y-z.y)<.001&&Math.abs(a.x-z.x)>=halfWidth*2+12).map(([a,z])=>{const lo=Math.min(a.x,z.x)+halfWidth+6,hi=Math.max(a.x,z.x)-halfWidth-6,x=Math.max(lo,Math.min(hi,wanted));return{x,cost:Math.abs(x-wanted)};}).sort((a,z)=>a.cost-z.cost);if(!slots.length)throw Error('Stage14 art has no flat footing wide enough: '+support);return slots[0].x;}
function place(project,stage,a,key,support,wanted,{scale=1,zone,flat=true,purpose}={}){
 register(project,a);const xs=a.params.footXs||[0],half=Math.max(...xs.map(Math.abs))*scale,x=flat?flatSlot(stage,support,wanted,half):wanted,y=actualY(stage,support,x),feet=xs.map(dx=>({terrainId:support,x:x+dx*scale,y:actualY(stage,support,x+dx*scale)}));
 if(feet.some(p=>Math.abs(p.y-y)>.01))throw Error('Stage14 prop would float on a sloping foot: '+key);
 const id=ELEMENT+key,e={id,assetId:a.id,x,y,scale,rotation:0,snap:false,depthLayer:'L1',layer:'back',stage14Support:{terrainId:support,x,y},stage14Supports:feet};stage.elements.push(e);
 stage.design.space.scenery.push({id,elementId:id,assetId:a.id,roomId:'v14-'+zone,surfaceId:support,x,y,scale,footOffset:0,visualOnly:true,purpose});return e;
}

function foundation(w){const l=-w/2,r=w/2;let b=poly([[l+10,-30],[r-8,-31],[r,0],[l,0]],C.stone,C.ink,3,'low-stone-foundation');b+=poly([[l+10,-30],[r-8,-31],[r-4,-22],[l+4,-21]],C.stoneLight);b+=path(`M${N(l+6)}-9H${N(r-3)}M${N(l+w*.27)}-23V-11M${N(l+w*.63)}-24V-10`,'none',C.stoneDark,3,'few-large-foundation-stones');return b;}
function post(x,top,bottom=-30){return poly([[x-6,top],[x+6,top],[x+8,bottom],[x-7,bottom]],C.wood,C.ink,2)+line([[x-3,top+4],[x-3,bottom-3]],C.woodLight,2)+poly([[x-11,bottom-2],[x+11,bottom-2],[x+13,bottom+6],[x-13,bottom+6]],C.stoneLight);}
function window(x,y,w=52,h=53,{warm=false}={}){let b=rect(x-5,y-5,w+10,h+10,C.woodDark)+rect(x,y,w,h,warm?'#948461':'#728175');b+=rect(x+5,y+5,w-10,h-10,warm?C.paper:'#8b9481');b+=path(`M${x+w*.5} ${y+2}v${h-4}M${x+2} ${y+h*.6}h${w-4}`,'none',C.wood,4);return b;}
function door(x,y,w,h,{ajar=false}={}){let b=rect(x-6,y-5,w+12,h+6,C.woodDark)+rect(x,y,w,h,C.inside);if(ajar)b+=poly([[x+4,y+3],[x+w*.64,y+9],[x+w*.64,y+h],[x+4,y+h]],'#75684d')+line([[x+9,y+9],[x+9,y+h-7]],'#b19a70',3);else{b+=rect(x+4,y+4,w-8,h-7,'#84795a')+path(`M${x+w*.5} ${y+6}v${h-13}M${x+6} ${y+h*.56}h${w-12}`,'none',C.woodDark,4)+rect(x+w*.59,y+h*.5,3,9,C.ink);}return b;}
function oilLamp(x,y){return group('tiny-oil-lamp',ellipse(0,-10,19,15,'#d4a75c13')+path('M-8-5Q0 2 9-5L6 0H-5Z','#a49773')+path('M0-18Q-5-12-2-7Q4-6 4-11Z','#d9b77c')+rect(-2,0,4,5,'#6e634d'),x,y);}
function tiledRoof(w,eave,rise,{ridgeOffset=-20}={}){const l=-w/2,r=w/2,c=ridgeOffset,top=eave-rise;let b=path(`M${l-27} ${eave-10}Q${l+8} ${eave+1} ${l+55} ${eave-34}L${c-42} ${top+6}Q${c} ${top+11} ${c+48} ${top+4}L${r-51} ${eave-35}Q${r-2} ${eave+1} ${r+29} ${eave-13}L${r+18} ${eave+14}Q${c} ${eave+33} ${l-19} ${eave+13}Z`,C.roofDark,C.ink,3,'low-curved-korean-eaves');b+=path(`M${l-16} ${eave-10}Q${l+17} ${eave-2} ${l+60} ${eave-39}L${c-40} ${top+8}Q${c} ${top+14} ${c+44} ${top+7}L${r-57} ${eave-36}Q${r-8} ${eave-1} ${r+19} ${eave-13}L${r+7} ${eave+1}Q${c} ${eave+15} ${l-7} ${eave+1}Z`,C.roof);b+=path(`M${l+7} ${eave-14}L${l+62} ${eave-43}L${c-41} ${top+7}L${c+30} ${top+10}L${c+1} ${eave+5}Q${l+63} ${eave+6} ${l+7} ${eave-14}Z`,C.roofLight);b+=path(`M${l-22} ${eave+3}Q${c} ${eave+24} ${r+20} ${eave+1}`,'none','#93a092',3,'continuous-eave-catchlight');b+=path(`M${c-51} ${top+1}Q${c} ${top+8} ${c+56} ${top-1}`,'none','#a0a79a',4,'short-ridge-cap');let seams='';for(const t of[-.70,-.29,.24,.65]){const x=(t<0?-l:r)*t;seams+=`M${N(c+(x-c)*.48)} ${N(top+17+Math.abs(t)*26)}L${N(x)} ${eave+2}`;}b+=path(seams,'none','#394f50',2.5,'four-broad-roof-seams');return b;}
function upperHome(){let b=foundation(344);b+=poly([[-154,-170],[129,-170],[153,-32],[-150,-30]],C.wall,C.ink,3,'earthen-house-front');b+=poly([[92,-168],[130,-170],[153,-32],[98,-32]],C.wallDark);b+=poly([[-148,-155],[82,-156],[83,-129],[-147,-129]],C.wallLight);b+=door(-20,-148,66,118,{ajar:true})+window(-121,-139,54,51,{warm:true})+window(60,-139,29,42);b+=post(-145,-169)+post(97,-169)+rect(-156,-172,292,15,C.woodDark);b+=oilLamp(-69,-61);b+=tiledRoof(347,-178,65,{ridgeOffset:-17});b+=path('M-165-7H-32M52-7H165','none','#a4a48a',3,'flat-house-foot');return asset('home-upper','윗마을 작은 온돌집과 낮은 기와 처마',b,[-205,-254,413,258],{feet:[-172,172],extra:{kind:'home',doorHeight:118,lightAnchor:{x:-69,y:-72},silhouette:'low-curved-hipped-tile-roof'}});}
function familyHome(){let b=foundation(428);b+=poly([[-194,-161],[153,-161],[168,-30],[-194,-30]],C.wall,C.ink,3,'two-bay-family-house');b+=poly([[116,-157],[153,-161],[168,-30],[120,-30]],C.wallDark);b+=rect(-185,-150,291,21,C.wallLight);b+=door(-38,-148,60,119)+window(-154,-141,67,51,{warm:true})+window(48,-137,50,47);b+=post(-184,-161)+post(29,-161)+post(118,-161);b+=rect(-200,-170,365,18,C.woodDark);b+=path('M-223-164Q-212-200-173-219Q-125-247-78-251L35-248Q112-239 146-212L190-180 216-178 207-151Q97-147 5-151L-183-148Z','#777964',C.ink,3,'broad-low-thatched-roof');b+=path('M-211-169Q-202-203-163-222Q-108-246-79-245L38-244Q103-237 139-212L174-187Q102-184 60-190Q-45-203-211-169Z','#a09b79');b+=path('M55-247Q128-229 150-209L192-180 216-178 207-151L143-154Q142-203 55-247Z','#535f51');b+=path('M-211-160Q-91-185 9-168Q98-158 205-162','none','#b2a581',5,'bundled-thatch-eave');b+=path('M-146-232Q-153-202-169-174M-42-250Q-51-216-49-180M64-242Q85-216 90-170M148-209L166-171','none','#6c6c54',4,'four-thatch-binding-bands');b+=path('M149-117L204-105 206-33 153-31Z','#606b58')+line([[160,-110],[198,-101],[200,-40]],'#938c68',4);b+=oilLamp(93,-62);return asset('home-family','가족의 낮은 초가와 덧댄 저장칸',b,[-230,-259,464,263],{feet:[-214,214],extra:{kind:'home',doorHeight:119,lightAnchor:{x:93,y:-73},silhouette:'broad-thatched-half-hip-with-side-store'}});}
function riverHome(){let b=foundation(350);b+=poly([[-128,-181],[89,-181],[109,-31],[-129,-30]],'#738071',C.ink,3,'riverside-stone-house');b+=poly([[62,-177],[89,-181],[109,-31],[68,-31]],'#415b55');b+=poly([[-122,-169],[57,-170],[58,-146],[-123,-143]],'#a0a38a');b+=door(-31,-154,63,124,{ajar:true})+window(-108,-145,44,52,{warm:true});b+=post(-124,-177)+post(62,-177)+rect(-136,-185,238,16,C.woodDark);b+=path('M-161-187Q-135-190-101-220L-52-247 24-237 74-214Q99-195 132-201L121-177Q-18-163-151-172Z',C.roofDark,C.ink,3,'offset-korean-roof');b+=path('M-147-188L-101-222-52-247 23-236 83-210 115-202 104-190Q-10-181-147-188Z',C.roof);b+=poly([[-145,-189],[-100,-222],[-52,-247],[1,-238],[-28,-190]],C.roofLight);b+=path('M-151-182Q-17-169 125-188','none','#99a394',3)+path('M-63-247L-13-239 33-237','none','#a0a794',4);b+=path('M-103-218L-117-185M-30-237L-43-181M36-229L47-183','none','#385054',3);b+=poly([[101,-132],[157,-111],[157,-35],[111,-32]],'#566557')+path('M89-137L119-146 174-115 164-102 99-123Z','#8b8d6d',C.ink,2,'lean-to-work-eave');b+=post(157,-110);b+=oilLamp(20,-72);return asset('home-river','강가 작은 돌집과 옆칸 처마',b,[-174,-255,358,259],{feet:[-175,175],extra:{kind:'home',doorHeight:124,lightAnchor:{x:20,y:-83},silhouette:'asymmetric-tile-home-with-small-lean-to'}});}
function marketStall(){let b=post(-137,-169,0)+post(133,-158,0);b+=line([[-137,-104],[133,-105]],C.woodDark,10);b+=path('M-159-163Q-85-174-21-195Q55-163 155-168L168-139Q89-135 27-153Q-75-135-161-138Z','#797a63',C.ink,3,'single-hanging-cloth-canopy');b+=path('M-151-163Q-83-172-21-194L27-155Q-59-144-154-146Z','#a19b77');b+=path('M-21-194Q55-163 155-168L161-147Q88-143 27-155Z','#56695d');b+=path('M-161-138Q-121-127-79-136Q-33-129 9-142Q57-133 93-142Q136-133 168-139','none','#b8aa80',4);b+=rect(-118,-69,239,16,C.woodLight)+rect(-107,-53,216,43,C.woodDark)+post(-104,-50,0)+post(106,-50,0);b+=poly([[-81,-74],[-79,-111],[-22,-118],[-17,-73]],'#8c8b6a')+line([[-65,-108],[-48,-74]],'#c1b28a',4);b+=path('M21-75L20-96Q42-122 67-95L64-75Z','#637a70')+ellipse(44,-96,23,7,'#96a38b');b+=poly([[80,-73],[84,-100],[115,-96],[121,-72]],'#ab9970');return asset('market-stall','장터의 낮은 삼베 차양과 생활 물건',b,[-176,-202,360,208],{feet:[-144,141],extra:{kind:'market',canopyHeight:195}});}
function clothRack(){let b=post(-89,-144,0)+post(93,-153,0)+line([[-92,-137],[94,-147]],'#8a8061',4);b+=path('M-76-137L-11-140-13-55Q-42-61-72-51Z','#7d9181',C.ink,2,'muted-washed-cloth');b+=path('M-12-140L-13-55-36-60-38-138Z','#536c64');b+=path('M13-143L79-146 77-84Q45-75 15-83Z','#a49a78',C.ink,2);b+=path('M42-145L48-82 60-83 62-145Z','#7d8268');b+=poly([[-56,0],[-61,-24],[65,-26],[70,0]],C.stoneDark)+poly([[-58,-25],[-37,-39],[55,-39],[66,-25]],C.stoneLight);return asset('market-cloth','가게 뒤 낮은 빨랫줄과 작업돌',b,[-103,-160,211,165],{feet:[-96,100],extra:{kind:'market-cloth'}});}
function refugeBundles(){let b=path('M-107 0Q-119-25-96-57L-58-63Q-26-34-39 0Z','#8d8766',C.ink,3,'grain-sack');b+=path('M-101-49Q-76-38-55-51M-77-54L-68-4','none','#b9ab82',4);b+=path('M-32 0L-45-37Q-17-70 24-44L38-1Z','#687f73',C.ink,3,'cloth-wrapped-bundle');b+=path('M-18-54L-7-8M-36-28L28-23','none','#a6ae91',4);b+=path('M-17-56Q-35-81-7-72L-2-58Q12-81 24-67L6-53Z','#8d9d82');b+=path('M52-4Q38-37 58-59H96Q119-38 104-4Z','#3a5653',C.ink,3,'onggi-water-jar')+ellipse(78,-59,22,7,'#7e9284')+ellipse(78,-59,14,3,'#294744')+path('M55-42Q49-24 58-13','none','#718c7d',4);return asset('refuge-bundles','피난민의 보따리·곡식자루·옹기',b,[-123,-85,247,90],{role:'prop',category:'prop',feet:[-104,103],extra:{kind:'refuge'}});}
function riverLamp(){let b=poly([[-43,-2],[-30,-21],[29,-20],[46,0],[-41,0]],C.stoneDark,C.ink,2)+poly([[-30,-21],[29,-20],[19,-11],[-35,-10]],C.stoneLight);b+=poly([[-14,-21],[-11,-91],[12,-90],[16,-21]],C.wood,C.ink,2)+line([[-7,-86],[-6,-26]],C.woodLight,3);b+=path('M-29-91Q0-110 28-91L22-78H-23Z','#6d725b',C.ink,2)+path('M-17-118L-18-96H17L16-117Z','#879078')+path('M-5-138Q-13-127-5-119Q6-115 8-126Z','#dcbb81')+ellipse(0,-124,25,24,'#d4aa6316');return asset('river-lamp','물가 받침돌 위 작은 등잔',b,[-49,-153,103,157],{role:'light',category:'prop',feet:[-42,42],extra:{kind:'oil-lamp',lightAnchor:{x:0,y:-127},interactive:false}});}
function vacantHome(){let b=foundation(290);b+=poly([[-125,-142],[111,-142],[126,-29],[-127,-29]],'#6b7869',C.ink,3,'vacant-plastered-front')+poly([[76,-141],[110,-141],[125,-30],[83,-30]],'#3e574e')+rect(-116,-131,186,18,'#92967b');b+=door(-26,-135,59,104)+window(-102,-125,46,42)+post(-120,-145)+post(76,-145);b+=tiledRoof(287,-150,52,{ridgeOffset:21});b+=poly([[94,-102],[147,-95],[148,-28],[120,-29]],'#5c6b58')+path('M83-109L111-123 166-99 159-87 104-101Z','#7e8061',C.ink,2,'small-ondol-house-side-eave');b+=path('M-8-126L17-108M-6-107L20-125','none','#403f32',4,'latched-empty-door');return asset('home-vacant','문이 닫힌 빈 온돌집과 작은 옆칸',b,[-179,-217,361,221],{feet:[-145,145],extra:{kind:'home',doorHeight:104,silhouette:'offset-low-tile-house-with-latched-door'}});}
function earthenWing(){let b=foundation(240);b+=poly([[-107,-121],[96,-143],[113,-29],[-105,-29]],'#697566',C.ink,3)+poly([[63,-138],[96,-143],[113,-29],[71,-29]],'#3a514b')+poly([[-98,-110],[56,-127],[59,-104],[-99,-88]],'#909478');b+=door(-3,-126,53,96,{ajar:true})+window(-87,-99,43,36)+post(-99,-115)+post(62,-137);b+=path('M-139-126Q-118-155-70-174L43-185Q83-176 128-162L145-145Q26-144-132-107Z','#636d57',C.ink,3,'rough-thatch-side-wing');b+=path('M-134-127Q-102-156-70-172L43-182Q91-170 132-158L124-150Q17-151-130-113Z','#999473')+path('M-129-116Q-25-145 135-149','none','#b1a37d',4)+path('M-60-173L-62-135M26-182L35-150M83-173L92-150','none','#656b53',4);b+=oilLamp(50,-58);return asset('home-earthen-wing','암벽 마당에 붙은 작은 흙집 옆칸',b,[-151,-194,308,199],{feet:[-120,120],extra:{kind:'home',doorHeight:96,lightAnchor:{x:50,y:-69},silhouette:'asymmetric-short-thatched-wing'}});}
function householdYard(){let b=poly([[-127,0],[-127,-24],[-90,-40],[-43,-40],[-14,-20],[-8,0]],'#596b61',C.ink,2)+poly([[-124,-24],[-90,-40],[-43,-40],[-14,-20],[-86,-17]],'#a09f83');b+=path('M-87-18Q-102-48-78-66H-48Q-26-48-37-17Z','#3f5a51',C.ink,2)+ellipse(-63,-66,16,5,'#879882')+ellipse(-63,-66,10,2,'#30493f');b+=path('M9 0Q-4-38 21-63H63Q91-32 73 0Z','#3d5c53',C.ink,3)+ellipse(42,-63,24,7,'#91a18a')+ellipse(42,-63,16,3,'#263f38')+path('M10-39Q7-21 16-8','none','#809881',4);b+=poly([[82,0],[89,-39],[117,-45],[132,-28],[128,0]],'#8b8262',C.ink,2)+path('M88-29L128-28M96-40L104-2','none','#b6a67f',3);return asset('household-yard','장독·빨랫돌·짚바구니가 남은 마당',b,[-139,-78,284,82],{role:'prop',category:'prop',feet:[-127,128],extra:{kind:'domestic-yard'}});}
function ondolHearth(){let b=poly([[-106,0],[-99,-65],[-70,-88],[42,-91],[73,-62],[84,0]],'#667367',C.ink,3,'low-ondol-hearth')+poly([[-98,-64],[-70,-88],[42,-91],[57,-70],[-51,-54]],'#9c9b7c')+poly([[43,-88],[72,-62],[84,0],[37,0]],'#3e574d');b+=path('M-68 0V-37Q-44-65-19-36V0Z','#243a33')+path('M-58-2V-23Q-43-37-31-22V-2Z','#85643d')+path('M-51-5L-44-23-36-5Z','#bb985c');b+=path('M-8-81Q-18-104-4-116H31Q44-105 32-84Z','#2e4c45')+ellipse(14,-117,19,5,'#91a18a');b+=poly([[91,0],[82,-16],[135,-31],[148,-14],[141,0]],'#665d46')+path('M89-13L139-22M99-1L144-12','none','#a5946c',4);return asset('ondol-hearth','낮은 온돌 아궁이와 가마솥·장작',b,[-117,-129,278,133],{role:'prop',category:'prop',feet:[-106,141],extra:{kind:'domestic-hearth',lightAnchor:{x:-44,y:-18}}});}
function householdRock(key,width,height,variant){const l=-width/2,r=width/2,v=variant%3;
 const crowns=[[[l,0],[l+width*.05,-height*.51],[-width*.32,-height*.79],[-width*.12,-height],[width*.04,-height*.81],[width*.20,-height*.91],[r,-height*.42],[r,0]],[[l,0],[l-width*.02,-height*.36],[-width*.26,-height*.54],[-width*.34,-height*.77],[-width*.04,-height*.87],[width*.19,-height],[width*.36,-height*.58],[r,-height*.28],[r,0]],[[l,0],[l+width*.09,-height*.40],[-width*.28,-height*.63],[-width*.06,-height*.57],[width*.11,-height],[width*.27,-height*.87],[width*.35,-height*.40],[r,0]]];
 let b=poly(crowns[v],'#2b3b47','','1','broad-broken-rear-household-shoulder');
 b+=path(`M${l+width*.05} ${-height*.44}L${-width*.28} ${-height*.72}L${-width*.08} ${-height*(v===2?.61:.90)}L${width*.08} ${-height*.64}Q${-width*.03} ${-height*.38} ${-width*.19} ${-height*.17}L${l+width*.12} 0Z`,'#3a4b55','',1,'one-large-weathered-rock-face');
 b+=path(`M${l+width*.12} 0Q${-width*.27} ${-height*.20} ${-width*.14} ${-height*.48}L${width*.11} ${-height*.35}Q${width*.27} ${-height*.60} ${width*.34} ${-height*.73}L${r-width*.04} ${-height*.19}L${r} 0Z`,'#142a36','',1,'open-sided-natural-rock-recess');
 b+=poly([[width*.19,-height*(v===1?1:.77)],[width*.36,-height*.53],[r,-height*.28],[r,0],[width*.29,0],[width*.22,-height*.33]],'#253a47');
 return asset('household-rock-'+key,'집터 뒤로 물러선 비대칭 자연 암벽 '+key,b,[l-width*.07,-height-8,width*1.14,height+14],{role:'cliff',category:'terrain',feet:[l,r],extra:{kind:'household-rock',rearOnly:true,noWalkRim:true}});
}
function plinthHome(base,key,height){const body=base.vector.source.slice(base.vector.source.indexOf('</desc>')+7,base.vector.source.lastIndexOf('</svg>')),foot=base.params.footXs,lo=Math.min(...foot),hi=Math.max(...foot),w=hi-lo;
 let b=ellipse(0,-2,w*.55,9,'#0b202bc0','wide-house-foundation-contact-shadow');
 b+=poly([[lo+12,-height],[hi-12,-height],[hi,0],[lo,0]],'#536762',C.ink,3,'low-load-bearing-stone-plinth');
 b+=poly([[lo+12,-height],[hi-12,-height],[hi-7,-height+9],[lo+8,-height+11]],'#919781');
 b+=poly([[hi-w*.15,-height+9],[hi-7,-height+9],[hi,0],[hi-w*.13,0]],'#304c4b');
 b+=path(`M${lo+4} ${-height*.39}H${hi-3}M${lo+w*.29} ${-height+13}V${-height*.40}M${lo+w*.66} ${-height*.40}V-2`,'none','#324b48',3,'three-broad-stone-joints');
 b+=group('house-above-real-stone-base',body,0,-height);
 const [x,y,ww,h]=base.vector.viewBox;return asset(key,base.name+'·낮은 돌기단',b,[Math.min(x,lo-w*.06),y-height,Math.max(x+ww,hi+w*.06)-Math.min(x,lo-w*.06),h+height+6],{feet:foot,extra:{kind:'home',doorHeight:base.params.doorHeight,silhouette:base.params.silhouette,lightAnchor:base.params.lightAnchor?{x:base.params.lightAnchor.x,y:base.params.lightAnchor.y-height}:undefined,stonePlinthHeight:height}});
}
function familyLintelBearing(stage){const terrain='v14-family-roof-step',lower=terrainUnderside(stage,terrain).points,top=Math.max(...lower.map(p=>p.y)),span=walkEdges(stage,terrain)[0],xs=[span[0].x+48,span[1].x-48],foot=xs.map(x=>({terrainId:stage.design.vertical14.nodes.F.surfaceId,x,y:actualY(stage,stage.design.vertical14.nodes.F.surfaceId,x)}));let b='';
 for(const p of foot){b+=ellipse(p.x,p.y-2,38,8,'#0e252bc0');b+=poly([[p.x-10,top],[p.x+10,top],[p.x+14,p.y],[p.x-13,p.y]],'#494e3e',C.ink,3)+line([[p.x-4,top+5],[p.x-6,p.y-8]],'#a08d64',4);b+=poly([[p.x-28,p.y-12],[p.x+29,p.y-12],[p.x+35,p.y],[p.x-33,p.y]],'#788276');}
 b+=line([[xs[0],foot[0].y-20],[xs[1],top+13]],'#5a5b46',13)+line([[xs[0]+4,foot[0].y-26],[xs[1]-2,top+13]],'#a38f68',4);
 b+=poly([[xs[0]-32,top],[xs[1]+35,top],[xs[1]+31,top+16],[xs[0]-33,top+16]],'#77745a',C.ink,2);
 return{asset:asset('family-lintel-bearing','가족 마당의 짧은 돌턱 아래 실제 높이 목재받침',b,[xs[0]-46,top-4,xs[1]-xs[0]+94,Math.max(...foot.map(p=>p.y))-top+15],{role:'prop',category:'architecture',feet:[],extra:{kind:'lintel-bearing',undersideTerrainId:terrain,underside:lower,groundedSupports:foot,noDeck:true}}),feet:foot};
}

/** The C material uses the already-rendered Stage11 stone vocabulary, with
 * Stage12 paired joint light. Source forms are unchanged; only placement and
 * cool cave values differ. Every foreground plane goes through the existing
 * terrainPlanes renderer and its CURRENT-solid clip, before common edge ink. */
const C_REFERENCE_ROCK_FORMS=[
 {body:'M28 151Q76 30 234 27L510 2 846 59 1118 160Q1214 298 1110 473L962 612 901 825 559 895 195 774Q35 691 59 510Z',light:'M71 153Q128 68 235 69L484 39 513 185 439 312 283 453 95 448Z',face:'M514 38L829 91 1068 178 1075 336 879 450 694 398 442 327 501 202Z',shade:'M1107 180Q1169 294 1078 464L927 603 875 811 729 849 771 639 832 462 1035 326Z',foot:'M290 482L438 377 698 439 862 479 845 631 765 815 547 858 219 733Z',joint:'M486 43L514 63 489 211 424 315 455 367 410 406 376 559 278 647 308 719 292 766 263 728 246 639 344 542 378 387 405 342 395 309 459 201Z',bed:'M93 445Q221 466 299 431L431 369 461 383 304 464 167 484 95 467Z',wash:'M203 114L264 85 281 185 258 271 264 393 233 414 219 279 239 198Z'},
 {body:'M3 206L186 58 431 3 719 41Q909 72 1003 223L1171 437 1137 616 988 767 769 862 413 894 111 728Q49 538 3 206Z',light:'M51 206L210 91 425 48 663 66 627 166 488 215 441 342 216 391 70 332Z',face:'M662 63Q866 99 947 233L1081 403 898 429 747 358 635 422 443 355 488 215 623 168Z',shade:'M1006 253L1141 443 1109 602 961 747 735 832 713 658 879 516 1032 448Z',foot:'M190 433L430 396 624 457 741 397 877 464 751 599 681 818 421 854 155 696Z',joint:'M449 39L464 53 435 128 489 211 459 238 431 344 471 394 437 421 408 545 457 642 407 721 412 849 386 854 377 709 426 640 375 546 404 405 399 349 431 227 455 207 405 133Z',bed:'M697 365L750 337 867 401 991 398 1016 422 877 432 749 371 651 444 621 422Z',wash:'M207 471Q278 428 337 442L325 514 281 563 298 668 266 688 252 562 291 502Z'},
 {body:'M11 117L296 15 630 37 965 113 1183 329Q1206 477 1075 601L973 762 647 858 317 899 80 722Z',light:'M58 141L299 63 593 82 651 202 514 258 230 258 74 366Z',face:'M639 89L949 158 1121 348 1047 446 878 416 749 470 603 402 527 273 686 230Z',shade:'M1138 360L1117 498 1038 590 937 737 612 824 667 623 812 558 936 459 1036 470Z',foot:'M89 414L262 308 510 310 582 440 746 512 632 664 575 827 321 853 119 694Z',joint:'M610 60L638 71 695 229 555 278 614 410 768 487 754 520 595 446 518 272 653 215Z',bed:'M129 581L283 553 418 577 508 549 543 568 419 607 282 585 130 610Z',wash:'M852 229L886 235 902 326 883 371 858 366 868 325Z'}
];
// Only the M/L/Q/Z vocabulary used by the reference forms is accepted. Curves
// are sampled for the existing polygon-only terrainPlanes field, not rasterized.
function rockFormPoints(d){
 const ts=d.match(/[MLQZ]|-?\d+(?:\.\d+)?/g),ps=[];let i=0,cmd='',x=0,y=0,start=null;
 while(i<ts.length){if(/[MLQZ]/.test(ts[i]))cmd=ts[i++];if(cmd==='Z')break;
  if(cmd==='M'||cmd==='L'){x=+ts[i++];y=+ts[i++];ps.push([x,y]);start??=[x,y];if(cmd==='M')cmd='L';}
  else if(cmd==='Q'){const cx=+ts[i++],cy=+ts[i++],xx=+ts[i++],yy=+ts[i++],ox=x,oy=y;for(let j=1;j<=6;j++){const t=j/6,u=1-t;ps.push([u*u*ox+2*u*t*cx+t*t*xx,u*u*oy+2*u*t*cy+t*t*yy]);}x=xx;y=yy;}
  else throw Error('Unexpected C reference rock command '+cmd);
 }if(!start||ps.some(p=>p.some(v=>!Number.isFinite(v))))throw Error('Invalid C reference rock points');return ps;
}
function marketCove(stage){
 const n=stage.design.vertical14.nodes.C,market=stage.terrains.find(t=>t.id===n.surfaceId),steps=stage.terrains.find(t=>t.id==='v14-east-steps');
 if(!market||!steps)throw Error('Stage14 market cove needs actual market and descent solids');
 const attachments=[market,steps].map(t=>({...terrainUnderside(stage,t.id),contact:'Recessed sidewall at actual solid underside; no decorative walk rim'}));
 const feet=[-320,140,325].map(dx=>({terrainId:n.surfaceId,x:n.x+dx,y:actualY(stage,n.surfaceId,n.x+dx)}));
 let b=`<defs><radialGradient id="v14-C-local-recess" cx="10" cy="10" r="1260" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#192a35"/><stop offset=".57" stop-color="#192a35"/><stop offset=".86" stop-color="#1c2f39" stop-opacity=".70"/><stop offset="1" stop-color="#1c2f39" stop-opacity="0"/></radialGradient></defs>`;
 b+=path('M-1250-1250H1280V1280H-1250Z','url(#v14-C-local-recess)','','1','C-recess-behind-actual-stone');
 // The close shoulder enters from behind the real upper-left cliff. Its low,
 // broken head has neither a detached round cap nor an ornamental arch ring.
 b+=poly([[-790,-365],[-630,-475],[-405,-505],[-265,-388],[-198,-246],[-270,-53],[-381,176],[-524,217],[-716,-32]],'#2b3b47','','1','C-close-shoulder-attached-to-west-cliff');
 b+=poly([[-790,-365],[-630,-475],[-405,-505],[-302,-420],[-363,-303],[-529,-267],[-697,-177]],'#3e4c56','','1','C-shoulder-upper-plane');
 b+=poly([[-405,-505],[-265,-388],[-198,-246],[-270,-53],[-381,176],[-454,33],[-407,-146],[-470,-252],[-363,-303],[-302,-420]],'#213441','','1','C-shoulder-deep-side');
 b+=poly([[-310,-229],[-151,-374],[188,-397],[304,-307],[379,-104],[398,32],[-357,98]],'#122631','','1','C-dark-angular-house-alcove');
 b+=poly([[188,-397],[318,-406],[430,-304],[521,-139],[549,149],[483,360],[350,291],[377,103],[304,-307]],'#263945','','1','C-eastern-recess-wall');
 b+=poly([[318,-406],[430,-304],[521,-139],[478,-78],[409,-209]],'#374650','','1','C-one-receding-cheek-plane');
 // Low-value bedrock continues behind both real solids, retaining the open
 // drop throat. The exposed, higher-contrast rock is painted INSIDE collision.
 const trace=terrainUnderside(stage,market.id).points.slice().reverse().map(p=>[p.x-n.x,p.y-n.y-12]);
 b+=poly([...trace,[566,729],[722,1020],[570,1190],[164,1110],[-156,1001],[-383,727],[-457,395]],'#283b46','','1','C-underbody-rock-connected-to-solid');
 b+=poly([[367,214],[489,318],[548,521],[671,627],[755,857],[568,995],[534,802],[394,679],[290,496]],'#142b37','','1','C-descent-throat-contact-shadow');
 b+=poly([[600,431],[824,438],[924,592],[1152,749],[1145,913],[993,1040],[840,967],[780,777],[669,673]],'#2f414b','','1','C-stair-recessed-bearing');
 const rear=asset('market-cove-room','장터 실제 절벽 뒤 낮은 어깨와 깊은 집굴',b,[-1250,-1250,2530,2530],{role:'cliff',category:'terrain',feet:[],extra:{kind:'market-cove-room',noWalkRim:true,groundedSupports:feet,terrainAttachments:attachments,referencePrinciple:'Stage11 attached rock mass; Stage12 recessed mother rock; close shoulder remains subordinate to actual rock face'}});
 const planes=[],add=(terrainId,id,points,fill)=>planes.push({terrainId,id:ELEMENT+'C-plane-'+id,stage14VerticalArt:true,points:points.map(p=>p.map(N)),fill});
 const local=(id,ps,fill,terrainId=market.id)=>add(terrainId,id,ps.map(([x,y])=>[n.x+x,n.y+y]),fill);
 const colors={body:'#4a5964',light:'#7b878b',face:'#647680',foot:'#4e626e',shade:'#2c414f',joint:'#172e3ccc',bed:'#243e4d99'};
 const block=(id,terrainId,x,y,w,h,variant,joint=true)=>{const r=C_REFERENCE_ROCK_FORMS[variant];for(const key of ['body','light','face','foot','shade',...(joint?['joint']:[]),'bed'])add(terrainId,id+'-'+key,rockFormPoints(r[key]).map(([px,py])=>[x+px*w/1200,y+py*h/900]),colors[key]);};
 // These paired block placements follow C's solid volume, not empty sky. The
 // shared renderer clips them to the live polygon and keeps the true top rim.
 add(market.id,'continuous-cool-bedrock',market.points.map(p=>[p.x,p.y]),'#414e5b');
 block('west-embedded-stone',market.id,n.x-486,n.y-8,480,658,2,true);
 block('main-house-bearing-stone',market.id,n.x-259,n.y-26,694,598,0,true);
 // Reuse Stage12's broad dark joint paired with a small upper-left edge light.
 // Unlike the rejected S-curve, the fold turns with the two solid stone faces.
 const seam=(terrainId,id,ps,width,fill,dx=0,dy=0)=>{for(let i=1;i<ps.length;i++){const [ax,ay]=ps[i-1],[zx,zy]=ps[i],len=Math.hypot(zx-ax,zy-ay),nx=-(zy-ay)/len*width/2,ny=(zx-ax)/len*width/2;add(terrainId,id+'-'+i,[[ax+dx+nx,ay+dy+ny],[zx+dx+nx,zy+dy+ny],[zx+dx-nx,zy+dy-ny],[ax+dx-nx,ay+dy-ny]],fill);}};
 const joint=[[18,14],[6,90],[-32,159],[-13,208],[-43,261],[-81,341],[-127,404],[-105,488]].map(([x,y])=>[n.x+x,n.y+y]);
 seam(market.id,'one-main-fracture-shadow',joint,9,'#142d3acc');seam(market.id,'one-main-fracture-edge',joint,2.6,'#a5b1ab6b',-5,-6);
 // Embedded retaining stones take the colour and load-bearing contacts from
 // Stage16's plinth. They stop beneath each actual shop/home footprint.
 local('shop-contact',[[-379,2],[-137,2],[-150,15],[-359,19]],'#122631');
 local('shop-stone-left',[[-359,18],[-267,16],[-259,50],[-352,60]],'#667980');
 local('shop-stone-right',[[-258,17],[-158,19],[-164,53],[-252,53]],'#596d77');
 local('shop-foundation-shadow',[[-352,60],[-252,53],[-164,53],[-180,70],[-280,76],[-343,71]],'#293e4b');
 local('house-contact',[[-9,2],[272,2],[259,15],[5,19]],'#102531');
 local('house-stone-left',[[7,19],[121,20],[126,56],[13,60]],'#6b7d81');
 local('house-stone-right',[[128,20],[259,17],[250,56],[134,58]],'#61737b');
 local('house-top-edge',[[7,19],[121,20],[121,25],[9,24]],'#a0aaa166');
 local('house-bottom-contact',[[13,60],[134,58],[250,56],[238,73],[89,75],[24,69]],'#243a48');
 // The same material belongs to the immediate descent stone, with less top
 // illumination than the inhabited ledge. Nothing changes its stair contour.
 add(steps.id,'descent-bedrock',steps.points.map(p=>[p.x,p.y]),'#3e4d59');
 block('descent-upper-stone',steps.id,n.x+385,n.y+361,491,447,2,false);
 block('descent-lower-stone',steps.id,n.x+791,n.y+756,445,246,0,false);
 return{rear,planes,origin:{x:n.x,y:n.y},feet};
}
/** Extend the approved C rock language through named solid masses. Spacing
 * follows actual rooms/shoulders, never a regular stamp grid. Large slopes use
 * bedding along their real walk profile; broad houses sit above upright blocks.
 * Only four primary masses get a deep reference joint. All paint is clipped by
 * the unchanged shared renderer, and the accepted C planes are left intact. */
function connectedVillageRockPlanes(stage){
 const planes=[],records=[],byId=new Map(stage.terrains.map(t=>[t.id,t]));
 const add=(terrainId,key,points,fill)=>{if(!byId.has(terrainId))throw Error('Missing village material support '+terrainId);planes.push({terrainId,id:ELEMENT+'stone-'+key,stage14VerticalArt:true,points:points.map(p=>p.map(N)),fill});};
 const tones={body:'#4a5964',light:'#74828a',face:'#5f727d',foot:'#4a606d',shade:'#2c414f',joint:'#172e3ccc',bed:'#243e4d88'};
 const lower={...tones,light:'#6c7f87',face:'#586e7b',foot:'#435b69',shade:'#263d4d'};
 const extendedY=(id,x)=>{const edges=walkEdges(stage,id),lo=Math.min(...edges.flat().map(p=>p.x)),hi=Math.max(...edges.flat().map(p=>p.x));return actualY(stage,id,Math.max(lo,Math.min(hi,x)));};
 const block=(terrainId,key,x,y,w,h,variant,{follow=false,joint=false,bed=false,dark=false}={})=>{const form=C_REFERENCE_ROCK_FORMS[variant],colors=dark?lower:tones;for(const k of ['body','light','face','foot','shade',...(joint?['joint']:[]),...(bed?['bed']:[])])add(terrainId,key+'-'+k,rockFormPoints(form[k]).map(([px,py])=>{const xx=x+px*w/1200;return[xx,(follow?extendedY(terrainId,xx):y)+py*h/900+(follow?y:0)];}),colors[k]);records.push({terrainId,key,variant,followWalkProfile:follow,deepJoint:joint,box:{x,y,w,h},reference:'Stage11 ROCK_BLOCKS unchanged source forms'});};
 const reserved=new Set(['v14-market','v14-east-steps','refuge-bridge-walkway','gate-bridge']);
 for(const t of stage.terrains)if(!reserved.has(t.id))add(t.id,t.id+'-continuous-body',t.points.map(p=>[p.x,p.y]),t.id==='v14-refuge-ground'?'#2c4050':'#414e5b');
 // A/B: three unequal geological volumes, including the large C-facing flank.
 block('v14-upper-hamlet','entry-shoulder',-250,1330,1740,2400,1,{bed:true});
 block('v14-upper-hamlet','upper-house-bearing',1260,1540,1880,2420,0,{joint:true});
 block('v14-upper-hamlet','upper-descent-face',2690,2130,1560,2180,2,{bed:true});
 // D: the pocket and its rising return have a common continuous bedrock base.
 block('v14-mineral-way','mineral-house-pocket',2110,4590,1180,480,1,{bed:true});
 block('v14-mineral-way','mineral-rising-shoulder',3140,-18,1060,380,2,{follow:true});
 block('v14-west-family-road','west-return-head',1760,-12,735,285,1,{follow:true});
 block('v14-west-family-road','west-return-middle',2310,-21,713,475,0,{follow:true});
 block('v14-west-family-road','west-return-foot',2845,-9,636,470,2,{follow:true,bed:true});
 // E: clipped upper/lower inclined sheets, then two heavier shoulder blocks.
 block('v14-east-crown-road','east-crown-head',5250,-12,756,447,0,{follow:true});
 block('v14-east-crown-road','east-crown-middle',5820,-16,785,292,2,{follow:true});
 block('v14-east-crown-road','east-crown-tail',6440,-8,516,207,1,{follow:true});
 block('v14-east-shoulder','east-overlook-west',5590,4940,1020,1010,1,{bed:true});
 block('v14-east-shoulder','east-overlook-east',6430,4980,843,690,2,{joint:true});
 block('v14-east-family-road','east-return-low',5150,-21,853,404,2,{follow:true});
 block('v14-east-family-road','east-return-fold',5810,-14,671,420,1,{follow:true,bed:true});
 block('v14-east-family-road','east-return-rise',6320,-9,930,325,0,{follow:true});
 block('v14-east-family-road','east-return-head',7100,-12,520,307,2,{follow:true});
 // CF: individual real steps receive differently sized embedded stones. They
 // keep their physical risers; no background stairs or new footholds are drawn.
 block('v14-family-shoulders','family-step-low',4460,6180,475,330,1,{dark:true});
 block('v14-family-shoulders','family-step-middle',4830,5775,450,530,0,{dark:true});
 block('v14-family-shoulders','family-step-high',5190,5370,482,470,2,{dark:true,bed:true});
 const lintel=byId.get('v14-family-roof-step'),lt=Math.min(...lintel.points.map(p=>p.y)),lx=Math.min(...lintel.points.map(p=>p.x)),lr=Math.max(...lintel.points.map(p=>p.x));
 add(lintel.id,'lintel-upper-stone',[[lx,lt],[lr,lt],[lr,lt+11],[lx,lt+14]],'#687d86');
 add(lintel.id,'lintel-bearing-underside',[[lx,lt+25],[lr,lt+22],[lr,lt+35],[lx,lt+35]],'#263d4b');
 // F: the reunion homes bear on a wide two-block outcrop. Its west folded base
 // follows the existing low exit, instead of becoming a thin decorative ramp.
 block('v14-family-yard','family-low-return',2400,-8,770,378,1,{follow:true,dark:true});
 block('v14-family-yard','family-return-fold',2960,-17,905,762,2,{follow:true,dark:true});
 block('v14-family-yard','family-west-mass',3490,6690,906,1120,0,{dark:true,joint:true});
 block('v14-family-yard','family-home-mass',4210,6712,869,1160,1,{dark:true,bed:true});
 // G/H: broader bank stones sink into one dark river bed. There are no repeated
 // cracks below each dwelling, and the bridge canal remains the actual solid.
 block('v14-refuge-ground','west-river-flank',-270,-60,1680,2040,2,{follow:true,dark:true});
 block('v14-refuge-ground','west-refuge-bank',1150,-38,1410,1530,1,{follow:true,dark:true,bed:true});
 block('v14-refuge-ground','bridge-west-bank',2490,-22,1130,1260,0,{follow:true,dark:true});
 block('v14-refuge-ground','river-house-bank',3540,-41,1550,1760,2,{follow:true,dark:true,joint:true});
 block('v14-refuge-ground','eastern-river-bank',4830,-38,1700,1920,1,{follow:true,dark:true});
 block('v14-refuge-ground','far-river-flank',6290,-52,1770,1810,0,{follow:true,dark:true,bed:true});
 // Actual wood deck only. The former rail was legible but the shallow true
 // bridge shared the generic grey cave material; the physical slab now reads
 // as timber without painting an extra bridge surface over the canal.
 const bridge=byId.get('refuge-bridge-walkway'),bp=bridge.points,bl=Math.min(...bp.map(p=>p.x)),br=Math.max(...bp.map(p=>p.x)),by=Math.min(...bp.map(p=>p.y)),bb=Math.max(...bp.map(p=>p.y));
 add(bridge.id,'bridge-timber-body',bp.map(p=>[p.x,p.y]),'#514b3c');
 add(bridge.id,'bridge-timber-top',[[bl,by],[br,by],[br,by+8],[bl,by+8]],'#97845f');
 add(bridge.id,'bridge-timber-deep-face',[[bl,by+16],[br,by+16],[br,bb],[bl,bb]],'#30362f');
 for(const [i,f]of [.09,.23,.43,.61,.77,.92].entries()){const x=bl+(br-bl)*f;add(bridge.id,'bridge-real-board-end-'+i,[[x,by+7],[x+2.6,by+7],[x+2.6,bb],[x,bb]],'#242f2a');}
 const gate=byId.get('gate-bridge'),gl=Math.min(...gate.points.map(p=>p.x)),gr=Math.max(...gate.points.map(p=>p.x)),gy=Math.min(...gate.points.map(p=>p.y)),gb=Math.max(...gate.points.map(p=>p.y));
 add(gate.id,'gate-stone-body',gate.points.map(p=>[p.x,p.y]),'#4a5c65');
 add(gate.id,'gate-stone-side',[[gr-15,gy],[gr,gy],[gr,gb],[gr-12,gb]],'#283d48');
 add(gate.id,'gate-stone-top',[[gl,gy],[gr,gy],[gr-15,gy+14],[gl+3,gy+11]],'#7a8888');
 return{planes,records};
}
function dwellingContactPlanes(project,stage){
 const out=[];for(const e of stage.elements.filter(e=>e.id.startsWith(ELEMENT)&&e.id!=='v14-art-market-empty-home')){const a=project.library.find(a=>a.id===e.assetId);if(a?.params.kind!=='home'||!e.stage14Support)continue;const xs=a.params.footXs,lo=e.x+Math.min(...xs)*e.scale,hi=e.x+Math.max(...xs)*e.scale,w=hi-lo,y=e.y,t=e.stage14Support.terrainId,id=e.id+'-contact',put=(suffix,ps,fill)=>out.push({terrainId:t,id:id+'-'+suffix,stage14VerticalArt:true,points:ps.map(p=>p.map(N)),fill});
  put('shadow',[[lo-5,y+2],[hi+5,y+2],[hi-3,y+13],[lo+7,y+17]],'#142b38');
  put('left-stone',[[lo+8,y+17],[lo+w*.46,y+15],[lo+w*.49,y+48],[lo+15,y+55]],'#647782');
  put('right-stone',[[lo+w*.49,y+15],[hi-6,y+16],[hi-12,y+49],[lo+w*.52,y+48]],'#586e79');
  put('bearing',[[lo+15,y+55],[lo+w*.52,y+48],[hi-12,y+49],[hi-22,y+64],[lo+w*.29,y+67]],'#2b4150');
 }return out;
}
export function createStage14VerticalAssets(){return{upperHome:upperHome(),familyHome:familyHome(),riverHome:riverHome(),marketStall:marketStall(),clothRack:clothRack(),refugeBundles:refugeBundles(),riverLamp:riverLamp(),vacantHome:vacantHome(),earthenWing:earthenWing(),householdYard:householdYard(),ondolHearth:ondolHearth()};}

function rail(stage,support,x1,x2){const ys=[x1,x1+(x2-x1)*.46,x2].map(x=>({terrainId:support,x,y:actualY(stage,support,x)})),origin=ys[0];let b='';for(const p of ys){const x=p.x-origin.x,y=p.y-origin.y;b+=poly([[x-7,y],[x-8,y-68],[x+6,y-71],[x+8,y]],C.woodDark,C.ink,2)+line([[x-3,y-63],[x-2,y-5]],C.woodLight,3);}for(let i=1;i<ys.length;i++){const a=ys[i-1],z=ys[i],ax=a.x-origin.x,zx=z.x-origin.x,ay=a.y-origin.y,zy=z.y-origin.y;b+=poly([[ax-10,ay-60],[zx+9,zy-60],[zx+9,zy-50],[ax-10,ay-50]],'#867d61',C.ink,2)+line([[ax+4,ay-54],[zx-4,zy-54]],'#b1a17a',2)+line([[ax+5,ay-31],[zx-5,zy-28]],'#5e6654',4);}return{asset:asset('refuge-rail','실제 피난길 가장자리의 낮은 뒷난간',b,[-17,Math.min(...ys.map(p=>p.y-origin.y))-77,x2-x1+37,Math.max(...ys.map(p=>p.y-origin.y))-Math.min(...ys.map(p=>p.y-origin.y))+84],{feet:[],extra:{kind:'rear-rail',noDeck:true,localFootSource:'actual-terrain-profile',groundedSupports:ys}}),origin,feet:ys};}
function terrainUnderside(stage,id){
 const terrain=stage.terrains.find(t=>t.id===id),edges=terrain?.properties?.honroWalkEdges;
 if(!terrain||!edges?.length)throw Error('Stage14 rear rock needs declared terrain '+id);
 const lastTop=Math.max(...edges)+1,points=terrain.points.slice(lastTop+1).map(p=>({x:p.x,y:p.y}));
 if(points.length<2)throw Error('Stage14 rear rock needs an authored lower outline '+id);
 return{terrainId:id,points};
}
function inhabitedMotherRock(stage){
 const n=stage.design.vertical14.nodes,ids=['v14-market','v14-mineral-way','v14-west-family-road','v14-east-steps','v14-family-shoulders','v14-family-roof-step','v14-family-yard'],attachments=ids.map(id=>terrainUnderside(stage,id)),byId=new Map(attachments.map(a=>[a.terrainId,a])),under=id=>byId.get(id).points.slice().reverse(),trace=ps=>ps.map(p=>`${N(p.x)} ${N(p.y-22)}`).join('L'),feet=[2500,4500,6100].map(x=>({terrainId:n.G.surfaceId,x,y:actualY(stage,n.G.surfaceId,x)})),market=under('v14-market'),mineral=under('v14-mineral-way'),steps=under('v14-east-steps'),family=under('v14-family-shoulders'),lintel=under('v14-family-roof-step'),westFoot=feet[0],eastFoot=feet[2];
 // The inhabited ledges are exposed lips in front of one recessed mother-rock
 // shoulder. Its top overlaps each real underside by 22 units; its lower mass
 // spreads into the river bed, rather than becoming a row of thin posts.
 let body=path(`M${trace(mineral)}L${trace(market)}Q5550 ${n.C.y+620} 5940 ${n.E.y-180}Q6250 ${n.E.y+430} 5950 ${n.F.y-480}L6240 ${n.F.y+80}Q6160 ${n.F.y+850} ${eastFoot.x} ${eastFoot.y}L${feet[1].x} ${feet[1].y}L${westFoot.x} ${westFoot.y}Q2590 ${n.F.y+510} 2970 ${n.F.y-20}Q2760 ${n.D.y+1530} 2080 ${n.D.y+960}Q1510 ${n.D.y+640} 1660 ${n.D.y+160}Q1880 ${n.D.y+80} ${mineral[0].x} ${mineral[0].y-22}Z`,'#22343f','',1,'central-inhabited-mother-rock');
 // The broad front-facing facet starts on C's actual uneven lower polygon.
 // No pale rim, flat decorative landing, artificial masonry or repeated seams.
 body+=path(`M${trace(market)}Q5480 ${n.E.y-30} 5250 ${n.E.y+490}L4740 ${n.F.y-960}Q4320 ${n.F.y-1030} 3980 ${n.F.y-550}L3780 ${n.F.y-930}Q4230 ${n.D.y+450} ${market[0].x} ${market[0].y-22}Z`,'#2b3e47','',1,'market-broad-underbody-face');
 body+=path(`M${trace(steps)}Q6260 ${n.E.y+30} 5840 ${n.F.y-830}L${family.at(-1).x} ${family.at(-1).y-22}L${trace(family.slice().reverse())}Q4850 ${n.E.y+290} ${steps[0].x} ${steps[0].y-22}Z`,'#243943','',1,'connected-descent-rock-shoulder');
 body+=path(`M${mineral[0].x} ${mineral[0].y-22}L${trace(mineral.slice(1))}Q3910 ${n.D.y+510} 3360 ${n.D.y+1070}Q3080 ${n.F.y-520} 3510 ${n.F.y+70}L3090 ${n.F.y+940}Q3040 ${n.F.y-10} 2530 ${n.D.y+1370}Q1850 ${n.D.y+590} ${mineral[0].x} ${mineral[0].y-22}Z`,'#20343d','',1,'mineral-return-deep-side-face');
 // The 35-unit playable lintel is a ledge out of a low broad rear outcrop.
 // The outcrop meets the real F yard, rather than suggesting a floating slab.
 const footLeft=actualY(stage,n.F.surfaceId,3830),footRight=actualY(stage,n.F.surfaceId,4740);
 body+=path(`M${trace(lintel)}Q4590 ${n.F.y-90} 4740 ${footRight}L3830 ${footLeft}Q3950 ${n.F.y-118} ${lintel[0].x} ${lintel[0].y-22}Z`,'#39494e','',1,'family-lintel-low-broad-outcrop');
 body+=path(`M${N(lintel[0].x+108)} ${N(lintel[0].y-15)}Q4260 ${n.F.y-65} 4120 ${n.F.y}L3830 ${footLeft}Q3950 ${n.F.y-118} ${lintel[0].x} ${lintel[0].y-22}Z`,'#2a3d44','',1,'family-outcrop-one-shadow-plane');
 feet.push({terrainId:n.F.surfaceId,x:3830,y:footLeft},{terrainId:n.F.surfaceId,x:4740,y:footRight});
 return{body,feet,attachments:attachments.map(a=>({...a,contact:'actual lower contour overlapped by recessed rear mass',rearOverlap:22}))};
}
function cavern(stage){
 const mother=inhabitedMotherRock(stage),n=stage.design.vertical14.nodes,support=n.G.surfaceId,feet=[...mother.feet],ground=x=>{const y=actualY(stage,support,x);feet.push({terrainId:support,x,y});return y;},leftFoot=ground(420),midFoot=ground(2500),rightFoot=ground(6880),farFoot=ground(7460),base=n.G.y;
 // Three unequal rock shoulders are deliberately recessed and lack walk rims.
 // Their broad values leave the real collision ledges and actors in front.
 let b=`<defs><linearGradient id="v14-cave-depth" x1="0" y1="${n.B.y-550}" x2="0" y2="${base}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#142933"/><stop offset=".58" stop-color="#1b343d"/><stop offset="1" stop-color="#203c42"/></linearGradient><linearGradient id="v14-low-mist" x1="0" y1="${base-620}" x2="0" y2="${base+130}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#77918b" stop-opacity="0"/><stop offset=".7" stop-color="#77918b" stop-opacity=".14"/><stop offset="1" stop-color="#77918b" stop-opacity="0"/></linearGradient></defs>`;
 b+=`<defs><linearGradient id="v14-rear-vault-wash" x1="2400" y1="${n.A.y-900}" x2="5300" y2="${base+500}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#142331"/><stop offset=".46" stop-color="#142933"/><stop offset="1" stop-color="#293f46"/></linearGradient><linearGradient id="v14-middle-cave-haze" x1="0" y1="${n.C.y-300}" x2="0" y2="${n.E.y+500}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#718c87" stop-opacity="0"/><stop offset=".52" stop-color="#718c87" stop-opacity=".13"/><stop offset="1" stop-color="#718c87" stop-opacity="0"/></linearGradient></defs>`;
 b+=path(`M-700 ${n.A.y-650}Q1850 ${n.A.y-1250} 3830 ${n.A.y-610}Q6380 ${n.A.y-870} 8050 ${n.C.y-630}L8050 ${base+660}L-700 ${base+880}Z`,'url(#v14-rear-vault-wash)','',1,'continuous-deep-cavern-vault');
 b+=path(`M1180 ${n.A.y-650}Q2540 ${n.A.y-950} 3900 ${n.A.y-600}Q4370 ${n.B.y-980} 4790 ${n.C.y-550}L5350 ${n.C.y+30}Q4170 ${n.C.y-510} 3520 ${n.B.y+600}Q3030 ${n.B.y+120} 2840 ${n.A.y-80}Z`,'#263b46','',1,'broad-oblique-vault-plane-above-homes');
 b+=path(`M3110 ${n.B.y+40}Q3510 ${n.B.y+650} 4060 ${n.C.y-250}L4680 ${n.C.y+250}Q4020 ${n.D.y+760} 3860 ${n.F.y-780}L3320 ${n.F.y-320}Q3210 ${n.D.y+230} 2590 ${n.D.y-420}Q2870 ${n.C.y-150} 3110 ${n.B.y+40}Z`,'#102631','',1,'open-middle-hollow-with-irregular-shoulders');
 b+=path(`M4730 ${n.A.y-480}Q6470 ${n.B.y-850} 6840 ${n.C.y-440}L6500 ${n.E.y-370}Q5890 ${n.D.y-640} 5420 ${n.C.y-310}Q5790 ${n.B.y+740} 5360 ${n.B.y+280}Z`,'#2c424b','',1,'sloping-cavern-ceiling-east-plane');
 b+=path(`M240 ${n.D.y-150}Q1530 ${n.D.y-740} 2320 ${n.D.y-420}L2940 ${n.D.y+380}Q2460 ${n.F.y-680} 1780 ${n.F.y-180}L840 ${n.F.y+520}Q1520 ${n.F.y-810} 980 ${n.D.y+590}Z`,'#263f47','',1,'west-dwelling-cove-broad-sidewall');
 b+=path(`M5230 ${n.E.y+450}Q6270 ${n.E.y+880} 7120 ${n.F.y-280}L7480 ${base-90}Q6280 ${base-680} 5650 ${base-410}L4700 ${base+80}Q5580 ${n.F.y+680} 5230 ${n.E.y+450}Z`,'#31474d','',1,'lower-valley-fold-behind-houses');
 b+=path(`M-700 ${n.A.y-550}Q80 ${n.A.y-750} 1150 ${n.A.y-480}L1750 ${n.B.y-440}Q1970 ${n.B.y+440} 1680 ${n.D.y-400}Q1600 ${n.D.y+550} 2230 ${n.F.y-430}L2780 ${n.F.y+30}Q2630 ${n.F.y+860} 2500 ${midFoot}L420 ${leftFoot}L-700 ${leftFoot+350}Z`,'url(#v14-cave-depth)','',1,'west-cavern-shoulder');
 b+=path(`M360 ${n.A.y-500}L1180 ${n.A.y-340}Q1620 ${n.B.y-280} 1580 ${n.D.y-680}Q1300 ${n.D.y-100} 1740 ${n.F.y-490}L1520 ${n.F.y+680}L880 ${leftFoot-430}Q1120 ${n.F.y-110} 830 ${n.D.y+370}Q1050 ${n.D.y-480} 650 ${n.B.y+450}Z`,'#294049','',1,'west-large-lit-face');
 b+=path(`M-100 ${n.D.y-680}Q650 ${n.D.y-900} 1120 ${n.D.y-120}Q990 ${n.D.y+660} 1390 ${n.F.y+280}L980 ${leftFoot-60}L420 ${leftFoot}Q810 ${n.F.y-30} 290 ${n.D.y+890}Z`,'#112c36','',1,'west-one-deep-cleft');
 b+=path(`M5450 ${n.C.y-950}Q6160 ${n.C.y-1320} 6880 ${n.C.y-800}L7940 ${n.E.y-340}L8050 ${rightFoot+450}L7460 ${farFoot}L6880 ${rightFoot}Q7180 ${n.F.y+610} 6510 ${n.F.y-410}Q6200 ${n.E.y+810} 6430 ${n.E.y+80}Q6150 ${n.C.y-380} 5450 ${n.C.y-950}Z`,'#203944','',1,'east-high-asymmetric-rock');
 b+=path(`M5960 ${n.C.y-830}Q6550 ${n.C.y-710} 6870 ${n.E.y-690}Q7060 ${n.E.y+300} 6780 ${n.F.y-780}L7260 ${n.F.y+10}Q7480 ${n.F.y+890} 7160 ${rightFoot-180}L6880 ${rightFoot}Q7180 ${n.F.y+610} 6510 ${n.F.y-410}Q6200 ${n.E.y+810} 6430 ${n.E.y+80}Z`,'#2c454d','',1,'east-broad-rock-plane');
 b+=path(`M7230 ${n.C.y-210}L7860 ${n.E.y-50}L7950 ${farFoot+160}L7460 ${farFoot}Q7730 ${n.F.y+460} 7410 ${n.F.y-250}Q7170 ${n.E.y+390} 7230 ${n.C.y-210}Z`,'#122e39','',1,'east-deep-return-recess');
 b+=mother.body;
 // Elliptical two-dimensional falloff keeps the distant haze from exposing
 // the cut ends of a giant horizontal card in the whole-stage view.
 b+=`<defs><radialGradient id="v14-soft-middle-depth" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#7b939a" stop-opacity=".09"/><stop offset=".63" stop-color="#7b939a" stop-opacity=".04"/><stop offset="1" stop-color="#7b939a" stop-opacity="0"/></radialGradient><radialGradient id="v14-soft-river-depth" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#8ba1a2" stop-opacity=".13"/><stop offset=".58" stop-color="#8ba1a2" stop-opacity=".065"/><stop offset="1" stop-color="#8ba1a2" stop-opacity="0"/></radialGradient></defs>`;
 b+=`<g id="middle-depth-soft-recession" transform="matrix(2550 0 0 740 4710 ${n.C.y+590})">${path('M-1-1H1V1H-1Z','url(#v14-soft-middle-depth)')}</g>`;
 b+=`<defs><linearGradient id="v14-distant-river-haze" x1="0" y1="${base-240}" x2="0" y2="${base+80}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#779994" stop-opacity="0"/><stop offset=".50" stop-color="#779994" stop-opacity=".17"/><stop offset="1" stop-color="#779994" stop-opacity=".03"/></linearGradient></defs>`;
 b+=`<g id="distant-river-soft-light" transform="matrix(3750 0 0 215 4060 ${base-85})">${path('M-1-1H1V1H-1Z','url(#v14-soft-river-depth)')}</g>`;
 b+=path(`M920 ${base-60}Q1670 ${base-110} 2440 ${base-85}M4720 ${base-110}Q5500 ${base-165} 6540 ${base-95}M3630 ${base-26}Q4330 ${base-45} 4730 ${base-17}`,'none','#9eb3a729',6,'three-broad-recessed-water-reflections');
 b+=`<g id="lower-river-haze-with-soft-ends" transform="matrix(3510 0 0 510 4210 ${base-345})">${path('M-1-1H1V1H-1Z','url(#v14-soft-middle-depth)')}</g>`;
 return{asset:asset('cavern-depth','거친 무늬 없이 깊이를 나누는 비대칭 동굴 암면',b,[-730,n.A.y-1260,8840,Math.max(base+910,leftFoot+380,rightFoot+480,farFoot+190)-(n.A.y-1260)],{role:'cliff',category:'terrain',feet:[],extra:{kind:'cavern-depth',noWalkRim:true,groundedSupports:feet,coverageSource:'actual-v14-terrain-bottoms-and-refuge-surface',terrainAttachments:mother.attachments,broadRockMasses:9,decorativePlatforms:0}}),feet};
}
export function applyStage14VerticalArt(project){
 const stage=project.stages.find(s=>s.metadata?.stageId===14);if(stage?.initialState?.honroVerticalStage14Revision!==1||!stage.design?.vertical14?.nodes)throw Error('Stage14 vertical art requires fresh vertical geometry');
 const unchanged=JSON.stringify({terrains:stage.terrains,units:stage.units,markers:stage.markers,routes:stage.routes,events:stage.events,initialState:stage.initialState}),otherStages=JSON.stringify(project.stages.filter(s=>s!==stage)),n=stage.design.vertical14.nodes;
 stage.elements=stage.elements.filter(e=>!e.id.startsWith(ELEMENT));stage.design.space.scenery=(stage.design.space.scenery||[]).filter(e=>!e.id.startsWith(ELEMENT));stage.design.space.lights=(stage.design.space.lights||[]).filter(e=>!e.id.startsWith(ELEMENT));stage.design.space.terrainPlanes=(stage.design.space.terrainPlanes||[]).filter(p=>!p.stage14VerticalArt);project.library=project.library.filter(a=>a.id!==PREFIX+'market-rock-surface');
 const back=cavern(stage);register(project,back.asset);stage.elements.unshift({id:ELEMENT+'cavern-depth',assetId:back.asset.id,x:0,y:0,scale:1,rotation:0,snap:false,depthLayer:'L1',layer:'back',stage14Supports:back.feet});
 const a=createStage14VerticalAssets(),placed=[];a.marketPlinth=plinthHome(a.vacantHome,'home-market-stone-base',32);a.familyPlinth=plinthHome(a.familyHome,'home-family-stone-base',42);a.riverPlinth=plinthHome(a.riverHome,'home-river-stone-base',38);
 for(const spec of [{key:'upper',zone:'B',support:n.B.surfaceId,x:2600,width:780,height:530,variant:0},{key:'family',zone:'F',support:n.F.surfaceId,x:4330,width:1130,height:430,variant:2},{key:'river',zone:'H',support:n.H.surfaceId,x:4450,width:1280,height:390,variant:0}])place(project,stage,householdRock(spec.key,spec.width,spec.height,spec.variant),'household-rock-'+spec.key,spec.support,spec.x,{zone:spec.zone,purpose:'Natural recessed rock cove behind the homes; no rim or collision.'});
 const cove=marketCove(stage);register(project,cove.rear);stage.elements.push({id:ELEMENT+'market-cove-room',assetId:cove.rear.id,...cove.origin,scale:1,rotation:0,snap:false,depthLayer:'L1',layer:'back',stage14Supports:cove.feet});stage.design.space.scenery.push({id:ELEMENT+'market-cove-room',elementId:ELEMENT+'market-cove-room',assetId:cove.rear.id,roomId:'v14-C',surfaceId:n.C.surfaceId,...cove.origin,scale:1,footOffset:0,visualOnly:true,purpose:'Low attached shoulder and recessed household hollow; foreground reference stone planes are clipped by the common terrain renderer.'});stage.design.space.terrainPlanes.push(...cove.planes);const connected=connectedVillageRockPlanes(stage);stage.design.space.terrainPlanes.push(...connected.planes);
 // Its feet were correct before, but the later family rock occluded the posts.
 const bearing=familyLintelBearing(stage);register(project,bearing.asset);stage.elements.push({id:ELEMENT+'family-lintel-bearing',assetId:bearing.asset.id,x:0,y:0,scale:1,rotation:0,snap:false,depthLayer:'L1',layer:'back',stage14Supports:bearing.feet});
 const on=(a,key,node,x,scale=1,purpose='Domestic scenery behind actors; no collision.')=>{const e=place(project,stage,a,key,node.surfaceId,x,{zone:Object.keys(n).find(k=>n[k]===node),scale,purpose});placed.push(e);return e;};
 on(a.vacantHome,'entry-empty-home',n.A,380,.90,'Empty upper-edge home establishes the inhabited cavern before the party descends.');
 on(a.householdYard,'entry-wash-yard',n.A,610,.72);
 on(a.upperHome,'upper-home',n.B,n.B.x-220,.90,'Resident home beside the upper rescue clearing.');
 on(a.earthenWing,'upper-east-wing',n.B,n.B.x+155,.89);
 on(a.ondolHearth,'upper-ondol-hearth',n.B,n.B.x-9,.65);
 on(a.marketStall,'market-stall',n.C,n.C.x-256,.73,'Low cloth canopy marks the western market without covering the drop junction.');
 on(a.marketPlinth,'market-empty-home',n.C,n.C.x+125,.87);
 on(a.householdYard,'market-onggi-yard',n.C,n.C.x-40,.62);
 on(a.clothRack,'market-work-cloth',n.C,n.C.x+310,.59);
 on(a.earthenWing,'mineral-work-home',n.D,n.D.x+15,.95,'Work household on the quiet flat return cove, outside the eastern enemy knot.');
 on(a.ondolHearth,'mineral-work-hearth',n.D,n.D.x-195,.72);
 on(a.householdYard,'mineral-water-jars',n.D,n.D.x+224,.60);
 on(a.vacantHome,'east-abandoned-home',n.E,n.E.x-355,.86,'Empty ridge home distinguishes the optional eastern circuit.');
 on(a.householdYard,'east-empty-yard',n.E,n.E.x-90,.66);
 on(a.earthenWing,'family-west-wing',n.F,n.F.x-135,.96,'Short west household wing stays clear of the resident and roof-step.');
 on(a.familyPlinth,'family-home',n.F,n.F.x+810,.87,'Family home remains east of the small roof-step and the reunion opening.');
 on(a.householdYard,'family-wash-yard',n.F,n.F.x+106,.65);
 on(a.ondolHearth,'family-hearth',n.F,n.F.x+533,.72);
 on(a.earthenWing,'west-refuge-empty-home',n.G,1980,.95,'Abandoned riverside wing rests on the west bank, away from the descent mouth.');
 on(a.householdYard,'west-refuge-water-jars',n.G,1730,.63);
 on(a.riverPlinth,'river-home',n.H,n.H.x+65,1,'Small river household beside the refuge.');
 on(a.vacantHome,'river-east-home',n.H,n.H.x+450,.77);
 on(a.refugeBundles,'refuge-bundles',n.H,n.G.x+880,1,'Packed goods stay on the east bank, outside the actual bridge deck.');
 on(a.clothRack,'river-drying-cloth',n.H,n.H.x+250,.60);
 on(a.riverLamp,'refuge-lamp',n.H,n.H.x-310,.84);
 on(a.riverLamp,'mineral-lamp',n.D,n.D.x-410,.70);
 const bridge=stage.terrains.find(t=>t.id==='refuge-bridge-walkway'),bridgeEdges=bridge?walkEdges(stage,bridge.id):[],railSupport=bridge?bridge.id:n.G.surfaceId,railLeft=bridge?Math.min(...bridgeEdges.flat().map(p=>p.x))+25:n.G.x-280,railRight=bridge?Math.max(...bridgeEdges.flat().map(p=>p.x))-25:n.G.x+140,r=rail(stage,railSupport,railLeft,railRight);register(project,r.asset);stage.elements.push({id:ELEMENT+'refuge-rail',assetId:r.asset.id,x:r.origin.x,y:r.origin.y,scale:1,rotation:0,snap:false,depthLayer:'L1',layer:'back',stage14Supports:r.feet});stage.design.space.scenery.push({id:ELEMENT+'refuge-rail',elementId:ELEMENT+'refuge-rail',assetId:r.asset.id,roomId:'v14-G',surfaceId:railSupport,x:r.origin.x,y:r.origin.y,scale:1,footOffset:0,visualOnly:true,purpose:'Rear rail only; the actual refuge bridge remains the only deck and collision.'});
 const contacts=dwellingContactPlanes(project,stage);stage.design.space.terrainPlanes.push(...contacts);
 for(const e of placed){const a=project.library.find(a=>a.id===e.assetId),p=a.params.lightAnchor;if(p)stage.design.space.lights.push({id:e.id+'-oil',x:e.x+p.x*e.scale,y:e.y+p.y*e.scale,roomId:stage.design.space.scenery.find(s=>s.id===e.id).roomId,kind:'oil',radius:a.params.kind==='home'?92:72,color:'#b99b6b',visualOnly:true});}
 // Procedural bands and stamp cliffs would compete with this specifically
 // authored hollow. The existing common atmosphere, WORLD projection, water,
 // terrain art and rendering machinery remain unchanged.
 stage.environment.placements=[];stage.environment.groups=[];stage.environment.surfaces=[];stage.environment.skyVisible=false;
 stage.environment.atmosphere={preset:'enclosed',overrides:{skyTop:'#101f29',skyBottom:'#243a3f',hazeStrength:.39,mistStrength:.065,lightStrength:.065}};
 stage.design.vertical14Art={revision:7,status:'whole-village-reference-material-awaiting-native-review',nativeVectorOnly:true,source:'tools/environment/stage14-vertical-art.mjs',geometrySource:'tools/map-forge/stage14-vertical-geometry.mjs',style:'Approved C reference material extended through connected upper hamlet, unequal return roads, family outcrop and river banks; unchanged Stage11 stone forms, restrained Stage12 directional joints and Stage16 domestic contact stones.',collisionPolicy:'none-added; L1-back scenery; terrainPlanes use common current-solid clipping before true edge readability; roofs and rails visual only',materialReferenceSources:['shared/runtime/stage11-landscape-art.js:ROCK_BLOCKS','shared/runtime/stage12-quarry-art.js:panels-and-seams','shared/data/campaign.json:stage16-authored-plinth-planes'],terrainPlaneIds:[...cove.planes,...connected.planes,...contacts].map(p=>p.id),namedStoneMasses:connected.records,supportPolicy:'actual declared walk edges cross-checked with v14Y; each local foot at support y; central rear rock meets actual terrain undersides',terrainAttachments:[...back.asset.params.terrainAttachments,...cove.rear.params.terrainAttachments],artAssetIds:[...new Set(stage.elements.filter(e=>e.id.startsWith(ELEMENT)).map(e=>e.assetId))],supports:stage.elements.filter(e=>e.id.startsWith(ELEMENT)).flatMap(e=>(e.stage14Supports||[]).map(p=>({elementId:e.id,...p}))),houseElements:placed.filter(e=>project.library.find(a=>a.id===e.assetId).params.kind==='home').map(e=>e.id),budgets:{maxNodesPerAsset:120,repeatedNoisePaths:0,decorativeCollisionBodies:0},views:[{id:'upper-hamlet',x:n.B.x,y:n.B.y-100,scale:.7,width:1440,height:960},{id:'market-three-way',x:n.C.x,y:n.C.y+150,scale:.52,width:1440,height:960},{id:'family-reunion',x:n.F.x+200,y:n.F.y-50,scale:.62,width:1440,height:960},{id:'river-refuge',x:(n.G.x+n.H.x)/2,y:n.G.y-100,scale:.64,width:1440,height:960},{id:'family-portrait',x:n.F.x+260,y:n.F.y-60,scale:.52,width:720,height:1080}]};
 if(JSON.stringify({terrains:stage.terrains,units:stage.units,markers:stage.markers,routes:stage.routes,events:stage.events,initialState:stage.initialState})!==unchanged||JSON.stringify(project.stages.filter(s=>s!==stage))!==otherStages)throw Error('Stage14 art changed gameplay or another stage');return project;
}
