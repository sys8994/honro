# 초상 변형 시스템 · 최초12종 연결 최종 검수

브랜치 `fix/portrait-variants-recovery-wip`. 최종 runtime/build 소스는 **e0416942d866e9bb1573b4f8fbd43c8debd74a72**다. 이후 증거·감사 도구 정리는 생산 runtime/config/HTML을 바꾸지 않는다. master/Pages는 부모가 반영한다. 독립 NPC9종 교체는0570e091에 이미 완료됐다.

## 확정 입력과 ready/pending

부모 입력 f0e4c40b의 고정723행 중 캐릭터641행 및 rescue metadata6개, 총647개 portraitExpression을 그대로 사용한다.82개 서술/기록/안내/익명 제외도 유지한다. 부모2fd286e의 최종 manifest12종만 연결했다. 기본13종(주연4+NPC9)과 변형12종이 등록돼 있으며, 미제작 이미지를 완료로 집계하지 않는다.

고정 대사 감사: **ready467행 / pending173행 / 구조 때 화자가 치환되는1행 / 제외82행**. pending은 알려진 종류의 실제 그림이 아직 없는 경우이며 같은 인물 base를 표시한다. 구조 placeholder1행은 미제작 NPC가 아니며 실제 덕수/월이/칠복으로 치환한 뒤 연결한다. [행별 source pointer·rowId·실제 인물·요청/선택·파일·대체 사유 및 미제작 목록](evidence/demand.json).3주민×4활성영웅×첫/반복24조합과 value4개에서 실제 생성된58행의 선택 결과도 runtimeRows에 포함했다.

카탈로그는17종이며 metadata.portraitExpression 하나만 선택한다. 감정 키워드 추론·중복 선택 필드·임의 전원base 처리는 없다. 새 공식 데이터의 누락/모르는ID는 검사 실패다. 옛 저장/사용자 데이터의 누락은 표시할 때만 base로 정규화하며 원래 lines/metadata/큐/커서는 다시 쓰지 않는다. 새 변형은 해당 인물 registry에 파일을 등록하면 같은 태그에 연결된다. 테스트용 가짜 아트는 production ready로 집계하지 않는다.

## 실제 화면과 미술 확인

[세로 앞6종](evidence/mobile-0.jpg) · [세로 뒤6종](evidence/mobile-1.jpg) · [가로1](evidence/landscape-0.jpg) · [가로2](evidence/landscape-1.jpg) · [가로3](evidence/landscape-2.jpg).

집중1은 승인 원본의 인물/복장/소품/설정, 집중2는 확대 세부·인코딩·alpha, 집중3은12종390×844/844×390 실제 App 화면24개다. 이미지별 framing을 사용하고 휘겸 base 확대 설정은0570과 exact로 보존했다. 소단의 매듭/빈손, 덕수 안도, 종지기의 시전/낮아진 손과 줄을 구별했다. 하반신은 기존 승인 배치대로 읽기 박스 뒤에서 가려진다. 원본 손/의복을 다시 그리거나 배경을 제거하지 않았다.

최종 경계 확인에서 종지기2종의 양수 crop top이 위쪽 실제 머리 픽셀을 자르는 것을 발견했다. top=-8로 머리 여백을 확보하고 아래쪽 도달 범위를 유지하도록 framing만 수정했다. [전후 실제 화면](evidence/keeper-head-before-after.jpg), [수정 후 세로/가로4화면과 보호 head/전체 폭 검사](evidence/keeper-crop-final.json). PNG/WebP 이미지 바이트는 이 보정에서 바뀌지 않았다.

변형12종은768×1152/Q94/alpha100 WebP 합 **2,277,094bytes**다. PNG 원본은 불변이며 RGB는 손실 인코딩이므로 원본 픽셀 동일로 표현하지 않는다. [12종 원본/인코딩 SHA 및 정상768 resize 대비 alpha exact](evidence/alpha-final.json). 원본 아래 모서리 alpha가 높은 일부는 의복/활/몸이 이미지 끝까지 이어진 부분이다. 상단/양옆 투명 영역과 실제 UI에 별도 사각 배경이 없는 것을 확인했다.

최종 e0416942에서12종의 **실제 story mount가 올바른 인물을 선택하고 onload만으로 ready가 되는지** 별도로 확인했다. 이 검사에는 draw polling이 없고, 이후 info 조회가 paint/request/decode를 늘리지 않는 것도 확인했다.12종 모두 부모가 이미 태그한 실제 행이며 테스트용 태그 치환0이다. [최종 mount 검사](evidence/mount-audit.json).24화면 전체 및 네트워크 행렬은c4e7a804, 이후 변경은 종지기2 framing뿐이며 해당4화면과 최종 mount를 재검수했다. 전체 행렬을 마지막 SHA에서 다시 돌렸다고 쓰지 않는다.

## 선택·실패·수명 검증

정확한 등록 변형→동일 인물 base→표시용 중립 영역 순서다. 미제작/오타에 대해 URL을 추측해404를 만들지 않는다. 대사의 변형 이미지 경로는 네트워크 실패 때 구 벡터 초상으로 돌아가지 않는다. 기존 세계 속 벡터와 이 경로 밖의 기존 소비자는 임의 삭제하지 않았다. 실패한 새 화자에 직전 다른 인물 그림이 남지 않으며 같은 인물 변형 로딩 동안은 기존 그림을 유지한다.

