(function(G){'use strict';
const symbols={
 stun:'M8 1 9.5 5 14 5.5 10.5 8.5 11.5 13 8 10.5 4.5 13 5.5 8.5 2 5.5 6.5 5Z',
 bind:'M6 5 9 2Q12 0 14 3Q15 5 13 7L10 10M6 6 3 9Q1 12 4 14Q6 15 8 13L11 10M5 11 11 5',
 slow:'M8 1V15M2 4 14 12M2 12 14 4M5 2 8 5 11 2M5 14 8 11 11 14',
 curse:'M8 1 14 7 8 15 2 7ZM5 6 11 10M11 6 5 10',
 betrayal:'M1 8Q8 0 15 8Q8 16 1 8ZM8 5V11',
 shield:'M8 1 14 4 13 10 8 15 3 10 2 4Z',
 guard:'M2 2 13 13M10 12 13 9M6 7 3 12 1 10M9 6 14 1',
 power:'M9 1 3 9 8 9 6 15 14 6 9 6Z',
 follow:'M2 4H13L9 1M14 12H3L7 15',
 retreat:'M1 8H14M5 4 1 8 5 12',
 prepared:'M8 1V5M8 11V15M1 8H5M11 8H15M8 4A4 4 0 1 0 8 12A4 4 0 1 0 8 4',
 dead:'M3 3 13 13M3 13 13 3'
};
const colors={stun:'#f5d27f',bind:'#e2ba87',slow:'#9dddeb',curse:'#d7a2e4',betrayal:'#ee9cbc',shield:'#a8dbd3',guard:'#cadbd5',power:'#eed69a',follow:'#eed69a',retreat:'#b4d3c5',prepared:'#eed69a',dead:'#bfaaa2'};
function entries(b,u){
 const list=[];if(!u)return list;
 const add=(key,name,detail,count)=>list.push({key,name,detail,count,color:colors[key]});
 if(u.dead||u.hp<=0){add('dead','전투 불능','전투 불능');return list;}
 if(u.stunnedRound===b.round&&u.acted)add('stun','기절','기절 · 이번 턴 행동 불가');
 else if(u.stun>0)add('stun','기절',`기절 · 다음 행동 ${u.stun}회 불가`,u.stun);
 if(u.bound>0)add('bind','결박',`결박 ${u.bound}회 · 이동력 감소·이동 소모 증가`,u.bound);
 if(u.slowed)add('slow','감속','감속 '+Math.round(u.slowed.factor*100)+'%');
 if(u.curseTurns>0){const parts=[`저주 ${u.curseTurns}턴`];if(u.curseDamage>0)parts.push(`매 턴 피해 ${Math.round(u.curseDamage)}`);if(u.curseAttack>0)parts.push(`공격력 ${Math.round(u.curseAttack*100)}% 감소`);if(u.curseArmor>0)parts.push(`방어력 ${Math.round(u.curseArmor*100)}%p 감소`);add('curse','저주',parts.join(' · '),u.curseTurns);}
 if(u.betrayalUntil>0&&u.betrayalUntil>=b.round)add('betrayal','이간','이간 · 같은 편의 공격 대상이 됨',u.betrayalUntil-b.round+1);
 if(u.mark>0)add('prepared','표식','표식 · 표식을 남긴 편의 다음 직격 피해 50% 증가');
 if(u.breaks>0)add('guard','방어 붕괴',`방어 붕괴 · 다음 피격 ${u.breaks}회 방어력 약화`,u.breaks);
 if(u.shield>0)add('shield','보호막',`보호막 ${Math.round(u.shield)}`);
 if(u.arrivalGuard!==undefined)add('shield','착지 보호','착지 보호 · 다음 내 턴까지 받는 피해 10% 감소');
 if(u.martialGuard)add('guard',u.martialGuard.counter?'응수세':'수세',u.martialGuard.counter?'응수세 · 반격 대기':'수세');
 if(u.bladeScreen)add('guard','호신검막','호신검막 · 날아오는 공격을 받아 검기에 힘을 저장');
 if(u.bladeStored>0)add('power','축기',`축기 · 다음 검기 피해 ${Math.round(u.bladeStored*100)}% 증가`);
 if(u.meleeFollow==='ready')add('follow','파진연격','파진연격 · 검술 한 번');
 if(u.harmony)add('power','합세','합세 · 다음 기예 강화');
 if(u.jucheonReady)add('power','주천완성','주천완성');
 if(u.prepared)add('prepared','정심','정심 · 다음 절명 사격 강화');
 if(u.retreat)add('retreat','이탈보','이탈보 · 후퇴 단계');
 return list;
}
function effects(b,u){return entries(b,u).map(s=>s.detail);}
const paths={};
function glyph(key){return `<svg viewBox="0 0 16 16" aria-hidden="true"><path d="${symbols[key]}"/></svg>`;}
function draw(c,b,u,time,scale,active){
 const states=entries(b,u);if(!states.length||u.dead)return;
 const has=key=>states.some(s=>s.key===key),z=1/Math.max(.16,scale||1),visualHeight=G.HonroPartyPresentationHeight?.(u)??u.h;
 c.save();c.lineWidth=2*z;
 // Silhouettes stay recognizable: ropes at the ankles, ice underfoot, a curse seal and a shield arc.
 if(has('bind')){c.strokeStyle=colors.bind;c.beginPath();for(let i=0;i<2;i++)c.ellipse(u.x,u.y-7-i*13,u.r+8,7,0,0,Math.PI*2);c.moveTo(u.x-u.r,u.y-23);c.lineTo(u.x+u.r,u.y-2);c.stroke();}
 if(has('slow')){c.strokeStyle=colors.slow;c.beginPath();for(let i=0;i<5;i++){const x=u.x+(i-2)*12;c.moveTo(x-6,u.y+1);c.lineTo(x,u.y-10-(i%2)*7);c.lineTo(x+6,u.y+1);}c.stroke();}
 if(has('curse')){c.strokeStyle=colors.curse;c.globalAlpha=.65+.15*Math.sin(time*3);c.beginPath();c.ellipse(u.x,u.y-visualHeight*.45,u.r+11,visualHeight*.35,0,0,Math.PI*2);c.stroke();c.globalAlpha=1;}
 if(has('shield')||has('guard')){c.strokeStyle=has('shield')?colors.shield:colors.guard;c.globalAlpha=.7;c.beginPath();c.ellipse(u.x,u.y-visualHeight*.5,u.r+19,visualHeight*.57,0,-Math.PI*.8,Math.PI*.8);c.stroke();c.globalAlpha=1;}
 if(has('stun')){c.strokeStyle=colors.stun;for(let i=0;i<3;i++){const a=time*2+i*Math.PI*2/3,x=u.x+Math.cos(a)*(u.r+10),y=u.y-visualHeight-8+Math.sin(a)*5;c.beginPath();c.moveTo(x-3*z,y);c.lineTo(x+3*z,y);c.moveTo(x,y-3*z);c.lineTo(x,y+3*z);c.stroke();}}
 // Three fixed-size signs plus a count keep stacked effects compact at every zoom.
 const shown=states.slice(0,3),extra=states.length-shown.length;
 c.translate(u.x+(active?28*z:0),u.y-visualHeight-33*z);c.scale(z,z);
 const width=shown.length*20+(extra?21:0);c.translate(active?0:-width/2,0);
 for(let i=0;i<shown.length;i++){const s=shown[i];c.save();c.translate(i*20,0);c.fillStyle='#0c2028ed';c.fillRect(-1,-1,19,20);c.strokeStyle=s.color;c.lineWidth=1.5;paths[s.key]??=new Path2D(symbols[s.key]);c.stroke(paths[s.key]);if(s.count){c.fillStyle='#07151d';c.fillRect(10,10,9,10);c.fillStyle=s.color;c.font='bold 9px sans-serif';c.textAlign='right';c.fillText(String(s.count),18,18);}c.restore();}
 if(extra){c.fillStyle='#e4d9c0';c.font='bold 10px sans-serif';c.textAlign='left';c.fillText('+'+extra,shown.length*20,12);}
 c.restore();
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
 const b=app.engine.b,states=entries(b,u),why=reason(app.engine,u,G.HONRO_CORE.SKILLS[app.selected]),el=document.getElementById('combat-status'),esc=G.HONRO_CORE.escapeHTML;
 if(el){
  const sig=JSON.stringify([u.id,states,why]);
  if(el.dataset.sig!==sig){
   const wasOpen=el.querySelector('details')?.open&&el.dataset.unit===u.id,focused=el.contains(document.activeElement);el.dataset.sig=sig;el.dataset.unit=u.id;
   const short=why==='이동·발사 가능'?'상태':why.startsWith('기력 부족')?'기력 부족':why.startsWith('재사용')?'재사용 대기':why.startsWith('기절')?'기절':why.split(' · ')[0];
   const label=states.length?`${states[0].name}${states.length>1?' +'+(states.length-1):''}`:short;
   el.innerHTML=`<details class="status-details" ${wasOpen?'open':''}><summary aria-label="${esc(u.name)} 상태와 행동 정보"><span class="status-glyph" style="--status-color:${states[0]?.color||'#b7cbbf'}">${glyph(states[0]?.key||'shield')}${esc(label)}</span></summary><div class="status-popover"><strong>${esc(u.name)}</strong>${states.length?states.map(s=>`<div class="status-entry status-glyph" style="--status-color:${s.color}">${glyph(s.key)}<span>${esc(s.detail)}</span></div>`).join(''):'<p>적용 중인 상태가 없습니다.</p>'}<p class="status-reason" id="combat-action-reason">${esc(why)}</p></div></details><span class="status-announcement" role="status" aria-live="polite">${esc(states.map(s=>s.detail).join(' / '))}</span>`;
   if(focused)el.querySelector('summary').focus({preventScroll:true});
  }
  el.dataset.limited=why!=='이동·발사 가능'||u.bound>0||u.stun>0?'true':'false';
 }
 for(const chip of document.querySelectorAll('#hero-switches [data-id]')){
  const v=app.engine.unit(chip.dataset.id);if(!v)continue;const state=effects(b,v),tag=v.dead?'전투불능':v.stunnedRound===b.round&&v.acted||v.stun>0?'기절':v.bound>0?'결박':v.curseTurns>0?'저주':v.acted?'완료':'';
  chip.title=`${v.name} · ${state.join(' / ')|| (v.acted?'행동 완료':'행동 가능')}`;chip.classList.toggle('status-impaired',['기절','결박','저주'].includes(tag));
  const small=chip.querySelector('small');if(small)small.textContent=tag||`${Math.round(Math.max(0,v.hp)/v.maxHp*100)}%`;
 }
 const fire=document.getElementById('fire');if(fire){fire.title=fire.disabled?why:'누른 채 충전, 손을 떼어 발사';fire.setAttribute('aria-describedby','combat-action-reason');}
}
function passives(app,u){
 const host=document.getElementById('combat-passives');if(!host)return;const C=G.HONRO_CORE,r=u.ranks?.MP05||0,chain=u.swordChain||[],sig=[u.id,u.jucheon,u.jucheonReady,chain.join(','),u.harmony].join('|');if(host.dataset.sig===sig)return;host.dataset.sig=sig;
 if(u.cls==='mage'&&r){const percent=u.jucheonReady?100:Math.round(100*(u.jucheon||0)/C.JUCHEON_THRESHOLD[r-1]);host.hidden=false;host.innerHTML=`<span class="jucheon-state ${u.jucheonReady?'ready':''}" role="meter" aria-label="주천" aria-valuenow="${percent}" aria-valuemin="0" aria-valuemax="100"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" class="track"/><circle cx="12" cy="12" r="9" pathLength="100" stroke-dasharray="${percent} 100"/></svg>${u.jucheonReady?'주천완성':`주천 ${percent}%`}</span>`;}
 else if(u.cls==='knight'&&u.ranks?.SP04){host.hidden=false;host.innerHTML=`<span class="sword-chain" aria-label="연세">${[['sword','검술'],['rush','돌격'],['blade','검기']].map(([id,name])=>`<i class="${chain.includes(id)?'linked':''}">${name}</i>`).join('')}${u.harmony?'<b>합세</b>':''}</span>`;}
 else {host.hidden=true;host.innerHTML='';}
}
G.HonroCombatStatus={entries,effects,draw,reason,embedded,refresh,passives};
})(globalThis);
