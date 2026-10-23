# 부모 미술 검수용 선별 캡처 — 피드백 반영본

사용자의2026-10-23 명시 전달 요청에 따라 자동 보고서는 기존 `_local` 정책을 유지하고 선별5장만 review 브랜치에 보존한다. 앞선 Library 공식 prepared upload는 도구 목록 조회 단계에서 `hosted apps tools/list request failed: network`로 실패했다. 업로드는 시작되지 않았고 Library 파일 ID는 없다.

최종 기술 후보 `2f20e3ca1e26dac411bfbf9ed4317cd62a6cbbaa`, game entry `game.983703593aa8a91d.js`. 최신 SFX master71cb1fa9의 후손이다. 부모가 본 이전4장과 같은 준비 저장/접근 위치·화면비로 다시 캡처했다. 실제 로컬 Chromium390×844 touch/844×390 렌더이며 prior-clear 저장과 마커 접근 좌표를 도구로 준비했다. 가족 대화/소단 단독/무명사 세로는 실제 상호작용과 대화 버튼을 거쳤다. 가로 두 장은 같은 old-soul-mid Continue 저장에서 기존 wrong-door 행을 도구로 선택했으며 자동 카메라와 수동 카메라를 아래처럼 명확히 구분한다. 실기기·주관적 청취·정상 캠페인 완주·공개 배포 또는 미술 합격의 증거가 아니다.

- `honro19-mobile-family-dialogue.jpg`: 첫 가족 대화. 다음 목표 화살표/화면 밖 안내를 숨겨 발화 인물과 겹치지 않는다.
- `honro19-mobile-sodan-farewell.jpg`: route 완료 후 담허도NPC, 소단만 조작한다. 현재 가족이 보이므로 뒤의 병렬 가족 화면 밖 안내도 숨겼다. 기존 상호작용 버튼/물리 마커는 유지한다.
- `honro19-mobile-mumyeongsa-spirits.jpg`: 선두의 열린 길 쪽 손과 반대 흐름은 유지한다. 보조 둘만 -25°/+28° 기울기·상이한 간격/높이/명도로 분리했다. 부모 SVG 경로/색과 일반 가족 혼은 유지한다.
- `honro19-landscape-spirits-auto-camera.jpg`: `19.beats.old-soul:wrong-door` 실제 자동 대사 프레이밍. scene.storyFrame을 유지하고 기존 카메라가 수렴한 상태다. 자동 구도의 실제 축소 정도도 그대로 남겼다.
- `honro19-landscape-spirits-prepared-camera.jpg`: 같은 행의 상세 확인용. 도구로 scene.storyFrame을 해제하고 기존과 같은 manual camera(x7368,y7264.310344827586,scale.78)를 준비했다. 자동 카메라 증거가 아니다.

자동 카메라 실제 값: `{"x": 7340, "y": 7173.596059113301, "scale": 0.2775862068965517}`.

JPG를 재편집/재인코딩하지 않았으며 총 220130bytes다. 전체 UI를 남겼다.

| 파일 | bytes | SHA256 |
| --- | ---: | --- |
| honro19-mobile-family-dialogue.jpg | 52519 | 317eb5bcec725efb4b12d54eddaafb0cd58ffd23391d2ede299aabb9e0f1eb29 |
| honro19-mobile-sodan-farewell.jpg | 36357 | 064750d2fe90acb02738fd847ad6fb735c6bd460e367781b484b042ed46456e8 |
| honro19-mobile-mumyeongsa-spirits.jpg | 45778 | 86be6f56f9992aab0c53b792faa4844d6f3a18f0d985fe286d7d4a7318bbf1db |
| honro19-landscape-spirits-prepared-camera.jpg | 40866 | 0d78a4df5002ec201ea526e548c47d40e89fa01bc8f43af3c8c8d170aefca04a |
| honro19-landscape-spirits-auto-camera.jpg | 44610 | b5c5593d1c56be63a54f829ca9b1f98a7436ebcb6b5fc3dd9a12034d5e95f3b9 |

최종 소스의 관련 native/실제 Chromium 검사에서8개 중간·완료 Continue, 구 저장, 반복/이전/skip,19장 SkillAudioPlayer 충전·발사 시작0,20장4명·실제 충전/발사음·BGM 복구가 통과했다. 11–20 지형/목표 데이터·부모 SVG·오디오/음원 원본·공개34개와71cb/cf2 그래프754파일을 보존했다. 자동 로그와 나머지 캡처는 `_local/reports/act2-time-farewell-20261023/`에 있다. master/Pages 반영과 미술 판정은 부모 담당이다.

## 자동 가로 구도 선행 전달

부모 요청에 따라 자동 가로 사진만 먼저 갱신했다. `2f20e3ca` 기반 old-soul 가로 카메라 작업 트리의 build `game.03f110585f34a069.js`에서 준비한 old-soul-mid Continue와 실제 이전/다음 버튼으로 wrong-door 행에 도달해 캡처했다. 수동 카메라는 사용하지 않았다. 소단·혼 셋·받침·열린 길 일부가 대사창 위에 함께 보인다. 세로3장과 수동 가로1장은 이전 후보의 승인 대기 사진 그대로다. 종료/skip 복귀 검사는 별도 진행 중이며 이 사진 갱신을 최종 기술 후보 완료로 표시하지 않는다.

갱신 JPG: 39872 bytes / SHA256 `cdbd569720577e43d32c3b4995136fd6aab3d8aa50ab93ce8946cc9e1f327bf5`. 위 최초 전달 표의 자동 가로 파일 hash는 이 값으로 대체한다.
