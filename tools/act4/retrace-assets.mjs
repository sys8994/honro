/** Act 4 terrain art: order-of-magnitude node reduction as build-time path replacements.
 *
 * The raw art in shared/data/act4/world.json is never edited. For each asset id,
 * every group of fill leaves is rendered in its own local coordinates (no clips),
 * re-traced by tools/act5/retrace-vector.py (group mode) and written back as
 * [leafPath,'d'|'dParts',value] rows of shared/data/terrain-path-optimization.json,
 * which the build applies after checking the raw vector hash. Clips, groups,
 * transforms, fills, ids, placement and collision stay as they are.
 *
 * Previously published provider signatures stay resolvable for saves:
 * act4.previous (raw) and act4.previousOptimized (list) -> act4.current, which
 * must be filled from the built library after the first build (--current).
 *
 * usage:
 *   node tools/act4/retrace-assets.mjs --stage 40 --ids a,b --published sigs.json [--work DIR]
 *   node tools/act4/retrace-assets.mjs --set-current current.json
 */
import fs from 'node:fs';import path from 'node:path';import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';import{createCanvas,Path2D}from'@napi-rs/canvas';
const root=path.resolve(path.dirname(new URL(import.meta.url).pathname),'../..');
const OPT=path.join(root,'shared/data/terrain-path-optimization.json');
const arg=k=>{const i=process.argv.indexOf('--'+k);return i>0?process.argv[i+1]:undefined;};
const writeOpt=entries=>fs.writeFileSync(OPT,'[\n'+entries.map(e=>JSON.stringify(e)).join(',\n')+'\n]');
const readOpt=()=>JSON.parse(fs.readFileSync(OPT,'utf8'));

if(arg('set-current')){
 const cur=JSON.parse(fs.readFileSync(arg('set-current'),'utf8')),entries=readOpt();let n=0;
 for(const e of entries)if(e.act4&&cur[e.id]&&e.retrace){e.act4.current=cur[e.id];n++;}
 writeOpt(entries);console.log('current set',n);process.exit(0);
}

const stage=+arg('stage'),ids=arg('ids').split(','),published=JSON.parse(fs.readFileSync(arg('published'),'utf8'));
const work=arg('work')||fs.mkdtempSync('/tmp/act4-retrace-');
const world=JSON.parse(fs.readFileSync(path.join(root,'shared/data/act4/world.json'),'utf8'));
const entries=readOpt(),byId=new Map(entries.map(e=>[e.id,e]));
const sha=t=>createHash('sha256').update(t).digest('hex');
const NUM=/-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/gi;
// Absolute bounds (end and control points) of SVG path data, relative commands included.
const TOK=/[MLHVCSQTAZmlhvcsqtaz]|-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/gi,NA={M:2,L:2,H:1,V:1,C:6,S:4,Q:4,T:2,A:7,Z:0};
function bbox(ds){let x0=1/0,y0=1/0,x1=-1/0,y1=-1/0;const add=(x,y)=>{x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);};
 for(const d of ds){let cmd='M',buf=[],cx=0,cy=0,sx=0,sy=0;for(const t of d.match(TOK)||[]){if(/^[a-z]$/i.test(t)){cmd=t;buf=[];if(t==='Z'||t==='z'){cx=sx;cy=sy;}continue;}
  buf.push(+t);const U=cmd.toUpperCase(),n=NA[U],rel=cmd!==U;if(!n||buf.length<n)continue;
  if(U==='H'){cx=rel?cx+buf[0]:buf[0];add(cx,cy);}else if(U==='V'){cy=rel?cy+buf[0]:buf[0];add(cx,cy);}
  else if(U==='A'){cx=rel?cx+buf[5]:buf[5];cy=rel?cy+buf[6]:buf[6];add(cx-buf[0],cy-buf[1]);add(cx+buf[0],cy+buf[1]);}
  else{for(let i=0;i<n;i+=2)add(rel?cx+buf[i]:buf[i],rel?cy+buf[i+1]:buf[i+1]);cx=rel?cx+buf[n-2]:buf[n-2];cy=rel?cy+buf[n-1]:buf[n-1];}
  if(U==='M'){sx=cx;sy=cy;cmd=rel?'l':'L';}buf=[];}}
 return{x0,y0,x1,y1};}
