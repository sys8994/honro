import fs from'node:fs';import assert from'node:assert/strict';
const s=fs.readFileSync(new URL('./fixture.mjs',import.meta.url),'utf8'),start=s.indexOf('function stripApprovedBody('),end=s.indexOf('\nif(view.audit)',start),fn=Function(s.slice(start,end)+';return stripApprovedBody;')();
const base={units:[{id:'u',hp:5}],terrain:[{x:1}],honroLandmarks:[{asset:{id:'act1-site:3:body',vector:{p:1},bounds:{x:0},reference:{bounds:{x:0},heightM:2,foot:{x:0}},collision:[],params:{sourceSha256:'original',semanticLayer:'BODY'}}}]},clone=()=>structuredClone(base),norm=x=>fn(x,3,{n:0});
const art=clone();art.honroLandmarks[0].asset.vector={p:2};art.honroLandmarks[0].asset.params.paintBeyondTerrainDomain=true;assert.deepEqual(norm(art),norm(base));
for(const change of [x=>x.units[0].hp++,x=>x.terrain[0].x++,x=>x.honroLandmarks[0].asset.collision.push(1),x=>x.honroLandmarks[0].asset.params.sourceSha256='different',x=>x.honroLandmarks[0].asset.reference.foot.x++]){const bad=clone();change(bad);assert.notDeepEqual(norm(bad),norm(base));}
console.log('PASS only explicit visual keys normalize; HP/terrain/collision/source/foot mutation remains detectable');
