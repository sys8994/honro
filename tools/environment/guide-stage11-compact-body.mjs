/** Exact BODY-only source crops plus B-open plane diagrams. Planning guides,
 * not artwork, full terrain acceptance or movement/shot evidence. */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createCanvas,Image} from '@napi-rs/canvas';
import {createOpenTwoStepB} from '../map-forge/stage11-compact-alternatives.mjs';
const out=path.resolve('_local/reports/act2-redesign-20261109/skeleton/body');await mkdir(out,{recursive:true});
const sourceFile='_local/reports/act2-redesign-20261109/movement/candidate-B.json',sourceBytes=await readFile(sourceFile),c=JSON.parse(sourceBytes),floor=c.terrains.find(t=>t.id==='compact-floor'),open=createOpenTwoStepB();
assert.deepEqual(open.terrains.find(t=>t.id==='compact-floor').points,floor.points,'Shared BODY geometry must remain exact between B and B-open');
const domainFile='_local/reports/act2-redesign-20261109/compact-project/project.json',domainBytes=await readFile(domainFile),project=JSON.parse(domainBytes),stage=project.stages.find(s=>s.metadata?.stageId===11),domainFloor=stage.terrains.find(t=>t.id==='compact-floor');
const sha=x=>createHash('sha256').update(x).digest('hex'),g=vm.createContext({}),boundsFile='shared/map/bounds.js',boundsBytes=await readFile(boundsFile);vm.runInContext(boundsBytes.toString(),g);const Bounds=g.HonroBounds;
const contact=floor.properties.honroWalkEdges.map(i=>[floor.points[i],floor.points[i+1]]),top=[contact[0][0],...contact.map(e=>e[1])];
const heightOn=x=>{for(const[a,b]of contact)if(x>=a.x&&x<=b.x)return a.y+(b.y-a.y)*(x-a.x)/(b.x-a.x);throw Error('No floor at '+x);};
const crops=[{id:'local-main',box:[-200,500,6600,3300],width:2048,height:1024,actors:[320,3000,5790]},
 {id:'west-contact',box:[0,1850,2400,1400],width:2400,height:1400,actors:[320,1100,2200]},
 {id:'central-contact',box:[2200,1800,1600,1400],width:1600,height:1400,actors:[2400,2900,3700]},
 {id:'north-contact',box:[3400,1400,3000,1800],width:2000,height:1200,actors:[3700,4800,5790]}];
