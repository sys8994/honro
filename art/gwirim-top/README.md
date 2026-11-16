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
