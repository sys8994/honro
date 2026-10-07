/** Original editable Korean-town vectors, informed by official heritage photographs.
 * A low everyday house, a broad public hall and a gate pavilion are different
 * building types. Roof bounds/solids come from the same sampled silhouette.
 * See game/docs/ACT3_KOREAN_TOWN.md for references and the intentional fantasy scope.
 */
import {compileSVG} from './build-act2-art.mjs';
const d=points=>'M'+points.map(p=>p.join(' ')).join(' L')+' Z';
const poly=(points,fill)=>`<path fill="${fill}" d="${d(points)}"/>`;
const path=(fill,p)=>`<path fill="${fill}" d="${p}"/>`;
const box=(x,y,w,h)=>`M${x} ${y}h${w}v${h}h${-w}Z`;
const rect=(x,y,w,h,fill)=>path(fill,box(x,y,w,h));
const strokes=(paths,color,width=2)=>paths.length?`<path fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" d="${paths.join(' ')}"/>`:'';
const group=(id,parts)=>`<g id="${id}">${parts.join('')}</g>`;
const gradient=(id,y1,y2,top,bottom)=>`<linearGradient id="${id}" x1="0" y1="${y1}" x2="0" y2="${y2}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/></linearGradient>`;
const q=(start,control,end,n=7)=>Array.from({length:n},(_,i)=>{const t=(i+1)/n,u=1-t;return[+(u*u*start[0]+2*u*t*control[0]+t*t*end[0]).toFixed(3),+(u*u*start[1]+2*u*t*control[1]+t*t*end[1]).toFixed(3)];});
function yAt(points,x){for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i];if(x>=a[0]&&x<=b[0])return a[1]+(b[1]-a[1])*(x-a[0])/Math.max(.0001,b[0]-a[0]);}return points.at(-1)[1];}
function roof(w,eave,rise,kind,weathered=false){
 const l=-w/2,r=w/2,top=eave-rise,parts=[],thatch=kind==='thatch',rh=w*(kind==='gable'?.43:.27);
 let edge;
 if(thatch){edge=[[l-30,eave+1],...q([l-30,eave+1],[l-43,top+40],[l+w*.29,top+8]),...q([l+w*.29,top+8],[0,top-7],[r-w*.24,top+8]),...q([r-w*.24,top+8],[r+39,top+42],[r+31,eave+2])];}
 else {const shoulder=kind==='gable'?rh+14:w/2-62;edge=[[l-37,eave-9],...q([l-37,eave-9],[l+6,eave+3],[-shoulder,eave-33]),[-rh,top+12],[rh,top+12],[shoulder,eave-33],...q([shoulder,eave-33],[r-6,eave+3],[r+37,eave-9])];}
 const end=edge.at(-1),start=edge[0],bottom=[...q(end,[0,eave+thatch*12+26],[start[0],eave+8],12)];
 const solid=[...edge,...bottom],fill=thatch?'url(#straw)':'url(#tile)';
 parts.push(poly(solid,fill));
 if(thatch){
  parts.push(path('#6c6043',`M${l-27} ${eave-3}Q0 ${eave+18} ${r+28} ${eave-3}L${r+25} ${eave+9}Q0 ${eave+27} ${l-24} ${eave+8}Z`));
  parts.push(path('#b4a479',`M${l+15} ${top+43}Q${l+87} ${top+13} 0 ${top+16}Q${r-88} ${top+10} ${r-8} ${top+43}Q0 ${top+25} ${l+15} ${top+43}Z`));
  parts.push(strokes([-w*.27,0,w*.27].map(x=>`M${x*.63} ${top+15}Q${x*.89} ${top+44} ${x} ${eave+7}`),'#7a7556',3));
  parts.push(strokes([`M${l+5} ${eave-15}Q0 ${eave+2} ${r-2} ${eave-14}`],'#8c855f',3));
 }else{
  parts.push(path('#1f3235',`M${l-33} ${eave-2}Q0 ${eave+18} ${r+34} ${eave-3}L${r+31} ${eave+9}Q0 ${eave+28} ${l-30} ${eave+9}Z`));
  const tiles=[],ends=[];for(let x=l+24;x<r-15;x+=Math.max(18,w/24)){const y=yAt(edge,x)+7,b=eave+8+7*(1-(x/r)**2);tiles.push(`M${x} ${y}Q${x*1.035} ${(y+b)/2} ${x*1.055} ${b}`);ends.push(`M${x*1.055-2} ${b+1}h4`);}
  parts.push(strokes(tiles,weathered?'#67776b':'#65736d',2.7),strokes(ends,'#849087',3));
  parts.push(path('#9b9c88',`M${-rh-10} ${top-2}Q0 ${top+8} ${rh+10} ${top-2}L${rh+7} ${top+8}Q0 ${top+15} ${-rh-7} ${top+8}Z`));
  if(kind==='hip')parts.push(strokes([`M${-rh} ${top+12}Q${l+80} ${eave-45} ${l+26} ${eave+1}`,`M${rh} ${top+12}Q${r-80} ${eave-45} ${r-26} ${eave+1}`],'#7c897e',4));
 }
 return{svg:group('korean-'+kind+'-roof',parts),solid,top:top-6,bottom:eave+27};
}
function paperDoor(x,y,w,h,{wood=false,shut=false}={}){
 const parts=[rect(x,y,w,h,'#423e2f'),rect(x+5,y+5,w-10,h-10,wood?'#796345':'#c2b793'),rect(x+5,y+5,w-10,8,'#857e5e')],lines=[];
 if(wood){parts.push(rect(x+w*.49,y+5,5,h-10,'#4b4833'),rect(x+8,y+h*.29,w-16,6,'#a38c61'),rect(x+8,y+h*.78,w-16,6,'#a38c61'));}
 else{for(let i=1;i<4;i++)lines.push(`M${x+w*i/4} ${y+7}v${h-14}`);lines.push(`M${x+7} ${y+h*.42}h${w-14}`,`M${x+7} ${y+h*.74}h${w-14}`);parts.push(strokes(lines,'#706b4e',2.3));}
 parts.push(rect(x+w-9,y+8,4,h-15,'#484532'));
 if(shut)parts.push(rect(x+w*.44,y+h*.6,4,9,'#c1b28b'),rect(x+w*.55,y+h*.6,4,9,'#c1b28b'));
 return parts.join('');
}
function jars(x,y){return group('onggi-at-courtyard-edge',[
 path('#5d4b38',`M${x-15} ${y}Q${x-30} ${y-25} ${x-18} ${y-43}L${x-15} ${y-49}H${x+12}L${x+15} ${y-42}Q${x+27} ${y-18} ${x+12} ${y}Z`),
 rect(x-18,y-52,34,6,'#8a785c'),path('#827359',`M${x-16} ${y-35}Q${x-22} ${y-18} ${x-11} ${y-6}L${x-7} ${y-9}Q${x-13} ${y-24} ${x-9} ${y-36}Z`),
 path('#756043',`M${x+25} ${y}Q${x+15} ${y-19} ${x+25} ${y-31}H${x+47}Q${x+58} ${y-15} ${x+47} ${y}Z`),rect(x+23,y-35,28,5,'#9c8862')]);}
