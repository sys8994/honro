/** Exact candidate geometry guides. This is a planning diagram renderer, NOT
 * HonroScene, a runtime art capture, collision proof or a gameplay acceptance.
 * No terrain geometry, artwork or live campaign data is invented here. */
import vm from 'node:vm';
import path from 'node:path';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createCanvas,Image} from '@napi-rs/canvas';
import {COMPACT_CANDIDATES,createCompactCandidate,heightOn} from '../map-forge/stage11-compact-candidates.mjs';

const out=path.resolve('_local/reports/act2-redesign-20261109/skeleton');
await mkdir(out,{recursive:true});
const hash=x=>createHash('sha256').update(x).digest('hex');
const boundsSource=await readFile('shared/map/bounds.js','utf8'),g=vm.createContext({});
vm.runInContext(boundsSource,g);const B=g.HonroBounds;
const sourceFiles=['tools/map-forge/stage11-compact-candidates.mjs','game/docs/ACT2_CH1_COMPACT_DESIGN.md','shared/map/bounds.js'];
const sourceSha256=Object.fromEntries(await Promise.all(sourceFiles.map(async file=>[file,hash(await readFile(file))])));
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const routeColors={'main':'#258170','firing-rock':'#985e45','upper-flank':'#755c9c','lower-recovery':'#c28a2e','down-jump-recovery':'#be6260','last-combat-to-exit':'#3078ab'};
const names={spawn:'START',bier:'BIER APPROACH / SOLID COVER',firingRock:'FIRING ROCK / SOLID',host:'HOST SITE',nextHost:'NEXT HOST SITE',north:'NORTH SITE',exit:'EXIT / 180 RADIUS',lastCombat:'LAST COMBAT SITE'};
const views=[];
for(const meta of COMPACT_CANDIDATES){const c=createCompactCandidate(meta.id),scale=Math.min(1440/(c.width+800),840/(c.height+640));views.push({id:`${c.id}-overview`,candidate:c.id,width:1600,height:1000,x:c.width/2,y:c.height/2+100,scale,kind:'diagnostic overview',annotated:true});}
const c=createCompactCandidate('B');
const bierCollider=c.terrains.find(t=>t.id===c.proxies.bier.terrainId),bierCenter=(bierCollider.points[0].x+bierCollider.points[1].x)/2;
const locs=[['entry',bierCenter,c.sites.bier.y-220],['upper-host',2450,2130],['exit',c.sites.exit.x-250,c.sites.exit.y-180]];
for(const[id,x,y]of locs){views.push({id:`B-${id}-desktop`,candidate:'B',width:1440,height:900,x,y,scale:.94,kind:'representative camera diagram',annotated:true});views.push({id:`B-${id}-mobile`,candidate:'B',width:390,height:844,x,y,scale:.82,kind:'representative camera diagram',annotated:true});}
for(const[w,h,label]of [[1440,900,'desktop'],[390,844,'mobile']]){const scale=B.zoomLimits(w).min;views.push({id:`B-minimum-${label}`,candidate:'B',width:w,height:h,x:c.width/2,y:2200,scale,kind:'actual policy minimum zoom diagram',annotated:true});}
views.push({id:'B-contact-span-clean',candidate:'B',width:1600,height:650,x:3100,y:2200,scale:1600/6800,kind:'cropped contact-span structure input; diagnostic camera',annotated:false});

