(function(G){'use strict';
const clone=x=>structuredClone(x),C=G.HONRO_CORE;
const crossings=b=>b?.honroMap?.act3?.crossings||[];
const active=b=>!!b&&[25,27].includes(b.honroStage)&&crossings(b).length>0;
const heroes=b=>b.units.filter(u=>u.side===0&&!u.summoned&&!u.enthrall&&['archer','mage'].includes(u.cls));
const inside=(u,z)=>!!u&&!!z&&u.x>=z.left&&u.x<=z.right&&Math.abs(u.y-z.y)<130;
const current=b=>crossings(b)[b.honroStakeCrossing?.index||0];
const available=(b,u)=>active(b)&&u?.side===0&&u.cls==='mage'&&!u.summoned;
const skills=(b,u)=>available(b,u)?[...new Set([...u.loadout,'M09'])]:u.loadout;
function controls(b,u,selected){if(!active(b))return '';const s=b.honroStakeCrossing,c=current(b),extra=available(b,u)&&!u.loadout.includes('M09');return `${extra?`<button class="skill-button ${selected==='M09'?'selected':''}" data-action="combat-skill" data-skill="M09" aria-label="수로 임시 기예 축지진목"><span class="skill-name">축지진목</span><span class="mana-cost">${Math.round(C.SKILLS.M09.cost*C.skillManaFactor(u.ranks.M09||1))}</span><span class="rank-tiny">${u.ranks.M09?'기존 +'+u.ranks.M09:'이 구간 기본 기예'}</span></button>`:''}${c?`<button class="skill-button" data-action="stake-retry" title="두 동행과 전장을 이 구간 출발 상태로 되돌립니다. 회복 지점이 아닙니다."><span class="skill-name">구간 다시 준비</span><span class="rank-tiny">${(s?.index||0)+1}/${crossings(b).length} · ${Object.keys(s?.crossed||{}).length}/2 도착</span></button>`:''}`;}
function takeCheckpoint(b){const state=b.honroStakeCrossing;const copy={...b};delete copy.honroStakeCrossing;delete copy.honroStory;state.checkpoint=clone(copy);}
function initialize(b,capture=true){if(!active(b))return;const s=b.honroStakeCrossing??={version:1,index:0,crossed:{},attempted:false,retries:0};if(capture&&!s.checkpoint)takeCheckpoint(b);}
function retry(app,reason){const e=app.engine,b=e?.b;if(!active(b))return false;initialize(b);const s=b.honroStakeCrossing;if(!s.checkpoint)return false;
 // Restore this attempt's complete battlefield, not just HP: spent items,
 // enemies, terrain and encounter triggers cannot be retained as free progress.
 // Earned XP remains monotonic; its existing capped ledger prevents refarming.
 const progress={heroes:clone(b.heroes),honroGrowth:clone(b.honroGrowth)},awarded=new Map(b.units.map(u=>[u.id,u.xpGranted||0]));
 const restored=clone(s.checkpoint);for(const k of Object.keys(b))delete b[k];Object.assign(b,restored,progress);
 b.honroStakeCrossing={...s,crossed:{},attempted:false,pairSeen:false,retries:(s.retries||0)+1,lastReason:reason};
 for(const u of b.units){u.xpGranted=Math.max(u.xpGranted||0,awarded.get(u.id)||0);if(u.side===0&&!u.summoned&&b.heroes[u.cls])C.applyHero(u,b.heroes[u.cls]);}
 b.stakes=(b.stakes||[]).filter(z=>z.skill!=='M09');b.projectiles=[];b.volley=undefined;b.phase='aim';b.side=0;b.turnAge=0;
 app.done=false;app.cancelInput?.();app.close?.();app.turnNotice=null;app.dirty=true;app.event?.(reason+' 두 동행과 자원을 구간 출발 때로 되돌렸습니다.');
 app.profile.honroBattle=clone(b);app.persist?.();app.updateHUD?.(true);return true;
}
function recoverFailure(app){const b=app.engine?.b;if(!active(b)||!current(b))return false;const dead=heroes(b).find(u=>u.dead||u.hp<=0||u.y>b.height-50);return dead?retry(app,(dead.cls==='mage'?'담허':'설오')+'가 물길에서 쓰러졌습니다.'):false;}
function allowsStep(b,id){if(!active(b))return true;const n=crossings(b).findIndex(c=>c.markerId===id);return n<0||n<(b.honroStakeCrossing?.index||0);}
function attach(app,e){if(!active(e.b)||e.honroStakeAttached)return;e.honroStakeAttached=true;initialize(e.b,false);
 const fire=e.fire.bind(e);e.fire=function(id,...args){const b=e.b,u=e.active;if(id!=='M09'||!available(b,u))return fire(id,...args);initialize(b);const c=current(b),s=b.honroStakeCrossing;
  if(c&&!inside(u,c.fromZone)){e.message('현재 물길의 출발 석대에서 진목을 설치하세요.');return false;}
  if(c&&Object.keys(s.crossed).length){e.message('두 동행이 모두 건넌 뒤 다음 진목을 설치하세요.');return false;}
  const old=u.loadout;try{u.loadout=skills(b,u);const ok=fire(id,...args);if(ok&&c){s.attempted=true;s.pairSeen=false;s.crossed={};}return ok;}finally{u.loadout=old;}
 };
 const use=e.useGate.bind(e);e.useGate=function(){const b=e.b,c=current(b),u=e.active,s=b.honroStakeCrossing;if(!c)return use();const from=e.gateCandidate(),to=(b.stakes||[]).find(z=>z.skill==='M09'&&z.side===0&&z.id!==from?.id);
  if(!inside(from,c.fromZone)||!inside(to,c.landing)){e.message('출발 석대와 다음 석대를 잇는 진목 한 쌍이 필요합니다.');return false;}
  const ok=use();if(ok&&inside(u,c.landing)){s.crossed[u.cls]=true;app.dirty=true;tick(app);app.profile.honroBattle=clone(b);app.persist?.();}return ok;
 };
}
function tick(app){const b=app.engine?.b;if(!active(b)||app.dialogue||app.done)return;initialize(b);if(recoverFailure(app))return;const s=b.honroStakeCrossing,c=current(b);if(!c)return;
 const team=heroes(b),gates=(b.stakes||[]).filter(z=>z.skill==='M09'&&z.side===0&&(z.expires===undefined||z.expires>b.round));
 if(team.length===2&&team.every(u=>s.crossed[u.cls]&&inside(u,c.landing))){s.index++;s.crossed={};s.attempted=false;s.pairSeen=false;b.stakes=(b.stakes||[]).filter(z=>z.skill!=='M09');takeCheckpoint(b);app.dirty=true;app.event?.(current(b)?'두 동행이 건넜습니다. 다음 석대에 새 진목을 설치하세요.':'두 동행이 물길을 건넜습니다. 기록 조사로 이어갑니다.');app.updateHUD?.(true);return;}
 if(s.attempted&&gates.length===2)s.pairSeen=true;
 if(s.attempted&&!b.projectiles.some(p=>p.skill==='M09')&&b.phase!=='flight'){
  if(gates.length!==2)return retry(app,s.pairSeen?'진목이 만료되어 동행이 고립되었습니다.':'진목이 안전한 석대에 닿지 않았습니다.');
  if(!gates.some(z=>inside(z,c.fromZone))||!gates.some(z=>inside(z,c.landing)))return retry(app,'진목이 다음 석대에 연결되지 않았습니다.');
 }
 // A jump, dash or lower floor cannot satisfy a crossing in place of M09.
 if(team.some(u=>inside(u,c.landing)&&!s.crossed[u.cls]))retry(app,'두 동행은 직접 설치한 축지진목으로 건너야 합니다.');
}
G.HonroStakeCrossing={active,crossings,current,available,skills,controls,initialize,takeCheckpoint,attach,tick,retry,recoverFailure,allowsStep};
})(globalThis);
