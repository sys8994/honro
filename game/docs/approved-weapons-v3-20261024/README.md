# 승인 무기 음원 v3 후보 — 검수 중

기준9ed5e01d, 입력6b784c80(로컬20646500)의 부모 가공MP3 5개를 변경 없이 연결한다. bow_release/sword_swing/sword_hit/sword_parry/blade_launch만 새 원본을 쓰며, bow_hit와지형음은 아직v2다. 공개 배포 대상이 아닌 후보이며 master/Pages는 변경하지 않는다.

플레이어 A/S 무기의 정상 피해 이벤트에만 구down을 빼고 적/환경/다른계통은 유지한다. S계열은 승인된 전용준비음이 생기기 전까지 qi충전음 없이 시작/접촉음을 쓴다. 근접 swing은 실제 windup 시작, hit는 기존 접촉 판정에서 내고 contact용 stroke 그림에서 추가 swing을 내지 않는다. 연참/회신의 각 windup은 별도 인덱스로 구별한다. 전투/RNG/판정/그림/대본은 변경하지 않는다.

현재 소스를 먼저 보존하며 실제 Engine/브라우저/19장 비전투/기존 공개그래프 검사는 이어서 수행한다. 음원을 생성·재가공하지 않았고 기술적 연결 확인을 청취 품질 승인으로 표현하지 않는다.

최종 후보 전 중간 검수: Engine focused14개와 Chromium32개 통과. 실제5파일 served바이트/AudioBufferSource 연결, 구5hash 미요청, S00 windup→접촉 분리,7연참시작, 실패시 구폴백 없음 확인.64기예180스텝 상태/RNG는9ed와동일,19장 비전투/Continue/20장 복귀 검사는 통과했다. 자동 결과는_local/reports/approved-weapons-v3-20261024에 둔다. 최신 DOM master 통합 뒤 생성물을 다시 준비하며 활명중/지형 및 천뢰 입력은 아직 대기다.