export function koreanTownBuilding(id,{width=420,role='house',roofType=null,variant=0,burnt=false,collision=true}={}){
 const w=width,l=-w/2,r=w/2,isPublic=['office','archive','pavilion'].includes(role),store=role==='storehouse',shop=role==='shop';
 const h=role==='pavilion'?205:role==='office'?230:role==='archive'?235:store?195:shop?177:158;
 const rise=role==='office'?138:role==='archive'?136:store?108:shop?94:83;
 const kind=roofType||(isPublic?'hip':store?'gable':variant%3===0?'thatch':'gable'),roofArt=roof(w,-h,rise,kind,variant%2===1);
 const bays=role==='pavilion'?3:Math.max(3,Math.min(isPublic?7:5,Math.round(w/(isPublic?142:125)))),bay=w/bays,publicWood=burnt?'#514738':isPublic?'#76503c':'#68513a';
 const parts=['<defs>'+gradient('tile',-h-rise,-h,burnt?'#626860':'#68776e','#293b3d')+gradient('straw',-h-rise,-h,burnt?'#8d8260':'#aa9a72',burnt?'#534e3b':'#7e7351')+gradient('plaster',-h,0,burnt?'#928975':'#b9ac89',burnt?'#666950':'#938d6c')+'</defs>'];
 parts.push(group('low-stone-foundation',[poly([[l-12,-9],[l+21,-18],[r-15,-16],[r+12,-5],[r+15,0],[l-15,0]],'#727c68'),path('#aaa68c',`M${l-10}-9L${l+21}-18H${r-15}L${r+10}-5H${l-12}Z`)]));
 if(role!=='pavilion')parts.push(rect(l,-h+15,w,h-29,'url(#plaster)'),rect(l+6,-h+21,w-12,19,'#655e43'));
 // Each bay is a room/maru/boarded store opening, not a repeated curtain wall.
 for(let i=0;i<bays;i++){
  const x=l+i*bay+13,bw=bay-26,maru=role==='pavilion'||(!store&&i===Math.floor(bays/2));
  if(maru){parts.push(rect(x,-h+40,bw,h-55,'#35483c'),rect(x+7,-22,bw-14,8,'#a58d61'));if(role==='pavilion')parts.push(rect(x,-58,bw,7,'#8d7751'),rect(x+7,-51,5,29,'#796448'),rect(x+bw-12,-51,5,29,'#796448'));}
  else if(store){parts.push(paperDoor(x+3,-h+47,bw-6,h-60,{wood:true,shut:true}));}
  else {const wh=shop?87:88,wy=-h+50;parts.push(paperDoor(x+6,wy,bw-12,wh,{wood:(i+variant)%4===0}));parts.push(rect(x+5,wy+wh+5,bw-10,10,publicWood));}
 }
 const columns=[],light=[],stones=[];
 for(let i=0;i<=bays;i++){const x=l+i*bay-7,cw=isPublic?19:14;columns.push(`M${x} ${-h+18}h${cw}L${x+cw+2}-16H${x-2}Z`);light.push(box(x+2,-h+27,4,h-50));stones.push(`M${x-5}-17h${cw+11}l2 17H${x-8}Z`);}
 parts.push(path(publicWood,columns.join(' ')),path(isPublic?'#a17b52':'#9a8059',light.join(' ')),path('#858976',stones.join(' ')),rect(l-9,-h+16,w+18,12,publicWood));
 if(isPublic)parts.push(rect(l-6,-h+27,w+12,7,'#416353'),rect(l+10,-h+35,w-20,5,'#293f34'));
 if(shop){const ax=variant%2===0?l+20:l+w*.53,aw=Math.min(w*.43,205);parts.push(poly([[ax+10,-142],[ax+aw-7,-142],[ax+aw+15,-107],[ax-10,-107]],variant%2?'#8f8461':'#927c53'),rect(ax-9,-108,aw+23,8,'#b1a078'),rect(ax+3,-100,6,91,publicWood),rect(ax+aw-3,-100,6,91,publicWood),rect(ax+13,-48,aw-22,10,'#8c7249'));}
 if(role==='house'&&variant%2===0)parts.push(jars(r-47,-2));
 if(store&&variant%2===1)parts.push(rect(l+26,-55,55,43,'#8c7650'),rect(l+22,-61,65,8,'#b59c6b'),rect(l+62,-53,7,41,'#4f5037'));
 if(burnt)parts.push(path('#3f4939',`M${l+9} ${-h+27}L${l+51} ${-h+38}L${l+w*.29} -14H${l+13}Z`));
 parts.push(roofArt.svg);
 const bounds={x:l-48,y:roofArt.top-3,w:w+96,h:-roofArt.top+8};
 const vector=compileSVG(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${bounds.x} ${bounds.y} ${bounds.w} ${bounds.h}"><title>Korean ${role}: low ${kind} roof and ${bays} structural bays</title>${parts.join('')}</svg>`);
 return{id,name:{house:'낮은 민가',shop:'장터 가게',office:'관아 대청',archive:'목판문 서고',storehouse:'널문 창고',pavilion:'단층 수문 누각'}[role],category:'architecture',visual:[],vector,collision:collision?[roofArt.solid.map(([x,y])=>({x,y}))]:[],anchor:{x:0,y:0},sockets:[],tags:['act3-production','korean-town'],params:{style:role,koreanType:role,roofType:kind,eaveHeight:h,bayCount:bays,collisionSource:'sampled-drawn-roof'},material:'wood',breakable:false,oneWay:false,bounds,reference:{heightM:bounds.h/60,bounds,foot:{x:0,y:0},scaleRange:[.7,1.4],backgroundRange:[.7,1.2]}};
}
export function koreanCourtyardWall(id,{width=420,height=92,cap='earth',gate=false}={}){
 const w=width,l=-w/2,r=w/2,body=cap==='tile'?'#a49675':'#827c59',parts=[path(body,`M${l} -${height}L${r} -${height-3}V0H${l}Z`),path('#6b735b',`M${l} -27L${l+71} -39L${l+127} -28L${l+202} -33L${r} -25V0H${l}Z`)];
 const rock=[],tops=[],dark=[];for(let row=0;row<3;row++){const count=6+(row%2),cell=w/count,base=-height+14+row*(height-17)/3,rh=(height-23)/3;for(let i=0;i<count;i++){const x=l+i*cell+2,ww=cell-5,y=base+(i%3-1)*3;rock.push(`M${x} ${y+5}L${x+ww*.24} ${y}L${x+ww-4} ${y+3}L${x+ww} ${y+rh-3}L${x+ww*.72} ${y+rh}L${x+3} ${y+rh-2}Z`);tops.push(`M${x+4} ${y+6}L${x+ww*.24} ${y+3}L${x+ww-7} ${y+6}V${y+9}Z`);if((i+row)%3===0)dark.push(`M${x+7} ${y+11}H${x+ww-4}L${x+ww-7} ${y+rh-2}H${x+4}Z`);}}
 parts.push(path('#93917a',rock.join(' ')),path('#afa58a',tops.join(' ')),path('#707a63',dark.join(' ')));
 if(cap==='tile')parts.push(path('#344749',`M${l-8} -${height+5}L${l+9} -${height+20}H${r-7}L${r+9} -${height+4}L${r+4} -${height-3}H${l-5}Z`),strokes([`M${l-3} -${height+2}H${r+4}`],'#879386',3));
 else parts.push(path('#b1a27b',`M${l-5} -${height}L${l+18} -${height+9}L${r-16} -${height+7}L${r+5} -${height-2}Z`));
 if(gate)parts.push(rect(-51,-127,102,127,'#4b4b35'),paperDoor(-46,-122,92,119,{wood:true,shut:true}),rect(-58,-135,116,12,'#786047'));
 const b={x:l-12,y:-Math.max(height+23,gate?139:0),w:w+24,h:Math.max(height+23,gate?139:0)+3},vector=compileSVG(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${b.x} ${b.y} ${b.w} ${b.h}"><title>Korean courtyard wall and gate, rear scenery</title>${parts.join('')}</svg>`);
 return{id,name:'골목의 낮은 돌담과 대문',category:'architecture',visual:[],vector,collision:[],anchor:{x:0,y:0},sockets:[],tags:['act3-rear-city','korean-courtyard'],params:{rearOnly:true},material:'stone',breakable:false,oneWay:false,bounds:b,reference:{heightM:b.h/60,bounds:b,foot:{x:0,y:0},scaleRange:[.7,1.4],backgroundRange:[.7,1.2]}};
}

export function koreanTownEnvironment(project,stage,{ground=2700,night=false,context='town'}={}){
 const clone=x=>JSON.parse(JSON.stringify(x)),old=clone(stage.environment),env={...old,groups:[],surfaces:[],placements:[]};
 const mix=(color,to,t)=>{const a=color.slice(1).match(/../g).map(v=>parseInt(v,16)),b=to.slice(1).match(/../g).map(v=>parseInt(v,16));return '#'+a.map((v,i)=>Math.round(v+(b[i]-v)*t).toString(16).padStart(2,'0')).join('');};
 const put=a=>{const i=project.library.findIndex(b=>b.id===a.id);if(i>=0)project.library[i]=a;else project.library.push(a);};
 for(const [depth,y,scale,step,shift] of [['L3',ground-125,.84,695,120],['L2',ground-22,.94,865,420]]){
  const id=`a3-korean-town-${stage.metadata.stageId}-${depth}`,tint=night?'#455b5c':'#7e8c7b',weight=depth==='L3'?.67:.42;
  env.groups.push({id,depthLayer:depth,verticalMode:'WORLD',zoneId:env.zones[0].id,x:0,y});env.surfaces.push({id:id+'-ground',groupId:id,kind:'rear-ground',points:[{x:-18000,y:0},{x:stage.width+18000,y:0}],bottom:18000});
  const bankId=id+'-bank',bankBounds={x:0,y:0,w:3000,h:1400},bankSvg=rect(0,0,3000,1400,mix('#6c7155',tint,.67));put({id:bankId,name:'마을의 이어진 흙바닥',category:'architecture',visual:[],vector:compileSVG(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 3000 1400">${bankSvg}</svg>`),collision:[],anchor:{x:0,y:0},sockets:[],tags:['act3-rear-ground'],params:{rearOnly:true},bounds:bankBounds,reference:{bounds:bankBounds,foot:{x:0,y:0},heightM:1400/60,scaleRange:[1,1],backgroundRange:[1,1]}});
  for(let x=-18000,n=0;x<stage.width+18000;x+=3000,n++)env.placements.push({id:id+'-bank-'+n,assetId:bankId,depthLayer:depth,groupId:id,supportId:id+'-ground',x,y:0,scale:1,rotation:0});
  const roles={garden:['house','office','house','house','storehouse'],archive:['archive','storehouse','office','archive'],foundry:['storehouse','shop','storehouse','house','shop'],rampart:['office','house','storehouse','office'],ferry:['storehouse','shop','house','storehouse','house'],town:['house','house','shop','house','storehouse','house','office']}[context]||['house','house','shop','office'];
  for(let x=-2200,i=0;x<stage.width+2400;x+=step,i++){
   const role=roles[(i+stage.metadata.stageId)%roles.length],width=role==='office'?670:role==='storehouse'?530:330+(i%3)*55,roofType=role==='house'?(i%3===2?'gable':'thatch'):role==='office'?'hip':'gable';
   const a=koreanTownBuilding(id+'-house-'+i,{width,role,roofType,variant:i,collision:false,burnt:context==='foundry'&&i%3!==1});a.vector=compileSVG(a.vector.source.replace(/#[0-9a-f]{6}/gi,c=>mix(c,tint,weight)));a.tags=['act3-rear-city','korean-town'];put(a);
   env.placements.push({id:a.id,assetId:a.id,depthLayer:depth,groupId:id,supportId:id+'-ground',x:x+shift+(i%3-1)*63,y:0,scale,rotation:0});
   if(i%3!==1){const wall=koreanCourtyardWall(id+'-wall-'+i,{width:width*.76,height:role==='office'?104:80,cap:role==='office'?'tile':'earth',gate:i%2===0});wall.vector=compileSVG(wall.vector.source.replace(/#[0-9a-f]{6}/gi,c=>mix(c,tint,Math.max(0,weight-.08))));put(wall);env.placements.push({id:wall.id,assetId:wall.id,depthLayer:depth,groupId:id,supportId:id+'-ground',x:x+shift-64+(i%3-1)*63,y:0,scale,rotation:0});}
  }
 }
 stage.environment=env;
 return env;
}

export function koreanArchiveCabinet(id,{width=280,height=285,variant=0}={}){
 const w=width,h=height,parts=[rect(0,0,w,h,'#544633'),rect(10,10,w-20,h-20,'#293e34')],shelfY=[Math.round(h*.34),Math.round(h*.67),h-10];
 for(const [row,base] of shelfY.entries()){
  const left=18+(row%2)*7,right=w-20,space=right-left,top=row===0?17:shelfY[row-1]+13,hh=base-top-10;
  if(row===2&&variant%2===0){parts.push(rect(left,top+4,space,hh-4,'#857148'),rect(left-3,top,space+6,9,'#ae9968'),rect(left+space*.52,top+7,6,hh-7,'#514e34'),rect(left+space*.44,top+hh*.45,11,16,'#b8aa7c'));}
  else for(let j=0;j<2;j++){
   const bw=space*.43,x=left+j*space*.53,th=Math.min(17,Math.max(10,(hh-4)/3)),papers=[],covers=[],ties=[],labels=[];
   for(let book=0;book<3;book++){
    const bx=x+[1,-3,4][book],by=base-(3-book)*(th+3)+2,ww=bw-[2,0,7][book];
    papers.push(box(bx+3,by+4,ww-6,th-6));
    covers.push(`M${bx-1} ${by+1}L${bx+ww-4} ${by-1}L${bx+ww+2} ${by+3}H${bx-1}Z`,box(bx,by+th-2,ww,3));
    ties.push(box(bx+ww*(book===1?.23:.16),by+2,4,th-1));
    if(book===2)labels.push(box(bx+ww*.61,by+5,ww*.22,4));
   }
   parts.push(path('#c8ba91',papers.join(' ')),path((j+row+variant)%2?'#546e63':'#7b6948',covers.join(' ')),path('#4f6148',ties.join(' ')),path('#e1cfa2',labels.join(' ')));
  }
  parts.push(rect(7,base,w-14,10,'#9e8758'),rect(9,base+7,w-18,4,'#4a4932'));
 }
 parts.push(rect(0,0,12,h,'#947d50'),rect(w-12,0,12,h,'#67533a'),rect(0,0,w,11,'#b69c66'));
 const bounds={x:0,y:0,w,h},vector=compileSVG(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}"><title>Horizontal bound records and wooden archival chests</title>${parts.join('')}</svg>`);
 return{id,name:'포갑과 목궤를 둔 서가',category:'architecture',visual:[],vector,collision:[],anchor:{x:0,y:0},sockets:[],tags:['act3-production','korean-archive'],params:{rearOnly:true,storage:'horizontal-bound-books-and-chests'},material:'wood',breakable:false,oneWay:false,bounds,reference:{heightM:h/60,bounds,foot:{x:w/2,y:h},scaleRange:[.7,1.5],backgroundRange:[.7,1.2]}};
}
