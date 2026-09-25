# HONRO Act I RC19

## Stage 1~4 terrain composition rebuild

- 지면과 분리된 수동 surface polygon 방식을 Stage 1~4에서 제거
- `materialBands` / `waterPools`를 추가하여 실제 support terrain으로부터 material geometry 자동 생성
- grass blade가 surface normal 방향으로 자라도록 수정
- shallow water를 함몰된 ground에 수평으로 고이는 방식으로 변경
- Stage 1 floating root platform을 giant pine + destructible branch polygon으로 교체
- Stage 3 optional high route 아래 cargo scaffold 장식 추가
- landmark layer를 `back / prop / front`로 명확히 분리
- Canvas filter 사용 없음

## Material sets

- Stage 1: grass, moss, mud, rock, scree, shallow water
- Stage 2: grass, rock, scree, mud, moss, shallow water
- Stage 3: grass, mud, scree, rock, gravel, stone road, shallow water
- Stage 4: stone road, mud, charred soil, dry grass, rock, grass

## Validation

- RC19 map audit: 20 / 20
- Stage 1~4 start → exit locomotion: PASS
- Stage 1 destructible branch chain: PASS
- Branch 파괴 후 main route 완주: PASS
- Stage 2 five-step climb: PASS
- Stage 3 permanent docks + warehouse high route: PASS
- Stage 4 west/east defense height: PASS
- support-bound material attachment: PASS
- movement audit: 0 failures
- impact/contact audit: 29 checks PASS
- RC13 combat balance audit: PASS
- browser runtime exception: 0
