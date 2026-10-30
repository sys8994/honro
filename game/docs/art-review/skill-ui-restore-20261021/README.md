# 스킬 UI 복원 검수 — 2026-10-21

- 구현 커밋: `007fe2e05544662cac67371138a46100036c5034`, 브랜치 `codex/restore-skill-ui`.
- 기반 master: `d7244a8adc9a5419f8771dd9f80b94464359fbd8`.
- 복원 기준: UI 개편 `83a0cb20adf11dcf0703305ff25f780eee710e6b` 직전 `84a0003e171bf27fc60bfaec311b266d0ba64067`의 `campView()` 전체. 현 복원 함수와 역사 함수는 바이트 단위로 일치한다.
- 모닥불 CSS만 개편 전으로 복원했다. 모달 상단 장착/해제/회수/강화, 시연, 장착 확정, 명시적 빈 슬롯, 현재 환불/저장 경로는 유지했다. 밸런스·성장·저장 스키마·인트로·음악·지형 소스 변경 없음. 중단된 압축형 UI는 stash에 보관하고 적용하지 않았다.

## 캡처

`before-tree-*`는 수정 전 d7244a8의 모닥불이다. `historical-84a0003e-tree-*`는 동일한 d7244a8 실행 환경에 역사 camp 함수와 역사 스타일만 적용해 재현한 비교 기준이다. `restored-tree-*`는 최종 복원 코드다. 같은 프로필과 같은 위치에서 캡처했으며, 360/390/1280px 모두 역사 기준과 최종 복원 캡처의 RGB 차이 영역이 없다(Pillow ImageChops `getbbox() == None`). 전체 게임을 역사 버전으로 돌렸다는 의미가 아니다.

`restored-invested-*`는 4인에게 기존 규칙으로 계열별 1점을 투자한 격리 프로필의 바/전체 SP/장착 표시다. `restored-modal-*`는 실제 시연이 발사된 뒤의 모달 상단 버튼과 투자 바다. 캡처들은 테스트 브라우저의 독립 프로필이며 사용자 저장을 사용하지 않는다.

대표 비교: [개편판 모바일](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/art-review/skill-ui-restore-20261021/before-tree-390.png), [역사 모바일](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/art-review/skill-ui-restore-20261021/historical-84a0003e-tree-390.png), [복원 모바일](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/art-review/skill-ui-restore-20261021/historical-84a0003e-tree-390.png), [복원 데스크톱](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/art-review/skill-ui-restore-20261021/historical-84a0003e-tree-1280.png), [상단 버튼 모바일](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/art-review/skill-ui-restore-20261021/restored-modal-360.png), [상단 버튼 데스크톱](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/art-review/skill-ui-restore-20261021/restored-modal-1280.png).

## 검증

1. 화면/이력 검수: 원래 패널 순서, 모바일 계열 탭, 데스크톱 4계열, 단계·이름·8칸 투자 바·SP 숫자를 비교하고 세 폭에서 역사 캡처와 일치함을 확인했다.
2. 조작/상태 검수: 실제 modal 버튼으로 4인×4계열 강화/회수와 상단 고정, 목록 터치 증감과 상세 오작동 방지, 0/잠금/최대/잔여 SP 소진/환불을 확인했다.
3. 크기/저장 회귀: 360/390/1280px, 가로 넘침, 상세 스크롤, 변경 없는 전체 프로필, 증감 원복의 성장/장착 보존, 새로고침 후 XP·투자·단련·장착 전체 프로필 일치를 확인했다.
4. 최종 확인: 최종 소스의 캡처를 열어 비교했고 실제 시연·상단 버튼·8칸 바가 보인다. 아래 focused 검사와 생성물 기본 진입을 통과했다.

- `npm run build`: 성공.
- `node tests/camp-skill-ux.mjs`: 성공. 장착/해제/슬롯 교환/환불/상세 스크롤/시연/빈 슬롯 저장 포함.
- `python tests/skill-ui-restore-browser.py`: 139개 확인, pageerror 0. [결과](checks.json).
- `node tests/web-split.mjs`: 생성물 해시/바이트, 재조립 캠페인, Game/embedded 진입, embedded 저장 보호, Workshop iframe 5그룹 성공.
- `git diff --check`: 성공.

