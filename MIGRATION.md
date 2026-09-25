# RC21 / Workshop V2 → canonical v3

`migration/migrate-stages.mjs`는 RC21 world와 stage spec을 같은 엔진으로 실행해 초기 Battle의 작성 데이터를 추출합니다. `npm run migrate`로 재생성합니다. **빌드 때 자동 실행하지 않습니다.** 이미 수정한 campaign.json 위에 실행하면 원본 RC21을 다시 만들기 때문입니다.

원본은 `migration/legacy/rc21-world.js`, `rc21-stage-maps.js`에 동결했습니다. 실제 게임·Workshop 번들에는 포함하지 않습니다. 일부 과거 맵 검사는 설계 필드 확인용으로만 읽습니다.

Stage 1~10의 103개 solid polygon을 정확한 vertices로 저장했습니다. Ground/ribbon/branch의 최종 다각형을 가져오며 노드 축소·정수화·새 보간을 하지 않습니다. 재질 points/surface/bottom, landmark, 유닛 속성, encounter, marker, anchor, route, 초기 임무 상태를 보존합니다.

`tests/migration.mjs`는 10개 Stage × 3개 난이도에서 원본과 새 Battle의 geometry/material/unit/event/marker/route/임무·성장 상태를 비교하고, 재생성 일치와 JSON 왕복도 검사합니다.

Workshop v1/v2 Project는 누락 배열·기본값을 한 번 채워 v3로 정규화합니다. 구 ravine/village는 실제 valley/gate로 연결합니다. Stage pack은 현재 라이브러리에 Stage를 추가합니다. 구 dimensions/grounds/ribbons/solids spec은 실제 MapEngine.compile 결과를 exact solid로 가져옵니다. 이전 Workshop이 이미 줄여 저장한 geometry의 상세도는 복원할 수 없습니다. 이번 Stage 1~10은 그 구 draft가 아니라 RC21 원본에서 이전했습니다.

현재 내보내기는 canonical v3만 사용합니다. 캠페인 진행 저장 revision 20, XP·스킬·cleared·recruited·중단 Battle 보정은 유지합니다. 가져온 맵은 진행 저장을 차단하고 나갈 때 원래 프로필로 복귀합니다.
