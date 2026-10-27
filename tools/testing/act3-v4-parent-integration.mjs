// Concrete, reviewable integration proposal. This modifies only an isolated
// validation copy when called with its path; shared source ownership stays with
// the parent. Exact replacement assertions reject an incompatible newer base.
import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
export function patch(file,source){
 const replace=(from,to)=>{if(source.split(from).length!==2)throw Error('integration base mismatch: '+file+' '+from.slice(0,85));source=source.replace(from,to);};
 if(file==='shared/build.mjs'){
  replace("'act23-v4-reviewed');","'act23-v4-reviewed','act23-v4-ch21-scenes','act23-v4-ch21-reviewed');");
  replace("  data('HONRO_PORTRAIT_VARIANTS'", "  const reviewed21=process.env.HONRO_ACT23_V4_PHASE_A==='1'&&process.env.HONRO_ACT23_V4_PHASE_B_CH21==='1';\n  data('HONRO_ACT23_V4_PHASE_B_CH21',reviewed21);\n  data('HONRO_ACT23_V4_REVIEWED_CH21',reviewed21?JSON.parse(await read('shared/data/reviewed/act23-v4-ch21.json')):null);\n  data('HONRO_PORTRAIT_VARIANTS'");
  replace("'actor-vector','elements'","'actor-vector','act23-v4-ch21-art','elements'");
 }
 if(file==='shared/runtime/act23-v4-reviewed.js')replace('})(globalThis);',`// Stage21 provider is resolved at call time, after its own module is loaded.
const chapter21=()=>G.HonroAct23V4Chapter21Reviewed;
for(const key of ['rowsReviewed','accepts','finished','failure']){const old=G.HonroAct23V4Reviewed[key];G.HonroAct23V4Reviewed[key]=(...args)=>chapter21()?.[key](...args)||old(...args);}
for(const key of ['lineAllowed','present','journal','talkId']){const old=G.HonroAct23V4Reviewed[key];G.HonroAct23V4Reviewed[key]=(...args)=>{const id=key==='lineAllowed'?args[2]?.reviewedStage:key==='present'?args[0]?.honroStage:key==='talkId'?args[0]:args[1];return Number(id)===21?chapter21()?.[key](...args)??old(...args):old(...args);};}
})(globalThis);`);
 if(file==='shared/runtime/story.js')replace("meta?.reviewedStage===11", "Number.isInteger(meta?.reviewedStage)");
 if(file==='shared/runtime/rest-journey.js'){
  replace('app.updateAudio();nextStory(app);}', 'app.updateAudio();if(!G.HonroAct23V4Chapter21Art?.mountRest(app,()=>nextStory(app)))nextStory(app);}');
  replace("(!G.HonroAct23V4Reviewed?.enabled()||nextStage!==11||arrivalLines(app.profile,11).length>0)","(nextStage===21&&G.HonroAct23V4Chapter21Reviewed?.enabled()?arrivalLines(app.profile,21).length>0:(!G.HonroAct23V4Reviewed?.enabled()||nextStage!==11||arrivalLines(app.profile,11).length>0))");
  replace('app.root.innerHTML=restMarkup(app);startMotion(app);document.querySelector', 'app.root.innerHTML=restMarkup(app);startMotion(app);G.HonroAct23V4Chapter21Art?.mountRest(app,()=>{});document.querySelector');
 }
 if(file==='shared/runtime/act23-v4.js')replace("(id===11&&G.HonroAct23V4Reviewed?.enabled()?412:id===20?320:200+id)","(id===21&&G.HonroAct23V4Chapter21Reviewed?.enabled()?421:id===11&&G.HonroAct23V4Reviewed?.enabled()?412:id===20?320:200+id)");
 return source;
}
export const files=['shared/build.mjs','shared/runtime/act23-v4-reviewed.js','shared/runtime/story.js','shared/runtime/act23-v4.js','shared/runtime/rest-journey.js'];
if(process.argv[2])for(const file of files){const target=path.join(process.argv[2],file);await writeFile(target,patch(file,await readFile(target,'utf8')));}
