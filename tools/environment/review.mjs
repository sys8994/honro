import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root=new URL('../../',import.meta.url),dir=new URL('_local/reports/environment-v2/',root);
const json=async name=>JSON.parse(await readFile(new URL(name,dir),'utf8'));
const before=await json('performance-composition-before.json'),after=await json('performance-composition-after.json');
const verification=await json('verification-summary.json').catch(()=>null);
const hash=async file=>createHash('sha256').update(await readFile(file)).digest('hex');
const scenes=[['stage-1-forest','숲길'],['stage-3-water','나루 물길'],['stage-5-waterfall','폭포'],['stage-5-wide','계곡 최대 줌아웃'],['enclosed','닫힌 공간'],...Array.from({length:10},(_,i)=>['stage-'+(i+1)+'-normal',(i+1)+'장']),...['bottom','slope','ridge'].flatMap(name=>[.16,.66,1.65].map(z=>['stage-5-'+name+'-'+z,'계곡 '+name+' · '+z]))];
for(const index of [0,1])for(const offset of [-32,0,32])scenes.push([`stage-5-boundary-${index}-${offset}`,`높이 구역 ${index+1} 경계 · ${offset}`]);
const mean=rows=>rows.reduce((sum,r)=>sum+r.avgMs,0)/rows.length;
const meta={htmlSha256:await hash(new URL('HONRO.html',root)),workshopSha256:await hash(new URL('HONRO_WORKSHOP.html',root)),baselineSha256:await hash(new URL('baseline-HONRO.html',dir)),beforeMeanMs:mean(before.rows),afterMeanMs:mean(after.rows),afterP95MaxMs:Math.max(...after.rows.map(r=>r.p95Ms)),domUnchanged:after.rows.every((r,i)=>r.dom===before.rows[i].dom&&r.svg===before.rows[i].svg)};
Object.assign(meta,{beforeBudgetFailures:before.failures?.length||0,afterBudgetFailures:after.failures?.length||0,afterMinFps:Math.min(...after.rows.map(r=>r.fps))});
await writeFile(new URL('review-metadata.json',dir),JSON.stringify(meta,null,2)+'\n');
const options=scenes.map(([id,label])=>`<option value="${id}">${label}</option>`).join('');
const table=after.rows.map((r,i)=>`<tr><td>${r.stage}</td><td>${r.viewport.join(' × ')}</td><td>${r.zoom}</td><td>${before.rows[i].avgMs.toFixed(2)}</td><td>${r.avgMs.toFixed(2)}</td><td>${r.p95Ms.toFixed(2)}</td><td>${before.rows[i].fps.toFixed(1)} / ${r.fps.toFixed(1)}</td><td>${r.dom} / ${r.svg}</td><td>${r.stats?.visibleAssets} / ${r.stats?.animatedPrimitives}</td></tr>`).join('');
await writeFile(new URL('index.html',dir),`<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>HONRO 환경 구도·대기 검토</title>
<style>body{margin:32px auto;max-width:1440px;padding:0 20px;background:#111d23;color:#d5d9cb;font:16px/1.65 system-ui}h1{font-size:26px}select,button,input{font:inherit;color:inherit;background:#24373d;border:1px solid #536b69;padding:8px}a{color:#c9c28e}.pair{display:grid;grid-template-columns:1fr 1fr;gap:18px}figure{margin:12px 0}img{width:100%;display:block}figcaption,small{color:#9dafa8}.wipe{position:relative;max-width:1280px}.wipe img{width:100%}.wipe .after{position:absolute;inset:0;clip-path:inset(0 0 0 50%)}table{border-collapse:collapse;width:100%;font-size:14px}th,td{text-align:left;border-bottom:1px solid #344a50;padding:8px}.scroll{overflow:auto}@media(max-width:800px){.pair{grid-template-columns:1fr}body{margin:16px auto}}</style>
<h1>HONRO · 배경 구도와 대기</h1><p>현재 10개 맵의 지지면·높이 구역·공기색·물/폭포를 같은 카메라에서 비교합니다. 시각 검토는 자동 검사의 통과와 구분합니다.</p>
<label>장면 <select id="scene">${options}</select></label> <label>전후 경계 <input id="split" type="range" min="0" max="100" value="50"></label>
<div class="wipe"><img id="old" alt="수정 전"><img class="after" id="current" alt="수정 후"></div><small>왼쪽: 수정 전 · 오른쪽: 현재. 슬라이더를 움직여 같은 위치를 비교합니다.</small>
<div class="pair"><figure><figcaption>Workshop 작성</figcaption><img src="after/workshop-authoring.png"></figure><figure><figcaption>실제 Playtest</figcaption><img src="after/playtest.png"></figure></div>
<h2>움직이는 물과 폭포</h2><p>같은 liveWater 패스를 0초와 0.73초에 캡처했습니다. 충돌·물 전도 영역은 기존 데이터입니다.</p>
<div class="pair">${[3,5].map(s=>`<figure><figcaption>${s}장 · <button data-motion="${s}">시간 전환</button></figcaption><img id="motion-${s}" src="after/water-motion-${s}-0.png"></figure>`).join('')}</div>
<h2>실측 성능</h2><p>같은 PC·브라우저, 12조건 순차 실행. 평균 렌더 호출 ${meta.beforeMeanMs.toFixed(2)} → ${meta.afterMeanMs.toFixed(2)} ms. 실제 휴대전화 GPU/배터리 측정은 포함하지 않습니다. DOM/SVG 수 변경: ${meta.domUnchanged?'없음':'상세 표 참조'}.</p>
${verification?`<p>기능 검사는 수정 후 재개하여 통과했습니다. 전체 verify: ${verification.fullVerifyPassed?'통과':'미통과 — '+verification.remainingFailures.map(r=>`${r.shell} ${r.scenario}의 프레임 간격 p95 ${r.frameP95.toFixed(1)}ms (기준 &lt;45ms)`).join(', ')}. <a href="verification-summary.json">검증 범위·잔여 항목</a> · <a href="combat-performance-isolated.log">다른 검사 종료 후 밀집 전투 측정</a></p>`:''}
<p>평균 렌더 &lt; 7ms · RAF &gt; 45Hz 기준 미통과: 수정 전 ${meta.beforeBudgetFailures}/12, 수정 후 ${meta.afterBudgetFailures}/12. 이 표의 p95는 렌더 호출 시간이며 프레임 간격과 구분합니다.</p>
<div class="scroll"><table><thead><tr><th>장</th><th>CSS 화면</th><th>줌</th><th>전 ms</th><th>후 ms</th><th>후 p95 ms</th><th>전 / 후 Hz</th><th>DOM / SVG</th><th>배경 개체 / 동적 채널</th></tr></thead><tbody>${table}</tbody></table></div>
<p><a href="after/report.json">시각·편집·물 프레임 검사</a> · <a href="performance-composition-after.json">성능 원자료</a> · <a href="inventory.json">전체 분류</a> · <a href="verify-final.log">전체 검증 로그</a> · <a href="verify-resume.log">기대값 수정 후 재개 로그</a></p>
<script>const select=document.querySelector('#scene'),old=document.querySelector('#old'),current=document.querySelector('#current');function show(){old.src='before/'+select.value+'.png';current.src='after/'+select.value+'.png'}select.onchange=show;document.querySelector('#split').oninput=e=>current.style.clipPath='inset(0 0 0 '+e.target.value+'%)';show();for(const b of document.querySelectorAll('[data-motion]'))b.onclick=()=>{b._t=1-(b._t||0);document.querySelector('#motion-'+b.dataset.motion).src='after/water-motion-'+b.dataset.motion+'-'+b._t+'.png'};</script></html>`);
console.log(JSON.stringify(meta,null,2));
