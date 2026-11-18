/** Stage16 actual final composition: local floor assets are not full-domain art. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {createCanvas,Path2D,DOMMatrix,Image} from '@napi-rs/canvas';
import {runtimeParts} from '../shared/build.mjs';
const document={createElement:tag=>{assert.equal(tag,'canvas');return createCanvas(1,1)}};
const g=vm.createContext({console,structuredClone,performance,Path2D,DOMMatrix,Image,document,devicePixelRatio:1,matchMedia:()=>({matches:false}),navigator:{userAgent:'honro-native-probe'},setTimeout,clearTimeout});g.window=g;
for(const source of await runtimeParts({vector:true,render:true,productionStory:true}))vm.runInContext(source,g);
const p=g.HONRO_PROJECT,s=p.stages.find(s=>s.metadata?.stageId===16),b=g.HonroMaps.createBattle(s,p);g.HonroStageRules.sanitizeStageBattle(b);new g.HONRO_CORE.Engine(b,()=>{},true);
assert.equal(s.initialState.honroAct2CompactRevision,1);assert.deepEqual([s.width,s.height],[6400,4000]);assert.equal(s.terrains.length,26);assert.equal(b.terrain.length,26);assert(b.terrain.every(t=>t.indestructible&&t.hp===99999));assert.equal(g.HonroQuestTargets.records(b).filter(t=>!t.indestructible).length,0);
const plain=v=>JSON.parse(JSON.stringify(v)),f=g.HonroBounds.focus(b);assert.deepEqual(plain(f),{left:-320,top:-1800,right:6720,bottom:4240});
const before=JSON.stringify({s,b}),ls=g.HonroTerrainDomain.materialLandmarks(b),roof=ls.find(l=>l.asset?.id==='act2-compact:stage16-act2-stage16-traced-roof-1');assert(roof);
const views=[];for(const [width,height]of [[1331,763],[390,696],[844,390]]){const zoom=g.HonroBounds.zoomLimits(width).min;views.push({width,height,zoom,left:f.left-width/2/zoom,right:f.right+width/2/zoom,top:f.top-height/2/zoom,bottom:f.bottom+height/2/zoom});}
const left=Math.min(...views.map(v=>v.left)),right=Math.max(...views.map(v=>v.right)),upper=Math.min(...views.map(v=>v.top)),lower=Math.max(...views.map(v=>v.bottom));
// 20-world-unit/pixel opacity samples certify coverage, not full seam aesthetics.
function probe(top,bottom,paint){const scale=.05,w=Math.ceil((right-left)*scale),h=Math.ceil((bottom-top)*scale),cv=createCanvas(w,h),c=cv.getContext('2d');c.scale(scale,scale);c.translate(-left,-top);paint(c,cv);const data=c.getImageData(0,0,w,h).data;let minAlpha=255;for(let i=3;i<data.length;i+=4)minAlpha=Math.min(minAlpha,data[i]);assert.equal(minAlpha,255);return{left,right,top,bottom,worldUnitsPerPixel:20,minAlpha};}
const lowerSample=probe(6000,lower,(c,cv)=>{const scene=new g.HonroScene(cv);scene.battle=b;scene.scale=.05;scene._landmarkLayer(c,ls,'back');scene._landmarkLayer(c,ls,'structural-back');for(const t of g.HonroTerrainDomain.render(b))if(!t.broken)scene.terrain(c,t);});
const upperSample=probe(upper,-3000,c=>assert(g.HonroVectorArt.draw(c,roof.asset,{x:roof.x,y:roof.y,scale:roof.scale})));
// Native camera frames overlap when placed side by side. A contact-sheet join
// is not an authored notch. These unchanged canonical points span the crown.
const rt=s.terrains.find(t=>t.id==='cave-roof');for(const [x,y]of [[2710,-1140],[4210,-1290],[5410,-970]])assert(rt.points.some(p=>p.x===x&&p.y===y));
assert.equal(JSON.stringify({s,b}),before,'Read-only composition probe changed source/battle');
console.log(JSON.stringify({stage:16,sourceTerrain:26,battleTerrain:26,destructibleTargets:0,views,lowerSample,upperSample,sourceUnchanged:true,scope:'Final native procedural/native-art coverage samples. Local floor trace alpha outside its bbox is not a defect. Not public UI, gameplay, or all seam acceptance.'}));
