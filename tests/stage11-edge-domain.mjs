/** Actual production compact Stage11, not the retired 33-terrain review map. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {runtimeParts} from '../shared/build.mjs';
const g=vm.createContext({console,structuredClone,performance,setTimeout,clearTimeout});g.window=g;
for(const source of await runtimeParts({vector:false,render:false,productionStory:true}))vm.runInContext(source,g);
const p=g.HONRO_PROJECT,s=p.stages.find(s=>s.metadata?.stageId===11),b=g.HonroMaps.createBattle(s,p);g.HonroStageRules.sanitizeStageBattle(b);new g.HONRO_CORE.Engine(b,()=>{},true);
const plain=v=>JSON.parse(JSON.stringify(v));
assert.equal(s.initialState.honroStage11CompactRevision,1);
assert.deepEqual([s.width,s.height],[6200,3200]);
assert.equal(s.terrains.length,7);assert.equal(b.terrain.length,7);
assert(b.terrain.every(t=>t.indestructible&&t.hp===99999));
assert.equal(g.HonroQuestTargets.records(b).filter(t=>!t.indestructible).length,0);
const l=g.HonroTerrainDomain.materialLandmarks(b).find(l=>l.asset?.id==='act2-traced:stage11-compact-foundation-v1');assert(l);
assert.deepEqual({x:l.x,y:l.y,scale:l.scale},{x:0,y:0,scale:1});
const a=l.asset,v=a.vector;
assert.deepEqual(plain(a.anchor),{x:0,y:0});
assert.deepEqual(plain(a.bounds),{x:-4500,y:1000,w:16500,h:11000});
assert.deepEqual(plain(v.viewBox),[-4500,1000,16500,11000]);
assert.deepEqual(plain(a.collision),[]);
assert.equal(v.root.clipPath,'authoredBody');
assert.deepEqual(plain(v.clips['native-source-alpha']),['M0,0H1536V1024H0Z']);
const nodes=[];const visit=n=>{nodes.push(n);for(const child of n.children||[])visit(child);};visit(v.root);
assert(nodes.some(n=>n.tag==='path'&&n.d==='M 0,512 V 0 h 768 768 v 512 512 H 768 0 Z'&&n.fill==='#9e9ca0'&&(n.opacity??1)===1),'Opaque full-source foundation fill changed');
const t=v.root.children[0].transform;
assert.deepEqual(plain(t),[10.7421875,0,0,10.7421875,-4500,1000]);
// authoredBody reaches world y27200, but it is a mask, not a promise of paint.
// The real 1536x1024 source maps to this rectangle. Do not expand metadata
// just because the canonical collision/mask domain extends farther below it.
const paint={left:t[4],top:t[5],right:t[4]+1536*t[0],bottom:t[5]+1024*t[3]};
assert.deepEqual(paint,{left:-4500,top:1000,right:12000,bottom:12000});
const f=g.HonroBounds.focus(b);assert.deepEqual(plain(f),{left:-320,top:-1800,right:6520,bottom:3440});
const views=[];
for(const [width,height]of [[1331,763],[390,696],[844,390]]){
 const zoom=g.HonroBounds.zoomLimits(width).min,halfW=width/2/zoom,halfH=height/2/zoom;
 const visible={left:f.left-halfW,right:f.right+halfW,bottom:f.bottom+halfH};
 assert(paint.left<=visible.left&&paint.right>=visible.right&&paint.bottom>=visible.bottom);
 // The sky above the terrain is intentionally transparent. Upper coverage is
 // limited by authoredBody: every authored top-edge y is at least1412 >1000.
 assert(paint.top<1412);
 views.push({width,height,zoom,requiredSkirt:visible});
}
console.log(JSON.stringify({stage:11,sourceTerrain:7,battleTerrain:7,destructibleTargets:0,paint,focus:plain(f),views,scope:'Source transform and camera coverage contract; not full visual or gameplay acceptance.'}));
