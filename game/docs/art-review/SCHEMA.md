# 미술 검수 기록

`current.json`은 관련 소스, 대표 장, 영향받는 전체 장, 별도 쉼터, 집중 기준과 최종 전체 판단 기준을 고정한다. `manifest.json`은 실제 기록만 가진다. 현재 기록은 fail 상태이며 부모 승인과 final을 비워 둔다.

- 각 round는 다르게 발전할 수 있는 소스 내용 hash를 가진다. `sourceState`는 Git blob 또는 별도 보관 바이트와 hash로 그 상태를 재구성한다. 앞 회차에 현재 hash를 강제로 붙이지 않는다.
- 캡처는 ID·stage·view·sourceHash·camera·viewport·원본 PNG/WebP path/hash를 원래 capture receipt에 연결한다. 메타데이터 바꾸기와 동일 픽셀 복제로 장/뷰/회수를 늘릴 수 없다.
- 과거 fail은 실패 ID, 구체적인 수정, 실제 전/후 소스, 새 캡처, pass 재판정으로 닫는다. 문장만 pass로 바꾸거나 미해결 목록을 비우면 차단한다.
- 최종 기록은 `reviewKind: holistic`으로 마지막 후보와 같은 최종 소스를 쓴다. 모든 집중 기준과 별도 전체 판단, 이전 pass 회귀, 대표 normal/wide/mobile, 영향 장 overview, 관련 rest가 필요하다.
- 최종·전체·부모 판단문은 이전 집중 판단을 복사할 수 없다. 부모 승인은 실제 받은 message 참조와 직접 본 최종 대표 이미지 전부의 refs가 있어야 기록한다. 먼저 채워 두지 않는다.

`node tools/release/art-review-provenance.mjs makesnapshot --out .../state.json`은 원본을 덮어쓰지 않는 sourceState를 만든다. 촬영은 `npm run build:preview` 격리 빌드와 `tools/environment/capture-vector-art-candidate.py TAG MODE`를 사용한다. public build는 gate 검사 전에 생성물을 쓰지 않는다.

Gate는 기록 관계·바이트를 검사한다. 사람이 실제 그림을 열었는지, receipt 작성자가 진실을 썼는지, 미술이 좋은지까지 자동 인증하지 않는다. 테스트의 합성 이미지·합성 부모 메시지는 테스트 fixture이며 실제 승인 자료가 아니다. rounds 2–6 receipt는 원래 checks 파일과 원본 이미지에서 소급 이관한 점을 명시했다.

집중 테스트: `node --test tests/art-review-gate.mjs tests/art-review-provenance.mjs tests/art-public-build-gate.mjs`. 전체 게임 verify와 무관하다.
