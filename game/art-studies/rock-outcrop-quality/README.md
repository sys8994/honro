# 암반 독립 미술 연구 — 미술 미달 / 적용 금지

## 판정

**7회 실제 Chromium 픽셀 검수와 수정, 마지막 연결 화면 전체 검수까지 수행했으나, 요청한 성숙한 자연 암반 품질에는 미달한다. 완료/미술 합격 후보로 주장하지 않는다.** 부모의 실제 픽셀 검수 대상으로 보존한다. 기술적인 생성·캡처·순수 벡터 조건과 미술 합격은 별개다.

남은 핵심 결함: 대형 면의 각진 벡터 인상이 강하고, 여러 판석의 외형 및 풍화 패치가 유사하다. 가로 박리판도 세 변형에서 공통 모티프가 드러난다. 원화의 불규칙하게 맞물린 암질과 흙의 자연스러운 매몰 관계에는 도달하지 못했다. 이후 개선은 같은 생성 규칙의 디테일 증가보다 개별 암괴 윤곽과 면 연결의 수작업 재저작이 필요하다. 현재 파일을 공통 렌더러에 연결하지 말 것.

## 확인한 실제 참고 픽셀

- `../../docs/art-references/image-first-20261019/1000047658.png`: 하단 근경, 좌측 뿌리 아래 및 중앙 노출 암반. 흙의 얇은 피복, 암면 방향, 밝은 모서리와 깊은 접촉틈을 관찰.
- `../../docs/art-references/image-first-20261019/1000047660.png`: 하단 전폭 암반. 사선 판석·중간 쐐기·흙 렌즈가 서로 가리고, 낮은 시점에서 상면은 얇게 보임.
- 실패 비교: 원격 `art/vector-art-correction-v2`의 `game/docs/art-review/vector-correction-v2/parent-checkpoint-10/current-stage03-normal.png`를 git 객체에서 `/tmp/rock-failed.png`로 읽고 실제 픽셀 확인. 매끈한 거대 둥근 돌과 세로 지그재그 선 반복을 비교 기준으로 삼음.

## 파일

- `rock-shelf.svg`, `rock-shoulder.svg`, `rock-fan.svg`: 투명 배경 720×460, 이름 있는 지질/흙/식생/전경 그룹, editable path와 gradient/clipPath만 사용. 래스터 내장·외부 이미지·필터 노이즈 없음.
- `review.html`: 세 변형 각각 1:1, 30% 나란히 비교. 인물 도형은 정확히 80 CSS px 높이, 축소에서는 24px. SVG 바깥의 검수용 표식.
- `assembly.html`: 세 변형 110px 겹침 조합, 1:1/30%. 바닥은 뷰포트 아래로 연결될 것을 전제한 직선 마감이며 단독 떠 있는 장식용 아님. 런타임 통합은 수행하지 않음.
- `reviews/round-1` … `round-7`: 각 회의 **실제 SVG 스냅샷, HTML, Chromium PNG**. 회차 SVG가 그 캡처의 정확한 원본. `author.py`는 최종 저작 도구이며 중간 수정 이력을 전부 재현하는 버전관리 도구는 아님.
- `reviews/final-assembly.png`: 마지막 전체 미술 검수 화면. 3번째 부재 높이 접합과 H 표식 위치를 확인 후 교정.
- `sizes.json`: gzip mtime=0 측정값, path 수.

## 실제 검수/수정 기록

| 회 | 실제 화면 | 발견한 실패 / 다음 수정 | 판정 |
|---|---|---|---|
| 1 | `reviews/round-1/normal-and-30pct.png` | 같은 폭의 사선 판석이 두 줄로 늘어섬. 독립된 돌처럼 뜸. 폭·높이·기울기·절리 윤곽을 변화시키고 박리면 추가. | 불합격 |
| 2 | `reviews/round-2/normal-and-30pct.png` | 크기는 다양해졌지만 판석 사이 바탕이 비어 보임. 뒤쪽에 연결된 큰 암면과 중간 쐐기 추가. | 불합격 |
| 3 | `reviews/round-3/normal-and-30pct.png` | 바탕 연결 개선. 상면의 띠와 같은 접촉틈이 반복됨. 일부 틈 제거, 띠 명도 축소, 흙 피복/퇴적 렌즈 추가. | 불합격 |
| 4 | `reviews/round-4/normal-and-30pct.png` | 흙 밑단이 톱니처럼 규칙적이고 잔돌이 줄지음. 곡선 흙 피복, 비균등 퇴적 군집, 제한된 풍화/식생으로 교정. | 불합격 |
| 5 | `reviews/round-5/normal-and-30pct.png` | 재질 단계는 보이나 사선 구조 반복. 가로 박리판과 전경 가림을 추가하고 반복 접촉틈 대부분 제거. | 불합격 |
| 6 | `reviews/round-6/normal-and-30pct.png` | 가로 박리판의 밝은 면/검은 테두리가 과도해 붙인 판처럼 보임. 그림자 폭, 상면 대비를 낮추고 가장자리 박리 추가. 식생 위치를 변형별 분리. | 불합격 |
| 7 | `reviews/round-7/normal-and-30pct.png` | 큰 형태-중간 구조-국소 디테일은 읽힘. 그러나 면/풍화 패치의 공통 생성 형식이 보이고 자연 암반의 불규칙성이 부족. | 요청 품질 미달 |
| 전체 | `reviews/final-assembly.png` | 정상/30%에서 연속 매스와 세 높이 변형 확인. 연결 위치와 인물 표식 교정. 반복 가로 박리판과 각진 양식이 남음. | 미술 합격 아님 |

## 측정

| SVG | raw bytes | gzip bytes | paths |
|---|---:|---:|---:|
| shelf | 51,290 | 13,729 | 327 |
| shoulder | 48,269 | 13,075 | 309 |
| fan | 48,321 | 12,951 | 312 |
| 합계 | 147,880 | 39,755 | 948 |

크기 예산을 먼저 잡지 않았다. Path 수는 품질 증명이 아니다. XML 파싱과 image/base64 부재를 확인했다.

## 범위와 실행

변경 파일은 이 디렉터리 안에만 있다. 런타임·게임 데이터·빌드·기존 에셋·master·Pages를 변경하지 않았다. 작업 브랜치 `art/rock-outcrop-quality-20261020`.

캡처 재현: 이 디렉터리에서 `python -m http.server 8732 --bind 127.0.0.1`, 다른 셸에서 `python capture.py 7`. `/usr/bin/chromium`과 Python Playwright 사용. 최종 자산 재저작은 `python author.py 7`.

초기 Playwright Chromium 다운로드는 CDN `cdn.playwright.dev/.../151.0.7922.34/...`의 HTTP403 `Domain forbidden`으로 실패했고 설치되지 않았다(도구 내부 자동 재시도 포함). 별도 재시도 없이 이미 설치된 `/usr/bin/chromium` 사용. 초기 file:// 탐색은 `ERR_BLOCKED_BY_ADMINISTRATOR`로 실행되지 않았고, 로컬 HTTP 검수 서버에서 정상 캡처했다. 권한 상승 요청·자동 승인 심사 거부는 없었다. 최종 캡처에는 차단이 남지 않았다.
