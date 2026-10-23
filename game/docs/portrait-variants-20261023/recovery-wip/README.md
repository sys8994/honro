# 미검증 WIP · 초상 변형 복구 인계

배포/통합 후보가 아니다. 구현 재개 없이 환경 복구 시점의 초안을 보존했다. 원래 작업 브랜치와 master/Pages는 변경하지 않는다.

- 로컬 출발 SHA:35fdc9104504c83376de4c8440af40d26c8d6dfa. 부모 추가5종 입력2fd286e의 cherry-pick을 포함한다.
- 기존 작업 원격 HEAD:f5cef9de6a0e10d6365dacc87b798545a693b45d. 그 브랜치는 이 WIP로 덮지 않았다.
- 완료·배포된 별도 단위:0570e091의 NPC9종 교체. 부모 확인 Pages39911463947 success2026-10-23T06:28:52Z. 이번 WIP manifest에는 이 성공 사실을 아직 등록하지 않았다.

## 보존한 초안

config3개(npc-portraits/story-portraits/portrait-variants), runtime portraits/npc-portraits/story/act2/bell-anomaly, shared build/web-build 변경이다. 단일 portraitExpression 선택과 same-person base fallback, 다음1행 준비, decoded RGBA 예상 바이트 LRU, 동적 value4개 태그 전달을 구현했으나 검증이 끝나지 않았다. 기존 엔진/퀘스트/대사 문자열을 새로 수정한 작업은 아니다.

부모의 원본12종과 그 배포 WebP/encoding metadata, encode-portrait-variants.mjs, audit-portrait-variants.mjs, portrait-expression-contract.mjs를 보존했다.12개 registry의 status:ready는 초안 등록값이며 실제 UI/미술/실패 검수 완료를 뜻하지 않는다. 이 상태를 준비 완료나 실제 배포로 집계하지 않는다. 이미지 생성/창작 편집은 수행하지 않았다.

## 실행 결과와 남은 실패

1. [첫 빌드 실패](build.txt):HONRO_PORTRAIT_VARIANTS를 기존4개 narrative-data 묶음 사이에 넣어 web-build.mjs의 순서 assertion이 실패했다. 이후 shared/build.mjs에서 해당 전역을 HONRO_STAGE_CONTRACTS 뒤로 옮겼지만 **재빌드는 미실행**이다. 현재 HTML/web 생성물은 새 변형 구현을 담은 성공 산출물이 아니다.
2. [계약 검사 실패](contracts.txt):tests/portrait-expression-contract.mjs:20의 옛 저장 커서에서 actual0/expected1. 원인이 fixture인지 생산 코드인지 미확정이며 고치지 않았다. 앞선 순차 assertion이 진행됐어도 전체 통과로 기록하지 않는다. 실패 때문에 마지막 dynamic.json 보고서는 작성되지 않았다.
3. [선행 태그 감사](audit.txt):723고정행/641캐릭터 태그/82제외, rescue metadata6/value4 검사 오류0. ready435/pending206은 추가5종 등록 전의 수치이므로 **최종 제작 수요 수치가 아니다**.
4. [12종 인코딩 기록](encoding.txt):768×1152/Q94 alpha100. 원본과 개별 얼굴/상반신 framing을 연결한 초안이다.7종과 추가5종 원본을 직접 확인했지만, **12종의 실제 모바일/가로 크롭·동작·소품 검수는 미실행**이다. 휘겸 base framing은 변경하지 않았다.

다음 복구 작업:먼저 이 WIP와 원본 입력을 읽고 빌드 및 커서 실패를 확인한다. 이후 선택/오타/미제작/기본 파일 실패/느린 로딩/빠른 넘김/재열기/크기 변경/저장/휴식터/허공터/캐시 바이트와 실제12종 UI를 검증한다. 기존 공개0570 성공 graph도 보존 등록해야 한다. 재구현 전 현재 초안을 확인하고, 기존 보호된 공개379 자산과 S13/종지기 전투/25개 대사는 유지한다. master/Pages는 부모 담당이다.

일시적 환경 연결 해제 후 파일은 복구됐다. 권한 거부를 우회한 작업은 없으며, 부모의 보존 전용 지시에 따라 여기서 중단한다.
