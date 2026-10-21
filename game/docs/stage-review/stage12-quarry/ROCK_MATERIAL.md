# 선택형 공통 암반 재질 시험 — 구현됨, 미술 불합격

**전체 통과 아님. master·Pages·13장 보류.** 소스/최종 캡처 SHA는 `4fde0124ace060d6e1abb86829cae0bf575bdea1`, 비교 기준은 `1c4bd9643370e13525123b392308d32a73476830`, 브랜치는 `stage/act2-ch12-common-full`이다. 공동 작업의 최신 master는 따로 진행 중이며 병합하지 않았다.

## 공통 코드와 canonical 선택 경로

- `shared/runtime/act2-spatial-art.js:rockMaterial()`은 `b.honroMap.space.terrainMaterials`에서 선택된 변형을 찾는다. 새 helper에는 장 번호·sq ID·절대 지형 좌표/장별 색면 목록이 없다. 선택하지 않으면 기존 facet/block painter를 그대로 실행한다.
- `prepareRockMasses()`는 live `surfaceEdges`의 실제 꼭짓점을 후보로 사용한다. 방향 변화×인접 구간 길이의 제곱근으로 큰 어깨를 우선하고 최소 간격을 둔다. 등간격 보충·무작위 분할·균열 노이즈는 없다. 설정 massCount는3–5, reliefScale은.5–1.5 범위다. roomIds는 연속 지면에서 필요한 기존 room 범위를 한정하며 끝점도 실제 보행 꼭짓점으로 맞춘다.
- 각 구간은 인물 h와 실제 solid의 수직 단면으로 규모를 정한다. 유한 암체는 실제 하단 윤곽까지 연결하고, 깊게 연장된 바닥은 제한된 깊이에서 감쇠한다. beddingSlope는 인접 구간이 공유하는 지질 층리 기준이다.
- **기존 공통 `ROCK_FORMS.wall/quarry/shoulder`의 내부 face/seam만** 선택한 구간 단면에 변형한다. 보행면의 꺾임 부호로 형태를 고른다. 이 정의 자체는 기준1c4bd964와 바이트 동일하다. 예전 `stage12-quarry-art.js` forms/exposures/rearFaces를 읽거나 옮기지 않았다. 공통 암반의 outline도 그리지 않는다.
- `terrain()`의 기존 `c.clip(q.shape)` 안에서 body/면/접촉 그림자/얕은 상면을 그린다. 새 외곽·밟는 턱·통로 충돌체가 없다. 해당 범위의 기존 room block은 중복하지 않는다. 기존 다른 지형/장에는 새 변형을 적용하지 않는다.
- canonical 원본은 `shared/data/campaign.json`의 stage12 `design.space.terrainMaterials`; 저작 재현은 `tools/map-forge/stage12-quarry-geometry.mjs`. `shared/map/compiler.js`의 기존 design→honroMap.space 복사를 그대로 거친다. 새 실행 호스트나 Workshop 전용 경로 없음.

현재 선택은 상부 `sq-north-quarry`와 길표 `quarry-F`가 있는 `sq-lower-ground`뿐이다. 각 설정은 `variant:'jointed-granite', massCount:3, reliefScale:1, beddingSlope:.12`. 지형 ID는 이 장의 canonical 선택 데이터에만 있다.

| 실제 구간 | 최종 앵커 x/y | 결과 |
| --- | --- | --- |
| 상부 | (5330,3760), (6740,3540), (7690,3310), (8652.5,4000) | 실제 어깨 기준3개 구간, 각 폭1410/950/962.5 |
| 길표 하부 | (5740,4870), (6320,4800), (6980,4800), (7290,5140) | 실제 꺾임 기준3개 구간, 각 폭580/660/310 |

설정과 알고리즘 연결은 구현됐지만, 이 수치가 중간 암반의 미술적 완성을 증명하지 않는다.

## 직접 본 교정과 실패

체크아웃 환경 스킬·SOP·MAP_ART_PIPELINE의 큰 형태→중간 면→일관된 빛/접지 기준을 적용했다. 최소3회 집중 검수와 별도 최종 검수를 수행했으며 자동 검사 수로 합격시키지 않았다. 원경·승인 `act1-scene:rooted-pine`·기존 공통 자산 정의는 그대로다.

1. **상부 일반/전체 구조, focus1**: 처음에는 실제 꺾임에서 면을 나눴지만 면 하단이 매달린 직사각 콘크리트 기둥처럼 보였다. 실패. 화면4컷을 직접 열고 실제 암체 하단 윤곽까지 연결하도록 교정했다.
2. **길표 일반/접지, focus2**: 하단은 연결됐지만 긴 세로 판이 반복됐다. 실패. 새 세로 절리만으로 자연스러운 암반을 만들 수 없음을 확인했다.
3. **모바일/중간 면, focus3**: 기존 공통 암반 내부 면을 단면에 변형했으나 좁은 구간이 늘어져 세로 얼룩처럼 읽혔다. 실패. 짧은 구간의 큰 각도만 고르던 점을 고치고 길이가 큰 어깨를 우선하여4개에서3개로 줄였다.
4. **일반·전체·모바일 재확인, focus4**: 세로 줄의 동일 반복은 줄고 큰 면 분리는 생겼다. 그러나 상부와 길표 아래는 여전히 평평한 바탕에 면을 덧칠한 인상이 강하다. 자연스러운3차원 중간 암반 덩어리로 충분히 읽히지 않는다. **여전히 불합격.**
5. **별도 최종, clean4fde0124**: 일반/최소 줌/세로 모바일/최대 줌/수레의8컷과 clean1c4bd964 동일 카메라 전후8쌍을 모두 직접 열었다. 상부 x5330–8652.5, 길표 하부 x5740–7290에서 면 변화는 있지만 덩어리·층리·접촉의 공간적 일관성이 목표에 미달한다. 모바일/최대 줌은 넓은 평면 인상이 특히 강하다. 상부 부유 암체 인상과 오른쪽 지형은 이번 재질만으로 해결되지 않는다. 미술 합격이나 배포 가능한 완료본으로 제출하지 않는다.

