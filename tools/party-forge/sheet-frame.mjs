// v015 companions as whole-frame sprites (2026-11).
// A cutout rig rotating parts of a single-pose illustration twists the body
// (v014 rejected). Instead each sheet's full-body figure is used intact as one
// frame: every path sits on the rig root, so nothing is rotated or stretched.
// Uniform scale: the figure's painted top/bottom map to the previous asset's
// painted top/bottom (same on-screen height, sole on the ground line); feet
// centre on the root. Pose changes need per-pose drawings swapped as frames;
// until those exist every state shows this frame.
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
export const SHEETS={
 seol_o:{file:'tools/party-forge/references/260919_설오_parts.svg',maxX:436},
 damheo:{file:'tools/party-forge/references/260919_담허_parts.svg',maxX:405},
 hwigyeom:{file:'tools/party-forge/references/260919_휘겸_parts.svg',maxX:395},
 sodan:{file:'tools/party-forge/references/260919_소단_parts.svg',maxX:415}
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
const fmt=v=>String(Math.round(v*100)/100);
const mapD=(d,f)=>{let i=0,x=0;return d.replace(num,v=>{if(i++%2===0){x=+v;return '\u0000';}const [X,Y]=f([x,+v]);return fmt(X)+' '+fmt(Y);}).replace(/\u0000 ?/g,'');};
const bounds=ps=>ps.reduce((b,p)=>[Math.min(b[0],p.box[0]),Math.min(b[1],p.box[1]),Math.max(b[2],p.box[2]),Math.max(b[3],p.box[3])],[1e9,1e9,-1e9,-1e9]);

export function sheetFrame(a,previousBounds){
 const cfg=SHEETS[a.character_id];if(!cfg)return;
 const all=parse(readFileSync(path.join(root,cfg.file),'utf8')),W=Math.max(...all.map(p=>p.box[2])),H=Math.max(...all.map(p=>p.box[3]));
 const fig=all.filter(p=>{const [x0,y0,x1,y1]=p.box,mx=(x0+x1)/2;return mx<cfg.maxX&&x1-x0<W*.5&&y1-y0<H*.95&&lum(p.color)<238&&y0>4;});
 const [fx0,fy0,fx1,fy1]=bounds(fig),feet=bounds(fig.filter(p=>p.box[3]>fy1-(fy1-fy0)*.08));
 const [,top,,bottom]=previousBounds,K=(bottom-top)/(fy1-fy0),cx=a.rig.parts.find(p=>p.id==='root').pivot[0],footX=(feet[0]+feet[2])/2;
 const G=([x,y])=>[cx+(x-footX)*K,bottom-(fy1-y)*K];
 const palette={},key=c=>{let k=Object.keys(palette).find(k=>palette[k]===c);if(!k){k='s'+Object.keys(palette).length;palette[k]=c;}return k;};
 a.paths=fig.map((p,n)=>({id:'figure_'+n,part:'root',d:mapD(p.d,G),fill:key(p.color),detail:0}));
 a.palette={...a.palette,...palette};
 if(a.constraints?.bowstring){a.palette.none='#00000000';Object.assign(a.constraints.bowstring,{color:'none',width:.01});Object.assign(a.constraints.arrow,{color:'none',width:.01});}
 a.face.shapeIds=[];a.artRevision=15;a.sheetSource=cfg.file;a.frameMode={frames:{default:'figure'},scale:K};
}
