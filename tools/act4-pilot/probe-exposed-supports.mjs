/** General static live-Engine exposure/contact mask; no special region exclusions. */
import{readFile,writeFile,mkdir}from'node:fs/promises';import{createHash}from'node:crypto';import{runtime,battlefield}from'../../game/tests/helpers.mjs';import{sampleSupport}from'./support-visibility-sampling.mjs';
process.env.HONRO_ACT4_RELEASE='1';const dir=process.argv[2],step=Number(process.argv[3]||.5);if(!dir)throw Error('Usage: node probe-exposed-supports.mjs draftDir [worldSampleStep=.5]');
const raw=await readFile(dir+'/stage.json'),stage=JSON.parse(raw),spec=JSON.parse(await readFile(dir+'/blueprint.json','utf8')),n=Number(stage.id.split('-').at(-1)),sha=x=>createHash('sha256').update(x).digest('hex');
const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE,profile=C.defaults();g.HonroEquipment.fresh(profile);profile.recruited=g.HonroStageRules.stageParty(n);for(const cls of profile.recruited)profile.heroes[cls].xp=g.HonroProgression.xpAt(g.HonroProgression.plan(n).entryLevel);
const {e}=battlefield(g,n,{profile}),bodyGroups=[...new Map(e.heroesAlive().map(u=>[u.h+'/'+u.r,{h:u.h,r:u.r}])).values()],terrain=g.HonroMaps.compile(stage,{...g.HONRO_PROJECT,stages:[stage]}).terrain;
const modes={physicalExposed:[],partyContactValid:[]},rows=[];
for(const f of spec.surfaces){const t=terrain.find(t=>t.id===`pilot${n}-${f.id}`);if(!t)throw Error('Missing compiled support '+f.id);const predicates={physicalExposed:(x,y)=>C.exposedSurface(terrain,t,x,y),partyContactValid:(x,y)=>C.exposedSurface(terrain,t,x,y)&&bodyGroups.every(body=>C.validTerrainContactPose(terrain,{...body,x,y}))};const row={id:f.id,material:f.material||'natural'};
 for(const [mode,predicate]of Object.entries(predicates)){const sampled=sampleSupport(f.top,predicate,step);row[mode]={...sampled,parts:undefined};for(const [i,part]of sampled.parts.entries())modes[mode].push({...f,id:f.id+'#'+i,originalSupportId:f.id,top:part});}rows.push(row);
}
// New BODY outlines can create incidental upward-facing ledges even when no route cap changed.
// Inventory them separately; do not add them to the authored-walk metric denominator.
const incidental=[];
for(const t of terrain){if(t.oneWay)continue;const f=spec.surfaces.find(f=>'pilot'+n+'-'+f.id===t.id),ps=C.poly(t),same=(a,p)=>Math.hypot(a.x-p[0],a.y-p[1])<1e-6;
 for(let i=0;i<ps.length;i++){const a=ps[i],z=ps[(i+1)%ps.length],dx=z.x-a.x;if(dx<=1e-7||Math.abs((z.y-a.y)/dx)>1.35)continue;if(f?.top.slice(1).some((p,j)=>same(a,f.top[j])&&same(z,p)))continue;
  const top=[[a.x,a.y],[z.x,z.y]],exposed=sampleSupport(top,(x,y)=>C.exposedSurface(terrain,t,x,y),step),valid=sampleSupport(top,(x,y)=>C.exposedSurface(terrain,t,x,y)&&bodyGroups.every(body=>C.validTerrainContactPose(terrain,{...body,x,y})),step);
  incidental.push({terrainId:t.id,edge:i,role:f?'native/non-cap incidental side edge':'cover or non-route terrain edge',top,authoredLengthWorld:exposed.totalLength,exposedLengthWorld:exposed.keptLength,partyValidLengthWorld:valid.keptLength,validRuns:valid.parts,notIncludedInAuthoredWalkMetric:true});
 }
}
const report={incidentalUpwardEdges:incidental,stageRawSHA256:sha(raw),stageCanonicalSHA256:sha(JSON.stringify(stage)),bodyGroups,samplingStepWorld:step,scope:'All declared authored support tops, no handpicked masks. Live C.exposedSurface separates solid-union burial; live validTerrainContactPose then tests all distinct party body footprints. Static support validity is NOT reachability, rendered pixel exposure, combat or art acceptance. Covers/other solids participate as blockers, but the counted support set remains the blueprint surfaces, unchanged from authored reports.',rows};
await writeFile(dir+'/support-exposure.json',JSON.stringify(report,null,2));for(const [mode,surfaces]of Object.entries(modes))await writeFile(dir+'/support-'+mode+'-input.json',JSON.stringify({...spec,surfaces,exposureSource:report},null,2));console.log(JSON.stringify({stageCanonicalSHA256:report.stageCanonicalSHA256,bodyGroups,rows:rows.map(r=>({id:r.id,authored:r.physicalExposed.totalLength,exposed:r.physicalExposed.keptLength,partyValid:r.partyContactValid.keptLength}))}));
