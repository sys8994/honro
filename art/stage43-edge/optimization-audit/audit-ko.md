# 43장 최적화 독립 계수 감사

현재 SOP/optimizer README 원문을 읽고 최종 저장 파일을 직접 파싱했다. 이전 optimizer report의 attempted count는 사용하지 않았다. 모든 입력 해시 재확인: 변경 없음.

## 같은 원본 raw → 최적화 최종
|구분|바이트|parsed segment|subpath|path 요소|기본도형 요소|
|---|---:|---:|---:|---:|---:|
|center|5,369,252 → 3,019,689|374,618 → 196,405|17,878 → 17,878|8 → 8|0 → 0|
|left|3,644,603 → 1,894,385|250,814 → 124,612|7,718 → 7,718|8 → 8|0 → 0|
|right|3,740,771 → 1,881,093|255,996 → 124,168|6,685 → 6,685|8 → 8|0 → 0|

**세 쌍 모두 위 5개 계수의 비증가 통과.** raw와 최적화 SVG viewport는 모두1254×1254, viewBox0 0 1254 1254다. 단, 실제 기하 bbox 오차/미술/게임 품질은 이번 계수로 판정하지 않는다.

## 별도 세부 필터 단계
|구분|최종 바이트|segment|subpath|path 요소|
|---|---:|---:|---:|---:|
|center|1,439,224|97,185|3,811|8|
|left|1,199,353|81,036|2,492|8|
|right|1,312,995|88,384|2,863|8|

면적120 필터는 작은 성분/구멍 삭제를 포함하는 미술 변경이며 원래 optimizer의 성과로 합산하지 않는다.

## 별도 중앙 partition/import 단계
- partition 전:1,439,362bytes /97,185segments /3,811subpaths /8path요소.
- partition 후:1,418,949bytes /97,964segments /3,767subpaths /50path요소.
- **segment+779, path요소+42 증가. 비증가 기준으로는 실패.** 엔진 경로문자 한도 대응을 위한 별도 공간분할이지만 증가 사실이 사라지지 않는다.
- imported asset:1,422,003bytes, runtime tree54개, runtime path50개, color segment97,964. 별도 alpha1경로/4segment/1subpath. runtime tree는 편집기 노드가 아니다.
- 같은 중앙raw부터 최종JSON까지:bytes5,369,252→1,422,003, color segments374,618→97,964, subpaths17,878→3,767. path요소/객체는 원래SVG8에서 partitionSVG50/runtime path50으로 증가했다. 따라서 전체 파이프라인을 모든 항목 불증가라고 보고하면 안 된다.

## 계수 한계
- 실제 Inkscape 편집기 node 수, mesh/tessellation 면 수는 측정하지 않았다. parsed segment/subpath를 그 수치라고 부르지 않는다.
- subpath는M/m 개수, 실제 채움 면/구멍/삼각형 개수와 다르다. path 요소에는defs가 존재하면 포함한다.
- 중앙 최종 compiled까지 재계수했다. 좌우 최종 partition/import 산출물은 이번 경로에 없으므로 세 필드를 합친 최종 전체자산 불증가 판정은 하지 않았다.
- 생성원본이 서로 다른 중앙/좌/우 총량 증가를 같은 원본 최적화 증가로 혼동하지 않았다.
- 시각 품질·coverage·production승인은 이번 감사 범위 밖. 원본/후보/production/remote 수정 없음.
