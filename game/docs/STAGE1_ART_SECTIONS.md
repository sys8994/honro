# 1장 독립 그림 구간과 캐릭터 기준

이 문서는 기반 계약이다. 현재 한 항목은 이전 과대 배율3.382187을 그대로 보존한 비교 기준이며 **비율 교정 완료가 아니다**. 전체 맵6000×3000, 캐릭터/물리/스폰/접촉/revision은 이 기반 단계에서 바꾸지 않는다. 이후 시작부·중간·출구의 서로 다른 원본을 H에 맞춰 결합한다. 반복/반전/타일 채우기와 캐릭터 확대 또는 맵 축소를 하지 않는다.

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

1.24배에서 H는 source83.46774px,1774px 그림은2199.76world 폭이다. 세 고유 구간을 약2200world씩 두고 이웃끼리 약300world를 겹치면 총6000world가 된다. 이는 배치 초안이며 구체 접촉/접합/H 비율을 보고 확정한다.

## Section 계약

`stage1ImageFirst.sections`가 있으면 배열 순서로 합성한다. 각 그림은 독립적인 양수 uniform transform을 갖는다. 없으면 기존 `image/source/transform/fringe/brokenBoughMask`를 한 section으로 읽는다. 이전 저장/단일 이미지 호출도 유지한다.

```js
sections: [{
  id: 'forest-middle', image: 'stage1BalancedNear', tone: 'source',
  source: {width: 1774, height: 887},
  transform: {x: 1900, y: 0, scale: 1.24}, // 후속 배치 예시, 현재 활성 배율 아님
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
