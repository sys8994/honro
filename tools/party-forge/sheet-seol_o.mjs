// v014 Seol-o from the user's 260919 part sheet (2026-11).
// The sheet is a traced vector with a full-body view and eleven rig-ready part
// cells. Each cell's paths are mapped onto the existing rig bones with an exact
// affine transform (control points transformed, so curves stay curves):
//   bone-aligned: proximal->distal joint of the cell maps to the rig's pivot pair;
//   scale is uniform per part (the sheet zooms each cell differently), except the
//   torso, which keeps the rig's narrower shoulder span across the body.
// Rig pivots, pose targets, hand sockets and bowstring constraint are unchanged,
// so every existing animation drives the new drawing.
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
export const SHEET='tools/party-forge/references/260919_설오_parts.svg';

// cell rects in sheet units and the joint anchors read off the sheet
const CELLS={
 head:{rect:[436,0,689,393],a:[568,128],b:[580,276],to:['crown','chin']},
 thorax:{rect:[689,0,962,393],a:[830,72],b:[812,222],to:['neck','thorax'],across:.63},
 front_upper_arm:{rect:[962,0,1199,393],a:[1058,108],b:[1122,305],to:['front_upper_arm','front_forearm']},
 front_forearm:{rect:[1199,0,1448,393],a:[1296,120],b:[1368,300],to:['front_forearm','front_hand'],hand:'front_hand'},
 rear_upper_arm:{rect:[436,393,689,700],a:[592,448],b:[538,660],to:['rear_upper_arm','rear_forearm']},
 rear_forearm:{rect:[689,393,944,700],a:[800,462],b:[890,640],to:['rear_forearm','rear_hand'],hand:'rear_hand'},
 front_thigh:{rect:[944,393,1199,700],a:[1060,440],b:[1050,650],to:['front_thigh','front_shin'],across:.66},
 front_shin:{rect:[1199,393,1448,700],a:[1300,475],b:[1320,688],to:['front_shin','front_sole']},
 rear_thigh:{rect:[436,700,689,1086],a:[585,740],b:[590,965],to:['rear_thigh','rear_shin'],across:.62},
 rear_shin:{rect:[689,700,944,1086],a:[815,790],b:[790,1010],to:['rear_shin','rear_sole']},
 weapon:{rect:[944,700,1199,1086],a:[1172,712],b:[968,1012],to:['bow_top','bow_bottom'],dropStroke:true,mirror:true}
};

const num=/-?\d*\.?\d+(?:e[-+]?\d+)?/gi;
function parse(svg){
 svg=svg.replace(/<metadata>[\s\S]*?<\/metadata>/,'');
 const grads={};for(const m of svg.matchAll(/<linearGradient id="([^"]+)"[\s\S]*?<\/linearGradient>/g)){const stops=[...m[0].matchAll(/stop-color="([^"]+)"/g)].map(s=>s[1]);grads[m[1]]=stops[Math.floor(stops.length/2)]||stops[0];}
 const out=[];for(const m of svg.matchAll(/<path ([^>]*?)\/?>/g)){const fill=/fill="([^"]+)"/.exec(m[1])?.[1],d=/\sd="([^"]+)"/.exec(' '+m[1])?.[1];if(!fill||!d)continue;
  const color=fill.startsWith('url(')?grads[fill.slice(5,-1)]:fill;const n=(d.match(num)||[]).map(Number),xs=n.filter((_,i)=>!(i%2)),ys=n.filter((_,i)=>i%2);
  out.push({color:color.toUpperCase(),d,box:[Math.min(...xs),Math.min(...ys),Math.max(...xs),Math.max(...ys)]});}
 return out;
}
const lum=c=>{const v=parseInt(c.slice(1),16);return ((v>>16)&255)*.2126+((v>>8)&255)*.7152+(v&255)*.0722;};
const isSkin=c=>{const v=parseInt(c.slice(1),16),r=(v>>16)&255,g=(v>>8)&255,b=v&255;return r>170&&r-b>40&&r>g&&g>b&&lum(c)<215;};
// similarity (+ optional across-axis scale) taking a->A, b->B
function solve(a,b,A,B,across,mirror){
 const dx=b[0]-a[0],dy=b[1]-a[1],DX=B[0]-A[0],DY=B[1]-A[1],l=Math.hypot(dx,dy),L=Math.hypot(DX,DY),s=L/l;
 const ux=dx/l,uy=dy/l,UX=DX/L,UY=DY/L,c=(across??s)*(mirror?-1:1);
 return ([x,y])=>{const px=x-a[0],py=y-a[1],t=px*ux+py*uy,n=-px*uy+py*ux;return [A[0]+UX*t*s-UY*n*c,A[1]+UY*t*s+UX*n*c];};
}
const fmt=v=>String(Math.round(v*100)/100);
function mapD(d,f){let i=0,x=0;return d.replace(num,v=>{if(i++%2===0){x=+v;return '\u0000';}const [X,Y]=f([x,+v]);return fmt(X)+' '+fmt(Y);}).replace(/\u0000 ?/g,'');}

export function sheetSeolO(a){
 if(a.character_id!=='seol_o')return;
 const src=parse(readFileSync(path.join(root,SHEET),'utf8'));
 const pv=Object.fromEntries(a.rig.parts.map(p=>[p.id,p.pivot]));
 const T={...pv,crown:a.face.anatomy.crown,chin:a.face.anatomy.chin,thorax:pv.pelvis,front_sole:[pv.front_foot[0],479],rear_sole:[pv.rear_foot[0],479],
  bow_top:a.constraints.bowstring.tips[0],bow_bottom:a.constraints.bowstring.tips[1]};
 const palette={},key=c=>{let k=Object.keys(palette).find(k=>palette[k]===c);if(!k){k='s'+Object.keys(palette).length;palette[k]=c;}return k;};
 const paths=[];
 for(const [part,cell] of Object.entries(CELLS)){
  const [x0,y0,x1,y1]=cell.rect,f=solve(cell.a,cell.b,T[cell.to[0]],T[cell.to[1]],cell.across,cell.mirror);
  let n=0;
  for(const p of src){
   const [bx0,by0,bx1,by1]=p.box,cx=(bx0+bx1)/2,cy=(by0+by1)/2;
   if(cx<x0||cx>x1||cy<y0||cy>y1)continue;
   if(bx1-bx0>(x1-x0)*.98||by1-by0>(y1-y0)*.98)continue;            // background / grid
   if(lum(p.color)>238)continue;                                     // paper
   if(bx1<x0+50&&by1<y0+52)continue;                                 // cell number
   if(cell.dropStroke&&Math.min(bx1-bx0,by1-by0)>60&&lum(p.color)<60&&(bx1-bx0)*(by1-by0)>20000&&p.d.length<900)continue; // sheet bowstring (rig draws its own)
   const target=cell.hand&&isSkin(p.color)&&cy>cell.b[1]-6?cell.hand:part;
   paths.push({id:`${part}_${n++}`,part:target,d:mapD(p.d,f),fill:key(p.color),detail:0});
  }
 }
 a.paths=paths;a.palette={...palette,ink:'#2B2A28',hemp:'#C9BBA4',skin:'#D9AE8C',skinLight:'#E2BFA2',skinShade:'#B98E70'};
 a.constraints.bowstring.color='ink';a.constraints.arrow.color='hemp';
 a.face.shapeIds=paths.filter(p=>p.part==='head').map(p=>p.id);
 a.artRevision=14;a.sheetSource=SHEET;
}
