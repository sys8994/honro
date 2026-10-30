# Stage26 지붕 후속 독립 검토 — 2026-10-16

검토 대상: `d3e3f60` Stage26 지붕 후속. 검토자: Stage24 구현 담당(26장 구현 미참여). 실제 PNG 네 장의 픽셀, native route JSON, browser JSON, 검사 소스와 open-structures 저작 목록을 직접 읽었다. 이 검토에서 브라우저나 native 검사를 새로 실행하지는 않았다.

판정: 검토한 지붕 진입/귀환 범위에 새 차단 결함을 발견하지 못했다. 전체 맵 미술 승인이나 모든 군집/파동 교전 승인은 아니다.

- 공방 기와 지붕과 주민 피신처 초가지붕에서 휘겸/소단의 발이 실제 지붕 윤곽에 닿는 모습이 desktop/mobile에서 읽힌다. 지붕과 뒤 산세의 대비, 캐릭터 외곽과 HUD 식별이 유지된다.

- `open-structures.json`은 두 실제 자산 ID를 기존 단방향 플랫폼 정책에 등록한다. route 검사는 두 동행이 아래에서 점프해 지붕에 착지하고, 공방의 상부 작업길로 점프한 뒤 기존 drop으로 지붕에 돌아오고, 지붕을 걸어 다시 실내 바닥에 drop하는 실제 엔진 순서를 검사한다. 시작 이후 좌표·자원 쓰기가 없으며 하강 전후 HP/이동/기력/라운드를 비교한다.

- browser JSON 8행은 desktop/mobile×두 동행×두 건물의 실제 jump/drop 버튼과 HP 보존을 기록한다. 시작 위치를 둔 집중 fixture라는 설명과 구현이 일치한다.

- projectile 검사는 아래쪽을 향한 탄은 지붕에 충돌하고 위쪽 탄은 통과하는 기존 단방향 규칙을 직접 단언한다. 전체 사격 실효·최고점 지배 여부를 이 국소 검사로 대신할 수 없다.

남은 시각 판단: 공방 위 긴 작업길은 화면 상단에 큰 평행 선으로 남고, 모바일에서는 건물 일부가 잘린다. 구조적으로는 낮은 지붕→상부 작업길의 선택이 읽히지만, 모든 군집을 압도하는 사선인지와 실제 전투 중 귀환 선택의 가치는 이 정지 화면으로 판단하지 않았다. 주민 피신처가 궁궐/사찰로 과장되지는 않으며 낮은 초가와 열린 앞면으로 구분된다.

범위 제한: native route는 적 제거/승리 검사 비활성의 지형 격리 검사다. browser는 초기 위치 fixture다. 이 독립 검토는 이전 장부터 정상 연속 플레이, Workshop parity, save/Continue 전체, 군집/각 유한 파동의 첫 실효 행동을 승인하지 않는다.

## 직접 읽은 증거 SHA256

- [roof-desktop-knight-workshop.png](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/review/stage26/roof-desktop-knight-workshop.png): `1b4543ced8262a0940757fa7fee397f2d78c7337c175c26a34cc44823fb1ad54`
- [roof-mobile-knight-workshop.png](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/review/stage26/roof-mobile-knight-workshop.png): `d8604db95abc64d7fa708c4f42d2e60ae4f9d855fc7870a38686a4b6a2a742bd`
- [roof-desktop-occultist-refuge.png](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/review/stage26/roof-desktop-occultist-refuge.png): `902ff9783ac98f912310863c57440f68ec860551de6d914ec3e724113c0293f5`
- [roof-mobile-occultist-refuge.png](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/review/stage26/roof-mobile-occultist-refuge.png): `341eaac2c31528ad8f025001cf05ca9b9ff889ca6adc601a0494b414688301c8`
- [roof-browser.json](roof-browser.json): `f3b93e981a7fc1e7f1978f1d78adfec59617fe624cc8559a82dafcf8d5ab758f`
- [roof-routes.json](roof-routes.json): `5018e3669d1791212104c401786b51fecd862c6b13663d92ec8080373488fd14`
