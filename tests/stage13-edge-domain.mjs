/** Final compact Stage13; independent Native samples, not public gameplay acceptance. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {createCanvas,Path2D,DOMMatrix} from '@napi-rs/canvas';
import {runtimeParts} from '../shared/build.mjs';
const g=vm.createContext({console,structuredClone,performance,Path2D,DOMMatrix,setTimeout,clearTimeout});g.window=g;
for(const source of await runtimeParts({vector:true,render:false,productionStory:true}))vm.runInContext(source,g);
const p=g.HONRO_PROJECT,s=p.stages.find(s=>s.metadata?.stageId===13),b=g.HonroMaps.createBattle(s,p);g.HonroStageRules.sanitizeStageBattle(b);new g.HONRO_CORE.Engine(b,()=>{},true);
const plain=v=>JSON.parse(JSON.stringify(v));
assert.equal(s.initialState.honroAct2CompactRevision,1);assert.deepEqual([s.width,s.height],[5200,4600]);
assert.equal(s.terrains.length,13);assert.equal(b.terrain.length,13);assert(b.terrain.every(t=>t.indestructible&&t.hp===99999));
assert.equal(g.HonroQuestTargets.records(b).filter(t=>!t.indestructible).length,0);
const ls=g.HonroTerrainDomain.materialLandmarks(b),floor=ls.find(l=>l.asset?.id==='act2-compact:stage13-act2-stage13-traced-extension-v2-1'),roof=ls.find(l=>l.asset?.id==='act2-compact:stage13-act2-stage13-traced-roof-v2-1');assert(floor&&roof);
for(const l of [floor,roof])assert.deepEqual({x:l.x,y:l.y,scale:l.scale},{x:0,y:0,scale:1});
// The upper roof is a canonical physical contour, not a rectangular bbox crop.
const rt=s.terrains.find(t=>t.id==='cave-roof');assert(rt);
assert(rt.points.some(q=>q.x===5172.055&&q.y===-3800));
assert.equal(Math.min(...rt.points.map(q=>q.y)),-3800);
assert(roof.asset.vector.clips.canonicalSolid[0].startsWith('M3820,0L4858,-280L6207.4,-950L8075.8,-1900'));
assert(roof.asset.vector.root.children.some(n=>n.transform[0]===.225&&n.transform[4]===3355&&n.transform[5]===-1900));
assert.equal(8075.8*.225+3355,5172.055); // source peak maps exactly to physics peak
assert.equal(-1900-1900,-3800);
const before=JSON.stringify({s,assets:[floor.asset,roof.asset],placements:[floor.x,floor.y,roof.x,roof.y]});
const f=g.HonroBounds.focus(b);assert.deepEqual(plain(f),{left:-320,top:-1800,right:5520,bottom:4840});
const views=[];let left=Infinity,right=-Infinity,bottom=-Infinity;
for(const [width,height] of [[1331,763],[390,696],[844,390]]){const zoom=g.HonroBounds.zoomLimits(width).min,v={left:f.left-width/2/zoom,right:f.right+width/2/zoom,bottom:f.bottom+height/2/zoom};left=Math.min(left,v.left);right=Math.max(right,v.right);bottom=Math.max(bottom,v.bottom);views.push({width,height,zoom,visible:v});}
// Registration alone is not proof of painted coverage. Draw the actual final
// vector at a 20-world-unit pixel grid across the required lower skirt.
// Sky/roof exterior is intentionally transparent and is not a filled rectangle.
const scale=.05,top=5000,w=Math.ceil((right-left)*scale),h=Math.ceil((bottom-top)*scale),cv=createCanvas(w,h),c=cv.getContext('2d');c.scale(scale,scale);c.translate(-left,-top);assert(g.HonroVectorArt.draw(c,floor.asset,{x:0,y:0,scale:1}));
const rgba=c.getImageData(0,0,w,h).data;let minAlpha=255;for(let i=3;i<rgba.length;i+=4)minAlpha=Math.min(minAlpha,rgba[i]);assert.equal(minAlpha,255,'Lower skirt has transparent sampled pixels');
// Upper cave roof, not a tree. A padded 10-world-unit grid detects registration
// overflow without allocating a full 7k x 6k canvas. Sub-grid detail is not certified.
const r=roof.asset.bounds,pad=200,rs=.1,rw=Math.ceil((r.w+pad*2)*rs),rh=Math.ceil((r.h+pad*2)*rs),rcv=createCanvas(rw,rh),rc=rcv.getContext('2d');rc.scale(rs,rs);rc.translate(pad-r.x,pad-r.y);assert(g.HonroVectorArt.draw(rc,roof.asset,{x:0,y:0,scale:1}));
const pix=rc.getImageData(0,0,rw,rh).data;let L=rw,T=rh,R=-1,B=-1;for(let y=0;y<rh;y++)for(let x=0;x<rw;x++)if(pix[(y*rw+x)*4+3]){L=Math.min(L,x);R=Math.max(R,x);T=Math.min(T,y);B=Math.max(B,y);}
assert(R>=0&&L>0&&T>0&&R<rw-1&&B<rh-1);const alpha={left:L/rs+r.x-pad,top:T/rs+r.y-pad,right:(R+1)/rs+r.x-pad,bottom:(B+1)/rs+r.y-pad};
assert(alpha.left>=r.x-10&&alpha.top>=r.y-10&&alpha.right<=r.x+r.w+10&&alpha.bottom<=r.y+r.h+10,'Roof alpha exceeds registration beyond one probe pixel');
assert.equal(JSON.stringify({s,assets:[floor.asset,roof.asset],placements:[floor.x,floor.y,roof.x,roof.y]}),before);
console.log(JSON.stringify({stage:13,sourceTerrain:13,battleTerrain:13,destructibleTargets:0,views,skirtSample:{left,right,top,bottom,width:w,height:h,minAlpha,worldUnitsPerPixel:20},roof:{registered:plain(r),alpha,worldUnitsPerPixel:10},sourceUnchanged:true,scope:'Native sampled alpha and source contracts; no public UI, live combat, or unsampled subpixel certification.'}));
