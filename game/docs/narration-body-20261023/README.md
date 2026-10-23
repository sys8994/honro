# Shared story reader의 본문 높이 소유 계약

기준은 부모가 현재 배포로 확인한9ed5e01d892e75b003b4009d41cb56e538784f9e다. 사용자720×1560 사진의 제목/구분선/버튼만 남는 증상을 조사했다. 원고와 게임 규칙은 수정하지 않는다.

## 원인과 재현

기존 layoutReading은 현재 panel.bottom과 body.top으로 읽을 수 있는 높이를 계산한 뒤 --story-copy-limit를 같은 본문의 max-height로 썼다. 일시적으로 낮은 viewport 또는 숨김 상태에서0.00px를 기록하면 패널이 접히며, 정상 크기로 돌아온 다음 측정도 접힌 패널을 읽어0을 유지했다. source/DOM에는 route 원문이 그대로 있고 display:block,visibility:visible,opacity:1,scrollHeight53인데 rect.height만0이다. 이는 공통 높이 제한의 피드백이며 원고 누락이 아니다.

배포9ed 원본 빌드의 정상 App.frame/Scene.render에서 실제 route 상호작용으로3행 reader를 열고,150px viewport→360×780 복원을 준비해 같은 접힘을 재현했다. 숨김→표시에서도 동일하다. 평범한360×780/390×844/412×915/844×390와 OS 글자 크기 조정만으로 항상 발생한 것은 아니다. 사용자 Android에서 최초0 제한을 만든 정확한 이벤트는 미확인이다. 프레임 정지 자체가 직접 원인이라고 단정하지 않는다. 수정 전후를 같은 원문·준비 상태로 캡처했다.

수정 후 같은 복원에서 본문 rect52.5px이며 inline 높이 제한이 없다. 원문을 대체하거나 빈 텍스트 폴백을 넣지 않는다.

## DOM/레이아웃 검토

- 활성 App의 #dialogue-root 한 곳이 화면을 소유한다. draw는 모드별 innerHTML을 새로 만들며 이전 본문 node나 inline 상태를 재사용하지 않는다. 실제 전환에서 root/body/overlay가 각1개인지 검사했다.
- 데이터는 기존 EvidenceQuests.present와 speakerPresentation을 거쳐 같은 escaped text node로 표시한다. character/narration/guide/물리 각인 document의 경로와 승인 초상을 유지한다. 구 장부는 기존 정책대로 narration으로 표시되며, 이를 별도 신규 문서 UI로 바꾸지 않는다.
- 자기 자신을 제한하는 JS/ResizeObserver 측정과 inline max-height 기록을 제거했다. 패널의 minmax(0,1fr) 행과 copy의 min-height:0/align-self:stretch가 실제 가용 높이를 소유한다. 제목/장식/버튼은 줄어들지 않고 본문만 수축·스크롤한다. footer는 스크롤 본문의 바깥에서 상대 배치한다.
- hidden/display/visibility/opacity/inline style, grid/flex 최소·최대 높이, overflow 조상들의 교집합, 실제 text range와 유효 rect, z-index에 따른 elementFromPoint, 버튼 위치/클릭 대상, 중첩 모달/포커스, viewport/safe-area를 실제 DOM에서 확인했다. 승인된 초상화/서술 색·테두리·간격과 원고는 유지한다. 신규 !important 덮기는 없다.

## 검사와 재실행

`tools/testing/story-reader-dom-browser.py`는 기존 stage19-farewell native 검사로 생성되는 route-before 입력을 사용한다. 초기 배포 상태/접근 좌표는 준비하며 실제 route/이전/다음/skip/Continue를 사용한다. 이후 화면 전환용 bundle은 현재 원고의 행들을 그대로 조합하고 장문만 기존 문장을 반복한 검사 fixture다.

정상 App.frame을 중지하지 않고 원래 Scene.render를 그대로 호출하는 계수기로92개 검사 동안1422회 렌더를 확인했다. 별도로90개 실제 프레임 동안 route 첫 행이 유지되는지 기다렸다. 본문 문자열 존재와 별도로 양의 text-range/body rect, computed style, overflow clipping, hit target과 실제 캡처에서 읽힘을 검사했다.320×694,360×780,390×844,480×1040,844×390,780×360 및125% 글자 크기의 character/narration/guide/document 장문에서 처음/중간/끝 스크롤을 확인했다. 모드 전환·반복·이전/다음·skip·Continue가 통과했다.

`tools/testing/story-reader-state-browser.py`는 실제 pause 열기/닫기 뒤 narration, Escape/Tab/Shift+Tab과 배경 클릭 차단을 확인했다. CDP safe-area를 실제 적용해 세로 하단34px와 가로 좌우44px/하단21px 안의 본문·버튼을 확인했다. 새 App.launch(19)와 진입 대화 종료 후 route를 실제 사용한 첫1/3도 원문/양의 rect로 통과했다.

수정 전의0 높이 재현은 아래처럼 같은 검사 파일을 기준 worktree에 연결해 실행한다. 기준 worktree의 소스/브랜치는 변경하지 않는다.

```
HONRO_STORY_ROOT=/workspace/honro-act2-farewell HONRO_READER_BASELINE=1 python tools/testing/story-reader-dom-browser.py
```

수정 후의 기본 실행과 state 검사를 사용한다. 로그/전체 캡처는 `_local/reports/narration-body-20261023/`에 둔다. [부모가 열 수 있는 선별 전후 사진](https://github.com/sys8994/honro/tree/review/narration-body-20261023/game/docs/narration-body-20261023/screenshots)은 별도 review 브랜치에 보존한다.

기존 tests/dialogue-controls-audio.mjs는11장의 과거 대사(길을 비우겠소)를 찾다 TypeError로 중단한다. 이 실패는 수정 전9ed에서도 동일하게 재현했다. 현재 원고에 맞는 실제 UI 입력 회귀를 사용하고 무관한 검사/원고를 수리하지 않았다.

## 생성물·자료·한계

최종 entry는 `web/entries/game.872345135ff221d0.js`이고 활성413파일이다. manifest SHA256은 `384c8de917ccc2026db21442ad147286a0e342a682ae8129718824eb394d30a5`다. 최종 build/web-split와759파일 byte/hash 보존이 통과했다. 부모가 명시한9ed 배포 사실은2026-10-23 day 정밀도로만 등록하고 정확한 시각/Pages run을 만들지 않는다. game.37e461ef6104b3e5.js와 기존34개 발행 사실을 그대로 보존해 총35개며71cb/cf2 기준 그래프도 유지한다. 지형/목표/원고/오디오 원본은 그대로다.

사용자 원본 libfile_fd218a7d259881918591893c579f5bde(1000047905.jpg)는 지원 materialize가 download failed로 종료됐다. 지원 읽기는720×1560 메타데이터/이미지 참조를 돌려줬으나 이 환경에서 원본 픽셀은 직접 읽지 못했다. 접근을 우회하거나 원본을 보았다고 하지 않는다. 위 사진은 실제 로컬 Chromium 재현이며 실기기/공개 Pages 검증이 아니다. master/Pages 반영과 최종 사용자 확인은 부모가 맡는다.
