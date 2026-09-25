# HONRO RC17 — Gap Analysis / 작업 지침

## 사용자의 의도

Stage 1·2를 단순 좌표 보정이 아니라 **플레이 공간과 장면 구성이 달라지는 수준으로 재설계**한다.

- 고해상도 polygon/terrain node 수는 유지한다. 물리 문제가 나도 지형을 다시 단순화하지 않는다.
- Stage 1은 빽빽한 고목 송림의 실제 산길처럼, 개울·흙길·이끼·노출암·능선이 구간별로 읽혀야 한다.
- Stage 2는 단순한 V/cosine 곡선이 아니라, **높은 설오 절벽 → 여러 암반 턱 하강 → basin → 반대편 다단 상승 → high shelf**라는 공간 단계가 보여야 한다.
- 다양한 terrain은 단순 renderer capability가 아니라 실제 Stage 1·2에 존재해야 한다.
- 배경 장식과 실제 collision terrain은 z-order와 명암/채도에서 명확히 구분한다.
- 나무·암벽·장식은 임의 좌표가 아니라 실제 support surface에 붙어 있어야 한다.

## RC16에서 실제로 했던 것

- Stage 2 main ground 좌표와 surface zone을 일부 변경했다.
- Stage 1은 surface material/z-order 변경 비중이 컸고 macro topology는 RC15와 매우 비슷했다.
- back landmark를 terrain 뒤로 옮겼지만 배경과 플레이 지형의 큰 구도는 거의 동일했다.
- Stage 2도 결국 한 개의 연속 V형 ground 위에 보조 platform을 얹은 구조였다.

## Gap

1. **Source diff != visual/compositional diff**
   - 값은 달랐지만 플레이어가 보는 장면과 이동 순서는 거의 같았다.
2. **Verticality가 topology가 아니라 decoration에 가까웠음**
   - Stage 2가 실제 다층 공간이 아니라 한 번 내려갔다 올라오는 연속 곡선이었다.
3. **Terrain variety가 약한 overlay처럼 보였음**
   - 재질 종류는 있었지만 구간의 성격을 바꾸는 수준으로 읽히지 않았다.
4. **Decoration/interactive layer distinction 부족**
   - 거대한 나무와 cliff decor가 terrain보다 전면에 나와 물리 지형과 혼동됐다.
5. **논리적 placement를 눈으로 검증하지 않음**
   - support 기반 여부를 release test로 고정하지 않았다.

## RC17 재발방지 지침

1. **Topology first** — micro noise 전에 Stage를 4~6개의 공간 phase로 설계한다.
2. **고해상도 유지** — Stage 1/2 main ground는 RC13 baseline 대비 5배 이상 node를 유지한다.
3. **Main route + optional vertical route를 각각 실제 physics로 검증**한다.
4. **Stage 2는 최소 2개 ground mass + 4단 하강 + 5단 상승**을 가져야 한다.
5. `moss / shallow-water / mud-track / exposed-rock / scree`를 실제 surface zone으로 배치한다.
6. 모든 authored landmark는 `support`를 가져야 하며 support 범위 밖에 있으면 실패시킨다.
7. `back` scenery는 terrain 뒤 + 낮은 alpha/saturation, story/interaction landmark는 terrain 뒤가 아닌 별도 layer로 렌더한다.
8. 지형 단순화로 physics 문제를 회피하지 않는다. geometry를 유지한 상태에서 route/physics를 고친다.
9. 맵 수정 후 기존 충돌/밸런스/사운드 회귀를 다시 실행한다.
