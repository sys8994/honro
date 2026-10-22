# 마지막 통합 · 2026-10-22

브랜치 `integration/render-update-release-20261022`. 원격 master `a091c6bd5e64eff748f5028fb6d0080faea3da87`를 다시 확인한 뒤 아키텍처 최종 `546f3e1ffcf41e1facc50db99495dad4d36b2ddc`를 fast-forward했다. 별도 성능 브랜치 전체를 병합하지 않고 source-only `b8487309`를 `d0db99ad`로 cherry-pick했다. source3줄과 실제 Engine lifecycle/browser 검사만 포함한다.

이 통합에서는 settledHits 정리가 포함된다. [이전 아키텍처 보고서](README.md)의 '별도 통합 대상' 문구는546f3e1f 당시 상태다. [연속 전투/참조 경계 기록](../battle-runtime-performance-20261022/CONTINUOUS_AND_REFERENCES.md)의 f8 실행 수치·사진·manifest는 역사적 증거이며 새 통합 빌드의 실행 수치가 아니다. 문서에서 직접 참조한 증거와 재현에 필요한 round1 fixture/continuous 도구를 선택 보존했다. 오래된 generated HTML/web는 가져오지 않았다.

원래 점증 렉은 미재현/미해결이고, 일반 pause/DOM의 확정된 중복 작업 제거와 작은 조건부 참조 정리만 채택한다. 새 실루엣/궤적/지형 미술 변경은 없다. master/Pages는 부모 최종 확인 대상이며 이 브랜치에서 변경하지 않는다.

공통 build와 통합 집중 검수 결과를 아래에 추가한다. 긴3회 성능 표본은 같은 렌더 아키텍처의 기존 최종 결과를 보존하고 다시 반복하지 않는다.

## 통합 빌드·검수 결과

- 실제 실행/빌드 HEAD: `6e968e6ca5b21ffcd4ce82d5988083243e59d83c`. 런타임 소스는546f3e1f + cherry-pick d0db99ad(b8487309). 이후 최종 커밋은 문서·검사 증거만 추가한다.
- manifest SHA-256: `13c1391a258592fc7e155fe74f36af948c97f8dc53bda620e2bf00ece8aefcad`. HONRO.html SHA-256: `d64fe0c407c59c2e0f3c70b58a6df04e7c47c6fa4b64a6cce1226df1a9c7f12e`. 과거 f8/기존 아키텍처 manifest와 구분한다.
- 공통 `npm run build`, 수정한4개 runtime syntax 및 관련 Python syntax 통과. 실제 Game/Workshop/직접 Playtest 공통 산출물을 새로 빌드했다. Pages 실행은 아직 하지 않았다.
- native settled lifecycle12회: 고아 참조0, 현재 유닛 pause/resume·새 피격·hurt 종료·복원 identity 보존. 실제 Chromium 소환 생성→피격→만료/prune 비교: 구 함수는 제거 객체 유지, 통합 함수는 해제, RGBA 차이0·battle state 불변.
- paused 경계/동일 canvas/전체 battle JSON, 회전3방향·DPR·origin·scene revision·실제 hit/focus·image/legacy-provider/context 이벤트 fixture·시간 기반 카메라·battle 위 preview·실제 재개 충전/발사·flight pause·12회 전환 통과. GPU/실기기/실제 네트워크 장애로 표현하지 않는다.
- HUD skill node120회 유지, pause20회/preview12회 개폐의 DOM 수 일정, 실제 persist→stopBattle→Continue의 유닛/지형/성장/장착/완료/아이템 보존, 별도 이전 master 대 통합 빌드 실제 screenshot7장 비교 통과. 일부 HUD AA 잔차는 raw의 pixel 수/최대 channel 차이로 명시하며 정확 일치로 부르지 않는다.
- 23장 기존 집중 검사 `tests/stage23-road-lead-resume.mjs` 통과: 정상 편대 ramp 입력·exact Continue·분할 입력 일치·기존 도착 보상1회. 전장 전체 완주나 새 난이도 승인 검사가 아니다.
- `shared/data`, `shared/engine/src`, `shared/map`, `game/src` 및23 escort/act-endings/rest-journey/menu-ui는 기준 master와 byte diff0. 전체 runtime diff는 허용한 main/combat-status/objectives/combat-feedback4개만 있다. 따라서11·14·17·18 pacing 및 debug ending의 원본을 덮지 않았다. 이는 source 보존과 기존23 집중 검사이며 모든 장 플레이 재검증 주장이 아니다.

짧은 동일 조건 pause 확인은 정상 camp의84 icon 준비/생산 Story의 실제 시작 배너 종료 뒤 동일 카메라로120 frame만 수행했다. frame p50/p95/max **0.2/1.3/14.4ms**, rAF p50/p95/max **16.7/33.4/66.6ms**, longtask 0개. tracked tree clean, compiled manifest 일치. 3회 긴 성능 표본은 재실행하지 않았다.

[통합 browser 결과](integration-evidence/browser-summary.json), [source 보존](integration-evidence/preservation.json), [실제 참조/Canvas 검사](integration-evidence/settled-browser.json), [pause 경계](integration-evidence/paused-boundaries.json), [HUD·저장·픽셀](integration-evidence/hud-save-pixels.json), [짧은 pause raw](integration-evidence/short-pause.json), [최종 pause JPG](integration-evidence/final-paused-desktop.jpg). 원래 사용자 점증 렉 미해결 및 정상 전투의 남은 큰 실루엣/궤적 비용은 이전 결론 그대로다.

원격 master/Pages는 변경하지 않았다. 권한 거부·우회·결과 불명 작업 없음.

검사 추적: native/syntax 및 build 호출 당시 source HEAD는9560c5f6이며 런타임 소스는 d0db99ad와 동일하다. 새 generated 산출물을6e968e6c에 커밋한 뒤 browser/짧은 pause를 clean HEAD6e968e6c에서 실행했다. 원본 로그는 Git ignore와 구분해 `.txt`로 보존했다(기존 warm 대기 실패 로그도 내용 그대로 복원). 문서/해시 보존 정리이며 실행 소스는 추가 변경하지 않았다.