const xml=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;');
const rows=[];
const pointIn=(p,b)=>p.x>=b[0]&&p.x<=b[0]+b[2]&&p.y>=b[1]&&p.y<=b[1]+b[3];
function drawBody(v,annotated){
 const[x,y,w,h]=v.box,z=v.width/w;assert.equal(v.height/h,z,'Uniform scale; no fit distortion');
 const px=p=>({x:(p.x-x)*z,y:(p.y-y)*z,normalizedX:(p.x-x)/w,normalizedY:(p.y-y)/h}),poly=ps=>ps.map(p=>`${p.x},${p.y}`).join(' '),sw=2/z;
 const parts=[`<svg xmlns="http://www.w3.org/2000/svg" width="${v.width}" height="${v.height}" viewBox="${v.box.join(' ')}"><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="white"/>`,
 `<polygon points="${poly(floor.points)}" fill="#a7b2ad" stroke="#61736c" stroke-width="${1/z}"/>`,
 `<polyline points="${poly(top)}" fill="none" stroke="#2e443c" stroke-width="${sw}"/>`];
 const actors=v.actors.map((xx,i)=>({id:'neutral-scale-'+(i+1),x:xx,y:heightOn(xx),height:92,width:44}));
 for(const p of actors){const R=10.12;parts.push(`<circle cx="${p.x}" cy="${p.y-92+R}" r="${R}" fill="#414746"/><path d="M${p.x-11},${p.y-67} L${p.x+11},${p.y-67} L${p.x+19},${p.y-18} L${p.x+6.6},${p.y-18} L${p.x+6.6},${p.y} L${p.x-6.6},${p.y} L${p.x-6.6},${p.y-18} L${p.x-19},${p.y-18} Z" fill="#414746"/>`);}
 const rois=contact.map(([a,b],i)=>({id:`floor-contact-${i}`,role:'protected authored walking contact; do not round/offset/replace',world:{x:Math.min(a.x,b.x)-24,y:Math.min(a.y,b.y)-24,width:Math.abs(b.x-a.x)+48,height:Math.abs(b.y-a.y)+48},endpointsWorld:[a,b],endpointsPixels:[px(a),px(b)]})).filter(r=>r.world.x+r.world.width>=x&&r.world.x<=x+w&&r.world.y+r.world.height>=y&&r.world.y<=y+h);
 if(annotated){
  parts.push(`<rect x="${x}" y="${y}" width="${w}" height="${76/z}" fill="white" fill-opacity=".97"/><text x="${x+18/z}" y="${y+25/z}" font-size="${18/z}" font-family="Arial,sans-serif" fill="#8f3e2e">BODY ONLY / ${xml(v.id)} / PLANNING GUIDE</text><text x="${x+18/z}" y="${y+49/z}" font-size="${13/z}" font-family="Arial,sans-serif" fill="#475c53">Exact compact-floor points. Upper branch, neck, bier and firing rock are excluded. Scale glyphs: 92 units high.</text>`);
  for(const r of rois){const b=r.world;parts.push(`<rect x="${b.x}" y="${b.y}" width="${b.width}" height="${b.height}" fill="none" stroke="#ac6648" stroke-width="${1/z}" stroke-dasharray="${4/z} ${5/z}"/>`);}
  for(const p of actors)parts.push(`<text x="${p.x+24}" y="${p.y-50}" font-size="${12/z}" font-family="Arial,sans-serif" fill="#414746">92</text>`);
 }
 parts.push('</svg>');return{svg:parts.join('\n'),metadata:{id:v.id,annotated,worldViewBox:v.box,pixelSize:[v.width,v.height],uniformScale:z,camera:{x:x+w/2,y:y+h/2,scale:z,kind:'exact source crop; not gameplay camera'},worldToPixel:{x:'(worldX-viewBox.x)*uniformScale',y:'(worldY-viewBox.y)*uniformScale'},floorWorldPoints:floor.points,floorPixelPoints:floor.points.map(px),contactPolylineWorld:top,contactPolylinePixels:top.map(px),contactVisibleVertexIndices:top.flatMap((p,i)=>pointIn(p,v.box)?[i]:[]),actors:actors.map(p=>({...p,pixelFoot:px(p),heightPixels:92*z})),protectedROIs:rois,excludedTerrainIds:c.terrains.filter(t=>t.id!==floor.id).map(t=>t.id),noArtGenerated:true}};
}
async function emit(id,svg,width,height,metadata){const svgFile=path.join(out,id+'.svg'),pngFile=path.join(out,id+'.png');await writeFile(svgFile,svg);const cv=createCanvas(width,height),ctx=cv.getContext('2d'),im=new Image();im.src=Buffer.from(svg);ctx.drawImage(im,0,0);const png=cv.toBuffer('image/png');await writeFile(pngFile,png);cv.width=1;cv.height=1;const result={...metadata,svgFile,pngFile,svgSha256:sha(svg),pngSha256:sha(png)};await writeFile(path.join(out,id+'.json'),JSON.stringify(result,null,2)+'\n');rows.push(result);console.log(id);}
for(const v of crops)for(const annotated of[false,true]){const q=drawBody(v,annotated);await emit(`body-${v.id}-${annotated?'annotated':'clean'}`,q.svg,v.width,v.height,q.metadata);}

