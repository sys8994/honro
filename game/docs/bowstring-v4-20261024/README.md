# 설오 활시위 발사음 v4

기준master `8037a13efeaaa6ec6149b573cb1f624895c45812`의 직계후손 입력 `704b98b2125c4890d685a6d2b2d9b1c2809aeae1`에서 시작했다. 22장 수비HUD P0와 이전 음향/VFX를 보존한다. 런타임소스 `8ac827038ac16bbc0ed791946c5db2af697ec15b`, 브랜치 `fix/bowstring-v4-20261024`. master/Pages는 부모 담당이다.

설오 bow_release 자산만 saturdaysoundguy Longbow Release1(Freesound394178,CC0)의 부모 처리 MP3로 교체했다. 공개HQ MP3 preview이며 원본WAV가 아니다. 피치/새레이어/재인코딩을 추가하지 않았다. 입력실물·manifest·served SHA256은 `d359936cf63869053ace383263162c9b45bb1e52af1a9bf1612d27a31107872a`, **8,402B**, decode약.468초다. 전달설명9,656B와 달랐지만 입력파일/manifest가 서로 일치하므로 그 원본을 그대로 사용했다.

기존 기본 release gain.80→.95만 변경했다. 자동 연사 후속 묶음의 기존.35 감쇠·고정 rate sequence·버스·volume·voicecap·compressor는 그대로다. 기존두release는 현재/실패 경로에서 재생하지 않고 과거 공개클라이언트 보존용으로 남긴다. hit/bow_charge/다른캐릭/M05 자산·metadata와 cue를 기준과 exact 대조했다. UI/HUD22·게임/스테이지 소스와 VFX는 변경하지 않았다.

검사: `node tests/bowstring-v4.mjs` 5개(입력hash/선택적gain,실제A01/A04연사/A99의발사묶음별1회·상태/RNG동일,다른전체음원bank exact), `python tests/bowstring-v4-browser.py` 11개(실제App/Engine/WebAudio의빠른release/held/gain.95/.468초·취소·mute/unmute·새파일503에구폴백없음·served hash), TypeScript/JSsyntax·공통build·web-split 통과. 주관적 원음/후처리 청취승인이나 실기기 검증은 아니다.

최종entry `game.982ed8b7117d809b.js`, active414파일graphSHA256 `8aefebaa5eab364e87ad632343f15d47a546d7fd9f4d6e912e2d4d0712487ca8`. 최신base `game.64a30efb63ac06fc.js`와 이전명시공개DOM `game.872345135ff221d0.js`, 기존35발행그래프를 보존하고 원본byte/hash를 검증했다. 새 발행시각/성공을 임의 등록하지 않았다. 세부JSON/로그는 `_local/reports/bowstring-v4-20261024/`에두며 자동결과는Git에추가하지 않는다.
