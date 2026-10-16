# Stage26 normal observation — source 2314ee6



실제 raw의 피해·발사·이동을 군집별로 연결한 준비 packet이다. 디자인 완료/독립 승인/전체 gate 통과는 아니다. runtime과 예산 변경 없이 5라운드 정상 입력 완주를 관측했다. 상세 범위는 normal-input-observed/README.md.



## record-room-remnants

기록을 지우라는 사념이 남은 죽은 육신. 기록실 접근면을 분리한다.

지지면: a3-foundation. 원본 roles: frontline, ranged.

실제 적→아군 피해 2건/87. 첫 효과: trace.damage[2] frame939 actual HP -37; actor a3-26-record-room-remnants-0 → p-knight.

군집 표적 입력 1건. 결과 actions와 trace 피해를 구분했다. 표적 발사 기록은 반응의 입력 증거이며 사후 명중/회피 의도 판정은 아니다.



## casting-yard-tools

구조 대상 동쪽 공방에 들린 도구. 주민 접근면은 비운다.

지지면: a3-foundation, work-loft:collision:0. 원본 roles: frontline, frontline, ranged.

실제 적→아군 피해 3건/112. 첫 효과: trace.damage[6] frame1702 actual HP -26; actor a3-26-casting-yard-tools-0 → p-occultist.

군집 표적 입력 2건. 결과 actions와 trace 피해를 구분했다. 표적 발사 기록은 반응의 입력 증거이며 사후 명중/회피 의도 판정은 아니다.



## tally-store-remnants

수거량 기록 주변 무리와 상부 별도 사선.

지지면: a3-foundation. 원본 roles: frontline, ranged, frontline.

실제 적→아군 피해 2건/63. 첫 효과: trace.damage[13] frame3052 actual HP -29; actor a3-26-tally-store-remnants-0 → p-occultist.

군집 표적 입력 1건. 결과 actions와 trace 피해를 구분했다. 표적 발사 기록은 반응의 입력 증거이며 사후 명중/회피 의도 판정은 아니다.



## surface-exit-remnants

강변 복귀길에 남은 두 도구.

지지면: a3-foundation. 원본 roles: frontline, ranged.

실제 적→아군 피해 1건/26. 첫 효과: trace.damage[17] frame3899 actual HP -26; actor a3-26-surface-exit-remnants-0 → p-occultist.

군집 표적 입력 1건. 결과 actions와 trace 피해를 구분했다. 표적 발사 기록은 반응의 입력 증거이며 사후 명중/회피 의도 판정은 아니다.



## 상태

source inventory waves=[]와 정상 실행 response0이다. 새 파동 없음. gate-prepared.json은 군집 관측만 연결하고 나머지 mandatory checks/review는 pending을 유지한다. 실제 피해가 없는 군집은 없지만 플레이어 선택의 인과·지붕 전술효과·전체적 이동·정상 브라우저 전투는 미검증. 따라서 전체 gate는 차단 상태가 맞다.
