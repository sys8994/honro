# 1장 독립 그림 구간과 캐릭터 기준

이 문서는 기반 계약과 후속 통합 기록이다. a5af1c1 기반은 이전 과대 배율3.382187을 한 항목으로 보존해 동등성만 확인했다. 현재 후속 소스는 서로 다른 시작부·승인 중간·출구3개를 각1.23배로 결합한다. 전체 맵6000×3000과 캐릭터/물리 수치는 유지하며 지형 revision만4로 갱신한다. 반복/반전/타일 채우기와 캐릭터 확대 또는 맵 축소를 하지 않는다. 실제 화면과 접합 확인 결과는 아래 최종 화면 절과 검수 파일에 남긴다.

## H 실측

실제1장 설오의 `Scene.unitBody`를 Chromium canvas에8배로 그려 alpha>8의 상하 범위를 측정했다. 무차지/정지 포즈의 신체·장구이며 HP바/선택표시/그림자는 제외한다. **H=103.5world** (828 raster px/8), 충돌 높이는92world, 기존 표시용 계산 높이는106.61536world다. 캐릭터나 수치는 변경하지 않았다. 정상 배율.6에서 신체는약62.1CSS px다. 포즈/안티앨리어싱에 따른 작은 차이는 있으며 다른 동행의 실측을 주장하지 않는다.

부모 계획의 시작 기준을 H로 환산한다. 강제 일괄 배율이 아니다.

| 일반 요소 | H 기준 | world 기준 |
|---|---:|---:|
| 일반 돌 높이 | .2–.8H | 20.7–82.8 |
| 수풀 높이 | .3–1H | 31.05–103.5 |
| 보행 문 높이 | 1.3–1.6H | 134.55–165.6 |
| 길의 그림상 세로 띠 예시(40source px,1.24배) | .479H | 49.6 |

길의 그림상 띠 두께와 실제 수평 경로 길이/충돌 두께는 구분한다. 일반 건물은 문을 먼저 맞추고 창·처마·층수를 따라 배치한다. 이1장에는 건물이 없어 건물 실측을 수행한 것은 아니다. 거대 주술 고목/높은 절벽은 의도적 랜드마크로 별도 분류하며 일반 돌·수풀의 배율 근거로 사용하지 않는다.

활성1.23배에서 H는 source84.14634px,1774px 그림은2182.02world 폭이다. 세 고유 구간 사이에273.03world씩 겹쳐 총6000world를 채운다. 세 그림의 접촉선과 각 y는 별도로 저작한다.

## Section 계약

`stage1ImageFirst.sections`가 있으면 배열 순서로 합성한다. 각 그림은 독립적인 양수 uniform transform을 갖는다. 없으면 기존 `image/source/transform/fringe/brokenBoughMask`를 한 section으로 읽는다. 이전 저장/단일 이미지 호출도 유지한다.

```js
sections: [{
  id: 'forest-middle', image: 'stage1BalancedNear', tone: 'source',
  source: {width: 1774, height: 887},
  transform: {x: 1908.99, y: 1228.0566666666666, scale: 1.23},
  contacts: [{
    terrainId: 'middle-floor', baseMaterial: 'soil', oneWay: false,
    sourceLine: middleWalkLine, sourceBody: middleBodyPolygon
  }],
  exterior: {
    mode: 'fringe', collision: false, padding: 192,
    edges: {left: false, right: false, bottom: true},
    bottomStart: 805, bottomVariation: 12, bottomEnd: 885
  },
  damageMasks: [{terrainId: 'middle-branch', sourcePoints: branchMask}]
}]
```

`sourceLine/sourceBody/sourcePoints`는 `[x,y]` source pixel 배열이다. `sourceLine`은 실제 상부 접촉, `sourceBody`만 uniform transform되어 지형이 된다. terrainId는 section들 사이에 고유해야 한다. 그림은 지형 silhouette로 clip하지 않는다. 외곽은 collision:false이며 접촉 생성에 사용하지 않는다. 외곽 mode:none은 원래 alpha 그대로, fringe는 기존의 유한 경계 처리다. 이웃 내부 접합부는 left/right를 꺼 반복 외곽이 겹쳐 보이지 않게 한다. 접합 경로는 그림을 보고 별도로 함께 저작해야 하며 자동으로 선/발판을 이어 만들지 않는다.

`tone:'source'`는 보정 완료된 정적 근경을 .62로 다시 어둡게 만들지 않는다. 독립 원경 quietFar의 기존.68은 유지한다. 준비 요청은 해당 sections의 고유 이미지와 원경뿐이다. 캐시는 image+외곽/톤 설정+파괴 mask로 구별하며 transform은 재사용한다. LRU 제한은 활성구간 수×2(최소2/최대8),3구간이면6개다. 이는3개의 원본과 현재 파괴 상태를 보존하여 종전2개 캐시의 프레임별 축출을 막는다.

