// v014 Seol-o from the user's 260919 part sheet (2026-11).
// Method (art authority = the sheet's full-body figure, not the old rig):
//  1. Every cell is placed in full-figure space. Head and torso use a masked
//     colour-template registration (scale x rotation search, see
//     _local/reports/party-sheet/reg.py); limbs, whose flat colours do not
//     register reliably, use their joint pair in the cell -> the same joints on
//     the full figure (uniform similarity, so each part keeps its own shape).
//  2. One uniform map takes full-figure space to game space (crown->sole height,
//     sole on the ground line), so proportions are the sheet's.
//  3. The rig is rebuilt from the full figure's joints; every animation keyframe
//     is retargeted (bone directions kept, new bone lengths, contact feet on the
//     ground).
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
export const SHEET='tools/party-forge/references/260919_설오_parts.svg';

// Joints on the full-body figure (sheet units). Viewer-left limbs = rig "rear".
const J={crown:[215,95],chin:[230,218],neck:[208,240],pelvis:[195,432],
 rearShoulder:[108,292],rearElbow:[70,445],rearHand:[60,585],
 frontShoulder:[272,284],frontElbow:[300,442],frontHand:[355,565],
 rearHip:[150,480],rearKnee:[110,808],rearAnkle:[98,938],
 frontHip:[240,480],frontKnee:[298,818],frontAnkle:[305,945],
 sole:[200,1012],bowTop:[412,312]};
// cell -> full-figure placement
const REG={head:{a:[[.81,0],[0,.81]],t:[-252.03,-6.28]},thorax:{a:[[1.3398,.0234],[-.0234,1.3398]],t:[-945.3,151.58]}};
const CELLS={
 head:{rect:[436,0,689,393]},
 thorax:{rect:[689,0,962,393]},
 front_upper_arm:{rect:[962,0,1199,393],cell:[[1062,120],[1120,296]],full:['frontShoulder','frontElbow']},
 front_forearm:{rect:[1199,0,1448,393],cell:[[1290,200],[1365,300]],full:['frontElbow','frontHand'],hand:'front_hand'},
 rear_upper_arm:{rect:[436,393,689,700],cell:[[590,465],[545,642]],full:['rearShoulder','rearElbow']},
 rear_forearm:{rect:[689,393,944,700],cell:[[805,505],[850,625]],full:['rearElbow','rearHand'],hand:'rear_hand'},
 rear_thigh:{rect:[944,393,1199,700],cell:[[1060,440],[1042,668]],full:['rearHip','rearKnee']},
 front_shin:{rect:[1199,393,1448,700],cell:[[1300,545],[1355,688]],full:[[296,830],[330,1010]]},
 front_thigh:{rect:[436,700,689,1086],cell:[[585,740],[590,972]],full:['frontHip','frontKnee']},
 rear_shin:{rect:[689,700,944,1086],cell:[[815,850],[765,1012]],full:[[110,830],[95,1015]]},
 weapon:{rect:[944,700,1199,1086],cell:[[1133,852],[1172,712]],full:['frontHand','bowTop'],dropString:true,tipBottom:[968,1012]}
};
const num=/-?\d*\.?\d+(?:e[-+]?\d+)?/gi;
function parse(svg){
 svg=svg.replace(/<metadata>[\s\S]*?<\/metadata>/,'');
 const grads={};for(const m of svg.matchAll(/<linearGradient id="([^"]+)"[\s\S]*?<\/linearGradient>/g)){const st=[...m[0].matchAll(/stop-color="([^"]+)"/g)].map(s=>s[1]);grads[m[1]]=st[Math.floor(st.length/2)]||st[0];}
 const out=[];for(const m of svg.matchAll(/<path ([^>]*?)\/?>/g)){const fill=/fill="([^"]+)"/.exec(m[1])?.[1],d=/\sd="([^"]+)"/.exec(' '+m[1])?.[1];if(!fill||!d)continue;
  const color=fill.startsWith('url(')?grads[fill.slice(5,-1)]:fill,n=(d.match(num)||[]).map(Number),xs=n.filter((_,i)=>!(i%2)),ys=n.filter((_,i)=>i%2);
  out.push({color:color.toUpperCase(),d,box:[Math.min(...xs),Math.min(...ys),Math.max(...xs),Math.max(...ys)]});}
 return out;
}
const lum=c=>{const v=parseInt(c.slice(1),16);return ((v>>16)&255)*.2126+((v>>8)&255)*.7152+(v&255)*.0722;};
const isSkin=c=>{const v=parseInt(c.slice(1),16),r=(v>>16)&255,g=(v>>8)&255,b=v&255;return r>170&&r-b>40&&r>g&&g>b&&lum(c)<215;};
const sim=(a,b,A,B)=>{const dx=b[0]-a[0],dy=b[1]-a[1],DX=B[0]-A[0],DY=B[1]-A[1],l2=dx*dx+dy*dy,c=(dx*DX+dy*DY)/l2,s=(dx*DY-dy*DX)/l2;
 return p=>{const x=p[0]-a[0],y=p[1]-a[1];return [A[0]+c*x-s*y,A[1]+s*x+c*y];};};