// B-open planning diagram: rear shelf is drawn behind the exposed FRONT
// contact line. The white edge strip is a diagram plane cue, not new geometry.
for(const v of[{id:'B-openOverview',width:1800,height:900,x:3100,y:1900,scale:1800/6800},{id:'B-openEntry',width:1600,height:900,x:1080,y:2230,scale:.94}]){
 const z=v.scale,box={left:v.x-v.width/(2*z),top:v.y-v.height/(2*z),right:v.x+v.width/(2*z),bottom:v.y+v.height/(2*z)},p=q=>({x:(q.x-box.left)*z,y:(q.y-box.top)*z}),poly=ps=>ps.map(q=>{const a=p(q);return`${a.x},${a.y}`;}).join(' '),parts=[`<svg xmlns="http://www.w3.org/2000/svg" width="${v.width}" height="${v.height}" viewBox="0 0 ${v.width} ${v.height}"><rect width="100%" height="100%" fill="white"/>`];
 const rock=open.terrains.find(t=>t.id==='compact-firing-rock'),front=open.terrains.find(t=>t.id==='compact-floor');
 parts.push(`<polygon points="${poly(front.points)}" fill="#a7b2ad"/>`);
 for(const t of open.terrains.filter(t=>t.id!==front.id))parts.push(`<polygon points="${poly(t.points)}" fill="${t===rock?'#b2bdc2':t.id==='compact-upper-flank'?'#a78459':'#7f9295'}" stroke="#56666b" stroke-width="1.2"${t===rock?' stroke-dasharray="5 4"':''}/>`);
 const frontPolyline=front.properties.honroWalkEdges.map(i=>front.points[i]);frontPolyline.push(front.points[front.properties.honroWalkEdges.at(-1)+1]);
 parts.push(`<polyline points="${poly(frontPolyline)}" fill="none" stroke="white" stroke-width="11"/><polyline points="${poly(frontPolyline)}" fill="none" stroke="#234c3a" stroke-width="3"/>`);
 // A solid foreground bier occludes the lower walking contact. Only the rear
 // one-way rock has a visible front-plane bypass; never imply walking through
 // the genuinely solid bier by drawing the white plane cue over that object.
 const solidBier=open.terrains.find(t=>t.id==='compact-bier-cover');parts.push(`<polygon points="${poly(solidBier.points)}" fill="#725a48" stroke="#51483e" stroke-width="1.5"/>`);
 for(const t of open.terrains.filter(t=>t.id!==front.id))for(const i of t.properties.honroWalkEdges){const a=p(t.points[i]),b=p(t.points[i+1]);parts.push(`<path d="M${a.x},${a.y} L${b.x},${b.y}" fill="none" stroke="${t===rock?'#744f37':'#31433b'}" stroke-width="3"/>`);}
 const actorXs=v.id==='B-openEntry'?[560,open.sites.bier.x]:[320,3000,5790];
 for(const xx of actorXs){const q=p({x:xx,y:heightOn(xx)}),hh=92*z,ww=44*z;parts.push(`<rect x="${q.x-ww/2}" y="${q.y-hh}" width="${ww}" height="${hh}" rx="${ww/5}" fill="#374241"/>`);}
 parts.push(`<rect width="${v.width}" height="78" fill="white"/><text x="20" y="28" font-family="Arial,sans-serif" font-size="18" fill="#8f3e2e">${v.id}: TWO-STEP REAR SHELF + FRONT LOW PATH / DIAGRAM ONLY</text><text x="20" y="53" font-family="Arial,sans-serif" font-size="13" fill="#3f5650">Brown rear shelf contact: one-way top. Green exposed contact: FRONT ground path. These are different visual planes.</text>`);
 const rp=p(open.sites.firingRock);parts.push(`<path d="M${rp.x+70},${rp.y-70} L${rp.x},${rp.y-8}" fill="none" stroke="#7b6755"/><text x="${rp.x+75}" y="${Math.max(105,rp.y-76)}" font-family="Arial,sans-serif" font-size="13" fill="#7b6755">REAR L1-back / 200 HIGH / NO FRONT SOLID WALL</text>`);
 const frontPoint=p({x:610,y:heightOn(610)}),bierPoint=p({x:(solidBier.points[0].x+solidBier.points[1].x)/2,y:solidBier.points[0].y});
 parts.push(`<path d="M${frontPoint.x-55},${frontPoint.y+95} L${frontPoint.x},${frontPoint.y+5}" fill="none" stroke="#285a40"/><text x="${Math.max(20,frontPoint.x-120)}" y="${frontPoint.y+112}" font-family="Arial,sans-serif" font-size="12" fill="#285a40">FRONT WALKING LIP / ACTOR IN FRONT</text><path d="M${bierPoint.x+35},${bierPoint.y-45} L${bierPoint.x},${bierPoint.y-5}" fill="none" stroke="#725a48"/><text x="${bierPoint.x+40}" y="${bierPoint.y-50}" font-family="Arial,sans-serif" font-size="12" fill="#725a48">BIER IS SOLID / JUMP OVER</text>`);
 parts.push(`<text x="20" y="${v.height-22}" font-family="Arial,sans-serif" font-size="13" fill="#8f3e2e">Rear body artwork must leave the low FRONT walking lip visible. No actor should look embedded in a foreground rock wall.</text></svg>`);
 await emit(v.id,parts.join('\n'),v.width,v.height,{scope:'B-open alternative plane diagram only; no final art, collision/gameplay acceptance.',candidate:open.alternative,view:v,worldViewport:box,rearShelf:open.proxies.firingRock,sourceCandidateSha256:sha(JSON.stringify(open)),frontPlaneCue:'White outline behind actual front contact is a diagram convention, not new geometry.',sourceWorldTerrain:open.terrains.map(t=>({id:t.id,oneWay:t.oneWay,points:t.points}))});
}
const foundation={scope:'Derived extent requirement only; NO foundation artwork generated.',projectSource:domainFile,projectSourceSha256:sha(domainBytes),stageId:11,terrainId:domainFloor.id,playBounds:stage.playBounds,terrainBounds:stage.terrainBounds,fullCanonicalPolygon:domainFloor.points,playProjection:domainFloor.playProjection,foundationNeeded:{left:stage.terrainBounds.left,right:stage.terrainBounds.right,bottom:stage.terrainBounds.bottom},visualBounds:{desktop1440x900:Bounds.visual(stage,1440,900),portrait390x844:Bounds.visual(stage,390,844)},mainBodyCrop:crops[0].box,mainCropDoesNotCoverFullDomain:true,requirement:'Extend source geology continuously over the actual camera exposure. Preserve the canonical full polygon and the Play projection; do not fill missing exterior with invented slabs or change the camera to hide it.'};
await writeFile(path.join(out,'foundation-extent-only.json'),JSON.stringify(foundation,null,2)+'\n');
await writeFile(path.join(out,'manifest.json'),JSON.stringify({scope:'Exact BODY and B-open planning guides, never artwork or Engine/browser proof.',sourceFile,sourceSha256:sha(sourceBytes),sharedBodyMatchesBOpen:true,bodyTerrainSha256:sha(JSON.stringify(floor.points)),foundationExtent:'foundation-extent-only.json',rows:rows.map(({floorWorldPoints,floorPixelPoints,contactPolylineWorld,contactPolylinePixels,protectedROIs,sourceWorldTerrain,...q})=>q)},null,2)+'\n');

