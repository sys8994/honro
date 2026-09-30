# 맵 장식·배경 제작 기준

## 범위와 시각 목표

활성 `shared/data/campaign.json`의 Stage 1–10 장식과 `shared/runtime/art-dark.js`의 배경 레이어를 대상으로 한다. 지형 충돌, 발판, 표면 재질, 상호작용, 저장 상태는 미술 작업의 기준에서 제외한다. 작은 전장 화면에서 읽히는 실루엣과 어두운 재료감에 점을 쓴다.

- 산은 둥근 반복 곡선 대신 단층·암면이 보이는 비대칭 능선으로 그린다. 원경은 저채도 청록·먹색, 근경은 더 어둡게 겹쳐 전투 지형과 구분한다.
- 건물은 긴 용마루, 낮고 깊은 처마, 기와선, 목재 기둥, 창호 분할, 낮은 돌 기단을 사용한다. 성문·창고·불탄 민가·산신당·누각·의식 제단을 같은 전각으로 돌려 그리지 않는다.
- 마을/상여 길목에는 풍화된 장승과 솟대를 작은 크기로 둔다. 웃는 표정이나 과장된 색·기와 곡선은 피한다. 실제 조형의 참고는 [국가유산포털의 한국 지붕 설명](https://heritage.go.kr/heri/html/HtmlPage.do?pageNo=3_1_7_0&pg=%2Fpalaces%2FpalacesRoof.jsp), [한국민족문화대백과의 장승](https://encykorea.aks.ac.kr/Article/E0048619) 및 [솟대](https://encykorea.aks.ac.kr/Article/E0030608)이다. 게임 그림은 시대 고증의 재현이 아니라 그 형태를 낮은 해상도에 맞춘 추상화다.
- 소나무는 짧은 삼각형 반복 대신 긴 가지와 한쪽으로 기운 수관으로 만든다. 거대 소나무의 기존 발판 가지는 높이와 방향을 보존한다.

## 제작 소스와 점 수 예산

`shared/runtime/map-art-polish.js`가 기존 `Scene.background`/`Scene.landmark`에 장식 그림만 추가하거나 교체한다. `shared/build.mjs`에서 Game·Stage View·Playtest에 같은 순서로 번들한다. Stage 1–2의 밝은 화강암 3종은 `tools/map-forge/polish.py`로 활성 프로젝트 라이브러리의 **visual**만 수정한다. 물리 `collision` 배열은 변경하지 않는다. 10장 `ritualDais`만 `back`에서 `prop`으로 옮겨 땅에 가려지던 제단을 보이게 한다.

변경 전 커밋 `b81d8cc`의 실제 Canvas 경로 점 수는 `tests/fixtures/map-art-baseline.json`에 고정한다. `tests/map-art-browser.py`가 Stage 1–10의 52개 장식/배경 표본에서 `moveTo`·`lineTo`·곡선 끝점·사각형/타원 대응 점을 계수해 **각 표본이 원본의 2배 이하**인지 검사한다. 현재 최고 배율은 장식 1.28배(화강암 25→32점), 배경 1.79배(5·6장 112→200점)이다. 점 수는 Canvas 경로 명령의 비교 지표이며, 픽셀·투명도·레이어 합성과 시각 품질을 대신하지 않는다.

## 눈으로 보는 검사

`npm.cmd run build` 후 `npm.cmd run test:map-art`를 실행한다. 전장 1~10의 실제 게임 이미지, 랜드마크 단독 그림, Workshop Stage View와 Playtest 10장 화면이 `_local/reports/map-art/`에 저장된다. `baseline-*`은 수정 전, `current-*`는 현재다. 같은 이름의 화면을 `_local/reports/map-art/index.html`에서 나란히 볼 수 있다. 작은 게임 크기에서 건물과 바위의 대비, 아군/적 가독성, 나무와 발판의 연결, 제단의 위치를 전후로 확인한다. 세 호스트에서 같은 배경/성문/당산나무를 별도 캔버스로 그린 픽셀도 일치시킨다.

배경은 기존 단일 정적 레이어 캐시를 사용하고 별도 매 프레임 효과를 만들지 않는다. 성능 회귀는 루트 `npm.cmd run verify`의 순차 성능 검사로 확인한다. 새로 만든 디자인의 심미적 판단은 자동 통과와 분리하여 위 이미지로 검토한다.
