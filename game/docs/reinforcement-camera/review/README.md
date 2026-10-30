# 실제 Chromium 검토 PNG

아래는 최초 후보 `0a4b27d9`의 2026-10-23 00:22 UTC 실제 Chromium PNG를 변경 없이 재사용한 것이다. 부모가 `_local`에 접근할 수 없어 명시 요청에 따라 이 다섯 장과 작은 측정 JSON만 Git에 전달한다. 최신 master 통합/전투 혼 필터 보완 뒤 다시 찍은 이미지로 표시하지 않는다.

[PC 이전](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/reinforcement-camera/review/desktop-00-before.png) → [증원 무리](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/reinforcement-camera/review/desktop-02-group.png) → [복귀](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/reinforcement-camera/review/desktop-05-restored.png)

[모바일 증원 무리](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/reinforcement-camera/review/mobile-02-group.png) · [모바일 동시 대사](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/reinforcement-camera/review/mobile-concurrent-dialogue.png) · [원본 좌표/시각/해시](browser.json)

3장 production event를 직접 호출하고 시뮬레이션을 멈춘 inspection fixture다. 정상 전투 완주/전 장 전수 플레이/전투 혼 실전 검수 증거가 아니다. 전투 혼 보완은 별도 집중 검사 결과를 상위 README에 구분한다.

이번 보완에서 새로 확인한 [16장 전투 혼 무리](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/reinforcement-camera/review/combat-spirits.png)와 [새 Chromium 측정](spirits-browser.json)은 최신 `e1e4b9aa` 통합본의 실제 Act2 생성기를 사용한다. 소단의 기존 spiritSight로 보이는 resonance/echo/bellCluster를 직접 추가한 정지 fixture이며, 실제 안전 스폰/정상 전투 완주를 증명하지 않는다. 기존 다섯 장과 새 한 장의 출처를 구분한다.
