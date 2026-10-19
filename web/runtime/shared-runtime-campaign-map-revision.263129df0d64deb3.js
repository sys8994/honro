(function(G){'use strict';
const clone=x=>structuredClone(x),REVISIONS=Object.freeze({1:1,2:1,3:1,4:1,5:1,6:1,7:1,8:1,9:1,10:1,...Object.fromEntries(Array.from({length:10},(_,i)=>[21+i,1]))});
// Increment only the chapters whose authored geography/encounters are replaced.
// Workshop projects and their protected campaign owner are outside this contract.
const current=id=>REVISIONS[id]||0;
const campaign=b=>!!b&&!b.honroCustom&&b.honroMapOrigin!=='workshop'&&b.mode==='campaign';
function stamp(b){if(campaign(b))b.honroCampaignMapRevision=current(b.honroStage);}
function obsolete(b){return campaign(b)&&(b.honroRevision!==20||(current(b.honroStage)>0&&b.honroCampaignMapRevision!==current(b.honroStage)));}
function preserveGrowth(p,b){
 for(const cls of G.HONRO_CORE.CLASS_IDS){const h=p.heroes?.[cls],saved=b.heroes?.[cls];if(!h||!saved)continue;
  G.HONRO_CORE.grantXP(h,Math.max(0,(saved.xp||0)-(h.xp||0)));
  for(const key of ['kills'])if(Number.isFinite(saved[key]))h[key]=Math.max(h[key]||0,saved[key]);
 }
 const stored=b.honroGrowth?.ledger;if(!stored)return;
 p.honroGrowth??={version:stored.version,stages:{}};p.honroGrowth.stages??={};
 p.honroGrowth.version=Math.max(p.honroGrowth.version||0,stored.version||0);
 for(const[id,row]of Object.entries(stored.stages||{})){
  const old=p.honroGrowth.stages[id],newer=!old||(row.contribution?.sequence||0)>=(old.contribution?.sequence||0);
  const merged={...clone(row),...clone(old||{}),combat:{}};
  for(const cls of new Set([...Object.keys(row.combat||{}),...Object.keys(old?.combat||{})]))merged.combat[cls]=Math.max(row.combat?.[cls]||0,old?.combat?.[cls]||0);
  if(newer&&row.contribution)merged.contribution=clone(row.contribution);
  merged.cleared=!!(row.cleared||old?.cleared||p.cleared?.[id]);
  if(+id===b.honroStage&&b.honroGrowth.limit)merged.limit=clone(b.honroGrowth.limit);
  p.honroGrowth.stages[id]=merged;
 }
}
function discard(p){
 const b=p.honroBattle;if(!obsolete(b))return false;
 const id=b.honroStage||p.lastStage||1;
 preserveGrowth(p,b);
 G.HonroSplitCampaign?.restartForMap(p,id,b.honroSplit);
 p.honroBattle=null;p.honroMapRestart=id;p.lastStage=id;p.upgradeNotice=true;
 return true;
}
G.HonroCampaignMapRevision={current,stamp,obsolete,discard};
})(globalThis);