// Dedicated asset guide owned with the upper-pine production task. Only source
// contacts/sockets and a measurement glyph are diagrammed, never natural art.
const pineOut=path.resolve('art/act2-ch1-compact-20261109/upper-pine');await mkdir(pineOut,{recursive:true});
const pineBox=[1650,1650,1700,850],pineW=2048,pineH=1024,pineZ=pineW/pineBox[2],pinePoint=q=>({x:(q.x-pineBox[0])*pineZ,y:(q.y-pineBox[1])*pineZ}),pineSupport=open.visualSupports.find(s=>s.id==='upper-rooted-pine-fork'),pineTerrain=open.terrains.find(t=>t.id==='compact-upper-flank');
const pineTop=pineTerrain.properties.honroWalkEdges.map(i=>pineTerrain.points[i]);pineTop.push(pineTerrain.points[pineTerrain.properties.honroWalkEdges.at(-1)+1]);
const pineParts=[`<svg xmlns="http://www.w3.org/2000/svg" width="${pineW}" height="${pineH}" viewBox="0 0 ${pineW} ${pineH}"><rect width="100%" height="100%" fill="#f0f1ef"/>`];
const pinePoly=ps=>ps.map(q=>{const p=pinePoint(q);return`${p.x},${p.y}`;}).join(' ');
pineParts.push(`<polygon points="${pinePoly(pineTerrain.points)}" fill="#997a55" fill-opacity=".55"/><polyline points="${pinePoly(pineTop)}" fill="none" stroke="#175b83" stroke-width="5"/>`);
for(const q of pineSupport.supportSockets.bearings){const p=pinePoint(q);pineParts.push(`<circle cx="${p.x}" cy="${p.y}" r="7" fill="#29765d"/>`);}
const pineFoot=pinePoint(pineSupport.supportSockets.foot);pineParts.push(`<circle cx="${pineFoot.x}" cy="${pineFoot.y}" r="10" fill="#9f493b"/>`);
const scaleX=80,scaleFoot=pineFoot.y,scaleHeight=92*pineZ;pineParts.push(`<rect x="${scaleX}" y="${scaleFoot-scaleHeight}" width="${44*pineZ}" height="${scaleHeight}" rx="7" fill="#4f5555"/><text x="${scaleX+60}" y="${scaleFoot-scaleHeight/2}" font-family="Arial,sans-serif" font-size="22" fill="#4f5555">92 world units</text>`);
pineParts.push(`<text x="32" y="38" font-family="Arial,sans-serif" font-size="24" fill="#864d37">STRUCTURE ONLY - BLUE LINE = EXACT UPPER WALK CONTACT; RED = ROOT FOOT; GREEN = BEARINGS</text><text x="32" y="72" font-family="Arial,sans-serif" font-size="20" fill="#5c6b66">Create only rear pine trunk/root + this branch. Remove all guide marks, actor and background in the final transparent image.</text></svg>`);
const pineSVG=pineParts.join('\n');await writeFile(path.join(pineOut,'structure-guide.svg'),pineSVG);const pineCanvas=createCanvas(pineW,pineH),pineImage=new Image();pineImage.src=Buffer.from(pineSVG);pineCanvas.getContext('2d').drawImage(pineImage,0,0);const pinePNG=pineCanvas.toBuffer('image/png');await writeFile(path.join(pineOut,'structure-guide.png'),pinePNG);pineCanvas.width=1;pineCanvas.height=1;
await writeFile(path.join(pineOut,'contract.json'),JSON.stringify({status:'asset structure contract; art not generated/approved',candidate:'B-two-step-open-200',semanticLayer:'REAR+upper open walking branch',enginePlane:'L1-back',collisionSourceTerrainId:pineTerrain.id,sourceCandidateModule:'tools/map-forge/stage11-compact-alternatives.mjs',candidateSha256:sha(JSON.stringify(open)),viewBoxWorld:pineBox,imageSize:[pineW,pineH],worldToSourceScale:pineZ,sourceToWorld:[1/pineZ,0,0,1/pineZ,pineBox[0],pineBox[1]],footWorld:pineSupport.supportSockets.foot,footSource:pineFoot,upperContactWorld:pineTop,upperContactSource:pineTop.map(pinePoint),bearingWorld:pineSupport.supportSockets.bearings,bearingSource:pineSupport.supportSockets.bearings.map(pinePoint),actorHeightWorld:92,actorHeightSource:scaleHeight,rootToHighestContactWorld:pineSupport.supportSockets.foot.y-Math.min(...pineTop.map(p=>p.y)),protectedRegions:{walkContact:{polyline:pineTop.map(pinePoint),width:12},foot:{x:pineFoot.x-60,y:pineFoot.y-60,width:120,height:120}},imageRules:['actual alpha background','no ground/stone neck/far background/actor/UI in asset','do not invent a solid foreground trunk collider','trunk and root are rear L1-back; lower path remains visible in front','leave actual narrow branch clearance unchanged','guide colors/markers are not artwork'],sourceGuideSha256:sha(pinePNG)},null,2)+'\n');console.log('upper-pine structure guide');
