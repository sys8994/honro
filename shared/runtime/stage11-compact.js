(function(G){'use strict';
// New entry/retry only. A live battle remains its own geography and story.
const clone=x=>JSON.parse(JSON.stringify(x)),data=()=>G.HONRO_STAGE11_COMPACT_DATA;
const enabled=()=>data()?.revision===1&&G.HonroAct23V4Reviewed?.enabled()===true;
const active=b=>b?.honroStage===11&&b.honroStage11CompactRevision===1;
function author(project){
 if(!enabled())return project;
 const d=data(),old=project.stages.find(s=>s.metadata?.stageId===11);
 // The web loader authors one real chapter at a time. Other chapters do not
 // contain Stage11 and must pass through without validating/replacing it.
 if(!old)return project;
 if(JSON.stringify(old)!==JSON.stringify(d.source))throw Error('Stage11 compact source changed; regenerate and review the candidate.');
 if(d.stage.width!==6200||d.stage.height!==3200||d.stage.initialState?.honroStage11CompactRevision!==1)throw Error('Invalid compact Stage11 package');
 const ids=new Set(project.library.map(a=>a.id)),assets=clone(d.assets||[]);
 for(const a of assets){if(ids.has(a.id)||a.collision?.length)throw Error('Compact art must use new collision-free asset IDs');ids.add(a.id);}
 return {...project,stages:project.stages.map(s=>s===old?clone(d.stage):s),library:[...project.library,...assets]};
}
function preserveBattle(b){
 if(!enabled()||b?.honroStage!==11||b.honroCustom||b.honroMapOrigin!=='campaign'||b.mode!=='campaign'||b.honroRevision!==20)return false;
 if(![undefined,0,1,211,412].includes(b.honroCampaignMapRevision))return false;
 if(!((b.width===16000&&b.height===12000)||(b.width===7800&&b.height===4800)))return false;
 const finite=(o,keys)=>o&&keys.every(k=>Number.isFinite(o[k]));
 const terrain=t=>t&&typeof t.id==='string'&&((Array.isArray(t.vertices)&&t.vertices.length>=3&&t.vertices.every(p=>finite(p,['x','y'])))||(finite(t,['x','y','w','h'])&&t.w>0&&t.h>0));
 const actor=u=>u&&typeof u.id==='string'&&finite(u,['x','y','hp','h','r'])&&u.h>0&&u.r>0;
 return Array.isArray(b.terrain)&&b.terrain.length>0&&b.terrain.every(terrain)&&Array.isArray(b.units)&&b.units.length>0&&b.units.every(actor);
}
const previous=G.HonroAct23V4.mapRevision;
G.HonroAct23V4.mapRevision=id=>enabled()&&Number(id)===11?413:previous(id);
G.HonroStage11Compact={enabled,active,author,preserveBattle};
})(globalThis);
