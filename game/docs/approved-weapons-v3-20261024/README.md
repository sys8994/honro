# 승인 무기 v3 연결 후보 — 추가 입력 대기

입력 `6b784c802a6fcc8e0571a2910546f66727f0340a`의 부모 가공 MP3 5개를 그대로 사용한다(로컬 입력 커밋20646500). 작업 브랜치는 `fix/approved-weapons-v3-20261024`다. 9ed5e01d에서 시작했고 DOM 긴급 수정 master `1a0dbc8b79f8992c9cdcb63fd0c958af149c679b`를742ecf9a로 통합했다. 제품 story/main/CSS는 이 DOM master와 동일하다. 음원을 생성·재합성·재인코딩하지 않았다.

**현재 공개 배포 대상이 아니다.** 활 명중/지형 후보와 천뢰호 새 음원·목표gain은 부모 입력 대기다. 이 문서는 부분 후보의 구현/검증을 보존하며 청취 품질 승인이나 master/Pages 완료를 뜻하지 않는다.

## 적용 경계

- bow_release/sword_swing/sword_hit/sword_parry/blade_launch만 새 파일로 연결한다. 원천·처리 metadata도 새 manifest 값으로 바꿔 옛 합성원음 설명을 남기지 않는다. bow_hit/arrow_block/bow_charge 등 미승인 교체 영역은 기존v2다.
- 실제 정상 플레이어 A/S 피해에서 구 procedural down의 중첩을 제외한다. 적/환경/M/O 사망은 유지하고 전역 사망음을 없애지 않는다. 정상 A/S 피해 외 별도 passive/environment 피해 경로까지 무음화하지 않는다.
- 모든 S기예는 전용 준비음 확정 전까지 공통 qi_charge/loop를 쓰지 않는다. 입력 충전·강도·발사 판정은 그대로이며 억지 대체음을 넣지 않는다. 담허/소단의 qi 충전은 유지한다.
- 근접 swing은 실제 meleeAction windup의 시작 경계를 지날 때1회, hit는 원래 접촉 판정에서 발생한다. contact용 stroke 그림에서 추가 swing을 내지 않는다. 연참/회신의 각 시작은 stroke 인덱스로 구별한다. dt0 반복과 중간 저장 복원은 과거 시작음을 재생하지 않는다. 응수는 실제 parry/hit만 내고 준비 자세나 접촉 그림이 swing을 추가하지 않는다. 도약/검기/소환의 기존 실제 발사 경계는 유지한다.
- 파형·물리·피해·RNG·전투 규칙·대사·DOM을 변경하지 않는다. 기존 음성 상한/20ms 정리/결정적 rate 변주(무기±2%)는 유지한다. 파일에 추가 피치 가공을 한 것은 아니다.

## 검증

- `HONRO_AUDIO_BASE=9ed5e01d node tests/skill-sfx-runtime.mjs`:64기예 실제 발사180스텝의 전체 전투/저장 상태/RNG가9ed 엔진과exact동일. 지형/진목/축지/소환 등 기존 집중 확인 통과.
- `node tests/approved-weapons-v3.mjs`:14개 통과. 입력5blob exact, S충전음 제외, S00시작→접촉 분리/중복0,7연참·회신 시작 인덱스, 중간Continue/정지dt0, 응수, A/S치사down 제외, 적/환경/M/O 사망 유지, 자동소환 경로를 확인했다.
- `python tests/approved-weapons-v3-browser.py`:최종 DOM 통합 빌드에서32개 통과. 생산 App/Engine과 실제 Chromium AudioBufferSource로5승인파일 재생, served바이트 exact, 구5hash 미요청, S00충전 무음과 windup/접촉 분리,7연참 시작, 치사down 중첩 제외, 새 파일503시 구/합성폴백 없음. 여러 기본/검 기예 전환 표본에서9자산 요청9/decode9, decoded997,584B, 종료 활성음성0이었다. S07초기 표본의 적 후속 공격음은 몬스터 경로였으므로 제품에서 없애지 않고 실제7연참 구간으로 분리했다.
- TypeScript·변경JS syntax·공통build·web-split 통과. `tests/stage19-farewell.mjs`는 DOM통합 후에도19장 공격/예측/충전 차단, 조작권/이동,중간Continue/구저장,20장복귀를 통과했다. DOM 원문을 재작성하지 않았다.

원음 노드gain/PCM/파일 차이는 서로 다른 파형의 체감 음량·임팩트·사용자 취향을 입증하지 않는다. 기술적 연결 확인을 청취 합격으로 설명하지 않는다. Chromium의 준비 전투/관측이며 실기기 Android/Safari나 공개 오디오 녹음은 아니다.

## 천뢰호 확인 — 변경 없음

M04/M05는v2 thunder_hit `8fc5fd1d0f444a24`를 공유한다. 실제 두 발동에서 자산gain.75, master.55 표본의 압축 전 배율.4125를 관측했다. 첫 발동rate1, 이어 같은 자산을 쓴 두 번째발동.97은 공통 결정적±3% sequence이며 M05전용 저음/감쇠가 아니다. 각각12대상 피해에도 본체소스1회이고 새 재생누락0이었다. 계통gourd 음성3, 전체스킬16/전체출력20 상한이 있으며 다른 호류 중첩 때 오래된 계통음이 정리될 수 있다. 이 단독 발동 표본에서 천뢰가 그 상한 때문에 누락된 것은 아니다.

천뢰 전용BGM duck은 없다. SFX는 공통 compressor(-12dB threshold,ratio5,knee12)를 지나고 BGM은별도 출력/설정이다. 실제천뢰표본은BGM을 껐으므로 음악에 묻히는 청취 현상을 확인한 것으로 말하지 않는다. 천뢰 파일/gain/duck은 이번 후보에서 바꾸지 않았고 부모 입력을 기다린다. VFX 시안도 적용하지 않는다.

## 생성물·인계

최종 런타임 소스742ecf9a의 진입은 `web/entries/game.b63336e535aa0f12.js`, 활성413파일 graphSHA256은 `5398a5ebfd17969c9d2f7365c5917935b5190aeb08f321c7261a8a90f294d9cf`다. DOM master의 `game.872345135ff221d0.js` 후보 그래프, 기존 성공발행35그래프, 이전 무기후보를 포함해760 immutable파일의 길이/SHA256을 확인했다. 발행 시각/성공근거를 임의 추가하지 않았다. 구5음원은 과거클라이언트의 보존그래프에 남을 수 있지만 새 재생/오류폴백에는 없다.

자동결과는 `_local/reports/approved-weapons-v3-20261024/`의 native.json/browser.json/retention-dom.json/thunder.json과 각로그에 둔다. Git제외를 유지한다. master와Pages는 부모가 추가입력/최종후보를 검토한 뒤 처리한다.
