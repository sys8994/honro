# 12장 완료 → 13장 로딩 긴급 수정

기준은 승인된 13장 미술의 `c5b51319ef887943726434d84db596f07254bbd3`. 부모 긴급 복원 `9890006179e45c7b323941a1252a3003c298751f`를 최종 ancestry에 포함한다. 최신 master `e974bfe7a1138b55c5b4648e8a38e192ad0a69f6`의 승인된 NPC/BASE4 UI도 그대로 합류했다. 다른 대사/11장 퀘스트/13장 후속 미술은 포함하지 않는다. master와 Pages 발행은 부모 담당이다.

## 원인과 수정

이전 발행 `934fcabd74767d662aee3830585ba807234934cc`의 campaign index는 `chapter-13.516170b245a8b075.json`, `chapter-13-assets.1387b6a1f088fc74.json`을 참조한다. 두 파일이 c5에서 삭제된 것은 Git으로 확인했다. 기존 두 세대 보존은 중간 빌드에서도 회전하여 실제 이전 발행을 밀어냈다. 실행기의 공개 HTTP GET은 proxy 403으로 차단되어 공개 404를 직접 관측했다고 하지 않는다. 부모는 긴급 복원 Pages 성공 및 두 공개 JSON 본문 응답을 별도 확인했다.

이전 발행 manifest의 활성 그래프 중 빠진 8개 immutable 파일(6,525,283 bytes)을 원래 blob 그대로 복원한다. 두 13장 JSON은 부모 긴급 복원과 같다. 나머지는 이전 graph의 index/library/entry/runtime이며 비활성 보존용이다. 최초 핫픽스의 활성 파일 목록은 c5와 동일했다. 최신 master 합류 후에는 e974의 활성 파일 목록·HTML·실행 코드와 초기 요청 경로를 보존한다. BGM·11/13장 승인 미술·기존 렌더 개선은 변경하지 않는다.

`publishedGenerations`는 실제 발행 그래프 두 개를 중간 빌드용 두 세대와 별도로 보존한다. 현재는 98900061과 934fcabd이며 동일 그래프 재발행은 합친다. 다음 발행 전 실제 현재 발행 SHA로 `node tools/release/retain-published-web.mjs <SHA>` 실행 후 정상 빌드한다. 도구는 hash 불일치 시 중단하며 활성 연결은 바꾸지 않는다. 상세 절차는 [발행 지침](../RELEASE_OPERATION_GUARD.md).

## 확인과 한계

- `npm run build`, `node tests/web-build-retention.mjs`, `node tests/web-split.mjs`.
- 정상 빌드 뒤 이전 발행 활성 그래프 전체 SHA256 일치, 복원 8개 유지, 최종 활성 graph가 e974와 동일함을 확인했다. 여러 중간 빌드와 두 실제 발행 세대 상한을 단위 검사한다.
- `node tests/route-branches.mjs`, `node tests/journey-stage-departure.mjs`.
- `python3 tests/stage12-next-load-browser.py`: 실제 Chromium 390×844에서 이전 발행을 연 뒤 c5 파일 부재를 로컬 HTTP 404로 재현한다. 실패와 반복 실패 후 같은 탭의 재시도로 13장 쉼터→전투에 도착한다. A/B 선택을 유지한다. 새 현재 탭에서 실제 결과 시점 저장 Continue도 A/B 도착을 확인한다.
- 네 경우 모두 XP/레벨을 포함한 heroes, 클리어 기록, clear report, 서사 기록이 같고 12장 visits=1이다. 런타임 오류 0. 전투 종료 fixture를 사용했으며 실제 12장 전투 완주나 사용자 저장 자체의 검증은 아니다.

자동 상세 결과/사진은 `_local/reports/stage12-next-load-hotfix/`의 `browser.json`, `browser.log`, `old-client-route-A.jpg`, `old-client-route-B.jpg`, `build.log`, `web-split.log`에 둔다. 재현 검사는 Git의 정확한 이전 발행을 직접 준비하므로 원본 세대의 생성물을 새 결과로 오인하지 않는다. 최종 전달 SHA와 실행 source SHA를 구분한다.
