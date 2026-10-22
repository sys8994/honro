# 아이콘 독립 체크포인트

아이콘 runtime checkpoint: **c04218e4f4761b2d19e457131aae2e2a85fae3a6** (master **275144983f93d0de66bbe6f44ede88a82ca36b56** 기반). 이 커밋은 여정첩 변경 없이 독립 빌드·배포 가능하다. 이 문서를 포함한 다음 문서/검사 커밋까지 배포해도 런타임은 동일하다. master 병합/Pages 배포는 부모 담당이며 이 브랜치에서는 하지 않았다.

## 원인과 변경

`updateHUD`는 선택/기력/턴 변화와 강제 갱신 때 combat-skills.innerHTML을 교체했다. 새 아이콘은 네트워크 캐시가 있어도 available→observed→loading→ready를 반복해 벡터를 재노출했다. 모닥불의 showCamp 역시 루트 전체를 교체했다.

전투는 스킬 ID 키로 버튼/아이콘을 유지하고 비용·이름·선택·disabled 등 변경 속성만 갱신한다. 순서 교체는 기존 버튼을 이동한다. 기력만 바뀌면 초상 버튼도 유지한다. 모닥불은 같은 action/slot/skill 키의 노드를 조정하고 동일 스킬 아트 서브트리는 보존한다. 매 프레임 동일 상태는 서명 비교로 건너뛴다. 캐시 준비 상태를 마크업 생성에도 동기 반영하므로 준비된 스킬의 새 표면도 벡터 상태로 되돌리지 않는다.

타이틀은 아이콘 요청/decode 0. 보이는 HUD/모닥불 아이콘을 먼저 요청하고 그 뒤 idle 작업으로 나머지를 동시 최대 4개 큐에서 준비한다. 시작/조작을 84장 준비에 묶지 않는다. 캐시 최대 84개(현재 256px 원본 RGBA 약 21MiB); 엔트리는 페이지 수명 동안 공유하고 상한 초과 완료 엔트리를 정리한다. 요청 완료 시 이벤트 핸들러를 제거하고 제거된 DOM은 관찰을 해제한다. 오류는 영구 벡터 폴백이며 30초 뒤 새 표면 요청 시 최대 3회 자동 재시도, online 또는 명시 retry로 복구 가능하다. 이미지 바이트·amber 사각 테두리/여백 0 스타일·debug/normal 저장 코드는 유지했다.

## 실행과 증거

2026-10-22, 실제 headless Chromium **154.0.8037.57**, 로컬 정식 외부 모듈 빌드. 런타임 실행 SHA는 위 c04218e4이고 검사 파일 SHA/정확한 파일 바이트는 [icon-source.json](evidence/icon-source.json), 결과는 [icon-results.json](evidence/icon-results.json). 기존 master도 /tmp/honro-icon-baseline 별도 worktree에서 같은 빌드/브라우저로 재현했다.

```sh
npm install --ignore-scripts --cache /tmp/honro-npm-cache
npm --prefix game install --ignore-scripts --cache /tmp/honro-npm-cache
npm run build
npm --prefix game run typecheck
python tests/icon-cache-journey-browser.py
node tests/skill-image-icons.mjs
node tests/camp-persistence.mjs
node tests/camp-skill-ux.mjs
```

- 30회 실제 클릭 + 30회 선택/기력 갱신, MutationObserver: 기존 master 버튼 생성/삭제 각각 **240**, 버튼·아이콘 identity 모두 소실, 비-ready/SVG 관측 **792**(mutation 관측 수이며 실제 표시 프레임 수로 해석하지 않음). 네트워크 재요청은 원래도 0이므로 네트워크 캐시만으로 해결되었다고 할 수 없다.
- 수정본 버튼·아이콘 identity 4/4 유지, 생성/삭제 각각 **0**, SVG 노출 관측 **0**, src 재설정 **0**, load/decode 추가 **0**, resource 추가 **0**. 찬 캐시 준비와 따뜻한 재사용을 구분했다. 찬 캐시 배경 전체 준비는 약 505KB이며 실제 전송량은 JSON에 기록했다(같은 URL의 img 표면 reuse resource 항목이 포함될 수 있음).
- 장착 순서 교체 identity 유지, 실제 버튼 선택 aria-pressed 확인, 기력 부족 표시와 skillAllowed 잠금 확인. 현행 재설계 스킬은 cooldown이 null이므로 **A99 cooldown=2 검사 전용 fixture**로 기존 cooldown 표시 계약을 확인했다. 게임 밸런스는 수정하지 않았다.
- 네트워크 A01 abort→벡터 오류 폴백→요청 차단 해제→명시 retry→ready 복구 확인. 모닥불 rank/stat 갱신 때 아이콘/기예 버튼 identity 유지.
- 기존 84개 manifest/스킬 수치·이름·플래그·원본 SHA 검사 통과. camp-persistence 11사례, camp-skill-ux 장착/해제/교체/저장/전투 계약 통과. build/typecheck 통과.
- 실제 [수정 HUD JPG](evidence/icon-fixed.jpg), [기준 HUD JPG](evidence/icon-baseline.jpg)를 직접 열어 amber 사각 아이콘과 작은 오버레이/여백을 확인했다. 각 1MB 미만.

검사는 허공터와 프로필 fixture이며 전체 정상 캠페인/실물 모바일 검수가 아니다. 최초 미준비 이미지 로딩과 실제 오류에는 기존 벡터가 의도적으로 표시된다. 준비 완료 후 반복 선택의 SVG 재노출과 구별한다. 페이지 종료 이후 디코딩 메모리 보존을 주장하지 않는다. 별도 feat/stage-clear-report 및 fix/joystick-aim-sector-release와 최종 master 통합/빌드 검증이 필요하다.