// Matrix [a,b,c,d,e,f] (scale+translate only in this art). M maps node-local -> asset root space.
const mul=(m,t)=>t?[m[0]*t[0]+m[2]*t[1],m[1]*t[0]+m[3]*t[1],m[0]*t[2]+m[2]*t[3],m[1]*t[2]+m[3]*t[3],m[0]*t[4]+m[2]*t[5]+m[4],m[1]*t[4]+m[3]*t[5]+m[5]]:m;
const apply=(m,b)=>{const P=[[b.x0,b.y0],[b.x1,b.y0],[b.x0,b.y1],[b.x1,b.y1]].map(([x,y])=>[m[0]*x+m[2]*y+m[4],m[1]*x+m[3]*y+m[5]]);const xs=P.map(p=>p[0]),ys=P.map(p=>p[1]);return{x0:Math.min(...xs),x1:Math.max(...xs),y0:Math.min(...ys),y1:Math.max(...ys)};};
const inv=m=>{const det=m[0]*m[3]-m[1]*m[2];const a=m[3]/det,b=-m[1]/det,c=-m[2]/det,d=m[0]/det;return[a,b,c,d,-(a*m[4]+c*m[5]),-(b*m[4]+d*m[5])];};
const meet=(a,b)=>a?{x0:Math.max(a.x0,b.x0),y0:Math.max(a.y0,b.y0),x1:Math.min(a.x1,b.x1),y1:Math.min(a.y1,b.y1)}:b;
const symUses={};
function groups(node,trail,out,M=[1,0,0,1,0,0],win=null,clips={},chain=[]){if(node&&typeof node==='object'){M=mul(M,node.transform);
 if(node.clipPath)chain=[...chain,{name:node.clipPath,M}];
 if(node.tag==='use'&&node.symbol){(symUses[node.symbol]??=[]).push({M,win,chain});return out;}
 if(node.clipPath&&clips[node.clipPath])win=meet(win,apply(M,bbox(clips[node.clipPath])));
 const ch=node.children||[];const leaves=ch.map((c,i)=>[c,i]).filter(([c])=>c.tag==='path');
 if(leaves.length)out.push({trail,M,win,chain,leaves:leaves.map(([c,i])=>({node:c,trail:[...trail,'children',i]}))});
 ch.forEach((c,i)=>groups(c,[...trail,'children',i],out,M,win,clips,chain));}return out;}
