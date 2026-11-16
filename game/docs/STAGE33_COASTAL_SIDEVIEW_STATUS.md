# Stage33 coastal side-view status

## 2026-11-16 continuous natural-rock stairs, published

Production master: `806f555478464cce1ff70e8a4ca0f901c1854e97`, based on `c31ad3ed5f7e8521f9438892cdc1ef069d890ade`. Latest stage44 canopy, stage45 geology and prior published hashed resources were preserved. Source checkpoint `690788b`, build checkpoint `8ad83ce`; Pages run `43855759837` succeeded.

Stairs and their support rock were redesigned as continuous natural geology, removing floating strips, western source seams and the eastern vertical cutoff. Actual native Inkscape tracing/editing separates upper support REAR and lowland BODY. Native source color and alpha share contact registration; original upper vertices and stair contacts are retained. Three existing eastern end-facet contours were toned down to avoid emphasizing non-walkable horizontal extensions. There are no new collision surfaces or per-step decorative rectangles. Color geometry extends beyond internal semantic alpha boundaries to avoid repeated per-color antialiasing seams. Exterior silhouettes and gameplay are unaffected by that guard band.

Production editable source and exact assembly script: `art/stage33-continuous-stairs-20261116/`. Runtime package: `shared/data/act4/sideview-art/33-coastal-v2.json`, SHA256 `1a1ffa644586c30e7a8c186f526c710d5945aac0a2fc22476197176ee15b86b4`. Standalone assembly reproduces that hash. Optimizer candidates come directly from each role's raw SVG, epsilon0.8 world units; 768/1536/3072 render checks accepted. Renderer/import budgets were not increased.

Validation passed: `node tests/stage33-coastal-art.mjs`, `node tests/web-build-retention.mjs`, and `npm run build`. Focused tests cover input immutability, non-art stage parity, other chapters, old-save providers, no added collision and idempotence. Native Scene inspection includes east/west contact overlays and overview. Native before/after comparisons use identical 1440x900 views: west(950,1750,0.53), east(6800,2500,0.53).

Actual public browser verification: new isolated debug session displayed “디버그 · 기록 분리”; DOM loaded `game.7c1546e35aaf84d1.js`. Normal 4막→33장 entry succeeded. Right movement changed movement points1100→871; jump and further movement reached621, followed by visible slope landing and “이동·발사 가능”. Camera panning and zoom verified western/eastern connected artwork; no tab-code9 crash occurred in this pass. Existing tabs were preserved and normal-save reset was not used. Screenshots were captured from the public browser separately from Native comparisons.

Scope limits: this is a terrain-art correction with a short public movement/jump/landing check, not a whole-stage clear, exhaustive traversal of every staircase, or performance benchmark. Prior pilot notes below are historical and do not override this release record.

## Historical pilot record

# Stage 33 coastal side-view art revision

Source base: 0582ae39f3e80775fffc82047f22beaafe33216e (includes the current monster composition changes).

Paint-only production adapter: `shared/act4-stage33-coastal-art.mjs`, invoked after existing Act4 side-view art. New source: `shared/data/act4/sideview-art/33-coastal-v2.json`.

Replaces broad bird-view lowland paint with registered coastal side faces, a nonplay rear support arch, exact physical foreground silhouettes, and tapered stair sidewalls. Original provider IDs stay untouched in the library for prior battle snapshots. Current retired providers retain only coverage metadata and an empty visual group; large invisible SVG duplicates are not created. No terrain polygons, walk edges, monsters, mission conditions, or saves are changed.

Validation: `node tests/stage33-coastal-art.mjs` passes input immutability, non-art stage parity, other-stage parity, original provider parity, zero new collision and idempotence. Four native production Scene renders (west/mid/east lowland and upper-middle) were visually inspected. These are not browser screenshots and do not establish actual movement/projectile validation. The browser could not reach localhost across execution environments; traversal QA remains outstanding. This is an art pilot, not a redesign of all stage 33 routes.

Sidewall geometry-culling reduced its JSON from 403191 to 64580 bytes; complete compact source pack is approximately 1.84 MB. Do not pad assets to a byte target.

Release gate: do not label browser traversal verified. Keep this source branch separate from Pages until build and release review pass, preserve latest master and all parallel Act5 changes, and never overwrite generated assets from an older master build.

## 2026-11-16 조수 단계 시각 검수 범위

806f555 전면 암반·계단 기준으로 production `act4-coast-events.tide`, `act4-pilot-art`와 Native Scene을 함께 실행했다. 이전 공개 검수는 입장·이동·점프·착지와 동서 구도만 포함하며 조수 4상태 검증 기록은 없었다.

