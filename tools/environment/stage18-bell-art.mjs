import {readFileSync} from 'node:fs';
import {compileSVG} from './build-act2-art.mjs';

// Original stage-local vectors. Reference for the rounded body, nine bosses,
// dragon crown and sound pipe: https://encykorea.aks.ac.kr/Article/E0027239
// The official photograph informs form; no photograph is embedded or traced.
export const STAGE18_ART_PREFIX='stage18:bell-';
const round=v=>Math.round(v*100)/100;
const path=(d,fill,stroke='',width=1,id='')=>`<path${id?` id="${id}"`:''} d="${d}" fill="${fill}"${stroke?` stroke="${stroke}" stroke-width="${width}" stroke-linejoin="round" stroke-linecap="round"`:''}/>`;
const poly=(p,fill,stroke='',width=1,id='')=>path('M'+p.map(q=>q.map(round).join(' ')).join('L')+'Z',fill,stroke,width,id);
const nodes=q=>1+(q.children||[]).reduce((a,z)=>a+nodes(z),0);
function asset(key,name,source,{role='architecture',category='architecture',extra={}}={}){
 const vector=compileSVG(source),[x,y,w,h]=vector.viewBox,count=nodes(vector.root);if(count>240)throw Error(`Stage 18 art path budget exceeded: ${key}`);
 return{id:STAGE18_ART_PREFIX+key,name,category,environmentRole:role,visual:[],vector,collision:[],anchor:{x:0,y:0},sockets:[],tags:['stage18-bell','visual-only','editable-native-vector'],params:{artRevision:3,collisionSource:'authored-stage-terrain',nodeCount:count,...extra},bounds:{x,y,w,h},reference:{heightM:h/60,bounds:{x,y,w,h},foot:{x:0,y:0},scaleRange:[.35,4],backgroundRange:[.35,4]}};
}
const svg=(body,bounds)=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${bounds.map(round).join(' ')}">${body}</svg>`;
const source=name=>readFileSync(new URL('../../shared/assets/environment/'+name,import.meta.url),'utf8');
export function createStage18HollowBell(){return asset('hollow-body','묵종: 둥근 청동 외피와 깊고 넓은 아랫입',source('stage18-hollow-bell.svg'),{extra:{koreanType:'beomjong-yongnyu-sound-pipe',monumental:true,continuousShell:true,view:'below-the-lip',localLipY:0,descentDistance:200,soundWindow:{localTop:-610,localBottom:-320,shellOpening:[[1016.372549,-610],[1308.969697,-610],[1444,-320],[1056.078431,-320]],interiorReveal:'M620-590Q620-610 660-610H1308.969697L1444-320H670Q620-320 620-360Z',overlays:['cast-sound-window-frame','single-east-cast-bearing-ear']}}});}
export function createStage18BellCavern(){return asset('rear-cavern','묵종 뒤의 깊은 공동과 비대칭 암벽',source('stage18-bell-rear-cavern.svg'),{role:'mountain',category:'terrain',extra:{rearOnly:true,collisionSource:'none'}});}
function surface(st,t,x){const es=t.properties?.honroWalkEdges||st.design.space.surfaces.find(s=>s.terrainId===t.id)?.edgeIndices||[];for(const i of es){const a=t.points[i],z=t.points[(i+1)%t.points.length];if(Math.abs(z.x-a.x)>.01&&x>=Math.min(a.x,z.x)-.001&&x<=Math.max(a.x,z.x)+.001)return a.y+(z.y-a.y)*(x-a.x)/(z.x-a.x);}throw Error(`Stage 18 art support ${t.id} misses ${x}`);}
function add(project,st,a,id,x=0,y=0,{layer='back',...extra}={}){const index=project.library.findIndex(v=>v.id===a.id);if(index<0)project.library.push(a);else project.library[index]=a;const e={id,assetId:a.id,x,y,scale:1,rotation:0,snap:false,depthLayer:'L1',layer,...extra};st.elements.push(e);return e;}
function saddleRear(st){const floor=st.terrains.find(t=>t.id==='act2-floor');let b='';
 for(const[id,dir]of [['sb-west-resting-saddle',-1],['sb-east-resting-saddle',1]]){const t=st.terrains.find(t=>t.id===id),xs=t.points.map(p=>p.x),x0=Math.min(...xs),x1=Math.max(...xs),x=(x0+x1)/2,top=Math.min(...t.points.map(p=>p.y)),ground=surface(st,floor,x),far=x+dir*390;
  // A receding rear-wall corbel, with a soft low-contrast value. It is behind
  // the front walking plane, not a counterfeit solid crossing the escape.
  b+=path(`M${x0} ${top+100}Q${x0-65} ${top-60} ${far} ${top-120}L${far+dir*220} ${ground+90}L${x-dir*60} ${ground+55}Q${x+dir*120} ${top+530} ${x1} ${top+135}Z`,'#29434c');
  b+=path(`M${x0+30} ${top+195}L${x1-30} ${top+215}Q${x+dir*110} ${top+480} ${x-dir*30} ${ground+45}L${far+dir*35} ${ground+42}Q${far-dir*70} ${top+490} ${x0+30} ${top+195}Z`,'#36505a');
 }
 return asset('rear-stone-corbels','전방 귀환길 뒤로 물러난 암벽 받침',svg(b,[4900,6540,4780,1200]),{category:'terrain',role:'rock',extra:{rearOnly:true,collisionSource:'none'}});
}
function cavernRockRoots(st){const floor=st.terrains.find(t=>t.id==='act2-floor'),roof=st.terrains.find(t=>t.id==='cave-roof');let b='';
 const boundary=(t,x,lower=false)=>{const hits=[];for(let i=0;i<t.points.length;i++){const a=t.points[i],z=t.points[(i+1)%t.points.length];if(Math.abs(z.x-a.x)>.01&&x>=Math.min(a.x,z.x)&&x<=Math.max(a.x,z.x))hits.push(a.y+(z.y-a.y)*(x-a.x)/(z.x-a.x));}return lower?Math.max(...hits):Math.min(...hits);};
 const roots=[['sb-west-crown-mass','ceiling'],['sb-west-middle-mass','floor'],['sb-maintenance-buttress-mass','floor'],['sb-east-resonance-mass','ceiling'],['sb-return-cave-buttress','floor'],['sb-east-keeper-mass','floor']];
 for(const[id,kind]of roots){const t=st.terrains.find(t=>t.id===id);if(!t)continue;const ps=t.points,x=Math.min(...ps.map(p=>p.x)),y=Math.min(...ps.map(p=>p.y)),w=Math.max(...ps.map(p=>p.x))-x,h=Math.max(...ps.map(p=>p.y))-y;
  if(kind==='ceiling'){const top=boundary(roof,x+w*.5,true)-65;b+=path(`M${x+w*.02} ${top}Q${x+w*.33} ${top-100} ${x+w*.76} ${top+20}L${x+w*.98} ${y+h*.29}Q${x+w*.78} ${y+h*.58} ${x+w*.5} ${y+h*.61}Q${x+w*.21} ${y+h*.19} ${x+w*.04} ${y+h*.33}Q${x+w*.19} ${y-180} ${x+w*.02} ${top}Z`,'#233b46');b+=path(`M${x+w*.14} ${top+20}Q${x+w*.33} ${top+140} ${x+w*.41} ${y-130}Q${x+w*.38} ${y+h*.24} ${x+w*.68} ${y+h*.41}L${x+w*.82} ${y+h*.26}Q${x+w*.62} ${y-100} ${x+w*.53} ${top+2}Z`,'#2d454e');}
  else{const bottom=surface(st,floor,x+w*.5)+100,left=/return-cave/.test(id)?.11:.03,right=/return-cave/.test(id)?.84:1.03;
   b+=path(`M${x+w*.14} ${y+h*.3}Q${x+w*.04} ${y+h*.69} ${x+w*.24} ${y+h*.94}Q${x+w*.23} ${bottom-410} ${x+w*left} ${bottom}L${x+w*right} ${bottom}Q${x+w*.69} ${bottom-370} ${x+w*.86} ${y+h*.8}L${x+w*.9} ${y+h*.17}Z`,'#1c3541');
   b+=path(`M${x+w*.27} ${y+h*.47}Q${x+w*.4} ${y+h*.89} ${x+w*.39} ${bottom-580}Q${x+w*.23} ${bottom-280} ${x+w*.29} ${bottom}L${x+w*.66} ${bottom}Q${x+w*.51} ${bottom-270} ${x+w*.64} ${bottom-650}L${x+w*.67} ${y+h*.58}Z`,'#29434b');
  }
 }
 return asset('rear-rock-roots','실제 돌마당 뒤에서 공동의 천장과 바닥에 이어지는 암맥',svg(b,[900,750,12600,7550]),{category:'terrain',role:'mountain',extra:{rearOnly:true,collisionSource:'none'}});
}
function lampAsset(){let b=path('M-92 0L-74-28L-48-42H50L80-25L95 0Z','#435c61','#243d46',6)+path('M-48-40L-35-173H34L48-40Z','#6f8075','#2c4851',6)+path('M-33-166H-10L-12-49H-44Z','#9ba58d')+path('M-58-188L-46-226H44L58-188L44-170H-44Z','#718779','#334f55',6)+path('M-43-231L-37-312H35L43-231Z','#3a5559','#233e46',7)+path('M-22-294H21V-244H-22Z','#c1aa75')+path('M-7-288H8V-251H-7Z','#e6d296')+path('M-82-312Q-52-306-24-345H25Q54-307 82-313L67-290H-67Z','#5d7670','#253e46',6)+path('M-69-312Q-44-312-24-338H24Q46-313 69-314','none','#a3ae97',6)+path('M-14-348Q-9-373 0-375Q13-369 14-348Z','#677c6a');return asset('low-stone-lamp','종의 어둠 아래 낮은 석등',svg(b,[-105,-390,210,403]));}
function stonePlanes(st){const out=st.design.space.terrainPlanes;for(const t of st.terrains){if(t.baseMaterial==='wood'||t.breakable||t.properties?.honroBellBody||t.id.includes('resting-saddle'))continue;const ps=t.points.map(p=>[p.x,p.y]),xs=ps.map(p=>p[0]),ys=ps.map(p=>p[1]),x=Math.min(...xs),y=Math.min(...ys),w=Math.max(...xs)-x,h=Math.max(...ys)-y,ceiling=t.properties?.honroCeiling;
  const put=(points,fill)=>out.push({stage18Art:true,terrainId:t.id,fill,points:points.map(p=>p.map(round))});
  if(t.id==='act2-floor'||t.id==='cave-roof'){
   // A single ink wash follows the real canyon profile. It never turns the
   // enormous domain into a pair of visibly triangular colour panels.
   put(ps,ceiling?'#1e303e':'#2a4350');
   const sample=[...new Set(xs)].sort((a,z)=>a-z),at=xx=>{const hits=[];for(let i=0;i<ps.length;i++){const a=ps[i],z=ps[(i+1)%ps.length];if(Math.abs(z[0]-a[0])>.01&&xx>=Math.min(a[0],z[0])-.01&&xx<=Math.max(a[0],z[0])+.01)hits.push(a[1]+(z[1]-a[1])*(xx-a[0])/(z[0]-a[0]));}return ceiling?Math.max(...hits):Math.min(...hits);},rim=sample.map(xx=>[xx,at(xx)]),direction=ceiling?-1:1;
   put([...rim,...rim.slice().reverse().map(([xx,yy])=>[xx,yy+direction*(630+155*Math.sin(xx*.00054+.8))])],ceiling?'#2b414c':'#465f65');
   put([...rim.map(([xx,yy])=>[xx,yy+direction*(440+112*Math.sin(xx*.00054+.8))]),...rim.slice().reverse().map(([xx,yy])=>[xx,yy+direction*(1010+205*Math.sin(xx*.00048))])],ceiling?'#253a47':'#344f5c');
   continue;
  }
  put(ps,ceiling?'#243843':'#3c555d');if(w<200||h<100)continue;
  put([[x,y],[x+w*.58,y],[x+w*.51,y+h*.14],[x+w*.45,y+h*.32],[x+w*.29,y+h*.58],[x+w*.27,y+h*.7],[x,y+h*.59]],ceiling?'#354b54':'#657a77');
  put([[x+w*.64,y+h*.13],[x+w,y],[x+w,y+h],[x+w*.49,y+h],[x+w*.54,y+h*.72],[x+w*.56,y+h*.61]],'#203b48');
 }
}
export function applyStage18BellArt(project){
 const stages=project.stages.filter(s=>[18,19].includes(s.metadata?.stageId)&&s.design?.bell?.version===1);if(stages.length!==2)throw Error('Stage 18 bell art requires authored 18 and 19 geography');
 project.library=project.library.filter(a=>!a.id.startsWith(STAGE18_ART_PREFIX));const bell=createStage18HollowBell(),rear=createStage18BellCavern(),lamp=lampAsset();
 for(const st of stages){const spec=st.design.bell.art;if(!spec?.bell)throw Error('Missing authored bell art anchors');st.elements=st.elements.filter(e=>!e.id.startsWith('sb-art-')&&e.id!=='sb-bell-body'&&e.assetId!=='act2:bell');st.design.space.terrainPlanes=(st.design.space.terrainPlanes||[]).filter(p=>!p.stage18Art);st.design.space.rockCompositions=[];
  // The new canonical back scene replaces legacy generic cave props only here.
  if(st.environment)st.environment.placements=(st.environment.placements||[]).filter(e=>!['env:cliff','env:rock'].includes(e.assetId));
  stonePlanes(st);add(project,st,rear,'sb-art-rear-cavern');add(project,st,cavernRockRoots(st),'sb-art-rear-rock-roots');add(project,st,saddleRear(st),'sb-art-rear-corbels');
  const body=add(project,st,bell,'sb-bell-body',spec.bell.x,spec.bell.y,{layer:'mid',stage18Bell:{terrainIds:[...spec.bell.terrainIds],lipY:spec.bell.y,sourceRevision:3}});
  // Resting saddles use the exact clipped terrain material pass. A separate
  // rectangular decorative cap would obscure their new sloped stone profile.
  st.design.space.lights=(st.design.space.lights||[]).filter(p=>!p.stage18Art);for(const s of spec.lamps||[]){const t=st.terrains.find(t=>t.id===s.terrainId);if(!t)throw Error('Missing bell lamp support '+s.terrainId);const y=surface(st,t,s.x);add(project,st,lamp,'sb-art-lamp-'+s.key,s.x,y,{scale:.82,stage18Support:{terrainId:t.id,x:s.x,y}});st.design.space.lights.push({id:'sb-art-light-'+s.key,stage18Art:true,kind:'oil',x:s.x,y:y-219,radius:330,color:'#c5ac7b'});}
  st.design.bellArt={revision:3,nativeVectorOnly:true,source:'stage18-local-authored-terrain',bodyElementId:body.id,lipY:body.y,visualTopY:body.y-4320,artAssetIds:[...new Set(st.elements.filter(e=>e.id==='sb-bell-body'||e.id.startsWith('sb-art-')).map(e=>e.assetId))],budgets:{maxNodesPerAsset:240},reference:'https://encykorea.aks.ac.kr/Article/E0027239'};
 }
 return project;
}
