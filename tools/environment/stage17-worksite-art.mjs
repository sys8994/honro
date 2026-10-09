import {compileSVG} from './build-act2-art.mjs';

// Stage-local, editable native vectors. All walking silhouettes remain authored
// terrain; these assemblies only describe the timber and tools behind them.
export const STAGE17_ART_PREFIX='stage17:worksite-';
const n=v=>Math.round(v*100)/100;
const path=(d,fill,stroke='',width=1,id='')=>`<path${id?` id="${id}"`:''} d="${d}" fill="${fill}"${stroke?` stroke="${stroke}" stroke-width="${width}" stroke-linejoin="round" stroke-linecap="round"`:''}/>`;
const poly=(points,fill,stroke='',width=1)=>path('M'+points.map(p=>p.map(n).join(' ')).join('L')+'Z',fill,stroke,width);
const line=(points,stroke,width)=>path('M'+points.map(p=>p.map(n).join(' ')).join('L'),'none',stroke,width);
const group=(x,y,sx,sy,body,id='')=>`<g${id?` id="${id}"`:''} transform="matrix(${n(sx)} 0 0 ${n(sy)} ${n(x)} ${n(y)})">${body}</g>`;
const nodes=t=>1+(t.children||[]).reduce((sum,v)=>sum+nodes(v),0);
const ellipse=(x,y,rx,ry,fill,stroke='',sw=1)=>path(`M${n(x-rx)} ${n(y)}a${n(rx)} ${n(ry)} 0 1 0 ${n(rx*2)} 0a${n(rx)} ${n(ry)} 0 1 0 ${n(-rx*2)} 0Z`,fill,stroke,sw);
const C={ink:'#171f23',wood:'#574534',woodLight:'#8d7350',woodEdge:'#b39867',woodDark:'#302e28',iron:'#29343a',ironLight:'#778079',rope:'#978460',ropeDark:'#48453a',rock:'#414e56',rockLight:'#6c7779',rockDark:'#27353d'};
function makeAsset(key,name,body,bounds,{category='architecture',role='architecture'}={}){
 const vector=compileSVG(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${bounds.map(n).join(' ')}"><title>${name}</title>${body}</svg>`),count=nodes(vector.root);
 if(count>420)throw Error(`Stage 17 vector node budget exceeded: ${key} (${count})`);
 const [x,y,w,h]=bounds;
 return{id:STAGE17_ART_PREFIX+key,name,category,environmentRole:role,visual:[],vector,collision:[],anchor:{x:0,y:0},sockets:[],tags:['stage17-worksite','visual-only','editable-native-vector'],params:{artRevision:1,collisionSource:'authored-stage-terrain',nodeCount:count},bounds:{x,y,w,h},reference:{heightM:h/60,bounds:{x,y,w,h},foot:{x:0,y:0},scaleRange:[.35,4],backgroundRange:[.35,4]}};
}
function add(project,st,asset,key,x=0,y=0,extra={}){
 const ai=project.library.findIndex(v=>v.id===asset.id);if(ai<0)project.library.push(asset);else project.library[ai]=asset;
 const e={id:'s17-art-'+key,assetId:asset.id,x,y,scale:1,rotation:0,snap:false,depthLayer:'L1',layer:'back',...extra};st.elements.push(e);return e;
}
function topEdges(st,t){
 const ids=t.properties?.honroWalkEdges||st.design?.space?.surfaces?.find(s=>s.terrainId===t.id)?.edgeIndices||[];
 return ids.map(i=>[t.points[i],t.points[(i+1)%t.points.length]]).filter(([a,z])=>a&&z&&Math.abs(z.x-a.x)>.01);
}
function surfaceAt(st,t,x){if(t.properties?.honroCeiling){const hits=[];for(let i=0;i<t.points.length;i++){const a=t.points[i],z=t.points[(i+1)%t.points.length];if(Math.abs(z.x-a.x)>.01&&x>=Math.min(a.x,z.x)&&x<=Math.max(a.x,z.x))hits.push(a.y+(z.y-a.y)*(x-a.x)/(z.x-a.x));}return hits.length?Math.max(...hits):null;}for(const [a,z]of topEdges(st,t))if(x>=Math.min(a.x,z.x)-.01&&x<=Math.max(a.x,z.x)+.01)return a.y+(z.y-a.y)*(x-a.x)/(z.x-a.x);if(t.id==='act2-floor'){const ys=[];for(let i=0;i<t.points.length;i++){const a=t.points[i],z=t.points[(i+1)%t.points.length];if(Math.abs(z.x-a.x)>.01&&x>=Math.min(a.x,z.x)&&x<=Math.max(a.x,z.x))ys.push(a.y+(z.y-a.y)*(x-a.x)/(z.x-a.x));}return ys.length?Math.min(...ys):null;}return null;}
function supportAt(st,x,above,ignore=''){
 const candidates=st.terrains.filter(t=>t.id!==ignore&&!t.oneWay&&!t.properties?.honroCeiling&&!t.breakable).map(t=>({terrainId:t.id,y:surfaceAt(st,t,x)})).filter(p=>p.y!==null&&p.y>=above-1).sort((a,b)=>a.y-b.y);
 if(!candidates.length)throw Error(`Stage 17 timber has no real support at ${x}, below ${above}`);return candidates[0];
}
function bottomAt(t,x){const hits=[];for(let i=0;i<t.points.length;i++){const a=t.points[i],z=t.points[(i+1)%t.points.length];if(Math.abs(z.x-a.x)>.01&&x>=Math.min(a.x,z.x)-.01&&x<=Math.max(a.x,z.x)+.01)hits.push(a.y+(z.y-a.y)*(x-a.x)/(z.x-a.x));}return Math.max(...hits);}
function extents(t){const xs=t.points.map(p=>p.x),ys=t.points.map(p=>p.y);return{x:Math.min(...xs),y:Math.min(...ys),w:Math.max(...xs)-Math.min(...xs),h:Math.max(...ys)-Math.min(...ys)};}

// Hewn beams have broad uneven faces rather than thin polygon sticks. Iron
// collars sit across the beam, with a warm worn edge on the upper-left face.
function beam(ax,ay,bx,by,width=46,{dark=false,bands=true}={}){
 const dx=bx-ax,dy=by-ay,len=Math.hypot(dx,dy);if(len<1)return'';
 const ux=dx/len,uy=dy/len,nx=-uy,ny=ux,at=(u,v)=>[ax+dx*u+nx*v,ay+dy*u+ny*v];
 let b=poly([at(0,-width*.52),at(.43,-width*.46),at(1,-width*.55),at(1,width*.48),at(.38,width*.52),at(0,width*.43)],dark?C.woodDark:C.wood,C.ink,4);
 b+=poly([at(0,-width*.5),at(.43,-width*.43),at(1,-width*.52),at(1,-width*.25),at(.54,-width*.17),at(0,-width*.21)],dark?'#655741':C.woodLight);
 b+=line([at(.03,width*.27),at(.38,width*.31),at(.7,width*.23),at(.96,width*.32)],dark?'#252923':'#382f26',Math.max(3,width*.1));
 if(len>260)b+=line([at(.14,-width*.06),at(.31,-width*.02),at(.42,-width*.07)],'#a48a5a',Math.max(2,width*.045));
 if(bands)for(const f of [.13,.85]){const c=at(f,0),half=Math.min(14,len*.027),du=half/len;b+=poly([at(f-du,-width*.56),at(f+du,-width*.56),at(f+du,width*.53),at(f-du,width*.53)],C.iron);b+=line([at(f-du,-width*.49),at(f+du,-width*.49)],C.ironLight,3);b+=ellipse(c[0],c[1],3.6,3.6,'#a4a797');}
 return b;
}
function shoe(x,y,w=85){
 return poly([[x-w*.58,y-6],[x-w*.43,y-32],[x+w*.33,y-34],[x+w*.56,y-8],[x+w*.49,y+8],[x-w*.55,y+8]],'#575e5b',C.ink,4)+poly([[x-w*.43,y-32],[x+w*.33,y-34],[x+w*.48,y-20],[x-w*.48,y-16]],'#969580')+line([[x-w*.39,y-12],[x+w*.42,y-15]],'#323e41',5);
}
function knot(x,y,w=55){let b='';for(let i=0;i<3;i++)b+=path(`M${n(x-w*.52)} ${n(y-10+i*9)}Q${n(x)} ${n(y+5+i*9)} ${n(x+w*.49)} ${n(y-9+i*9)}`,'none',i===1?'#c0a978':C.rope,4);return b;}

function timberDeck(st,t,index){
 const edges=topEdges(st,t),xs=edges.flat().map(p=>p.x),left=Math.min(...xs),right=Math.max(...xs),w=right-left;
 if(!Number.isFinite(w)||w<160)return null;
 const footXs=w>1050?[left+74,left+w*.57,right-80]:[left+48,right-52],feet=footXs.map(x=>({x,...supportAt(st,x,surfaceAt(st,t,x),t.id)}));
 let b='';
 // The cross-braces connect the actual feet to the carrying stringer. Their
 // negative spaces stay open: no visual slabs invent an impassable wall.
 for(let i=0;i<feet.length-1;i++){
  const a=feet[i],z=feet[i+1],y0=Math.max(surfaceAt(st,t,a.x),surfaceAt(st,t,z.x))+55;
  if(Math.min(a.y,z.y)-y0>150)b+=beam(a.x,a.y-44,z.x-14,surfaceAt(st,t,z.x)+55,Math.min(45,w*.055),{dark:true,bands:false});
 }
 for(const f of feet){const top=surfaceAt(st,t,f.x);if(f.y-top<72)continue;b+=shoe(f.x,f.y,92);b+=beam(f.x,f.y-9,f.x+(index%2?12:-10),top+10,57);b+=knot(f.x,top+42,64);}
 for(const [a,z]of edges){b+=beam(a.x,a.y+39,z.x,z.y+39,45,{bands:false});b+=line([[a.x,a.y+21],[z.x,z.y+21]],'#bca070',4);}
 const bx=left+w*(index%2?.69:.28),by=surfaceAt(st,t,bx)+40;
 b+=poly([[bx-26,by-28],[bx+33,by-25],[bx+38,by+23],[bx-24,by+27]],C.iron,C.ink,3)+ellipse(bx-10,by-11,4,4,'#b0ac94')+ellipse(bx+21,by+11,4,4,'#b0ac94');
 const maxY=Math.max(...feet.map(f=>f.y));
 return{asset:makeAsset('trestle-'+t.id,'실제 바위에 내려앉은 목재 작업대와 버팀목',b,[left-95,Math.min(...edges.flat().map(p=>p.y))-8,w+190,maxY-Math.min(...edges.flat().map(p=>p.y))+34]),feet,terrainId:t.id};
}

function upperGallery(st,t,key){
 const es=topEdges(st,t),box=extents(t);let b='';
 for(const [a,z]of es){b+=beam(a.x,bottomAt(t,a.x)+12,z.x,bottomAt(t,z.x)+12,54,{bands:false});}
 // Upper galleries are carried by the neighbouring rock and the large hoist
 // masts. They do not grow independent floor-height posts across the shaft.
 if(key==='west-gallery')b+=beam(4720,3770,4980,3380,62,{dark:true});
 else b+=beam(5960,4210,6230,3870,59,{dark:true});
 const x=Math.min(box.x,4720),y=box.y-10;
 return makeAsset(key,'인양틀과 암반에 걸어 맞춘 상부 작업 선반',b,[x-70,y,box.x+box.w-x+150,950]);
}

// Multiple close levels belong to a single continuous structure. Each named
// flight shares a few long uprights rather than one decorative trestle per step.
function timberFlight(st,spec){
 const ts=spec.terrainIds.map(id=>st.terrains.find(t=>t.id===id));if(ts.some(t=>!t))throw Error('Missing worksite flight terrain '+spec.key);
 const es=ts.flatMap(t=>topEdges(st,t)),xmin=Math.min(...es.flat().map(p=>p.x)),xmax=Math.max(...es.flat().map(p=>p.x)),ymin=Math.min(...es.flat().map(p=>p.y));
 const posts=spec.postXs.map(x=>{const hits=ts.map(t=>surfaceAt(st,t,x)).filter(y=>y!==null),top=hits.length?Math.min(...hits):ymin+30;return{x,top,...supportAt(st,x,(hits.length?Math.max(...hits):ymin)+8)}});
 let b='';
 for(const p of posts){b+=shoe(p.x,p.y,117);b+=beam(p.x,p.y-10,p.x-9,p.top-38,73);}
 // A small number of substantial knee braces explains the cantilevered ends.
 const first=posts[0],last=posts.at(-1);
 if(first.y-first.top>230)b+=beam(first.x-1,first.top+260,first.x+203,first.top+14,48,{dark:true,bands:false});
 if(last.y-last.top>330)b+=beam(last.x-7,last.top+325,last.x-196,last.top+35,51,{dark:true,bands:false});
 for(const [i,t]of ts.entries())for(const [a,z]of topEdges(st,t)){
  b+=beam(a.x,a.y+54,z.x,z.y+54,49,{bands:false});
  const touching=posts.filter(p=>p.x>=Math.min(a.x,z.x)-22&&p.x<=Math.max(a.x,z.x)+22);
  for(const p of touching){const yy=surfaceAt(st,t,p.x);if(yy!==null)b+=knot(p.x,yy+47,83);}
  // A few iron-faced end joints vary across the complete flight, rather than
  // repeating a prop package at each standing level.
  if(i===0||i===ts.length-1){const xx=i?z.x-36:a.x+35,yy=surfaceAt(st,t,xx);b+=poly([[xx-23,yy+28],[xx+24,yy+28],[xx+25,yy+82],[xx-22,yy+82]],C.iron)+ellipse(xx,yy+53,5,5,'#aba78e');}
 }
 const bottom=Math.max(...posts.map(p=>p.y));
 return{asset:makeAsset(spec.key,spec.name,b,[xmin-90,ymin-90,xmax-xmin+180,bottom-ymin+125]),feet:posts.map(({top,...p})=>p),terrainIds:spec.terrainIds};
}

function wheel(x,y,r,{rope=true}={}){
 let b=ellipse(x+7,y+7,r,r*.94,'#1c282c',C.ink,8)+ellipse(x,y,r,r*.94,'#695640',C.ink,7)+ellipse(x,y,r*.72,r*.67,'#243139','#a88c61',6);
 for(const a of [-.15,.96,2.15]){const dx=Math.cos(a)*r*.82,dy=Math.sin(a)*r*.76;b+=beam(x-dx,y-dy,x+dx,y+dy,r*.16,{dark:false,bands:false});}
 b+=ellipse(x,y,r*.21,r*.2,'#384147','#a5a291',5)+ellipse(x,y,r*.08,r*.08,'#a6a290');
 if(rope)b+=path(`M${n(x-r*.92)} ${n(y-r*.24)}A${n(r*.96)} ${n(r*.91)} 0 1 1 ${n(x+r*.92)} ${n(y+r*.24)}`,'none',C.rope,6);
 return b;
}
function hoistAssembly(st,spec){
 const deck=st.terrains.find(t=>t.id===spec.terrainId);if(!deck)throw Error('Stage 17 hoist art needs its named deck: '+spec.terrainId);
 const es=topEdges(st,deck),xmin=Math.min(...es.flat().map(p=>p.x)),xmax=Math.max(...es.flat().map(p=>p.x)),span=xmax-xmin;
 const x=spec.x??xmin+span*.56,y=surfaceAt(st,deck,x),fallbackReach=Math.min(spec.width??1060,Math.max(620,span-90));
 const left=spec.leftSupport?spec.leftSupport.x-24:x-fallbackReach*.56,right=spec.rightSupport?spec.rightSupport.x+12:x+fallbackReach*.44,reach=right-left;
 const bases=[spec.leftSupport?.terrainId,spec.rightSupport?.terrainId,deck.id,'ws-hoist-west-lip'].map(id=>st.terrains.find(t=>t.id===id)).filter(Boolean);
 const fy=xx=>{for(const t of bases){const yy=surfaceAt(st,t,xx);if(yy!==null)return yy;}return y;},top=spec.topY??y-1260,ax=x+reach*.12,ay=top+151,rx=82;
 let b='';
 // Two unequal mast feet, a rear compression leg, a pegged head beam, and
 // one high pulley form a single recognizable hoisting structure.
 b+=beam(right+80,fy(right+80)-12,x+105,top+82,65,{dark:true});
 b+=beam(left+24,fy(left+24)-5,left+78,top+25,88);
 b+=beam(right-12,fy(right-12)-5,right-69,top+14,100);
 b+=beam(left-76,top+22,right+101,top-11,100);
 b+=beam(left+47,top+379,left+304,top+48,54,{dark:true});
 b+=beam(right-52,top+452,right-299,top+14,59,{dark:true});
 b+=shoe(left+24,fy(left+24),135)+shoe(right-12,fy(right-12),143);
 b+=knot(left+76,top+53,112)+knot(right-67,top+30,125);
 b+=poly([[ax-114,ay-78],[ax+107,ay-83],[ax+128,ay+65],[ax-116,ay+69]],'#273033',C.ink,5);
 b+=wheel(ax,ay,rx);
 // Taut ropes descend from the pulley to a heavy, low receiving cage. The
 // crosspiece follows the deck, and the hanging ends stop above its surface.
 const basketY=Math.min(y-515,top+1090),basketX=ax+72,basketW=560;
 b+=path(`M${n(ax+80)} ${n(ay+3)}L${n(ax+80)} ${n(basketY-620)}Q${n(ax+75)} ${n(basketY-590)} ${n(basketX)} ${n(basketY-555)}`,'none',C.ropeDark,19);
 b+=path(`M${n(ax+75)} ${n(ay+3)}L${n(ax+75)} ${n(basketY-620)}Q${n(ax+70)} ${n(basketY-590)} ${n(basketX-4)} ${n(basketY-555)}`,'none',C.rope,6);
 b+=line([[basketX-211,basketY-438],[basketX,basketY-580],[basketX+216,basketY-445]],C.ropeDark,17);
 b+=line([[basketX-215,basketY-438],[basketX-4,basketY-580],[basketX+212,basketY-445]],C.rope,5);
 // A bound quarry-stone counterweight, visually recessed inside the frame.
 // The top is rounded and strapped, never a bright false walking platform.
 b+=path(`M${n(basketX-270)} ${n(basketY-429)}Q${n(basketX-249)} ${n(basketY-485)} ${n(basketX-180)} ${n(basketY-476)}L${n(basketX+153)} ${n(basketY-480)}Q${n(basketX+243)} ${n(basketY-469)} ${n(basketX+267)} ${n(basketY-420)}L${n(basketX+259)} ${n(basketY-56)}Q${n(basketX+227)} ${n(basketY+10)} ${n(basketX+166)} ${n(basketY+2)}L${n(basketX-188)} ${n(basketY-3)}Q${n(basketX-266)} ${n(basketY-25)} ${n(basketX-266)} ${n(basketY-85)}Z`,'#3c4c4f',C.ink,8);
 b+=poly([[basketX-250,basketY-420],[basketX-179,basketY-469],[basketX+55,basketY-464],[basketX+15,basketY-289],[basketX+32,basketY-110],[basketX-143,basketY-47],[basketX-249,basketY-103]],'#63716b');
 b+=poly([[basketX+55,basketY-464],[basketX+170,basketY-471],[basketX+252,basketY-415],[basketX+254,basketY-89],[basketX+199,basketY-23],[basketX+31,basketY-39],[basketX+46,basketY-258]],'#2c3c42');
 b+=path(`M${n(basketX-203)} ${n(basketY-325)}Q${n(basketX-86)} ${n(basketY-358)} ${n(basketX-10)} ${n(basketY-331)}L${n(basketX+76)} ${n(basketY-352)}M${n(basketX-176)} ${n(basketY-137)}Q${n(basketX-93)} ${n(basketY-195)} ${n(basketX-15)} ${n(basketY-174)}`,'none','#a0a28c',7);
 b+=beam(basketX-288,basketY-408,basketX+288,basketY-404,55,{dark:true,bands:false})+beam(basketX-284,basketY-55,basketX+283,basketY-57,59,{dark:true,bands:false});
 for(const dx of [-166,169]){b+=poly([[basketX+dx-22,basketY-477],[basketX+dx+22,basketY-479],[basketX+dx+24,basketY+6],[basketX+dx-22,basketY+3]],C.iron,C.ink,3);b+=line([[basketX+dx-17,basketY-470],[basketX+dx-16,basketY-8]],'#697771',5);b+=ellipse(basketX+dx,basketY-410,7,7,'#9c9f8c')+ellipse(basketX+dx,basketY-54,7,7,'#9c9f8c');}
 // The left windlass sits on an unequal pair of bearing legs; the crank and
 // rope reel explain how this is operated without introducing new lore.
 const wx=left+225,wy=y-272;
 b+=beam(wx-121,fy(wx-121)-12,wx-87,wy-24,45)+beam(wx+159,fy(wx+159)-8,wx+108,wy-23,47);
 b+=poly([[wx-136,wy-59],[wx+129,wy-69],[wx+145,wy+29],[wx-120,wy+39]],'#6c5b41',C.ink,5);
 b+=ellipse(wx-124,wy-12,31,72,'#37413f','#9d8d67',6)+ellipse(wx+136,wy-20,30,70,'#454942','#9d8d67',6);
 for(const dx of [-85,-37,17,71])b+=path(`M${n(wx+dx)} ${n(wy-66)}Q${n(wx+dx-30)} ${n(wy-10)} ${n(wx+dx+1)} ${n(wy+36)}`,'none',C.rope,7);
 b+=line([[wx-161,wy-12],[wx-207,wy-12],[wx-207,wy-96],[wx-249,wy-96]],'#92927e',14);
 b+=line([[wx-87,wy-75],[ax-79,ay+24]],C.ropeDark,11)+line([[wx-89,wy-78],[ax-82,ay+22]],C.rope,4);
 return makeAsset('main-hoist','굵은 갱목과 매단 돌 인양추가 이어진 인양틀',b,[left-170,top-85,reach+400,y-top+135]);
}

function toolBay(key,variant=0){
 let b=path('M-304 10Q-173-13-72-4L102-14 291 15 214 35-102 37Z','#1b272b');
 // A heavy bench carries an anvil block and real hand tools. The baskets and
 // leaning pick are grouped by use, with a clear empty side for the worker.
 b+=beam(-142,9,-127,-121,36)+beam(103,9,117,-119,37)+beam(-190,-139,166,-135,41,{bands:false});
 b+=beam(-126,-42,101,-46,22,{dark:true,bands:false});
 b+=poly([[-67,-160],[-65,-206],[-32,-216],[21,-205],[61,-184],[19,-176],[10,-152]],'#68706e',C.ink,4)+poly([[-65,-206],[-32,-216],[21,-205],[61,-184],[16,-188],[-13,-199]],'#b0b19a');
 b+=beam(55,-155,120,-199,12,{bands:false})+poly([[103,-215],[134,-218],[142,-193],[109,-187]],'#5d676b',C.ink,3);
 b+=line([[-9,-156],[59,-158]],'#aca48a',6);
 b+=beam(-239,9,-165,-272,17,{bands:false});
 b+=path('M-226-241Q-178-284-126-259L-103-237-145-249-178-252-210-232Z','#697676',C.ink,4)+path('M-212-251Q-177-271-141-257','none','#b8b69c',3);
 b+=path('M171 6Q159-63 179-102Q216-129 255-98Q275-67 264 8Z','#685637',C.ink,5);
 b+=path('M175-92Q216-112 262-86M170-67Q217-82 268-60M170-39Q219-52 269-32M181-105L190 3M212-111L216 7M244-104L241 5','none','#a38d5a',6);
 b+=path('M179-87Q207-142 258-88','none','#ae9865',8);
 b+=poly([[169,-93],[189,-125],[217,-128],[230,-100],[209,-85]],'#5b696b')+poly([[206,-102],[235,-139],[264,-119],[266,-82],[239,-78]],'#879083');
 if(variant){b+=path('M-108 5Q-136-41-112-75L-72-95-38-69-34-6Z','#485c5c',C.ink,4)+path('M-109-73Q-90-43-37-47M-107-9Q-71-31-75-89','none','#8c9c85',5);}
 return makeAsset(key,variant?'인양축 옆 망치와 광주리 작업대':'굴착 곡괭이와 쇠쐐기를 내려둔 작업대',b,[-315,-296,630,347],{category:'prop',role:'prop'});
}
function timberStore(){
 let b=path('M-372 11L-257-23 269-10 357 13 191 43-236 36Z','#1c282a');
 b+=beam(-247,10,-233,-277,47)+beam(252,12,233,-240,45);
 for(const [ax,ay,bx,by,w]of [[-310,-40,298,-51,72],[-273,-111,316,-102,76],[-320,-184,256,-170,69]]){
  b+=beam(ax,ay,bx,by,w,{bands:false});b+=ellipse(ax+8,ay,w*.22,w*.42,'#99815a','#473c2e',4)+ellipse(ax+7,ay,w*.10,w*.23,'none','#5e4c34',3);
 }
 b+=knot(-206,-203,74)+knot(218,-190,84);
 b+=beam(-293,10,-170,-162,24,{dark:true,bands:false});
 return makeAsset('timber-store','굴착 입구의 엇갈려 쌓은 굵은 갱목',b,[-380,-311,765,365],{category:'prop',role:'prop'});
}
function oilLamp(){
 let b=beam(-5,8,-10,-253,20,{bands:false})+shoe(-5,7,73);
 b+=path('M-8-249Q32-273 65-247L67-204','none','#6b7167',9)+path('M48-202L86-202 92-165 41-165Z','#4c4634',C.ink,4);
 b+=path('M52-199L78-199 81-176 48-176Z','#c2a166')+path('M60-183Q46-201 60-215Q69-204 67-192L72-185Z','#e0c584');
 b+=line([[46,-169],[86,-169]],'#9f8b61',4);
 return makeAsset('oil-lamp','작업면을 비추는 낮은 기름등',b,[-55,-290,175,320],{category:'prop',role:'prop'});
}

// One recessed cavern surface links the roof to the actual lower floor. Its
// low-contrast vertical beds have no bright ledges or implied walkable rims.
function rearCavern(st){
 const roof=st.terrains.find(t=>t.id==='cave-roof'),floor=st.terrains.find(t=>t.id==='act2-floor');
 const xs=[0,1200,1700,2150,3100,4300,4800,5300,5800,6500,7500,8050,8700,9500,10000,11200],up=xs.map(x=>[x,surfaceAt(st,roof,x)-15]),down=xs.slice().reverse().map(x=>[x,surfaceAt(st,floor,x)+30]);
 let b='<defs><linearGradient id="recess" x1="3500" y1="2350" x2="6500" y2="6400" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#172b36"/><stop offset="0.48" stop-color="#223c45"/><stop offset="1" stop-color="#142d38"/></linearGradient></defs>';
 b+=poly([...up,...down],'url(#recess)');
 // Large quiet washes descend from the rock envelope behind the three work
 // scenes. They share the quarry's mineral direction without wall stickers.
 b+=path('M1520 2830Q2130 2650 2680 2450L3070 2680Q2770 3150 2810 3680Q2830 4140 2560 4700L2360 5480Q2110 5490 1920 4960L1740 3970Q1850 3450 1520 2830Z','#304850');
 b+=path('M2050 2810Q2280 2990 2310 3330Q2210 3850 2280 4280L2190 4910 1970 4510Q2040 4080 1970 3650Q2110 3230 2050 2810Z','#1a323e');
 b+=path('M2940 2670Q3430 2450 3890 2470L4020 2920Q3720 3270 3680 3600L3850 4230Q3690 4840 3550 5320L3200 5550Q3380 5010 3250 4540L2990 3880Q3160 3420 2940 2670Z','#273f47');
 b+=path('M4300 2050Q4670 2360 4860 2590L4820 3120Q4640 3530 4650 3950L4430 4310 4170 3870Q4290 3340 4180 2980Z','#1b323d');
 b+=path('M5980 2480Q6350 2240 6630 2340L6860 2940Q6650 3270 6720 3780L6970 4260Q6740 4790 6840 5410L6600 5890 6330 5500Q6420 4910 6250 4510Q6490 3990 6280 3540L6080 3180Z','#29444b');
 b+=path('M6740 2310Q7200 2470 7500 2800L7830 3110Q7510 3340 7430 3660L7720 4250 7540 4890Q7350 5480 7290 5920L7040 6090Q7180 5570 7020 5030Q7250 4510 7080 4160L6860 3610Q7100 3040 6740 2310Z','#1b3440');
 b+=path('M8240 3080Q8640 3210 8960 3510L9210 4180 9150 4680 8730 4920Q8620 4490 8690 4100L8370 3590Z','#2c4249');
 // Broad tool-height recesses define places of work without closing the
 // open connecting passages or competing with physical foreground edges.
 b+=path('M1370 4080Q1620 3750 1990 3610Q2360 3650 2510 4010L2580 4460 1420 4590Z','#132a34');
 b+=path('M3650 5560Q3920 5430 4290 5520Q4750 5610 4800 5990L4750 6200 3620 6210Z','#112730');
 return makeAsset('rear-cavern','실제 천장과 바닥 사이로 이어지는 작업장 뒤 암벽',b,[-20,1980,11240,4330],{category:'terrain',role:'mountain'});
}

function driveConnection(st,spec){
 const unit=st.units.find(u=>u.id==='act2-hoist');if(!unit)throw Error('Stage 17 hoist control actor missing');
 const ux=unit.x,uy=unit.y,head=uy-173*(205/110),mast=spec.rightSupport.x,guideY=head-232;
 let b='';
 // The actual A-shaped actor is the operating head of this larger machine.
 // Couplings stop behind its original beam; there is no second painted actor.
 b+=path(`M${n(mast-31)} ${n(spec.topY+105)}L${n(mast-32)} ${n(guideY-58)}Q${n(mast-17)} ${n(guideY-14)} ${n(mast+30)} ${n(guideY+2)}L${n(ux+4)} ${n(head+3)}`,'none','#222d2d',18);
 b+=path(`M${n(mast-36)} ${n(spec.topY+105)}L${n(mast-37)} ${n(guideY-58)}Q${n(mast-22)} ${n(guideY-14)} ${n(mast+25)} ${n(guideY+2)}L${n(ux-1)} ${n(head+3)}`,'none','#a18d65',6);
 b+=beam(mast-67,guideY+21,mast+89,guideY+16,47,{dark:true,bands:true});
 b+=wheel(mast+24,guideY,55,{rope:false});
 const axleY=head+74;
 b+=beam(mast+15,axleY+12,ux-7,axleY,31,{dark:true,bands:false});
 b+=poly([[mast+34,axleY-23],[mast+78,axleY-23],[mast+83,axleY+39],[mast+39,axleY+37]],C.iron,C.ink,4);
 b+=ellipse(mast+59,axleY+8,17,22,'#6c7568','#a09f83',4);
 b+=ellipse(ux-6,axleY,29,37,'#2c393c','#a49979',6)+ellipse(ux-6,axleY,10,13,'#a4a88d');
 // A worn bearing shoe is behind the enemy's feet, on its real inclined rock.
 const t=st.terrains.find(t=>t.id==='ws-east-hoist-buttress'),at=x=>surfaceAt(st,t,x),l=ux-153,r=ux+174;
 b+=poly([[l,at(l)-10],[l+35,at(l+35)-29],[r-29,at(r-29)-23],[r,at(r)-5],[r,at(r)+8],[l,at(l)+8]],'#3d4846',C.ink,3);
 b+=line([[l+35,at(l+35)-23],[ux-66,at(ux-66)-22]],'#9a9679',5);
 return makeAsset('control-drive-link','들린 인양틀의 조작축과 큰 인양기 사이 동력 밧줄',b,[mast-120,spec.topY+65,ux-mast+350,uy-spec.topY+60]);
}

function ropeCoil(x,y,s=1){
 let b='';for(const [i,[rx,ry,dx]]of [[82,28,0],[66,22,2],[49,16,-1]].entries())b+=ellipse(x+dx*s,y,rx*s,ry*s,'none',i===1?'#9c865e':'#71684e',7*s);
 b+=path(`M${n(x-76*s)} ${n(y)}Q${n(x-105*s)} ${n(y+26*s)} ${n(x-146*s)} ${n(y+7*s)}Q${n(x-176*s)} ${n(y-7*s)} ${n(x-194*s)} ${n(y+19*s)}`,'none','#9c865e',6*s);return b;
}
function brokenWheel(x,y,s=1){
 let b=path('M-83-38C-96-124-7-160 56-105Q81-82 86-48L64-61Q41-111-7-107Q-68-98-64-43Z','#64543a',C.ink,6);
 b+=path('M-81-63Q-73-139 7-128Q60-117 76-73','none','#a38b60',5);
 b+=beam(-8,-13,-13,-119,16,{bands:false})+beam(-65,-52,46,-92,15,{bands:false})+beam(-66,-29,12,-79,14,{bands:false});
 b+=ellipse(-10,-65,21,21,'#394642','#a89a73',4);
 b+=beam(29,-22,74,-3,18,{bands:false})+path('M70-21L114-36 136-21 121-11 87-12Z','#695940',C.ink,3);
 return group(x,y,s,s,b);
}
function workRemains(st,key,terrainId,x,{lower=false}={}){
 const t=st.terrains.find(t=>t.id===terrainId),y=surfaceAt(st,t,x);let b='';
 // Two broad stone-dust patches collect on the actual uneven supporting rim.
 for(const [dx,wide]of [[-140,190],[130,260]]){const xx=x+dx,sy=surfaceAt(st,t,xx)??y;b+=path(`M${n(xx-wide*.5)} ${n(sy-1)}Q${n(xx-24)} ${n(sy-15)} ${n(xx+wide*.5)} ${n(sy+3)}Q${n(xx+43)} ${n(sy+16)} ${n(xx-wide*.5)} ${n(sy-1)}Z`,'#81918440');}
 const wheelX=x-104,wy=surfaceAt(st,t,wheelX);b+=brokenWheel(wheelX,wy-5,lower?1.02:1.12);
 const coilX=x+149,cy=surfaceAt(st,t,coilX);b+=ropeCoil(coilX,cy-12,lower?.86:1.05);
 if(!lower){
  const xx=x+326,yy=surfaceAt(st,t,xx);b+=poly([[xx-50,yy-2],[xx-66,yy-96],[xx+62,yy-101],[xx+59,yy+1]],'#504936',C.ink,5);
  b+=beam(xx-65,yy-99,xx+65,yy-101,20,{bands:false});
  for(const [dx,dy]of [[-31,-177],[1,-194],[30,-155]])b+=poly([[xx+dx-8,yy-18],[xx+dx-14,yy+dy],[xx+dx+7,yy+dy-8],[xx+dx+6,yy-17]],'#899282',C.ink,3);
  b+=beam(xx-53,yy-44,xx+66,yy-50,15,{bands:false});
 }else{
  const xx=x+330,yy=surfaceAt(st,t,xx);b+=beam(xx-85,yy-4,xx+36,yy-143,20,{bands:false});
  b+=poly([[xx+8,yy-165],[xx+57,yy-181],[xx+76,yy-143],[xx+33,yy-121]],'#657471',C.ink,4);
 }
 return makeAsset(key,lower?'낮은 정비굴의 부서진 철륜과 풀어 둔 밧줄':'서쪽 석공 작업터의 부서진 바퀴와 쐐기 상자',b,[x-360,y-310,800,460],{category:'prop',role:'prop'});
}
function lowVaultShoring(st){
 const roof=st.terrains.find(t=>t.id==='ws-service-vault-tooth'),floor=st.terrains.find(t=>t.id==='act2-floor');
 const xs=[3970,4140,4330,4440],cap=xs.map(x=>[x,bottomAt(roof,x)+14]);let b='';
 // The caps follow the real solid's underside. There is no decorative roof
 // across an open shooting lane, and only two bearing posts reach the floor.
 b+=path('M3850 5600Q4120 5490 4420 5630L4530 5790Q4440 5730 4350 5750L4170 5660 3920 5690Z','#1b333a');
 for(let i=1;i<cap.length;i++)b+=beam(...cap[i-1],...cap[i],49,{dark:true,bands:false});
 for(const x of [3980,4420]){const fy=surfaceAt(st,floor,x),top=bottomAt(roof,x)+20;b+=shoe(x,fy,92)+beam(x,fy-8,x-7,top,54,{dark:true});b+=knot(x,top+43,62);}
 b+=beam(3980,cap[0][1]+178,4110,bottomAt(roof,4110)+30,37,{dark:true,bands:false});
 return makeAsset('low-vault-shoring','실제 낮은 천장면을 받치는 정비굴 갱목',b,[3810,5500,840,720]);
}

function softened(points,bend=.15){
 const out=[];for(let i=0;i<points.length;i++){const p=points[i],a=points[(i+points.length-1)%points.length],z=points[(i+1)%points.length],u=[p[0]+(a[0]-p[0])*bend,p[1]+(a[1]-p[1])*bend],v=[p[0]+(z[0]-p[0])*bend,p[1]+(z[1]-p[1])*bend];out.push(u);for(const f of [.33,.67,1])out.push([(1-f)*(1-f)*u[0]+2*(1-f)*f*p[0]+f*f*v[0],(1-f)*(1-f)*u[1]+2*(1-f)*f*p[1]+f*f*v[1]]);}return out;
}
function stoneTint(hex,amount){const c=hex.slice(1).match(/../g).map(v=>parseInt(v,16)),cool=[31,53,65];return'#'+c.map((v,i)=>Math.round(v*(1-amount)+cool[i]*amount).toString(16).padStart(2,'0')).join('');}

function rockFaces(st){
 const planes=st.design.space.terrainPlanes||(st.design.space.terrainPlanes=[]);
 for(const t of st.terrains){
  if(t.baseMaterial==='wood'||t.breakable||t.id==='gate-repair'||!(t.id.startsWith('ws-')||['act2-floor','cave-roof'].includes(t.id)))continue;
  const p=t.points.map(p=>[p.x,p.y]),box=extents(t),add=(points,fill)=>planes.push({terrainId:t.id,stage17Art:true,fill,points:points.map(p=>p.map(n))});
  const roof=!!t.properties?.honroCeiling;
  add(p,roof?'#293a44':'#354b55');
  if(['act2-floor','cave-roof'].includes(t.id)){
   // One connected stratum follows the actual whole floor/roof profile.
   // Broad unequal beds replace the old necklace of repeated isolated facets.
   const xs=[...new Set(t.points.filter(p=>p.y>-2000&&p.y<st.height+2000).map(p=>p.x))].sort((a,b)=>a-b),sign=roof?-1:1;
   const rim=xs.map(x=>[x,surfaceAt(st,t,x)]);if(rim.some(p=>p[1]===null))continue;
   const depth=x=>roof?520+190*Math.sin(x*.00055)+90*Math.sin(x*.0015):950+250*Math.sin(x*.00044)+190*Math.cos(x*.0011);
   const inner=rim.map(([x,y])=>[x,y+sign*depth(x)]);
   add(softened([...rim,...inner.slice().reverse()],.11),roof?'#354b54':'#4e6567');
   const lower=inner.map(([x,y])=>[x,y+sign*(roof?430:840)]);
   add(softened([...inner,...lower.slice().reverse()],.18),roof?'#293e49':'#2e4957');
   // Three wide sheets have different direction and span. Their lower edges
   // disappear into continuous rock instead of making detached pointy stones.
   const beds=roof?[[.13,.39,.66],[.56,.84,.39]]:[[.02,.35,.76],[.41,.72,.58],[.75,1,.72]];
   for(const [i,[l,r,d]]of beds.entries()){
    const q=xs.filter(x=>x>=l*st.width&&x<=r*st.width);q.unshift(l*st.width);q.push(r*st.width);
    const edge=q.map(x=>[x,surfaceAt(st,t,x)+sign*35]);
    add(softened([...edge,...edge.slice().reverse().map(([x,y],j)=>[x,y+sign*(roof?430:930)*(d+[.12,.24,-.03,.18,.05][j%5])])],.22),roof?'#3b515a':i%2?'#496465':'#586f6b');
   }
   continue;
  }
  const {x,y,w,h}=box,at=(u,v)=>[x+w*u,y+h*v],cool=.22+Math.min(.22,Math.abs(x+w*.5-5500)/15000),q=(ps,fill)=>add(softened(ps.map(p=>at(...p)),.18),stoneTint(fill,cool));
  const style=t.id==='ws-west-machine-plinth'||t.id==='ws-axle-footing'?'plinth':t.id==='ws-east-hoist-buttress'?'east':t.id==='ws-west-work-buttress'?'west':t.id==='ws-east-upper-rock'?'ledge':'small';
  if(style==='plinth'){
   q([[0,0],[.72,0],[.82,.23],[.66,.4],[.27,.37],[.02,.49]],'#798279');
   q([[0,.42],[.24,.33],[.65,.39],[.80,.32],[.99,.43],[.94,.72],[.66,.8],[.32,.67],[.04,.78]],'#5b7270');
   q([[.03,.76],[.31,.63],[.65,.77],[1,.62],[1,1],[0,1]],'#2b444e');
   q([[.66,.01],[1,0],[1,1],[.87,.94],[.74,.65],[.8,.32]],'#3a535a');
   q([[.07,.45],[.30,.35],[.56,.385],[.59,.40],[.3,.38],[.075,.48]],'#263e48');
   q([[.31,.37],[.322,.378],[.344,.63],[.36,.70],[.351,.718],[.33,.655]],'#2c464e');
  }else if(style==='west'){
   q([[0,0],[.46,0],[.41,.21],[.49,.4],[.33,.65],[.16,.87],[.01,.71]],'#758278');
   q([[.46,0],[.75,.01],[.79,.26],[.65,.41],[.76,.61],[.62,.84],[.38,.99],[.16,.87],[.33,.65],[.49,.4],[.41,.21]],'#5b726e');
   q([[.74,0],[1,0],[1,1],[.4,1],[.64,.77],[.76,.61],[.65,.41],[.79,.26]],'#304b54');
   q([[0,.15],[.18,.11],[.28,.19],[.41,.14],[.44,.20],[.29,.255],[.17,.2],[.02,.26]],'#989b83');
   q([[.035,.59],[.16,.43],[.29,.46],[.43,.39],[.46,.43],[.3,.52],[.19,.515],[.06,.68]],'#405c5d');
   q([[.46,.015],[.467,.015],[.421,.213],[.499,.4],[.347,.659],[.217,.807],[.205,.8],[.333,.65],[.48,.40],[.402,.209]],'#243e48');
  }else if(style==='east'){
   q([[0,0],[.31,0],[.39,.2],[.31,.43],[.39,.64],[.29,.84],[.05,.74]],'#6c7e73');
   q([[.31,0],[.71,0],[.75,.24],[.64,.4],[.74,.65],[.60,.82],[.35,.93],[.29,.84],[.39,.64],[.31,.43],[.39,.2]],'#819080');
   q([[.71,0],[1,0],[1,1],[.36,1],[.60,.82],[.74,.65],[.64,.4],[.75,.24]],'#3d5a5c');
   q([[0,.67],[.22,.64],[.43,.75],[.56,.67],[.76,.7],[1,.52],[1,1],[0,1]],'#2b4650');
   q([[.08,.16],[.22,.095],[.27,.16],[.28,.23],[.15,.22],[.08,.26]],'#959c84');
   q([[.44,.4],[.52,.34],[.64,.36],[.61,.405],[.52,.39],[.44,.445]],'#acac8d');
   q([[.709,.02],[.72,.025],[.762,.24],[.653,.414],[.749,.65],[.607,.85],[.594,.842],[.728,.651],[.632,.404],[.74,.233]],'#29444d');
  }else{
   const v=style==='ledge';
   q([[0,0],[v?.61:.47,0],[v?.52:.51,.27],[.62,.42],[.41,.7],[.10,.91],[0,.71]],roof?'#435a60':'#7c8a7d');
   q([[v?.61:.47,0],[1,0],[1,1],[.28,1],[.41,.7],[.62,.42],[v?.52:.51,.27]],roof?'#243d48':'#3b555c');
   q(v?[[.03,.02],[.56,.01],[.50,.15],[.41,.24],[.18,.31],[.06,.25]]:[[0,0],[.42,0],[.43,.17],[.31,.33],[.13,.47],[.01,.33]],roof?'#65726c':'#879783');
  }
 }
}
function placeOn(project,st,asset,key,terrainId,x,scale=1){
 const t=st.terrains.find(t=>t.id===terrainId);if(!t)throw Error(`Stage 17 art ${key} needs ${terrainId}`);
 const y=surfaceAt(st,t,x);if(y===null)throw Error(`Stage 17 art ${key} has no surface at ${x}`);
 return add(project,st,asset,key,x,y,{scale,stage17Support:{terrainId,x,y}});
}

export function applyStage17WorksiteArt(project){
 const st=project.stages.find(s=>s.metadata?.stageId===17);if(!st)throw Error('Stage 17 missing');
 if(!st.terrains.some(t=>t.id==='ws-hoist-service-bridge'))throw Error('Stage 17 worksite art needs the authored three-route terrain');
 st.elements=st.elements.filter(e=>!e.id.startsWith('s17-art-'));
 project.library=project.library.filter(a=>!a.id.startsWith(STAGE17_ART_PREFIX));
 st.design.space.terrainPlanes=(st.design.space.terrainPlanes||[]).filter(p=>!p.stage17Art);
 st.design.space.rockCompositions=[];
 // Bare cavern recesses preserve the central machine silhouette. The generic
 // repeated cliff placements are not additional solid worksite architecture.
 if(st.environment){st.environment.placements=(st.environment.placements||[]).filter(p=>p.assetId!=='env:cliff');}
 // Asset identity remains stable across authoring passes, without touching
 // shared source assets that are still used in other campaign stages.
 rockFaces(st);
 const art=st.design.worksite?.art||{},supports=[];
 add(project,st,rearCavern(st),'rear-cavern');
 add(project,st,lowVaultShoring(st),'low-vault-shoring');
 const flights=art.flights||[
  {key:'west-switchback-frame',name:'서측 작업대를 한 몸으로 잇는 굵은 갱목',terrainIds:st.terrains.filter(t=>/^ws-west-(step-\d|lower-steps|switchback|short-rise)$/.test(t.id)).map(t=>t.id),postXs:[2910,3340,3890]},
  {key:'shaft-service-frame',name:'인양갱의 여섯 작업발판을 지탱하는 연속 기둥',terrainIds:st.terrains.filter(t=>/^ws-shaft-|^ws-hoist-(west-lip|service-bridge)$/.test(t.id)).map(t=>t.id),postXs:[5140,5530,5830]},
  {key:'east-gallery-frame',name:'동쪽 좁은 정비갱을 따라 세운 맞물린 갱목',terrainIds:st.terrains.filter(t=>/^ws-service-east-|^ws-east-(upper-step-\d|high-step|crossing)$/.test(t.id)).map(t=>t.id),postXs:[7910,8150,8310]}
 ];
 const grouped=new Set([...flights.flatMap(f=>f.terrainIds),'ws-west-hoist-deck','ws-east-hoist-deck']);
 for(const [id,key]of [['ws-west-hoist-deck','west-gallery'],['ws-east-hoist-deck','east-gallery']]){const t=st.terrains.find(t=>t.id===id);if(t)add(project,st,upperGallery(st,t,key),key);}
 for(const f of flights){if(!f.terrainIds.length)continue;const q=timberFlight(st,f);add(project,st,q.asset,f.key);supports.push({terrainIds:q.terrainIds,feet:q.feet});}
 for(const [i,t]of st.terrains.filter(t=>t.id.startsWith('ws-')&&t.baseMaterial==='wood'&&!grouped.has(t.id)).entries()){
  const q=timberDeck(st,t,i);if(!q)continue;
  add(project,st,q.asset,'trestle-'+t.id);supports.push({terrainId:t.id,feet:q.feet});
 }
 const hoist={terrainId:'ws-hoist-service-bridge',x:5350,topY:3000,width:1260,leftSupport:{terrainId:'ws-west-machine-plinth',x:4720},rightSupport:{terrainId:'ws-east-hoist-buttress',x:5960},...art.hoist};
 add(project,st,hoistAssembly(st,hoist),'main-hoist');
 add(project,st,driveConnection(st,hoist),'control-drive-link');
 add(project,st,workRemains(st,'west-work-remains','ws-west-work-buttress',2350),'west-work-remains');
 add(project,st,workRemains(st,'lower-service-remains','act2-floor',4720,{lower:true}),'lower-service-remains');
 const props=art.props||[
  {key:'entry-timber-store',asset:'timber',terrainId:'act2-floor',x:1120,scale:1.04},
  {key:'west-tool-bench',asset:'tools',terrainId:'ws-west-work-buttress',x:2030,scale:1.02},
  {key:'axle-tool-bench',asset:'tools-alt',terrainId:'ws-axle-footing',x:8850,scale:1},
  {key:'notes-work-bench',asset:'tools',terrainId:'act2-floor',x:10320,scale:.92},
  {key:'lower-oil-lamp',asset:'lamp',terrainId:'act2-floor',x:4350,scale:1.05},
  {key:'hoist-oil-lamp',asset:'lamp',terrainId:'ws-east-hoist-buttress',x:6580,scale:1.1},
  {key:'axle-oil-lamp',asset:'lamp',terrainId:'ws-hoist-service-bridge',x:5790,scale:.85}
 ];
 const assets={timber:timberStore(),tools:toolBay('tool-bench'),['tools-alt']:toolBay('axle-tool-bench',1),lamp:oilLamp()};
 st.design.space.lights=(st.design.space.lights||[]).filter(l=>!l.stage17Art);
 for(const p of props){if(!assets[p.asset])throw Error('Unknown stage 17 tool composition: '+p.asset);const e=placeOn(project,st,assets[p.asset],p.key,p.terrainId,p.x,p.scale??1);if(p.asset==='lamp')st.design.space.lights.push({id:'s17-light-'+p.key,stage17Art:true,kind:'oil',x:e.x+62*e.scale,y:e.y-185*e.scale,radius:p.key==='axle-oil-lamp'?480:320,color:'#bd9b62'});}
 st.design.worksite.art={...art,flights,hoist,props};
 st.design.worksiteArt={revision:3,nativeVectorOnly:true,hoist,supports,artAssetIds:[...new Set(st.elements.filter(e=>e.id.startsWith('s17-art-')).map(e=>e.assetId))],source:'stage17-local-authored-terrain',budgets:{maxNodesPerAsset:420}};
 return project;
}
