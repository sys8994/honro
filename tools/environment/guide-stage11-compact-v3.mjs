/** Structure-reference v3: source geometry + explicitly schematic symbols.
 * Planning guide only. Never writes campaign/geometry/art or claims game proof. */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {createCanvas,Image} from '@napi-rs/canvas';
import {createCompactCandidate,heightOn} from '../map-forge/stage11-compact-candidates.mjs';

const out=path.resolve('_local/reports/act2-redesign-20261109/skeleton');await mkdir(out,{recursive:true});
const c=createCompactCandidate('B'),width=1800,height=780,viewBox={x:-300,y:700,width:6800,height:6800*height/width},scale=width/viewBox.width;
const hash=x=>createHash('sha256').update(x).digest('hex'),sourceFile='tools/map-forge/stage11-compact-candidates.mjs',sourceSha256=hash(await readFile(sourceFile));
const tx=x=>(x-viewBox.x)*scale,ty=y=>(y-viewBox.y)*scale,xml=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;');
const pt=p=>[p.x??p[0],p.y??p[1]],px=p=>{const[x,y]=pt(p);return{x:tx(x),y:ty(y),normalizedX:tx(x)/width,normalizedY:ty(y)/height};};
const polygon=points=>points.map(p=>{const q=px(p);return`${q.x.toFixed(3)},${q.y.toFixed(3)}`;}).join(' ');
const colors={'compact-floor':'#bbc3be','compact-stone-neck':'#798c91','compact-upper-flank':'#a77e4c','compact-firing-rock':'#53656c','compact-bier-cover':'#584234'};
const terrainNames={'compact-floor':'CONNECTED GROUND / RECOVERY FLOOR','compact-stone-neck':'LOWER STONE NECK - SEPARATE CONTACT','compact-upper-flank':'UPPER OPEN PINE BRANCH - SEPARATE CONTACT','compact-firing-rock':'FOUR-STEP FIRING ROCK','compact-bier-cover':'BIER COVER - KEEP EXACT BOX / POSITION'};
const terrainJson=c.terrains.map(t=>({id:t.id,name:terrainNames[t.id],oneWay:t.oneWay,worldPoints:t.points,pixelPoints:t.points.map(px),walkEdges:t.properties.honroWalkEdges,contactWorld:t.properties.honroWalkEdges.map(i=>[t.points[i],t.points[i+1]]),contactPixels:t.properties.honroWalkEdges.map(i=>[px(t.points[i]),px(t.points[i+1])]),schematicColor:colors[t.id]}));
const parts=[`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="white"/>`,
 '<defs><marker id="note-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0,0 L7,3.5 L0,7 Z" fill="#637270"/></marker></defs>'];
