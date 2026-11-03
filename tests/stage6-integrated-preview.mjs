/** Exact composition checks only; not an artistic or gameplay acceptance. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {applyStage6ArtPreview} from '../tools/stage6-prototype/art-preview.mjs';
import {applyStage6IntegratedPreview} from '../tools/stage6-prototype/integrated-preview.mjs';
import {brokenDeckEdges} from '../tools/stage6-prototype/broken-deck-edges.mjs';
const input=JSON.parse(readFileSync('shared/data/campaign.json'));
const original=input.stages.find(x=>x.metadata?.stageId===6);original.design??={};original.design.positioning??={};original.design.positioning.clusterPositions={...(original.design.positioning.clusterPositions||{}),'foe-6-cluster':{},'foe-2-cluster':{}};
const art=applyStage6ArtPreview(input),physical=brokenDeckEdges(art),combined=applyStage6IntegratedPreview(art),stage=p=>p.stages.find(s=>s.metadata?.stageId===6),a=stage(art),b=stage(physical),c=stage(combined);
assert.deepEqual(combined.stages.filter(x=>x.metadata?.stageId!==6),art.stages.filter(x=>x.metadata?.stageId!==6));
for(const key of ['terrains','materials','units','events','objectives','markers'])assert.deepEqual(c[key],b[key],key);
for(const key of ['events','objectives','markers'])assert.deepEqual(c[key],a[key],key+' preserved');
assert.deepEqual(c.units.map(x=>x.id),a.units.map(x=>x.id));
for(const id of ['pier-west','pier-east','lower-road'])assert.deepEqual(c.terrains.find(x=>x.id===id),a.terrains.find(x=>x.id===id),id+' exact original geometry');
assert(!c.elements.some(x=>x.id==='place6-west-rock'));
const rock=c.elements.find(x=>x.id==='place6-east-rock');assert.deepEqual({x:rock.x,y:rock.y,scale:rock.scale},{x:5050,y:2430.12,scale:.48});
const marks=combined.library.find(x=>x.id==='stage06-prototype:deck-fracture-study');
for(const id of ['west','mid','east']){const t=c.terrains.find(x=>x.id==='bridge-'+id);assert.deepEqual(marks.vector.clips[id],[t.points.map((p,i)=>(i?'L':'M')+p.x+' '+p.y).join('')+'Z']);}
for(const asset of combined.library.filter(x=>x.id.startsWith('stage06-prototype:')))assert.deepEqual(asset.collision,[]);
assert.throws(()=>applyStage6IntegratedPreview(combined),/once/);
console.log(JSON.stringify({status:'pass',scope:'37th art plus unchanged prior broken deck/rock physics candidate; not acceptance',stageGeometrySha256:createHash('sha256').update(JSON.stringify(c.terrains)).digest('hex'),previewAssets:combined.library.filter(x=>x.id.startsWith('stage06-prototype:')).map(x=>x.id)}));
