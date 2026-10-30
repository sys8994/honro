/** Functional layout authoring only. No game artwork is generated. */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import vm from 'node:vm';
import {readWorldSource} from '../act4-source/world-source.mjs';
const n=Number(process.argv[2]||31),out=process.argv[3]||`_local/reports/act4-pilot/stage${n}/skeleton`;
const spec=JSON.parse(await readFile(`tools/act4-pilot/layouts/stage${n}.json`,'utf8'));
const world=JSON.parse((await readWorldSource()).bytes),s=structuredClone(world.stages.find(s=>s.id===`stage-${n}`));
const xy=ps=>ps.map(([x,y])=>({x,y}));
s.width=spec.width;s.height=spec.height;
s.terrains=spec.surfaces.map(f=>({id:`pilot${n}-${f.id}`,type:'solid',baseMaterial:f.material||(f.kind==='ground'?'soil':'rock'),oneWay:!['ground','overhang'].includes(f.kind),breakable:false,layer:'terrain',points:xy([...f.top,...(f.bottom||(f.kind==='ground'?[[spec.width,spec.height],[0,spec.height]]:[...f.top].reverse().map(([x,y])=>[x,y+(f.thickness||80)])))]),properties:{honroWalkEdges:f.top.slice(1).map((_,i)=>i),surfaceKind:f.kind==='ground'?'bank':'ledge'},detail:{roughness:0,spacing:24,optimizeEpsilon:0}}));
for(const c of spec.covers||[])s.terrains.push({id:`pilot${n}-${c.id}`,type:'solid',baseMaterial:'rock',oneWay:false,breakable:false,points:xy([[c.x,c.y-c.h],[c.x+c.w,c.y-c.h],[c.x+c.w,c.y],[c.x,c.y]])});
const sy=(id,x)=>{const f=spec.surfaces.find(f=>f.id===id);for(let i=1;i<f.top.length;i++){const a=f.top[i-1],b=f.top[i];if(x>=a[0]&&x<=b[0])return a[1]+(b[1]-a[1])*(x-a[0])/(b[0]-a[0]);}throw Error(`No support ${id} @ ${x}`)};
const spawn=spec.spawn||{x:260,y:sy('shore',260)};
s.units=s.units.filter(u=>u.team!=='enemy');for(const u of s.units.filter(u=>u.team==='player'))u.y=spawn.y;
s.anchors={...s.anchors,spawn,start:spawn};s.encounters=[];s.materials=[];
s.elements=s.elements.filter(e=>n===31&&['a4:dock','a4:boat'].includes(e.assetId));
if(spec.boarding){s.design.act4.boarding=spec.boarding;for(const e of s.elements){if(e.assetId==='a4:dock')e.y=spec.boarding.deckY+43*e.scale;else e.y=spec.boarding.approachY;}s.design.act4.waterPolicies=[{id:'31-dock-water',kind:'recover',x1:6238,x2:s.width,surface:spec.boarding.deckY+30,entryLeft:[5600,6220],entryRight:[5600,6220]}];}
if(spec.act4)Object.assign(s.design.act4,spec.act4);
if(spec.npcs)for(const [i,u]of s.units.filter(u=>u.team==='npc').entries())Object.assign(u,spec.npcs[i]);
s.initialState.honroAct4Design=structuredClone(s.design.act4);
// Remove obsolete art/source contracts, not story or objective contracts.
for(const k of ['vectorGround','sharedOutdoorArt','vectorWaterContinuation','productionBlueprint'])delete s.design[k];
s.design.pilotSkeleton={version:1,source:`tools/act4-pilot/layouts/stage${n}.json`,status:spec.status,activePlayBounds:spec.activePlayBounds,routes:spec.routes,enemyAnchors:spec.enemyAnchors.map(a=>({...a,y:sy(a.support,a.x),supportId:`pilot${n}-${a.support}`}))};
delete s.playBounds;delete s.terrainBounds;delete s.terrainDomainVersion;
// The official domain author expands this single collision geography; no skirts.
const g={HonroGeometry:{terrain:t=>{const ps=t.points;return{x:Math.min(...ps.map(p=>p.x)),y:Math.min(...ps.map(p=>p.y)),w:Math.max(...ps.map(p=>p.x))-Math.min(...ps.map(p=>p.x)),h:Math.max(...ps.map(p=>p.y))-Math.min(...ps.map(p=>p.y)),vertices:ps,oneWay:t.oneWay}},oneWay:t=>t.oneWay}};g.globalThis=g;
vm.runInNewContext(await readFile('shared/map/terrain-domain.js','utf8'),g);
const st=g.HonroTerrainDomain.author({version:6,stages:[s]}).stages[0];const errors=g.HonroTerrainDomain.validate(st);if(errors.length)throw Error(JSON.stringify(errors));
await mkdir(out,{recursive:true});await writeFile(out+'/stage.json',JSON.stringify(st,null,2));await writeFile(out+'/blueprint.json',JSON.stringify(spec,null,2));
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;');
function svg(box){return `<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="${Math.round(1400*box.h/box.w)}" viewBox="${box.x} ${box.y} ${box.w} ${box.h}"><rect x="${box.x}" y="${box.y}" width="${box.w}" height="${box.h}" fill="#f7f8fa"/>`+s.terrains.map(t=>`<polygon points="${t.points.map(p=>p.x+','+p.y).join(' ')}" fill="${t.oneWay?'#b8d6e2':'#a6acb2'}" stroke="${t.oneWay?'#4d7c93':'#646d74'}" stroke-width="8"/>`).join('')+spec.surfaces.map(f=>`<polyline points="${f.top.map(p=>p.join(',')).join(' ')}" fill="none" stroke="#26354a" stroke-width="12"/><text x="${f.top[0][0]+20}" y="${f.top[0][1]+65}" font-size="44" fill="#26354a">${esc(f.id)}</text>`).join('')+(spec.covers||[]).map(c=>`<rect x="${c.x}" y="${c.y-c.h}" width="${c.w}" height="${c.h}" fill="#75869a"/>`).join('')+st.design.pilotSkeleton.enemyAnchors.map(a=>`<circle cx="${a.x}" cy="${a.y-70}" r="36" fill="none" stroke="#a43d3d" stroke-width="10"/>`).join('')+`<circle cx="${spawn.x}" cy="${spawn.y-50}" r="32" fill="#26836e"/><text x="100" y="150" font-size="65">STAGE ${n} — TECHNICAL COLLIDER SKELETON / NOT ART</text></svg>`;}
await writeFile(out+'/full.svg',svg({x:0,y:0,w:s.width,h:s.height}));for(const c of spec.cameraViews)await writeFile(out+`/camera-${c.id}.svg`,svg({x:c.x-c.w/2,y:c.y-c.h/2,w:c.w,h:c.h}));
await writeFile(out+'/README.md',`# Stage ${n} skeleton\n\nFunctional colliders only. Terrain-domain validation: zero errors. Source stage story/objective IDs retained; enemy roster deliberately empty for combat owner. Art and environment integration pending. activePlayBounds are authored targets, NOT measured reachable bounds. Kinematics and whole-run jumps/drops/rounds remain unverified.\n\n${spec.intent}\n`);
console.log(JSON.stringify({out,terrainCount:st.terrains.length,domainErrors:errors,activePlayBounds:spec.activePlayBounds}));
