# 대사 초상화 약간 줌아웃 · 2026-10-22

기준 master `dd878c9e58213b2737f72b4ad4476b18464db83f` → 실행·빌드 소스 **`197a8e22ae8789eb8698870ce3d7472059dae0d4`**. `fix/dialogue-portrait-zoomout-20261022`에 보존하며 master/Pages는 부모 담당이다. manifest SHA-256 `154cb8873e6fe1caabbe44c9a1b71ccf20348d580cfab13abebd0d960492af96`.

`shared/runtime/portraits.js`의 imageCrop 한 함수만 수정했다. mount가 소유하는 `story-portrait-canvas`의 승인 이미지 표시 배율은 기존의 **88%**(crop 폭/높이÷0.88, 범위+13.64%)다. 상단 y0을 유지해 위 빈 공간을 늘리지 않고 어깨/가슴을 조금 더 보인다. 휘겸의 crop 폭1053.18이 원본1024보다 넓으므로 전체 원본을 가운데 놓고 양쪽 약14.59 source px를 투명 여백으로 둔다. 갓 양끝/윗부분·목을 자르지 않는다. 새 이미지나 몸 부분을 생성하지 않았다.

| 인물 | 이전 crop 높이 | 이후 crop 높이 |
|---|---:|---:|
| 설오 |651.48|740.32|
| 담허 |578.04|656.86|
| 휘겸 |1019.48|1158.50|
| 소단 |687.98|781.80|

원본은 모두1024×1536으로 실제 상반신이 더 남아 있다. 승인 PNG·부모 clean 설오·배포 WebP·manifest metadata·HUD·NPC/error vector crop·CSS/대사창/원고/기예/게임플레이·18장 미술은 그대로다. 기존 cropFor/API·cache key/소유권·request/decode/timeout 경로도 바꾸지 않았다. [보존 검사](evidence/preservation.json).

## 집중3회와 최종 종합

1.390×844 네 인물 전후 사진을 직접 열어 어깨/가슴 증가, 얼굴/수염/흉터·머리·갓 안전영역과 가독성을 확인했다. 휘겸은 넓은 갓 때문에 얼굴이 상대적으로 작다는 기존 제약을 유지한다.
2.844×390 가로의 네 인물도 직접 열어 같은 crop·목/의상·본문·버튼 공간을 확인했다. 대사창/초상 컨테이너/본문 rect는 전후 동일(검사 허용오차1.1px)이다. 모든8 dialogue canvas 픽셀은 바뀌고 HUD4개/주민 vector 픽셀은 정확히 같았다.
3.기존 생산 문구의 긴 대사35배 fixture·실제 scene 주민·초상 없는 새 주민을 양쪽 화면에서 열고 다음/이전/넘기기를 touch tap했다. 스크롤 끝 글자와 고정 버튼에 겹침이 없다. 사진도 직접 열었다.4요청/4decode를 유지한다. 별도 ready/abort/8초timeout 정착 후 동일120회 추가 clearRect/drawImage는 모두0이며 크기 변경 때만1회다.

최종: 커밋197a8e22의 공통 Game/Workshop/직접 Playtest build·syntax와 source/artifact 보존을 확인했다. 같은 UI 검사를 커밋 후20항목으로 마무리했고 오류0, 앞선8 portrait canvas와 픽셀 동일이다. [전](evidence/before.json) · [집중](evidence/focused.json) · [최종](evidence/final.json) · [캐시/timeout/120회](evidence/repaint.json) · [build](evidence/build.txt). 집중/repaint의 raw HEAD는dd878c9e+최종 source/build 작업 트리이고, 최종 UI의 raw HEAD는197a8e22다. 최종 manifest/source hash로 같은 실행물을 확인했으며 옛 HEAD를 고쳐 쓰지 않았다. master 공개 파일354개를 그대로 남겼다.

## 실제 대사창 비교 사진

좌: 전, 우: 후. 실제 screenshot을 리사이즈 없이 배열한 검수 자료이며 원화를 수정한 파일이 아니다. 생산 대사 문구를 fixture에서 사용했고 원고 변경은 없다.

| 인물 |390×844 모바일|844×390 가로|
|---|---|---|
|설오|[비교](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/dialogue-portrait-zoomout-20261022/evidence/mobile-seoro.jpg)|[비교](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/dialogue-portrait-zoomout-20261022/evidence/landscape-seoro.jpg)|
|담허|[비교](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/dialogue-portrait-zoomout-20261022/evidence/mobile-damheo.jpg)|[비교](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/dialogue-portrait-zoomout-20261022/evidence/landscape-damheo.jpg)|
|휘겸|[비교](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/dialogue-portrait-zoomout-20261022/evidence/mobile-hwigyeom.jpg)|[비교](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/dialogue-portrait-zoomout-20261022/evidence/landscape-hwigyeom.jpg)|
|소단|[비교](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/dialogue-portrait-zoomout-20261022/evidence/mobile-sodan.jpg)|[비교](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/dialogue-portrait-zoomout-20261022/evidence/landscape-sodan.jpg)|

[긴 대사 스크롤 끝](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/dialogue-portrait-zoomout-20261022/evidence/special-설오.jpg) · [주민 vector](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/dialogue-portrait-zoomout-20261022/evidence/special-주민.jpg) · [text-only 스크롤 끝](<evidence/special-새 주민.jpg>).

Chromium headless의 touch/viewport 모사, 음악 off. 물리 Android/Safari·전체 캠페인·성능 개선·18장 수정 검사는 하지 않았다. 이미지 재생성/편집·원격 차단·권한 거부는 없다. 새 충돌 경계는 portraits.js imageCrop 한 곳이며 단계/원고/다른 세션 코드를 가져오지 않았다.
