# 일반 서술의 별도 패널

기존 story.js의 narration-inline/narration-scene만 스타일링했다. 인물색 세로 레일 대신1px 둘레·짧은 가로 장식·넉넉한 여백과 따뜻한 종이색 글자를 사용한다. 대사·화자·초상화·읽기 동작과 kind=document의 스타일/기록 미션은 바꾸지 않았다. 버튼 행은 기존처럼 투명하다.

`tools/testing/narration-panel-browser.py`의 실제 빌드390×844/844×390 통과: 기존 canonical 서술, 무초상·이전/다음/넘기기,2px 가로 장식/1px 테두리/본문색, 긴 본문 fixture의 시작/중간/끝 body-only scroll과 버튼 hit-test. 실제 화면도 확인했다. 긴 문장은 기존 문자열을 검사에서만 반복했으며 생산 원고를 쓰지 않았다.

사진/자동 결과는 Git 제외 `_local/reports/narration-panel-20261023/`의 `390-narration.jpg`, `844-narration.jpg`, `browser.json`, `build.txt`다. 최종 후보에서 빌드/공개 그래프를 통합 확인한다. 실기기나 공개 검증은 아니다.
