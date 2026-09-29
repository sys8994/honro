(function(G){'use strict';
const C=G.HONRO_CORE,H=G.HONRO_CONTENT,S=C.SKILLS,heroes=['archer','mage','knight','occultist'];
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const stamp=(id,size=30)=>C.icon('skill:'+id,'',size);
const rank=(d,id)=>S[id].basic||S[id].ultimate?1:d.ranks[id]||1;
const branch=id=>C.TALENT_MAP[id]?.branch??-1;
const skills=(cls,b)=>Object.values(S).filter(s=>s.cls===cls&&!s.enemyOnly&&(C.TALENT_MAP[s.id]||s.basic||s.id===C.ultimateSkill(cls))&&branch(s.id)===b).sort((a,b)=>(C.TALENT_MAP[a.id]?.row??0)-(C.TALENT_MAP[b.id]?.row??0));
const button=(action,value,html,attrs='')=>`<button type="button" data-training-action="${action}" data-value="${value}" ${attrs}>${html}</button>`;
function toolbar(app){const s=S[app.trainingSkill];return `<nav class="training-tools" aria-label="허공터 수련 설정">${button('open','',`<img src="${G.HonroUI.portraits()[app.trainingClass]}" alt=""><span><small>${H.hero[app.trainingClass].name} · 허공터</small><strong>${s.name} <em>경지 ${rank({ranks:app.trainingRanks},s.id)}</em></strong></span>${stamp(s.id,24)}<span class="training-edit">기예 고르기</span>`,'class="training-current" aria-label="캐릭터와 기예, 경지 선택"')}<button class="icon" data-action="training-reset" aria-label="같은 설정으로 다시 수련">${G.HonroFA.icon('rotateRight','',18)}</button></nav>`;}
function open(app){const id=app.trainingSkill;app.trainingDraft={cls:app.trainingClass,id,branch:branch(id),ranks:{...app.trainingRanks},passives:{...app.trainingPassives},active:id};render(app);}
function render(app,focus){
 const d=app.trainingDraft,s=S[d.id],r=rank(d,s.id),br=C.BRANCHES[d.cls][d.branch],available=skills(d.cls,d.branch),passives=Object.keys(d.passives).filter(id=>d.passives[id]&&S[id].cls===d.cls),portraits=G.HonroUI.portraits();
 const scroll=app.modal.querySelector('.training-body')?.scrollTop||0;
 const html=`
 <header class="training-heading"><div><small>허공터 · 자유 수련</small><h2 id="training-title">누구의 기예를 펼칠까요</h2><p>동행과 기예를 고르고, 원하는 경지에서 익혀 보세요.</p></div>${button('close','',G.HonroFA.icon('xmark','',20),'class="icon" aria-label="수련 설정 닫기"')}</header>
 <div class="training-body"><nav class="training-heroes" aria-label="수련할 동행">${heroes.map(cls=>button('hero',cls,`<img src="${portraits[cls]}" alt="${H.hero[cls].name} 초상"><span><strong>${H.hero[cls].name}</strong><small>${H.hero[cls].job}</small></span>`,`aria-pressed="${cls===d.cls}"`)).join('')}</nav>
 <nav class="training-branches" aria-label="기예 계통">${[{name:'기본 · 비기',color:'#c5caba'},...C.BRANCHES[d.cls]].map((b,i)=>button('branch',i-1,esc(b.name),`aria-pressed="${d.branch===i-1}" style="--branch:${b.color}"`)).join('')}</nav>
 <div class="training-content"><section class="training-library" aria-label="${esc(br?.name||'기본 기예')}"><div class="training-section-head"><h3>${esc(br?.name||'기본 기예')}</h3><span>${esc(br?.tag||'동행의 첫걸음')} · ${available.length}개</span></div><div class="training-cards">${available.map(sk=>button('skill',sk.id,`<span class="training-card-top"><i>${stamp(sk.id,31)}</i><small>${sk.passive?'상시 기예':sk.capstone?'계통 비기':sk.basic?'기본 공격':sk.ultimate?'비기':'사용 기예'}</small><em>${sk.passive&&d.passives[sk.id]?'적용 중':`경지 ${rank(d,sk.id)}`}</em></span><strong>${esc(sk.name)}</strong><span class="training-card-desc">${esc(sk.desc)}</span>`,`class="training-card" aria-pressed="${d.id===sk.id}"`)).join('')}</div></section>
 <aside class="training-detail" aria-label="선택한 기예"><div class="training-detail-name"><i>${stamp(s.id,42)}</i><div><small>${esc(br?.name||'기본 기예')}</small><h3>${esc(s.name)}</h3></div></div><p class="skill-desc">${esc(s.desc)}</p><p class="skill-mechanics">${esc(C.skillPlayNotes(s.id))}</p>
 <fieldset class="training-level"><legend>기예의 경지 <strong>${r}${s.basic||s.ultimate?'':' / 8'}</strong></legend>${s.basic||s.ultimate?'<p>이 기예는 하나의 경지로 펼칩니다.</p>':`<div class="training-ranks" role="group" aria-label="기예 레벨">${Array.from({length:8},(_,i)=>button('rank',i+1,i+1,`aria-label="경지 ${i+1}" aria-pressed="${r===i+1}"`)).join('')}</div>`}</fieldset>
 ${s.passive?button('passive',s.id,`${d.passives[s.id]?'✓ 적용 중 · 눌러 해제':'＋ 이 상시 기예 적용'}`,`class="training-passive" aria-pressed="${!!d.passives[s.id]}"`):''}
 ${!s.basic&&!s.ultimate&&C.skillGrowthRows(s.id,r).length?`<div class="effect-compare training-effects" aria-label="선택 경지의 효과"><div class="training-effect-title">경지 ${r}의 효과</div>${C.skillGrowthRows(s.id,r).map(v=>`<div><span>${esc(v.label).replace(/MP/g,'기력')}</span><b>${esc(v.value)}</b></div>`).join('')}</div>`:''}
 </aside></div></div>
 <footer class="training-footer"><div><strong>${H.hero[d.cls].name} · ${S[d.active].name} · 경지 ${rank(d,d.active)}</strong><span>상시 기예 ${passives.length}개${passives.length?' · '+passives.map(id=>`${S[id].name} ${rank(d,id)}`).join(' / '):' · 카드에서 추가할 수 있어요'}</span></div>${button('apply','',s.passive?'이 구성으로 수련':'이 기예로 수련','class="training-apply"')}</footer>`;
 app.open(html,'training-dialog');
 const dialog=app.modal.querySelector('.training-dialog');dialog.setAttribute('aria-labelledby','training-title');dialog.style.setProperty('--training-accent',br?.color||s.color);dialog.querySelector(':scope > .close')?.remove();
 if(focus){app.modal.querySelector('.training-body').scrollTop=scroll;app.modal.querySelector(`[data-training-action="${focus.action}"][data-value="${focus.value}"]`)?.focus({preventScroll:true});}
 else app.modal.querySelector('[data-training-action="hero"][aria-pressed="true"]')?.focus({preventScroll:true});
}
function act(app,action,value){
 if(action==='open'){open(app);return;}if(action==='close'){app.close();return;}
 const d=app.trainingDraft;if(!d)return;
 if(action==='apply'){app.trainingClass=d.cls;app.trainingSkill=d.active;app.trainingRanks={...d.ranks};app.trainingPassives={...d.passives};app.launch(1,true,d.active);return;}
 if(action==='hero'){d.cls=value;d.id=d.active=C.baseSkill(value);d.branch=branch(d.id);}
 if(action==='branch'){d.branch=+value;d.id=skills(d.cls,d.branch)[0].id;if(!S[d.id].passive)d.active=d.id;}
 if(action==='skill'){d.id=value;if(!S[value].passive)d.active=value;}
 if(action==='rank')d.ranks[d.id]=+value;
 if(action==='passive')d.passives[value]=!d.passives[value];
 render(app,{action,value});
}
document.addEventListener('click',ev=>{const el=ev.target.closest('[data-training-action]');if(el&&G.HonroApp?.training)act(G.HonroApp,el.dataset.trainingAction,el.dataset.value);});
document.addEventListener('keydown',ev=>{const dialog=document.querySelector('.training-dialog');if(!dialog)return;ev.stopImmediatePropagation();if(ev.key==='Escape'){ev.preventDefault();G.HonroApp.close();document.querySelector('.training-current')?.focus();}if(ev.key==='Tab'){const items=[...dialog.querySelectorAll('button:not([disabled])')],first=items[0],last=items.at(-1);if(ev.shiftKey&&document.activeElement===first){ev.preventDefault();last.focus();}else if(!ev.shiftKey&&document.activeElement===last){ev.preventDefault();first.focus();}}});
G.HonroTraining={toolbar,open};
})(globalThis);