기존 `node tests/sp-balance-app-resume.mjs`는 오래된 23장 전투 fixture를 현재 지도와 비교하는 “battle progress, in-flight state, items, objectives and old XP ledger stay fixed” assertion에서 실패한다. UI 수정 전 d7244a8의 독립 checkout에서도 동일 실패를 확인했다. 이번 UI 복원은 해당 전투/지도/성장 코드에 손대지 않았다. 새 집중 브라우저 저장 검사는 통과했다.

Library 이미지 업로드는 `hosted apps tools/call request failed: network`로 실패했다. 캡처를 이 Git 경로에 보관했으므로 부모가 파일을 받아 첨부할 수 있다. Library 성공으로 기록하지 않는다. 실제 휴대폰 하드웨어가 아닌 Chromium 터치 에뮬레이션이다. 전체 캠페인 전투·전체 verify는 실행하지 않았다.

master/Pages는 인트로·음악 작업의 선행 통합 순서를 기다린다. 이 결과는 통합 전 보고이며 사용자 승인 대기가 아니다. 부모는 최신 원본을 병합한 다음 공유 HTML/web을 다시 빌드해야 한다.

## 최신 master 통합 — 2026-10-21

부모가 인트로·음악 선행 통합과 캡처를 확인한 뒤 스킬 복원 통합을 지시했다. `eab4fdbbeba902e7e996ea73b57e2211bc2c5318`을 병합하고 생성 파일 충돌 4개는 최신 master 참조를 기준으로 원본 재빌드했다. 통합 구현은 `d757d31c32cced5a7e1bab4d6bf9fc2bd0043c61`이며 master push가 확인됐다. 동일 소스에서 build/camp-skill-ux/web-split/music-titles와 실제 브라우저 139개 확인을 다시 통과했다. [통합 브라우저 결과](integrated/checks.json), [모바일 상단 버튼](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/art-review/skill-ui-restore-20261021/integrated/restored-modal-360.png), [데스크톱 상단 버튼](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/art-review/skill-ui-restore-20261021/integrated/restored-modal-1280.png), [투자 바 모바일](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/art-review/skill-ui-restore-20261021/integrated/restored-invested-390.png).

인트로·음악·곡명 소스는 선행 master와 동일하며 숫자 접두사 없는 승인 곡명 검사도 통과했다. 기존 23장 성장 회귀 테스트는 변경하지 않았으며, 수정 전 master에서도 실패하는 별도 이슈라는 앞선 기록을 유지한다.

기존 Pages 배포 `39543275258`이 master push로 시작됐다. 이 실행 환경에서 공개 `https://sys8994.github.io/honro/HONRO.html` 읽기는 `Tunnel connection failed: 403 Forbidden`으로 차단됐다. 같은 주소를 다른 경로로 우회하지 않았고, 공개 Pages 실제 화면 검증을 통과로 기록하지 않는다. CLI의 Pages/Actions API 읽기 역시 403이었으므로 해당 요청을 반복하지 않았다. GitHub 연결의 커밋 check-runs와 해당 workflow jobs 조회로 배포를 추적한다. 배포 최종 결과와 최종 SHA는 인계 응답에서 별도로 확인한다. 위 캡처들은 최신 통합 빌드의 실제 로컬 Chromium 화면이다.

통합 브라우저에서 [인트로 오버레이](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/art-review/skill-ui-restore-20261021/integrated/intro-preserved-390.png)의 상단 공간 미예약을 computed position으로 확인했다. 실제 설정 버튼 터치로 음악을 깨운 뒤 들리는 스트림의 우하단 표시가 `떠나지 못한 이들을 위해`라는 순수 승인 제목임을 확인하고 [모닥불과 곡명](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/art-review/skill-ui-restore-20261021/integrated/camp-with-approved-music-title-390.png)을 캡처했다. [결과](integrated/intro-music-preservation.json).
