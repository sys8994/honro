/** Candidate only: authored outline becomes actual ceiling collider; no runtime changes. */
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {runtime} from '../../game/tests/helpers.mjs';
const dir='art/stage38-silhouette-v4',out='_local/reports/cave-silhouette-v4',read=async x=>JSON.parse(await readFile(x)),hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex'),p=await read(out+'/baseline.json'),s=p.stages[0],before=structuredClone(s),c=await read(dir+'/roof-contour.json'),source=await read(dir+'/roof-shallow-asset.json');
const t=s.terrains.find(t=>t.id==='a4-38-cavern-roof');assert.deepEqual(t.points,c.originalTerrainPoints);t.points=c.terrainPoints;
const polygon=ps=>ps.map((q,i)=>(i?'L':'M')+q.x+' '+q.y).join(' ')+'Z';
const asset=structuredClone(source);asset.id='s38-silhouette-v4:ceiling';asset.name='새벽 해식굴 침식 천장';asset.bounds={x:0,y:400,w:3300,h:1940};asset.reference={...asset.reference,bounds:asset.bounds,foot:{x:0,y:2100},scaleRange:[1,1],backgroundRange:[1,1]};asset.anchor={x:0,y:0};
asset.params={...asset.params,semanticLayer:'BODY',collisionAuthority:t.id,sourceOutline:c.sourceSvg,deliberateGeometryChange:true};
const v=asset.vector,original=v.root;v.symbols={...v.symbols,'reviewed-roof-source':original};v.clips={...v.clips,roof:[polygon(t.points)],play:['M0 0H3300V5000H0Z']};v.viewBox=[0,400,3300,1940];
const children=[{tag:'path',d:polygon(t.points),fill:'#172b3a'}],segments=[];
for(let i=1;i<c.originalProfile.length;i++){const[a,b]=[c.originalProfile[i-1],c.originalProfile[i]],m=(b[1]-a[1])/(b[0]-a[0]),bb=a[1]-m*a[0],baselineSlope=(c.sourceEndpointY[1]-c.sourceEndpointY[0])/(c.sourceXEnd-c.sourceXStart),key='slice-'+i;
 const transform=[c.scaleX,m*c.scaleX-c.scaleY*baselineSlope,0,c.scaleY,-c.sourceXStart*c.scaleX,bb-m*c.sourceXStart*c.scaleX-c.scaleY*c.sourceEndpointY[0]+c.scaleY*baselineSlope*c.sourceXStart];
 v.clips[key]=[`M${a[0]} 0H${b[0]}V5000H${a[0]}Z`];children.push({tag:'g',clipPath:key,pixelSnapClip:true,children:[{tag:'g',transform,children:[{tag:'use',symbol:'reviewed-roof-source'}]}]});segments.push({x:[a[0],b[0]],transform});
}
v.root={tag:'g',clipPath:'roof',children:[{tag:'g',clipPath:'play',pixelSnapClip:true,children}]};
p.library.push(asset);const e=s.elements.find(e=>e.id==='s38v:body-cavern-roof');assert(e);e.assetId=asset.id;
// Outside-play domain keeps its terrain and silhouette. Match deep-blue material so x0 seam does not flash.
const extE=s.elements.find(e=>e.id==='s38v:body-cavern-roof-domain-left'),ext=structuredClone(p.library.find(a=>a.id===extE.assetId));ext.id='s38-silhouette-v4:ceiling-domain-left';
function recolor(node){if(node.fill&&/^#[0-9a-f]{6}$/i.test(node.fill)){const rgb=[1,3,5].map(i=>parseInt(node.fill.slice(i,i+2),16));const lum=(rgb[0]+rgb[1]+rgb[2])/3;node.fill=lum>100?'#344b5d':lum>70?'#2b4052':lum>45?'#203546':'#172b3a';}for(const x of node.children||[])recolor(x);}
recolor(ext.vector.root);for(const x of Object.values(ext.vector.symbols||{}))recolor(x);p.library.push(ext);extE.assetId=ext.id;
s.design.vectorProduction={...s.design.vectorProduction,status:'silhouette-v4-candidate-not-approved'};
process.env.HONRO_ACT4_RELEASE='1';const g=await runtime({legacyMaps:false});const errors=Array.from(g.HonroVectorArt.validate(asset.vector));assert.deepEqual(errors,[]);const oldTerrain=g.HonroMaps.compile(before,{...p,stages:[before]}).terrain,newTerrain=g.HonroMaps.compile(s,p).terrain;
const oldRoof=oldTerrain.find(t=>t.id==='a4-38-cavern-roof'),newRoof=newTerrain.find(t=>t.id==='a4-38-cavern-roof');assert.notEqual(hash(oldRoof),hash(newRoof));
for(const t of oldTerrain.filter(t=>t.id!=='a4-38-cavern-roof'))assert.deepEqual(newTerrain.find(q=>q.id===t.id),t);
for(const k of ['units','materials','events','encounters','initialState','environment'])assert.deepEqual(s[k],before[k]);assert.deepEqual(s.design.act4,before.design.act4);
await writeFile(dir+'/roof-world-asset.json',JSON.stringify(asset));await writeFile(dir+'/roof-domain-asset.json',JSON.stringify(ext));await writeFile(dir+'/stage-candidate.json',JSON.stringify(s));await writeFile(out+'/candidate-v5.json',JSON.stringify(p));
await writeFile(dir+'/candidate-delta.json',JSON.stringify({sourceStageSha256:hash(before),candidateStageSha256:hash(s),candidateProjectSha256:hash(p),changedTerrain:t.id,originalPoints:c.originalTerrainPoints,changedPoints:t.points,compiledBefore:JSON.parse(JSON.stringify(oldRoof)),compiledAfter:JSON.parse(JSON.stringify(newRoof)),unchangedOtherTerrains:true,unchangedGameplayFields:true,maxCarveWorld:c.maxCarveWorld,sourceArt:source.id,segments,paintAndCollider:'Identical final roof polygon masks BODY; traced outer curve is approximated at0.65world and clipped to authoritative newsolid. No ghost lip drawn beyondcollision.',releaseStatus:'not-approved; movement/projectile and direct image review pending'},null,2));console.log(out+'/candidate-v5.json');