function guide(c,v){
 const p=B.viewport(v,v.width,v.height),tx=x=>(x-v.x)*v.scale+v.width/2,ty=y=>(y-v.y)*v.scale+v.height/2;
 const list=[`<svg xmlns="http://www.w3.org/2000/svg" width="${v.width}" height="${v.height}" viewBox="0 0 ${v.width} ${v.height}">`,`<rect width="100%" height="100%" fill="#edf0ef"/>`];
 const poly=pts=>pts.map(q=>`${tx(q.x??q[0]).toFixed(3)},${ty(q.y??q[1]).toFixed(3)}`).join(' ');
 const line=(pts,color,width=2,dash='')=>list.push(`<polyline points="${poly(pts)}" fill="none" stroke="${color}" stroke-width="${width}"${dash?` stroke-dasharray="${dash}"`:''}/>`);
 const text=(x,y,s,size=14,color='#253d42')=>list.push(`<text x="${x.toFixed(2)}" y="${y.toFixed(2)}" fill="${color}" font-family="Arial, sans-serif" font-size="${size}">${esc(s)}</text>`);
 if(v.annotated){
  const grid=v.width<500&&v.scale<.1?2000:500;
  for(let x=Math.ceil(p.left/grid)*grid;x<=p.right;x+=grid){line([{x,y:p.top},{x,y:p.bottom}],'#dce2df',1);text(tx(x)+4,68,String(x),11,'#74827d');}
  for(let y=Math.ceil(p.top/grid)*grid;y<=p.bottom;y+=grid){line([{x:p.left,y},{x:p.right,y}],'#dce2df',1);text(5,ty(y)-3,String(y),11,'#74827d');}
 }
 for(const t of c.terrains){
  list.push(`<polygon points="${poly(t.points)}" fill="${t.oneWay?'#939ea0':'#b6c0bc'}" stroke="#65716d" stroke-width="1"/>`);
  const edges=t.properties.honroWalkEdges||[];for(const i of edges)line([t.points[i],t.points[i+1]],'#364d45',v.annotated?3:2);
 }
 if(v.annotated){
  // Dashed sockets are source-authored non-colliding support PLANS, not
  // fabricated rooted art or a proof that the final branch is supported.
  for(const s of c.visualSupports||[]){const foot=s.supportSockets?.foot;if(!foot)continue;for(const bearing of s.supportSockets.bearings||[])line([foot,bearing],'#aa7563',2,'4 5');if(v.scale>.15){const mid=s.supportSockets.bearings[Math.floor(s.supportSockets.bearings.length/2)];text(tx(mid.x)-155,ty(mid.y)+38,'REAR FORK PLAN / ART NOT MADE',v.width<500?9:11,'#9b5145');}}
  list.push(`<rect x="${tx(0)}" y="${ty(0)}" width="${c.width*v.scale}" height="${c.height*v.scale}" fill="none" stroke="#b36b60" stroke-width="1.5" stroke-dasharray="8 5"/>`);
  for(const r of c.routes){if(r.id==='down-jump-recovery')continue;line(r.anchors.map(a=>({...a,y:a.y-15})),routeColors[r.id]||'#754750',2.5,r.kind==='required'?'':'7 5');for(const a of r.anchors)list.push(`<circle cx="${tx(a.x)}" cy="${ty(a.y-15)}" r="3" fill="${routeColors[r.id]}"/>`);}
  const exit=c.sites.exit;list.push(`<circle cx="${tx(exit.x)}" cy="${ty(exit.y)}" r="${180*v.scale}" fill="none" stroke="#3078ab" stroke-dasharray="5 4"/>`);
  let siteIndex=0;
  for(const[id,q]of Object.entries(c.sites)){
   const sx=tx(q.x),sy=ty(q.y);if(sx<-180||sx>v.width+180||sy<-120||sy>v.height+120)continue;
   list.push(`<circle cx="${sx}" cy="${sy}" r="4" fill="#804e41"/>`);if(v.width<500&&v.scale<.1&&!['spawn','exit'].includes(id))continue;const labelY=Math.max(82,sy-Math.max(30,92*v.scale+15)-(siteIndex++%3)*20),label=(names[id]||id).replace(v.width<500?' / SOLID COVER':'__unused__','').replace(v.width<500?' / SOLID':'__unused__','');line([{x:q.x,y:q.y},{x:q.x,y:q.y-(sy-labelY-5)/v.scale}],'#8c6255',1);text(Math.min(Math.max(8,sx+(id==='firingRock'?45:-45)),v.width-170),labelY,label,v.width<500?10:12,'#684c43');
  }
 }
 // Fixed 92 x 44 world-unit comparison body. It is a measurement glyph, not a
 // hero render and not an asserted valid collision/contact pose.
 const midpoint=(c.crossing[0][0]+c.crossing.at(-1)[0])/2;
 const bodyX=Math.max(0,Math.min(c.width,v.x));
 const bodySurface=v.id.includes('upper-host')?c.upper:c.floor;
 const bodies=v.id.includes('overview')||v.id.includes('minimum')||!v.annotated?[c.sites.spawn,{x:midpoint,y:heightOn(c.crossing,midpoint)},c.sites.exit]:v.id.includes('entry')?[c.sites.firingRock,c.sites.bier]:[{x:bodyX,y:heightOn(bodySurface,bodyX)}];
 for(const q of bodies){const sx=tx(q.x),foot=ty(q.y),hh=92*v.scale,ww=44*v.scale;list.push(`<rect x="${sx-ww/2}" y="${foot-hh}" width="${ww}" height="${hh}" rx="${Math.min(ww/4,4)}" fill="#243e46"/>`);if(v.annotated&&hh>20)text(sx+ww/2+4,foot-hh/2,'92',11,'#243e46');}
 if(v.annotated){
  list.push(`<rect x="0" y="0" width="${v.width}" height="55" fill="#edf0ef" fill-opacity=".96"/>`);
  text(16,22,`${c.id} | ${c.width} x ${c.height} | ${v.id} | zoom ${v.scale.toFixed(4)}`,v.width<500?11:16);
  text(16,43,'GEOMETRY GUIDE ONLY - NOT RUNTIME ART / PLAY PROOF',v.width<500?9:12,'#9b5145');
  if(v.width>500){text(16,v.height-35,'Dark: walk edge | teal: main | purple: upper | amber: recovery | dashed brown: non-colliding rear support PLAN',12);text(16,v.height-15,'Solid bier/firing-rock are collision proxies. Rooted support artwork, stone-neck form and terrain-domain exterior pending.',12,'#9b5145');}
 }
 list.push('</svg>');return{svg:list.join('\n'),viewport:p};
}
const rows=[];
for(const v of views){const c=createCompactCandidate(v.candidate),{svg,viewport}=guide(c,v),svgFile=path.join(out,v.id+'.svg'),pngFile=path.join(out,v.id+'.png');await writeFile(svgFile,svg);const canvas=createCanvas(v.width,v.height),ctx=canvas.getContext('2d'),im=new Image();im.src=Buffer.from(svg);ctx.drawImage(im,0,0);const png=canvas.toBuffer('image/png');await writeFile(pngFile,png);canvas.width=1;canvas.height=1;rows.push({id:v.id,view:v,viewport,pngFile,svgFile,pngSha256:hash(png),svgSha256:hash(svg),candidateSha256:hash(JSON.stringify(c)),outsidePlayVisible:viewport.left<0||viewport.right>c.width||viewport.top<0||viewport.bottom>c.height});console.log(v.id);}
const policyCandidates=COMPACT_CANDIDATES.map(meta=>{const c=createCompactCandidate(meta.id);return{id:c.id,play:B.play(c),focus:B.focus(c),visualDesktop:B.visual(c,1440,900),visualMobile:B.visual(c,390,844),terrainDomainAuthored:false};});
await writeFile(path.join(out,'manifest.json'),JSON.stringify({scope:'Exact canonical candidate geometry planning diagrams. Native Canvas rasterizes these SVG guides; this is not HonroScene, runtime art, Engine collision/movement, four-actor gathering, browser play, or deployment proof.',authoredProxyGeometry:['solid bier cover','solid four-step firing rock'],missingAuthoredGeometry:['rooted support art for the source-authored visualSupports socket plan','stone neck support/form artwork','extended terrain-domain exterior'],visualSupportPlans:COMPACT_CANDIDATES.map(meta=>{const c=createCompactCandidate(meta.id);return{candidate:c.id,visualSupports:c.visualSupports};}),sourceSha256,policyCandidates,rows},null,2)+'\n');