[24화면·구 저장·휴식터/모닥불/허공터·slow/rapid/503/404/base404/8초timeout/재열기](evidence/browser.json), [실행 로그](evidence/browser.txt).503은 변형 물리요청2회에서 회복,404는 자동3회 후 재열기4번째에서 회복했다. base404는 대사 초상을 중립으로 유지하고 재열기에 회복했다. timeout 표본은 변형 물리2회였다. 이 수치는 특정 변형 URL이며 전체 앱 요청량과 구별한다. 대사/이전/다음은 비차단이다.

release 후 pooled canvas의 loading primary/fallback waiter가 사라지는 버그는 ce951a8에서 재현했다. 같은-key 재열기 때 두 waiter와 현재 대화 보호를 다시 등록하고, LRU에서 축출된 base fallback 재요청도 보완했다. [실제 Story.finish 및 같은 owner 컴포넌트의 전후8사례](evidence/reopen.json), [결과](evidence/reopen-final.txt). 수정 전 loading 잔류, 수정 후 추가 draw polling 없이 ready다. 이전 검사에서 held route를 닫으며 발생한 도구 teardown 경고도 정리한 뒤 재실행했다.

캐시는 현재 표시 대화와 다음1행을 보호한다. 준비된 decoded RGBA 예상 바이트를 좁은 화면16MiB/큰 화면32MiB로 LRU 정리하며, 이미 그린 아이콘 canvas는 재사용한다. resize 때 예산 축소도 처리한다. 별도 rAF나 인물별 loop는 만들지 않았다.24화면의 ready 표본 최대16,121,856bytes로16MiB 이내였다. pending decode·브라우저 HTTP/디코드 캐시·canvas backing·전체 heap의 상한을 보장하는 수치는 아니다.

ready 및 실패 정착 후 같은 draw120회에서 추가 paint/clear/request/decode0. [실제 다음/이전10왕복](evidence/controls.json)도 같은 portrait canvas를 유지하고 요청/decode/paint 증가0이었다. 서로 다른 인물/장면을 순회할 때의 LRU 재decode와 구별한다. 모달 전체 DOM을 전혀 다시 만들지 않는다는 주장은 아니다.

[모바일 허공터](evidence/training-mobile.jpg) · [모닥불](evidence/camp.jpg) · [변형404의 같은 인물base](evidence/404-fallback.jpg) · [base도 실패한 중립](evidence/base404-fallback.jpg).4주인공 dialogue/bust/icon12조합은 aa4와 RGBA exact였고 기본 원본/framing은0570과 exact다. [픽셀 검사](evidence/hero-final.txt).

## 대사/저장·빌드 보존

[계약 검사](evidence/contracts-final.txt)는 단일 스키마·647태그·82제외·누락/오타 거부, 부모 태그만 제거하면 c21의 전체 JSON exact,12등록·24구조 조합·동적value4개·옛 저장 커서를 확인했다. manifest/lamp value는 소단 base, neither는 소단 emotion.resolve, settled bell 마지막 행은 담허 emotion.resolve다. 미제작 resolve 두 경우는 base로 표시하고 보고한다. 실제 원문/rowId/큐/카메라·퀘스트 조건은 바꾸지 않았다. [동적 생성 원문](evidence/dynamic.json).

WIP의 옛 저장 커서0≠1 실패는1장 미합류 담허를 fixture 둘째 화자로 넣어 저장 전에 기존 허용 규칙이 줄을 제거한 문제였다. [WIP/0570 모두 저장 전1행·커서0 비교](evidence/cursor-cause.json). 두 허용 화자 행과 저장 전 커서 assertion으로 고쳤다. 제품 큐/커서 코드는 수정하지 않았다. 실제 브라우저 reload/Continue에서도 옛 metadata와 커서1이 보존됐다. 첫 build 실패는 기존 narrative-data4개 묶음 사이에 새 카탈로그를 넣은 순서 문제이며 위치 수정 후 통과했다. [역사적 WIP 실패 기록](recovery-wip/README.md)은 보존한다.

[최종 build](evidence/build-final.txt), [active378파일 해시·native 기본진입·campaign parity](evidence/web-final.txt), [발행 retention 검사](evidence/retention-test.txt), 관련 JS/Python syntax 통과. Game entry는 `game.8b4bc34c455c6bc6.js`, Playtest는 `game.c5b273b185485c54.html`다. [최종 SHA/graph/hash/경계](evidence/preservation-final.json).

현재 공개0570 Pages39911463947 success06:28:52Z 및379를 포함한30개 발행 graph의 고유636파일은 byte/SHA 확인했다. 새 후보를 성공 발행으로 등록하지 않았다. 부모가 겪은 일시 training CSS 실패는 로컬에서 재현하지 못했으며 파일/해시 존재와 실제 모바일 훈련 CSS HTTP200을 확인했다. 정적 누락이라고 단정하지 않는다. 엔진·맵·main·CSS·training·skill-images·효과음 코드는0570과 같다. 종지기 전투/25대사와 S13은 입력 그대로 보존하며 이번 작업에서 전투 완주를 새로 증명했다고 쓰지 않는다.

## 범위와 남은 항목

데스크톱 Chromium의 화면비/터치 모사 및 원문 resume-row 표시 fixture다. 물리 Android/Safari·전체 캠페인·공개 Pages는 미실행이다. 제목의 일본어 표기는 한국어로 고쳤다. 이번 구현/12종 연결에 남은 차단은 없으며, 미제작173행의32종 인물/종류 조합은 부모 제작계획으로 남긴다. 부모 최종 검수 후 master/Pages 반영한다.