const text=(x,y,s,size=15,color='#3a4c4e')=>parts.push(`<text x="${x}" y="${y}" font-family="Arial,sans-serif" font-size="${size}" fill="${color}">${xml(s)}</text>`);
const note=(s,p,x,y)=>{const q=px(p);parts.push(`<path d="M${x+20},${y+8} L${q.x},${q.y}" fill="none" stroke="#637270" stroke-width="1.2" marker-end="url(#note-arrow)"/>`);text(x,y,s,14);};
for(const t of c.terrains){
 if(t.id==='compact-bier-cover'){
  // Symbolic top beam/posts, all confined to the exact collision proxy box.
  // Empty-looking frame is NOT a statement of passable collision below it.
  const[left,right,bottomRight,bottomLeft]=t.points,x=tx(left.x),y=ty(left.y),w=(right.x-left.x)*scale,h=Math.max(bottomLeft.y,bottomRight.y)-left.y;
  parts.push(`<polygon points="${polygon(t.points)}" fill="#f1ece6" stroke="#584234" stroke-width="1.5" stroke-dasharray="3 2"/><rect x="${x}" y="${y}" width="${w}" height="${10*scale}" fill="#584234"/>`);
  for(const xx of[left.x+8,right.x-16])parts.push(`<rect x="${tx(xx)}" y="${y}" width="${8*scale}" height="${(heightOn(c.floor,xx)-left.y)*scale}" fill="#584234"/>`);
  parts.push(`<path d="M${tx(left.x+8)},${ty(left.y+14)} L${tx(right.x-16)},${ty(heightOn(c.floor,right.x-16)-5)}" fill="none" stroke="#584234" stroke-width="${5*scale}"/>`);
 }else parts.push(`<polygon points="${polygon(t.points)}" fill="${colors[t.id]}" stroke="#536361" stroke-width="1.1"/>`);
 for(const i of t.properties.honroWalkEdges){const a=px(t.points[i]),b=px(t.points[i+1]);parts.push(`<path d="M${a.x},${a.y} L${b.x},${b.y}" fill="none" stroke="#253a37" stroke-width="3"/>`);}
}
// Three exact-height neutral scale glyphs. No existing hero design is altered.
const actors=[{id:'entry-scale',x:c.sites.spawn.x,y:c.sites.spawn.y},{id:'branch-scale',x:2500,y:heightOn(c.upper,2500)},{id:'exit-scale',x:c.sites.exit.x,y:c.sites.exit.y}];
for(const p of actors){const q=px(p),H=92*scale,W=44*scale,R=H*.11;parts.push(`<circle cx="${q.x}" cy="${q.y-H+R}" r="${R}" fill="#383e3e"/><path d="M${q.x-W*.25},${q.y-H*.73} L${q.x+W*.25},${q.y-H*.73} L${q.x+W*.43},${q.y-H*.19} L${q.x+W*.15},${q.y-H*.19} L${q.x+W*.15},${q.y} L${q.x-W*.15},${q.y} L${q.x-W*.15},${q.y-H*.19} L${q.x-W*.43},${q.y-H*.19} Z" fill="#383e3e"/>`);}
// Annotation arrows terminate at source geometry. They are not root/wood bars.
note('FOUR-STEP ROCK - EXACT TOP',c.sites.firingRock,125,210);
const bier=c.terrains.find(t=>t.id==='compact-bier-cover');note('BIER - FIXED HERE',{x:(bier.points[0].x+bier.points[1].x)/2,y:bier.points[0].y},280,255);
note('UPPER: OPEN WOOD BRANCH',{x:2470,y:heightOn(c.upper,2470)},630,245);
note('LOWER: STONE NECK',{x:3020,y:heightOn(c.crossing,3020)},1030,285);
note('LOWEST: RECOVERY FLOOR',{x:2940,y:heightOn(c.floor,2940)},740,585);
text(35,34,'B STRUCTURE REFERENCE v3 - PLANNING GUIDE, NOT FINAL ART',18,'#913e2f');
text(35,58,'Do not merge the upper wood contact, lower stone contact and lowest recovery floor. Keep the left bier position.',14);
text(35,82,'Three neutral glyphs are exactly 92 world units high. One-way strips are open-contact physics proxies, not finished artwork.',13);
text(1160,120,'REAR PINE-FORK SUPPORT: PLAN ONLY',14,'#8a5b35');
text(1160,141,'Foot/bearing sockets are in the JSON sidecar.',12,'#8a5b35');
text(1160,160,'No guessed trunk or braces are drawn here.',12,'#8a5b35');
text(35,height-38,'Stone/wood colors encode structure roles. Do not copy these diagram colors into final art.',13,'#7a5950');
text(35,height-18,'Bier frame is a schematic symbol inside a solid collision box; it does not mean the box interior is passable.',13,'#7a5950');
parts.push('</svg>');const svg=parts.join('\n'),svgFile=path.join(out,'structural-guide-v3.svg'),pngFile=path.join(out,'structural-guide-v3.png');
await writeFile(svgFile,svg);const canvas=createCanvas(width,height),ctx=canvas.getContext('2d'),im=new Image();im.src=Buffer.from(svg);ctx.drawImage(im,0,0);const bytes=canvas.toBuffer('image/png');await writeFile(pngFile,bytes);canvas.width=1;canvas.height=1;
const sidecar={scope:'Schematic planning guide only. Exact source terrain points and contacts; distinct colors and confined bier-frame symbol communicate roles, not final artwork or passability. No campaign/geometry mutation, HonroScene/Engine/browser/acceptance claim.',sourceFile,sourceSha256,candidateSha256:hash(JSON.stringify(c)),viewBox,canvas:{width,height},camera:{x:viewBox.x+viewBox.width/2,y:viewBox.y+viewBox.height/2,scale,kind:'diagnostic image-generation structure reference'},worldToPixel:{x:'(worldX-viewBox.x)*scale',y:'(worldY-viewBox.y)*scale'},terrains:terrainJson,sites:Object.fromEntries(Object.entries(c.sites).map(([id,p])=>[id,{world:p,pixel:px(p)}])),actors:actors.map(p=>({...p,heightWorld:92,widthWorld:44,pixel:px(p),heightPixels:92*scale})),visualSupports:c.visualSupports.map(s=>({...s,rendered:false,reason:'Annotation only; no guessed root/brace artwork.',pixelSockets:{foot:px(s.supportSockets.foot),bearings:s.supportSockets.bearings.map(px)}})),images:{svgFile,pngFile,svgSha256:hash(svg),pngSha256:hash(bytes)}};
await writeFile(path.join(out,'structural-guide-v3.json'),JSON.stringify(sidecar,null,2)+'\n');console.log(JSON.stringify({pngFile,viewBox,camera:sidecar.camera,pngSha256:hash(bytes)},null,2));
