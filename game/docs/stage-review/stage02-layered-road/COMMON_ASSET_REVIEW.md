# 2장 공통 자산 교정 — 미술 실패, 배포 금지

실행 소스91527da40c71792eaa311a47e907a61cd6216a75. 145ab2f48a57635cc0d7e5abdf6797ec44d25d73의 스킬 UI/미리보기 원본을81be8e4c로 작업 브랜치에 병합했다. 보호 대상5파일은 master와 바이트 동일하다. master/Pages는 변경하지 않았다.

**공통 연결은 구현했으나, 실제 화면에서 큰 단색 벽·분리된 판 암턱·밑동 접점이 여전히 부족해 미술을 실패로 기록한다.** 새로운 전용 색면으로 대신하거나 테스트 통과로 미술 합격을 만들지 않았다.

## 실제 자산/정의/호출 증거

| SOP/환경 스킬 적용 | 정의/원본 | 실제 연결 |
|---|---|---|
| 승인된 공통 소나무 | `tools/environment/build-act1-art.mjs:13`, `shared/assets/environment/act1-scene-rooted-pine.svg` | `act1-scene:rooted-pine`3개. `act1-scene-composition.mjs:53`부터 기존 place→surfaceAt→rootContacts→L1-back. scale .92/.68/1.15, 원래 범위 .3–2.4 내 균일 scale |
| 낮은 공통 암석 | `shared/map/environment.js:192` | `env:rock`3개, scale1.1/.7/.85, 원래 범위 .7–1.3. 초기의 큰 valley-granite 반복 배치를 실제 검수 후 제거했다 |
| 같은 공통 벡터 호출 | `shared/runtime/elements.js:4` | 기존 Scene.landmark→HonroVectorArt.draw/Geometry.shapes. 나무/바위 경로를 장별로 복사하지 않았다 |
| 공통 암반 재질 | `shared/runtime/act1-spatial-art.js:124` | 원래 지형 칠 코드를 drawTerrainMaterial로 추출. 실제 지형은 기존 S.terrain이 호출하고 뒤 실루엣은 `stage2-layered-road-art.js:9`에서 walkRim:false로 호출 |
| 충돌과 그림 구분 | `stage2-layered-road-art.js:5` | 승인된 뒤 절벽 실루엣을 메모리의 시각용 rock/cliff 뷰로만 만들며 b.terrain에 추가하지 않는다. 실제 발판은 원래 공통 재질/윤곽선을 사용한다 |
| 옛 Continue 자산 | `stage2-layered-road-art.js:14` | asset 없는 native kind:ravinePine을 렌더 뷰에서만 canonical-element/공통 소나무로 해석. 실제 R3 옛 소나무3개의 공통 벡터 draw 호출을 검사했다. 저장은 수정하지 않는다 |

이전 west/east/feet/roadPlanes 목록, 전용 도로/암턱 칠, 전용 윤곽 예외를 삭제했다. 그 좌표 목록을 공통 파일로 옮기지 않았다. 공통 재질에서 사용한 정규화 절리 패턴은 원래 있던 캐니언 재질 코드이며 새 장별 색면이 아니다. 기존 지형·상여180→4100·이동/사격 경로·인물·스토리·이벤트·보상·저장 revision·캠페인 JSON 전체는 그대로다.

## 실제 화면 검수

- 집중1회 `common-v3/review1`: 전체와 도로에서 공통 소나무/재질 연결을 확인했다. 큰 어두운 벽과 작은 판 암턱 문제가 남았으며 큰 동일 화강암3개는 밑동으로 부적합했다.
- 집중2회 `review2`: 공통 env:rock으로 낮추고 나무 전체/밑동/수관·암턱 근접을 직접 열었다. 소나무는1장과 같은 조형으로 읽혔지만 절벽 연결은 해결되지 않았다.
- 집중3회 `review3`: 세로 일반/최대축소·가로·도로에서 두 층과 상여 왼쪽 출발은 보존됐고 벽면/암턱 미술은 실패임을 다시 확인했다.
- 별도 최종 `common-v3/final`: 최종 소스의8개 화면을 모두 직접 열었다. 도입 대사 및 실제 R3 저장 재개도 새 소스로 확인했다. 횟수로 미술 통과를 만들지 않았다.

