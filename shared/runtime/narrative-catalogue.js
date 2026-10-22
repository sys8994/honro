(function(G){'use strict';
// One current editorial catalogue and one explicit current/saved/legacy boundary.
// Snapshots and queues own their original text and cursors after creation.
const data=G.HONRO_NARRATIVE_CATALOGUE,compat=G.HONRO_NARRATIVE_COMPAT,clone=x=>JSON.parse(JSON.stringify(x));
const active=b=>!!b&&!b.honroCustom&&b.honroNarrativeCatalogueRevision===1;
function stage(source,id=source?.id){return {...clone(source||compat.raw[id-1]),...clone(data.stages[id]||{})};}
function rows(key){return clone(data.scenes[key]||[]);}
function witnessed(b,st){const allow=r=>(!r[2]?.requiresVoidWitness||b?.honroVoidWitness)&&(!r[2]?.requiresBellWitness||b?.honroBellWitness);return {...st,story:st.story?.filter(allow),outro:st.outro?.filter(allow),...(st.beats?{beats:Object.fromEntries(Object.entries(st.beats).map(([k,v])=>[k,v.filter(allow)]))}:{})};}
function sign(b,st){const lines=b.honroStage===12&&b.honroState?.quarry?.signLines;return lines?{...st,beats:{...st.beats,sign:clone(lines)}}:st;}
function legacy(b,st){const id=b?.honroStage||st?.id,base=compat.raw[id-1]||st;
 let out;
 if(b?.honroNarrativeRevision===1&&b.honroNarrativeContent)out=b.honroNarrativeContent;
 else if(id===12&&b?.honroQuarryRevision===1&&b.honroQuarryContent)out=b.honroQuarryContent;
 else if(id===14&&b?.honroVerticalStage14Revision===1&&b.honroVerticalStage14Content)out=b.honroVerticalStage14Content;
 else{
  out=(b?.honroSplit?.version===1||b&&!b.honroWaterworksRevision)&&G.HONRO_SPLIT_V1.content.find(q=>q.id===id);
  out||=([25,27].includes(id)&&b?.honroWaterworksRevision>0&&b.honroWaterworksRevision<3)&&G.HONRO_WATERWORKS_V2.content.find(q=>q.id===id);
  out||=id===18&&!b?.honroBellRevision?(compat.bellLegacy||compat.objectiveLegacy[17]):b?.honroObjectiveRevision>=2?base:compat.objectiveLegacy[id-1]||base;
  if(b&&b.honroNarrativeRevision!==1&&(out===base||id<=10&&out===compat.objectiveLegacy[id-1]))out=G.HONRO_NARRATIVE_V0.content[id-1]||out;
 }
 if(id===5&&b?.honroStage5WaterfallRevision===1)out=b.honroNarrativeContent?.honroWaterfallStory===1?b.honroNarrativeContent:compat.effective[4];
 if(b?.honroStoryCanonRevision!==1&&!b?.honroNarrativeContent&&out===base)out=compat.canonPrior[id-1]||out;
 out=sign(b||{},out);if(b?.honroStoryCanonRevision===1)out=witnessed(b,out);
 return G.HonroEvidenceQuests?.requiredContent?.(out)||out;
}
function resolve(b,st){if(b?.honroCustom)return st;const out=active(b)?witnessed(b,sign(b,b.honroNarrativeContent||fresh(b,st))):legacy(b,st);return b?.honroStage===2&&b.honroStage2LayeredRevision===1?{...out,guide:b.honroMap?.stage2LayeredRoad?.guide||out.guide}:out;}
function fresh(b,st){if(!active(b))return legacy(b,st);const base=b.honroQuarryContent||b.honroVerticalStage14Content||b.honroNarrativeContent||st;return stage(base,b.honroStage);}
function author(project){return {...project,stages:project.stages.map(original=>{const id=original.metadata?.stageId;if(!original.metadata?.campaign)return original;const st={...original,initialState:{...original.initialState,honroNarrativeCatalogueRevision:1}};
 for(const key of ['honroNarrativeContent','honroQuarryContent','honroVerticalStage14Content'])if(st.initialState[key])st.initialState[key]=stage(st.initialState[key],id);
 if(st.initialState.honroEntryVariants&&data.routes[id]){st.initialState.honroEntryVariants=clone(st.initialState.honroEntryVariants);for(const [choice,v]of Object.entries(st.initialState.honroEntryVariants.variants))if(data.routes[id].variants[choice])v.lines=clone(data.routes[id].variants[choice].lines);}
 return st;})};}
G.HonroNarrativeCatalogue={version:1,data,active,stage,rows,resolve,legacy,fresh,witnessed,author};
})(globalThis);
