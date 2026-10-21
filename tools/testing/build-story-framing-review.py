"""Copy unedited native screenshots into a reviewable static evidence bundle."""
import csv,hashlib,html,json,shutil,subprocess,zipfile
from collections import Counter,defaultdict
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
BASE=ROOT/'_local/reports/story-framing';OUT=ROOT/'review/narrative-camera-20261021/final';OUT.mkdir(parents=True,exist_ok=True)
data=json.loads((BASE/'inventory.json').read_text());source=subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip();rows=data['pages'];special=json.loads((ROOT/'_local/reports/story-special-views/checks.json').read_text());native=json.loads((ROOT/'_local/reports/narrative-woodcutter/native-checks.json').read_text())
esc=lambda s:html.escape(str(s))
css='body{font:15px system-ui;margin:24px;background:#14272c;color:#e9e2cc}a{color:#e4c783}nav{position:sticky;top:0;background:#14272cf5;padding:12px}img{max-width:100%;max-height:310px;object-fit:contain;display:block;margin:auto}figure{margin:0;background:#091c22;padding:8px;border:1px solid #56716c}figcaption{font-size:12px;line-height:1.5;white-space:pre-wrap}.shots{display:grid;grid-template-columns:repeat(auto-fit,minmax(290px,1fr));gap:10px}section{margin:25px 0;padding-top:15px;border-top:1px solid #73877a}p{line-height:1.6}details{margin:12px 0}summary{cursor:pointer}table{border-collapse:collapse}td,th{padding:7px;border:1px solid #6b8078}'
def page(title,body):return f'<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>{esc(title)}</title><style>{css}</style><nav><a href="index.html">전체 목록</a></nav><h1>{esc(title)}</h1>{body}'
def copy(src,dst):dst.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(src,dst)
for r in rows:copy(BASE/r['image'],OUT/'screens'/r['image'])
copy(BASE/'inventory.json',OUT/'inventory.json');copy(BASE/'source-calls.json',OUT/'source-calls.json')
raw=json.loads((ROOT/'_local/reports/dialogue-clarity/inventory.json').read_text());copy(ROOT/'_local/reports/dialogue-clarity/inventory.json',OUT/'authored-source-inventory.json')
for r in special['rows']:copy(ROOT/'_local/reports/story-special-views'/r['image'],OUT/'special'/r['image'])
copy(ROOT/'_local/reports/story-special-views/checks.json',OUT/'special/checks.json')
focused=['before-witness.png','before-exact-stage2-bier-desktop.png','before-exact-stage2-bier-mobile.png','before-exact-stage2-guide-mobile.png','final-trigger-desktop.png','final-sheltered-desktop.png','final-emerging-desktop.png','final-emerged-desktop.png','final-idle-20s.png','final-first-speech.png','final-caption-mobile.png','final-cart-normal.png','final-cart-close.png','final-cart-maximum-in.png','final-cart-maximum-out.png','final-cart-mobile.png','after-stage2-guide-desktop.png','after-stage2-guide-mobile.png','after-stage2-guide-confirmed.png']
for name in focused:copy(ROOT/'_local/reports/narrative-woodcutter'/name,OUT/'focused'/name)
copy(ROOT/'_local/reports/narrative-woodcutter/native-checks.json',OUT/'focused/native-checks.json')
chapter=[]
for sid in range(1,31):
 selected=[r for r in rows if r['stage']==sid];cat=next(c for c in data['catalog'] if c['stage']==sid);excluded=[q for q in cat['sequences'] if q.get('excluded')];groups=defaultdict(list)
 for r in selected:groups[r['sequence']].append(r)
 slots=sum(r['path'].startswith(f'stage.{sid}.') for r in raw['lines']);counts=Counter(r['framing']['intent'] for r in selected if r['label']=='desktop');fails=sum(not r['included'] or not r.get('speakerPass',True) or r['overflow'] for r in selected);missing=sum(bool(r['framing'].get('missing')) for r in selected)
 chapter.append({'stage':sid,'authoredSlots':slots,'activeSequences':len(groups),'registeredExcluded':len(excluded),'pagesPerViewport':sum(r['label']=='desktop' for r in selected),'captures':len(selected),'intents':dict(counts),'missingPages':missing,'failedPages':fails})
 body=f'<p>원본 발화 슬롯 {slots}. 검사 시퀀스 {len(groups)} · {len(selected)} native captures. 검사 프로필은 명시 상태 fixture이며 정상 완주가 아닙니다. 모든 이미지 원본은 클릭해 볼 수 있습니다.</p><p>{esc(dict(counts))}</p>'
 if excluded:body+='<p>현재 버전에서 열리지 않는 보존 연출: '+esc([(q['key'],q['excluded']) for q in excluded])+'</p>'
 overview=[]
 for key,rs in groups.items():
  body+=f'<section id="{esc(key)}"><h2>{esc(key)}</h2><div class="shots">'
  for r in rs:
   f=r['framing'];img='screens/'+r['image'];target=esc(f['targets']);speaker=f"speaker {r.get('speakerPolicy')} / world {r.get('worldSpeakerContained')} / portrait {r.get('speakerPortrait')}"
   body+=f'<figure><a href="{img}"><img loading="lazy" src="{img}" alt="{esc(key)}"></a><figcaption>{r["index"]+1} · {r["label"]} · {esc(f["intent"])}\n{esc(r["who"])}: {esc(r["text"])}\n{target}\n{esc(speaker)}</figcaption></figure>'
  body+='</div></section>'
  first=next((r for r in rs if r['label']=='desktop'),rs[0]);overview.append(f'<figure><a href="stage-{sid:02}.html#{esc(key)}"><img src="screens/{first["image"]}" alt="{esc(key)}"></a><figcaption>{esc(key)} · {esc(first["framing"]["intent"])}</figcaption></figure>')
 (OUT/f'stage-{sid:02}.html').write_text(page(f'{sid}장 전체 프레이밍',body))
 (OUT/f'overview-{sid:02}.html').write_text(page(f'{sid}장 시퀀스 개요', '<p>각 시퀀스 첫 desktop 화면의 구조 검토용입니다. 전체 페이지/모바일 원본은 각 이미지를 클릭하세요.</p><div class="shots">'+''.join(overview)+'</div>'))
