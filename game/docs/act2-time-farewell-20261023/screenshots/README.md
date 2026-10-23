# 부모 미술 검수용 선별 캡처 — 피드백 반영본

사용자의2026-10-23 명시 전달 요청에 따라 자동 보고서는 기존 `_local` 정책을 유지하고 선별5장만 review 브랜치에 보존한다. 앞선 Library 공식 prepared upload는 도구 목록 조회 단계에서 `hosted apps tools/list request failed: network`로 실패했다. 업로드는 시작되지 않았고 Library 파일 ID는 없다.

최종 기술 후보 `9ed5e01d892e75b003b4009d41cb56e538784f9e`, game entry `game.37e461ef6104b3e5.js`. 최신 SFX master71cb1fa9의 후손이다. 부모 피드백의 자동 가로 카메라만 최종 빌드에서 갱신했다. 모바일3장과 수동 상세 가로1장은 부모가 확인한2f20 후보의 사진을 유지한다. 자동 가로는 같은 준비 저장과 화면비에서 실제 이전/다음 버튼으로 wrong-door 행에 도달했으며 수동 카메라를 사용하지 않았다. 실제 로컬 Chromium390×844 touch/844×390 렌더이며 prior-clear 저장과 마커 접근 좌표를 도구로 준비했다. 가족 대화/소단 단독/무명사 세로는 실제 상호작용과 대화 버튼을 거쳤다. 수동 상세 가로는 이전 전달의 old-soul-mid Continue에서 wrong-door 행과 카메라를 도구로 선택한 사진이며 자동 가로와 아래처럼 구분한다. 실기기·주관적 청취·정상 캠페인 완주·공개 배포 또는 미술 합격의 증거가 아니다.

- `honro19-mobile-family-dialogue.jpg`: 첫 가족 대화. 다음 목표 화살표/화면 밖 안내를 숨겨 발화 인물과 겹치지 않는다.
- `honro19-mobile-sodan-farewell.jpg`: route 완료 후 담허도NPC, 소단만 조작한다. 현재 가족이 보이므로 뒤의 병렬 가족 화면 밖 안내도 숨겼다. 기존 상호작용 버튼/물리 마커는 유지한다.
- `honro19-mobile-mumyeongsa-spirits.jpg`: 선두의 열린 길 쪽 손과 반대 흐름은 유지한다. 보조 둘만 -25°/+28° 기울기·상이한 간격/높이/명도로 분리했다. 부모 SVG 경로/색과 일반 가족 혼은 유지한다.
- `honro19-landscape-spirits-auto-camera.jpg`: `19.beats.old-soul:wrong-door` 실제 자동 대사 프레이밍. scene.storyFrame을 유지하고 기존 카메라가 수렴한 상태다. 이 장면만의 실제 표시 범위로 적당히 확대해 소단·혼 셋·받침·열린 길 일부를 대사창 위에 함께 담았다.
- `honro19-landscape-spirits-prepared-camera.jpg`: 같은 행의 상세 확인용. 도구로 scene.storyFrame을 해제하고 기존과 같은 manual camera(x7368,y7264.310344827586,scale.78)를 준비했다. 자동 카메라 증거가 아니다.

자동 카메라 실제 값: `{"x": 7373.7770951386065, "y": 7283.686926920975, "scale": 0.78}`.

JPG를 재편집/재인코딩하지 않았으며 총 215386bytes다. 전체 UI를 남겼다.

| 파일 | bytes | SHA256 |
| --- | ---: | --- |
| honro19-mobile-family-dialogue.jpg | 52519 | 317eb5bcec725efb4b12d54eddaafb0cd58ffd23391d2ede299aabb9e0f1eb29 |
| honro19-mobile-sodan-farewell.jpg | 36357 | 064750d2fe90acb02738fd847ad6fb735c6bd460e367781b484b042ed46456e8 |
| honro19-mobile-mumyeongsa-spirits.jpg | 45778 | 86be6f56f9992aab0c53b792faa4844d6f3a18f0d985fe286d7d4a7318bbf1db |
| honro19-landscape-spirits-prepared-camera.jpg | 40866 | 0d78a4df5002ec201ea526e548c47d40e89fa01bc8f43af3c8c8d170aefca04a |
| honro19-landscape-spirits-auto-camera.jpg | 39866 | 2c98c3d6f368194157156b1318c63fbc8795f70fdc8f181375f47d7631a2fea8 |

최종 소스의 관련 native/실제 Chromium 검사에서8개 중간·완료 Continue, 구 저장, 반복/이전/skip,19장 SkillAudioPlayer 충전·발사 시작0,20장4명·실제 충전/발사음·BGM 복구가 통과했다. 11–20 지형/목표 데이터·부모 SVG·오디오/음원 원본·공개34개와71cb/cf2 그래프754파일을 보존했다. 자동 로그와 나머지 캡처는 `_local/reports/act2-time-farewell-20261023/`에 있다. master/Pages 반영과 미술 판정은 부모 담당이다.

## 최종 가로 카메라 확인

가로 자동 대사/서술 장면에서 여섯 표시 범위가 헤더·미니맵·대사창을 피한 영역 안에 들어오는지 검사했다. 최대 줌은 .78이고 세로390×844는 기존 프레이밍과 정확 일치한다. 일반 종료와 skip 모두 뒤따르는 장 마무리 대화까지 닫은 뒤 준비된 원래 플레이어 카메라(x7210,y7092.758620689655,scale.94,manual=false)로 정확히 돌아왔다. 최종 소스의 관련 native/Chromium, build/web-split, 공개34개 및71cb/cf2의754파일 보존이 통과했다. 추가 기능·지형·원고·SFX는 수정하지 않았다. 최종 미술 판정/배포는 부모 담당이다.
