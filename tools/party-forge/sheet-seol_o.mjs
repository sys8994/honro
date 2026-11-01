// v015 Seol-o as whole-frame sprites (2026-11).
// A cutout rig rotating parts of a single-pose illustration twists the body
// (v014 rejected). Instead the sheet's full-body figure is used intact as one
// frame: every path sits on the rig root, so no part is rotated or stretched.
// Pose changes are meant to swap whole frames (idle / walk / draw / hit / jump
// drawings at the same scale); until those exist, every state shows this frame.
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
export const SHEET='tools/party-forge/references/260919_설오_parts.svg';
const FIGURE=[0,0,436,1086],CROWN=95,SOLE=1012,CENTER_X=200;
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
const fmt=v=>String(Math.round(v*100)/100);
const mapD=(d,f)=>{let i=0,x=0;return d.replace(num,v=>{if(i++%2===0){x=+v;return '\u0000';}const [X,Y]=f([x,+v]);return fmt(X)+' '+fmt(Y);}).replace(/\u0000 ?/g,'');};

export function sheetSeolO(a){
 if(a.character_id!=='seol_o')return;
 const sole=479,K=(sole-a.face.anatomy.crown[1])/(SOLE-CROWN),cx=a.rig.parts.find(p=>p.id==='root').pivot[0];
 const G=([x,y])=>[cx+(x-CENTER_X)*K,sole-(SOLE-y)*K];
 const palette={},key=c=>{let k=Object.keys(palette).find(k=>palette[k]===c);if(!k){k='s'+Object.keys(palette).length;palette[k]=c;}return k;};
 const [x0,y0,x1,y1]=FIGURE,paths=[];let n=0;
 for(const p of parse(readFileSync(path.join(root,SHEET),'utf8'))){
  const [bx0,by0,bx1,by1]=p.box,mx=(bx0+bx1)/2,my=(by0+by1)/2;
  if(mx<x0||mx>x1||my<y0||my>y1||bx1-bx0>(x1-x0)*.95||by1-by0>(y1-y0)*.95||lum(p.color)>238)continue;
  paths.push({id:'figure_'+n++,part:'root',d:mapD(p.d,G),fill:key(p.color),detail:0});
 }
 a.paths=paths;a.palette={...palette,ink:'#2B2A28',hemp:'#C9BBA4',none:'#00000000'};
 // the figure already holds its bow and string; the rig's drawn string/arrow stay hidden
 a.constraints.bowstring.color='none';a.constraints.bowstring.width=0;a.constraints.arrow.color='none';a.constraints.arrow.width=0;
 a.face.shapeIds=[];a.artRevision=15;a.sheetSource=SHEET;a.frameMode={frames:{default:'figure'},scale:K};
}