모든 화면은 Chromium 프로덕션 HTML 원본 캡처다. 이미지 생성/편집/합성 없음. 디버그 시작 장면을 정지시킨 화면 검사이며 실제 전투 완주 증거가 아니다. focus1–4는 기준1c4bd964 위 미커밋 교정 상태를 capture.json에 기록했다. 최종만 clean4fde0124의 정확한 소스다. 캡처 도구의 기존 renderSourceSha256 필드는 stage12 전용 신발 파일을 가리키므로, 이번 공통 renderer의 별도 SHA256은 ROCK_MATERIAL.json에 기록했다.

## 수레의 필요한 국소 교정

수레와 기능 좌표는 바꾸지 않았다. 가리던 **장식 잔석 `sq-art-carrier-rubble` 하나만** 기존 같은 `sq-north-quarry` 표면의 오른쪽으로 옮겼다. 기존 x7810에서 cart 지지 x7730+300=8030으로 이동, scale1.6→1.15, 실제 경사에 회전하고 reference.foot으로 접지했다. layer는 L1/back 그대로이며 전경으로 강제 이동하지 않았다. 저작 원본은 `tools/environment/stage12-quarry-art.mjs`다.

실제 프로덕션 브라우저에서 읽은 compiled landmark·`HonroGeometry.shapes()`·`surfaceEdges()`로 대조했다. 수레 바퀴 최소 gap은 여전히3.7535392828467593/0 world, 새 잔석 최소 gap은0이다. 수레 내부 기하 probe4301/823/772점에서 새 잔석과의 겹침은 각각0점이다. 이는 픽셀 검사가 아닌 기하 표본이다. 위쪽 실제 old-road 가림과 공통 수레 원형의 단순한 갈색 몸체/바퀴 표현은 남는다. 수레 미술까지 완전히 해결했다고 주장하지 않는다. 상세 좌표는 `checks/cart.json`과 `browser-props.json`.

## 제한된 검증과 다른 장 보존

`tests/stage12-rock-material.mjs` 통과:

- 다른29장 canonical 데이터와 Library 정의 동일. 12장 물리/스토리/행위자/이벤트/route/revision/환경 동일. 기존4개 승인 소나무 및 잔석 이외 모든 요소 동일. 재질 설정과 장식 잔석만 의도적으로 변경했다.
- 실제 보행면 꼭짓점 앵커, 각 재질3개 구간, solid 위쪽 표본의 비도색, 전투 상태/Canvas transform·alpha 순수성 확인.
- 같은 현재 데이터로 이전/새 공통 painter를 독립 VM에서 실행했다. 선택하지 않은 Act2의 다른9장(11,13–20) 지형·랜드마크 **1280×800 native static 픽셀이 전부 동일**하다. 각 SHA256은 checks.json에 있다. 이것을 다른 장의 모든 브라우저·모든 줌·전체 전투 검증으로 확대하지 않는다. Act1/Act3의 renderer와 데이터에는 변경이 없다.

`tests/stage12-author-preservation.mjs` author2회 동일성과 `npm run build`도 통과. 전체 이동·정상 전투·저장 검사는 반복하지 않았다. 기존 승리 증거는 보존하고 같은 revision 구전투의 장식/재질 스냅샷을 강제로 치환하지 않는다. 실제 코드/지형 경계가 바뀌지 않았으므로 새로운 정상 승리를 주장하지 않는다.

## 원본과 전달 상태

| 화면 | 이전1c4bd964 | 최종4fde0124 |
| --- | --- | --- |
| 상부 일반 | [before](evidence/rock-material/before/stage12-upper-normal.png) | [final](evidence/rock-material/final/stage12-upper-normal.png) |
| 길표 아래 일반 | [before](evidence/rock-material/before/stage12-sign-normal.png) | [final](evidence/rock-material/final/stage12-sign-normal.png) |
| 전체 | [before](evidence/rock-material/before/stage12-center-overview.png) | [final](evidence/rock-material/final/stage12-center-overview.png) |
| 모바일 | [before](evidence/rock-material/before/stage12-sign-mobile.png) | [final](evidence/rock-material/final/stage12-sign-mobile.png) |
| 수레·잔석 | [before](evidence/rock-material/before/stage12-carrier-cart.png) | [final](evidence/rock-material/final/stage12-carrier-cart.png) |
| 상부 최대 | [before](evidence/rock-material/before/stage12-upper-max.png) | [final](evidence/rock-material/final/stage12-upper-max.png) |

34개 원본 PNG와 실제 카메라/소스 상태, 탈락 후보, 로그·체크는 `evidence/rock-material/`, 해시는 [ROCK_MATERIAL.json](ROCK_MATERIAL.json)에 있다.

첫 source push는 GitHub HTTP503으로 실패했다. 원격이1c4bd964에 그대로인 것을 먼저 조회한 다음 재전송했고, 원격4fde0124를 확인했다. 거부를 우회하거나 불확실한 쓰기를 반복하지 않았다. master에 쓰거나 Pages/Actions 요청을 하지 않았다. **남은 차단은 기술 접근이 아니라 미술 품질 미충족이다.** 부모 검토 전 통합하지 않는다.
