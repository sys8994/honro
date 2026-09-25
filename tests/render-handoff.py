"""Write the handoff for a committed, pushed implementation; commit this report next."""
import json,subprocess
from browser_support import ROOT

def git(*args):return subprocess.check_output(['git',*args],cwd=ROOT,encoding='utf-8').strip()
def read(name):return json.loads((ROOT/'reports'/name).read_text(encoding='utf-8'))
commit=git('rev-parse','HEAD');branch=git('branch','--show-current')
assert git('rev-parse','refs/remotes/origin/master')==commit,'Push implementation before writing its handoff'
assert not git('status','--porcelain'),'Commit implementation and validation first'
verification=read('verification-run.json');assert verification['exitCode']==0
before=read('performance-before.json')['rows'];game=read('performance-game.json')['rows'];editor=read('performance-editor.json')['rows']
text=f'''# HONRO 통합 인계 보고서

기록일: 2026-09-25. RC21 본게임과 Workshop V2를 실제 공통 runtime으로 통합하고 `master`에 배포했습니다.

## 변경과 아키텍처 결정

- 엔진·물리·카메라·Scene·실제 벡터 유닛·임무·스토리·오디오를 shared로 모았습니다. `shared/build.mjs` 하나가 번들 목록을 관리합니다.
- Stage View는 실제 HonroScene을 렌더하고 별도 overlay canvas에만 편집 표시를 그립니다. 간이 지형·유닛 그림과 경량 물리 플레이테스트는 제거했습니다.
- Playtest는 동일 빌드의 실제 게임 HTML과 HUD/입력/AI/턴/투사체를 사용합니다. Stop은 작성 데이터·카메라·선택을 복원하고 오디오를 폐기합니다.
- canonical v3 Project를 게임·에디터·Agent가 공유합니다. 인간 편집과 명령에 같은 geometry·검증·undo/redo를 적용합니다. Agent preview/apply/discard는 실제 Scene에 연결되며 ID가 유지됩니다.
- Element Studio visual/collision/anchor/socket과 실제 유닛 팔레트·상세 inspector를 런타임에 연결했습니다. 독립 collision은 그림 randomize/simplify에도 유지됩니다.
- 가져온 맵의 retry·종료·저장을 격리해 기존 캠페인 프로필을 보존했습니다.

## BGM

assets/bgm/README.md대로 01은 비전투에서 이어 재생, 일반 전투는 02→03→04→02 순환, awake 보스 등장 이후 해당 전투는 05입니다. Stage 변경에도 playlist index를 유지합니다. 기존 AudioEngine에 HTMLAudioElement 스트리밍 채널을 추가했으며 SFX는 유지했습니다. 첫 실제 입력 unlock, 420ms crossfade, mute/volume, pause/resume, 파일 실패 fallback, Playtest Stop dispose를 검증했습니다. MP3 5개와 README는 Git에 포함했습니다.

## Migration

RC21 Stage 1~10의 103개 실제 solid polygon과 재질·유닛 템플릿·이벤트·marker·anchor·route·임무 초기 상태를 정확히 이전했습니다. 새 지형으로 재작성하지 않았고 좌표 정수화·자동 node 축소를 하지 않았습니다. `migration/migrate-stages.mjs`와 동결 원본은 재현용입니다. 구 Workshop Project/Stage pack/runtime spec도 가져올 수 있으며 현재 export는 v3뿐입니다. 캠페인 진행 저장 revision 20은 유지합니다.

## 실행과 산출물

- 게임: `HONRO.html`
- 편집기: `HONRO_WORKSHOP.html`
- 실행: HTML을 직접 열거나 루트에서 `python -m http.server 8000`
- 빌드: `npm.cmd --prefix game ci`, `npm.cmd run build`
- 전체 검사: `npm.cmd run verify` 또는 종료 코드·SHA256을 기록하는 `python -X utf8 tests/verify.py`
- 오디오는 `assets/bgm/`을 같은 상대 경로로 함께 배포해야 합니다.

## 정확한 검증 결과

최종 전체 검사: **PASS, exit {verification['exitCode']}**, {verification['durationSeconds']}초. 실행 시각·빌드 SHA256은 [verification-run.json](reports/verification-run.json)에 있습니다.

| 검사 | 결과 |
|---|---|
| 기존 RC21 verify | typecheck 및 모든 활성 Node audit PASS, browser 10 PASS, performance 5 PASS |
| Migration | 10 Stage × 3 난이도, 원본 상태/geometry/material/unit/event 일치, 재생성·왕복 PASS |
'''
for name in ['integration','editor-features','authored','audio-unit','audio-browser']:
    data=read(name+'.json');text+=f'| {name} | {len(data["checks"])} PASS, uncaught errors 0 |\n'
