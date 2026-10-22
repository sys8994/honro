# 디버그 여정첩의 막 엔딩 기록 · 2026-10-22

브랜치 `fix/debug-journal-ending-records-20261022`. 시작 시 원격 최신 master는 `f8cc1a823a328c46f103156e0c1ac79b6efff90d`였다. 런타임/최종 빌드는 `b38b9a51fcf4731bbeafd00ea0d44103ad412efa`에서 확정했고, 별도 최종 캡처 실행 SHA는 `405ef2a9a7782f1ebbdb423b1deb3b7bfb6f270e`다. 이후 변경은 테스트와 문서·증거뿐이다. master 반영 및 Pages 배포는 부모 최종 검수 담당이며 이 브랜치에서 실행하지 않았다.

## 정확한 사용자 경로

1. 미클리어 1막에서도 **설정 → 기록·관리 → 검수 모드 → 디버그 모드 켜기**를 선택한다. 기존 동작대로 휴식터로 이동하며 최초 대화가 있으면 마친다.
2. 휴식터의 **여정첩**을 연다. 상단 **1막 / 2막 / 3막**을 선택하고, 필요하면 우측 위 **지도 맞춤(⛶)**을 누른다. 확대 상태에서는 지도를 드래그해 이동할 수 있다.
3. **10 / 20 / 30번 핀**을 선택한다. 하단의 **기록 → 막 엔딩 미리보기**를 누른다. 클리어 기록이나 보고서는 필요하지 않다.
4. 화면 터치 또는 Enter/Space로 계속 본다. 완료, 우측 위 **여정첩으로 돌아가기**, Escape, 브라우저/모바일 뒤로는 같은 여정첩으로 돌아온다. 원래 막·선택·확대·스크롤·DOM과 펼쳐 둔 기록 메뉴까지 보존한다.

**2막 20장 위치:** 지도 위쪽 왼편의 **20 ‘하늘로 난 출구’** 핀이다. 1막에서 디버그를 켠 미클리어 프로필로 상단 2막 → 지도 맞춤 → 20번 핀을 세로/가로 모두 실제 클릭해 확인했다. [세로 화면](final-records-20-390x844.jpg), [가로 화면](final-records-20-844x390.jpg). 지도 그림·핀 배치·지형은 이번에 변경하지 않았다.

설정의 기존 **막 엔딩 미리보기 → 1막/2막/3막**도 유지된다. 설정에서 연 엔딩은 설정으로, 여정첩에서 연 엔딩은 여정첩으로 돌아온다.

## 변경과 보존

이전 구현의 `replayButton`은 일반 모드·클리어 기록만 허용했고, `previewDebug`는 디버그 설정 모달만 허용했다. 이번에는 여정첩 10/20/30에 디버그 전용 메뉴를 표시하고 `previewJournal`로 별도 진입한다. 현재 선택한 장소인지, 디버그인지, 대화·모달·다른 재생이 없는지 검증한다. 일반 갤러리 API와 설정 API의 조건을 풀어 진입시키지 않는다.

기존 `captureBook`/`restoreBook`과 메모리 전용 엔딩 커서·재생기를 사용한다. 재생 중 앱 프레임을 멈추며 정산·클리어·해금·XP·seen·정상 저장을 수정하지 않는다. 실제 보고서가 없는 미클리어 디버그에서는 미리보기만 표시한다. 기존 보고서 조건과 일반 모드의 클리어 해금 조건은 유지한다. 그림·서사·통계는 만들지 않았다. 세 선택 메뉴와 복귀 버튼은 기존 44px 이상 터치 영역/전체화면 표시를 사용한다.

## 집중 검사와 별도 최종 픽셀 검수

