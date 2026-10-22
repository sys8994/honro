import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
const root='game/docs/story/voice-v2-editorial/drafts/',d=JSON.parse(await readFile('shared/data/narrative-current.json','utf8')),g=await runtime({legacyMaps:false});
const plain=x=>JSON.parse(JSON.stringify(x)),pairs=rows=>rows.map(r=>r.slice(0,2));
const current={};for(let id=1;id<=30;id++){const f=battlefield(g,id);f.b.honroVoidWitness=f.b.honroBellWitness=true;current[id]={...f,st:g.HonroObjectiveRevision.contentFor(f.b,f.st)};}
let compared=0;
for(const file of ['act1-scenes','act2-scenes','act3-scenes','supplement-scenes']){
 const doc=JSON.parse(await readFile(root+file+'.json','utf8'));assert.equal(doc.status,'editorially-reviewed-awaiting-integration');
 for(const [key,rows]of Object.entries(doc.scenes)){
  if(typeof rows==='string'||!Array.isArray(rows)){assert.deepEqual(d.values[key],rows);continue;}
  const normalized=key.replace('5.currentWaterfall.story','5.story'),p=normalized.split('.');let actual;
  if(p[0]==='mapScenes')actual=d.mapScenes[p[1]];
  else if(key.startsWith('routeEntry.'))actual=d.routes[p[1]].variants[p[2]].lines;
  else if(p[0] in current&&['story','outro','beats','storyFollowups'].includes(p[1])){const st=current[p[0]].st;actual=p[1]==='beats'?st.beats[p[2]]:p[1]==='storyFollowups'?st.storyFollowups[p[2]]:st[p[1]];}
  else actual=d.scenes[key];
  const expected=rows.map(r=>r.slice(0,2));if(key==='27.void.sceneLines')for(const r of expected)if(r[0]==='이름 없는 화자')r[0]='';
  assert.deepEqual(plain(pairs(actual)),expected,'exact supplied rows '+key);assert.equal(new Set(actual.map(r=>r[2].rowId)).size,actual.length,'stable unique row IDs '+key);compared++;
 }
 if(doc.eventDialogue)for(const [key,value]of Object.entries(doc.eventDialogue)){const target=d.scenes[key]?key:key.split('.')[0]+'.events.'+key.split('.').slice(1).join('.');const actual=pairs(d.scenes[target]);if(typeof value==='string')assert.equal(actual[0][1],value);else assert.deepEqual(actual,value);compared++;}
}
// Actual actor/resident/once selection uses approved clauses, with no stale template prose.
for(const resident of ['덕수','월이','칠복'])for(const who of ['설오','담허','휘겸','소단']){
 const f=current[7],app={engine:{b:f.b,active:{name:who}},stage:f.st};delete f.b.honroState.flags['story:sodan-known'];
 const marker={action:'rescue',label:resident,target:'resident-fixture'};
 const first=g.HonroStoryContent.interaction(app,marker),second=g.HonroStoryContent.interaction(app,marker);
 assert.deepEqual(plain(pairs(first.slice(0,2))),[[who,d.values['interaction.rescue.activeActor'][who]],[resident,d.values['interaction.rescue.testimony'][resident]]]);
 assert.equal(first.length,4);assert.equal(second.length,2);assert(f.b.honroState.flags['story:sodan-known']);
}
const arrivals=JSON.parse(await readFile(root+'arrivals-endings.json','utf8')),rest=JSON.parse(await readFile(root+'rest-dialogue.json','utf8')),summaries=JSON.parse(await readFile(root+'summaries.json','utf8'));
for(let id=1;id<=30;id++){
 assert.deepEqual(pairs(d.arrivals[id]),arrivals.arrivals[id],'arrival '+id);assert.equal(current[id].st.storySummary,summaries.chapters[id]);
 const st=current[id].st;for(const row of [...st.story,...st.outro,...Object.values(st.beats||{}).flat()])if(row[0]==='기록'){assert.equal(row[2].kind,'document');assert(row[2].documentId);}
 const profile=g.HONRO_CORE.defaults();profile.recruited=['archer','mage','knight','occultist'];for(let n=1;n<id;n++)profile.cleared[n]={};
 for(const [i,cls]of profile.recruited.entries()){const output=g.HonroJourneyContent.optional(profile,id,cls),conversation=rest.conversations[id+'.'+cls],text=rest.observations[id]?.[i],expected=conversation?conversation.map(r=>r.slice(0,2)):text==null?[]:[[rest.speakerOrder[i],text]];assert.deepEqual(plain(pairs(output)),id<({archer:1,mage:3,knight:6,occultist:11}[cls])?[]:expected,'optional '+id+'/'+cls);}
}
for(const id of ['10','20','30'])assert.deepEqual(d.actEndings[id].lines,arrivals.actEndings[id]);
assert.equal(current[2].st.outro.find(r=>r[2].revealName)?.[2].rowId,'chapter.2.outro.hongman-name');
for(const id of [20,28,29]){
 const f=current[id];f.b.honroBellWitness=f.b.honroVoidWitness=false;const no=g.HonroObjectiveRevision.contentFor(f.b,f.st);
 const rows=[...no.outro,...Object.values(no.beats||{}).flat()];assert(!rows.some(r=>r[2]?.requiresVoidWitness||r[2]?.requiresBellWitness),'witness rows stay gated '+id);
}
for(const [id,key]of [[18,'18.requiresBellWitness'],[27,'27.requiresVoidWitness']]){
 const f=current[id],base=f.st.storySummary;f.b.honroVoidWitness=f.b.honroBellWitness=false;assert.equal(g.HonroNarrativeCatalogue.summary(f.b,f.st),base);f.b[id===18?'honroBellWitness':'honroVoidWitness']=true;assert.equal(g.HonroNarrativeCatalogue.summary(f.b,f.st),base+' '+summaries.conditionalSupplement[key]);
}
assert.equal(current[17].b.honroAct2Steps.find(s=>s.id==='hold-hoist').rounds,3);assert.equal(current[18].b.honroAct2Steps.find(s=>s.id==='hold-silence').rounds,4);assert(current[18].b.honroAct2Steps.some(s=>s.id==='bell-descent'));
assert.equal(g.HonroStoryContent.version,7);assert.equal(g.HonroAct3Void.sceneLines.length,5);assert(!g.HonroAct3Void.sceneLines.some(l=>l.wait||!l.text));
console.log('PASS exact parent copy:',compared,'scene/value groups, 30 effective snapshots/arrivals/summaries, optional talks, metadata IDs/documents/reveal/witness gates, three/four-round and anonymous void contracts');

for(const id of [13,16,30])for(const choice of ['A','B']){const p=g.HONRO_CORE.defaults();p.honroRouteHandoff={revision:1,fromStage:id-1,toStage:id,choice,sourceRun:'voice-route-fixture'};const {b}=battlefield(g,id,{profile:p});const supplied=JSON.parse(await readFile(root+'supplement-scenes.json','utf8')).scenes['routeEntry.'+id+'.'+choice];assert.deepEqual(plain(pairs(g.HonroRouteBranches.entryLines(b))),supplied.map(r=>r.slice(0,2)),'actual route '+id+'/'+choice);}
const custom={honroStage:2,honroCustom:true,honroNarrativeCatalogueRevision:1},authored={id:2,story:[['작성자','Workshop에서 쓴 원문']]};assert.equal(g.HonroObjectiveRevision.contentFor(custom,authored),authored);console.log('PASS six real route handoffs and custom Workshop boundary');
