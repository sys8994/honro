# 이미지 지형 이전 기준 조사

- 실제 지형 변경 시작: `2aa7a04e87aece99d850b07d59e96c4b68446c49`. Stage3 이미지 한옥에 맞춰 ferry-ground, cargo-step-1/2, warehouse-roof와 종속 좌표를 변경했다.
- 직전 기준: `4d99ec4a75ec47881221e86576863ed4076aee2f`. c0235043 또는 0964be9의 부모를 임의 선택하지 않았다.
- 앞선 c31eec13/db55d4ea/141ae606은 회화 표시 연결이다. 그 기간 campaign 변경 a25675f9는 1장 버려진 수레 장식/표식/이벤트 제거이며 terrain 변경이 아니다.
- 이어진 이미지 지형 작성: 3장 2aa7a04e, 4장 c1e134bd, 5장 1a85aa39, 6장 e4be8cd2, 7장 66e5f8e5, 8장 62dd32c4, 9장 91a26a52, 10장 08dbbfbb, 1장 ef9c121d, 2장 858d11b8. 이후 image-first 3/4장도 포함한다.
- 범위: 1–10장 지형·발판·경계·장식·랜드마크·물/재료·경로·앵커 및 종속 유닛/이벤트 좌표. 11–30장 후속 독립 변경과 전투/로딩/저장 기능은 보존한다.

## 재현 근거

`baseline/` 1·3장 그림은 기준 커밋의 프로젝트와 생산 Engine/Canvas를 사용한 native 캡처다. 그 커밋에 이미 연결된 stage21-painted-art, painted-pilots-art, stage1/2/3-location-art 렌더 덮어쓰기만 제외하여 남아 있던 기존 벡터 경로를 보였다. 지형·좌표·SVG는 편집하지 않았다. 따라서 당시 공개 회화 화면 자체의 스크린샷은 아니며, 이미지 지형 도입 직전 **실제 데이터와 기존 벡터 경로**의 재현이다. Native 캡처를 브라우저/게임 완주 검증으로 취급하지 않는다.

부모 기준 확인 전 master/Pages 추가 반영 금지. 이전 3280166은 현행 이미지 지형을 유지했으므로 올바른 지형 복구로 보지 않는다.

## 후보 검증

- `comparison.json`: 빌드 후 전체 1–10장 객체가 기준과 정확히 일치. 11–30장과 library는 직전 현재판에서 유지.
- `candidate-native/`: 기준과 같은 카메라의 1·3장 및 기존 장례창고/장식이 돌아온 8장. 이미지 원경 유지.
- `candidate-browser/`: 실제 Chromium 1·3·18·21장 1440×900/390×844, normal/max-out 16개 조합과 종굴 중앙/휴식 캡처. pageerror 0, 렌더 중 전투 상태 불변. 디버그 정지 시점이며 일반 전투 완주 검증은 아니다.
- `tests/pre-image-terrain-restoration.mjs` 통과: 독립 역사 fixture와 전체 장 데이터 비교, 1/3/8장 이전 지도 revision 폐기, 성장/장착/설정 보존 및 동일 revision 무변경.
- 기존 camera 검사는 초반 2개 통과 뒤 stage1 exit traversal 실패. 기준 SHA의 별도 worktree에서도 동일 실패 재현. 기존 campaign-map-revision 검사는 app-regression-helpers가 현재 App 생성 코드를 찾지 못해 중단. 이 기존 검사들을 수정하지 않았다.
- master/Pages 미반영. 공개 403 재시도 없음.

- `node tests/act1-collision-repair.mjs` 통과: 3장 접촉/이음새의 네 몸체 검사. 이는 전 장 전투 완료 검사가 아니다.
