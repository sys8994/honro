/** All-current control predicate matrix; synthetic valid actor/point inputs.
 * This is not 30 chapters of play. Production browser samples are separate. */
import assert from'node:assert/strict';import vm from'node:vm';import{readFile,mkdir,writeFile}from'node:fs/promises';import{runtime}from'../game/tests/helpers.mjs';
const g=await runtime({legacyMaps:false}),A=g.HonroAct2,rows=[],chapters=[];g.document={addEventListener(){},getElementById(){return null}};vm.runInContext(await readFile('shared/runtime/interactions.js','utf8'),g);
for(let id=1;id<=30;id++){
 const map=g.HONRO_PROJECT.stages.find(s=>s.metadata?.stageId===id),content=g.HONRO_CONTENT.stages[id-1],base={...structuredClone(map.initialState),mode:'campaign',honroMapOrigin:'campaign',honroStage:id,honroCustom:false};
 const list=id<11?[]:id<21?A.steps({...base,honroState:{act2:{done:{}}}}):base.honroAct3Steps||content.steps||[],raw=id<21?base.honroAct2Steps||[]:base.honroAct3Steps||[];
 const controls=[];
 for(const marker of map.markers.filter(m=>m.action)){
  const step=list.find(s=>s.id===marker.id||marker.id==='marker-'+s.id);
  if(id>=11&&(!step||!['interact','rescue'].includes(step.kind))&&!/^(spirit-lamp|rebuild-brace)/.test(marker.id))continue;
  const b={...structuredClone(base),honroState:{flags:{},act2:{done:{},holds:{},events:{}},act3:{done:{},holds:{}}}};b.honroMarkers=structuredClone(map.markers);const m=b.honroMarkers.find(q=>q.id===marker.id);b.units=[];
  const done=id<21?b.honroState.act2.done:b.honroState.act3.done;for(const q of list){if(q.id===step?.id)break;done[q.id]=true;}
  const cls=step?.requiredClass||marker.requiredClass||(step?.kind==='rescue'&&id<21?'occultist':'archer'),u={id:'probe-hero',side:0,cls,x:m.x,y:m.y,h:90,hp:100,maxHp:100};b.active=u.id;b.units.push(u);
  if(marker.target){b.units.push({id:marker.target,side:2,x:m.x,y:m.y,h:90,hp:100,maxHp:100});}
  if(marker.spiritId)b.units.push({id:marker.spiritId,side:1,x:m.x,y:m.y,hp:0,maxHp:100,dead:true});
  const app={engine:{b,active:u,grounded:()=>true},canInput:()=>true},before=g.HonroInteractions.eligibility(app,m);assert(before.ok,`${id}/${m.id} valid predicate fixture: ${before.reason}`);
  b.units.push({id:'ordinary-nearby-probe',side:1,x:m.x+40,y:m.y,hp:100,maxHp:100});const snapshot=JSON.stringify(b),after=g.HonroInteractions.eligibility(app,m);assert.deepEqual(after,before,`${id}/${m.id} still depends on nearby enemies`);assert.equal(JSON.stringify(b),snapshot,'Eligibility is read-only');
  rows.push({stage:id,id:m.id,action:m.action,kind:step?.kind||marker.action,nearbyEnemyAllowed:true,requiredClass:cls});controls.push(m.id);
  if(step?.requiredClass||marker.requiredClass){u.cls='wrong-class';assert(!g.HonroInteractions.eligibility(app,m).ok);u.cls=cls;}
  if(marker.target){const target=b.units.find(v=>v.id===marker.target);target.dead=true;assert(!g.HonroInteractions.eligibility(app,m).ok,'Dead rescue target remains invalid');delete target.dead;target.hp=0;assert(!g.HonroInteractions.eligibility(app,m).ok,'Zero HP target remains invalid');target.hp=100;}
  u.x=m.x+600;assert(!g.HonroInteractions.eligibility(app,m).ok,'Distance remains required');u.x=m.x;u.y=m.y+300;assert(!g.HonroInteractions.eligibility(app,m).ok,'Same floor remains required');u.y=m.y;u.dead=true;assert(!g.HonroInteractions.eligibility(app,m).ok,'Dead actor remains invalid');delete u.dead;m.collected=true;assert(!g.HonroInteractions.eligibility(app,m).ok,'Duplicate completion remains blocked');
 }
 chapters.push({stage:id,name:content.name,controls,retired:raw.filter(s=>['clear','pacing-secure'].includes(s.kind)&&!list.some(q=>q.id===s.id)).map(s=>s.id),keptMechanics:list.filter(s=>['destroy','defeat','hold','escort','route','reach'].includes(s.kind)).map(s=>({id:s.id,kind:s.kind})),linkedSpiritCandidates:map.markers.filter(m=>m.spiritId&&controls.includes(m.id)).map(m=>({id:m.id,spiritId:m.spiritId}))});
}
const legacy={};legacy.act2Revision1=g.HonroAct2Content.legacySteps.map((steps,i)=>({stage:i+11,interactions:steps.filter(q=>['interact','rescue'].includes(q.kind)).map(q=>q.id),clearanceSteps:steps.filter(q=>['clear','pacing-secure'].includes(q.kind)).map(q=>q.id)}));
for(const name of['raw','effective','objectiveLegacy','canonPrior'])legacy[name]=g.HONRO_NARRATIVE_COMPAT[name].filter(s=>s?.steps).map(s=>({stage:s.id,interactions:s.steps.filter(q=>['interact','rescue'].includes(q.kind)).map(q=>q.id),clearanceSteps:s.steps.filter(q=>['clear','pacing-secure'].includes(q.kind)).map(q=>q.id)}));
await mkdir('_local/reports/interaction-enemy-gates',{recursive:true});await writeFile('_local/reports/interaction-enemy-gates/audit.json',JSON.stringify({predicateCases:rows,chapters,legacy,scope:'Current authored controls: synthetic valid actor/point predicate inputs + ordinary enemy, distance/floor/dead/duplicate guards. Legacy contracts: metadata/step-view audit. Actual browser samples separate.'},null,2)+'\n');console.log('PASS current predicate controls',rows.length,'across',chapters.length,'chapters; ordinary enemies do not change eligibility; distance/floor/dead/duplicate retained');
