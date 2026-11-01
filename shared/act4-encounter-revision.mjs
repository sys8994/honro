/** Small authored encounter revision, shared by Game/Workshop/native tooling.
 * Approved terrain, art and resident/story geometry remain byte-identical.
 * Keep large vector source chunks immutable when only actor records change.
 */
export function supportPoint(stage,id,x){
 const t=stage.terrains.find(t=>t.id===id),edges=t?.properties?.honroWalkEdges;
 if(!t||!Array.isArray(edges)||!edges.length)throw Error('Explicit walk edges required: '+id);
 const ys=[];for(const i of edges){const a=t.points[i],b=t.points[(i+1)%t.points.length];if(a&&b&&x>=Math.min(a.x,b.x)&&x<=Math.max(a.x,b.x)&&a.x!==b.x)ys.push(a.y+(b.y-a.y)*(x-a.x)/(b.x-a.x));}
 if(!ys.length||ys.some(y=>!Number.isFinite(y)||Math.abs(y-ys[0])>.01))throw Error('Missing or ambiguous supported point: '+id+' '+x);
 return{x,y:ys[0]};
}
const edits={
 33:[{id:'a4-33-h-3',key:'tidal',variant:'bind',name:'물목을 묶는 혼',retreat:170}],
 35:[{id:'a4-35-c-2',key:'bamboo',variant:'arc',name:'대숲 포격귀',retreat:150}],
 37:[{id:'a4-37-c-3',key:'wall',variant:'arc',name:'폐담의 포격귀',retreat:150},{id:'a4-37-b-2',key:'wall',variant:'bind',name:'아랫길 결박귀',retreat:140}],
 38:[{id:'a4-38-e-1',key:'pursuit',variant:'arc',name:'상층 봉쇄귀',retreat:170},{id:'a4-38-b-2',key:'pursuit',variant:'bind',name:'물가 결박귀',retreat:140}]
};
export function applyAct4EncounterRevision(project){
 const stages=project.stages.map(original=>{
  const n=original.metadata?.stageId;if(n<32||n>39||original.initialState?.honroAct4EncounterRevision===1)return original;
  const s={...original,units:original.units.map(u=>u.team==='enemy'?({...u,stageOverrides:{...u.stageOverrides}}):u),encounters:structuredClone(original.encounters),initialState:structuredClone(original.initialState)};
  for(const d of edits[n]||[]){const u=s.units.find(u=>u.id===d.id&&u.team==='enemy');if(!u)throw Error('Missing declared miniboss slot '+d.id);const o=u.stageOverrides;
   u.kind=d.variant==='bind'?'shade':'warden';u.name=d.name;
   Object.assign(o,{name:d.name,boss:0,honroMidboss:true,honroPilotMidboss:d.key,honroPilotVariant:d.variant,honroPilotCombatBudget:true,honroPilotRole:'midboss',fixed:false,r:26,h:106,armor:.04,elite:false,honroPilotRelocation:supportPoint(s,o.honroEncounterSupport,u.x+d.retreat)});
  }
  for(const [stage,id,x] of [[34,'a4-34-r-6',5250],[39,'a4-39-n-2',5220]])if(n===stage){const u=s.units.find(u=>u.id===id);if(!u)throw Error('Missing existing pilot '+id);u.stageOverrides.honroPilotRelocation=supportPoint(s,u.stageOverrides.honroEncounterSupport,x);}
  if(n===36){
   const removed=new Set(['a4-36-b-2','a4-36-b-3','a4-36-b-4']);s.units=s.units.filter(u=>!removed.has(u.id));
   const elite=s.units.find(u=>u.id==='a4-36-b-1'),guard=s.units.find(u=>u.id==='a4-36-a-1');if(!elite||!guard||!elite.stageOverrides.elite)throw Error('Stage36 reward identity missing');
   Object.assign(elite,supportPoint(s,'approved36-workshop',800),{encounterGroup:guard.encounterGroup});Object.assign(elite.stageOverrides,{honroEncounterSupport:'approved36-workshop',group:guard.stageOverrides.group});
   s.encounters=s.encounters.map(c=>({...c,unitIds:s.units.filter(u=>u.team==='enemy'&&u.encounterGroup===c.id).map(u=>u.id)})).filter(c=>c.unitIds.length);s.initialState.honroActiveLimit=2;s.initialState.honroActionBudgetRevision=1;
  }
  const routes=s.terrains.filter(t=>Array.isArray(t.properties?.honroWalkEdges)&&t.properties.honroWalkEdges.length).map(t=>t.id),defs={};
  for(const c of s.encounters){
   const members=s.units.filter(u=>u.team==='enemy'&&u.encounterGroup===c.id),bySupport=new Map();
   for(const u of members){const id=u.stageOverrides.honroEncounterSupport;if(!routes.includes(id))throw Error('Missing encounter walk support '+u.id);if(!bySupport.has(id))bySupport.set(id,[]);bySupport.get(id).push(u);}
   for(const [support,units] of bySupport){const cell=c.id+'@'+support,extra=[];
    for(const t of s.terrains.filter(t=>routes.includes(t.id)&&t.id!==support)){
     let near=false;for(const u of units)for(const i of t.properties.honroWalkEdges){const a=t.points[i],z=t.points[(i+1)%t.points.length],dx=z.x-a.x,dy=z.y-a.y,len=dx*dx+dy*dy,f=len?Math.max(0,Math.min(1,((u.x-a.x)*dx+(u.y-a.y)*dy)/len)):0,x=a.x+f*dx,y=a.y+f*dy;if(Math.abs(y-u.y)<=400&&Math.hypot(x-u.x,y-u.y)<=600)near=true;}
     if(near)extra.push({support:t.id,minX:Math.min(...units.map(u=>u.x))-600,maxX:Math.max(...units.map(u=>u.x))+600});
    }
    defs[cell]={supports:[support],extra,radius:n===36?700:900,maxHeight:650,engagementRounds:1};for(const u of units)u.stageOverrides.honroDensityCell=cell;
   }
  }
  Object.assign(s.initialState,{honroAct4EncounterRevision:1,honroEncounterDensityActivation:defs});return s;
 });return{...project,stages};
}
