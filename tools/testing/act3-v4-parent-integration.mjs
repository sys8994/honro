// Concrete integration proposal against fixed base15243cc1. Apply only to an
// isolated validation copy. Parent-owned shared sources are never edited here.
import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
const stages=[21,22,23,24,25,27];
export function patch(file,source){
 const replace=(from,to)=>{if(source.split(from).length!==2)throw Error('integration base mismatch: '+file+' '+from.slice(0,85));source=source.replace(from,to);};
 if(file==='shared/build.mjs'){
  replace("'act23-v4-reviewed');","'act23-v4-reviewed','act23-v4-ch21-scenes','act23-v4-ch21-reviewed','act23-v4-ch22-reviewed','act3-v4-reviewed-core','act23-v4-ch23-reviewed','act23-v4-ch24-reviewed','act3-v4-reviewed-waterworks','act23-v4-ch25-reviewed','act23-v4-ch27-reviewed');");
  replace("  data('HONRO_PORTRAIT_VARIANTS'",`  const reviewedAct3=Object.fromEntries(${JSON.stringify(stages)}.map(id=>[id,process.env.HONRO_ACT23_V4_PHASE_A==='1'&&process.env['HONRO_ACT23_V4_PHASE_B_CH'+id]==='1']));
  for(const id of ${JSON.stringify(stages)}){data('HONRO_ACT23_V4_PHASE_B_CH'+id,reviewedAct3[id]);data('HONRO_ACT23_V4_REVIEWED_CH'+id,(id===21?Object.values(reviewedAct3).some(Boolean):reviewedAct3[id])?JSON.parse(await read('shared/data/reviewed/act23-v4-ch'+id+'.json')):null);}
  data('HONRO_PORTRAIT_VARIANTS'`);
  replace("'actor-vector','elements'","'actor-vector','act23-v4-ch21-art','act3-v4-reviewed-rest','elements'");
 }
 if(file==='shared/runtime/act23-v4-reviewed.js')replace('})(globalThis);',`// Resolve Act3-only providers after their own modules have loaded.
const chapterProvider=id=>({21:G.HonroAct23V4Chapter21Reviewed,22:G.HonroAct23V4Chapter22Reviewed})[id]||G.HonroAct3V4ReviewedCore?.providers.get(id);
G.HonroAct23V4Reviewed.provider=chapterProvider;
for(const key of ['rowsReviewed','accepts','finished','failure']){const old=G.HonroAct23V4Reviewed[key];G.HonroAct23V4Reviewed[key]=(...args)=>${JSON.stringify(stages)}.some(id=>chapterProvider(id)?.[key](...args))||old(...args);}
for(const key of ['lineAllowed','present','journal','talkId']){const old=G.HonroAct23V4Reviewed[key];G.HonroAct23V4Reviewed[key]=(...args)=>{const id=key==='lineAllowed'?args[2]?.reviewedStage:key==='present'?args[0]?.honroStage:key==='talkId'?args[0]:args[1];return chapterProvider(Number(id))?.[key](...args)??old(...args);};}
})(globalThis);`);
 if(file==='shared/runtime/story.js')replace("meta?.reviewedStage===11", "Number.isInteger(meta?.reviewedStage)");
 if(file==='shared/runtime/rest-journey.js'){
  replace('app.updateAudio();nextStory(app);}', 'app.updateAudio();if(!(G.HonroAct23V4Chapter21Art?.mountRest(app,()=>nextStory(app))||G.HonroAct3V4ReviewedRest?.mount(app,()=>nextStory(app))))nextStory(app);}');
  replace("(!G.HonroAct23V4Reviewed?.enabled()||nextStage!==11||arrivalLines(app.profile,11).length>0)","(G.HonroAct23V4Reviewed?.provider?.(nextStage)?.enabled()?arrivalLines(app.profile,nextStage).length>0:(!G.HonroAct23V4Reviewed?.enabled()||nextStage!==11||arrivalLines(app.profile,11).length>0))");
  replace('app.root.innerHTML=restMarkup(app);startMotion(app);document.querySelector', 'app.root.innerHTML=restMarkup(app);startMotion(app);G.HonroAct23V4Chapter21Art?.mountRest(app,()=>{})||G.HonroAct3V4ReviewedRest?.mount(app,()=>{});document.querySelector');
 }
 if(file==='shared/runtime/stake-crossing.js'){replace(' const preparation=clone((b.honroSplit||b).stakePreparation)', ' const reviewedRetry=G.HonroAct3V4ReviewedWaterworks?.captureRetry(b);\n const preparation=clone((b.honroSplit||b).stakePreparation)');replace(' if(resolvedVoid){', ' G.HonroAct3V4ReviewedWaterworks?.restoreRetry(b,reviewedRetry);\n if(resolvedVoid){');}
 if(file==='shared/runtime/act23-v4.js')replace("(id===11&&G.HonroAct23V4Reviewed?.enabled()?412:id===20?320:200+id)","(id>=21&&G.HonroAct23V4Reviewed?.provider?.(id)?.enabled()?400+id:id===11&&G.HonroAct23V4Reviewed?.enabled()?412:id===20?320:200+id)");
 return source;
}
export const files=['shared/build.mjs','shared/runtime/act23-v4-reviewed.js','shared/runtime/story.js','shared/runtime/act23-v4.js','shared/runtime/rest-journey.js','shared/runtime/stake-crossing.js'];
if(process.argv[2])for(const file of files){const target=path.join(process.argv[2],file);await writeFile(target,patch(file,await readFile(target,'utf8')));}
