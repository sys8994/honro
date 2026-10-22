# 18장 R29 후속 — R45 상한, 미완주

**같은 실제 R29 저장에서 한 번 재개해 R45 시작에 멈췄다. 종지기는 R39 비살상 제압됐지만 국소 위협2명이 남아 완료/패배 어느 쪽도 아니다.** 추가 입력 실행은 없다.

[짧은 summary](summary.json) · [프로파일 요약](profile-summary.json) · [실제 R45 JPG](review/actual-r45.jpg) · [실제 R45 저장 gzip](../../../tests/fixtures/stage18-current-stop-r45-20261022.json.gz)

| 기준 | SHA |
| --- | --- |
| 게임·생성물(변경0) | `793a9a953d6f82038d44dc44b51ea5a01ce996c4` |
| 45초 프로파일 검사 | `1fb59cef6f6f1d5fde20cbbf63ba15e8fd9d678b` |
| 한 번의 R29 재개 검사 | `5d1c460a1d06f5ff8fc1216bb96051d2f6c0c396` |
| 실제 R45 브라우저 복원 | `82f96ceaa7348bb8d650b8356be4eb09a743f80d` |

## 한정 프로파일·검사기 수정

외부 `timeout --signal=TERM --kill-after=3s 45s`와 V8 샘플/호출 경계를 사용했다(exit124). 마지막 미반환 호출은 R29 담허→sb-b-high의 preview 사격 탐색이었다. 완료된 navigation-build 약566ms, inspectRoute 약15ms, 표본 engine/mission tick은 약2ms였다. V8에는 반복 `predict/shotViable/collision` 호출이 잡혔다. **검사기가 많은 탄도 후보를 동기로 조사하는 비용**이며 실제 발사/턴 tick 정지 증거는 아니다. 예측 함수는 production code다. 개별 예측 비용·실제 UI FPS/사람 시간은 별도 미측정이다.

Opt-in `HONRO_STAGE18_DETOUR=1`만 두 변경을 적용한다. 기본 정책/게임은 그대로다.

- 사격 탐색은 호출당24·기예당12후보, 비싼 bestShot fallback을 쓰지 않는다. 반사 후보도 미리 정한 유한 표본뿐이다. 실제 기록238호출/1652후보, 관측 최대24/12다. 더 좋은 사격을 찾는 최적 정책은 아니다.
- 직선거리 증가가 필요한 경우 기존 graph가 반환한 유효 prefix를 따라가는 fallback을 허용한다. 현재 지형 접촉/배우 비중첩·유한 이동 예산을 확인하고 기존 move/jump와 실패-link 거절을 재사용한다. 같은 끝점은 한 번, 정지2회 또는 동행/목표당6회면 중단한다. 임의 좌표·HP·자원·목표 쓰기는 없다.

실제 R29 담허/휘겸은 기존 제안 null→유효한 서쪽 우회 prefix로 바뀌는 읽기 전용 회귀를 통과했다([regression](detour-regression.json)). 전체 battle/RNG exact, 끝점 재시도/정지 제한도 확인했다. **이번 실제 재개에서 fallback 선택은0회**다. 제한된 사격 탐색이 유효 사격을 못 찾으면 기존 navigator가 이동했고 두 동행도 전진했다. 따라서 진행을 우회 fallback 하나의 효과로 주장하지 않는다.

## 한 번의 실제 재개

R29의 성장/장착/HP/MP/행동·위치/RNG를 whole-battle exact로 확인하고 시작했다. 이전 R1–28과 중간 정책이 다르므로 처음부터 고정정책인 완주 사례가 아니다. 외부6분/R45 시작 상한, 실제 실행 구간 약159.8초 후 라운드 상한으로 종료됐다(exit1, 검사상 미완료). 소모품 사용0·외부 live 쓰기0·엔진 recovery0이다.

종지기 제압 **R39**, 보복4명 출현 **R35**. R45의4인 생존 HP는 설오168/823·담허514/891·휘겸1327/1438·소단483/1039다. 남은 국소 위협은 `event-198` HP117/893, `event-199` HP1384/1384이며 둘 다 퇴로 반경720/높이500 안이다. 남은 전체 적41명을 소탕하라는 조건이 아니다. 최종 전투 집계는 초기55+실제 출현15=70, 처치28+비살상 제압1+살아 있는 적41이다.

출현15는 보호8+종 하강 반응3+보복4다. 이전 R29 원자료에는 이미 반응3이 있었지만 짧은 요약에서 누락됐다. 이전 README/summary의 R29 출현8·처치17을 **출현11·처치20**으로 정정했다. 원자료는 변경하지 않았다. 종지기를 R42라고 한 중간 안내도 HP1 확인 시점과 혼동한 것이며 실제 완료 기록은R39다.

R45 실제 저장의 production Continue/re-export 전체 exact·접지 몸체/목표 동기화, 실제 브라우저 Continue 전체 exact·렌더 순수성·JS/HTTP 오류0을 확인했다. JPG는 검수 카메라만 사용했고 직접 열었으며1MB 미만이다. 기존 하강·점유·구 저장 전이 fixture는 [앞 진단](../stage18-current-pacing-20261022/README.md)의 별도 준비 조건 결과다. 게임 byte exact이므로 그 결과를 인용하되 이번 정상 전투와 섞지 않는다.

**미실행:** 정상 마지막 국소 정리·완료대사·단일 정산·19장 휴식터/진입/Continue. 해당 브라우저/전이 adapter는 준비했지만 실제 미완료라 그 경로를 실행하지 않았다. 다음 재개가 승인되면 보존된 R45부터 시작하면 되며 R29 구간을 다시 뛸 필요 없다. 추가 전략 탐색·첫13 gate 변경·미술 병합·게임/build·master/Pages 변경도 없다.

원자료는 [native result gzip](native-result-r45.json.gz), [재개 호출 로그 gzip](resume-calls.jsonl.gz), [프로파일 호출](profile-calls.jsonl.gz)/[분석](v8-analysis.txt.gz)/[V8 원본](v8-samples.log.gz)에 남겼다. 최종 원격 HEAD/clean 여부는 인계 메시지로 제공한다.
