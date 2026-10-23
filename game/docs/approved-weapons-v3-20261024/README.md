# 승인 무기·천뢰 음향 및 세로 낙뢰 최종 후보

브랜치 `fix/approved-weapons-v3-20261024`. 기준9ed5e01d에서 시작해 DOM master `1a0dbc8b79f8992c9cdcb63fd0c958af149c679b`를 통합했다. story/main/CSS/스테이지 원문은 이 master와 동일하다. 런타임 검수 소스는 `cdfc3587cd145dff7f9ec1486b1e60cf39e2b43d`다. master/Pages 배포는 부모가 수행한다.

입력은 부모 제작/가공 파일을 그대로 사용했다. 무기5개 `6b784c80`→20646500, 천뢰 `da5a3ef6`→2befdc5f, 화살2개 `e3ff4c39`→e557d6e3, 승인 VFX 문서 `ad44b2dd`→616d3537이다. **8 MP3를 생성·재합성·재인코딩하지 않았고 입력 blob/served 바이트 일치를 확인했다.**

## 음향 변경

- bow_release/sword_swing/sword_hit/sword_parry/blade_launch를 승인 실제 원파형 파생본으로 연결했다. S기예는 전용 준비음 확정 전까지 qi_charge/loop 없이 원래 충전 입력·강도·발사 판정을 유지한다. 담허/소단 qi충전은 보존한다.
- bow_hit는 piercing-1a, arrow_block은 piercing-arm-2a 파생본이다. 기존 지형mat의 wood/support만 충돌gain.25, 그 외 기존 기본값.45로 처리하며 새 재질/판정은 없다. 갑옷/금속 계열 충돌 원음을 모든 땅이 금속이라는 설정으로 설명하지 않는다.
- **Additional Sound FX by Will Leamon**, 작품 **Fleshy Fight Sounds**, 출처·OGA-BY3.0 링크·가공 표시는 루트README, 원본SOURCES/arrow-hits.json, 배포되는 자산 metadata에 보존했다. 새 크레딧UI는 만들지 않았다.
- M05는 전용 cheonroe_thunder(.90gain), M04는 기존 thunder_hit(.75gain)로 분리했다. 새 천뢰 파일은 부모 metadata상2.3초/decodedPeak.820/RMS-21.44dBFS(이전 약-24.56), gain배율은기존대비1.2다. 이 수치들은 스피커 체감·최종 출력 증가를 보장하지 않는다. 실제 source.start에서 M04.75/M05.90 및 다중대상 본체1회를 확인했다. 파일 피치/길이에 추가 가공은 없고 기존 runtime 결정적 변주/voice cap/global compressor는 유지했다. 별도BGM duck은 넣지 않았다.
- 정상 플레이어 A/S 피해의 구 procedural down 중첩만 제외한다. 적/환경/M/O 및 별도 passive/environment 사망은 유지한다. 근접 swing은 실제 windup 시작을 지날 때1회, hit는 원래 접촉에서 내며 contact 그림의 추가 swing을 제거했다. 연참/회신은 stroke 인덱스로 구별하고, dt0/중간Continue는 지난 시작음을 재생하지 않는다. 응수 준비/접촉 그림도 swing을 추가하지 않는다.
- 새 파일이 늦거나 실패하면 구 합성음으로 돌아가지 않는다. 구7파일은 과거 공개클라이언트 보존용이며 현재 요청/재생 폴백이 아니다. 캐시/입력/20ms 정리·음소거·29자산 유한은행·계통/전체 음성상한은 유지했다.

## 승인 VFX 구현

부모 concept.svg/draw.py/INTEGRATION.txt를 읽고 SVG를 렌더해 확인한 뒤 M05 seeded 분기만 바꿨다. 긴 줄기 기준 횡진폭약48→11, main/white core 선폭1.3배다. 불규칙 높이의1차짧은가지18–22개와2차잔가지10–14개가 옆·아래로 향하며 접점은 실제 줄기 보간 위치/1차가지 중간점에 맞춘다. 크기는 월드 길이로 계산하고 cap을 두며 시안 픽셀을 화면 좌표로 옮기지 않았다.

