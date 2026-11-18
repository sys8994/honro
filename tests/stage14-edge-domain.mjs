/** Final compact Stage14; independent Native samples, not public gameplay acceptance. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {createCanvas,Path2D,DOMMatrix} from '@napi-rs/canvas';
import {runtimeParts} from '../shared/build.mjs';
const g=vm.createContext({console,structuredClone,performance,Path2D,DOMMatrix,setTimeout,clearTimeout});g.window=g;
for(const source of await runtimeParts({vector:true,render:false,productionStory:true}))vm.runInContext(source,g);
const p=g.HONRO_PROJECT,s=p.stages.find(s=>s.metadata?.stageId===14),b=g.HonroMaps.createBattle(s,p);g.HonroStageRules.sanitizeStageBattle(b);new g.HONRO_CORE.Engine(b,()=>{},true);
const plain=v=>JSON.parse(JSON.stringify(v));
assert.equal(s.initialState.honroAct2CompactRevision,1);assert.deepEqual([s.width,s.height],[4800,5400]);
assert.equal(s.terrains.length,4);assert.equal(b.terrain.length,4);assert(b.terrain.every(t=>t.indestructible&&t.hp===99999));
assert.equal(g.HonroQuestTargets.records(b).filter(t=>!t.indestructible).length,0);
const ls=g.HonroTerrainDomain.materialLandmarks(b),floor=ls.find(l=>l.asset?.id==='act2-compact:stage14-low-domain'),roof=ls.find(l=>l.asset?.id==='act2-compact:stage14-vault-domain');assert(floor&&roof);
for(const l of [floor,roof])assert.deepEqual({x:l.x,y:l.y,scale:l.scale},{x:0,y:0,scale:1});
const before=JSON.stringify({s,assets:[floor.asset,roof.asset],placements:[floor.x,floor.y,roof.x,roof.y]});
const f=g.HonroBounds.focus(b);assert.deepEqual(plain(f),{left:-320,top:-1800,right:5120,bottom:5640});
const views=[];let left=Infinity,right=-Infinity,bottom=-Infinity;
for(const [width,height] of [[1331,763],[390,696],[844,390]]){const zoom=g.HonroBounds.zoomLimits(width).min,v={left:f.left-width/2/zoom,right:f.right+width/2/zoom,bottom:f.bottom+height/2/zoom};left=Math.min(left,v.left);right=Math.max(right,v.right);bottom=Math.max(bottom,v.bottom);views.push({width,height,zoom,visible:v});}
// Registration alone is not proof of painted coverage. Draw the actual final
// vector at a 20-world-unit pixel grid across the required lower skirt.
// Sky/roof exterior is intentionally transparent and is not a filled rectangle.
const scale=.05,top=6000,w=Math.ceil((right-left)*scale),h=Math.ceil((bottom-top)*scale),cv=createCanvas(w,h),c=cv.getContext('2d');c.scale(scale,scale);c.translate(-left,-top);assert(g.HonroVectorArt.draw(c,floor.asset,{x:0,y:0,scale:1}));
const rgba=c.getImageData(0,0,w,h).data;let minAlpha=255;for(let i=3;i<rgba.length;i+=4)minAlpha=Math.min(minAlpha,rgba[i]);assert.equal(minAlpha,255,'Lower skirt has transparent sampled pixels');
// Upper vault is a domain-backed rock mass, not a tree asset. Verify actual
// opacity above the cavern at the most extreme permitted portrait focus.
const upperTop=Math.min(...views.map(v=>f.top-v.height/2/v.zoom)),upperBottom=-1000;
const uc=createCanvas(w,Math.ceil((upperBottom-upperTop)*scale)).getContext('2d');uc.scale(scale,scale);uc.translate(-left,-upperTop);assert(g.HonroVectorArt.draw(uc,roof.asset,{x:0,y:0,scale:1}));
const up=uc.getImageData(0,0,w,uc.canvas.height).data;let upperMinAlpha=255;for(let i=3;i<up.length;i+=4)upperMinAlpha=Math.min(upperMinAlpha,up[i]);assert.equal(upperMinAlpha,255,'Upper vault has transparent sampled pixels');
assert.equal(JSON.stringify({s,assets:[floor.asset,roof.asset],placements:[floor.x,floor.y,roof.x,roof.y]}),before);
console.log(JSON.stringify({stage:14,sourceTerrain:4,battleTerrain:4,destructibleTargets:0,views,lowerSample:{left,right,top,bottom,minAlpha,worldUnitsPerPixel:20},upperSample:{left,right,top:upperTop,bottom:upperBottom,minAlpha:upperMinAlpha,worldUnitsPerPixel:20},sourceUnchanged:true,scope:'Native sampled alpha and source contracts only; does not certify all visual joins or public gameplay.'}));
