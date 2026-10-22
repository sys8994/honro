# 3막 7장 설오 조우: 대사·속도·배치 수정

기준은 `master c0e323ff3df9c5f4120e48d470c8ca80c679c57e`, 작업 브랜치는 `fix/act3-void-dialogue-pacing`이다. 부모가 전달한 2026-10-22 사용자 피드백과 확정 대본만 적용한다. master 병합과 Pages 발행은 부모 최종 검수 담당이다.

## 대본과 공개 범위

| 컷 | 내부 배치 | 대사 |
| --- | --- | --- |
| 1 | 설오 / near | 여긴…… 누구십니까? |
| 2 | 이름 없는 문장 / far | 또 답을 들으러 왔느냐. |
| 3 | 설오 / near | 저는 사람을 찾고 있습니다. |
| 4 | 이름 없는 문장 / far | 그자는 달랐다. 죽은 이의 말이 아니라, 죽음 너머의 답을 원했다. |
| 5 | 이름 없는 문장 / far | 너는 아직 돌아갈 길이 있다. |

복귀 대사:

1. 담허: 발을 헛디뎠나? 다친 데는 없나?
2. 설오: 누군가 말했습니다. 저보다 먼저, 답을 구하러 온 이가 있었다고.
3. 담허: ……나는 아무 소리도 못 들었네. 우선 이곳부터 벗어나세.

[전체 바이블 3.2·6절](../story/HONRO_FULL_STORY_BIBLE_v1.0.md) 및 [개편 사양 C절](../story/HONRO_ACT2_ACT3_REVISION_AGENT_SPEC_v1.0.md)의 정체·공개 상한을 유지한다. 이번 최신 표현 변경은 이전의 '돌아가라' 반복, 긴 정적, 상시 버튼 금지보다 우선한다. 대도사의 **동경**, 즉 죽은 자의 말을 넘어 저승 자체의 답을 듣겠다는 집착을 생각할 단서다. '그자'의 신원이나 동일 존재 여부는 확정하지 않으며, 29장 기록과 연결해 생각할 여지를 남긴다. 이름·초상·형체·악의·예언·선택받음·빙의 면죄·종 제작법·70년 지연 원리는 추가하지 않는다. 원본 바이블은 수정하지 않는다.

## 구현 단위

- 낙하 0.8초 + 암전 0.6초 = 1.4초. 빈 컷과 문장별 1.5~2.5초 wait 삭제. 대사 전체를 즉시 표시한다.
- 화면 클릭/탭, Enter/Space로 진행한다. 입력 중복만 120ms 차단하며 반복키는 소비한다. 포인터의 진행 경로는 click 하나다. pointerup과 compatibility click에 각각 진행시키지 않는다.
- 전환을 포함한 모든 단계에서 작은 '장면 넘기기'와 '잠시 멈춤'이 보이며 최소 44px hit area다. 버튼 클릭은 바탕 진행으로 전파하지 않는다. 화면 안내는 12px 보조 문구다.
- 양 화자의 최장 문장 영역을 현재 글꼴과 화면비로 먼저 측정한다. 존재는 상부, 설오는 하부에 두고, 그 사이에서 기존 rig의 실제 비투명 픽셀 영역을 맞춘다. 28px 간격과 인물 축척을 함께 계산한다. 타격/충돌 높이를 인물 실루엣으로 오인하지 않는다. 인물은 2배 해상도로 한 번 그린 기존 rig이며 새 형태나 에셋을 추가하지 않는다.
- 기존 transient/blocked 계약, 전투 tick·mission 정지, 저장 revision과 증거 키, 원위치/자원/동행/카메라/입력/HUD/BGM 복원을 유지한다. 스킵 중 반복 요청은 복귀 타이머를 초기화하지 않는다. 보상은 추가하지 않는다.
- 기존 27장 네 도착점, 필수 명세 guard, 28장 합류 및 구 저장/체크포인트 계약을 보존한다. 중간 저장 재개는 원래 안전 위치의 READY, 완료 저장은 RESOLVED와 복귀 대사를 유지한다.

## 병행 통합 주의

읽기 전용으로 확인한 `integration/honro-feedback-20261022`는 `d042aff6c53d40346d57e5ebe431bc72b27c35d2`였다. 당시 이 작업의 JS/CSS/두 테스트에는 직접 변경이 없었다. 통합 브랜치는 계속 진행 중이므로 최종 cherry-pick 시 다시 확인해야 한다.

- `shared/runtime/main.js`의 blocked 분기와 `act3-void.js` API는 그대로다. 통합 보고서의 실시간 집계가 장면·복귀 대화 중 제외되는지 부모 통합 검수가 필요하다. 이번 브랜치에는 그 보고서 코드가 없다.
- 통합 쪽의 `split-campaign.js`, `stake-crossing.js`, `campaign-entry.js`, `rest-journey.js`, `main.js`를 덮어쓰지 않는다. 변경은 장면 JS/CSS, 해당 테스트와 이 보고서 및 BUG_LOG의 짧은 링크에 한정한다.
- `game/docs/BUG_LOG.md`는 병행 추가에 따른 문맥 충돌 가능성이 있다. 이 작업의 마지막 항목만 추가하면 된다.
- 빌드 산출물 `HONRO*.html`, `index.html`, `web/`는 로컬 검증에만 사용한다. 기준 checkout 자체의 생성물 불일치도 있으므로 부모가 최종 통합 소스로 한 번 재생성한다. 이 브랜치에는 생성물 diff를 커밋하지 않는다.

## 검수 기록

집중 검수 1(속도/입력), 2(모든 컷 반응형 겹침), 3(복귀/저장) 및 최종 소스의 별도 종합 검수 결과는 evidence와 함께 다음 기록 커밋에 정리한다. 자동 검사 통과와 실제 JPG 열람을 구분하며 미실행을 통과로 기록하지 않는다.

재현 명령:

```sh
npm ci --ignore-scripts --cache /tmp/honro-npm-cache
npm --prefix game ci --ignore-scripts --cache /tmp/honro-npm-cache
npm run build
HONRO_VOID_REVIEW=input python tests/act3-void-browser.py
HONRO_VOID_REVIEW=layout python tests/act3-void-browser.py
HONRO_VOID_REVIEW=state python tests/act3-void-browser.py
HONRO_VOID_REVIEW=final python tests/act3-void-browser.py
node tests/act3-void-runtime.mjs
npm run test:story-revision
npm run test:act3:split
npm --prefix game run typecheck
node tests/web-split.mjs
```

검수는 실제 빌드한 로컬 Chromium과 명시적인 27장 심부 배치 fixture다. 전체 30장 완주·정상 전투 완주·실물 모바일·OS 백그라운드 수명주기·성능 합격을 주장하지 않는다. `document.hidden`은 통제한 getter fixture로 검사한다. master/Pages 공개 검증은 부모 작업으로 남긴다.
