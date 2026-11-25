# 앞 막의 보존과 회귀 표본

작업본과 기존 `master` `dd409de2e635c5c0b16877266c1bb233d5a00fd7`를 별도 작업 디렉터리에서 실행했다. 56 승인 패킷 `49ee966549dd788c157d76dfe0008147df595183`, 60 패킷 `32217a6a6affda133d964b7c6028ef584ad2673f`, 엔딩 소스 트리 `0f321f592af87d2a821cf57e50f2ad1b46e28672`가 양쪽에서 일치했다.

| 명령 또는 검사 | 관측 |
|---|---|
| `npm run test:campaign-continuity` | 통과. 31개 fixture 생명주기 검사다. |
| `npm run test:release-guard` | 현재 작업 소스에서 19건 통과. |
| `npm run test:terrain-domain` | 별도 빌드 두 작업본 모두 `terrain-domain.mjs:13`의 기존 `playProjection` 기대값에서 실패했다. 이후 두 하위 명령은 이 실행에서 시작되지 않았다. |
| `node tests/act5-terrain-contact.mjs` 및 `node tests/act5-journey-atlas.mjs` | 통과. Act 5 열 장의 접지·지도 등록 및 연결을 검증한다. |
| `npm run test:ground-contact` | 두 작업본 모두 `ground-contact.mjs:23`의 실제 경사 절댓값 `>1.35` 검사가 실패했다. |
| `npm run test:rest-hub-journey-flow` | 두 작업본 모두 먼저 11건을 통과한 뒤 `G.HonroPortraits.markup is not a function`에서 멈췄다. |
| `node tests/stage50-composite.mjs` | 두 작업본 모두 기존 값 2, 테스트 기대값 4로 실패했다. |
| `npm run test:act3:maps` 및 `npm run test:campaign-metadata` | 두 작업본 모두 기존 호수 저작 변경 검증 `Only exact lake author delta may be reversed`에서 실패했다. |
| `node tools/act4-source/world-source.mjs materialize` 후 `npm run test:act4-source` | 두 작업본에서 실제 복원 SHA `55d22b…92275`와 테스트 고정값 `801df9…1b5`가 달라 3건 중 1건이 실패했다. |
| `npm run test:act1:normal` | 자동 입력기는 4장 승리까지 기록했다. 1·3장은 행동 예산 만료로 완료 판정을 내리지 못했다. |
| `npm run test:act2:normal` | 13·17장 승리, 14장 구조 대상 손실, 11·12·15·16장 입력 예산 만료가 확인됐다. 앞 막 연속 완주 증거는 없다. |

6막의 실제 새/이전 체크포인트 검수는 [장 경계 증거](../README.md)에 있다. 앞 막은 위의 표본 결과만 기록했다.

## 후보 커밋 4a25a187 재실행

분리한 정확한 4a25a187에서 앱과 Workshop 빌드가 성공했다. 캠페인 생명주기 31건, release guard 19건, 지형 가독성/시각 계층 세 명령이 통과했다. 30개 장 렌더 경로와 원래 레이어 분류를 검사했다. 56·60 패킷과 엔딩의 위 해시는 이 커밋에서도 일치한다.

같은 명령의 맵 도메인 첫 검사는 이 커밋과 별도 master dd409de2에서 모두 같은 파일 13행의 `st.terrains.some(t=>t.playProjection)`으로 실패했다. 새 분기와 원래 실패를 구분했다. 해당 명령의 연쇄 뒤 두 검사는 실행되지 않았다. 실제 51→60 플레이의 결과는 [연속 검수](README.md)에 있다.

```bash
npm run build
npm run test:campaign-continuity
npm run test:release-guard
npm run test:terrain-readability
npm run test:terrain-domain
```
