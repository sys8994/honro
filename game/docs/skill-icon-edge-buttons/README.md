# 스킬 아이콘 가장자리 채움 개선

완료 상태: 구현, 3회 집중 픽셀 검수와 보완 검수, 별도 최종 전체 검수를 마치고 브랜치에 커밋·푸시했다. 부모의 최종 검토와 master 통합·Pages 배포를 기다린다.

- 기준 소스: `0a9acf40396452e2f424cd9731f8f91f3478da03`.
- 브랜치: [feat/skill-icon-edge-buttons](https://github.com/sys8994/honro/tree/feat/skill-icon-edge-buttons).
- **정확한 최종 실행 소스 SHA: `7027b626c4022f4e95b6350d858ade57b9ed8012`**. 이후 커밋은 이 보고서와 검수 증거만 추가한다.
- 실행 소스 변경은 `game/src/skill-icons.css` 한 파일이다. 관련 브라우저 회귀 검사와 문서, 정상 빌드 생성물을 함께 커밋했다. 런타임·엔진·자산·맵·밸런스·공통 설정·보고서 기능은 변경하지 않았다. [범위 감사](evidence/scope-audit.json).
- master 병합과 Pages 배포는 수행하지 않았다.

## 원인과 변경

전투 버튼은 52×45 등 기존 조작 크기를 사용하지만 이미지는 32~36px로 별도 고정되어 작은 검정 타일과 둥근 바깥 프레임이 겹쳤다. 모닥불의 `skill-stamp`와 허공터의 `i` 래퍼도 작은 이미지를 가운데 배치했다.

이미지와 프레임 사이의 DOM padding/margin을 제거하고, 프레임 내부 전체를 이미지로 채웠다. 아이콘 모서리는 `border-radius: 0`, 기본 테두리는 `#c5a45c`, 선택은 `#f0c66d`다. HUD 이름은 아래쪽, 단축키·MP·재사용 회수는 위쪽의 작은 어두운 오버레이로 읽을 수 있게 했다. 중심 문양은 그대로 드러난다. 상세의 작은 비기·상시 표식도 유지하고 줄바꿈을 방지했다.

| 변경 사용처 | 적용 방식 |
| --- | --- |
| 전투 HUD 네 스킬 버튼 | 이미지가 기존 버튼 내부 전체를 채움. 선택·포커스·기력 부족 점선·행동 제한 disabled·빈 슬롯 유지 |
| 모닥불 출전 슬롯·궁극기·기예 트리 | `skill-stamp`의 단일 사각 프레임을 이미지로 채움 |
| 스킬·상시 기예 상세 | 84개 실제 상세 헤더에 같은 프레임 적용. 경지·수련·장착·닫기 유지 |
| 상시 기예 요약 버튼 | 직접 사용하는 `skill-art`에 단일 사각 프레임 적용. 이름·경지·키보드 접근 유지 |
| 장착 후보·슬롯 비교 | 스탬프 내부 채움과 선택 색상 적용. 외부 카드 형태 유지 |
| 허공터 선택 카드·선택한 기예 상세 | `i` 래퍼 내부를 채움. 액티브·상시 선택 표시 유지 |
| 허공터 상단 현재 기예 | 직접 사용하는 `skill-art`에 같은 사각 테두리 적용 |

카드·모달·동행 선택 버튼의 둥근 모서리는 유지한다. HUD는 기존의 약간 직사각형인 조작 영역에 **원본 전체를 맞춰 표시**하므로 그 표시 비율만 CSS로 조정한다. 수련·상세 스탬프는 정사각형이다. 이미지를 자르거나 원본 내부의 회화적 여백을 제거하지 않았다.

## 원본 보존

원본 WebP **84개, 총 504,894바이트**가 기준 소스와 바이트 단위로 모두 같다. 빌드의 `web/graphics` 아이콘 84개도 원본과 SHA-256 집합이 같다. 이미지 생성·재생성·편집은 수행하지 않았다.

- [파일별 바이트 및 SHA-256 감사](evidence/asset-byte-audit.json)
- [빌드 아이콘과 소스 범위 감사](evidence/scope-audit.json)
- [84개 메타데이터·이미지·strict manifest 검사](evidence/skill-image-icons-검사.txt)

## 픽셀 검수

모든 검수는 실제 로컬 프로덕션 빌드와 Chromium `154.0.8037.57`을 사용했다. 준비한 프로필과 실제 허공터를 사용했으며 캠페인 완주 검수는 아니다. 자동 측정 후 JPG를 직접 열어 여백·프레임·문양·문구·상태·배치를 확인했다.

| 순서 | 확인 내용 | 결과 |
| --- | --- | --- |
| 1차 집중: 여백·프레임 | 네 동행의 트리·상시 기예·출전 슬롯, 84개 상세, 장착 목록/비교, HUD. 비기 표식 줄바꿈 보완 | 최초 111개 통과. 허공터 추가 사용처 보완 후 114개 통과. [기록](evidence/frame-results.json) |
| 2차 집중: 상태·가독성 | 잠금/수련 불가, 선택, 기력 부족, 재사용 회수, 실제 후속 검술 제한, 빈 슬롯, 숫자키/Enter/포커스, 터치, 실제 404 폴백 | 15개 통과. [기록](evidence/state-results.json) |
| 3차 집중: 반응형 조작 | 390×844·844×390·360×800·1280×900. 기존 CSS와 조작/전장 좌표 대조, 실제 터치 조이스틱 잡기/해제·발사 충전/해제·스킬 선택, 상세 스크롤/닫기 | 45개 통과. [기록](evidence/responsive-results.json) |
| 별도 최종 전체 검수 | 확정 소스 `7027b626c4022f4e95b6350d858ade57b9ed8012`에서 모든 사용처·84개 상세·상태·4개 화면 크기·허공터를 합쳐 다시 검사하고 대표 JPG를 직접 열어 확인 | **176개 통과, JavaScript 실행 오류 0개.** [최종 기록](evidence/final-results.json) |

390×844에서 스킬 버튼은 기존 52×45, 360×800은 44×45, 844×390은 50×50이다. 버튼·전장·조이스틱·도약·하강·방어·발사의 위치와 크기는 기준 CSS를 같은 DOM에 적용한 결과와 모두 같다. 이미지는 테두리 안쪽까지 채워지고 추가 내부 간격은 측정상 0이다. 표시 중인 프레임은 모든 면에서 0.6px 미만 허용 오차로 검사했다.

전체 JPG는 **62개, 파일당 최대 90,702바이트**로 모두 1MB 미만이다. 합성 화면이나 생성 이미지는 포함하지 않았다. [JPG 규격 감사](evidence/jpg-audit.json).

| 대표 증거 | 실제 JPG |
| --- | --- |
| 변경 전 | [전투 HUD](evidence/before-hud-390.jpg), [모닥불](evidence/before-camp-390.jpg), [상세](evidence/before-detail-390.jpg) |
| 최종 전투 HUD | [390×844](evidence/final-hud-390.jpg), [844×390](evidence/final-hud-844.jpg), [360×800](evidence/final-hud-360.jpg), [1280×900](evidence/final-hud-1280.jpg) |
| 모닥불과 상세 | [트리](evidence/final-tree-390.jpg), [상시 기예와 출전 슬롯](evidence/final-passives-390.jpg), [급소시](evidence/final-detail-A14-390.jpg), [관통시](evidence/final-detail-A02-390.jpg), [상시 상세](evidence/final-detail-AP01-390.jpg), [장착 비교](evidence/final-equip-390.jpg) |
| 상태 | [키보드 포커스](evidence/final-hud-focus-390.jpg), [기력 부족](evidence/final-hud-unaffordable-390.jpg), [재사용 대기](evidence/final-hud-cooldown-390.jpg), [행동 제한](evidence/final-hud-disabled-390.jpg), [잠금](evidence/final-locked-detail-390.jpg), [빈 슬롯](evidence/final-hud-empty-390.jpg), [404 벡터 폴백](evidence/final-fallback-hud-390.jpg) |
| 허공터 | [기예 목록](evidence/final-training-library-390.jpg), [상시 선택](evidence/final-training-passive-390.jpg), [상세 아이콘](evidence/final-training-detail-390.jpg), [가로 화면](evidence/final-training-844.jpg) |

## 빌드와 관련 회귀 검사

| 명령 | 결과 |
| --- | --- |
| `npm run build` | 통과. [출력](evidence/build-검사.txt) |
| `npm --prefix game run typecheck` | 통과. [출력](evidence/typecheck-검사.txt) |
| `node tests/skill-image-icons.mjs` | 통과. 84개 원본·메타데이터·manifest 오류 거부 검사 |
| `node tests/camp-skill-ux.mjs` | 통과. 장착·교체·환불·스크롤·저장·기본/궁극기 가드 |
| `node tests/training-layout.mjs` | 통과. 허공터 배치·프로필 보존·수련 동작 |
| `node tests/portrait-framing.mjs` | 통과. 기존 초상 구도 |
| `node tests/web-split.mjs` | 통과. 최종 빌드 자산 해시·Game/embedded 진입·Workshop 연결·저장 보호 |
| `python tests/skill-icon-edge-buttons-browser.py frame` | 114개 통과 |
| `python tests/skill-icon-edge-buttons-browser.py state` | 15개 통과 |
| `python tests/skill-icon-edge-buttons-browser.py responsive` | 집중 검수 45개 통과. 최종 검사에서는 허공터 4개 화면 검사를 추가 |
| `python tests/skill-icon-edge-buttons-browser.py final` | 확정 실행 소스에서 176개 통과 |

[명령별 회귀 결과](evidence/regression-results.json). `npm run test:ui-buttons` 묶음은 첫 `ui-buttons` 검사에서 멈췄으며, 뒤에 있는 관련 검사들을 위처럼 각각 실행했다.

다음 다섯 실패는 별도 기준 소스 worktree에서도 재현했다. 저장소 경로를 정규화하면 **각 검사의 실패 전체 출력이 수정 후와 완전히 같다**. 기존 테스트 코드는 수정하지 않았다.

| 기존 실패 | 원인과 증거 |
| --- | --- |
| `ui-buttons` | 설정 최상단에 이전 단일 화면의 `minimap-setting` label을 기대함. [기준 출력](evidence/ui-buttons-기준소스.txt) |
| `combat-action-layout` | 특정 주석 이후 파일 전체에 `font-size`가 없다고 검사하여 기존 상세 모달 CSS와 충돌. [기준 출력](evidence/combat-action-layout-기준소스.txt) |
| `passive-status-layout` | 이전 `@media(max-width:620px)` 계약을 기대함. [기준 출력](evidence/passive-status-layout-기준소스.txt) |
| `character-info` | 기존 선택 유닛 기대값 `mage-test`와 실제 `p0` 불일치. [기준 출력](evidence/character-info-기준소스.txt) |
| `camp-stat-formatting` | 기존 기대값 `15.12`와 실제 `15.32` 불일치. [기준 출력](evidence/camp-stat-formatting-기준소스.txt) |

## 한계와 인계

전체 `npm run verify`, 전 30장 완주, 성능 검사, 실물 휴대폰 및 Safari는 미실행이다. 이번 CSS 범위의 관련 검사와 실제 Chromium 화면/터치 검수를 수행했다. 기존 테스트 실패를 이번 변경의 통과로 집계하지 않았다.

첨부 화면 `libfile_cc8ebb7f5610819180d34f0efe98e314`, `libfile_9017a41ed27081919fc8f331dcefaec2`는 이 환경에 Library 읽기·다운로드 도구가 노출되지 않아 직접 열지 못했다. 거부되거나 결과가 불명인 원격 쓰기는 없다. 제공된 문제 설명을 기준으로 실제 게임 화면에서 확인하고 수정했다.

빌드는 정상 생성기로 수행했으며 현재 실행 자산과 이전 캐시 세대의 보존 목록이 갱신됐다. 병행 브랜치와 통합할 때 생성물 충돌은 부모가 합친 소스에서 `npm run build`로 다시 만드는 것이 적절하다. 원본 런타임이나 설정을 수동으로 덮어쓰지 않는다. 부모는 이 브랜치를 검토한 뒤 master 통합과 기존 Pages 배포를 진행하면 된다.