| 검사 | 결과와 근거 |
|---|---|
| 집중 1 · 표시/진입/진행 | 미클리어 1막에서 UI로 디버그를 켠 프로필, 10/20/30 × 모바일 세로390×844/가로844×390 = 6건 통과. 실제 막 탭 → 지도 맞춤 → 마지막 핀 → 기록 → 미리보기 클릭. 각 막 핀 10개, 기록/미리보기 표시, 보고서/가짜 통계 없음, 첫 컷과 터치 진행, 잘못된 컨텍스트/다른 선택 진입 거절, 정확한 복귀 확인. [기록](review1-entry.json) |
| 집중 2 · 완료/종료/반복 | 같은 미클리어 조건 6건 통과. 4컷→제목→완료와 닫기/Escape/브라우저 뒤로를 각각 실행하고 반복 재생. 막·선택·레이어·확대·스크롤·root HTML 문자열까지 동일하며 원래 DOM/engine/Scene 객체와 열린 기록 메뉴 보존. [기록](review2-exit.json) |
| 집중 3 · 저장/표시 경계 | 미클리어 디버그 6건의 profile/normalProfile/live battle/모든 localStorage JSON 바이트 비교 및 재로딩 불변 통과. 완료된 디버그 30장의 특수 `end` 선택 2건도 복귀 통과. 일반 10/20/30의 직전 장까지만 완료한 경우/해당 장 완료한 경우 × 두 방향 12건: 미클리어 기록·다시보기 없음, 클리어에만 기존 기록·다시보기, 보고서 없는 fixture에 가짜 보고서 생성 없음. 총 20개 결과 행. [기록](review3-storage-and-normal-display.json) |
| 기존 일반 갤러리 | 기존 `act-ending-replay-browser.py --mode gallery` 통과. 해금 경계7건과 세 막 × 두 방향 갤러리6건: 완료/닫기/Escape/브라우저 뒤로/재로딩, 지도 상태·DOM·전체 프로필·저장 불변. [기록](normal-gallery-regression.json) |
| 기존 설정 미리보기 | 기존 `debug-act-ending-preview-browser.py --review entry` 6건 통과. 세 막 × 두 방향, 설정 전용 진입/정확한 설정 복귀·전체 상태 불변·컨텍스트 제외 조건 확인. [기록](settings-regression.json) |
| 별도 최종 실제 픽셀 | 확정된 빌드로 새 Chromium 컨텍스트에서 6건 재실행 통과. 아래 실제 JPG 14장을 직접 열어 세 막의 기록 메뉴·선택 핀·엔딩 그림/문구·복귀 메뉴와 모바일 가독성/잘림을 확인했다. 20번 핀은 두 방향에서 보이며 기록 버튼과 미리보기가 화면 안에 있다. [기록](final-summary.json) |
| 빌드/기본 진입 | `npm run build`, `node tests/web-split.mjs` 통과. 생성 자산 해시/바이트 수와 native/embedded 타이틀 진입, embedded 저장 보호, Workshop 직접 iframe 연결 확인 |

집중1 JSON의 HEAD는 구현 커밋 직전 `f8cc1a82…`이며 당시 수정 작업 트리로 실행했다. 집중2·최초 저장 검사·갤러리/설정 회귀는 `b38b9a51…`, 일반 표시를 포함한 집중3 및 최종 캡처는 `405ef2a9…`에서 실행했다. 런타임은 이 사이 변경하지 않았으며 모든 새 여정첩 검사 JSON의 `sourceHashes`는 최종 소스와 일치한다. 반복 재생 검사는 기존 화면 복귀의 350ms 터치 보호 시간이 끝난 뒤 수행한다. 성공 실행의 브라우저 예외와 HTTP 오류는 모두 0건이다.

## 실제 최종 빌드 JPG

원본 viewport를 JPEG quality85로 저장했으며 합성/크기 변환은 없다. 각 파일은 1MB 미만, 최대 110,672 bytes다. [파일 크기와 SHA-256](screenshots.json).

| 화면 | 세로390×844 | 가로844×390 |
|---|---|---|
| 10장 기록 메뉴 | [세로](final-records-10-390x844.jpg) | [가로](final-records-10-844x390.jpg) |
| 1막 엔딩 | [세로](final-ending-10-390x844.jpg) | [가로](final-ending-10-844x390.jpg) |
| 20장 기록 메뉴 | [세로](final-records-20-390x844.jpg) | [가로](final-records-20-844x390.jpg) |
| 2막 엔딩 | [세로](final-ending-20-390x844.jpg) | [가로](final-ending-20-844x390.jpg) |
| 30장 기록 메뉴 | [세로](final-records-30-390x844.jpg) | [가로](final-records-30-844x390.jpg) |
| 3막 엔딩 | [세로](final-ending-30-390x844.jpg) | [가로](final-ending-30-844x390.jpg) |
| 30장 원래 메뉴 복귀 | [세로](final-return-30-390x844.jpg) | [가로](final-return-30-844x390.jpg) |

## 재현/제한

```sh
npm run build
python tests/debug-journal-ending-records-browser.py --review entry
python tests/debug-journal-ending-records-browser.py --review exit
python tests/debug-journal-ending-records-browser.py --review storage
python tests/act-ending-replay-browser.py --mode gallery --out _local/reports/debug-journal-ending-records/normal-gallery
python tests/debug-act-ending-preview-browser.py --review entry --out _local/reports/debug-journal-ending-records/settings-regression
python tests/debug-journal-ending-records-browser.py --review final --out game/docs/debug-journal-ending-records-20261022
node tests/web-split.mjs
```

설치된 `/usr/bin/chromium`의 실제 로컬 HTTP 빌드를 사용했다. 모바일은 터치/viewport 에뮬레이션이며 실기기·Safari·Pages의 이번 변경은 미검증이다. 완료/미완료 표시 비교에는 명시적 진행 fixture를 사용했고 전장 완주 증거로 주장하지 않는다. 일반 승리 정산 코드는 변경하지 않았으며 이번에는 직접 관련된 갤러리·표시·설정 회귀만 검사했다. 전체 verify·지형·성능·기존 무관한 실패 수정은 수행하지 않았다. 이번 작업의 권한/보안 거부·미해결 쓰기는 없다.
