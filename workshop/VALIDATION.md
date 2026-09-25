# HONRO Map Workshop v2 Validation

## Automated browser checks

- 기존 Workshop smoke test: PASS
- v2 feature acceptance: **14 / 14 PASS**
- browser runtime exception: 0

검사 항목:
1. UI text selection/drag 비활성화
2. configurable grid
3. terrain epsilon optimization 감소 확인
4. solid polygon export
5. playtest solid underside ceiling collision
6. element polygon optimizer
7. element node Ctrl+drag grid snap
8. element polygon 전체 click-select/drag
9. Element Editor polygon 추가
10. element 1회 배치 후 Select 자동 전환
11. Stage terrain node Ctrl+drag grid snap
12. Stage terrain body click-select/drag
13. Solid tool 노출
14. runtime JS exception 0

## Optimization example

기본 test ground 기준 derived nodes:

- ε = 0: 196 nodes
- ε = 10: 43 nodes

이 값은 silhouette/roughness에 따라 달라지며, 사용자가 preview/playtest로 형태를 확인한 뒤 threshold를 선택해야 한다.
