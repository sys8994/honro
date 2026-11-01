# 정량 검수와 빌드 차단

현재 상태: **실행기·수치 판정기·빌드 경계 구현,실제 4막은 차단.** 기존 플레이 결과를 새 기준 통과로 바꾸지 않았다. 등록된 새 시험군과 신뢰할 수 있는 전문 검수 어댑터가 없으면 배포할 수 없다.

## 기준 원본

`criteria-v3.json.gz`는 전달했던765,112바이트 원본 JSON의 무손실 압축이다. raw SHA256 `e2183e74492a4cb61338f8a691a51f23e7af2205fb9148ae6f6b2c138311aa54`를 코드와 lock에 고정했다.40장 전투3–6명/중간보스0이라는 원래 예외도 그대로 남겼다. 기준 설계 문제를 검사 코드로 숨기지 않는다.

사용자의 수직이동 완화 지시와40장 피날레 지적은 아직 새 기준 버전으로 정리되지 않았으므로 `criteriaResolution`이 별도 차단 사유다. 새 기준은 원본을 덮어쓰는 대신 변경 이유·사용자 지시·버전을 고정하고 시험 전에 동결해야 한다.

## 실행 순서

1. `tools/task-gate/queue.py capture`로 요청을 등록한다. 계획 없는 요청은 다음 작업을 막는다.
2. 작업 단계·정량/정성 검사·기준/검사 코드 해시를 `plan`으로 한 번만 동결한다.
3. 각 단계의 실행→검사→실패 시수정→재검사 루프를 실행한다. 기존 단계 산출물이 바뀌면 이전 증거를 무효화한다. `retry`는 같은 단계·같은 기준으로만 다시 시도한다.
4. 혼로는 시험 전에 `protocols.json`에 후보·정책·seed·성장/장비 프로필·수집기 코드 해시를 등록한다. `collect.py`는 모든 등록 시행을 실행하고 실패를 누락하지 않는다.
5. `gate.py`는 PASS 요약이 아니라 시간순 실제 이벤트에서 수치를 다시 계산한다. 후보·기준·프로필·시행 ID·collector 해시가 다르면 거부한다.
6. 공간 접촉,미술 오차,독립 정성 검토,막별 난도 곡선은 고정 코드/입력 해시를 가진 별도 어댑터로 실행한다. 없으면 미측정으로 막는다. 빈 어댑터를 항상PASS하는 코드로 채우지 않는다.
7. `buildWeb()`의 공통 경계에서 검사한다. 기본 npm경로뿐 아니라 game/workshop 직접 호출도 차단한다. 개발용 `--preview <name>`만 `_local/previews/<name>`에 출력하며 공개 산출물을 고치지 않는다.

```sh
python tools/quality-gate/collect.py
python tools/quality-gate/gate.py --out _local/quality-gate/report.json
node workshop/build.mjs --preview inspection
node workshop/build.mjs
```

마지막 명령은 현재 미측정4막 때문에 실패해야 정상이다. 프리뷰는 개발·검사 목적이지 다음 승인 단계나 배포 증거가 아니다.

## 판정 범위

- 전체 라운드 목표의 하한·상한과20턴 초과를 분리한다.
- 일반 정책 성공률에 숙련·반증 정책을 섞지 않는다. 정상 시행을 abort해 목표 성공률에 맞추지 못한다.
- 적 행동 평균은 유효 행동0인 관측 적 페이즈도 분모에 넣는다. 초기 위치가 아닌 현재 위치로 접근을 관측한다.
- 공격/피격의HP·실드 연속성,실제 행동 ID,다중 피해의 행동별 합산을 확인한다. 일반 적과 보스의 피해를 섞지 않는다.
- 점프/아래점프는 입력 키 횟수가 아니다. 실제 연결된 이동/착지와 등록 지지면이 필요하며,접촉 그래프 검증은 전문 어댑터가 추가 확인한다.
- 필수 전문 어댑터는 `requiredElevationCoverage`, `qualitativeArtAndTactics`, `protectedFeaturesAndSeams`, `actDifficultyCurve`다. 출력의 임의PASS를 받지 않고 고정 schema·후보/기준/입력 해시·관찰 위치를 검사한다. 수치 어댑터의 임계값은 중앙 검사기가 적용한다.
- 최소12개 일반 정책 시행,4개seed,2개정책은 이번 수집기 구현의 최소 표본 조건이다. v3 원문에 원래 있던 숫자라고 주장하지 않는다. 사람 성공률 추정이나 충분한 통계 검정력을 보장하지 않는다.

