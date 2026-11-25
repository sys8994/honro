# 앞 막의 보존과 회귀 표본

작업본과 기존 `master` `dd409de2e635c5c0b16877266c1bb233d5a00fd7`를 별도 작업 디렉터리에서 실행했다. 56 승인 패킷 `49ee966549dd788c157d76dfe0008147df595183`, 60 패킷 `32217a6a6affda133d964b7c6028ef584ad2673f`, 엔딩 소스 트리 `0f321f592af87d2a821cf57e50f2ad1b46e28672`가 양쪽에서 일치했다.

| 명령 또는 검사 | 관측 |
|---|---|
| `npm run test:campaign-continuity` | 통과. 31개 fixture 생명주기 검사다. |
| `node tests/act5-terrain-contact.mjs` 및 `node tests/act5-journey-atlas.mjs` | 통과. Act 5 열 장의 접지·지도 등록 및 연결을 검증한다. |
| `npm run test:ground-contact` | 두 작업본 모두 `ground-contact.mjs:23`의 실제 경사 절댓값 `>1.35` 검사가 실패했다. |
| `npm run test:rest-hub-journey-flow` | 두 작업본 모두 먼저 11건을 통과한 뒤 `G.HonroPortraits.markup is not a function`에서 멈췄다. |
| `node tests/stage50-composite.mjs` | 두 작업본 모두 기존 값 2, 테스트 기대값 4로 실패했다. |
| `npm run test:act3:maps` 및 `npm run test:campaign-metadata` | 두 작업본 모두 기존 호수 저작 변경 검증 `Only exact lake author delta may be reversed`에서 실패했다. |
| `node tools/act4-source/world-source.mjs materialize` 후 `npm run test:act4-source` | 두 작업본에서 실제 복원 SHA `55d22b…92275`와 테스트 고정값 `801df9…1b5`가 달라 3건 중 1건이 실패했다. |
| `npm run test:act1:normal` | 자동 입력기는 4장 승리까지 기록했다. 1·3장은 행동 예산 만료로 완료 판정을 내리지 못했다. |
| `npm run test:act2:normal` | 13·17장 승리, 14장 구조 대상 손실, 11·12·15·16장 입력 예산 만료가 확인됐다. 앞 막 연속 완주 증거는 없다. |

6막의 실제 새/이전 체크포인트 검수는 [장 경계 증거](../README.md)에 있다. 앞 막은 위의 표본 결과만 기록했다.