같은 seed/phase 형상은96항목 상한으로 캐시하고 가는 가지를 style별로 묶어 그린다. 새canvas/필터/거대입자/per-frame random이 없다. M04/default geometry와 drawing command는9ed와exact이고, M05도 원래 halo/contact flare·머리별 독립 낙뢰·끝점·수명.9초·피해/범위/시간/전투RNG/제품카메라는 유지했다. 전체프레임 성능이나 체감개선을 주장하지 않는다.

## 최종 검사

- `HONRO_AUDIO_BASE=9ed5e01d node tests/skill-sfx-runtime.mjs`:64활성 기예 실제 발사180스텝의 전체 전투/저장 상태와RNG exact동일. 기존 진목/축지/소환/피해 집중 검사 포함.
- `node tests/approved-weapons-v3.mjs`:15개 통과.8입력blob, S충전 제외, 실제windup/접촉·7연참/회신·응수·중간Continue/dt0, 선택적down제거/적·환경·다른계통 보존, M04/M05 gain분리와 기존mat 전달 확인.
- `node tests/skill-sfx-player.mjs`:7묶음 통과. 버퍼/요청 재사용, 충전 연결/20ms 취소, 음성 상한, 천뢰 중복 제한, mute/지연/실패 후 과거음 미재생.
- `python tests/approved-weapons-v3-browser.py`:57개 통과. 생산 App/Engine→실제 Chromium AudioBufferSource에서8새파일, served exact, 구7hash 미요청, M04기존/M05전용gain,10대상1회, soft gain, 크레딧 metadata, mute/unmute/503의 지연·구폴백 없음. 전환표본15자산 요청15/decode15, decoded2,207,280B, 종료활성0. dropped1은 의도적으로 음소거한 이벤트다.
- `node tests/cheonroe-vertical.mjs`:M04명령 exact·M05주줄기1.3배·줄기/가지 접점과개수/개별seed·seeded반복과cache퇴거·per-frame random0·기존contact/halo/시간 보존 확인.
- `python tests/cheonroe-vertical-browser.py`:실제App.frame을 중단/교체하지 않고390×844/844×390 각각1·3·10대상6화면을 캡처했다. 실제머리접점/개별seed/FX aging/자동소멸과App시계 진행 확인. portrait실측zoom.65/camera(1000,650), landscape.75/(1000,930). 준비된 허공터이며 일반캠페인 플레이로 표현하지 않는다.
- TypeScript·변경JS syntax·공통build·web-split·19장 비전투/조작권/이동/중간Continue/구저장·20장 정상공격 복귀 검사 통과. 전체 캠페인/물리Android/Safari/주관적 청취를 했다고 주장하지 않는다.

파일/PCM/gain/메타데이터 및 기술검사 통과는 사용자 취향·임팩트·실제 음량·미술 품질 보장이 아니다. 사진은 부모의 최종 시각 확인용이고 새 시안이나 음원을 임의 창작하지 않았다.

## 생성물과 증거

최종 진입 `web/entries/game.43758b5ea28cc2fd.js`, 활성414파일 graphSHA256 `53cdd5d9e43b8425b8753193bc394463df892ae621e2b7e292afe2efc0d3b25e`. 부모 DOM의 `game.872345135ff221d0.js` 그래프와 기존 성공발행35그래프를 포함해766 immutable파일의 길이/SHA256을 확인했다. 발행 시각·성공을 새로 꾸미지 않았다.

자동 로그/JSON/사진은 `_local/reports/approved-weapons-v3-20261024/`에 Git제외로 보존한다. 최종6 JPG는 live-390x844-{1,3,10}.jpg와live-844x390-{1,3,10}.jpg이며 선택한 실제사진만 허용된 별도review브랜치로 전달한다. 코드 후보에 자동 스크린샷을 넣지 않는다. 이전 입력 전의 천뢰 공유.75 진단(thunder.json)은 역사적 관측이고 최종 전용.90 동작은 browser.json을 따른다.
