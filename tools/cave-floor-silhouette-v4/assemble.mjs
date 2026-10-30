import {readFile,writeFile,mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {runtime} from '../../game/tests/helpers.mjs';
const D='art/stage38-floor-silhouette-v4',O='_local/reports/cave-floor-silhouette-v4';await mkdir(O,{recursive:true});
const read=async p=>JSON.parse(await readFile(p)),hash=o=>createHash('sha256').update(JSON.stringify(o)).digest('hex');
const p=await read('_local/reports/cave-silhouette-v4/candidate-v5.json'),before=structuredClone(p.stages[0]),s=p.stages[0],c=await read(D+'/contour.json'),src=await read(D+'/source-asset.json');
const t=s.terrains.find(t=>t.id==='a4-38-land');assert.deepEqual(t.points,c.originalPoints);t.points=c.changedPoints;
const legacyContact=p.library.find(a=>a.id==='s38v:contact-surface');legacyContact.reference.heightM=legacyContact.reference.bounds.h/60;
const el=s.elements.find(e=>e.id==='s38v:body-land'),old=structuredClone(p.library.find(a=>a.id===el.assetId));
const polygon=ps=>ps.map((q,i)=>(i?'L':'M')+q.x+' '+q.y).join(' ')+'Z';
const a=structuredClone(src);a.id='s38-floor-v4:west-land';a.name='새벽 해식굴 침식 보행면';a.bounds={x:0,y:2700,w:3300,h:1700};a.reference={...a.reference,bounds:a.bounds,foot:{x:0,y:2800},scaleRange:[1,1],backgroundRange:[1,1]};a.anchor={x:0,y:0};a.params={...a.params,collisionAuthority:t.id,protectedPlateau:'2350..3300 at3050',sourceContour:'contour.json'};
const v=a.vector;v.symbols={...v.symbols,source:v.root};v.clips={...v.clips,solid:[polygon(t.points)],play:['M0 0H3300V5000H0Z']};v.viewBox=[0,2700,3300,1700];const children=[{tag:'path',d:polygon(t.points),fill:'#213646'}];
for(let i=0;i<c.segments.length;i++){const z=c.segments[i],k='slice'+i;v.clips[k]=[`M${z.worldRange[0]} 0H${z.worldRange[1]}V5000H${z.worldRange[0]}Z`];children.push({tag:'g',clipPath:k,pixelSnapClip:true,children:[{tag:'g',transform:z.transform,children:[{tag:'use',symbol:'source'}]}]});}
// Continue the same authored material across the protected flat recovery plateau.
// BODY is clipped by that exact existing solid; the unchanged contact rim owns its flat edge.
v.clips.recovery=['M2350 0H3300V5000H2350Z'];const recoveryScale=950/(2140-1700);
children.push({tag:'g',clipPath:'recovery',pixelSnapClip:true,children:[{tag:'g',transform:[recoveryScale,0,0,c.scaleY,2350-1700*recoveryScale,3050-c.scaleY*c.sourceY[2]],children:[{tag:'use',symbol:'source'}]}]});
v.root={tag:'g',clipPath:'solid',children:[{tag:'g',clipPath:'play',pixelSnapClip:true,children}]};p.library.push(a);el.assetId=a.id;
const rimEl=s.elements.find(e=>e.id==='s38v:contact-surface'),rim=structuredClone(p.library.find(a=>a.id===rimEl.assetId));rim.id='s38-floor-v4:unmodified-contact';rim.reference.heightM=rim.reference.bounds.h/60;rim.vector.clips['a4-38-land-owned']=['M-6000 0H0V5000H-6000Z','M2350 0H3300V5000H2350Z'];delete rim.vector.root.children[0].pixelSnapClip;p.library.push(rim);rimEl.assetId=rim.id;
// New floor authority only. No actor, event, exit or recovery configuration edits.
for(const key of ['units','materials','events','encounters','initialState','environment'])assert.deepEqual(s[key],before[key]);for(const terrain of before.terrains.filter(x=>x.id!==t.id))assert.deepEqual(s.terrains.find(x=>x.id===terrain.id),terrain);
process.env.HONRO_ACT4_RELEASE='1';const g=await runtime({legacyMaps:false});assert.deepEqual(Array.from(g.HonroVectorArt.validate(v)),[]);const compiled=g.HonroMaps.compile(s,p).terrain.find(x=>x.id===t.id);assert(compiled.vertices.length>5);
await writeFile(D+'/world-asset.json',JSON.stringify(a));await writeFile(D+'/contact-asset.json',JSON.stringify(rim));await writeFile(D+'/stage-candidate.json',JSON.stringify(s));await writeFile(O+'/candidate-v4.json',JSON.stringify(p));await writeFile(D+'/delta.json',JSON.stringify({ceilingBaseSha:hash(before),candidateSha:hash(s),projectSha:hash(p),changedTerrain:t.id,sourceBefore:c.originalPoints,sourceAfter:t.points,compiledAfter:compiled,protectedRecovery:c.protectedPlateau,unchangedOtherTerrain:true,unchangedGameplayFields:true,status:'pending direct art and physical QA'},null,2));console.log(O+'/candidate-v4.json');