- 격리 fixture: `tools/act5-edge-fix/capture-stage33-tides.mjs`. 원본 지형·배우를 고정하고 실제 조수 함수에 라운드 1→2→5→7을 순서대로 전달한다. 실제 전투나 침수 복귀 플레이가 아니다.
- 같은 카메라 (3500,3100), scale 0.28, 1440×900에서 저조 4095, 상승 예고 4077, 만조 3532.5, 물 빠짐 4095를 확인했다. 상승 예고는 기존 설정대로 18 world unit만 올라가며 만조 시 전환된다.
- 만조 물 레이어가 새 암반·저지대 길 앞에 연속으로 나타난다. 암반별 수면 절단이나 레이어 역전은 관찰되지 않았다. 잠긴 길 윤곽은 약하게 남고 물 위 길은 구별된다. 물 빠짐 PNG는 초기 저조 PNG와 바이트까지 일치했다.
- 모든 렌더에서 units/terrain/tide 불변 assertion 통과. `tests/act4-water-support-33-32-38.mjs`, `tests/stage33-coastal-art.mjs` 통과. 이는 실제 캠페인 통과 판정이 아니다.
- 증거: `_local/reports/stage33-tides/{low,rising,high,receded}/`의 PNG/report.json 및 `verification.json`. 생성 결과는 저장소 정책에 따라 `_local`에 둔다.
- 공개 탭14는 재접속 시 이미 Chromium 오류 코드9였으며, 이번 검수 중 정상 턴 종료나 상태 변경은 하지 않았다. 발생 시점·원인은 미확인이고 조수와 인과관계를 주장하지 않는다. **실제 공개 라운드 진행·침수 복귀는 미검증**이다. 일반 저장과 다른 탭은 보존했다.

재현 예시 (저장소 루트, 각 상태 별도 프로세스):
```
HONRO_NATIVE_OUT=_local/reports/stage33-tides/high HONRO_REFERENCE_VIEWS='[{"stage":33,"id":"high","x":3500,"y":3100,"scale":0.28,"round":5}]' node --expose-gc tools/act5-edge-fix/capture-stage33-tides.mjs
```
round를 1/2/5/7로 바꾸며 출력 경로도 분리한다. 코드·에셋·충돌·조수 설정 변경은 없다.

### 같은 날 후속 공개 실제 입력 검수

위의 탭14 오류 후 새 격리 탭15(`HONRO.html?verify=02153a8`)를 열어 정상 로드와 ‘디버그 · 기록 분리’를 확인했다. 기존 일반 저장이나 기존 탭을 초기화하지 않았다. 길을 열다→여정첩→4막→33장 진입 후 정상 UI의 ‘방어하며 기력 회복 후 턴 종료’를 사용해 적 행동을 거쳐 1→7턴을 진행했다. 내부 round/state 변경이나 적 삭제는 사용하지 않았다.

- 2턴 `≈ ↑ 3`, 3턴 `↑ 2`, 4턴 `↑ 1`, 5·6턴 `≈ ━`, 7턴 `≈ ↓`를 실제 HUD에서 확인했다.
- 5턴과 7턴에 동일 미니맵 위치로 이동해 저지대 경사면을 비교했다. 만조에는 연속 물 레이어가 새 암반과 길을 덮고, 물 빠짐에는 같은 길·암면이 다시 드러났다. 관찰 범위에서 물 경계 절단이나 암반 앞뒤 역전은 없었다.
- 공개 증거 파일: `_local/reports/stage33-tides/public-round2.png`, `public-round5-high.png`. 7턴 물 빠짐은 실제 화면으로 확인했지만 별도 PNG 파일은 확보하지 않았다. Native 4상태 PNG와 공개 캡처를 혼동하지 않는다.
- 시작 지점에서 방어 대기한 검수라 소단은 적 공격 후 전투불능이 되었다. 나머지 3명으로 7턴까지 진행했다. 이는 정상 전략·완주·승리 검수가 아니며 **아군 침수 후 복귀 이동은 아직 미검증**이다. 실제 수면 전환·화면 검수만 이번 후속 기록으로 확인 범위를 확장한다.
- 02153a8 기록/도구 커밋의 Pages run43860590519는 success. 런타임 게임 변경은 없다. 새 탭에서는 이 검수 중 오류9가 발생하지 않았다. 기존 오류9의 원인은 판정하지 않았다.
