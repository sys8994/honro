# 1막5장 폭포 검수 후보 · 2026-10-27

기준은 공개 master `0f19f8f75ebf77a356f9f8016fcb81ea51ff9fa2`. 전용 브랜치 `stage5-waterfall-review-20261027`에서 작업하며 부모 독립 검수 전 master 병합/배포하지 않는다. 이 문서는 공개 가능한 게임 화면과 설계 판단만 담는다. 계정·사용자 저장 자료를 포함하지 않는다.

## 설계 카드

담허는 하부 왼쪽 입구의 작은 동굴 물길진, 설오는 노송 잔교를 올라 오른쪽 높은 주박목을 공격한다. 동굴 직접 사격은 천장/동벽이 막는다. 기본 활/기예/보스 HP/성장/모집/축지진목/임무 순서/다른29장은 보존한다. 기존 삼각 면·부유 목재·얇은 절벽을 합격으로 간주하지 않는다.

## 기준과 재현

`python tools/testing/stage5-review-capture.py http://127.0.0.1:8842/HONRO.html label 5 _local/reports/stage5-review/label` — Stage5 한 장만. 게임 Canvas, 고정 카메라, 1440×900과390×844/844×390. 정지 디버그 화면은 미술 관찰용이며 정상 교전/생존 증거가 아니다. before/loopN은 같은 카메라다. maxout은 x2900/y2500 및 실제 허용 최소 줌 .2117647, lower x1700/y2600/.65, cave x3420/y2510/.85, timber x2670/y1730/.8, right x5440/y1260/.8. 모바일은 파일명의 동일 지점 .5배.

## 1회차 · 큰 암면과 하부/장식

직접 본 기준: 바닥 대부분이 면 몇 개로 채워지고 같은 삼각 분할이 반복된다. 동굴은 얇은 테두리, 쓰러진 나무 왼끝은 물 위에 떠 있다. 후면 절벽은 이동층과 구분되지 않는 큰 단색 면이다.

수정: 기존 암반 삼각 분할을 제거하고 연결된 침식층·수평 틈·수직 절리와 동굴의 외광/내벽 두께를 저작했다. 낮은 나무에 실제 서쪽 뿌리 접점, 물가·안부·동굴 입구에 크기가 다른 기존 식생/바위 묶음을 둔다. 지형 원본과 그림은 같은 좌표를 쓴다.

재촬영을 직접 열어 본 결과: 하부 단색/삼각 반복과 서쪽 재질 종단은 해소됐다. 동굴과 이동 경계는 읽힌다. **아직 미통과**: 오른쪽 머리 부분은 여전히 칼날처럼 얇고, 나무발판은 큰 막대 인상이 남으며 중간 돌 처마와 상승 경로가 겹친다. 하부는 층만 생겨 밀도/실루엣 변화가 더 필요하다. 다음 회차에서 실제 지형 실루엣과 잔교 구조를 고친다. 초기 경로 진단에서 나무에 올라선 담허와 옛 하부 경로 표본의 바닥 좌표가 불일치함도 발견했다. 정상 플레이 통과로 기록하지 않는다.

- [기준 전체](before/stage05-maxout.png) / [1회차 전체](loop1/stage05-maxout.png)
- [기준 하부](before/stage05-lower.png) / [1회차 하부](loop1/stage05-lower.png)
- [기준 동굴](before/stage05-cave.png) / [1회차 동굴](loop1/stage05-cave.png)
- [기준 나무발판](before/stage05-timber.png) / [1회차 나무발판](loop1/stage05-timber.png)
- [기준 우측](before/stage05-right.png) / [1회차 우측](loop1/stage05-right.png)
- [기준 모바일](before/stage05-mobile-timber.png) / [1회차 모바일](loop1/stage05-mobile-timber.png)

## 물 판정 조사 · 규칙 미변경

`shared/map/compiler.js`는 conductive water-pool을 실제 battle.waters로 컴파일한다. 단순 그림만은 아니다. 그러나 `shared/engine/src/engine.ts`의 applyZones는 lava만 피해 처리하며 일반 water에는 익사/수영/안전 복귀 분기가 없다. integrateBody는 기존 solid 바닥에 착지시키므로 수면2900보다 낮은 웅덩이 바닥3200대에서 서서 공격할 수 있다. 물은 번개 전도/빙결에 쓰이고 waterfallPhysics는 투사체 저항 전용이다. 재사용 가능한 훅은 applyZones, integrateBody/contactSurface, recover(기존 낙사 회복), 물의 surface/bottom이다. 피해·같은 쪽 복귀·행동 종료는 별도 정책 확정 전 변경하지 않는다.

사용자 첨부는 Library 준비 성공 뒤 공식 전송 helper가 `download failed`로 실패했다. 이 작업자가 해당 JPEG 픽셀을 봤다고 주장하지 않는다. 위 판정은 코드와 새 로컬 게임 캡처 근거다.
