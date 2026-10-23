# 묵종 피치 대사 적용 결과

기준 master는 `a1585e85d0fc621661a73f2004953a69d492c95a`, 확정 대본 입력은 `7887c6d4bd584f94e27f727f369643da395ea2ca`다. 런타임 소스는 보존 커밋 `f26f2c178f603b4ba9c2c414aa3ba45575635d9c`와 동일하다. 최종 생성물 진입점은 `web/entries/game.2bcfd53fdd77ccbf.js`다. master 반영과 공개 검증은 부모가 수행한다.

## 적용

- 확정 원문 신규 5행·교체 2행만 반영했다. 이를 되돌리면 기준의 전체 이야기 데이터와 정확히 같다. 문학 검수 5회는 부모의 review-01~05 기록이며 구현자가 대본을 재작성하지 않았다.
- 첫 대사는 실제 AudioBufferSource 시작 성공과 +1 이상을 확인한 뒤 보관한다. 후반 대사는 첫 대화 완료 후 별도 실제 의식 serial, +3 이상, 실제 재생 증거를 요구한다. 같은 라운드 잔울림/의식은 기존 음향 합침을 유지한다. 음소거·미준비는 들었다고 판정하지 않는다.
- 일반 Story 읽기 경로를 사용한다. 목표 대화·투사체·의식·입력 진행 중에는 기다리고, 제압/전투 종료 때 대기 중인 대사만 폐기한다. 기존 목표/outro 큐에 조건부 대사를 미리 넣지 않는다.
- 발생·대기·열림·완료·폐기와 읽기 완료를 저장한다. 명시적 넘기기는 사건 완료, `readComplete=false`, `skipped=true`다. 재등장하지 않으며 다음 적합한 후반 의식의 선행 완료로 인정한다. 이전 버튼과 렌더만으로 완료하지 않는다.
- 초상화 키 `action.bind-cord`는 기존 실제 등록 키 `action.bind_cord`로 대응했다. 이미지·원본·피치 계산/간격·전투/퀘스트 조건은 바꾸지 않았다.

## 확인

- 기존 구문 검사 통과. `node tests/mukjong-pitch-dialogue.mjs` 통과: 원문 exact, 실제 Engine 의식, 음향 합침, 목표/투사체 우선, Continue, 이전/다음, 20회 렌더·120회 갱신, 스킵, 무음, 같은 serial, 제압 후 폐기.
- 최초 네이티브 실패는 목표 대화 fixture가 drain의 기존 afterAction 대기 조건에 걸린 것이었다. `afterAction:0`인 준비된 입력으로 수정해 통과했고 제품 코드는 바꾸지 않았다.
- `npm run build`, `node tests/web-split.mjs` 통과: 생성 파일 381개, HTML/embedded/Workshop 진입 및 해시/바이트 검사.
- `node tools/testing/audit-portrait-variants.mjs` 통과: 고정 728행, 태그 646행, 제외 82행, 구조 metadata 6개, 동적 값 분기 4개, 오류 0.
- `python tools/testing/mukjong-pitch-dialogue-browser.py` 통과. 실제 빌드 Chromium 390×844 및 844×390에서 첫 상승·후반 의식·제압 후 표준 outro를 확인했다. 실제 소리 시작, 실제 `enemyAction`/`hurt`, App.frame 안전 경계, Continue/이전/다음, 준비된 초상화와 버튼 hit-test, 기존 가족 요청/휘겸 답변을 확인했다. 음원 요청 1·디코드 1·재생 3, 버퍼 1,023,116바이트. pageerror/HTTP 오류 0.
- 기준 a158 활성 그래프와 기존 공개 33개 그래프의 모든 파일·SHA-256이 동일하게 남는다. 새 성공 발행 기록을 임의로 추가하지 않았다.

## 증거와 한계

자동 결과/사진은 규칙대로 Git 제외 `_local/reports/mukjong-pitch-dialogue-20261023/`에 둔다. `native.json`, `browser.json`, `retention.json`, 빌드/초상 감사/web-split 로그와 `first-rise-mobile.jpg`, `first-rise-damheo.jpg`, `later-ritual-mobile.jpg`, `later-ritual-landscape.jpg`, `after-subdue-mobile.jpg`다. 실행 도구는 저장소에 보존했다.

브라우저는 라운드·근접 좌표·목표 준비를 fixture로 만들었다. 최초 sample 준비까지 frame을 고정한 뒤 실제 frame 재생을 재개했다. 제압은 실제 비살상 피해 경로를 사용하고 그 뒤 정식 outro reader를 명시적으로 열었다. 정상 18장 완주·실제 기기·음질 청취·공개 배포 검사로 표현하지 않는다. 환경 중단 중 초안을 먼저 원격 보존했고 같은 환경에서 재개했다. 해결되지 않은 제품 실패나 현재 실행 차단은 없다.
