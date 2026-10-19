# 2장 · 높은 절벽 위 엄호 실제 화면

구현 source commit `ee560ebd466060f3bfa0f60eadc138d45b74bda9`. 부모 제공 원화 `ffcbc54a151b2224945d70c2d55f50a83dc03491`을 byte 동일하게 uniform2.2배로 사용한다. 기존 낮은 바위 대신 높은 절벽의 실제 정상/선반/하단 길에 새 contact를 저작했다.

- [일반 자동 고지 시야](stage2-high-cliff-01-normal.webp)
- [같은 구도 실제 collision debug](stage2-high-cliff-02-same-camera-debug.webp)
- [줌아웃](stage2-high-cliff-03-zoomout.webp)

세 화면 모두 Chromium1440×960, 원본 PNG와 디코딩 RGBA가 완전히 같은 lossless WebP다. 일반/debug camera는 x1738/y935/scale0.4513813282525857로 동일하다. 줌아웃은 수동 기존 조작 경로로 x1839.2/y1035.1/scale0.40053497246642833이다. 발 디딤 선·상여 길을 실제 게임 renderer로 확인했다.

설오 시작 world1045/325.484, 상여 world660/1504.8로 낙차1179.316, 인물 h92의 약12.82배다. 원경은 기존 독립 공유 quietFar이며 그림 추가/늘이기/잘라 붙이기/새 모션은 없다.1장/3장이후/11장WIP는 변경하지 않는다.2장 map revision만3으로 갱신한다.

최소 확인: build1회; 실제 정상 접지; 온전한 실제 지형/적 배치에서 기본 화살의 하단 산개75/공중 박쥐72 실제 피해; 바로 옆 자연 선반 보행·하강; 적 제거 allied convoy fixture가 기존 goal3340에 도달; old2장 revision2 restart; 실제3뷰 pageerror0. 정적20frame 동안 sourcefilter2회/farcanvas1개 증가 없음, 요청2개뿐이다. 이는 전체 정상 전투 완주가 아니며 전체verify/스킬/다른 장 검사는 반복하지 않았다. 상세 수치와 원본 캡처 provenance는 manifest.json에 있다.

Library의 기존 네트워크 실패에 대해 부모가 승인한 Git evidence 전달 경로를 사용한다. master/Pages는 부모 실제 화면 확인 전 변경하지 않는다.
