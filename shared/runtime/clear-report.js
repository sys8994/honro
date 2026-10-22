(function(G){'use strict';
// Attempt aggregates are independent of the capped contribution-XP ledger.
const C=G.HONRO_CORE,ALL=['archer','mage','knight','occultist'],VERSION=1;
const clone=x=>JSON.parse(JSON.stringify(x)),num=n=>Number.isFinite(n)?Math.max(0,n):0;
const hero=u=>u?.side===0&&!u.summoned&&!u.enthrall&&!u.honroAlly&&!u.honroCivilian&&ALL.includes(u.cls);
const object=u=>!!u?.honroObjectiveTarget||['objective','device','gate','bier','support','ballista'].includes(u?.role);
const stats=()=>({damage:0,received:0,kills:0,healing:0,shield:0,shieldReceived:0,uses:0});
let serial=0;
function begin(b,{fresh=false,scope}={}){
 if(!b)return null;
 if(!fresh&&b.honroReport?.version===VERSION){if(scope&&!b.honroReport.final)b.honroReport.scope=scope;if(b.honroReport.final)deepFreeze(b.honroReport.final);return b.honroReport;}
 const s=b.honroReport={version:VERSION,gameVersion:'honro-report-20261022-v1',attempt:`${b.session||b.honroStage}-${Date.now()}-${++serial}`,stage:b.honroStage||b.stageId,scope:scope||(b.honroCustom?'custom':b.mode==='practice'?'practice':'campaign'),partial:!fresh,startedRound:b.round,seconds:0,retries:num(b.honroStakeCrossing?.retries),order:[],heroes:{},owners:{},xp:{},deaths:{},counts:{kills:0,knockouts:0},other:{},missing:{}};
 for(const cls of ALL)if(b.heroes?.[cls])s.xp[cls]={before:num(b.heroes[cls].xp),last:num(b.heroes[cls].xp),combat:0,settlement:0,reunion:0};
 for(const cls of b.activeRoster||ALL)for(const u of b.units.filter(u=>hero(u)&&u.cls===cls))register(b,u);
 for(const u of b.units)register(b,u);
 // A legacy projectile/status may predate capture or release. Its original
 // allegiance/skill cannot be reconstructed from today's actor with that ID.
 if(s.partial){
  const unknown=(id,skill)=>{if(id)s.missing[id]=true;return {id:id||null,kind:'unresolved',skill:skill||'unknown'};};
  for(const p of [...(b.projectiles||[]),...(b.zones||[])])p.honroReportSource??=unknown(p.owner,p.skill);
  for(const u of b.units){if(u.curseDamage>0)u.honroDotReport??=unknown(u.honroDotOwner||u.curseOwner,u.honroDotSkill);if(u.earthbind)u.honroEarthReport??=unknown(u.earthbind.owner,u.honroEarthSkill);}
 }
 return s;
}
const live=b=>b?.honroReport&&!b.honroReport.final&&!['won','lost'].includes(b.phase)?b.honroReport:null;
function register(b,u,skill){
 const s=b?.honroReport;if(!s||s.final||!u)return;
 const parent=u.summonOwner||u.enthrall?.owner;
 if(parent){const p=b.units.find(v=>v.id===parent);if(p&&p!==u&&!s.owners[parent])register(b,p);}
 const prior=s.owners[u.id],owner=parent?s.owners[parent]:null;
 s.owners[u.id]={cls:hero(u)?u.cls:parent?(owner?.cls||prior?.cls||null):null,side:parent?owner?.side??u.side:u.side,kind:hero(u)?'hero':parent?'summon':u.side===2||u.honroAlly||u.honroCivilian?'npc':u.side===1?'enemy':'unknown',skill:skill||u.honroReportSkill||prior?.skill||null,parent:parent||null};
 if(hero(u)&&!s.heroes[u.cls]){s.order.push(u.cls);s.heroes[u.cls]={...stats(),skills:{}};}
}
function source(b,id,skill){
 if(!b?.honroReport)return undefined;
 const s=b.honroReport,u=b.units.find(v=>v.id===id);
 if(u)register(b,u);
 const o=s.owners[id];
 if(!o){if(id)s.missing[id]=true;return {kind:id||skill&&!skill.startsWith('environment:')?'unresolved':'environment',skill:skill||'unknown',id:id||null};}
 return {...o,skill:o.kind==='summon'?o.skill||'unknown':skill||'unknown',id};
}
function skillRow(s,cls,id){const h=s.heroes[cls];return h?(h.skills[id]??={...stats(),usesKnown:!s.partial}):null;}
function other(s,key){return s.other[key]??=stats();}
function projectile(b,p,u){if(!b?.honroReport||b.honroReport.final)return;register(b,u);p.honroReportSource=source(b,u.id,p.skill);}
function hit(b,u,owner,actual,absorbed=0,skill,kind='normal',origin){
 const s=live(b);if(!s)return;actual=num(actual);absorbed=num(absorbed);if(!actual&&!absorbed)return;
 register(b,u);const src=kind==='environment'?source(b,'',skill):origin||source(b,owner,skill),target=s.owners[u.id],cls=src.cls;
 if(hero(u)){s.heroes[u.cls].received+=actual;s.heroes[u.cls].shieldReceived+=absorbed;}
 if(src.kind==='unresolved'&&src.id)s.missing[src.id]=true;
 if(object(u)){other(s,'objects').damage+=actual;return;}
 if(u.summoned){other(s,'summons').damage+=actual;return;}
 if(u.side===1){
  if(cls&&s.heroes[cls]){const h=s.heroes[cls],r=skillRow(s,cls,src.skill);h.damage+=actual;h.shield+=absorbed;r.damage+=actual;r.shield+=absorbed;}
  else{const r=other(s,src.kind);r.damage+=actual;r.shield+=absorbed;}
 }else if(cls){const r=other(s,'friendly');r.damage+=actual;r.shield+=absorbed;}
 else if(target?.kind==='hero'){const r=other(s,src.kind);r.received+=actual;r.shield+=absorbed;}
}
function heal(b,u,owner,actual,skill){
 const s=live(b);actual=num(actual);if(!s||!actual)return;register(b,u);const src=source(b,owner,skill);
 if(object(u)||u.side===1){other(s,'otherHealing').healing+=actual;return;}
 if(src.cls&&s.heroes[src.cls]){s.heroes[src.cls].healing+=actual;skillRow(s,src.cls,src.skill).healing+=actual;}
 else other(s,src.kind).healing+=actual;
}
function cast(b,u,skill){const s=live(b);if(!s)return;register(b,u);const src=source(b,u.id,skill);if(src.kind==='hero'&&s.heroes[src.cls]){s.heroes[src.cls].uses++;const r=skillRow(s,src.cls,skill);r.uses++;r.usesKnown=true;}}
function death(b,u,owner,skill,kind='normal',origin){
 const s=live(b);if(!s||u.hp>0||s.deaths[u.id]||object(u)||u.summoned)return;
 s.deaths[u.id]=true;
 if(hero(u)||u.honroAlly||u.honroCivilian){s.counts.knockouts++;return;}
 if(u.side!==1||u.enthrall)return;
 s.counts.kills++;const src=kind==='environment'?source(b,'',skill):origin||source(b,owner,skill);
 if(src.cls&&s.heroes[src.cls]){s.heroes[src.cls].kills++;skillRow(s,src.cls,src.skill).kills++;}else other(s,src.kind).kills++;
}
// Cumulative XP boundaries are a grant identity: the same interval cannot pay twice.
function grant(b,cls,before,after,kind='combat'){
 const s=b?.honroReport;if(!s||s.final||!s.xp[cls])return;
 const r=s.xp[cls],actual=Math.max(0,num(after)-Math.max(num(before),r.last));
 r.last=Math.max(r.last,num(after));r[kind]=(r[kind]||0)+actual;
}
const xpSnapshot=b=>Object.fromEntries(ALL.map(cls=>[cls,num(b.heroes?.[cls]?.xp)]));
function settle(b){
 const s=b?.honroReport;if(!s||s.final)return;
 const before=xpSnapshot(b);G.HonroProgression.complete(b);
 const split=G.HonroSplitCampaign?.active(b),end=b.honroSplit?.version===1?27:28;
 const kind=split&&s.stage===end?'reunion':'settlement';
 for(const cls of ALL)grant(b,cls,before[cls],b.heroes?.[cls]?.xp,kind);
 s.deferred=!!G.HonroProgression.contributionState(b)?.deferred;
 if(kind==='reunion')s.reunionStages=[25,end];
}
function deepFreeze(v){if(v&&typeof v==='object'&&!Object.isFrozen(v)){for(const x of Object.values(v))deepFreeze(x);Object.freeze(v);}return v;}
function freeze(b){
 const s=b?.honroReport;if(!s)return null;if(s.final)return s.final;
 const totals=stats();for(const h of Object.values(s.heroes))for(const k of Object.keys(totals))totals[k]+=h[k];
 s.final=deepFreeze(clone({version:VERSION,gameVersion:s.gameVersion,attempt:s.attempt,stage:s.stage,scope:s.scope,partial:s.partial,startedRound:s.startedRound,rounds:b.round,seconds:s.seconds,retries:s.retries,order:s.order,heroes:s.heroes,xp:s.xp,counts:s.counts,other:s.other,missing:Object.keys(s.missing),totals,deferred:!!s.deferred,reunionStages:s.reunionStages||null,completedAt:new Date().toISOString(),difficulty:b.difficulty}));
 return s.final;
}
function finish(app){const b=app.engine?.b;if(!b||b.phase!=='won')return null;begin(b,{scope:scopeOf(app)});settle(b);const report=freeze(b),scope=scopeOf(app);
 if(scope==='campaign'){
  const records=app.profile.honroClearReports??={};records[report.stage]=report;
  for(const id of Object.keys(records))if(!/^([1-9]|[12][0-9]|30)$/.test(id)||records[id]?.version!==VERSION)delete records[id];
  app.profile.honroReportNotice={stage:report.stage,attempt:report.attempt};
 }else{const records=app.profile.honroIsolatedReports??={};records[scope+':'+report.stage]=report;for(const id of Object.keys(records).slice(0,-6))delete records[id];}
 return report;
}
const scopeOf=app=>app.customMap?'custom':app.training?'practice':app.debugMode?'debug':'campaign';
function retry(b,retained){if(!b||!retained)return;const s=b.honroReport||begin(b,{scope:retained.scope});s.attempt=retained.attempt;s.startedRound=retained.startedRound;s.seconds=retained.seconds;s.retries=(retained.retries||0)+1;s.xp=clone(retained.xp);s.partial||=retained.partial;delete s.final;}
function time(app,now){
 const b=app.engine?.b,active=!!b&&app.screen==='battle'&&!app.done&&!G.document?.hidden&&!app.dialogue&&!app.modal?.classList.contains('open')&&!G.HonroCampaignEntry?.isPending?.(app)&&!G.HonroAct3Void?.blocked(app)&&!G.HonroBellAnomaly?.blocked(app)&&!G.HonroStory?.turnPaused(app,now)&&!['won','lost'].includes(b.phase),last=app.reportClock;
 if(active&&last?.active&&last.attempt===b.honroReport?.attempt){const s=live(b);if(s)s.seconds+=Math.max(0,(now-last.now)/1000);}
 app.reportClock={now,active,attempt:b?.honroReport?.attempt};
}
function get(app,id){const r=scopeOf(app)==='campaign'?app.profile.honroClearReports?.[id]:app.profile.honroIsolatedReports?.[scopeOf(app)+':'+id];return r?.version===VERSION?r:null;}
G.HonroClearReport={VERSION,ALL,hero,begin,register,projectile,origin:source,hit,heal,cast,death,grant,settle,freeze,finish,retry,time,get,scopeOf,deepFreeze};
})(globalThis);
