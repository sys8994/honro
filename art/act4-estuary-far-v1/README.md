# Stage 31 낮은 하구 원경 · 원본 래스터 연결

## 2026-10-31 운영 계약 변경

원본 PNG는 그대로 보관하고 운영 원경은 후속 `db9fe2a8`에서 사용한 손실 Q90 WebP를 유지한다. 사용자의 용량 절감과 오차 제한 최적화 지시, 부모의 원본·운영 이미지 직접 비교를 근거로 한다. 지형·캐릭터·텍스트의 alpha 또는 미술 기준에 확대하지 않는다. 아래 최초 무손실 기록은 당시 이력을 보존한다.

운영 파일 `shared/assets/environment/campaign-far/act4-estuary.webp`는 130,830B, SHA-256 `1ba81aae5bebeebd46cc094be2519797d67ef49a887d7aade45cb61b39878fff`이며 원본과 동일한 2173×724다. source PNG는 1,752,480B, SHA-256 `87929ed507ceaae6f12611f1d52be80fced2ed4992b4edf65e196c0e68fad8b6`로 변경하지 않았다. 구 무손실 WebP는 1,266,358B였고 원본과 RGBA 전 바이트가 같았다. 운영 Q90은 원본과 3,432,353/6,293,008 RGBA 바이트가 다르므로 픽셀 동일이라 주장하지 않는다.

새 원경 전용 제한: alpha 정확히 일치, RGB 채널 평균 절대 오차 ≤2/255, RGB 채널 오차 p99 ≤12/255, Rec.709 휘도 SSIM ≥0.98. SSIM은 11×11 Gaussian(σ=1.5), valid 내부 영역, population covariance, 8-bit C1/C2를 사용한다. 실제 값은 RGB MAE 1.349111/255, p99 7/255, alpha 차이 0, SSIM 0.985865다. `npm run test:act4-estuary`는 측정 구현/경계, 원본·운영 신원/품질, 운영 WebP의 실제 decode/cache 픽셀 일치를 각각 검증한다. 수치 통과만으로 새 미술, 게임 화면 또는 배포가 승인되는 것은 아니다. 운영 출처와 수치는 `operational-q90.json`에 기록하며 `optimization.json`은 최초 무손실 이력이다. `python3 tests/act4-estuary-screen.py`는 현재 로컬 빌드에서 실제 원경 요청과 데스크톱·모바일 화면을 별도로 확인한다.

## 최초 무손실 연결 이력

- 원본: 생성 파일 `exec-18e5edc1-71ae-4cc5-9ff2-80409c7dfcbe.png`를 `source.png`에 바이트 그대로 보존. 직접 원본/최종 이미지를 확인했다. 벡터 추적 결과를 래스터화한 이미지가 아니다.
- 실제 원본은 **2173×724**. 전달 설명의 2048×682와 달라 메타데이터로 정정했다. 기존 runtime 폭 2048 제한으로만 2048×682에 decode한다.
- 당시 `shared/assets/environment/campaign-far/act4-estuary.webp`: lossless WebP, resize/recolor/crop 없음. 1,752,480 → 1,266,358 bytes(27.74% 절약), RGBA 픽셀 완전 일치. 해시와 측정은 `optimization.json`.
- 재현: `sharp(source).webp({lossless:true,effort:6}).toFile(output)`. `sharp(...).ensureAlpha().raw()` 바이트를 양쪽 비교한다.
- 지리 기준 입력: estuary-graybox `stage.json`, SHA-256 `8165dfbcee349625c63f4eda8447fdeea55817e3f4c0ec1063346c245d131f4a`. 이 원경 연결 작업은 해당 스켈레톤이나 canonical world를 변경하지 않았다.

## 연결 계약

`HonroAct4PilotArt.config(b)`가 인정하는 31장 `nativeArt.version=1` 및 `coveredTerrainIds` 배열 opt-in에서만 `act4Estuary`를 선택한다. 기존 장별 manifest 매핑은 그대로다. 새 원본에는 기존 `act4Dawn`/`act4Sea` gray recolor, 기본 dark filter/wash, `blue-sea-mist-day-v1`를 중첩하지 않는다. 예전 preview의 crop zoom도 상속하지 않는다. 기존 시차 frame 계산·screen raster·3개 LRU·동적 scenery는 보존한다. pause readiness는 실제 선택된 새 원경의 decode를 기다린다. 실제 배의 draw·목적지·event·충돌은 수정하지 않는다.

## 확인과 남은 승인

- 최초 당시 `node tests/act4-estuary-far.mjs`: 무손실 원본 픽셀, decode 팔레트, opt-in 격리, 시차, 캐시, readiness, world 비변경 PASS. 현재는 운영 WebP의 캐시 일치와 별도의 원본/Q90 품질 검사로 나눈다.
- `node tests/act4-pilot-native-art.mjs`: 기존 foreground·배·팔레트 계약 PASS.
- `node tools/act4-silhouette-review/test-dawn-runtime.mjs`: 기존 compatibility PASS.
- 수정 전 HEAD `853100e32`의 request()와 동일 gradient fixture 비교: 기존 11 key × 3 mood = **33개 픽셀 완전 일치**.
- `npm run build`: release guard에서 `Stage31 production package differs from the actual shipped map/assets.`로 차단. 이 작업에서 guard를 우회하거나 package/world를 맞춰 쓰지 않았다. 통합 담당자가 canonical 작업과 함께 해결해야 한다.
- 위 결과는 focused/래스터 검증이다. **실제 App GUI, 지형과의 구도·지리 최종 합격, master/Pages 배포를 뜻하지 않는다.** 통합 담당자의 실제 App 화면 검수 후 승인한다.