## 기반 확인

구문·build, 기존1구간 vs sections1항목의 근경 RGBA 완전 동일, collision geometry/anchors/초기 위치 동일을 확인했다. 근거는 `_local/reports/stage1-sections/`의 before-near.png/after-near.png, baseline.json/after.json 및 single-section.png다. 새 그림 결합·세 구간 접합/캐시 안정성·이동/실제 H 비율 교정 확인은 다음 통합 단계다. 기반만 master/Pages에 배포하지 않는다. 선택 기능 lazy loading 소스는 수정하지 않았다.

## 세 고유 구간 통합 소스

각1774×887 원본을1.23배(폭2182.02world)로 놓았다. x는0/1908.99/3817.98, 이웃 겹침은273.03world다. 첫 y1600을 기준으로 그림의 주 경로 접촉이 접합 중앙에서 일치하도록 각 y를 구했다. x2045.505/3954.495에서 충돌 소유 구간을 나눠 서로 다른 floor 몸체가 중첩하지 않게 했다. 이미지 접합은96world 폭에서 보색 alpha가중합을 사용한다. 따로 투명 레이어에 더한 뒤 기존 world tile에 합성하므로.5/.5를 source-over하여.75 opacity로 보이는 띠를 만들지 않는다. scratch는 최대1024×1024 한 장을 재사용하고 정적 world tile이 결과를 보관한다. 내부 좌우 fringe는 끈다.

H103.5 기준 source84.14634px가 사람 높이다. 길 띠40px 예시는49.2world=.475H다. 일반 통로 옆 돌/수풀은 원본에서20–70px/30–84px 정도의 작은 개별 형상을 기준으로 읽고, 큰 전경 암반과 고목은 의도적 큰 덩어리로 구분한다. 새 시작/출구는 부모 original-cleanup.py/original-balance.py의 수치와2px joint sampling을 그대로 사용하며 입력/출력만 CLI로 바꿨다. 각각1회 처리했고 최종 alpha가 원본과 비트 단위 동일하다. 승인 balanced는 재처리하지 않았다. 세 근경 모두 tone:source로.62를 적용하지 않는다.

Native 최소 확인은 원래8적/cap2·ID별 능력/이벤트 의미와 초기 지상/공중 접촉, 실제 이동으로 도달한 지점에서 분기한 일반 점프의 낮은 뿌리·고목 돌출부/높은 가지·돌/상부 둑·출구 바위, 주 경로/접합부/높은 우측 도착이다. 적을 생략한 geometry fixture이며 전체 전투 통과 주장이 아니다. 이전 revision3 전투만 재시작하고 성장/SP/장착/완료를 보존하는 사례도 확인했다. _local/reports/stage1-sections/check-three.json에 범위를 남겼다.


## 최종 화면과 경계 처리

정상1440×960(.6)의 시작/고목/두 접합, 전체(.24),390×844의 현재 모바일 최대(.1625)와 실제 pinch 최소(.05735294)를 실제 Game renderer로 확인했다. 시작은 원래 새 전투 그대로이며 다른 검수 위치는 Native 이동으로 이미 도달한 좌표를 사용한 카메라/비율 fixture다.8적을 화면에 유지했으나 전체 전투 진행을 검증한 것은 아니다.

정상 화면에서 드러난 원본 하단의 직사각형 단차는 outgoing 깊은 alpha 감쇠 끝을 incoming의 world 높이로 연결해 없앴다. 두 구간은 같은 world phase의 기존 넓은 감쇠를 사용한다. 원본 상단에서 잘린 수관 부분만 작은 둥근 source-space alpha contour로 처리했다. 별도 나무/무늬/모션을 추가하지 않고 보행면·가지·돌 상부는 자르지 않는다. 원본 PNG 및 외부 WebP 픽셀은 변경하지 않는다. 이 유한 경계 처리 역시 source별1회 캐시다.

같은 정적 카메라3프레임에서 picture4/filterPasses1/fringe3(limit6)/fringeBuilds3가 그대로이며 전투 데이터도 동일했다. 근경 캐시22,969,752bytes, 재사용 scratch3,842,048bytes다. 필터1회는 원경뿐이고3근경 모두 source tone이다. 요청은 quietFar와3개 근경뿐이며 다른 장소군을 로드하지 않는다. 생성 manifest의 active218/previous18 파일 존재, 다른59 chapter payload와 선택 optional module 계약 동일도 확인했다. 쉼터 공통 배율 소스15ec4bd(통합7887f1c)를 함께 빌드했으며 그 작업의 기존 검증을 반복하지 않았다.

[실제 화면과 범위](art-reviews/stage1-sections-20261019/README.md). 다른29장/보류2–4장 미술·Stage11 WIP·기예·전체verify는 실행/반영하지 않았다. 이1장의 비율 구현과 나머지 장/쉼터 개별 건물 비율의 후속 적용은 구분한다.