const leafD=n=>n.d??(n.dParts||[]).join('');
const chunk=(d,lim=59000)=>{const subs=d.match(/M[^M]*/g)||[];const out=[];let cur='';for(const s of subs){if(s.length>lim)return null;if(cur&&cur.length+s.length>lim){out.push(cur);cur='';}cur+=s;}if(cur)out.push(cur);return out;};
const report=[];
// World units per asset unit, from the stage element placing it (Act 4 elements use scale 1).
const st=world.stages.find(x=>x.metadata?.stageId===stage),worldScale=Object.fromEntries((st?.elements||[]).map(e=>[e.assetId,e.scale??1]));
for(const id of ids){
 const raw=world.library.find(a=>a.id===id);if(!raw?.vector)throw Error('missing raw '+id);
 const original=sha(JSON.stringify(raw.vector)),paths=[];let before=0,after=0;
 const clipWins={};const clipMap=Object.fromEntries(Object.entries(raw.vector.clips||{}).map(([k,v])=>[k,[].concat(v)]));
 for(const k of Object.keys(symUses))delete symUses[k];
 const allGroups=groups(raw.vector.root,['root'],[],[1,0,0,1,0,0],null,clipMap);
 // Symbols: each use contributes its own visible window; the symbol is traced once over their union.
 for(const [name,uses] of Object.entries(symUses)){const sym=raw.vector.symbols?.[name];if(!sym)continue;
  let local=null;for(const u of uses){let lw=u.win?apply(inv(u.M),u.win):null;if(sym.clipPath&&clipMap[sym.clipPath]){const cb=bbox(clipMap[sym.clipPath]);lw=lw?meet(lw,cb):cb;}
   if(!lw){local=null;break;}local=local?{x0:Math.min(local.x0,lw.x0),y0:Math.min(local.y0,lw.y0),x1:Math.max(local.x1,lw.x1),y1:Math.max(local.y1,lw.y1)}:lw;}
  const sg=groups(sym,['symbols',name],[],[1,0,0,1,0,0],null,{});
  for(const g of sg){g.M=uses[0].M;g.win=local?apply(uses[0].M,local):null;g.symbolScale=true;g.chain=[];allGroups.push(g);}
  for(const u of uses){const w=u.win&&sym.clipPath&&clipMap[sym.clipPath]?meet(u.win,apply(u.M,bbox(clipMap[sym.clipPath]))):u.win;if(!w)continue;for(const c of u.chain)(clipWins[c.name]??=[]).push(apply(inv(c.M),w));if(sym.clipPath)(clipWins[sym.clipPath]??=[]).push(apply(inv(u.M),w));}}
 for(const g of allGroups)if(!g.symbolScale&&g.win)for(const c of g.chain)(clipWins[c.name]??=[]).push(apply(inv(c.M),g.win));
 for(const [gi,g] of allGroups.entries()){
  const ds=g.leaves.map(l=>leafD(l.node));let b=bbox(ds);
  if(g.leaves.some(l=>l.node.transform))throw Error('leaf transform unsupported '+id);
  // Only the part visible through the clips matters (some pieces clip a whole scene trace to a small window).
  if(g.win){const lw=apply(inv(g.M),g.win),mg=8/Math.sqrt(Math.abs(g.M[0]*g.M[3]-g.M[1]*g.M[2]));b=meet(b,{x0:lw.x0-mg,y0:lw.y0-mg,x1:lw.x1+mg,y1:lw.y1+mg});}
  const s=Math.sqrt(Math.abs(g.M[0]*g.M[3]-g.M[1]*g.M[2]))*(worldScale[id]??1),w=b.x1-b.x0,h=b.y1-b.y0,areaW=w*h*s*s;
  if(!(w>0&&h>0))throw Error('empty window '+id);
  const pxw=Math.min(+(arg('px-max')??2),Math.max(+(arg('px-min')??0.5),Math.sqrt(+(arg('px-budget')??16e6)/areaW))),k=pxw*s,pad=4,area=areaW;
  const W=Math.ceil(w*k)+2*pad,H=Math.ceil(h*k)+2*pad,cv=createCanvas(W,H),c=cv.getContext('2d');
  const ox=b.x0-pad/k,oy=b.y0-pad/k;c.setTransform(k,0,0,k,-ox*k,-oy*k);
  const flat=f=>/^#[0-9a-f]{6}$/i.test(f||'');
  if(!g.leaves.some(l=>flat(l.node.fill)))continue; // pattern/gradient-only groups stay as authored
  for(const l of g.leaves){const d=leafD(l.node);if(!d||!flat(l.node.fill))continue;c.globalAlpha=l.node.opacity??1;c.fillStyle=l.node.fill;c.fill(new Path2D(d),l.node.fillRule==='evenodd'?'evenodd':'nonzero');}
  const base=path.join(work,`${id.replace(/[^\w-]/g,'_')}-${gi}`);fs.writeFileSync(base+'.png',cv.toBuffer('image/png'));
  const fills=[...new Set(g.leaves.map(l=>l.node.fill).filter(flat))];
  fs.writeFileSync(base+'.group.json',JSON.stringify({fills,ox,oy}));
  const P={minWorld:+(arg('min-world')??14000),brightWorld:+(arg('bright-world')??1200),tolWorld:+(arg('tol-world')??12),merge:arg('merge')??'22',pxMax:+(arg('px-max')??2),pxMin:+(arg('px-min')??0.5)};
  const minWorld=Math.min(P.minWorld,0.01*area),brightWorld=Math.min(P.brightWorld,0.001*area),tolWorld=Math.min(P.tolWorld,0.01*Math.sqrt(area));
  let tol=tolWorld*pxw,res;
  for(let attempt=0;attempt<4;attempt++){
   execFileSync('python3',[path.join(root,'tools/act5/retrace-vector.py'),'-',base+'.png',base+'.out.json','--group',base+'.group.json','--k',String(k),'--radius','1',
    '--min-px',String(Math.max(4,Math.round(minWorld*pxw*pxw))),'--bright-count','2','--bright-min-px',String(Math.max(2,Math.round(brightWorld*pxw*pxw))),
    '--tol',String(tol),'--smooth',String(arg('smooth')??6),'--merge-dist',String(P.merge),'--alpha-min',String(arg('alpha-min')??128),'--overlap',String(arg('overlap')??1)],{stdio:['ignore','ignore','inherit']});
   res=JSON.parse(fs.readFileSync(base+'.out.json','utf8'));
   // Renderer compound limits per leaf: 240000 chars, 120000 number tokens.
   const over=Object.values(res.d).some(d=>d.length>230000||(d.match(NUM)||[]).length>115000);
   if(!over)break;tol*=1.5;
  }
  const used=new Set();
  for(const l of g.leaves){
   if(!flat(l.node.fill))continue; // non-flat paint (url(#...)) keeps its authored geometry
   before+=(leafD(l.node).match(/[MLCSQTAHV]/gi)||[]).length;
   let d=used.has(l.node.fill)?'':(res.d[l.node.fill]||'');used.add(l.node.fill);
   if(!d)d='M0 0Z';
   if(l.node.d!==undefined&&d.length<=59000)paths.push([l.trail,'d',d]);
   else{const parts=chunk(d);if(!parts||parts.length>32)throw Error('dParts overflow '+id);paths.push([l.trail,'dParts',parts]);}
  }
  after+=res.endpoints;
 }
 // Crop clip silhouettes to the windows they show (only clips whose every use was recorded).
 const clipOut={};
 if(arg('crop-clips')!=='0')for(const [name,wins] of Object.entries(clipWins)){const d=clipMap[name];if(!d)continue;
  const usesAll=JSON.stringify(raw.vector).split('"'+name+'"').length-1;if(usesAll<1)continue;
  const sc=Math.sqrt(Math.abs(wins.length?1:1));const mg=12;
  const ws=wins.map(w=>[w.x0-mg,w.y0-mg,w.x1+mg,w.y1+mg]);const base=path.join(work,`${id.replace(/[^\w-]/g,'_')}-clip-${name.replace(/[^\w-]/g,'_')}`);
  fs.writeFileSync(base+'.in.json',JSON.stringify({clip:d,windows:ws,step:0.5,tol:0.25}));
  try{execFileSync('python3',[path.join(root,'tools/act4/crop-clip.py'),base+'.in.json',base+'.out.json'],{stdio:['ignore','ignore','ignore']});}catch{continue;} // e.g. arcs: keep the original clip
  const r=JSON.parse(fs.readFileSync(base+'.out.json','utf8'));const beforeEp=d.reduce((a,x)=>a+(x.match(/[MLCSQTAHVZ]/gi)||[]).length,0);
  if(r.endpoints<beforeEp*0.8)clipOut[name]=r.clip;}
 const old=byId.get(id),pub=published[id];if(!pub)throw Error('no published signature for '+id);
 const act4={stage,previous:old?.act4?.previous??pub,previousOptimized:[...new Set([...(old?.act4?[].concat(old.act4.previousOptimized||[],old.act4.current||[]):[]),pub].filter(s=>s&&s!=='pending'&&s!==(old?.act4?.previous??pub)))],current:'pending'};
 const entry={...(old||{}),id,original,paths,...(Object.keys(clipOut).length?{clips:clipOut}:{}),act4,retrace:{tool:'tools/act4/retrace-assets.mjs',date:'2026-11-23',params:{min:arg('min-world')??14000,bright:arg('bright-world')??1200,tol:arg('tol-world')??12,merge:arg('merge')??22,pxMin:arg('px-min')??0.5,pxMax:arg('px-max')??2,budget:arg('px-budget')??16e6,smooth:arg('smooth')??6}}};
 if(old)entries[entries.indexOf(old)]=entry;else entries.push(entry);byId.set(id,entry);
 report.push({id,groups:allGroups.length,approxCommandsBefore:before,endpointsAfter:after});
 console.log(JSON.stringify(report.at(-1)));
}
writeOpt(entries);
