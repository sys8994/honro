(function(G){'use strict';
// Opt-in SOP pilot actors only. No quest, victory, civilian or main-boss rules.
const configs={31:{key:'levee',name:'둑틈봉쇄체',blast:65,travel:1.65,retreat:180},34:{key:'shelf',name:'턱포격체',blast:85,travel:1.9,retreat:220},39:{key:'net',name:'그물봉쇄체',blast:35,travel:1.7,retreat:150}};
const alive=u=>!!u&&!u.dead&&u.hp>0&&!u.eaterCapturedBy;
const active=b=>!!configs[b?.honroAct4Preview]&&(b.honroCustom||b.honroAct4Official===1);
const equipped=(b,u)=>active(b)&&u?.side===1&&u.honroPilotMidboss===configs[b.honroAct4Preview].key&&!u.boss&&!u.honroAct4WreckBoss;
const memory=u=>u.honroPilotCombat??={version:1,phase:'guard',cycles:0,history:[]};
function decorate(record,stage,options={}){const cfg=configs[stage];if(!cfg)throw Error('Unsupported pilot stage');return {...record,name:cfg.name,stageOverrides:{...record.stageOverrides,name:cfg.name,honroPilotMidboss:cfg.key,honroMidboss:true,role:'guard',boss:0,...options}};}
function pose(u,s){u.role=s.phase==='exposed'||s.phase==='relocate'?'slinger':'guard';u.armor=s.phase==='exposed'||s.phase==='relocate'?.05:.15;u.intent={guard:'방향 방호 · 측후방 취약',telegraph:'곡사 예고 · 표적 고정',relocate:'재배치 · 방호 해제',exposed:'노출 · 측면 공격 기회'}[s.phase];}
function record(e,u,event,extra={}){const s=memory(u);s.history.push({event,round:e.b.round,x:u.x,y:u.y,...extra});if(s.history.length>40)s.history.shift();e.emit?.('save');}
function cancelled(e,u,reason){const s=memory(u);delete s.target;s.phase='relocate';record(e,u,'cancelled',{reason});}
function safe(e,u,t,cfg){
 // Do not put delayed splash onto residents or the explicitly protected zone.
 const b=e.b;if((b.honroAct4Design?.enemyExclusion||[]).some(z=>t.x+cfg.blast>z.x1&&t.x-cfg.blast<z.x2&&t.y+cfg.blast>z.y1&&t.y-cfg.blast<z.y2))return false;
 const residents=b.units.filter(v=>alive(v)&&(v.honroAct4Resident||v.honroCivilian));
 const origin={x:u.x,y:u.y-u.h*.55},acc=e.acceleration({wind:0,gravityScale:1,drag:0,vx:0,vy:0}),vy=(t.y-origin.y-.5*acc.y*cfg.travel**2)/cfg.travel;
 for(let i=0;i<=32;i++){const time=cfg.travel*i/32,x=origin.x+(t.x-origin.x)*i/32,y=origin.y+vy*time+.5*acc.y*time*time;if(residents.some(v=>Math.hypot(v.x-x,v.y-v.h*.5-y)<cfg.blast+v.r+120))return false;}return true;
}
function beginRelocation(e,u){const b=e.b,s=memory(u),cfg=configs[b.honroAct4Preview];s.phase='exposed';s.exposedRound=b.round;pose(u,s);delete s.relocateAfterShot;
 const destination=u.honroPilotRelocation,dir=u.facing>0?-1:1,p=destination&&Number.isFinite(destination.x)&&Number.isFinite(destination.y)?destination:{x:u.x+dir*cfg.retreat,y:u.y};
 if(alive(u)&&!u.fixed&&e.grounded(u)&&u.moveLeft>0){u.aiMove={round:b.round,targetId:u.id,path:[{x:p.x,y:p.y,jump:!!p.jump}],index:0,elapsed:0,stalled:0,lastX:u.x,lastY:u.y,jumping:false,intent:'재배치 · 방호 해제'};record(e,u,'relocate',{destination:p});return true;}
 record(e,u,'relocation-blocked');return false;
}
function action(e){const b=e.b,u=e.active;if(!equipped(b,u))return false;const s=memory(u),cfg=configs[b.honroAct4Preview];
 if(!alive(u)||u.carriedBy!==undefined||u.enthrall){delete s.target;delete s.relocateAfterShot;delete u.aiMove;e.finishAction();return true;}
 if(u.acted||u.aiMove||u.moveTarget!==undefined||e.settleBusy?.())return true;
 pose(u,s);
 if(s.phase==='guard'){
  const target=b.units.filter(v=>alive(v)&&v.side===0&&!v.summoned).sort((a,c)=>Math.hypot(a.x-u.x,a.y-u.y)-Math.hypot(c.x-u.x,c.y-u.y))[0];
  if(target){s.target={x:target.x,y:target.y-target.h*.5,id:target.id,round:b.round,teamEnd:b.teamEnds?.[0]||0,seen:false};s.phase='telegraph';u.facing=target.x>=u.x?1:-1;pose(u,s);record(e,u,'warning',{target:{...s.target}});}
  e.finishAction();return true;
 }
 if(s.phase==='telegraph'){
  const t=s.target;
  if(!t){cancelled(e,u,'missing-target');e.finishAction();return true;}
  if(!t.seen||!t.response||(b.teamEnds?.[0]||0)<=t.seenTeamEnd){e.finishAction();return true;}
  if(!safe(e,u,t,cfg)){cancelled(e,u,'protected-area');e.finishAction();return true;}
  u.facing=t.x>=u.x?1:-1;const before=new Set(b.projectiles.map(p=>p.id)),old=u.loadout;let fired=false;
  try{u.loadout=[...old,'HWD01'];fired=e.fire('HWD01',u.facing>0?55:125,.8,true);}finally{u.loadout=old;}
  if(fired){for(const p of b.projectiles.filter(p=>!before.has(p.id))){const seconds=cfg.travel,acc=e.acceleration({...p,wind:0,gravityScale:1,drag:0,vx:0,vy:0});Object.assign(p,{vx:(t.x-p.x)/seconds,vy:(t.y-p.y-.5*acc.y*seconds*seconds)/seconds,gravityScale:1,wind:0,drag:0,blast:cfg.blast,honroPilotArc:true});p.prevVy=p.vy;}record(e,u,'fired',{target:{...t},shot:b.shot});delete s.target;s.phase='relocate';s.relocateAfterShot=b.shot;}
  else{cancelled(e,u,'native-cast-rejected');e.finishAction();}return true;
 }
 if(s.phase==='relocate'){if(!beginRelocation(e,u))e.finishAction();return true;}
 // Movement completion consumes this action, keeping the exposed body hittable
 // for the next whole ally turn. No teleports or immunity during obstruction.
 if(s.phase==='exposed'){
  if(b.round>s.exposedRound){s.phase='guard';s.cycles++;pose(u,s);record(e,u,'guard');}
  e.finishAction();return true;
 }
 e.finishAction();return true;
}
function offer(e){const b=e.b,u=e.active;if(b.phase!=='aim'||b.side!==0||!alive(u)||u.side!==0||u.acted||u.summoned||u.enthrall)return;
 for(const enemy of b.units.filter(v=>equipped(b,v)&&alive(v))){const t=memory(enemy).target;if(t?.seen)(t.offered??={})[u.id]={round:b.round,teamEnd:b.teamEnds?.[0]||0};}}
const attached=new WeakSet();function attach(app){const e=app.engine;if(!e||attached.has(e))return;attached.add(e);const effective=e.effective?.bind(e);if(effective)e.effective=function(skill,u,...args){const out=effective(skill,u,...args);if(active(e.b)&&u?.side===1&&u.honroPilotBudgetBasis?.version===2&&Number.isFinite(u.honroPilotSkillAttack?.[skill.id]))out.damage*=u.honroPilotSkillAttack[skill.id];return out;};const original=e.enemyAction.bind(e);e.enemyAction=function(...args){if(!action(e))return original(...args);};for(const u of e.b.units)if(equipped(e.b,u))pose(u,memory(u));
 if(active(e.b)&&e.b.honroPilotRosterRevision===1&&G.HonroEncounterDensity){G.HonroEncounterDensity.installActivation(e);if(!e.b.honroPilotActivationReady){e.refreshActivation();e.b.honroPilotActivationReady=true;}}
 const can=e.canAct?.bind(e);if(can)e.canAct=function(...args){const ok=can(...args);if(ok&&!app.dialogue&&!app.modal?.classList.contains('open')&&!G.document?.hidden)offer(e);return ok;};
 const finish=e.finishAction.bind(e);e.finishAction=function(...args){const b=e.b,u=e.active,round=b.round;
 if(equipped(b,u)&&alive(u)&&!u.acted&&b.side===1&&memory(u).phase==='relocate'&&Number.isFinite(memory(u).relocateAfterShot)&&memory(u).relocateAfterShot===b.shot&&!b.projectiles.length){if(beginRelocation(e,u)){b.phase='enemy';b.turnAge=0;return;}}
 const eligible=alive(u)&&u.side===0&&!u.acted?b.units.filter(v=>equipped(b,v)).map(v=>memory(v).target).filter(t=>t?.offered?.[u.id]?.round===round):[];const out=finish(...args);if(u?.acted)for(const t of eligible)t.response??={id:u.id,round,teamEnd:b.teamEnds?.[0]||0};return out;};
}
function draw(scene,c,b){if(!active(b))return;const app=G.HonroApp;for(const u of b.units){if(!equipped(b,u)||!alive(u))continue;const s=memory(u),t=s.target;if(s.phase!=='telegraph'||!t)continue;
 const visible=G.HonroAct4TerrainPreview?.eventAPI?.inView(app,t,25);if(!visible)continue;
 // Reuse the coastal artillery's functional dashed ring, not authored scenery.
 c.save();c.strokeStyle='#bf8568';c.lineWidth=3;c.setLineDash([12,9]);c.beginPath();c.ellipse(t.x,t.y+40,configs[b.honroAct4Preview].blast+30,24,0,0,Math.PI*2);c.stroke();c.setLineDash([]);c.beginPath();c.moveTo(t.x-17,t.y);c.lineTo(t.x+17,t.y);c.moveTo(t.x,t.y-17);c.lineTo(t.x,t.y+17);c.stroke();c.fillStyle='#f2d7b1';c.font='bold 16px sans-serif';c.textAlign='center';c.fillText('고정 표적 · 다음 대응 뒤 곡사',t.x,t.y-28);c.restore();
 if(app?.scene===scene&&!G.document?.hidden&&!app.dialogue&&!app.modal?.classList.contains('open')&&scene.canvas?.checkVisibility?.({checkOpacity:true,checkVisibilityCSS:true})&&!t.seen){t.seen=true;t.seenTeamEnd=b.teamEnds?.[0]||0;t.seenRound=b.round;}if(t.seen&&app?.engine&&!app.dialogue&&!app.modal?.classList.contains('open'))offer(app.engine);
 }}
// Reference-growth starting budget, not a measured damage/round acceptance claim.
// Applied only when explicitly author-tagged records are freshly constructed.
function tuneFresh(u,b,st){const C=G.HONRO_CORE,P=G.HonroProgression;if(!active(b)||!u.honroPilotCombatBudget||!P||!C)return u;
 const mid=equipped(b,u),normal=C.DIFFICULTIES.normal,d=C.DIFFICULTIES[b.difficulty]||normal;
 const reference=G.HONRO_ACT4_PILOT_COMBAT_REFERENCE,stageReference=reference?.stages?.[b.honroAct4Preview];
 if(stageReference){const role=mid?'midboss':u.honroPilotRole,row=stageReference.roles[role];if(!row)throw Error('Missing pilot measured role '+role);
  const fraction=mid?.30:u.elite?.28:.26,hits=u.elite&&!mid?row.eliteHits:row.hits,hp=u.elite&&!mid?row.eliteHp:row.hp;
  const skillAttack=Object.fromEntries(Object.entries(row.incomingDamagePerAttackUnit).map(([id,damage])=>[id,stageReference.referenceHp*fraction/damage]));
  u.combatBaseHp=hp/normal.hp;u.hp=u.maxHp=Math.round(u.combatBaseHp*d.hp);u.combatBaseAttack=1/normal.damage;u.attack=u.combatBaseAttack*d.damage;u.honroEnemyDamageRevision=1;u.honroPilotSkillAttack=skillAttack;
  u.honroPilotBudgetBasis={version:2,status:reference.status,referenceId:reference.referenceId,role,referenceHp:stageReference.referenceHp,referenceShot:row.referenceShot,hits,fraction,skillAttack,normalHp:hp,...(row.plan?{plan:row.plan}:{})};return u;
 }
 if(b.honroAct4Preview===31&&b.honroPilotRosterRevision===1)throw Error('Missing stage31 measured pilot reference');
 const r=P.referenceStats(st),ids=mid?['HWD01']:u.loadout,skills=ids.map(id=>C.SKILLS[id]).filter(s=>s&&!s.passive),mean=skills.reduce((n,s)=>n+s.damage*C.skillBalanceFactor(s),0)/Math.max(1,skills.length);if(!mean)return u;
 const hits=mid?6:u.elite?1.8:1.5,fraction=mid?.30:u.elite?.28:.26,armor=mid?.15:Math.max(0,u.armor||0);
 u.combatBaseHp=r.shot*hits*(1-armor)/normal.hp;u.combatBaseAttack=r.hp*fraction/(mean*(1-r.armor)*normal.damage);
 u.hp=u.maxHp=Math.round(u.combatBaseHp*d.hp);u.attack=u.combatBaseAttack*d.damage;
 u.honroPilotBudgetBasis={version:1,status:'unmeasured-reference-start',referenceHp:r.hp,referenceShot:r.shot,hits,fraction};return u;
}
if(G.HonroUnits){const create=G.HonroUnits.create;G.HonroUnits.create=function(record,b,profile,st,...args){return tuneFresh(create.call(this,record,b,profile,st,...args),b,st);};}
const P=G.HonroAct4TerrainPreview;if(P?.attachCoast){const coast=P.attachCoast;P.attachCoast=function(app,...args){const out=coast.call(this,app,...args);attach(app);return out;};}
if(G.HonroScene){const live=G.HonroScene.prototype.liveWater;G.HonroScene.prototype.liveWater=function(c,b,...args){const out=live?.call(this,c,b,...args);draw(this,c,b);return out;};}
G.HonroAct4PilotCombat={configs,active,equipped,memory,decorate,action,attach,draw,tuneFresh,offer};
})(globalThis);
