import {appHarness,plain} from './app-regression-helpers.mjs';
export async function dialogueInventory(){
 const h=await appHarness(),g=h.g,lines=[],stages=[],rests=[];
 function collect(value,path){if(!value||typeof value!=='object')return;if(Array.isArray(value)&&typeof value[0]==='string'&&/^[가-힣 ]+$/.test(value[0])&&value[0].length<18&&typeof value[1]==='string'&&(value.length===2||value.length===3&&typeof value[2]==='object')){lines.push({path,who:value[0],text:value[1],meta:plain(value[2]||{})});return;}for(const [key,item]of Object.entries(value))collect(item,`${path}.${key}`);}
 for(const st of g.HONRO_CONTENT.stages){
  const profile=h.profileThrough(st.id-1),map=g.HONRO_PROJECT.stages.find(s=>s.metadata.stageId===st.id),b=g.HonroMaps.createBattle(map,g.HONRO_PROJECT,profile),current=g.HonroObjectiveRevision.contentFor(b,st);
  stages.push(plain(current));
  for(const key of ['story','outro','failure','beats','storyFollowups'])collect(current[key],`stage.${st.id}.${key}`);
  for(const [i,text]of (current.narration||[]).entries())lines.push({path:`stage.${st.id}.narration.${i}`,who:'서술',text,meta:{kind:'narration'}});
  if(current.guide)lines.push({path:`stage.${st.id}.guide`,who:'안내',text:current.guide,meta:{kind:'guide'}});
  collect(map.events,`map.${st.id}.events`);collect(map.interactions,`map.${st.id}.interactions`);collect(map.initialState.honroRouteSpec,`map.${st.id}.routes`);collect(map.initialState.honroEntryVariants,`map.${st.id}.entryVariants`);
  const rest={stage:st.id,required:g.HonroJourneyContent.interlude(st.id),optional:{}};collect(rest.required,`rest.${st.id}.required`);
  for(const cls of ['archer','mage','knight','occultist']){rest.optional[cls]=g.HonroJourneyContent.optional(h.profileThrough(30),st.id,cls);collect(rest.optional[cls],`rest.${st.id}.${cls}`);}rests.push(plain(rest));
  // Runtime handlers author condition-dependent lines outside the chapter payload.
  const app={stage:current,engine:{b,active:b.units.find(u=>u.side===0)}};
  for(const ev of map.events||[])collect(g.HonroStoryContent.eventLines(app,ev),`runtime.${st.id}.event.${ev.id}`);
  for(const m of b.honroMarkers||[])if(['ledger','ritual','receiver','rescue'].includes(m.action)){
   b.honroState.flags??={};for(const count of m.action==='receiver'?[1,2]:[0]){b.honroState.receivers=count;collect(g.HonroStoryContent.interaction(app,m),`runtime.${st.id}.interaction.${m.id}.${count}`);}
  }
 }
 collect(g.HonroStoryContent.mapScenes,'mapScenes');
 for(const name of ['cooperation','cooperationDefense','finaleMidpoint'])collect(g.HonroStoryContent[name](),`runtime.10.${name}`);
 for(const id of ['act1-sodan-first-receiver-v1','act3-split-departure-v1','act3-party-reunion-v2'])collect(g.HonroStoryStaging.describe(id),`staging.${id}`);
 for(const id of [20,30]){const p=h.profileThrough(id);collect(g.HonroJourneyContent.required(p,null),`rest.end.${id}.required`);for(const cls of p.recruited)collect(g.HonroJourneyContent.optional(p,null,cls),`rest.end.${id}.${cls}`);}
 return {stages,authoredStages:plain(g.HONRO_CONTENT.stages),rests,lines};
}