checks={'codeSource':source,'captureSourceRuns':sorted(set(r.get('source',data.get('source')) for r in rows)),'integratedMaster':'ec1b66d45539d9d1fa4fa79ce5dc40599490991b','chapters':chapter,'captures':len(rows),'activeSequences':sum(c['activeSequences'] for c in chapter),'excludedCurrentVersion':sum(c['registeredExcluded'] for c in chapter),'targetFailures':sum(not r['included'] for r in rows),'speakerFailures':sum(not r.get('speakerPass',True) for r in rows),'overflow':sum(r['overflow'] for r in rows),'missingPages':sum(bool(r['framing'].get('missing')) for r in rows),'errors':data['errors'],'specialCaptures':len(special['rows']),'legacyV1Valid':special['legacySetup']['opened'],'legacyV1RejectedInV2':special['v1RejectedInCurrentV2'],'voidManualPages':special['voidManualPages'],'native':native,'directReviewScope':'Stage1 three focused art rounds plus final review; Stage2 reverse-shot continuity and guide desktop/mobile; supported legacy27 and bespoke void; chapter overview scans are structural checks, not full 30-chapter art approval or normal playthrough.'}
checks['sourceHashes']={p:hashlib.sha256((ROOT/p).read_bytes()).hexdigest() for p in ['shared/runtime/story.js','shared/runtime/story-staging.js','shared/runtime/story-framing.js','shared/runtime/story-act1-art.js','game/src/guide.css']}
(OUT/'checks.json').write_text(json.dumps(checks,ensure_ascii=False,indent=2))
with (OUT/'camera-policy.csv').open('w',encoding='utf-8-sig',newline='') as f:
 writer=csv.writer(f);writer.writerow(['stage','sequence','page','viewport','speaker','text','intent','speakerPolicy','worldSpeakerContained','speakerPortrait','targets','missing','fallback','image'])
 for r in rows:writer.writerow([r['stage'],r['sequence'],r['index']+1,r['label'],r['who'],r['text'],r['framing']['intent'],r.get('speakerPolicy'),r.get('worldSpeakerContained'),r.get('speakerPortrait'),json.dumps(r['framing']['targets'],ensure_ascii=False),json.dumps(r['framing']['missing'],ensure_ascii=False),r['framing']['fallback'],r['image']])
