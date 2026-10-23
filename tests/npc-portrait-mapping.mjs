import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {appHarness} from './app-regression-helpers.mjs';
const h=await appHarness(),g=h.g,c=JSON.parse(await readFile('game/config/npc-portraits.json','utf8')),proposal=JSON.parse(await readFile('game/docs/npc-portraits-20261023/mapping-proposed.json','utf8')),D=JSON.parse(await readFile('shared/data/narrative-current.json','utf8'));
for(const asset of Object.values(c.assets))asset.src=asset.file;g.HONRO_NPC_PORTRAITS=c;vm.runInContext(await readFile('shared/runtime/npc-portraits.js','utf8'),g);const resolve=g.HonroNPCPortraits.resolve,rows=[];
for(const r of proposal.rowMappings){let line=D;for(const part of r.jsonPointer.slice(1).split('/'))line=Array.isArray(line)?line[+part]:line[part];assert.equal(line[2].rowId,r.rowId);assert.equal(line[0],r.sourceSpeaker);const asset=resolve({stage:{id:+r.jsonPointer.split('/')[2]||0}},line[0],line[2],null);if(r.mode==='deferred_keeper')assert.equal(asset?.id,'keeper_ritual');else if(r.mode==='mapped')assert.equal(asset?.id,c.rows[r.rowId].asset);else assert.equal(asset,null);rows.push({rowId:r.rowId,speaker:line[0],asset:asset?.id||null,mode:r.mode});}
const dynamic=[];
for(const stage of [7,14]){const a=h.load(h.profileThrough(20));a.launch(stage);h.finish(a);const markers=a.engine.b.honroMarkers;
 if(stage===14){assert.equal(markers.find(m=>m.id==='family-upper').target,'resident-1');assert.equal(markers.find(m=>m.id==='family-mid').target,'resident-3');for(const [who,id,marker]of [['길찬','resident-1','family-upper'],['중층 주민','resident-3','family-mid']]){const named=c.named[who];delete c.named[who];assert.equal(resolve(a,who,{},a.engine.unit(id)).id,named);const m=markers.find(m=>m.id===marker),target=m.target;m.target='different';assert.equal(resolve(a,who,{},a.engine.unit(id)),null);m.target=target;c.named[who]=named;}}
 else for(const m of markers.filter(m=>m.action==='rescue')){
  for(const first of [true,false]){a.engine.b.honroState.flags['story:sodan-known']=!first;const lines=g.HonroStoryContent.interaction(a,m);const source=JSON.stringify(lines);const spoken=lines.filter(l=>l[0]===m.label);assert(spoken.length);for(const l of spoken)assert.equal(resolve(a,l[0],l[2],a.engine.unit(m.target)).id,c.named[m.label]);assert.equal(JSON.stringify(lines),source);assert.equal(resolve(a,'구조한 주민',{rowId:c.rescueAliasRows[0],storyId:'act1-v6:rescue-'+m.target},null).id,c.named[m.label]);dynamic.push({name:m.label,actor:m.target,first,rows:spoken.map(l=>l[2].rowId),asset:c.named[m.label]});}
 }
}
assert.equal(resolve({stage:{id:99}},'주민',{},null),null);assert.equal(resolve({stage:{id:99}},'아무 주민',{},null),null);
assert.notEqual(c.named['덕수'],c.named['석공']);assert.notEqual(c.named['석공'],c.named['길찬']);assert.notEqual(c.named['노승'],c.named['승려']);
for(const who of ['설오','담허','휘겸','소단','서술','기록','안내',''])assert.equal(resolve({stage:{id:7}},who,{},null),null);
await mkdir('_local/reports/npc-plain-v2',{recursive:true});await writeFile('_local/reports/npc-plain-v2/mapping.json',JSON.stringify({rows,dynamic,stage14:{upper:'resident-1',middle:'resident-3'},limits:'Native App/DOM doubles; not normal combat completion'},null,2));console.log('PASS 65 canonical rows, dynamic 3 rescues x first/repeat, actual Stage14 marker targets, unknown generic/hero/anonymous exclusions; approved keeper mapped');
