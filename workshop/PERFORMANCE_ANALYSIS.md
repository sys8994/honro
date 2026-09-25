# HONRO Map Workshop v2 — Performance Analysis

## 결론

현재 HONRO Stage 1의 줌아웃 렉은 **지형 polygon node 수만의 문제가 아니다.**
동일한 RC20 Stage 1을 Chromium headless에서 `scene.scale = 0.5` 조건으로 비교 프로파일링했을 때, 가장 큰 비용은 **vector background + landmark drawing**이었다.

## 상대 프로파일

| 조건 | 약 1초간 render 횟수 |
|---|---:|
| RC20 baseline | ~9 |
| landmark drawing OFF | ~16 |
| background drawing OFF | ~20 |
| terrain drawing OFF | ~10 |
| background + landmark OFF | ~54 |
| background + landmark + surfaceZones OFF | ~61 |

이 수치는 사용자 기기의 실제 FPS가 아니라, 동일 headless 환경에서 병목을 분리하기 위한 상대 비교값이다.

## 해석

- Terrain drawing만 제거해도 변화가 작다: `~9 → ~10`
- Landmark만 제거하면 약 1.8× 개선
- Background만 제거하면 약 2.2× 개선
- Background + landmark를 함께 제거하면 약 6× 개선

따라서 현재 게임의 줌아웃 렉은 **고해상도 terrain node보다 넓은 화면에 들어오는 다수의 복잡한 vector landmark와 매 프레임 재구성되는 background가 주원인**이다.

줌아웃에서 특히 심한 이유는 화면 안에 들어오는 landmark 수가 급격히 증가하고, 커다란 나무/절벽 같은 복잡한 벡터를 전부 다시 그리기 때문이다.

## Workshop v2 대응

### 1. Node optimizer

Terrain과 Element 모두 Ramer–Douglas–Peucker 계열의 threshold `ε`를 사용할 수 있다.

- `ε = 0`: 원본 유지
- 작은 ε: 거의 같은 실루엣, 일부 node 제거
- 큰 ε: 더 공격적인 단순화

Terrain은 authored control point를 보존하고 **파생/export node만 줄이는 비파괴 방식**을 기본으로 한다.
Element는 `Simplify` 실행 시 polygon 자체를 단순화하며 Undo 가능하다.

### 2. Adaptive LOD

줌아웃 시 editor canvas에서는 임시 draw geometry를 자동 단순화한다. authored/export geometry는 바뀌지 않는다.

### 3. Culling / render scope

- 화면 밖 element는 draw하지 않는다.
- 현재 탭만 render한다.
- asset preview를 매 frame 다시 그리지 않는다.
- terrain derived point는 cache한다.

## 본게임 렌더러에 권장되는 다음 최적화

Workshop의 node optimizer만으로 Stage 1 렉이 완전히 해결된다고 보면 안 된다. 본게임에는 다음이 더 중요하다.

1. far/mid background를 offscreen canvas로 pre-render/cache
2. 복잡한 giant pine / cliff landmark를 sprite cache 또는 Path2D cache
3. viewport culling + zoom-based LOD
4. 움직이지 않는 장식 layer를 dirty flag가 바뀔 때만 redraw
5. surface material decoration density를 zoom에 따라 줄이기

즉 **authoring node optimization은 필요하지만, 현재 게임 렉의 1차 병목은 static vector scenery를 매 frame 다시 그리는 구조**다.
