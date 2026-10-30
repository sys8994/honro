# Stage 31 낮은 하구 원경 · 원본 래스터 연결

- 원본: 생성 파일 `exec-18e5edc1-71ae-4cc5-9ff2-80409c7dfcbe.png`를 `source.png`에 바이트 그대로 보존. 직접 원본/최종 이미지를 확인했다. 벡터 추적 결과를 래스터화한 이미지가 아니다.
- 실제 원본은 **2173×724**. 전달 설명의 2048×682와 달라 메타데이터로 정정했다. 기존 runtime 폭 2048 제한으로만 2048×682에 decode한다.
- `shared/assets/environment/campaign-far/act4-estuary.webp`: **q90 WebP**, resize/recolor/crop 없음. 원본 1,752,480 → 130,830 bytes(92.53% 절약). lossless 중간 후보 1,266,358 bytes 대비 89.67% 절약. RGB MAE 1.3491, p99 7, max 36, SSIM 0.974477. 원본과 픽셀 동일하다고 주장하지 않는다. 해시와 측정은 `optimization.json`, 후보/사전기준/시각판정은 `compression-*` 문서.
- 재현: 저장소 루트에서 `node art/act4-estuary-far-v1/compress.mjs`, `python art/act4-estuary-far-v1/compare.py` (Pillow/numpy/scipy). `_local/estuary-compression`에 후보와 비교 이미지를 생성하며 runtime을 자동 교체하지 않는다. 원본 SHA는 고정 보존한다.
- 지리 기준 입력: estuary-graybox `stage.json`, SHA-256 `8165dfbcee349625c63f4eda8447fdeea55817e3f4c0ec1063346c245d131f4a`. 이 원경 연결 작업은 해당 스켈레톤이나 canonical world를 변경하지 않았다.

## 연결 계약

`HonroAct4PilotArt.config(b)`가 인정하는 31장 `nativeArt.version=1` 및 `coveredTerrainIds` 배열 opt-in에서만 `act4Estuary`를 선택한다. 기존 장별 manifest 매핑은 그대로다. 새 원본에는 기존 `act4Dawn`/`act4Sea` gray recolor, 기본 dark filter/wash, `blue-sea-mist-day-v1`를 중첩하지 않는다. 예전 preview의 crop zoom도 상속하지 않는다. 기존 시차 frame 계산·screen raster·3개 LRU·동적 scenery는 보존한다. pause readiness는 실제 선택된 새 원경의 decode를 기다린다. 실제 배의 draw·목적지·event·충돌은 수정하지 않는다.

## 압축 채택

사전 시각 기준을 고정한 뒤 q90/q85/q80을 동일 해상도로 측정하고 정상 크기 및 4개 영역 2배 확대를 직접 비교했다. Root도 비교표를 직접 확인해 q90을 채택했다. q85/q80은 저대비 잔물결 평탄화 때문에 제외했다. 선택된 q90의 압축 오차는 기록된 회귀 한도와 해시로 보호하고, runtime은 이 q90 decode에 추가 색변환을 하지 않는다는 별도 픽셀 동일성 검사를 유지한다.

## 확인과 남은 승인

- `node tests/act4-estuary-far.mjs`: 원본/채택 후보 해시·압축 오차 회귀 한도, decode 팔레트, opt-in 격리, 시차, 캐시, readiness, world 비변경 PASS.
- `node tests/act4-pilot-native-art.mjs`: 기존 foreground·배·팔레트 계약 PASS.
- `node tools/act4-silhouette-review/test-dawn-runtime.mjs`: 기존 compatibility PASS.
- 수정 전 HEAD `853100e32`의 request()와 동일 gradient fixture 비교: 기존 11 key × 3 mood = **33개 픽셀 완전 일치**.
- `npm run build`: release guard에서 `Stage31 production package differs from the actual shipped map/assets.`로 차단. 이 작업에서 guard를 우회하거나 package/world를 맞춰 쓰지 않았다. 통합 담당자가 canonical 작업과 함께 해결해야 한다.
- 위 결과는 focused/래스터 검증이다. **실제 App GUI, 지형과의 구도·지리 최종 합격, master/Pages 배포를 뜻하지 않는다.** 통합 담당자의 실제 App 화면 검수 후 승인한다.
