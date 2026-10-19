# 3·4장 서사 실 부착점 보정 · 같은 카메라 근접

구현 `af2c5cbe51305bd3f22692ef8459675e2c8e2310`. 이전 승인 구도와 같은 카메라에서 해당 근접 화면만 다시 저장했다.

- [4장 문 근접](stage4-03-gate-contact.webp): 문 상인방의 매듭에서 오른쪽 담장 처마로 부착. 지붕 위 허공으로 솟는 옛 끝점 제거.
- [3장 한옥 근접](stage3-03-hanok-contact.webp): 상인방에 가로 실을 붙이고 짧은 끝은 문 위 목재로 부착.

두 WebP 모두1MB 미만 lossless, 원본 PNG를 보존하며 디코딩 RGBA가 동일하다. 정확한 바이트/카메라/끝점은 manifest.json에 있다. 전체 구도/debug 재촬영이나 전투 검사는 반복하지 않았다.

출처는 `shared/runtime/story-act1-art.js`의 eave/village 서사 단서다.4장 결말의 춘례 대사와 다음5장의 실 추적에 필요하므로 단서를 삭제하지 않았다. 새 author의 storyThread 좌표만 image-first3·4장에 적용하며 해당 서사 카메라/춘례 지시가 같은 매듭을 가리킨다. 같은 revision의 기존 전투도 현재 저작 좌표를 읽으므로 전투를 재시작할 필요가 없다. 기존 실의 quiver 규칙/대사·진행 조건/전투·배치/지형은 유지한다.

필요한 build와 실제 Chromium 근접 각1뷰/pageerror0, 서사 cue 목표와 새 매듭 일치, 옛 image-first 저장 metadata의 좌표 fallback만 확인했다. 기존 경로·적·목표 검사나 전체 방어전은 반복하지 않았다. master/Pages 미배포, 부모 화면 재검수 대기다.
