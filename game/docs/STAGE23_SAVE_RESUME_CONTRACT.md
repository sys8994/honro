# 23장 저장 재개와 SP 마이그레이션 검사

기준 master: `145ab2f48a57635cc0d7e5abdf6797ec44d25d73`. 원본 `tests/fixtures/stage23-escort-level17-dock-mid.json`은 수정하지 않는다. 파일 SHA-256은 `086290aa03e2bfc688485289191a7aeb23366c03abdea8c552394d3c2a452dc9`, 내부 원본 export SHA-256은 `db3399a0d18471af318787703dd381a3cf32d74fdd471f8ef70f91b60a0994cf`다. 검사 시작과 끝에서 파일 바이트 해시를 확인한다.

## 기존 실패의 원인

`node tests/sp-balance-app-resume.mjs`는 App Continue 뒤 `units`, `spBalanceRevision`만 제외한 전투 전체가 옛 저장과 같아야 한다고 검사했다. 하지만 fixture의 `honroRevision`은 20인 반면 `honroCampaignMapRevision`은 없다. 현재 23장 지도 revision은 1이다. `HonroCampaignMapRevision.obsolete/discard`가 load 시 옛 전투만 버리고 `honroMapRestart=23`을 기록하며, Continue는 같은 장의 현행 지도 입구를 새로 만든다. 따라서 이 검사는 SP 보정만의 계약과 지도 재시작 계약을 혼동했다. 테스트만 수정하며 게임 런타임·저장 규칙은 변경하지 않는다.

실패 당시 원본 전투→실제 Continue 결과에서 달라진 leaf는 5,107개였다. 배열 위치별 비교이므로 배열 삽입·배우 교체가 많은 경로로 집계된다. 이것은 성장 손실 건수가 아니다.

| 구분 | 실제 전후 변화 | 판단 |
|---|---|---|
| 지도 표식 | 없음 → `honroCampaignMapRevision: 1` | 예상된 지도 교체 |
| 전투 진행 | round 16 → 1, 새 session, 발사/피격/이벤트 기록 초기화 | 현재 장 입구 재시작 |
| 미완료 장의 퀘스트 | dispatch-bundle/carrier-start/dock-mid 완료 체크와 호송 checkpoint 초기화 | 옛 전투 소속 진행이므로 예상된 재시작 |
| 지형·배우·그림 데이터 | units 1,111 / terrain 41 / honroWorldTerrain 89 / landmarks 1,666 / elements 1,666 / map 236 leaf 등 | 현행 새 진입 전체와 비교하여 확인 |
| 기존 성장 장부 | 23장에 `policy: 3` 추가, 현행 전투의 enemy weight 재계산 | 이미 지급된 combat XP·limit·cleared 값 보존 |
| 프로필 메타데이터 | debugTerrainOutline 기본값 false, upgradeNotice true, 새 진입 기록/현재 입장 서술 추가 | 기대된 필드와 canonical 새 진입 프로필 전체를 비교 |
| 아이템 | heal/focus/cleanse/ward = 3/3/2/2 그대로 | 이 원본 입력에서 손실 없음 |
| 네 캐릭터 | XP 77,012, 경지17, 능력 수련6, ranks/장착/기타 성장 그대로 | 보존 |
| 기존 완료·보상 | 1–22장 cleared, 각 장 성장 장부, 23장 이미 지급한 전투 XP 각1,264 그대로 | 손실·중복 지급 없음 |

SP만 직접 적용하면 변경 leaf는 41개(네 캐릭터의 실제 파생값 10개씩 + revision 1개)다. 기존에 허용하던 파생 필드 목록은 확대하지 않았다. 좌표·상태·적/소환·탄·지형·아이템·퀘스트·장부 등 나머지는 완전히 같아야 한다.

## 수정한 검사 계약

- 원본의 복제에 실제 `C.applySpBalanceMigration`을 적용한다. 원래 비파생 상태 전체 동일성, HP/MP/이동력 비율, 훈련 반영 파생 수치, 반복 적용 불변 assertion을 유지했다.
- 원본의 실제 App load/Continue에서는 지도 revision 불일치를 명시적으로 확인한다. load 직후 프로필은 snapshot 제거·restart 표식·새 기본 설정만 정확히 허용한다. Continue 결과는 독립적인 현행 새 진입의 **전투 전체와 프로필 전체**에 일치해야 한다. 새 session ID만 형식을 별도 검사한 뒤 비교한다. 옛 지도를 현재 revision으로 거짓 stamp하지 않는다.
- 실제 현행 지도에서 만든 snapshot에 원본의 옛 파생 수치와 SP revision 0을 넣은 명시적 호환성 probe도 실제 App Continue로 검사한다. 순수 SP adapter의 결과와 전투 전체가 정확히 같아야 한다.
- 현재 지도 snapshot에 소모 아이템 1/0/1/0과 상처/자원 비율을 두고 실엔진 기본 화살을 발사한다. 이 비행 중 전투를 mount/export/import/Continue로 3회 반복하며 **어떤 필드도 제외하지 않고 전투 전체와 프로필 전체를 비교**한다.
- retry가 전투·아이템을 새 진입 상태로 돌리는 동안 XP/SP/ranks/수련/장착/이미 지급한 장부/기존 완료 기록은 그대로인지 확인한다.
- 명시적 승리 경계에서 완료 보상은 XP만 기존 예산 끝까지 변경하고 배분·기타 성장과 이전 장 보상은 그대로여야 한다. 두 번째 complete/outcome와 완료 기록의 import/Continue는 XP·보상·방문 횟수를 중복 지급할 수 없다.

가져오기 성공 메시지 assertion도 유지했다. 반복 import 중 타이틀이 호출하는 `removeAttribute`가 DOM 대역에 없던 별도 문제는 `tests/app-regression-helpers.mjs`에 해당 DOM 메서드만 보완했다. 실제 브라우저/제품 동작 변경이 아니다.

## 결과와 한계

- `node tests/sp-balance-app-resume.mjs`: 원본 23장 그룹 통과. 선택적 `HONRO_GROWTH_SAVE` 외부16장 입력은 제공되지 않아 실행하지 않았다.
- `node tests/campaign-map-revision.mjs`: 같은 revision 정확 재개, 없는 revision 재시작, 미동기화 XP/장부 보존, 분할 원정과 import, Workshop 제외의 기존8개 관련 그룹 통과.
- 원본 fixture 해시는 전후 동일하고 Git diff가 없다. 런타임·맵·스킬 UI·생성 HTML을 변경하지 않았으므로 빌드·전체 검증·배포는 실행하지 않는다. master 통합은 부모 검토 전 보류한다.
- `_local/reports/stage23-resume/continue-diff.json`에 최초 필드별 전후값, `_local/reports/stage23-resume/profile-diff.json`에 프로필 비교, `_local/reports/growth-release/normal-save-comparison.json`에 수정 뒤 파생 수치·실제 변경 경로·검사 결과를 남긴다.
- App/게임 로직은 실제 소스지만 DOM·storage·렌더·프레임은 대역이다. 아이템/상처와 승리 경계는 명시적 probe이며 실제 브라우저 플레이·23장 정상 완주 증거로 표현하지 않는다.