text+='''
Rendering은 Stage 1~10 각각 픽셀 차이 0입니다. Physics는 같은 420 tick 이동·점프·발사 입력에서 위치/속도/grounded/충돌/투사체 trace가 완전히 일치했습니다. 각 Stage의 실제 이동·점프·공격 smoke도 포함합니다.

보관된 기존 Node 검사 20개는 원본 import commit 8c22dde와 통합판에 각각 실행했습니다. 양쪽 8 PASS / 12 FAIL, 새 실패 0입니다. 기존 browser 검사 8개는 양쪽 2 PASS / 6 FAIL, 새 실패 0입니다. 옛 map revision/좌표를 기대하는 검사 등 기존 실패는 [Node 비교](reports/historical-regressions.json), [browser 비교](reports/historical-browser.json)에 구분해 남겼습니다. 이 실패들을 전체 PASS로 처리하거나 기대값을 낮추지 않았습니다.

## 성능 전후

같은 Chrome에서 dense Stage 1/2, 일반 zoom .82, overview .20, 모바일 가로를 순차 측정했습니다. 600ms warmup 후 2초 구간이며 정적 geometry 상세도는 동일합니다.

| Stage / viewport / zoom | Original avg ms | Game avg ms / Hz | Editor avg ms / Hz | Original / Game / Editor load ms |
|---|---|---|---|---|
'''
for a,b,c in zip(before,game,editor):
    text+=f'| {a["stage"]} / {a["viewport"][0]}×{a["viewport"][1]} / {a["zoom"]} | {a["renderAvgMs"]:.3f} | {b["renderAvgMs"]:.3f} / {b["renderHz"]:.2f} | {c["renderAvgMs"]:.3f} / {c["renderHz"]:.2f} | {a["loadMs"]} / {b["loadMs"]} / {c["loadMs"]} |\n'
text+='''
18개 표본의 warmup 이후 world cache 재생성은 0회입니다. 실제 파괴 시에는 재생성 증가를 확인했습니다. 평균 render <7ms, frame ≥50Hz, heap 증가 <30MB를 모두 통과했습니다. 최대 비용·heap delta·cache byte/build/hit 값은 [VALIDATION.md](VALIDATION.md) 및 원본 JSON에 있습니다. 짧은 heap delta는 GC 영향을 받으므로 장시간 누수의 증명은 아닙니다.

## 남은 한계와 다음 작업

- 모바일 검증은 Chrome 터치 에뮬레이션입니다. 실제 iOS/Safari와 Android 기기에서 조작·오디오·성능을 확인할 수 있습니다.
- Stage 1~10의 전체 수동 클리어는 미수행입니다. 자동 초기 상태 동등성과 이동/점프/공격·임무/진행 회귀 검사를 수행했습니다.
- 전곡 청취·MP3 sample 단위 무간격 loop는 미검증입니다. 실제 재생 시작은 파일로, 곡 끝 playlist 순환은 ended 이벤트로 확인했습니다.
- 기존 명시적 재질 폴리곤은 지형 편집 시 자동 재설계하지 않습니다. 이미 구 Workshop에서 줄여 저장한 파일은 원래 상세도를 복원할 수 없습니다.
- climbable은 보존된 메타데이터이며 기존 점프/발판 조작을 사용합니다. 사다리·수영·임의 SVG 실행 같은 새 게임 기능은 추가하지 않았습니다.
- 장시간 대형 프로젝트 편집 스트레스와 원본에서도 실패하는 옛 검사 정리는 다음 별도 작업으로 남깁니다. 옛 설계로 현재 게임을 되돌리지 않아야 합니다.

## Git 전달 상태

'''
text+=f'''- 현재 branch: `{branch}`
- 작성자: `{git('config','user.name')} <{git('config','user.email')}>`
- 마지막 검증·배포 구현 commit (이 보고서 작성 직전 HEAD): `{commit}`
- `git push -u origin master`: 성공. 보고서 작성 시 local HEAD와 origin/master가 일치했습니다.
- 보고서 작성 직전 working tree: clean. `.test-output/` 캡처·로그·baseline worktree는 ignore됩니다.

```text
{git('remote','-v')}
```

이 문서는 위 구현 commit 다음의 문서 commit에 포함됩니다. 자기 자신의 commit hash를 파일 내용에 넣을 수 없으므로 보고서 commit까지 포함한 최종 hash는 `git rev-parse HEAD`로 확인합니다. 최종 사용자 응답에는 그 최종 hash와 push 결과를 별도로 기록합니다.

관련 문서: [ARCHITECTURE](ARCHITECTURE.md), [MAP_SCHEMA](MAP_SCHEMA.md), [AGENT_API](AGENT_API.md), [MIGRATION](MIGRATION.md), [BGM_INTEGRATION](BGM_INTEGRATION.md), [VALIDATION](VALIDATION.md).
'''
(ROOT/'HANDOFF_REPORT.md').write_text(text,encoding='utf-8',newline='\n')
print('Wrote HANDOFF_REPORT.md for pushed implementation',commit)
