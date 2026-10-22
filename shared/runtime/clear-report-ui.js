(function(G){'use strict';
const R=G.HonroClearReport,C=G.HONRO_CORE,H=G.HONRO_CONTENT;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const n=v=>Math.round(v||0).toLocaleString('ko-KR'),duration=v=>`${Math.floor(v/60)}:${String(Math.floor(v%60)).padStart(2,'0')}`;
const name=cls=>H.hero[cls]?.name||cls;
const actions={'action:defend':'방어 · 숨 고르기','action:item':'물품 사용','unknown':'기예 미상','action:npc-heal':'동맹 회복'};
const skillName=id=>C.SKILLS[id]?.name||actions[id]||id;
const metrics=(rows,cls='report-metrics')=>`<dl class="${cls}">${rows.map(([label,value])=>`<div><dt>${label}</dt><dd>${value}</dd></div>`).join('')}</dl>`;
function growthRows(r){return [...r.order,...R.ALL.filter(cls=>!r.order.includes(cls)&&(r.xp[cls]?.combat+r.xp[cls]?.settlement+r.xp[cls]?.reunion)>0)];}
function growth(r){return `<div class="report-growth" aria-label="동행별 실제 경험치와 경지">${growthRows(r).map(cls=>{
 const x=r.xp[cls];if(!x)return `<p>${esc(name(cls))} · 경험치 기록 없음</p>`;
 const before=C.levelOf(x.before),after=C.levelOf(x.last),up=after>before,paid=x.combat+x.settlement+x.reunion,cap=after===C.MAX_LEVEL,value=cap?1:Math.max(0,x.last-C.xpAtLevel(after)),max=cap?1:C.xpToNext(after);
 return `<div class="report-growth-row" data-report-growth="${cls}"><div><strong>${esc(name(cls))}</strong><span>경지 ${before} → ${after}${up?'<b class="report-level-up">경지 상승</b>':''}</span><b>XP +${n(paid)}</b></div><progress value="${value}" max="${max}" aria-label="${esc(name(cls))} 경지 ${after} 경험치 진행"></progress><small>${cap?'최대 경지 30':`${n(value)} / ${n(max)}`}${r.partial?' · 기록 시작 이후':''}${!r.order.includes(cls)?(r.reunionStages?' · 합류 정산':' · 미참전 수령'):''}</small></div>`;
 }).join('')}</div>`;}
function summary(r,joined=[]){if(!r)return '<p>이 클리어의 보고서 기록이 없습니다.</p>';
 const p=r.partial?'기록 이후 ':'';
 return `<section class="clear-summary" aria-label="클리어 요약">${r.partial?'<p class="report-partial">부분 기록 · 이전 전투 수치는 복원하지 않았습니다.</p>':''}${metrics([['활성 전투 시간',p+duration(r.seconds)],['진행 턴',`${r.rounds}턴`],['적 처치',p+n(r.counts.kills)],['아군 전투 불능',p+n(r.counts.knockouts)]],'clear-summary-grid')}${growth(r)}${joined.length?`<p class="report-note report-joined">${joined.map(x=>esc(name(x.cls))+' 합류 · 경지 '+x.level).join(' / ')}<br>합류 경지 맞춤은 XP 보상과 별도입니다.</p>`:''}${r.deferred?'<p class="report-note">분할 조사 보상은 합류할 때 정산됩니다. 지금은 실제 받은 XP만 표시합니다.</p>':''}${r.reunionStages?`<p class="report-note">${r.reunionStages[0]}–${r.reunionStages[1]}장 합류 정산 포함 · 이번 장 전투 성과와 별도 지급</p>`:''}</section>`;
}
function totals(h){return metrics([['가한 피해',n(h.damage)],['받은 피해',n(h.received)],['처치',n(h.kills)],['유효 회복',n(h.healing)]]);}
function skills(h){const entries=Object.entries(h.skills);if(!entries.length)return '<p class="report-note">기록된 기예 사용·효과가 없습니다.</p>';
 return `<table class="report-skills"><caption class="visually-hidden">기예별 전투 기록</caption><thead><tr><th scope="col">기예</th><th scope="col">사용</th><th scope="col">피해</th><th scope="col">처치</th><th scope="col">회복</th></tr></thead><tbody>${entries.map(([id,s])=>`<tr><th scope="row">${esc(skillName(id))}</th><td>${s.usesKnown&&s.uses?n(s.uses):'—'}</td><td>${n(s.damage)}</td><td>${n(s.kills)}</td><td>${n(s.healing)}</td></tr>`).join('')}</tbody></table>`;
}
function detail(r){
 const otherNames={environment:'환경',npc:'동맹 NPC',enemy:'적',unresolved:'출처 미상',unknown:'출처 미상',friendly:'아군 오사',objects:'목표물·시설',summons:'소환체',otherHealing:'그 밖의 회복'};
 const other=Object.entries(r.other).filter(([,v])=>Object.values(v).some(n=>n>0));
 return `<div class="report-shell"><header class="report-header"><div><small>${r.stage}장 · ${esc(C.DIFFICULTIES[r.difficulty]?.name||r.difficulty||'여정')}${r.scope!=='campaign'?' · '+esc({debug:'디버그',practice:'허공터',custom:'사용자 맵'}[r.scope]||r.scope):''}</small><h2 id="clear-report-title">상세 보고서</h2></div><button type="button" class="report-close" data-action="close" aria-label="보고서 닫기">×</button></header><div class="report-body" tabindex="0" aria-labelledby="clear-report-title"><p class="report-intro">활성 ${duration(r.seconds)} · ${r.rounds}턴${r.retries?` · 구간 재도전 ${r.retries}회`:''}</p>${r.partial?'<p class="report-partial">부분 기록입니다. 기록 시작 전 피해·회복·시전·경험치는 알 수 없습니다. 아래 수치는 관측 이후입니다.</p>':''}<h3>동행 합계</h3>${totals(r.totals)}<p class="report-note">적 보호막 흡수 ${n(r.totals.shield)} · 아군 보호막 흡수 ${n(r.totals.shieldReceived)} · HP와 별도</p><h3>참전 동행</h3>${r.order.map(cls=>`<section class="report-hero" data-report-hero="${cls}"><h4>${esc(name(cls))}</h4>${totals(r.heroes[cls])}<details><summary>기예별 기록 보기</summary>${skills(r.heroes[cls])}<p class="report-note">사용은 실제 시전 횟수입니다. 지속·소환·상시 효과의 별도 시전이 없거나 시작 전 시전은 —로 표시합니다.</p></details></section>`).join('')}<section class="report-xp-detail"><h3>실제 성장 지급</h3>${growth(r)}<ul>${growthRows(r).map(cls=>{const x=r.xp[cls];return `<li>${esc(name(cls))} · 전투 +${n(x.combat)} · 클리어 +${n(x.settlement)}${r.reunionStages?` · ${r.reunionStages[0]}–${r.reunionStages[1]}장 합류 +${n(x.reunion)}`:''}</li>`;}).join('')}</ul>${r.deferred?'<p>남은 분할 조사 보상은 합류 때 실제 지급됩니다.</p>':''}<p class="report-note">합류 경지 맞춤은 보상에서 제외합니다. 최대 경지는30이며 실제 보존된 XP만 표시합니다.</p></section>${other.length?`<section><h3>별도 기록</h3><ul class="report-other">${other.map(([key,v])=>`<li><strong>${esc(otherNames[key]||key)}</strong> · 피해 ${n(v.damage)} · 받은 피해 ${n(v.received)} · 처치 ${n(v.kills)} · 회복 ${n(v.healing)} · 보호막 ${n(v.shield)}</li>`).join('')}</ul></section>`:''}${r.missing.length?`<details><summary>출처 ID를 확인할 수 없는 기록</summary><p class="report-note">${r.missing.map(esc).join(', ')}</p></details>`:''}<section class="report-method"><h3>기록 기준</h3><p>실제로 변한 HP만 기록합니다. 초과 피해·초과 회복·성장 및 장 전환의 체력 보정은 제외합니다. 목표물·소환체·환경·동맹 NPC·오사는 동행 성과와 분리합니다.</p><p>구간 재도전 시 전투 수치는 체크포인트로 돌아갑니다. 실제 활성 시간·재도전 횟수·이미 받은 XP는 유지됩니다. 대사·로딩·정지·설정·백그라운드 시간은 제외합니다.</p><small>기록 v${r.version} · ${esc(r.gameVersion)}<br>시도 ${esc(r.attempt)}</small></section></div></div>`;
}
function open(app,id){
 if(app.modalKind==='clear-report')return;
 const r=Number(id)?R.get(app,Number(id)):app.engine?.b.honroReport?.final;if(!r)return;
 app.reportReturn=app.modalKind==='result'?{html:app.modal.innerHTML,kind:app.modalKind,scroll:app.modal.querySelector('.result-body')?.scrollTop||0}:null;
 app.open(detail(r),'clear-report');app.modal.querySelector('[data-action="close"]')?.focus({preventScroll:true});
}
function close(app){const back=app.reportReturn;app.reportReturn=null;if(back){app.modal.innerHTML=back.html;app.modalKind=back.kind;const body=app.modal.querySelector('.result-body');if(body)body.scrollTop=back.scroll;app.modal.querySelector('[data-action="clear-report"]')?.focus({preventScroll:true});}else app.close();}
function journal(app,id){return app.profile.cleared[id]?(R.get(app,id)?`<button class="journey-report" data-action="clear-report" data-id="${id}">클리어 보고서</button>`:'<small class="report-missing">이전 클리어 · 보고서 기록 없음</small>'):'';}
function rest(app){const id=app.profile.honroReportNotice?.stage;return [10,20,30].includes(id)&&R.get(app,id)&&app.profile.seen?.['act-ending-v1:'+id]?`<button class="rest-report" data-action="clear-report" data-id="${id}">방금 걸은 ${id}장 · 보고서</button>`:'';}
G.HonroClearReportUI={summary,detail,growth,open,close,journal,rest};
})(globalThis);
