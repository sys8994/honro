/** Reuses existing common bamboo/cover/FORE, substitutes a single semantic BODY.
 * Does not derive or mutate terrain collision. */
import{readFile,writeFile}from'node:fs/promises';
import{extendBodyDomain}from'../vector-production/extend-body-domain.mjs';
import{deduplicateAsset}from'../vector-production/deduplicate-vector.mjs';
const clone=x=>JSON.parse(JSON.stringify(x));
const p=JSON.parse(await readFile('art/stage35-vector-production/skeleton-project.json','utf8')),s=p.stages[0];
const commonIds=['a4-production:bamboo-clump','a4-production:bamboo-mist','a4-production:thick-bamboo-cover','a4-production:broken-stone-wall','a4-production:bamboo-foreground'];p.library=p.library.filter(a=>!commonIds.includes(a.id)&&!a.id.startsWith('s35v:'));
const bamboo=JSON.parse(await readFile('art/stage35-vector-production/bamboo-clump-asset.json','utf8'));bamboo.reference.scaleRange=[.1,4];bamboo.reference.backgroundRange=[.1,4];p.library.push(bamboo);
for(const e of s.elements.filter(e=>e.assetId.includes('bamboo-background'))){e.assetId=bamboo.id;e.scale*=.58;}
const far=clone(bamboo);far.id='a4-production:bamboo-mist';far.params.semanticLayer='REAR';
function mist(n){if(n.fill&&/^#[0-9a-f]{6}$/i.test(n.fill)){const rgb=[1,3,5].map(i=>parseInt(n.fill.slice(i,i+2),16));n.fill='#'+rgb.map((v,i)=>Math.round(v*.42+[158,183,184][i]*.58).toString(16).padStart(2,'0')).join('');}for(const c of n.children||[])mist(c);}mist(far.vector.root);p.library.push(far);
for(const e of s.environment.placements.filter(e=>e.assetId.includes('bamboo'))){e.assetId=far.id;e.scale*=.6;}
for(const e of s.elements.filter(e=>e.assetId===bamboo.id)){if(e.x===3500){e.x=3660;e.scale=.45;}if(e.x===4500)e.scale=.44;}

const cover=JSON.parse(await readFile('art/stage35-vector-production/bamboo-cover-asset.json','utf8'));
const originalCover=p.library.find(a=>a.id==='a4:thick-bamboo');cover.collision=clone(originalCover.collision);cover.reference.scaleRange=[.1,4];cover.reference.backgroundRange=[.1,4];p.library.push(cover);
for(const e of s.elements.filter(e=>e.assetId==='a4:thick-bamboo'))e.assetId=cover.id;

const wall=JSON.parse(await readFile('art/stage35-vector-production/old-wall-asset.json','utf8'));wall.collision=clone(p.library.find(a=>a.id==='a4:old-wall').collision);wall.reference.scaleRange=[.1,4];p.library.push(wall);for(const e of s.elements.filter(e=>e.assetId==='a4:old-wall'))e.assetId=wall.id;
// Remove flat legacy decorative rubble only; physical old-wall instances remain unchanged.
s.elements=s.elements.filter(e=>e.assetId!=='a4-art:rubble-wall');
const fore=clone(bamboo);fore.id='a4-production:bamboo-foreground';fore.params.semanticLayer='FORE';
function shade(n){if(n.fill&&/^#[0-9a-f]{6}$/i.test(n.fill)){const rgb=[1,3,5].map(i=>parseInt(n.fill.slice(i,i+2),16));n.fill='#'+rgb.map((v,i)=>Math.round(v*.37+[7,12,14][i]).toString(16).padStart(2,'0')).join('');}for(const ch of n.children||[])shade(ch);}shade(fore.vector.root);p.library.push(fore);
for(const [x,y,scale]of [[2070,4050,1.35],[4310,4000,1.12]])s.elements.push({id:'s35v:fore-bamboo-'+x,assetId:fore.id,x,y,scale,rotation:x===2070?0:-.0872664626,depthLayer:'L1',layer:'front'});

s.elements=s.elements.filter(e=>!/^s35v:(body|rear)/.test(e.id));p.library=p.library.filter(a=>!/^s35v:(body|rear)/.test(a.id));
let body=JSON.parse(await readFile('art/stage35-vector-production/ground-continuous-asset.json','utf8'));
const d=s.terrains[0].points.map((q,i)=>(i?'L':'M')+q.x+' '+q.y).join(' ')+'Z';
// Separate rear soil bank; 24world depth tapering to zero near vertical stair corners.
// Contact/collision remains untouched; duplicate block-like caps are deliberately avoided.
const rear=clone(body);rear.id='s35v:rear-continuous';rear.params.semanticLayer='REAR';delete rear.vector.clips;while(rear.vector.root.clipPath)rear.vector.root=rear.vector.root.children[0];
const pts=s.terrains[0].points,stairs=pts.filter((q,i)=>i&&q.x===pts[i-1].x&&q.y!==pts[i-1].y&&q.y<3000).map(q=>q.x);const bankD=pts.map((q,i)=>{const nearest=Math.min(...stairs.map(x=>Math.abs(x-q.x)));const depth=q.y<3000?24*Math.min(1,nearest/100):0;return(i?'L':'M')+q.x+' '+(q.y-depth);}).join(' ')+'Z';
rear.vector.clips={bank:[bankD]};rear.vector.root={tag:'g',clipPath:'bank',children:[{tag:'path',d:bankD,fill:'#606b57'},rear.vector.root]};

const expanded=extendBodyDomain(body,{terrainPoints:pts,left:-280,right:7480,baseColor:'#354852',deepTop:3400,deepBottom:4400});body=expanded.body;
for(const ext of expanded.extensions){p.library.push(ext);s.elements.push({id:ext.id,assetId:ext.id,x:0,y:0,scale:1,depthLayer:'L1',layer:'front'});}
p.library.push(rear,body);
s.elements.unshift({id:rear.id,assetId:rear.id,x:0,y:0,scale:1,depthLayer:'L1',layer:'back'});
const foreIndex=s.elements.findIndex(e=>e.id.startsWith('s35v:fore-'));
s.elements.splice(foreIndex<0?s.elements.length:foreIndex,0,{id:body.id,assetId:body.id,x:0,y:0,scale:1,depthLayer:'L1',layer:'front'});
s.design.vectorGround={version:1,baseColor:process.env.S35_BASE_COLOR||'#354852',visualDepth:'L1'};
s.design.production??={};s.design.production.artStatus='continuous BODY visual review; no automatic approval';
const deduplication=[];p.library=p.library.map(a=>{if(!a.id.startsWith('s35v:'))return a;const result=deduplicateAsset(a);deduplication.push({id:a.id,...result.report});return result.asset;});
await writeFile('art/stage35-vector-production/symbol-storage-validation.json',JSON.stringify(deduplication,null,2));
const library=p.library.filter(a=>commonIds.includes(a.id)||a.id.startsWith('s35v:'));for(const a of library){let nodes=0,paths=0,maxPath=0;const walk=n=>{if(n.tag==='use'){walk(a.vector.symbols[n.symbol]);return;}nodes++;if(n.tag==='path'){paths++;maxPath=Math.max(maxPath,n.d.length);}for(const c of n.children||[])walk(c);};if(a.vector)walk(a.vector.root);a.params={...a.params,optimizedVector:{nodes,paths,maxPathChars:maxPath,embeddedBitmap:false}};}
await writeFile('art/stage35-vector-production/stage35-production-package.json',JSON.stringify({version:1,status:'verified production candidate; parent release review pending',stage:s,library,authoring:'tools/stage35-production/assemble-continuous.mjs',scope:'Stage-specific ground plus reusable bamboo/cover/wall; original terrain and gameplay event contracts retained'}));
await writeFile('art/stage35-vector-production/continuous-project.json',JSON.stringify(p));
const without=clone(p);without.stages[0].elements=without.stages[0].elements.filter(e=>!e.id.startsWith('s35v:fore-'));
await writeFile('art/stage35-vector-production/continuous-no-fore-project.json',JSON.stringify(without));
