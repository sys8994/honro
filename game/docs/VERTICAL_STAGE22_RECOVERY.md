# 22장 작업 복원과 새 증거 경계

2026-10-10 04:32 UTC. 이 문서는 원격 보존·파일 복원과 실제 실행 검증을 구분한다.

## 확정 기준과 복원

이전 실행 환경의 `/tmp`/shared 작업 경로가 보이지 않아 공식 공개 저장소를 새 허용 `/tmp` 경로에 clone했다. 원인·영구삭제는 확인하지 않았다. 원격 archive는 `62ed8e8cf8bd4724674dbc51576554f14026220d`까지만 보존되어 있었고 뒤 네 로컬 단위의 원격 blob/tree는 게시 담당의 읽기에서404였다. 이전 원본을 reset·삭제하거나 승인 불명 호출을 재시도하지 않았다.

- `7e65df4` 통합8경로 → 복원 `ad51fd00e46c50fea66c4497bb62a98d6d71c435`, tree `f3e2aa912fca379018968815cc90027ef2def15a`: 원 tree EXACT. 테스트3개·문서 원본문 SHA와 등록/canonical 및 공통build 재생성 양HTML이 모두 원본과 일치한다.
- `0374434` 미술 opt-in → 재구성 `1fc95791f06942de3a4e7e5f3041a4afec39b3b5`: 남은 명시적 production 코드로 재적용했고 테스트·문서는 새로 작성했다. 원 tree와 동일하다고 주장하지 않는다. production prefix40개 순수 경계 검사를 새로 통과했다.
- `7e01e81` 정상플레이 controller/helper/entry/문서4개 → `f8ddb1b9546dcb114f7aaa547e7cb24781eb231e`: 네 파일 SHA256 EXACT. 새 syntax PASS. 당시 attempt001 raw/최종결과는 복원되지 않았다.
- `ced0760` 미술 author/capture test/문서3개 → `b5aac2cc4578e175da77e647fb4e1b83cb88b61d`: 세 파일 SHA256 EXACT. 새 syntax PASS. 이후 부모 피드백에 따른 미술 변경은 별도 단위다.

각 복원 커밋은 게시 담당에게 branch-only 저장을 요청했다. 요청과 원격 저장 성공은 다르며 최신 원격 대응 SHA는 게시 기록으로 확인해야 한다.14 master 후보에는 이22 변경을 섞지 않는다.

## 새 환경에서 새로 실행한 증거

`_local/reports/vertical-stages/restored-contracts-20261010T0427Z`의 composition/runtime/App-resume는 위 복원 소스에서 순차 실행했다. 다섯 난이도26체/정예6·cap35·행동3·weight38.2·XP2890, runtime18그룹, production App22시나리오/전체snapshot60왕복 PASS. verification.json SHA256은 `e3a1970769e12cd42ae71b29f2c38d19d974ccb631904df08d629f5e311b5c4b`다. 조건주입 fixture이며 정상 전체플레이나 실제브라우저 증거가 아니다.

새 Native C컷은 `_local/reports/vertical-stages/stage22-art-c-restored-20261010T0428Z`에 생성됐다.13assets/406paths/279planes/53supports 계약과 실제 geometry dispatch를 확인했으나, 거대 회색 경사판과 큰직사각석축의 인상이 남아 부모가 미술 후보로 승인하지 않았다. 숫자·해시·렌더 성공으로 장소 품질을 승인하지 않는다. 충돌을 동결하고 사람 규모의 건축 기단/기둥·보 구조로 별도 보완한다.

정상플레이는 별도 `stage22-fullplay/attempt-002-restored`로 다시 시작했다. 이전 attempt001의 진행·성공을 이어붙이지 않고 새 profile/입력/trace/Continue를 남긴다. 완료결과가 확정되기 전에는 완주로 보고하지 않는다. 플레이 동안 geometry/canonical/gameplay runtime은 동결하며 미술author는 독립 파일에서만 수정한다. 새14 목표패널 수정72cc20e는 아직 archive에 없고, 이 실행이 끝난 안전한 단위에서 보존병합·공통build해야 한다.
