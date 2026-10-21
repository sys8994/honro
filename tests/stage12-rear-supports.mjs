/** Rear geology is visible support, never a collider or a new walking rim. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createCanvas,Path2D,DOMMatrix} from '@napi-rs/canvas';
import {runtimeEntries} from '../shared/build.mjs';
const baseline='97bcf6029bc9d3999fa356bfc0b3d60296e7251a',old=JSON.parse(execFileSync('git',['show',baseline+':shared/data/campaign.json'],{encoding:'utf8',maxBuffer:30e6})),now=JSON.parse(await readFile('shared/data/campaign.json','utf8')),plain=v=>JSON.parse(JSON.stringify(v));
const clean=s=>{const q=structuredClone(s);delete q.design.geologyComposition;delete q.design.space.terrainAttachments;delete q.design.quarryArt.artAssetIds;return q;};
assert.deepEqual(now.stages.filter(s=>s.metadata.stageId!==12),old.stages.filter(s=>s.metadata.stageId!==12));assert.deepEqual(clean(now.stages[11]),clean(old.stages[11]));
const g=vm.createContext({console,performance,structuredClone,Path2D,DOMMatrix,document:{createElement:()=>createCanvas(1440,900)},navigator:{userAgent:'rear-support-native'},matchMedia:()=>({matches:true})});g.window=g;
for(const e of await runtimeEntries({vector:true,render:true}))vm.runInContext(e.code,g);
const p=g.HONRO_PROJECT,b=g.HonroMaps.createBattle(p.stages[11],p),prior=g.HonroMaps.createBattle(old.stages[11],old);
for(const k of ['terrain','honroWorldTerrain','units','heroes','items','honroMarkers','honroAct2Steps','honroQuarrySpec','honroRouteSpec','honroState','honroCampaignMapRevision'])assert.deepEqual(plain(b[k]??null),plain(prior[k]??null),k+' exact');
assert(!g.HonroMaps.validate(p).some(e=>e.level==='err'));
const prepared=g.HonroGeologyArt.prepare(b);assert.equal(prepared.views.length,3);assert.equal(g.HonroGeologyArt.prepare(b),prepared);
for(const v of prepared.views){assert.equal(v.depthLayer,'L1');assert.equal(v.asset.collision.length,0);assert(v.asset.params.noWalkRim);const i=p.stages[11].design.geologyComposition.instances.find(i=>i.id===v.id),t=b.terrain.find(t=>t.id===i.support.terrainId),socket=i.socket?v.asset.sockets.find(s=>s.id===i.socket):v.asset.reference.foot;assert.equal(v.x+socket.x*v.scale,v.attachment.contactX);assert.equal(v.y+socket.y*v.scale,v.attachment.contactY+(i.support.offsetY||0));assert.equal(v.attachment.contactY,g.HONRO_CORE.topAt(t,v.attachment.contactX,t.y));}
const scene=Object.assign(Object.create(g.HonroScene.prototype),{battle:b,canvas:{clientWidth:1440},scale:.3,x:6200,y:4700,time:0,_staticCacheBuild:true}),cv=createCanvas(1440,900),c=cv.getContext('2d');c.translate(720,450);c.scale(.3,.3);c.translate(-6200,-4700);const before=JSON.stringify(b),matrix=c.getTransform(),filter=c.filter,alpha=c.globalAlpha,calls=[],draw=g.HonroVectorArt.draw;let strokes=0;const stroke=c.stroke.bind(c);c.stroke=(...a)=>{strokes++;return stroke(...a);};g.HonroVectorArt.draw=(cc,a,i)=>{if(i.id.startsWith('quarry-rear-'))calls.push({id:i.id,assetId:a.id,depth:i.visualDepth});return draw(cc,a,i);};
scene._landmarkLayer(c,[],'back');assert.equal(calls.length,3);assert(calls.every(v=>v.depth==='L2'));assert.equal(strokes,0);assert.equal(c.filter,filter);assert.equal(c.globalAlpha,alpha);for(const k of ['a','b','c','d','e','f'])assert.equal(c.getTransform()[k],matrix[k]);assert.equal(JSON.stringify(b),before);
const pixel=(x,y)=>c.getImageData(Math.round(720+(x-6200)*.3),Math.round(450+(y-4700)*.3),1,1).data;
const bridgePoints=[{x:4130,y:4800},{x:7600,y:4500}];
function inside(x,y,ps){let hit=false;for(let i=0,j=ps.length-1;i<ps.length;j=i++){const a=ps[i],z=ps[j];if((a.y>y)!==(z.y>y)&&x<(z.x-a.x)*(y-a.y)/(z.y-a.y)+a.x)hit=!hit;}return hit;}
for(const q of bridgePoints){assert(!b.terrain.some(t=>inside(q.x,q.y,g.HONRO_CORE.poly(t))),'Support point stays outside physical solids');assert(pixel(q.x,q.y)[3]>220,'Opaque common geology bridges former sky gap');}
assert.equal(pixel(6000,4550)[3],0,'Central arch keeps intentional sky/air');
const key=scene._worldCacheKey(b,1440),custom=structuredClone(b);custom.honroCustom=true;custom.honroMap.geologyComposition.brightness=.8;assert.notEqual(scene._worldCacheKey(custom,1440),key);assert.equal(JSON.stringify(b),before);
const unselected=structuredClone(b);unselected.honroCustom=true;delete unselected.honroMap.geologyComposition;const empty=createCanvas(1440,900).getContext('2d');g.HonroGeologyRearSupport.draw(scene,empty,unselected);assert(!empty.getImageData(0,0,1440,900).data.some(v=>v));
const result={pass:true,baseline,canonicalPhysicsStoryExistingElementsExact:true,other29CanonicalExact:true,compiledPhysicsAndStateExact:true,rearRimStrokes:strokes,opaqueBridgePointsOutsidePhysics:bridgePoints,centralSkyPoint:{x:6000,y:4550,alpha:0},calls,preparedCacheReused:true,worldCacheKeyIncludesPresentation:true,renderStatePure:true,contacts:plain(prepared.views.map(({asset,...v})=>v)),scope:'Rear render/occlusion only; no normal combat replay or new completion.'};
await mkdir('/tmp/stage12-rear',{recursive:true});await writeFile('/tmp/stage12-rear/checks.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
