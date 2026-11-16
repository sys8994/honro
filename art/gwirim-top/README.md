# 귀림 상부 수관 보완 — 진행 중

대상은 5막4장 「귀림의 첫 밤」(44). 기준 게임 tree는 master 8cb12ce와 동일한 로컬 e49ecbe.

원인: 원본 near-import 44장의 수관/줄기 자체가 viewBox y=0에서 잘렸다. 런타임 카메라나 타일만의 결함이 아니다. 하부/보행/충돌/진행은 보존하며 상부 REAR 수관만 별도 연장한다.

첫 생성은 낮은 캔버스 안에 재배치하여 원본 압축·좌표 불일치로 반려. 두 번째는 원본 벡터를 y700으로 렌더한 여백 캔버스에서 위쪽만 확장. 결과1549×1015로 출력되어 원본 대비 약 .713 scale, y500.5 대응을 실제 패치 상관으로 확인했다. 주 줄기 원본 패치 상관 .97, 다른 두 패치 .89/.90. 하부 생성물을 사용하지 않고 상부만 Inkscape Boolean 분리. 미술 기준은 이번 명시 요청의 기존 나무 형태·팔레트 보존이며 stage21 건축 풍경으로 재해석하지 않는다.

실제 Inkscape1.4 색16·smooth·speckles6 추적과 alpha 별도 추적. 원본/시안/trace 보존. canopy epsilon1.2 최적화는 raster gate 실패하여 감량 미채택, epsilon.5 보수 후보 진행 중. alpha .5는7274→3547 segments,107344→52403bytes 통과.

현재 시각 검수·게임 검수·통합·배포 전 후보다. 물리/보행 경계/저장/기존44 하부는 변경하지 않는다. 원경은 별도 이미지 그대로다.

## 상보 접합 재검수
첫 통합의 y0 수평 접합은 반려했다. 최종 후보는 생성 수관을 y620(원본 약167)까지 실제 Inkscape Boolean 추출하고 원본과 겹치는 y8..130 중 색차·alpha 차이가 최소인 연속 경계를 선택해 두 원본 alpha에 실제 Boolean intersection했다. 새 cap은2 원본좌표 중첩하여 subpixel 틈을 피한다. 추가 자유형 그림·블러·반복·충돌 변경 없음. 생성 팔레트를 기존44 팔레트로 대응하고 비보행 수관의 silhouetteUnderpaint만 끈다. 원본 지면과 rootExterior는 그대로다.

canopy epsilon1.2 실패, .5는30801→30798로 실질 감량 없어 더 공격적인 단순화하지 않았다. 확장620 재추출에서는 raw를 사용, 소수점2자리 정규화(좌표 최대.005오차), 실제 Inkscape3개 공간분할으로 기존 단일경로60000 한도를 지켰다. 예산 완화 없음. alpha는.5 통과; 상보 base .4는3765→3481, cap .4 결과는 보존 report 참조. optimize는 기존 output 덮어쓰기 방지라 재시도는 새 이름을 사용한다.

Native Scene overview 및 서/중/동 상부 검수, gameplay SHA256 5ac732c2711ae9a2f6a24288106da696972aad8ded4edcce11bb066eb26ac955로 기존44와 동일. 일반 저장/진행/배우/충돌/revision 변경 없음. 검수 캡처는 원본과 새 상부 수관의 세부 질감 차이가 남는 명시적 한계를 포함한다. 실제 브라우저·공개 배포는 아직 미검수이며 부모 검토 전 통합하지 않는다.

재현: trace-v2 raw 원본 → extract.py → 비파괴 optimizer2회 판단 → normalized(숫자2자리) → partition.py → import-native-clip → palette.py → render-canopy.mjs → seam.py → base/cap-overlap .4 optimizer → 최종 import-native-clip+palette.py. 원본 clip은 별도 새 파일 stage44-canopy-base-clip.json으로 보존/교체한다. 원본 stage44-upper-clip.json은 변경하지 않는다. 최종 렌더는 tools/gwirim-top/capture.mjs.

## 공개 배포·실제 입력 검수 완료
master bea68aeae20e239bca8bccd55427755ba443c108, Pages43844623935 build/report/deploy 모두 success. 공개 HONRO.html·manifest·ordered-common18·chapter44 asset가 검수 로컬 바이트와 모두 일치. 이전 manifest 참조42737개 파일도 SHA 그대로 보존.19 release-guard, act5-edge-art 전체,10장 terrain-contact, stage42-edge-geology, stage33-coastal-art PASS.

새 공개 탭에서 일반 기록과 분리된 검수 UI로5막4장 선택, 대화 표시 후 실제 D 이동1100→645, 도약570, 다시 이동 후 원본 경사 발판 착지379 및 이동·발사 가능 확인. 미니맵은 이동 완료가 아니라 카메라 검사로 사용, 휠 축소로 중앙 큰 나무와 상부 수관이 화면 밖으로 자연스럽게 이어지는 것을 확인했다. 공개 증거 public-canopy-overview.jpg. 일반 저장·기존 공개 탭 보존. 45장은 별도 그림이어서 이 수관을 재사용하지 않았다.

첫 브라우저 증거 저장 도중 Chromium 오류코드9가 발생했다. 같은 검수 탭을 UI 새로고침하여 복구하고 정상 UI 재진입 후 수관 검수를 완료했다. 정확한 crash 원인은 확정하지 않았으며 안정성/장시간/Android/실측FPS/전체장 클리어를 주장하지 않는다. 마지막200 console 항목 내 게임 origin warn/error는 없고 browser extension metadata 오류만 관찰. 남는 미술 한계는 새 수관과 원본의 세부 질감 차이이다.
