# 2장 · 높은 절벽 위 엄호와 하단 상여 길

2026-10-19 부모 전달 `ffcbc54a151b2224945d70c2d55f50a83dc03491`의 `honro-stage2-high-cliffs.webp`를 실제 확인하고 runtime `quiet-layered/stage2-high-cliffs.webp`로 byte 동일하게 복사했다. 1672×941 투명 근경 전체를 uniform 2.2배 WORLD 변환으로 그린다. 낮은 바위 원화/접촉 좌표를 재사용하거나 세로 늘이기·strip·추가 그림을 사용하지 않는다.

설오는 source x475/y147.95 부근, 왼쪽 정상 오른쪽의 실제 노출된 윗면에 선다. 시작 상여 길까지 낙차는 world1179.32, 설오 h92의 약12.82배다. 정상과 중간의 자연 암반 윗면만 one-way 얇은 contact로 저작하며, 뒤쪽 절벽 전체를 solid로 채워 전경 길을 막지 않는다. 오른쪽 절벽 정상/선반도 새 그림에서 읽는다. 설오 바로 옆 자연 선반으로 걸어 내려갈 수 있으며 모든 절벽을 아래에서 정상까지 일반 점프로 등반하는 구조는 아니다.

상여와 동행은 맨 아래의 하나의 연속 `canyon-ground`를 좌→우로 지나 기존 goalX3340에 도달한다. 지상 적은 아랫길 역할 군집으로, 까마귀는 맞은편 정상 위에, 박쥐는 열린 협곡 공중에 배치한다. 기존 적 수12/행동 cap3, 능력·HP·XP·AI, 경고/응답과 유한 증원, 이벤트·목표 ID와 공중 대응 opt-in marker는 보존한다. 변경은 원화에 맞춘 위치/접촉면·카메라뿐이다.

2장 전용 자동 고지 framing은 설오가 원래 정상부에 머무는 동안 아랫길을 함께 보여준다. 수동 pan/zoom, 대사 focus, projectile tracking은 기존 동작을 따른다. `quiet-layered-art.js`의 공유 독립 원경과 색/시차/캐시는 변경하지 않았다. runtime 요청은 `quietFar`와 `stage2QuietNear` 두 개뿐이다. 근경/원경 tone은 source별 1회 cache하고 기존 날씨/얕은 물을 보존한다. 새 모션/RAF/디테일은 없다.

배포됐던 낮은 2장 지형과 달라졌으므로 2장 campaign map revision만2→3으로 바꿨다. 이전2장 전투만 현행 정책으로 재시작하며 성장/SP/장착/캠페인 진척을 보존한다. 1장과3장 이후, 별도11장 WIP는 수정하지 않는다.

확인은 build1회, 실제 시작 grounding, 온전한 지형/기존 적 배치에서 기본 화살로 아랫길 산개/공중 박쥐 각각 실제 피해75/72, 인접 자연 선반 보행/하강, 적을 제거한 allied convoy fixture의 goal3340 도착, 이전 revision2 전투 restart만 수행했다. 이는 정상 전체 전투 완주가 아니다. 일반/같은 구도 collision debug/줌아웃 실제3뷰는 pageerror0이며 정적20frame 동안 source filter2회/원경 canvas1개가 증가하지 않았다. 전체 verify/스킬/다른 장/별도 검수자는 실행하지 않았다.

로컬 보고서는 `_local/reports/stage2-high-cliff/`, 전달 화면은 기존 evidence 브랜치의 `game/docs/art-reviews/stage2-high-cliff-20261019/`다. 부모가 실제 화면을 확인한 뒤 master/Pages 배포를 결정한다.
