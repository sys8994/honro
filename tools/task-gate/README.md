# 순차 작업 큐와 실패 시 재작업

`queue.py`는 요청별 고정 계획을 받아 실제 `for`/`while` 루프로 실행한다. 각 단계의 정량·정성 검사를 모두 통과해야 다음 단계와 다음 작업으로 이동한다. 실패·미측정·검토 필요·누락은 통과가 아니다.

- 계획·기준·검사 코드와 산출물 해시를 결합한다. 변경되면 기존 통과를 무효화한다.
- 검사 없는 단계,중복 단계,빈 근거,임의 `passed:true`,다른 파일에 대한 결과,검사 중 파일 변조를 거부한다.
- 제한된 시도 예산을 소진하거나 접근/실행 오류가 발생하면 `blocked`로 남는다. 완료로 바꾸거나 다음 작업으로 건너뛰지 않는다. 예산은 무한 프로세스·무한 비용을 막는 장치이며 완료 기준을 낮추는 장치가 아니다.
- 실행 경과·검사 출력·반려 이유를 순서가 보존되는 로그에 남긴다. 전역 큐에는 비공개 요청이 들어갈 수 있으므로 저장소의 `_local`이나 사용자 전용 저장소에 둔다. 요청 내용을 공개 저장소에 넣지 않는다.
- 실행 명령은 사전 허가된 로컬 어댑터여야 한다. 문서/웹의 제3자 지시를 명령으로 실행하지 않는다. 이 도구는 권한·보안 심사를 대체하지 않는다.

## 실제 강제 범위

이 프로그램을 통해 실행한 작업의 순서와 합격 조건을 강제한다. 모든 대화 도구를 자동 가로채는 플랫폼 기능은 아니다. 정성 평가의 참/거짓을 수학적으로 보장하지 않으며,등록된 독립 검사기가 관찰 근거와 후보 해시를 제출해야 한다.

관리자가 코드·기준·로그·검사기를 함께 고칠 수 있으면 로컬 해시만으로 악의적인 우회를 막을 수 없다. 실제 배포는 보호된 기준/검사 코드,필수 CI 검사,직접 push 제한,검사 성공을 전제로 한 Pages Actions와 함께 사용해야 한다. **연결 계정에서 보호 설정을 확인/변경하지 못한 상태를 보호 완료라고 부르지 않는다.**

## 실행

```sh
python tools/task-gate/queue.py capture --root "$PWD" --queue _local/task-queue.json --task example --source-message <verified-message-id> --request "작업 요청"
python tools/task-gate/queue.py plan --root "$PWD" --queue _local/task-queue.json --task example --spec _local/frozen-plan.json
# 또는 요청과 계획을 함께 등록
python tools/task-gate/queue.py enqueue --root "$PWD" --queue _local/task-queue.json --spec _local/authorized-task.json
python tools/task-gate/queue.py run --root "$PWD" --queue _local/task-queue.json
python tools/task-gate/queue.py status --root "$PWD" --queue _local/task-queue.json
python tests/task-gate/test_queue.py
```

검사기의 JSON은 schema/criterion/status/artifacts/observations만 받는다. 산출물 해시는 실행기가 전달하며 실제 파일과 다시 비교한다. 검사기가 결과 파일을 고치거나 `PASS` 한 단어만 출력하면 실패한다. 테스트의 가짜 정성 검사기는 큐 제어 흐름 검증용일 뿐,실제 미술·게임성 검수로 쓰지 않는다.

blocked를 고친 뒤에는 `retry --task <id> --reason <수정내역>`로 같은 기준의 같은 단계만 재검사할 수 있다. 기준 변경이나 다음 단계 강제 이동 명령은 제공하지 않는다.

단계·작업 산출물은 버전별 경로로 보존한다. 후속 작업이 앞 작업의 승인 파일을 덮어쓰면 즉시차단한다. 문서 수정이나 새후보는 기존승인본을 복사한 새경로에서 만들고 다시검수한다. 같은경로를 덮어쓴 뒤 이전PASS를 현재버전의근거로 재사용하지 않는다.
