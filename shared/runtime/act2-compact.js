(function(G){'use strict';
const clone=x=>JSON.parse(JSON.stringify(x)),packages=()=>G.HONRO_ACT2_COMPACT_PACKAGES||{},enabled=id=>!!packages()[Number(id)]&&G.HonroAct23V4ReviewedChapters?.enabled(Number(id));
function author(project){let out=project;for(const [id,d]of Object.entries(packages())){const old=out.stages.find(s=>s.metadata?.stageId===Number(id));if(!old||!enabled(id))continue;if(JSON.stringify(old)!==JSON.stringify(d.source))throw Error('Compact chapter source changed: '+id);const assets=clone(d.assets);if(assets.some(a=>a.collision?.length||out.library.some(v=>v.id===a.id)))throw Error('Invalid compact chapter assets');out={...out,stages:out.stages.map(s=>s===old?clone(d.stage):s),library:[...out.library,...assets]};}return out;}
function preserveBattle(b){const d=packages()[b?.honroStage];if(!d||!enabled(b.honroStage)||b.honroCustom||b.mode!=='campaign'||b.honroMapOrigin!=='campaign'||b.honroRevision!==20||b.honroCampaignMapRevision!==d.previousMapRevision||b.width!==d.source.width||b.height!==d.source.height)return false;
 const finite=(o,ks)=>o&&ks.every(k=>Number.isFinite(o[k]));return Array.isArray(b.terrain)&&b.terrain.length>0&&b.terrain.every(t=>typeof t.id==='string'&&(Array.isArray(t.vertices)&&t.vertices.length>=3&&t.vertices.every(p=>finite(p,['x','y']))||finite(t,['x','y','w','h'])&&t.w>0&&t.h>0))&&Array.isArray(b.units)&&b.units.length>0&&b.units.every(u=>typeof u.id==='string'&&finite(u,['x','y','hp','r','h'])&&u.r>0&&u.h>0);
}
const revision=G.HonroAct23V4.mapRevision;G.HonroAct23V4.mapRevision=id=>enabled(id)?packages()[Number(id)].mapRevision:revision(id);
G.HonroAct2Compact={author,enabled,preserveBattle};
})(globalThis);
