(function(G){'use strict';
const clone=x=>structuredClone(x),C=G.HONRO_CORE;
const crossings=b=>b?.honroMap?.act3?.crossings||[];
const active=b=>!!b&&[25,27].includes(b.honroStage)&&crossings(b).length>0;
const heroes=b=>b.units.filter(u=>u.side===0&&!u.summoned&&!u.enthrall&&['archer','mage'].includes(u.cls));
const inside=(u,z)=>!!u&&!!z&&u.x>=z.left&&u.x<=z.right&&Math.abs(u.y-z.y)<130;
const current=b=>crossings(b)[b.honroStakeCrossing?.index||0];
const available=(b,u)=>active(b)&&u?.side===0&&u.cls==='mage'&&!u.summoned;
const skills=(b,u)=>available(b,u)?[...new Set([...u.loadout,'M09'])]:u.loadout;
function controls(b,u,selected){if(!active(b))return '';const s=b.honroStakeCrossing,c=current(b);if(!c)return '';const mage=available(b,u),rank=u.ranks?.M09||1;return `<div class="stake-crossing-heading"><span>물길 ${(s?.index||0)+1} / ${crossings(b).length}</span><strong>${Object.keys(s?.crossed||{}).length} / 2 동행 도착</strong></div><p>${mage?'두 동행을 출발 표식에 모은 뒤 건너편 석대로 발사':'담허의 축지진목을 설치하고, 진목 곁에서 E'}</p><div class="stake-crossing-actions">${mage?`<button class="${selected==='M09'?'selected':''}" data-action="combat-skill" data-skill="M09" aria-label="수로 기예 축지진목"><strong>5 · 축지진목</strong><small>${u.ranks.M09?'기존 +'+rank:'이 수로에서 임시 제공'} · ${Math.round(C.SKILLS.M09.cost*C.skillManaFactor(rank))} 기력</small></button>`:''}<button class="stake-retry" data-action="stake-retry" title="동행·적·자원을 이 구간 출발 상태로 복원합니다.">구간 재시도</button></div>`;}
function refresh(app){const host=typeof document!=='undefined'&&document.getElementById('stake-crossing-tools');if(!host||!app.engine)return;const b=app.engine.b,u=app.engine.active;if(!u)return;const html=controls(b,u,app.selected);host.hidden=!html;if(host.innerHTML!==html)host.innerHTML=html;}
function takeCheckpoint(b){const state=b.honroStakeCrossing;const copy={...b};delete copy.honroStakeCrossing;delete copy.honroStory;state.checkpoint=clone(copy);}
function initialize(b,capture=true){if(!active(b))return;const s=b.honroStakeCrossing??={version:1,index:0,crossed:{},attempted:false,retries:0};if(capture&&!s.checkpoint)takeCheckpoint(b);}
function retry(app,reason){const e=app.engine,b=e?.b;if(!active(b))return false;initialize(b);const s=b.honroStakeCrossing;if(!s.checkpoint||heroes(s.checkpoint).length!==2||heroes(s.checkpoint).some(u=>u.dead||u.hp<=0))return false;
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
function failure(b){if(!active(b))return null;const dead=heroes(b).some(u=>u.dead||u.hp<=0),cp=b.honroStakeCrossing?.checkpoint;return dead&&(!cp||heroes(cp).length!==2||heroes(cp).some(u=>u.dead||u.hp<=0))?'물길 출발 때부터 동행이 쓰러져 있습니다. 이 장을 다시 시작해야 합니다.':null;}
function recoverFailure(app){const b=app.engine?.b;if(!active(b)||!current(b))return false;const dead=heroes(b).find(u=>u.dead||u.hp<=0||u.y>b.height-50);return dead?retry(app,(dead.cls==='mage'?'담허':'설오')+'가 물길에서 쓰러졌습니다.'):false;}
function allowsStep(b,id){if(!active(b))return true;const n=crossings(b).findIndex(c=>c.markerId===id);return n<0||n<(b.honroStakeCrossing?.index||0);}
function attach(app,e){if(!active(e.b)||e.honroStakeAttached)return;e.honroStakeAttached=true;initialize(e.b,false);
 const fire=e.fire.bind(e);e.fire=function(id,...args){const b=e.b,u=e.active;if(id!=='M09'||!available(b,u))return fire(id,...args);initialize(b);const c=current(b),s=b.honroStakeCrossing;
  if(c&&!heroes(b).every(v=>inside(v,c.fromZone))){e.message('설오와 담허를 함께 출발 석대의 진목 표식으로 옮기세요.');return false;}
  if(c&&!s.armed){s.armed=true;takeCheckpoint(b);}
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
 if(team.length===2&&team.every(u=>s.crossed[u.cls]&&inside(u,c.landing))){s.index++;s.armed=false;s.crossed={};s.attempted=false;s.pairSeen=false;b.stakes=(b.stakes||[]).filter(z=>z.skill!=='M09');takeCheckpoint(b);app.dirty=true;app.event?.(current(b)?'두 동행이 건넜습니다. 다음 석대에 새 진목을 설치하세요.':'두 동행이 물길을 건넜습니다. 기록 조사로 이어갑니다.');app.updateHUD?.(true);return;}
 if(s.attempted&&gates.length===2)s.pairSeen=true;
 if(s.attempted&&!b.projectiles.some(p=>p.skill==='M09')&&b.phase!=='flight'){
  if(gates.length!==2)return retry(app,s.pairSeen?'진목이 만료되어 동행이 고립되었습니다.':'진목이 안전한 석대에 닿지 않았습니다.');
  if(!gates.some(z=>inside(z,c.fromZone))||!gates.some(z=>inside(z,c.landing)))return retry(app,'진목이 다음 석대에 연결되지 않았습니다.');
 }
 // The authored gap physically excludes jumps. Crossing provenance is an
 // objective contract, never an invisible wall or forced spatial correction.
}
G.HonroStakeCrossing={active,crossings,current,available,skills,controls,refresh,initialize,takeCheckpoint,attach,tick,retry,recoverFailure,failure,allowsStep};
})(globalThis);
