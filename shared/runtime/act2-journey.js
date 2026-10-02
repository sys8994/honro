(function(G){'use strict';
const J=G.HonroJourney,original=J.markup;
J.markup=function(profile,stageId,hub,header){
 let html=original(profile,stageId,hub,header);
 html=html.replace('width:3400px;height:1380px','width:6800px;height:1800px').replace('viewBox="0 0 3400 1380"','viewBox="0 0 6800 1800"');
 const cave=`<g aria-hidden="true"><path d="M3350 120Q3900-25 4500 110L5200 360 5640 525 6550 140 6740 1750H3380Z" fill="#0c151b" stroke="#54615f" stroke-width="3"/><path d="M3420 275Q3900 75 4240 530T4870 1000Q5230 1320 5730 1460T6610 850" stroke="#303d42" stroke-width="120" fill="none"/><path d="M3890 30L4130 198 4400 230 4670 440 4620 190 4250 35Z M5320 1560L5700 1400 6060 1000 6460 700 6730 380 6730 1730Z" fill="#253236"/><g fill="#c1b99c" font-family="Batang,serif" letter-spacing="5"><text x="3500" y="95" font-size="36">둘째 막 · 울리지 않는 종</text><text x="4280" y="260" font-size="25">함몰지</text><text x="4630" y="1120" font-size="25">지하하천</text><text x="5350" y="540" font-size="25">잠운사</text><text x="5770" y="1450" font-size="25">묵종 공동</text><text x="6300" y="1090" font-size="22">하늘 아래</text></g></g>`;
 // Insert the landscape underneath the already authored route strokes and nodes.
 html=html.replace('<path d="M110 230',cave+'<path d="M110 230');
 for(const s of G.HONRO_CONTENT.stages.filter(s=>s.act===2))html=html.replace(`<span class="stage-index">${s.id}</span>`,`<span class="stage-index">2-${s.actStage}</span>`);
 const next=profile.cleared[20]?'<div style="position:absolute;left:6340px;top:1330px;width:340px;color:#c6c4af;font-size:22px;line-height:1.6">다음 여정 · 백기곡의 기록<br><small>읍성 문서고 — 셋째 막 준비 중</small></div>':'';
 html=html.replace('</div></div><div class="atlas-tools">',next+'</div></div><div class="atlas-tools"><button data-act-focus="1" aria-label="첫째 막 지도">1막</button><button data-act-focus="11" aria-label="둘째 막 지도">2막</button>');
 return html;
};
document.addEventListener('click',ev=>{const el=ev.target.closest?.('[data-act-focus]');if(!el)return;const app=G.HonroApp,id=Number(el.dataset.actFocus),st=G.HONRO_CONTENT.stages[id-1];app.stageId=id;app.mapDock();app.atlas?.focus(st.map[0],st.map[1],innerWidth<620?.38:.55);});
})(globalThis);
