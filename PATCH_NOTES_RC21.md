# HONRO ACT1 RC21 — Renderer Performance Pass

## 원인
RC20의 렉은 고밀도 terrain node 자체가 주원인이 아니었다. Stage 1의 동기 render 프로파일에서 terrain geometry는 약 0.3 ms/frame인 반면 background가 약 3 ms, static landmark가 2~3 ms, material surface zone이 약 1 ms를 사용했다. 이 정적 벡터 그래픽을 매 프레임 다시 rasterize하고 있어 줌아웃할수록 브라우저 paint/compositor 비용이 크게 증가했다.

## 수정
- `renderer.js`에 **static world raster cache** 추가
  - terrain + material zones + static landmarks를 sceneVersion별로 한 번 rasterize
  - 파괴 가능한 지형/ice wall 등으로 sceneVersion이 바뀌면 자동 재생성
  - 고배율(>1.05)은 선명도를 위해 기존 live vector rendering 유지
- **background cache** 추가
  - 카메라 x를 120-world-unit bucket으로 quantize
  - bucket 사이에서는 cached background를 작은 parallax shift로 재사용
  - background cache는 DPR 최대 1.15로 제한해 메모리 비용 절감
- **zoom-aware world LOD**
  - 줌아웃 시 cache raster scale을 낮추고, 일반 배율에서는 더 높은 raster scale 사용
  - 데스크톱 static world cache pixel budget 약 6M, 모바일 약 3M
- RC20 map geometry / natural scatter / gameplay / balance 데이터는 변경하지 않음

## 실측 — 1365×768, headless Chromium, 20% zoom-out, 2초

| Stage | RC20 render/s | RC21 render/s | JS render avg RC20 → RC21 |
|---|---:|---:|---:|
| 1 | 20.5 | **60.5** | 11.84 → **3.50 ms** |
| 2 | 45.0 | **60.5** | 4.98 → **2.08 ms** |
| 3 | 50.5 | **61.0** | 4.30 → **2.40 ms** |
| 4 | 60.0 | **60.5** | 3.58 → **2.57 ms** |

Stage 1은 약 **20.5 → 60.5 render/s (2.95×)**, 평균 JS render cost는 **11.84 → 3.50 ms (-70.4%)**로 개선됐다. Stage 2도 45 → 60.5 render/s로 올라왔다.

## 메모리
Stage 1 기준 static world raster cache는 약 **24.0 MB**, background cache는 약 **3.6 MB**다. 2초 테스트에서 JS heap 증가는 관찰되지 않았고 GC 후 오히려 감소했다. 즉 이전의 렉은 JS heap leak이 아니라 반복 vector rasterization 비용이었다.

## 무효화 검증
Stage 1에서 파괴 가능한 terrain을 실제로 파괴한 뒤 `sceneVersion`이 증가하고 static world cache build count가 **1 → 2**로 증가하는 것을 확인했다. 파괴된 오브젝트가 캐시에 남는 문제는 없다.

## 회귀 검증
- TypeScript typecheck PASS
- RC20 map audit 13/13 PASS
- RC20 browser acceptance 10/10 PASS
- impact / fall / knockback checks 29 PASS
- audio audit 19 PASS
- RC13 balance / charge / party pacing 유지
- RC21 performance gate: Stage 1~4 모두 >=50 render/s PASS

## 시각 변화
같은 Stage 1 카메라로 RC20/RC21 screenshot을 비교하면 10/255 threshold 기준 약 **1.56% pixels**만 달라졌다. 차이는 주로 raster cache sampling이며 맵 구성/재질/요소 배치는 동일하다.
