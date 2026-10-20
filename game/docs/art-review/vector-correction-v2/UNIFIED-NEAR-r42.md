# r42 — 하나의 근경 공간, 미술 FAIL

최신 사용자 기준은 **r25 디자인 + 전체 채움 + 인물 뒤쪽까지 이어지는 지표**다. 회화 이미지 변환의 충실도를 더 높이는 경로는 철회했다.

근경 전체를 `ferry-ground` collision polygon 안에서 그리던 경로를 해제했다. 기존 structural-back의 world tile 렌더 지점에서 하나의 근경 장면을 그린다. 같은 world 공간의 뒤쪽 지표, 발밑 상면, 앞 사면이 이어지고 인물은 그 다음 그려진다. 외곽은 별도로 저작한 시각 지형이며 collision/퀘스트/인물/표적 좌표는 바꾸지 않았다. 파괴 가능한 다른 발판의 기존 상태 연동도 바꾸지 않았다.

실제 이미지:

- [정상](evidence/ferry-unified-near-r42/stage03-normal.png)
- [최대 줌아웃](evidence/ferry-unified-near-r42/stage03-wide.png)
- [모바일](evidence/ferry-unified-near-r42-mobile/stage03-mobile.png)

세 뷰에서 인물 뒤 지표가 보이고, 발은 근경 최상단 외곽보다 안쪽에 놓인다. 하지만 새 몸체의 면과 돌은 5–10H로 너무 크고 단순하다. 원본 r25의 중간 박리층과 구별되므로 **완성/합격이 아니다**. 8개 큰 몸체를 유지하며 안쪽 파단면을 더 저작한다. 원본을 반복 시트로 채우는 방식은 쓰지 않는다.

r42 actual sourceHash: `sha256:b4fe23d7dbc3db625fd3928b254f6b570a6648cbc950d140489a8f1b3a090456`.

| r42 소스 | raw B | gzip B |
|---|---:|---:|
| 직접 저작 SVG | 30,215 | 10,940 |
| 공통 parts JSON 전체 | 232,450 | 56,400 |
| Stage3 근경 renderer | 8,415 | 3,737 |

세 original receipt 모두 오류0, 상태 불변(pure true), 촬영 전후 소스 동일이다. 단일 headless Chromium에서 normal 렌더 135.3/9.2/1.9ms, wide 144.0/11.4/3.2ms, mobile viewport 108.9/4.2/1.8ms였다. 모바일 기기 성능 측정은 아니다. normal 캐시12개/12,780,288 RGBA B, wide32개/34,080,768 B(정상 화면의 이전 배율 캐시 포함), mobile6개/6,390,144 B.

최종 전체 미술 검수는 비어 있고, master와 Pages는 변경하지 않았다. artifact 일관성 gate도 `Separate final holistic pixel review is missing`으로 계속 차단한다.
