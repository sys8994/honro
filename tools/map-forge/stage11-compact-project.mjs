/** Explicit, unadopted Stage11 B project. Never writes or installs a campaign.
 * Encounter counts/roles are a first layout hypothesis, not difficulty proof. */
import {createCompactCandidate,heightOn} from './stage11-compact-candidates.mjs';
import {createOpenTwoStepB} from './stage11-compact-alternatives.mjs';
const clone=x=>JSON.parse(JSON.stringify(x));
const PARTY=['archer','mage','knight','occultist'];
export function createCompactProject(g,project,candidateId='B',{roster='24'}={}){
 if(!['24','20'].includes(roster))throw Error('Unknown compact encounter comparison');
 if(!['B','B-open'].includes(candidateId))throw Error('Only B/B-open have an authored encounter plan');
 const original=project.stages.find(s=>s.metadata?.stageId===11);
 if(!original?.initialState?.honroReviewedNarrativeRevision||!g.HonroAct23V4Reviewed?.enabled())throw Error('Reviewed production Stage11 source required');
 const c=candidateId==='B-open'?createOpenTwoStepB():createCompactCandidate(candidateId),p=clone(project),s=p.stages.find(s=>s.id===original.id),floor=c.terrains.find(t=>t.id==='compact-floor').points.slice(0,-2).map(v=>[v.x,v.y]);
 const at=(x,support='compact-floor',air=0)=>{const t=c.terrains.find(t=>t.id===support);if(!t)throw Error('Unknown support '+support);const points=support==='compact-floor'?floor:t.points.slice(0,t.points.length/2).map(v=>[v.x,v.y]);return{x,y:heightOn(points,x)-air,support};};
 Object.assign(s,{width:c.width,height:c.height,terrains:clone(c.terrains),elements:[],materials:[],events:[],encounters:[],objectives:[],markers:[],routes:clone(c.routes.find(r=>r.id==='main').anchors),anchors:{spawn:{x:300,y:2390},exit:clone(c.sites.exit)}});
 for(const k of ['playBounds','terrainBounds','terrainDomainVersion','camera'])delete s[k];
 s.metadata={...s.metadata,compactCandidate:candidateId,compactStatus:'unadopted-draft'};
 s.design={title:c.title,space:{version:1,rooms:[],surfaces:c.terrains.map(t=>({terrainId:t.id,edgeIndices:clone(t.properties.honroWalkEdges)})),scenery:[],landmarks:[],lights:[],terrainMaterials:[],terrainPlanes:[],rockCompositions:[]},compact11:{version:1,candidate:'B',status:'unadopted encounter/layout draft',sites:clone(c.sites),routes:clone(c.routes),visualSupports:clone(c.visualSupports),artStatus:'collision proxies; artwork not complete',minibossStatus:'role/telegraph/counter design only; unique behavior and tuning not implemented',budget:{initial:21,finite:3,total:24,requiredInitial:15,requiredFinite:3,requiredTotal:18,optionalInitial:6,ordinaryElites:3,minibossCandidates:1,enemyActions:[3,5],configuredActionCap:5,measuredDifficulty:false}}};
 s.units=PARTY.map((kind,i)=>({id:'p-'+kind,kind,team:'player',x:[145,230,315,395][i],y:2390,facing:1}));
 const entry=[],central=[],exit=[];
 function enemy(id,kind,x,{support='compact-floor',air=0,role,cluster,elite=false,miniboss=false}={}){
  const q=at(x,support,air),record={id,kind,team:'enemy',x:q.x,y:q.y,facing:-1,spawnIndex:s.units.length-4,behavior:'patrol',encounterGroup:'compact11-'+cluster,stageOverrides:{elite,honroAct2Elite:elite,honroAct2Revision:2,honroCompact11Role:role,honroCompact11Cluster:cluster,honroEncounterRole:role,honroEncounterSupport:support,honroCompact11Air:!!air,...(miniboss?{honroCompact11MinibossCandidate:true}:{})}};
  s.units.push(record);({entry,central,exit}[cluster]).push(id);return record;
 }
 // Rooted entrance cover, front pressure, rear support and two airborne angles.
 enemy('rv11-entry-root-pack-0','hound',1520,{role:'host-charge',cluster:'entry',miniboss:true});
 enemy('rv11-entry-root-pack-2','stag',2120,{role:'next-host-side-pressure',cluster:'entry'});
 enemy('compact11-entry-front','hound',1300,{role:'cover-front',cluster:'entry'});
 enemy('compact11-entry-scree','human',1790,{role:'rear-shot',cluster:'entry'});
 enemy('compact11-entry-lantern','lantern',2320,{role:'delay-support',cluster:'entry',elite:true});
 enemy('compact11-entry-bat','bat',1655,{role:'upper-dive',cluster:'entry',air:240});
 enemy('compact11-entry-crow','crow',2210,{role:'side-dive',cluster:'entry',air:270});
 // An optional six-actor middle pocket; lower return is a recovery choice.
 enemy('compact11-central-lower-front','hound',2780,{role:'lower-front',cluster:'central'});
 enemy('compact11-central-lower-rear','resonance',3070,{role:'lower-wave',cluster:'central'});
 enemy('compact11-central-neck','human',2690,{support:'compact-stone-neck',role:'neck-shot',cluster:'central'});
 enemy('compact11-central-upper','lantern',2530,{support:'compact-upper-flank',role:'upper-delay',cluster:'central',elite:true});
 enemy('compact11-central-neck-east','stag',3280,{support:'compact-stone-neck',role:'neck-side',cluster:'central'});
 enemy('compact11-central-crow','crow',3000,{air:440,role:'hollow-dive',cluster:'central'});
 // The last combat lies beside the final gathering shoulder, not at map ends.
 enemy('compact11-exit-front','hound',4290,{role:'front-approach',cluster:'exit'});
 enemy('compact11-exit-side','stag',4540,{role:'side-charge',cluster:'exit'});
 enemy('compact11-exit-high','human',4930,{role:'high-shot',cluster:'exit'});
 enemy('compact11-exit-lantern','lantern',5190,{air:240,role:'rear-delay',cluster:'exit'});
 const guard=enemy('compact11-exit-guard','resonance',5435,{role:'gathering-approach-guard',cluster:'exit',elite:true});
 if(roster==='20')guard.stageOverrides.honroStage11GuardHpScale=.70;
 enemy('compact11-exit-bat','bat',4710,{air:290,role:'north-dive',cluster:'exit'});
 enemy('compact11-exit-crow','crow',5055,{air:390,role:'north-flank',cluster:'exit'});
 enemy('compact11-exit-rear','human',5580,{role:'exit-rear-shot',cluster:'exit'});
 const ids={entry,central,exit};
 if(roster==='20'){
  // A separate measured-budget candidate. Remove duplicated pressure angles,
  // retaining the manuscript hosts, one aerial axis per required encounter,
  // ranged support, the gathering guard and all six optional middle actors.
  const removed=new Set(['compact11-entry-front','compact11-entry-crow','compact11-exit-bat','compact11-exit-rear']);
  s.units=s.units.filter(u=>!removed.has(u.id));
  for(const list of [entry,exit])for(let i=list.length-1;i>=0;i--)if(removed.has(list[i]))list.splice(i,1);
 }
 s.encounters=['entry','central','exit'].map(key=>({id:'compact11-'+key,key:'compact11-'+key,behavior:'patrol',unitIds:clone(ids[key]),role:key==='central'?'optional alternate-height pocket':'required local threat'}));
 const marker=(id,q,extra={})=>({id,label:id,type:'act2',action:'act2',x:q.x,y:q.y,radius:180,...extra});
 s.markers=[marker('11.thread',at(330)),marker('11.entry-threat',c.sites.host),marker('11.exit-threat',at(5100)),marker('11.exit',c.sites.exit),marker('11.north',c.sites.exit)];
 const compact=roster==='20';
 // The ground group holds the northern approach. Air threats still engage,
 // but leaving their firing area does not leave a remote kill requirement.
 const approach=compact?exit.filter(id=>!['compact11-exit-lantern','compact11-exit-crow'].includes(id)):exit;
 const steps=[{id:'11.thread',label:'11.thread',kind:'v4-entry'},{id:'11.entry-threat',label:'11.entry-threat',kind:'clear',defeatIds:entry},{id:'11.exit-threat',label:'11.exit-threat',kind:'clear',defeatIds:approach},{id:'11.exit',label:'11.exit',kind:'reach',...(compact?{radius:320}:{})},{id:'11.north',label:'11.north',kind:'v4-world'}];
 const old=original.initialState,keys=['honroAct2Revision','honroAct2GeometryRevision','honroObjectiveRevision','honroNarrativeRevision','honroStoryCanonRevision','honroAct2PacingRevision','honroStage11QuestRevision','honroStage11TraceExitRevision','honroNarrativeCatalogueRevision','honroAct23V4Revision','honroV4Phase','honroReviewedNarrativeRevision'];
 s.initialState=Object.fromEntries(keys.filter(k=>old[k]!==undefined).map(k=>[k,clone(old[k])]));
 const bier=c.terrains.find(t=>t.id==='compact-bier-cover'),left=bier.points[0].x,right=bier.points[1].x;
 const physical={revision:1,bier:{id:bier.id,x:(left+right)/2,y:heightOn(floor,(left+right)/2),left,right,slope:0,roofY:bier.points[0].y},host:entry[0],other:entry[1],high:{...c.sites.firingRock,support:c.proxies.firingRock.terrainId},entries:[4660,4860,5300].map(x=>at(x)),northWarningPoint:at(4660),northTriggerX:compact?3650:3900,entryCamera:{x:1010,y:2290},riseCamera:{x:1520,y:c.sites.host.y-100},ambientIncoming:{from:{x:1130,y:2050},count:3,duration:2,distance:400,delta:{x:-1,y:.55}},dragMarks:{startX:left-190,y:heightOn(floor,left-100),count:6,spacing:31},releaseCamera:{host:entry[0],nextHost:entry[1]},gatherRadius:compact?320:180};
 Object.assign(s.initialState,{honroActiveLimit:5,honroStage11CompactRevision:1,honroStage11CompactCandidate:'B',honroStage11LandscapeRevision:0,honroStage11EncounterRevision:0,honroRavineVersion:0,honroStage11PopulationCap:24,honroEncounterDensityPopulationCap:24,honroV4Steps:clone(steps),honroAct2Steps:clone(steps),honroV4Chapter11:physical,honroV4Ambient:{from:{x:c.sites.exit.x-230,y:c.sites.exit.y},to:{x:c.sites.exit.x+260,y:c.sites.exit.y-70}},honroNarrativePressure:[],honroState:{flags:{},collected:[],hold:0,lastRound:1,rescued:false,combatLog:[],act2:{version:2,done:{},events:{},rescued:[],checkpoints:[],holds:{}}}});
 s.terrains.find(t=>t.id===bier.id).properties.honroV4Bier=true;
 s.terrains.find(t=>t.id===c.proxies.firingRock.terrainId).properties.honroV4FiringRock=true;
 s.design.compact11.roles=s.units.filter(u=>u.team==='enemy').map(u=>({id:u.id,kind:u.kind,cluster:u.stageOverrides.honroCompact11Cluster,encounterKey:u.encounterGroup,role:u.stageOverrides.honroCompact11Role,support:u.stageOverrides.honroEncounterSupport,air:u.stageOverrides.honroCompact11Air,ordinaryElite:u.stageOverrides.elite,minibossCandidate:!!u.stageOverrides.honroCompact11MinibossCandidate,required:entry.includes(u.id)||approach.includes(u.id)}));
 s.design.compact11.minibossProposal={id:entry[0],patterns:['telegraphed host charge','exposed spirit/next-host transition'],telegraph:'charge lane and next host before allied response boundary',counter:'side entry or high firing rock, then separate exposed spirit',implemented:false,status:'behavior/tuning/play validation pending; no HP-only completion claim'};
 s.environment=g.HonroEnvironment.makeEnvironment(s);
 s.metadata.compactCandidate=candidateId;s.design.compact11.candidate=candidateId;s.initialState.honroStage11CompactCandidate=candidateId;
 s.initialState.honroEncounterDensityRevision=1;
 s.initialState.honroStage11CompactRosterRevision=roster==='20'?2:1;
 if(roster==='20'){
  Object.assign(s.design.compact11.budget,{initial:17,total:20,requiredInitial:entry.length+approach.length,requiredTotal:entry.length+approach.length+3,optionalInitial:17-entry.length-approach.length});
  s.design.compact11.budget.comparison='20 total is below unconfirmed v3 proposal24..30; compact size/observed shot and reunion budget reevaluation, not a v3 numeric pass';
  s.initialState.honroStage11PopulationCap=20;s.initialState.honroEncounterDensityPopulationCap=20;
 }
 s.design.compact11.firingRockPolicy=clone(c.proxies.firingRock);
 if(c.alternative)s.design.compact11.alternative=clone(c.alternative);
 // The common author extends canonical polygons; no dummy/skirt is authored.
 return g.HonroTerrainDomain.author(p);
}
export const createStage11CompactProject=createCompactProject;
