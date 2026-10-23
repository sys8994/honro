# 묵종 BGM ducking — 미완료 보존

부모의 작업 중단/보존 지시에 따라 구현 초안과 생성물을 WIP로 저장했다. 환경 명령은 마지막 확인 때 정상 실행됐다. master/Pages는 변경하지 않았고 이후 새 구현/재검사는 하지 않는다.

초안 파일은 shared/engine/src/bgm.ts, sound-design.ts, shared/runtime/mukjong-audio.js, main.js다. 같은 실제 source.start 성공 뒤에만 BGM duck을 호출하고 별도 배율0.63/140ms attack/900ms release, 마지막 소리의 duration/rate 기준 plateau, 비누적 중첩·pause/mute/scene clear를 구현했다. 설정값/소리 원본/SFX 볼륨을 변경하지 않는다. 아직 브라우저 검증 완료본이 아니다.

확인된 결과:
- tests/mukjong-bgm-duck.mjs 통과: 실제 BgmPlayer 수학/가짜 media·시간, hook의12/18 실제 source.start 카운터, 실패/음소거 미작동, 중첩/복귀/설정 보존.
- tests/mukjong-audio.mjs 기존 회귀 통과.
- npm run build 통과. 마지막 생성 진입점 game.4e1b47a04affd72a.js.
- tools/testing/mukjong-bgm-duck-browser.py는 첫 before.factor===1 assertion에서 실패했다. 초기 fixture/실제 제품 원인은 아직 구분하지 않았다.12장 재생 뒤 볼륨과 후속18장/복귀의 브라우저 검사는 완료되지 않았다. 중단 뒤 원인을 더 조사하지 않았다.

완료된 UI/P0는 카드b3339899, 정보초상3561a2f3, 수비78ab2808, 보스a64c5896, 일반서술0c752898이다.78ab2808에서 기준cf2 활성 그래프와 기존 공개33개를 별도로 정확히 복원/검증했다. 그 이후 여러 중간 빌드를 만들었으므로 이번 WIP의 최종 통합은 기준cf2 활성 그래프 보존을 다시 확인/복원해야 한다. 이 초안을 배포 가능한 완료본으로 취급하지 않는다. 자동 결과/사진은 Git 제외 _local/reports/ 각 작업 폴더에 보존돼 있다.

입력 assets/skill-sfx-cleared-20261023 ccac4379는 아직 cherry-pick하지 않았다. 스킬28음원/64매핑 연결은 미착수다.19장 비전투 조작 전환도 미착수이며 확정 원고/2막 시간설정은 부모 입력을 기다린다. 이 작업에서 새 음원/원고/지형/게임 규칙을 추가하지 않았다.
