/** Read-only Native Canvas wording regression. The two real hold checkpoints
 * come verbatim from the recorded completed run. Guard controls below are
 * explicitly isolated clones, not additional normal gameplay evidence. */
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {runtimeParts} from '../shared/build.mjs';
import {guidanceRuntime,canvas} from './act2-guidance-helpers.mjs';
import {quarryHistoryHash as hash,quarryHistoryPlain as plain,stage12QuarryOriginal,stage12QuarryHoldGuideDelta,beforeStage12QuarryRuntimeSources,stage12QuarryRuntimeSources,beforeStage23EscortFingerprintParts,beforeStage23Escort} from './stage8-bier-history-helpers.mjs';
const out=process.env.HONRO_QUARRY_HOLD_GUIDE_OUT||'_local/reports/stage12-quarry/hold-guide';await mkdir(out,{recursive:true});
const fixtureText=await readFile(new URL('./fixtures/stage12-quarry/completed-run.json',import.meta.url),'utf8'),fixture=JSON.parse(fixtureText),g=await guidanceRuntime(),A=g.HonroAct2;
const sources=stage12QuarryRuntimeSources(),historical=beforeStage12QuarryRuntimeSources(sources),parts=await runtimeParts({vector:false,render:false}),runtimeSha256=hash(parts.join('\n')),projectSha256=hash(g.HONRO_PROJECT);
// Compare immutable checkpoint fingerprints through the exact reviewed Stage23
// projection while rendering and reloading with the untouched current runtime.
const stage23ProjectedRuntimeSha256=hash(beforeStage23EscortFingerprintParts(parts,{sources}).join('\n')),stage23ProjectedProjectSha256=hash(beforeStage23Escort(g.HONRO_PROJECT));
assert.equal(stage23ProjectedRuntimeSha256,fixture.files['result.json'].runtimeSha256,'Checkpoint gameplay fingerprint after exact reviewed Stage23 projection');
assert.equal(stage23ProjectedProjectSha256,fixture.files['result.json'].sourceHash,'Checkpoint campaign fingerprint after exact reviewed Stage23 projection');
assert.equal(hash(parts.join('\n')),runtimeSha256,'Fingerprint projection leaves current runtime parts unchanged');assert.equal(hash(g.HONRO_PROJECT),projectSha256,'Native guide keeps the current authored campaign after fingerprint projection');
const cases=[];
async function capture(name,b,{fullScene=false,width=1440,height=960,unit='턴',suppressed=false}={}){
 const saved=JSON.stringify(b),step=A.current(b),hold=g.HonroAct2Art.holdGuide(b,step);assert(hold,'An existing real hold step is required');
 const expected=`${hold.who} 유지 · ${hold.progress}/${hold.rounds}${unit} · ${hold.status}`,cv=canvas(width,height),ctx=cv.getContext('2d'),texts=[],textBounds=[];
 // Observation only: every string is forwarded unchanged to the real native
 // Canvas function. Production labels, context and battle are never replaced.
 const fillText=ctx.fillText;ctx.fillText=function(...args){const text=String(args[0]);texts.push(text);
  if(text.includes(' 유지 · ')||text.startsWith('실선:')){const naturalWidth=this.measureText(text).width,shownWidth=Math.min(naturalWidth,args[3]??Infinity),start=args[1]-(this.textAlign==='center'?shownWidth/2:this.textAlign==='right'||this.textAlign==='end'?shownWidth:0),m=this.getTransform(),left=m.a*start+m.c*args[2]+m.e,right=m.a*(start+shownWidth)+m.c*args[2]+m.e;
   textBounds.push({text,naturalWidth,maxWidth:args[3]??null,shownWidth,left,right});assert(left>=0&&right<=width,'Actual native fillText clamp keeps the full badge line inside the viewport');}
  return fillText.apply(this,args);
 };
 const scene=new g.HonroScene(cv);Object.assign(scene,{x:hold.x,y:hold.y,scale:.55,manual:true,time:2});
 if(fullScene){const e=new g.HONRO_CORE.Engine(b);assert.equal(JSON.stringify(b),saved,'Engine reload retains the complete recorded battle');scene.render(e,0);await new Promise(r=>setTimeout(r,20));texts.length=0;textBounds.length=0;scene.render(e,0);}
 else{ctx.save();ctx.fillStyle='#10212b';ctx.fillRect(0,0,width,height);ctx.translate(width/2,height/2);ctx.scale(scene.scale,scene.scale);ctx.translate(-scene.x,-scene.y);g.HonroAct2Art.objectiveGuide(ctx,scene,b);ctx.restore();}
 const labels=texts.filter(t=>t.includes(' 유지 · ')),legends=texts.filter(t=>t.startsWith('실선:')),legend=unit==='라운드'?'실선: 방어 범위 / 점선 안에 적이 오면 중단':'실선: 방어 범위 / 점선: 적 진입 금지';
 if(suppressed)assert.deepEqual(labels,[],'Existing custom-map guide suppression is retained');else assert.deepEqual(labels,[expected],'Exactly one actual Native badge uses the scoped unit');
 assert.deepEqual(legends,suppressed?[]:[legend],'Exactly one scoped Native legend describes contest interruption');
 assert.equal(JSON.stringify(b),saved,'Render cannot change any actor, terrain, resource, hold, wave or saved field');
 if(fullScene)await writeFile(`${out}/${name}.png`,cv.toBuffer('image/png'));
 const row={name,round:b.round,stage:b.honroStage,revision:b.honroQuarryRevision??null,custom:!!b.honroCustom,progress:hold.progress,required:hold.rounds,text:labels[0]??null,legend:legends[0]??null,textBounds,battleSha256:hash(saved),fullScene,width,height};cases.push(row);console.log('PASS',name,labels[0]??'(existing custom suppression)',legends[0]??'');return row;
}
for(const file of ['open-continue.json','hold-entry-round-checkpoint.json']){
 const data=fixture.files[file],b=plain(data.profile.honroBattle);assert.equal(b.honroStage,12);assert.equal(b.honroQuarryRevision,1);assert.equal(!!b.honroCustom,false);assert.equal(A.current(b).id,'hold-road');
 const name=file.replace('.json','');await capture('actual-'+name,b,{fullScene:true,unit:'라운드'});
 if(file==='hold-entry-round-checkpoint.json'){assert.equal(b.honroState.act2.holds['hold-road'].progress,1);for(const [name,width,height]of [['portrait-ratio',900,1200],['small-portrait',390,844],['small-landscape',844,390]])await capture('actual-hold-'+name,b,{fullScene:true,width,height,unit:'라운드'});}
}
const actual=fixture.files['hold-entry-round-checkpoint.json'].profile.honroBattle;
for(const revision of [undefined,0,2,'1']){const b=plain(actual);if(revision===undefined)delete b.honroQuarryRevision;else b.honroQuarryRevision=revision;await capture('isolated-revision-'+String(revision)+(typeof revision==='string'?'-string':''),b);}
for(const id of [11,13,14,15,16,17,18,19,20]){const b=plain(actual);b.honroStage=id;await capture('isolated-other-stage-'+id,b);}
for(const roster of ['candidate32e7','originalBudget20e4']){const b=plain(actual);b.honroQuarryRoster=roster;await capture('isolated-named-roster-'+roster,b,{unit:'라운드'});}
const custom=plain(actual);custom.honroCustom=true;await capture('isolated-custom',custom,{suppressed:true});
// Real immutable old12 geometry/steps, with only initial objective/progress set
// as a wording fixture. This does not claim a historical normal arrival.
const oldMap=plain(stage12QuarryOriginal.stage),old=g.HonroMaps.createBattle(oldMap,{...g.HONRO_PROJECT,stages:[oldMap]},g.HONRO_CORE.defaults(),{origin:'campaign'}),memory=A.memory(old);
assert.equal(old.honroQuarryRevision,undefined);Object.assign(memory.done,{'clear-approach':true,sign:true});memory.holds={'hold-road':{progress:1,spawned:3}};
await capture('isolated-immutable-old12',old);
assert.equal(await readFile(new URL('./fixtures/stage12-quarry/completed-run.json',import.meta.url),'utf8'),fixtureText,'Actual saved profile fixture is never rewritten');
assert.equal(cases.length,22);assert.equal(cases.filter(row=>row.fullScene).length,5);
const result={passed:true,conditions:cases.length,fullSceneCaptures:cases.filter(row=>row.fullScene).length,sourceCommit:fixture.sourceCommit,gameplayProductionCommit:fixture.lastGameplayProductionCommit,actualSourceArtifacts:fixture.originalArtifacts,fixtureSha256:hash(fixtureText),projectSha256,runtimeSha256,stage23ProjectedRuntimeSha256,stage23ProjectedProjectSha256,completedGameplayRuntimeSha256:fixture.files['result.json'].runtimeSha256,completedProjectSha256:fixture.files['result.json'].sourceHash,rendererSha256:hash(sources[stage12QuarryHoldGuideDelta.path]),originalRendererSha256:hash(historical[stage12QuarryHoldGuideDelta.path]),cases,scope:'Historical fingerprint comparison projects only the exact reviewed Stage23 delta; all reloads and renders use the current production runtime. Five full-scene Native Canvas captures (including actual390x844/844x390 viewports and900x1200 portrait-ratio) from two verbatim normal-run hold checkpoints; every battle byte preserved. Seventeen remaining scope controls are isolated wording fixtures (22 total conditions). No browser, input, performance, difficulty or further gameplay-completion claim.'};
await writeFile(out+'/summary.json',JSON.stringify(result,null,2)+'\n');
