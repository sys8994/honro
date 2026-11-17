# 지형 Chrome 잔차162좌표의 동일 baseline A/A 진단

## 실행과 동등성

[CI44167729302](https://github.com/sys8994/honro/actions/runs/44167729302) 두 job success. 진단HEAD `632cf090976b6d8ac2e6f06f1eb393423006217b`, branch `audit/remaining-terrain-aa-20261117`.

생산 원본은 `7d238d20663c3ceffe430eb0304e01516ae625cf`, 실제 tree `e5c0ae95cc1db3b14b4b2a9e73d1d1134f50a4d7`. 원본 worktree의 tracked diff0 확인. fixture는 이전 `fcf63304e53705cbdc50a7a7a9c4923803e5c3fa`의 파일을 그대로 복사하고 SHA256 `38e08d9ce3d1f584a4fc29c7d0d616dfd9888d4bc51bb902059cf942480793b5` 고정 검사했다. 이전에 잔차가 관측된12뷰만 동일 baseline HTML로 각각 독립 임시Chrome 프로필2회, 총24캡처했다. 기존 생산코드/fixture/테스트/허용오차는 수정하지 않았다.

모든 새 캡처의 runtime SHA256, physics SHA256, camera, stage/view, width/height, seed3910, time2, DPR1, userAgent는 이전 baseline과 엄격 동일. 저장접근0·오류0·렌더순수성 검사를 그대로 유지했다. userAgent는 `HeadlessChrome/157.0.0.0`; 새 실행의 전체버전은 두 job 모두 `Google Chrome 157.0.8103.50`. 이전 로그와 새 job의 runner image는 ubuntu-24.04/20261111.127.1로 동일하다. 이전 실행은 Chrome전체 patch버전 및 binary SHA를 실측하지 않았으므로 그 수준의 동일성을 보증하지 않는다. 서로 다른 runner의 동일 하드웨어도 보증하지 않는다.

## 좌표별 결과

기존 baseline A0, 기존 candidate B, 새 baseline A1/A2의 각RGBA를 모든162좌표에서 비교했다. Node canvas 디코딩 결과는 내려받은 PNG를 PIL로 읽은 rawRGBA와 독립적으로 전좌표 일치 확인했다.

|장/뷰|기존 잔차 px|새 A1/A2끼리 다른 좌표|기존 A0대비만 달라진 좌표|새 baseline에서 B값 정확 재현|계속 미분리|
|---|---:|---:|---:|---:|---:|
|2 desktop BR|2|2|0|2|0|
|2 portrait TL|5|5|0|5|0|
|4 portrait BR|16|0|0|0|16|
|4 portrait TL|14|0|0|0|14|
|5 portrait TL|33|33|0|33|0|
|6 desktop BR|16|0|16|16|0|
|6 portrait BR|12|12|0|12|0|
|6 portrait TL|8|8|0|8|0|
|8 portrait TL|23|23|0|23|0|
|9 desktop TL|23|0|0|0|23|
|9 portrait BR|6|6|0|6|0|
|10 desktop BR|4|0|0|0|4|
|합계|162|89|16|105|57|

- **89좌표:** 같은 새 job환경의 두 baseline 반복 사이에서도 픽셀값이 달라졌고, 적어도 한 출력은 기존 candidate값과 정확히 같았다. 해당 좌표의 차이는 후보 코드가 없어도 재현된다. AA가 구체 원인이라고 단정하지 않는다.
- **16좌표(6장 desktop BR):** 새 두 baseline끼리는 전이미지 픽셀동일이지만 이전 A0와 달라 기존 candidate값을 재현했다. 새 두 반복 내 비결정성으로 부르지 않고, 이전실행↔새실행의 원본 출력 변동으로 따로 기록한다.
- **57좌표:** 4장30,9장 desktop TL23,10장 desktop BR4. 두 새 baseline모두 기존 baseline값을 유지했다. 이 진단으로 비결정성이라고 설명할 수 없으며 계속 원인미분리다. 다른 좌표의 결과를 전이하거나 허용오차로 제거하지 않는다.

특히4장 portrait BR `(85,138)`의 최대2차이는 다음과 같다.

- A0/A1/A2: `[74,79,87,247]`
- B: `[74,81,88,247]`

이 좌표는 미해결이다. 이후 가능 진단은 후보도 같은환경에서 반복하고 해당 배경 레이어·합성/상태를 분리하는 것이다. 이번 범위에서는 실행하지 않았다.

새 A1/A2 전이미지 비교의 변경 픽셀 합계89는 위89좌표에 국한되었다. 6장 desktop BR의 새 A/A변경0을 원본대비변동0으로 오해하지 않는다. 모든 좌표의RGBA 및 metadata/hash는 동반 `remaining-terrain-aa-comparison.json`에 보존한다.

## 증거 및 한계

- artifact14365489113(early), 2735472B, ZIP SHA256 `71a207032fcbef4e28d219d02f34e287b5817c823effaafc51d7f347b100897a`.
- artifact14365149944(late), 3483180B, ZIP SHA256 `e04b3901509e7cbb713c3477d6a7de4387a884916241953c47c7c3c331975df8`.
- 두 ZIP digest·CRC 통과,54개 원본파일(24PNG,24캡처JSON,2비교JSON,4텍스트)의 path/bytes/SHA256을 동반 manifest에 보존했다. Actions 만료2027-02-15, 영구보존 주장 안 함.
- 로컬 `remaining-chrome-aa/artifact-ID/`, `combined-comparison.json`, `evidence-manifest.json`.
- 별도 algorithm-selfcheck는 이전 baseline파일을 두 입력으로 연결했을 때 변동0·162미분리로 나오는 진단분류 자체의 검사다. 새Chrome 증거로 사용하지 않았다.
- 이번 결과는 하부 수정의 전체 미술 합격·57좌표 해소·공개UI·플레이·실기기·성능·배포 검증이 아니다. 생산변경 및 master/Pages 반영 없음.
