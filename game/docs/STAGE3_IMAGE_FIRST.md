# 3장 · 연목 나루의 독립 원경과 온전한 근경

부모 전달 `e346c26f7b748704a8ae6f3393259b87776765b8`의 `stage3-ferry.webp`를 실제 확인하고 그대로 runtime에 복사했다. 원본1944×809, SHA256 `fa245c9fcb1b735cf2abc4ec2ca7116444f9a7dcf266b0280ea954082822c3db`. 전체 그림을 uniform2.2배 WORLD로 그려4276.8×1779.8 지형을 저작했다. 문은 대략110world 높이로 h92 배우와 비슷한 사람 기준 비례다. 기존 벡터/구현 스크린샷을 새 미술 레퍼런스로 사용하지 않았다.

`tools/map-forge/stage3-image-first.mjs`가 마지막3장 author다. 기존x4850/6500폭/지붕 polygon을 유지하지 않는다. 왼쪽 제방→낮은 잔교→상승 잔교→중앙 흙길→오른쪽 높은 마당으로 이어지고, 실제 문턱·상자·온전한 한옥 지붕 윗면을 one-way로 연결한다. 기둥/집 벽/배경 암벽 전체를 solid로 채워 길을 막지 않는다. 보이지 않는 옛 창고 소나무 발판과 그 forestChoice 위치 metadata를 남기지 않는다. 다른 장 author나 canonical 원본은 수정하지 않는다.

새3장 flag에서만 옛3장 재질/장식 renderer를 비활성화하고 공통 quietFar와 stage3QuietNear를 독립 cache로 표시한다. 원경의 공유 색/framing/helper는 불변이다. 파노라마 근경의 위쪽은 투명한 하늘이므로 전체 폭 overview에서 하늘을 더 볼 수 있게 하고, 유한 그림의 양쪽/불투명 아래 경계는 viewport 안으로 들어오지 않게 제한한다. 원화 늘이기/strip/합성/추가 texture·미세패턴/단색 지하 채움은 없다.

물은 기존 conductive `ferry-water`와 기존 liveWater/ripple 루프를 사용한다. 새 하상과 잔교 아래 물리 수면을 저작하고, 기존 물의 렌더만 원화의 보이는 물 구간에 낮은 alpha로 clip한다. clip은 metadata별1회 Path2D이며 새 RAF/모션 루프는 없다. 수영/젖음/전도 물리는 기존 엔진이다. 기존 날씨와 장부 처마의 서사 실 표현도 보존한다.

초기 적은 원래12일반+나루장승1, 종별 산개2/멧돼지2/사람4/까마귀2/박쥐2/장승1이다. 동일종 clone 쌍을 반복하지 않고 잔교·길·마당·지붕 및 높이가 다른 공중으로 분산했다. 기존 ID별 HP/공격/기예/XP·group·군집/행동 cap·증원 수를 보존한다. 원본 unit 위치뿐 아니라 runtime clone 힌트, 소굴2개, midboss/dock-beasts/transfer 경계와 스폰 위치를 새 세계좌표로 바꿨다. crow habitat는 기존 full-body flightClear placement 옵션을3장에만 적용한다.

`ledger`는 문간 문턱 source1650/382, 지붕은 같은 그림 source 주요 곡선, 휘겸은 낮은 잔교에서 기존 숨김→등장 연출을 따른다. 문간 장부·소굴·휘겸·원래 사건/대사/보상 기능을 유지한다.3장 campaign revision만1→2이며 이전3장 전투만 기존 성장/SP/장착/캠페인 보존 정책으로 재시작한다.1·2장과4장이후/11장WIP는 변경하지 않는다.

확인 범위:

- 새 주요길의 기본 보행/일반 도약1회, 오른쪽 상자→지붕의 일반 도약2회, 지붕 보행/내려가기→문턱 ledger 실제 상호작용 성공. 적 없는 geometry fixture이며 전투 완료 증거가 아니다. 주요길 HP 피해0.
- 초기13적의 기존 ID별 능력 동일, 지상 접지/공중 flightClear, 숨겨진 휘겸의 새 잔교 접지, conductive 물1개 확인. 초기 적을 모두 유지한 별도 placement probe에서 dock-beasts2개와 각 소굴2개 스폰 접지/비행 여유를 확인했다. 소굴 예산/정착 조건을 변경하지 않았다.
- 이전 revision1의3장 전투만 restart3으로 폐기하고 profile heroes/loadouts/cleared를 보존하는 국소 확인.
- build와 실제 overview/동일 구도debug/한옥 근접3뷰. pageerror0, 실제 입장 연출 뒤 휘겸 표시, source filter2회/far canvas1개를 공유한다.
- 실제 Chromium App에서 초기13개 적을 유지하고 두 영웅의 일반 대기 후 원래 동행/적 AI를 한 턴 관찰했다. 박쥐HBT01 발사, 산개가 약366world 이동 후HBR01, 나루장승이 약180world 잔교로 접근 후HWD01을 발사했다. 종료 시13적 전원 생존, 두 영웅HP425/454, 휘겸 유지. 적/배치/각성/피해/순서 강제 주입은 없으며 정상 전체 전투/전체 기예·무관 장 검증은 아니다.

원본 PNG와 진단 JSON은 `_local/reports/stage3-image-first/`, 부모용1MB 미만 WebP와 원본 PNG는 evidence 브랜치 `game/docs/art-reviews/stage3-image-first-20261019/`에 둔다. 초기3뷰 뒤 땅/문턱의 material 분류와 쓰지 않는 forestChoice metadata만 정리하여 최종 build를 갱신했으며 그림·vertices·배우·뷰는 동일하다. 통과한 기능 검사는 반복하지 않았다. 부모 화면 확인 전 master/Pages는 변경하지 않는다.
