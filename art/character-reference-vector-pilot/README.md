# 설오 첨부 시트 → 실제 Inkscape 벡터 실험

**이전 게임 벡터를 기준으로 하지 않았다.** 사용자가 2026-10-28 다시 첨부한
`260916_설오_캐릭터시트.png`의 **왼쪽 큰 전신**을 직접 기준으로 삼았다.
순수 경로 벡터로 외형을 얼마나 보존하는지 확인한 별도 시범이며 게임 적용본이 아니다.

## 결과

`seol-o-reference-vector.svg`는 실제 Inkscape 1.4의 GUI **Trace Bitmap →
Multicolor / Colors**로 생성한 59개 compound path다. 최종 SVG 안에는
`image`, 임베디드 PNG, 외부 이미지 참조, 필터가 없다.

원본의 길고 넓은 도포, 겹깃·밝은 내의, 허리 띠와 붉은 끈, 넓은 바지와
다리 감개, 성인 얼굴 비율과 묶음머리, 손과 활의 모양을 그대로 따른다.
이전 게임 그림의 짧고 단순한 옷이나 기존 몸 비율로 재해석하지 않았다.

전신 수준에서는 원본의 형태와 색 배치를 매우 가깝게 유지한다. 얼굴·허리
3배 확대에서는 원본의 부드러운 색 변화가 작은 단색면으로 나뉘고, 머리 및
피부에 추적 흔적이 남는다. **수작업 재작화와 동등하거나 완벽한 복제라고
주장하지 않는다.** 경로 수도 많아서 현재 게임용 경량 에셋으로 보기 어렵다.

## 실제 도구 작업

1. 원본 픽셀을 직접 확인하고 왼쪽 전신만 분리했다. `reference-main-figure.png`
   는 추적 입력이다. Python/Pillow는 원본 위치 그대로 크롭·배경 마스킹만
   수행했으며 인물 내부를 그리거나 색/비율을 바꾸지 않았다.
2. 원본은 1491×1055. 크롭은 원본 (10,0)–(455,1035), 출력 445×1035.
   뒷모습 그림이 가까이 붙은 우측 경계는 아래 마스크로 분리했다.
   활 위쪽 끝이 뒷모습과 근접한 곳은 이 분리 경계의 영향을 받을 수 있으며,
   가려진 부분을 상상해 복원하지 않았다.
3. Inkscape GUI에서 PNG를 열고 Colors 64 scans, Stack 켬, Remove background 켬,
   Smooth 끔, Speckles 1, Smooth corners .50, Optimize .05로 실제 Apply.
   생성된 group 63개 path를 Save As로 보존했다.
4. Inkscape CLI에서 원본 bitmap `image1`과 near-white 배경/가장자리 층
   `path64,path63,path62,path61`을 선택하여 Delete. 59개 경로만 SVG로 export.
   새 외형 경로를 코드로 쓰거나 기존 게임 벡터를 가져오지 않았다.
5. 대안으로 **32색 + Smooth 켬**도 실제 GUI에서 추적했다. 확대 얼굴의
   회색 테두리와 눈 모양 손실이 커져 **기각**했다. 최종은 64색/no-Smooth다.
6. 원본과 최종 벡터를 동일 좌표·동일 배율로 비교했다. 확대 벡터는
   445px PNG를 늘린 것이 아니라 Inkscape에서 **1335px native export**했다.

### 배경 분리 마스크 (원본 좌표)

`[(0,0),(395,0),(395,245),(420,262),(450,266),(450,281),(431,302),
(424,390),(390,482),(386,1055),(0,1055)]`

원본 Library: `libfile_a4feb4263ddc8191a45b7eb29e69348f`, version 0.
원본 SHA256: `fb4cc8ac90c2095d6b01a225c55899fbcfea719780360cab99caac102c07343f`.

## 검수 자료

Git 제외 `_local/reports/character-reference-vector-pilot/`:

- `reference-vs-vector-full.png`: 원본/최종 전신 같은 크기.
- `face-comparison.png`: 얼굴 원본 3× / SVG native 3×.
- `cloth-comparison.png`: 허리·끈·안감 원본 3× / SVG native 3×.
- `face-comparison32.png`: 기각한 32색 Smooth 판의 확대 한계.
- `source-work/`: 실제 GUI 저장 working SVG 두 개와 기각한 순수 SVG.

## 이번에 하지 않은 일

리그 분할·관절 pivot·애니메이션·게임 importer·성능 최적화·실게임 QA·빌드·배포는
실행하지 않았다. 현재 SVG의 층은 **색상별 compound path**이며 신체 부위별
리그가 아니다. 게임 적용하려면 이 외형을 기준으로 몸통/옷/팔다리/손/활을
구조적으로 나누고 가려진 관절 면을 만들어 움직임을 검증해야 한다. 이 파일을
기존 생산 SVG에 덮어쓰는 것으로 애니메이션 캐릭터가 완성되지는 않는다.
