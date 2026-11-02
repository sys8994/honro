/** Same production renderer methods for master and candidate; baseline may fail. */
import assert from 'node:assert/strict';import{readFile}from'node:fs/promises';import path from'node:path';
const root=process.argv[2]||'.',stale=process.argv.includes('--stale-bounds'),source=await readFile(path.join(root,'shared/runtime/renderer.js'),'utf8');
const method=(a,z)=>{const start=source.indexOf('        '+a+'('),end=source.indexOf('        '+z+'(');return start<0?null:source.slice(start,end)};
let view={left:1000,right:1200,top:0,bottom:200},calls=[];
const G={HonroBounds:{viewport:()=>view},HonroGeometry:{transformPoint(p,a,l){const s=l.scale??1;return{x:l.x+(p.x-(a.anchor?.x||0))*s,y:l.y+(p.y-(a.anchor?.y||0))*s}}}};
const names=[method('_landmarkPaintBounds','_landmarkVisible'),method('_landmarkVisible','_worldCacheKey'),method('_drawStaticWorldCached','_terrainPaintBounds')].filter(Boolean).join(',');
const scene=new Function('G','return({'+names+'})')(G);scene._buildStaticWorld=()=>({canvas:{width:1,height:1}});scene._landmarkLayer=(c,items,layer)=>{if(layer==='structural-back')calls.push(...items.map(l=>l.id));};
const c={drawImage(){},save(){},restore(){},beginPath(){},rect(){},clip(){}},big={id:'large-outside-origin',x:-6000,y:0,asset:{bounds:{x:0,y:0,w:stale?100:8000,h:200},vector:{version:1,viewBox:[0,0,8000,200],root:{tag:'path',d:'M0 0H8000V200H0Z',fill:'#ffffff'}}}},b={width:1000,height:500,honroLandmarks:[big]};
scene._drawStaticWorldCached(c,b,200,200);const result={root,visible:scene._landmarkVisible(big,view),painted:calls.includes(big.id),origin:big.x,worldWidth:b.width,staleBounds:stale};
assert.equal(result.visible,true,'valid transformed bounds must be visible');assert.equal(result.painted,true,'large asset with outside origin reaches the viewport');
for(const bounds of [undefined,{x:NaN,y:0,w:10,h:10}]){const obj={id:'fallback',x:1050,y:50,asset:bounds?{bounds}:{}};calls=[];b.honroLandmarks=[obj];scene._drawStaticWorldCached(c,b,200,200);assert.equal(scene._landmarkVisible(obj,view),true,'missing/invalid bounds use conservative fallback');assert(calls.includes('fallback'));}
console.log('PASS large outside-origin crossing and missing/invalid fallback',JSON.stringify(result));