같은 카메라의 [이전 전체](common-v3/before/stage02-overview.png)/[현재 전체](common-v3/final/stage02-overview.png), [이전 도로](common-v3/before/stage02-road-start.png)/[현재 도로](common-v3/final/stage02-road-start.png)를 보존했다.

1장 기준은 `common-v3/reference/stage01-normal.png`를 직접 열어 비교했다. 캡처 표기 SHA543bbb12와 승인51e0b2b 사이 해당 실행/자산 소스 차이는 없다. 소나무 SVG는51e0b2b와 현재 바이트 동일하다. 또 공통 재질 추출 전후1장 실제 native Canvas PNG hash가 완전히 동일함을 검사했다.

4번 시안 `libfile_a0dfd3bd4ffc81918d26cc73f0cc969a`는 Library에서 파일명/이미지 참조를 확인했으나 로컬 다운로드 helper가 `download failed`로 실패했다. 거부라고 단정하지 않으며 다른 URL 방식으로 우회/재시도하지 않았다. 따라서 이번 실행에서4번 원본 픽셀을 직접 비교했다는 주장은 하지 않는다. 앞길/뒤 절벽/왼쪽 상여 구도는 부모가 직접 확인해 전달한 기준을 보존했다.

## 부족한 공통 자산과 필요한 역할

자산 이름/실제 bounds/scaleRange를 `common-v3/asset-inventory.json`에 기록했다. 단일 공통 모듈을 찾지 못한 것이며 모든 자산이 작다고 일반화하지 않는다.

| 후보 | 실제 범위/부족 |
|---|---|
| env:cliff | native405×1008, scale .75–1.25. 기준 foot 위 높이는308이라 허용 최대에서도 약385다. 약2280높이 전체 야외 절벽이 되지 않는다 |
| act1-scene:valley-granite |1170×632, scale .5–2.4. 발 위 높이610×2.4=1464로 부족하며 최대확대로 억지 맞추지 않았다. 중간 바위로는 재사용 가능하다 |
| act2:rock-column |301×755, scale .4–4. 높이는 충족할 수 있으나 공동의 좁고 뾰족한 암주다. 야외 넓은 수직 암벽 대신 같은 암주를 반복하지 않았다 |
| stage11/12/14/30 등의 대형 암면 | 해당 장 terrain/공간에 맞춘 전용 자산이며 이번 문제를 다른 장 전용 도형 붙여넣기로 바꾸지 않았다 |

필요한 것은 native 크기 약 **폭1600–2200×높이2200–2400**의 서로 다른 좌/우 야외 절벽 덩어리 또는 같은 범위를 구성하는 검증된 공통 모듈이다. 큰 절리·중간 돌출·도로 뒤 암반 밑동과, 실제 암턱 뒤로 후퇴해 붙는 **폭350–700×높이300–650** 지지 모듈이 필요하다. 배경 전용 면에는 보행 테두리/충돌이 없어야 하며 외곽 카메라까지 이어지는 접점이 있어야 한다. 임의 확대·격자 복제·이미지 근경 생성으로 대신하지 않았다. 기존 공통 재질 호출은 유지보수 정리는 충족하지만 이 조형 자산 부족을 해결하지 못했다.

## 관련 검사와 한계

build/web-split 통과. `stage2-layered-art-invariants.mjs`에서 새 시작/실제R3/실제 승리R21 전체 렌더 상태 불변, warmed 미술 Path2D 할당0, 세계/타일 캐시 재사용, 초기 고지 실제 화살74피해, 공통 자산 scale/호출,1장 PNG 동일을 통과했다. `stage2-layered-navigation.py`로 최종 소스의 도입/실제R3 Continue/실제R21 보상/담허 동행/쉼터/3장 진입을 통과했다. 이전21라운드 정상 자원 호위 승리는 보존하며 전투 전체를 재실행하지 않았다. 기존 담허 M06→LM06 정규화 한계는 유지한다. 전체 회귀/전30장 완주/미술 통과/배포 성공을 주장하지 않는다.

실패 후보 전체 원본 한 장은 Library에 저장됐다: `libfile_6c5e9911916481919a2403095a205240`. 저장 때 소스f33704d7이며 Continue 전용 수정91527da4의 새 최종 진입 캡처와 byte 동일하다. 새 이미지 생성·편집은 없었다. `LIBRARY.json`, `SOURCES.json`, 검사 로그 및 원본 PNG를 브랜치에 보존한다.
