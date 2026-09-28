(function(G){'use strict';
function effects(b,u){
 const list=[];if(!u)return list;
 if(u.dead||u.hp<=0)return ['전투 불능'];
 if(u.meleeFollow==='ready')list.push('파진연격 · 검술 한 번');
 if(u.harmony)list.push('합세 · 다음 기예 강화');
 if(u.martialGuard)list.push(u.martialGuard.counter?'응수세 · 반격 대기':'수세');
 if(u.jucheonReady)list.push('주천완성');
 if(u.retreat)list.push('이탈보 · 후퇴 단계');
 if(u.prepared)list.push('정심 · 다음 절명 사격 강화');
 if(u.slowed)list.push('감속 '+Math.round(u.slowed.factor*100)+'%');
 if(u.stunnedRound===b.round&&u.acted)list.push('기절 · 이번 턴 행동 불가');
 else if(u.stun>0)list.push(`기절 · 다음 행동 ${u.stun}회 불가`);
 if(u.bound>0)list.push(`결박 ${u.bound}회 · 이동력 감소·이동 소모 증가`);
 if(u.curseTurns>0)list.push(`저주 ${u.curseTurns}턴${u.curseAttack>0?' · 공격력 '+Math.round(u.curseAttack*100)+'% 감소':''}`);
 if(u.shield>0)list.push(`보호막 ${Math.round(u.shield)}`);
 return list;
}
function embedded(b,u){return b.terrain.some(t=>!t.broken&&!t.oneWay&&u.x>=t.x&&u.x<=t.x+t.w&&u.y>G.HonroTerrain.topAt(t,u.x)+3&&u.y<t.y+t.h-.1);}
function reason(e,u,skill){
 const b=e.b;if(!u)return '행동할 동행이 없습니다';
 if(u.dead||u.hp<=0)return '전투 불능 · 다른 동행을 선택하세요';
 if(b.phase==='ally'||b.phase==='summon')return '동맹군 턴 · 행동을 기다리는 중';
 if(b.side===1)return '적군 턴 · 행동을 기다리는 중';
 if(b.phase==='transition')return '턴 전환 중 · 착지와 이벤트 처리 대기';
 if(b.phase==='review')return '공격 결과 확인 중';
 if(b.phase==='flight'&&b.projectiles.some(p=>p.skill==='A09'&&!p.turned&&!p.followup))return '전로시 · 전장 클릭/터치 또는 E로 1회 선회';
 if(b.phase==='flight'&&b.projectiles.some(p=>p.mode==='warriorDive'&&!p.dived))return '파산격 · 발사 버튼 또는 E로 급강하';
 if(u.meleeFollow==='ready')return '파진연격 · 이동 없이 평참 또는 검술 한 번';
 if(u.retreat)return '후퇴 · 이동/점프만 가능 · 대기로 종료';
 if(b.phase==='flight')return b.projectiles.length||b.volley?'공격 처리 중':e.settleBusy()?'착지 대기 중':'공격 마무리 중';
 if(u.stunnedRound===b.round&&u.acted)return '기절로 이번 턴 행동 불가 · 다른 동행을 선택하세요';
 if(u.acted)return '행동 완료 · 다른 동행을 선택하세요';
 if(embedded(b,u))return '지형에 걸림 · 전투를 이어 불러오면 위치를 복구합니다';
 if(!e.grounded(u))return '공중 이동 중 · 착지 후 발사·도약 가능';
 if(skill){const cd=e.cooldownLeft(u,skill.id),cost=e.manaCost(skill,u);
  if(cd>0)return `재사용 대기 ${cd}턴 · 다른 기예를 선택하세요`;
  if(u.focus<cost)return `기력 부족 (${Math.floor(u.focus)}/${cost}) · 기예 변경 또는 방어로 회복`;
 }
 if(u.moveLeft<=0)return '이동력 소진 · 공격이나 방어는 가능합니다';
 return '이동·발사 가능';
}
function refresh(app,u){
 const b=app.engine.b,states=effects(b,u),why=reason(app.engine,u,G.HONRO_CORE.SKILLS[app.selected]),el=document.getElementById('combat-status');
 if(el){const details=states.filter(s=>!why.startsWith('기절로')||!s.startsWith('기절'));const text=`${u.name} · ${details.length?details.join(' / ')+' — ':''}${why}`;if(el.textContent!==text)el.textContent=text;el.dataset.limited=why!=='이동·발사 가능'||u.bound>0||u.stun>0?'true':'false';}
 for(const chip of document.querySelectorAll('#hero-switches [data-id]')){
  const v=app.engine.unit(chip.dataset.id);if(!v)continue;const state=effects(b,v),tag=v.dead?'전투불능':v.stunnedRound===b.round&&v.acted||v.stun>0?'기절':v.bound>0?'결박':v.curseTurns>0?'저주':v.acted?'완료':'';
  chip.title=`${v.name} · ${state.join(' / ')|| (v.acted?'행동 완료':'행동 가능')}`;chip.classList.toggle('status-impaired',['기절','결박','저주'].includes(tag));
  const small=chip.querySelector('small');if(small)small.textContent=tag||`${Math.round(Math.max(0,v.hp)/v.maxHp*100)}%`;
 }
 const fire=document.getElementById('fire');if(fire){fire.title=fire.disabled?why:'누른 채 충전, 손을 떼어 발사';fire.setAttribute('aria-describedby','combat-status');}
}
function passives(app,u){
 const host=document.getElementById('combat-passives');if(!host)return;const C=G.HONRO_CORE,r=u.ranks?.MP05||0,chain=u.swordChain||[],sig=[u.id,u.jucheon,u.jucheonReady,chain.join(','),u.harmony].join('|');if(host.dataset.sig===sig)return;host.dataset.sig=sig;
 if(u.cls==='mage'&&r){const percent=u.jucheonReady?100:Math.round(100*(u.jucheon||0)/C.JUCHEON_THRESHOLD[r-1]);host.hidden=false;host.innerHTML=`<span class="jucheon-state ${u.jucheonReady?'ready':''}" role="meter" aria-label="주천" aria-valuenow="${percent}" aria-valuemin="0" aria-valuemax="100"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" class="track"/><circle cx="12" cy="12" r="9" pathLength="100" stroke-dasharray="${percent} 100"/></svg>${u.jucheonReady?'주천완성':`주천 ${percent}%`}</span>`;}
 else if(u.cls==='knight'&&u.ranks?.SP04){host.hidden=false;host.innerHTML=`<span class="sword-chain" aria-label="연세">${[['sword','검술'],['rush','돌격'],['blade','검기']].map(([id,name])=>`<i class="${chain.includes(id)?'linked':''}">${name}</i>`).join('')}${u.harmony?'<b>합세</b>':''}</span>`;}
 else {host.hidden=true;host.innerHTML='';}
}
G.HonroCombatStatus={effects,reason,embedded,refresh,passives};
})(globalThis);