## 아직 필요한 실제 증거

현재 `protocols.json`과 `adapter-registry.json`은 비어 있다. 과거 raw PASS 자료를 사후에 사전등록한 것으로 위장하지 않았다. 각 장의 합법적인 실제 플레이 수집기와 전문 측정/검수 어댑터를 작성·검증·등록해야 한다. 합성 단위시험의 통과는 그 실제 작업을 대신하지 않는다.

정성 어댑터는 보호된 검수 서비스/CI 저장소에서 검수자의 권한을 실제 확인해야 한다. local JSON에 `reviewer=independent`나`authorityVerified=true`라고 쓰는 것만으로 인증이 되는 것은 아니다. 신뢰할 검수 연결이 없으면 계속 차단한다. 미술·재미의 주관적 판단을 수학적으로 보장한다고 주장하지 않는다.

## 외부 보호가 필요한 부분

같은 관리자가 코드·기준·collector·증거를 모두 편집할 수 있으면 로컬 해시만으로 고의적 우회를 막을 수 없다. 현재 연결은 master의 기존 branch protection 조회가403으로 거부되어 보호 상태를 확인하지 못했다. rulesets 목록은 비어 있었으나 이것만으로 기존 branch protection도 없다고 단정하지 않는다.

GitHub에서 필요한 최종 설정:
- Pages의 배포 원본을 브랜치 자동 배포 대신 GitHub Actions로 설정한다.
- master 직접 push/force-push와 검사 우회를 제한하고,보호된 `stage-quality` 검사를 병합 필수로 지정한다.
- 기준·게이트·collector·workflow 변경은 제작 실행자와 독립된 권한으로 검토한다.
- 배포 job은 같은 후보의quality검사 성공 후 생성된 산출물만 사용한다.

이 설정을 확인하기 전에는 서버 수준 배포 차단 완료라고 보고하지 않는다. 이 실행기는 또한 모든 채팅 도구를 플랫폼 차원에서 자동 가로채지 않는다. 개인 작업 큐 등록과 승인 단계 실행은 이 도구를 사용하는 어댑터에 강제되며,플랫폼 전체 강제력과는 구분한다.

실제 workflow는 `.github/workflows/verified-pages.yml`이다. `deploy`는 같은 workflow의 `stage-quality` 성공을 `needs`와조건식으로 모두 요구하며,통과 후 빌드된 site artifact만 사용한다. 기존 브랜치식 Pages 설정을 그대로 두면 이 workflow와별개로 자동 게시될 수 있으므로 해당 설정 변경은 필수다.

설정 근거: [GitHub Pages 배포 원본](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site), [Pages custom workflow](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages), [보호 브랜치](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches).

## 구현 검증 기록

첫 CI41292099395는51개단위검사와직접빌드차단을통과했지만,격리프리뷰의workshop출력폴더누락으로실패했다. 실제stage-quality단계는실행되지않았다. 이실패를의도된정량차단으로혼동하지않으며,출력폴더생성을수정한뒤같은전체프리뷰검사를다시실행한다.

개발브랜치의`task-gate-tests`는의도된거절을단위시험으로확인하므로검사기가정상동작하면성공이다. 실제게임품질을승인한것이아니다. 출시품질검사는별도`stage-quality-required.yml`에서PR/merge-group/명시실행시수행하고,실제배포workflow에서도다시필수로실행한다. 미측정을매개발커밋의의도된실패메일로반복시키지않되,실제출시단계의실패는숨기지않는다.
