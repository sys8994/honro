/** Unshipped visual composition contract; not a gameplay or aesthetic pass. */
import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import vm from 'node:vm';
import {applyStage6ArtPreview} from '../tools/stage6-prototype/art-preview.mjs';import {authorStage6Prototype,floor} from '../tools/stage6-prototype/author.mjs';
const input=JSON.parse(readFileSync('shared/data/campaign.json')),physical=authorStage6Prototype(input),preview=applyStage6ArtPreview(input),stage=p=>p.stages.find(s=>s.metadata?.stageId===6),a=stage(physical),b=stage(preview);
for(const key of ['terrains','materials','units','events','objectives','markers'])assert.deepEqual(b[key],a[key],key+' must not change');
assert.deepEqual(preview.stages.filter(s=>s.metadata?.stageId!==6),physical.stages.filter(s=>s.metadata?.stageId!==6));
const assets=preview.library.filter(a=>a.id.startsWith('stage06-prototype:'));assert.equal(assets.length,4);assert(assets.every(a=>a.collision.length===0&&a.params.previewOnly));
const road=b.terrains.find(t=>t.id==='lower-road'),body=assets.find(x=>x.id.includes('assembled-body'));
const contour=road.points.map((p,i)=>(i?'L':'M')+p.x+' '+p.y).join('')+'Z';assert.deepEqual(body.vector.clips.road,[contour]);
for(const id of ['west','mid','east']){const p=assets.find(x=>x.id.endsWith('pier-'+id));assert(Math.abs(p.reference.foot.y-floor(p.reference.foot.x))<1e-7);assert(p.params.groundY>p.params.deckY);}
const g=vm.createContext({console});for(const f of ['vector-art','environment'])vm.runInContext(readFileSync('shared/map/'+f+'.js','utf8'),g);
for(const asset of assets)assert.deepEqual([...g.HonroVectorArt.validate(asset.vector),...g.HonroEnvironment.validate({library:[asset],stages:[]})],[],asset.id);
console.log(JSON.stringify({status:'pass',scope:'unshipped geometry and visual-only assembly invariants; not aesthetic/gameplay acceptance',assetIds:assets.map(a=>a.id),geometrySha256:body.params.prototypeGeometrySha256}));
