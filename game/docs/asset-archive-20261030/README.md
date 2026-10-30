# 과거 검수 산출물 보관 · 2026-10-30

현재 실행/제작 입력이 아닌 과거 검수 산출물만 작업 트리에서 제외한다. 검수 결과를 재실행하거나 실패 기록을 없앤 것이 아니다. Git 역사 용량이나 실제 게임 로딩 개선 수치와 구분한다.

## 복구 및 열람

[8개 과거 플레이 추적 목록](historical-traces.json)에 원래 경로·바이트·SHA-256·고정 원본 링크를 보존한다. 원격 GitHub API에서 commit `569e11123b2e077ef1f37aeaf92f44d131df73e5`와 tree `07ecb51f79ee0109a487885715bf8690adb733a4`의 접근을 확인했으며, 각 파일 blob이 이 tree와 정확히 일치함을 대조했다.

원본 링크에서 내려받거나 원본 commit을 보유한 checkout에서 `git restore --source=569e11123b2e077ef1f37aeaf92f44d131df73e5 -- <원래 경로>`로 복원하고 목록의 SHA-256을 검증한다. 이 작업 자체는 원격 쓰기를 하지 않는다.

Stage02-road-strategy의 `profile-terminal.json`, Stage02-layered-road의 `combat.json`, Stage08의 `normal-victory-profile.json` 등 현재 테스트 입력은 그대로 유지한다.

## 과거 미술 검수 이미지

[1,094개 PNG 목록](historical-art-review-images.json), 합계 166,077,727B를 동일 원격 snapshot으로 보관한다. 기존 Markdown/HTML 실제 이미지 링크는 고정 원본 URL로 연결했다. 과거 JSON의 캡처 경로·해시는 당시 기록 그대로이며 현재 파일 존재를 보증하는 manifest가 아니다. 현재 시안·Inkscape 원본·프로덕션 검수 gate·테스트 입력은 대상이 아니다.

## 과거 미술 검수 이미지

[2,145개 PNG/JPEG 목록](historical-dated-review-images.json), 합계 138,894,739B를 동일 원격 snapshot으로 보관한다. 기존 Markdown/HTML 실제 이미지 링크는 고정 원본 URL로 연결했다. 과거 JSON의 캡처 경로·해시는 당시 기록 그대로이며 현재 파일 존재를 보증하는 manifest가 아니다. 현재 시안·Inkscape 원본·프로덕션 검수 gate·테스트 입력은 대상이 아니다.

## 과거 미술 검수 이미지

[1,228개 PNG/JPEG 목록](historical-stage-review-images.json), 합계 292,574,554B를 동일 원격 snapshot으로 보관한다. 기존 Markdown/HTML 실제 이미지 링크는 고정 원본 URL로 연결했다. 과거 JSON의 캡처 경로·해시는 당시 기록 그대로이며 현재 파일 존재를 보증하는 manifest가 아니다. 현재 시안·Inkscape 원본·프로덕션 검수 gate·테스트 입력은 대상이 아니다.

## Stage34/39 authoring snapshot

[전체 프로젝트 JSON 4개](project-snapshot-compression.json)는 현재 제작 도구 입력이므로 삭제하지 않고 표준 gzip으로 무손실 보존한다. 도구의 snapshot reader/writer만 `.json.gz`를 사용한다. 일반 asset JSON, SVG, 시안, 현재 runtime 데이터는 바꾸지 않았다. `gzip -dc <파일.json.gz> > <파일.json>`로 원래 바이트를 복원하고 목록의 SHA-256과 비교한다.

## 과거 미술 검수 이미지

[1,302개 PNG/JPEG/WebP 목록](historical-other-doc-images.json), 합계 119,836,235B를 동일 원격 snapshot으로 보관한다. 기존 Markdown/HTML 실제 이미지 링크는 고정 원본 URL로 연결했다. 과거 JSON의 캡처 경로·해시는 당시 기록 그대로이며 현재 파일 존재를 보증하는 manifest가 아니다. 현재 시안·Inkscape 원본·프로덕션 검수 gate·테스트 입력은 대상이 아니다.