const fmt=v=>String(Math.round(v*100)/100);
const mapD=(d,f)=>{let i=0,x=0;return d.replace(num,v=>{if(i++%2===0){x=+v;return '\u0000';}const [X,Y]=f([x,+v]);return fmt(X)+' '+fmt(Y);}).replace(/\u0000 ?/g,'');};
const sub=(a,b)=>[a[0]-b[0],a[1]-b[1]],add=(a,b)=>[a[0]+b[0],a[1]+b[1]],mul=(a,k)=>[a[0]*k,a[1]*k],len=a=>Math.hypot(a[0],a[1]);

export function sheetSeolO(a){
 if(a.character_id!=='seol_o')return;
 const SOLE=479,K=(SOLE-a.face.anatomy.crown[1])/(J.sole[1]-J.crown[1]),CX=240;
 const G=p=>[CX+(p[0]-J.pelvis[0])*K,SOLE-(J.sole[1]-p[1])*K];
 // ---- rebuild the rig from the full figure
 const by=Object.fromEntries(a.rig.parts.map(p=>[p.id,p])),old=Object.fromEntries(a.rig.parts.map(p=>[p.id,[...p.pivot]]));
 const set={pelvis:G(J.pelvis),thorax:G(J.pelvis),neck:G(J.neck),head:G([(J.neck[0]+J.chin[0])/2,(J.neck[1]+J.chin[1])/2]),
  rear_upper_arm:G(J.rearShoulder),rear_forearm:G(J.rearElbow),rear_hand:G(J.rearHand),front_upper_arm:G(J.frontShoulder),front_forearm:G(J.frontElbow),front_hand:G(J.frontHand),
  rear_thigh:G(J.rearHip),rear_shin:G(J.rearKnee),rear_foot:G(J.rearAnkle),front_thigh:G(J.frontHip),front_shin:G(J.frontKnee),front_foot:G(J.frontAnkle)};
 for(const [id,p]of Object.entries(set))by[id].pivot=p;
 for(const p of a.rig.parts)if(!(p.id in set)&&p.parent){const d=sub(by[p.parent].pivot,old[p.parent]);p.pivot=add(old[p.id],d);}
 const oldBT=a.rig.bindThorax,f=(oldBT[1]-old.pelvis[1])/(old.neck[1]-old.pelvis[1]);a.rig.bindThorax=add(set.pelvis,mul(sub(set.neck,set.pelvis),f));
 const sockDelta=s=>sub(by[s+'_hand'].pivot,old[s+'_hand']);
 for(const s of ['front','rear'])a.rig.handSockets[s]=add(a.rig.handSockets[s],sockDelta(s));
 by.weapon.pivot=[...a.rig.handSockets.front];
 const wd=sub(by.weapon.pivot,old.weapon);
 const bs=a.constraints.bowstring,bow=CELLS.weapon,oldTop=sub(bs.tips[0],old.weapon),bowLen=len(sub(J.bowTop,J.frontHand))*K;
 const gTop=add(by.weapon.pivot,mul(oldTop,bowLen/len(oldTop)));bow.game=sim(bow.cell[0],bow.cell[1],by.weapon.pivot,gTop);
 bs.tips=[gTop,bow.game(bow.tipBottom)];bs.restNock=mul(add(bs.tips[0],bs.tips[1]),.5);bs.drawPoint=[...a.rig.handSockets.rear];
 a.constraints.arrow.grip=[...by.weapon.pivot];if(a.constraints.bowFlex)a.constraints.bowFlex.pivot=[...by.weapon.pivot];
 a.face.anatomy={...a.face.anatomy,crown:G(J.crown),chin:G(J.chin)};
 // ---- retarget every pose-target keyframe
 const bone=(p,c)=>len(sub(set[c],set[p]))/len(sub(old[c],old[p]));
 const ratio={rearArmU:bone('rear_upper_arm','rear_forearm'),rearArm:(bone('rear_upper_arm','rear_forearm')+bone('rear_forearm','rear_hand'))/2,
  frontArmU:bone('front_upper_arm','front_forearm'),frontArm:(bone('front_upper_arm','front_forearm')+bone('front_forearm','front_hand'))/2,
  rearLegU:bone('rear_thigh','rear_shin'),rearLeg:(bone('rear_thigh','rear_shin')+bone('rear_shin','rear_foot'))/2,
  frontLegU:bone('front_thigh','front_shin'),frontLeg:(bone('front_thigh','front_shin')+bone('front_shin','front_foot'))/2};
 const oldTorso=sub(old.neck,old.pelvis),newTorso=sub(set.neck,set.pelvis),tk=len(newTorso)/len(oldTorso);
 for(const anim of Object.values(a.animation.animations))for(const k of anim.keyframes){
  if(!k.pelvis)continue;
  const P0=k.pelvis,P=add(set.pelvis,sub(P0,old.pelvis));
  const T=add(P,mul(sub(k.thorax,P0),tk*len(oldTorso)/len(sub(old.neck,old.pelvis))));
  // torso frame rotation of this key relative to bind
  const ang=Math.atan2(...sub(k.thorax,P0).reverse())-Math.atan2(...sub(a.rig.bindThorax.map((v,i)=>v),set.pelvis).reverse())+0;
  const rotOld=Math.atan2(k.thorax[1]-P0[1],k.thorax[0]-P0[0])-Math.atan2(oldBT[1]-old.pelvis[1],oldBT[0]-old.pelvis[0]);
  const R=v=>[v[0]*Math.cos(rotOld)-v[1]*Math.sin(rotOld),v[0]*Math.sin(rotOld)+v[1]*Math.cos(rotOld)];
  const out={pelvis:P,thorax:add(P,mul(sub(k.thorax,P0),len(sub(a.rig.bindThorax,set.pelvis))/len(sub(oldBT,old.pelvis))))};
  for(const s of ['rear','front']){
   const sh=s+'Shoulder',hp=s+'Hip',shPart=s+'_upper_arm',hpPart=s+'_thigh';
   const shOld0=add(P0,R(sub(old[shPart],old.pelvis))),shNew=add(add(P,R(sub(set[shPart],set.pelvis))),sub(k[sh],shOld0));
   const hpOld0=add(P0,R(sub(old[hpPart],old.pelvis))),hpNew=add(add(P,R(sub(set[hpPart],set.pelvis))),sub(k[hp],hpOld0));
   out[sh]=shNew;out[hp]=hpNew;
   out[s+'Elbow']=add(shNew,mul(sub(k[s+'Elbow'],k[sh]),ratio[s+'ArmU']));
   out[s+'Hand']=add(shNew,mul(sub(k[s+'Hand'],k[sh]),ratio[s+'Arm']));
   out[s+'Knee']=add(hpNew,mul(sub(k[s+'Knee'],k[hp]),ratio[s+'LegU']));
   out[s+'Foot']=add(hpNew,mul(sub(k[s+'Foot'],k[hp]),ratio[s+'Leg']));
  }
  // contact feet stay on the ground line: shift the whole pose vertically
  const contacts=(k.contacts||[]).filter(c=>out[c+'Foot']);
  if(contacts.length){const dy=contacts.reduce((m,c)=>m+(set[c+'_foot'][1]-out[c+'Foot'][1]),0)/contacts.length;for(const v of Object.values(out))v[1]+=dy;for(const c of contacts)out[c+'Foot']=add(set[c+'_foot'],sub(k[c+'Foot'],old[c+'_foot']));}
  // keep every IK chain reachable: planted feet stay, the body settles; hands pull in
  const L=(u,l,t)=>len(sub(set[l],set[u]))+len(sub(set[t],set[l]))-.02;
  for(let it=0;it<4;it++)for(const s of ['rear','front']){const hp=out[s+'Hip'],ft=out[s+'Foot'],d=len(sub(ft,hp)),m=L(s+'_thigh',s+'_shin',s+'_foot');
   if(d>m){const drop=d-m+.01;for(const key of ['pelvis','thorax','rearShoulder','frontShoulder','rearHip','frontHip','rearElbow','frontElbow','rearHand','frontHand','rearKnee','frontKnee'])out[key]=[out[key][0],out[key][1]+drop];}}
  for(const s of ['rear','front']){const sh=out[s+'Shoulder'],v=sub(out[s+'Hand'],sh),d=len(v),m=L(s+'_upper_arm',s+'_forearm',s+'_hand');if(d>m)out[s+'Hand']=add(sh,mul(v,m/d));}
  Object.assign(k,out);
 }
 // ---- place the art: cell -> full figure -> game, assigned to the rebuilt parts
 const src=parse(readFileSync(path.join(root,SHEET),'utf8')),palette={},key=c=>{let k=Object.keys(palette).find(k=>palette[k]===c);if(!k){k='s'+Object.keys(palette).length;palette[k]=c;}return k;};
 const paths=[];
 for(const [part,cell] of Object.entries(CELLS)){
  const [x0,y0,x1,y1]=cell.rect;
  const toFull=REG[part]?(p=>[REG[part].a[0][0]*p[0]+REG[part].a[0][1]*p[1]+REG[part].t[0],REG[part].a[1][0]*p[0]+REG[part].a[1][1]*p[1]+REG[part].t[1]])
   :sim(cell.cell[0],cell.cell[1],...cell.full.map(j=>typeof j==='string'?J[j]:j));
  const f=cell.game||(p=>G(toFull(p)));let n=0;
  for(const p of src){
   const [bx0,by0,bx1,by1]=p.box,cx=(bx0+bx1)/2,cy=(by0+by1)/2;
   if(cx<x0||cx>x1||cy<y0||cy>y1||bx1-bx0>(x1-x0)*.98||by1-by0>(y1-y0)*.98||lum(p.color)>238||(bx1<x0+50&&by1<y0+52))continue;
   if(cell.dropString&&lum(p.color)<60&&(bx1-bx0)>100&&(by1-by0)>100&&p.d.length<1200)continue;
   const target=cell.hand&&isSkin(p.color)&&cy>cell.cell[1][1]-25?cell.hand:part;
   paths.push({id:`${part}_${n++}`,part:target,d:mapD(p.d,f),fill:key(p.color),detail:0});
  }
 }
 a.paths=paths;a.palette={...palette,ink:'#2B2A28',hemp:'#C9BBA4',skin:'#D9AE8C',skinLight:'#E2BFA2',skinShade:'#B98E70'};
 a.constraints.bowstring.color='ink';a.constraints.arrow.color='hemp';
 a.face.shapeIds=paths.filter(p=>p.part==='head').map(p=>p.id);
 a.artRevision=14;a.sheetSource=SHEET;a.sheetScale=K;
}
