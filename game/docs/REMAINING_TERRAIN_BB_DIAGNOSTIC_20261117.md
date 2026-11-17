# 미분리57좌표: 동일job baseline1회 및 candidate2회 후속

## 실행

[CI44169167305](https://github.com/sys8994/honro/actions/runs/44169167305) success. 진단HEAD `65a6224f7c38629657f51a950896ec812092563d`, branch `audit/remaining-terrain-bb-20261117`.

- baseline 원본: `7d238d20663c3ceffe430eb0304e01516ae625cf`, tree `e5c0ae95cc1db3b14b4b2a9e73d1d1134f50a4d7`.
- candidate 원본: `e8d8aa8865c832e831d6d221223356b440652e5f`, tree `9d80064a1500feebd90e774eaecc3b9a6f00692e`.
- 두 source worktree tracked diff0, lockfile 동일 확인. 기존 fcf63304 fixture 원문 SHA256 `38e08d9ce3d1f584a4fc29c7d0d616dfd9888d4bc51bb902059cf942480793b5` 고정, 각source에 그대로 복사.
- 미분리4뷰(4 portrait BR/TL,9 desktop TL,10 desktop BR)를 같은job에서 baseline1회(A3), candidate2회(B1/B2), 각각 별도 임시Chrome프로필로 실행. 총12PNG.
- 각source의 기존 캡처와 runtime/physics/camera/width/height/seed/time/DPR/UA 엄격동일. 저장접근0·오류0·렌더순수성 검사 유지. 두source사이도 runtime을 제외한 위관측값 동일 검증.
- 같은job의 Chrome전체버전은 `157.0.8103.50`.

### 환경 동등성의 경계

이번 job runner image는 ubuntu-24.04/**20261111.370.1**이다. 앞선A/A와최초A/B의 **20261111.127.1**과 다르다. 이번 A3/B1/B2는 같은job/실행환경이나 이전실행과의 차이는 runner환경변경과 분리할 수 없다. 기존캡처의UA는동일하지만 최초전체Chrome patch/binarySHA미실측 한계도유지한다. 아래37좌표의 이전↔현재차이를 같은환경비결정성으로 부르지 않는다.

## 좌표 및 전이미지 결과

|뷰|잔차좌표|A3와동일한candidate출력|B1/B2끼리변동|이전candidate값재현|해석|
|---|---:|---:|---:|---:|---|
|4 portrait BR|16|16|16(최대2)|16|같은job에서도candidate반복변동. A3도이전candidate값재현|
|10 desktop BR|4|4|4(최대1)|4|같은job에서도candidate반복변동. A3도이전candidate값재현|
|4 portrait TL|14|14|0|0|새A3/B1/B2 전이미지동일. 이전candidate차이는미재현, 환경차와미분리|
|9 desktop TL|23|23|0|0|새A3/B1/B2 전이미지동일. 이전candidate차이는미재현, 환경차와미분리|

특히4 portrait BR `(85,138)`:
- 이전 A0: `[74,79,87,247]`, 이전 B: `[74,81,88,247]`.
- 새 A3: `[74,81,88,247]`, 새 B1: `[74,79,87,247]`, 새 B2: `[74,81,88,247]`.
- 이번동일환경에서도 두candidate가달라졌고 각각기존양값을재현했다. 달외곽 위치는시각단서이며 구체원인이AA인지 다른합성인지확정하지않는다.

전이미지 비교:
-4 portrait BR A3↔B1:30,826px, 이중원래하부 y617..695의30,810px+상부16px. A3↔B2:하부30,810px만변경. B1↔B2:상부16px만변경.
-10 desktop BR A3↔B1:0px; A3↔B2 및B1↔B2:같은4px/max1.
-4 portrait TL,9 desktop TL:새 세이미지전부0px차이.

57좌표 모두 적어도한candidate출력이이번baseline과일치했고, 반복으로지속된source차이좌표는이번표본에서0이었다. **그러나37좌표의환경간차이원인은여전히미분리**이며 모든미세차이의원인을해결했다고표현하지않는다. 구체AA원인/모든기기불변/전체미술합격도아니다.

4장새전후3열원본해상도시트를직접열어하부단절이두candidate모두제거되고상부구조의큰회귀는표본에서미관측임을확인했다. 하부개선과미세잔차판정을분리한다. 기존낮은차이임계값을추가하거나테스트완화하지않았다.

## 증거

artifact14366388053,2,772,825B, ZIP SHA256 `7a321483a024d4bbbef8b0bcf13397328c5f50a26d3b6e97c97e58e157e61363`, 원격digest일치·CRC통과.28개파일(12PNG,12캡처JSON,1비교JSON,3환경텍스트)의path/bytes/SHA256 manifest보존. 57좌표의모든새RGBA를PIL rawPNG로독립대조해분석결과와일치확인했다. Artifact만료2027-02-15,영구보존아님.

로컬 `remaining-chrome-bb/artifact-14366388053/`, `stage4-repeat-sheet.png`, `evidence-manifest.json`. 원본비교JSON을동반문서로보존한다.

생산코드·미술·기존fixture/테스트·허용오차·master/Pages변경없음. 공개UI·실기기·게임플레이·성능·전체상태행렬검수로확대하지않는다.