links='<ul>'+''.join(f'<li><a href="stage-{c["stage"]:02}.html">{c["stage"]}장 · {c["activeSequences"]} sequences / {c["captures"]} captures</a> · <a href="overview-{c["stage"]:02}.html">개요</a></li>' for c in chapter)+'</ul>'
(OUT/'index.html').write_text(page('혼로 대사·목표 안내 검수',f'<p>30장 {len(rows)}화면의 자동 포함 검사와 직접 미술 검수의 범위는 checks.json에 구분했습니다. 이미지 원본은 수정하지 않았습니다. 원본/메타데이터: <a href="inventory.json">inventory</a> · <a href="camera-policy.csv">CSV</a> · <a href="checks.json">검사 결과</a></p>'+links))
table='|장|원본 발화 슬롯|검사 시퀀스|페이지/화면비|캡처|누락/실패|\n|---|---:|---:|---:|---:|---|\n'+''.join(f'|{c["stage"]}|{c["authoredSlots"]}|{c["activeSequences"]}|{c["pagesPerViewport"]}|{c["captures"]}|{c["missingPages"]}/{c["failedPages"]}|\n' for c in chapter)
(OUT/'README.md').write_text(f'''# 혼로 대사·카메라·목표 안내 최종 검수

코드 소스: `{source}`. 통합 기준 master: `ec1b66d45539d9d1fa4fa79ce5dc40599490991b`. master 반영/Pages 배포 전 검수 브랜치 증거다.

[전체 검토 화면](index.html), [정책 CSV](camera-policy.csv), [상세 검사](checks.json), [작성 소스 목록](authored-source-inventory.json), [호출/연출 자막 원본 위치](source-calls.json).

현재 적용되는 {checks['activeSequences']}시퀀스 · {len(rows)}개의 desktop/mobile 캡처. 대상 포함 실패 {checks['targetFailures']}, 화자 표현 실패 {checks['speakerFailures']}, overflow {checks['overflow']}, 대상 누락 {checks['missingPages']}, pageerror {len(checks['errors'])}. 원본 발화 슬롯은 stage의 story/outro/beats/followup/narration/guide 위치 수이며 중복 문구도 작성 위치별로 센다. 검사 페이지에는 도착 문맥·상태 변형·런타임 서술을 추가하므로 원본 슬롯 수와 다르다. 쉼터/월드맵 대사는 별도 화면이며 world-camera 대상에서 제외하고 소스 목록에 남겼다.

## 실제로 본 범위

1장 접지/큰 형태, 얼굴·도끼 식별/가림, 일반·근접·최대 확대/축소·모바일·등장 전후의 서로 다른 집중 검수 3회와 최종 재검수를 수행했다. 수레 크기와 경사 배치 때문에 얼굴까지 가린 문제를 발견해 고쳤다. 2장 3→4→5→6→7/11 연속 컷과 상단 목표 안내를 desktop/mobile에서 직접 확인했다. 구형 27장의 부적절한 강제 fallback을 거절하도록 고치고 실제 v1 원본 지도/4인 합류를 직접 확인했다. 독립 암흑 경험 8페이지는 의도한 별도 화면으로, 자동 진행이 없고 원래 상태로 복귀함을 확인했다. 별도 특수 캡처 {len(special['rows'])}개는 `special/`에 있다.

30장 자동 검사/검토 가능한 전수 화면과 장별 개요를 전체 미술 합격 또는 정상 캠페인 완주로 부르지 않는다. 실기기 터치·전체 전투 난이도·모든 성장 조합 검사는 하지 않았다.

## 2장 5/11의 의도

4/11에서 높은 설오와 아래 상여/담허를 함께 조망한 뒤, 5/11은 설오의 시선에서 상여와 응답자를 보여 주는 리버스샷이다. 설오의 초상과 이름은 유지되고 6/11에서 담허의 응답을 잇는다. 약 2,400px 높이차를 모든 컷에 넣으면 모바일의 인물/상여가 지나치게 작아진다. `special/stage02-page04-mobile.png`, `stage02-page05-mobile.png`, `stage02-page06-mobile.png`을 연속 비교할 수 있다. 검사는 지정 사물만 검사하지 않고 일반 인물 컷의 월드 화자와 명시 문맥 컷의 초상 유지도 독립 검사한다.

## 27장 구형 분기

현재 v2 맵에 v1 합류 descriptor를 강제로 적용한 4개 이전 화면은 합류 문맥에 맞지 않았다. 이를 합격 fallback으로 남기지 않았다. 현재 버전과 맞지 않는 24/27장 v1 연출 {checks['excludedCurrentVersion']}개는 request/opening 양쪽에서 거절된다. 실제 v1 저장의 원본 지도·합류 마커·네 배우는 보존되고 `special/legacy27-*`에서 누락 없이 확인했다.

## 검증과 한계

상황 설명은 타이머가 아니라 명시 입력을 기다린다. 실제 엔진 보행/방어/행동 경계로 witness를 발동하고 20초 무입력 유지, 터치/Space 1페이지 진행, 이전·Continue·넘기기·중복 방지를 확인했다. 시작 위치/4턴과 일부 상태·그룹 위치는 명시 검사 fixture이며 완주 증거가 아니다. 관련 단위 검사, Game/embedded/Workshop 빌드 해시 계약, 곡명, 스킬 UI 회귀가 통과했다. 기존 두 실패(`stage23-escort-runtime` 4번째 warning/review fixture, `dialogue-source-inventory` title-markup 글리프 분류)는 d7244a8a에서도 동일 재현됐으며 통과로 세지 않았다.

## 장별 범위

{table}
''')
zip_path=ROOT/'_local/archive/honro-dialogue-camera-review.zip';zip_path.parent.mkdir(parents=True,exist_ok=True)
with zipfile.ZipFile(zip_path,'w',zipfile.ZIP_DEFLATED,compresslevel=4) as z:
 for p in sorted(OUT.rglob('*')):
  if p.is_file():z.write(p,Path('honro-dialogue-review')/p.relative_to(OUT))
print(json.dumps({'output':str(OUT),'captures':len(rows),'zip':str(zip_path),'zipBytes':zip_path.stat().st_size}))
