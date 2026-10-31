# 4막 과거 지형 제작 스크립트 실행

이 디렉터리는 이전 좌표 기반 시안의 **기하 검사·재현 도구**다. 사용자가 승인한 신규 지형 미술이나 미술·게임성 합격을 뜻하지 않는다. `check.sh`는 `art/act4-claude/stageN`과 `tools/act4-pilot/layouts/stageN-claude.json`을 다시 쓰므로, 다른 변경을 보존하기 위해 별도 worktree에서 실행한다.

Python 3.10 이상과 Node.js 20 이상을 사용한다. 루트 의존성 및 `game` 의존성은 저장소 README의 npm 설치 절차를 따른다. 월드가 없으면 `node tools/act4-source/world-source.mjs materialize`로 정본 조각의 체크섬을 확인하며 복원한다. 이미 존재하는 다른 월드는 덮어쓰지 않는다.

```sh
python3 -m venv _local/venvs/act4
_local/venvs/act4/bin/python -m pip install --index-url https://pypi.org/simple -r tools/act4-claude/requirements.txt
export PATH="$PWD/_local/venvs/act4/bin:$PATH"
export ACT4_PROBE_RUN_ID="$(python3 -c 'import secrets; print(secrets.token_hex(16))')"
bash tools/act4-claude/check.sh 32
python3 tools/act4-claude/gate.py 32
```

가상 환경 경로는 POSIX 예시다. 동일 세션에서 만든 실행 ID로 두 검사를 묶는다. `check.sh`만 호출하면 자체 실행 ID를 발급하지만, 별도 `gate.py` 호출에도 같은 ID를 전달하려면 위처럼 먼저 내보내야 한다. `redo.sh`는 별도 reviewed reference 위치가 필요한 통합 도구다. 승인 자산과 시각·플레이 검수 없이 이를 최종 산출물 제작에 쓰지 않는다. `render.py`와 `decor.py`에는 과거 환경의 참조 경로가 남아 있으며 이 설치 확인 범위에 포함되지 않는다.

검사 기록은 정본 월드·생성 stage/blueprint·엔진과 build 입력·게임 자산·Python 의존 버전 및 보고서 자체를 묶고 변경 시 거부한다. `shared`, `tools`, `workshop`, `art`, `assets`와 필요한 `game` 경로를 넓게 해시한다. 환경의 모든 외부 바이너리까지 동일하다는 증거는 아니다. 기하 검사만으로 후보 미술·실제 조작·승리·저장·난도 또는 배포를 승인하지 않는다.
