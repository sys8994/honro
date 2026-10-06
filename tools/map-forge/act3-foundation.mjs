/** Read-only authoring preflight. This module is never part of a game bundle. */
import vm from 'node:vm';
import path from 'node:path';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';

export const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const check=(value,message)=>{if(!value)throw Error(message);};
const plain=value=>JSON.parse(JSON.stringify(value));
const idsOf=(rows,key)=>rows.map(row=>key(row));
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const unique=(ids,label)=>check(new Set(ids).size===ids.length,`${label}: duplicate stage ID`);

/** Only catalog relationships, not geometry, playability, difficulty or approval. */
export function validateCampaignCatalog({stages,acts,balance,project,places}){
 check(Array.isArray(stages)&&stages.length>0,'Content stages are required');
 const ids=idsOf(stages,s=>s.id),expected=stages.map((_,i)=>i+1);
 unique(ids,'Content');
 check(same(ids,expected),'Content must retain contiguous stageId - 1 indexing');
 check(Array.isArray(balance),'Balance stages are required');
 unique(idsOf(balance,s=>s.id),'Balance');
 check(same(idsOf(balance,s=>s.id),ids),'Balance must cover content in stageId - 1 order');
 for(const row of balance)check(Number.isFinite(row.entryLevel)&&Number.isFinite(row.exitLevel)&&row.entryLevel>=1&&row.exitLevel>=row.entryLevel,`Stage ${row.id}: invalid growth range`);
 check(Array.isArray(project?.stages),'Canonical stages are required');
 const mapIds=idsOf(project.stages,s=>s.metadata?.stageId);
 unique(mapIds,'Canonical maps');
 check(same([...mapIds].sort((a,b)=>a-b),ids),'Canonical maps must cover exactly the content IDs');
 check(Array.isArray(places),'Journey places are required');
 unique(idsOf(places,p=>p.stageId),'Journey');
 check(same(idsOf(places,p=>p.stageId),ids),'Journey places must cover content in progression order');
 check(Array.isArray(acts)&&acts.length>0,'Act ranges are required');
 unique(acts.map(a=>a.id),'Acts');
 const coverage=[];
 for(const act of acts){
  check(Number.isInteger(act.id)&&act.id>0&&Number.isInteger(act.first)&&Number.isInteger(act.last)&&act.first>0&&act.last>=act.first&&act.last<=ids.length,'Invalid act range');
  for(let id=act.first;id<=act.last;id++){
   coverage.push(id);
   const st=stages[id-1];
   check(st.act===undefined||st.act===act.id,`Stage ${id}: act ID mismatch`);
   check(st.actStage===undefined||st.actStage===id-act.first+1,`Stage ${id}: local act index mismatch`);
  }
 }
 check(same(coverage,ids),'Act ranges must partition content without gaps or overlaps');
 for(const st of stages){
  check(Array.isArray(st.requires),`Stage ${st.id}: missing prerequisites`);
  unique(st.requires,`Stage ${st.id} prerequisites`);
  check(st.requires.every(id=>Number.isInteger(id)&&id>=1&&id<st.id),`Stage ${st.id}: missing, self or forward prerequisite`);
 }
 return {stageIds:ids,acts:acts.map(({id,first,last})=>({id,first,last}))};
}

/** Null means undecided, including newBoss/ending; it never means approved absence. */
export function validateAct3Draft(draft,activeIds){
 check(draft?.schema==='honro-act-draft'&&draft.version===1,'Unsupported act draft');
 check(draft.act===3&&draft.status==='awaiting-map-review'&&draft.campaignEnabled===false,'Draft must remain inactive and awaiting map review');
 const expected=Array.from({length:10},(_,i)=>i+21);
 check(same(draft.stageIds,expected),'Draft must cover source stages 3-1 through 3-10');
 check(draft.stageIds.every(id=>!activeIds.includes(id)),'Draft stage leaked into the active catalog');
 check(draft.source?.pageCount===26&&draft.source?.version==='0.1'&&/^[a-f0-9]{64}$/.test(draft.source?.extractedTextSha256||''),'Source identity is required');
 check(Array.isArray(draft.stages)&&draft.stages.length===10,'Draft must retain all ten source slots');
 for(const key of ['mapConcept','objectiveModel','difficulty','newBoss','ending'])check(Object.hasOwn(draft.decisions||{},key)&&draft.decisions[key]===null,`Unreviewed decision must stay null: ${key}`);
 for(const [i,st] of draft.stages.entries()){
  check(st.stageId===expected[i]&&st.actStage===i+1,'Draft stage order differs from source');
  check(typeof st.sourceTitle==='string'&&st.sourceTitle.length>0,'Missing source title');
  check(Array.isArray(st.sourcePages)&&st.sourcePages.length>0&&st.sourcePages.every(p=>Number.isInteger(p)&&p>=18&&p<=23),'Missing source page reference');
  check(st.mapPlan===null&&st.canonicalStage===null,'Unreviewed draft must not contain production geometry');
 }
 return {stageIds:expected,status:draft.status,campaignEnabled:false,implemented:false};
}

export async function loadFoundationInputs(root=ROOT){
 const json=async file=>JSON.parse(await readFile(path.join(root,file),'utf8'));
 const balance=await json('game/config/balance.json');
 // This content-only sandbox does not invoke the engine, compiler, builder,
 // profile loader, localStorage or the production app.
 const g=vm.createContext({HONRO_CORE:{SKILLS:{}},HONRO_BALANCE:plain(balance)});
 for(const name of ['content','story-content','act2-content','act2-plan','act2-drama','journey-content'])
  vm.runInContext(await readFile(path.join(root,'shared/runtime',name+'.js'),'utf8'),g,{filename:name+'.js'});
 return {catalog:{stages:plain(g.HONRO_CONTENT.stages),acts:plain(g.HONRO_CONTENT.acts),balance:balance.stages,project:await json('shared/data/campaign.json'),places:plain(g.HonroJourneyContent.places)},draft:await json('tools/map-forge/act3-draft.json'),nextAct:plain(g.HONRO_CONTENT.nextAct)};
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const {catalog,draft,nextAct}=await loadFoundationInputs();
 const current=validateCampaignCatalog(catalog),planned=validateAct3Draft(draft,current.stageIds);
 check(nextAct.id===3&&nextAct.available===false,'Production Act 3 must remain unavailable');
 console.log(JSON.stringify({current,planned,proof:'Catalog consistency and inactive planning slots only; no new map, mission, save or gameplay implementation.'},null,2));
}
