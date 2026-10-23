# 본문 접힘 버그의 실제 브라우저 전후 캡처

부모의 명시 캡처 전달 요청에 따른 선별6장이다. 자동 로그/나머지 사진은 기존 `_local` 정책을 유지한다. 수정 전은 배포9ed5e01d/game.37e461ef6104b3e5.js, 수정 후는 원격 핵심 소스0b7cd2db와 build game.872345135ff221d0.js다. 최종 후보는1a0dbc8b79f8992c9cdcb63fd0c958af149c679b이며 같은 런타임/스타일과 생성물 entry를 포함한다. master/Pages 배포 증거가 아니다.

실제 로컬 Chromium의 Android UA/touch,360×780(원본720×1560과 같은 비율)/390×844/844×390 화면이다. 준비한19장 route-before 저장과 접근 좌표를 사용했으며 실제 상호작용/이전/다음/skip/Continue를 사용했다. App.frame을 끄지 않았고 실제 Scene.render를 원래 함수 그대로 실행하며 횟수를 확인했다. 수정 후92개 DOM 가시성/클리핑/클릭 검사와 정상90프레임 유지, 작은/큰 폰·가로·장문125% 글자 크기·모드 전환이 통과했다.

- before-route-1-android.jpg: 같은 route 원문이 DOM에 존재하지만 일시150px viewport에서 계산된 max-height0.00px가360×780 복원 후에도 남아 본문 rect가0px인 재현. 제목/구분선/버튼만 보인다. 숨김→표시에서도 같은 실패를 확인했다. 정확히 어떤 Android 이벤트가 최초 제한을 만들었는지는 미확인이다.
- after-route-1-android.jpg: 같은 준비/viewport 전환 후 본문 rect52.5px, inline 제한 없음.1/3 원문이 읽힌다.
- after-route-2-damheo.jpg / after-route-3-sodan.jpg: 실제 다음 버튼으로 돌아온 일반 대사와 승인 초상화.
- after-route-1-390.jpg / after-route-1-landscape.jpg:390×844/844×390의 같은 원문이다. 모드 전환 검사 bundle 내2/7이며 실제 route3행 이벤트의1/3 표기는 위 Android 전후 사진에 남겼다.

사용자 원본 Library libfile_fd218a7d259881918591893c579f5bde(1000047905.jpg,720×1560)는 지원 materialize가 download failed로 끝나 이 환경에서 실제 픽셀을 직접 읽지 못했다. 지원 읽기에서 메타데이터만 확인했으며 원본을 보았다고 주장하지 않는다. 위 전후 사진은 별도 실제 게임 재현이며 수동 합성/이미지 편집/원고 변경이 아니다. 실기기나 공개 사이트 검증으로 표현하지 않는다.

| 파일 | bytes | SHA256 |
| --- | ---: | --- |
| before-route-1-android.jpg | 21970 | ebbed0df31a29cd1d8604d22909df684024d0b35d06db0264ee5c0e6964a940d |
| after-route-1-android.jpg | 25675 | 1f0975801ca496be7fa3fe8c734ea00455cb9a589c986d0eff8056eb771a6a40 |
| after-route-2-damheo.jpg | 30050 | 6629f462424f472c5cf5b9456dbb51ce5cc731512f14bcec72143dd5ca4a2003 |
| after-route-3-sodan.jpg | 29643 | 77def17d4099c87808fe883b9ebf729287930454e104eacdd30058c96feeb494 |
| after-route-1-390.jpg | 27386 | c8226a3bdf1f09d7e9eb50d4331d42b191d5d046baed8e2a32b3c8a027e9b8e2 |
| after-route-1-landscape.jpg | 33666 | da356d41d52adfdfc87255a12927cfc9436b894e15e28227888fc43c330b1e3b |

최종 상태: 정상 프레임92개 감사, 실제 새19장 진입과 route 첫행, pause/키보드/모달 차단, safe-area 세로34px/가로44px가 통과했다. App.frame을 중지하지 않았고 감사 중1422회 정상 Scene.render 호출과 별도90프레임 유지가 확인됐다. 빌드/web-split 및 공개35개/759파일 보존도 통과했다. 자세한 DOM 소유·높이 수축 계약, Library 원본 다운로드 실패와 기존11장 구 원고 검사 실패의 기준9ed 재현은 [기술 기록](../README.md)에 구분했다.
