# 27장 「검은 집하장」 지형 검수 시안

브랜치 `terrain/stage27-depot`, 기준 `d7c1f8457dd33decda5481c7c3b57d8505f6f157`.
사용자 미술 승인 전 시안이며 master/Pages에 반영하지 않았다.

## 실제 결과 이미지

- `native/stage-27-overview.png`: 실제 공통 HonroScene의 Native Canvas 전체도. 브라우저 화면이나 개념도가 아니다.
- `browser/desktop-entry.png`: 실제 Game Chromium, 동행·적·조준선 포함 입구.
- `browser/desktop-loading.png`: 실제 Game, 하역 전투 구역 검수 카메라.
- `browser/mobile-loading.png`: 실제 Game 844×390 모바일 검수 카메라.
- `browser/desktop-manifest.png`: 실제 Game, 명세 보관실.
- `before/`: 같은 Native 카메라의 기준판. 현재 이미지와 구분해야 한다.
- `void-event/`: 기존 필수 조우 브라우저 회귀. 이 이벤트 검사만 적이 제거된 통제 fixture이며 정상 전투 완료가 아니다.

브라우저는 사용자 세이브가 없는 새 context 및 합법적인 장 진입용 준비 profile을 쓴다. 맵 검수 화면에는 적 삭제나 승리 판정 해제가 없다. 카메라를 검수 좌표로 옮겼으며 이동해 도착한 정상 플레이 화면이라는 주장은 하지 않는다.

## 변경

수문 정비축과 구분하기 위해 큰 아치/일률적 높은 프레임 배면을 수몰 하역 구획으로 바꿨다. 낮은 목조 하역창, 보·기둥의 맞춤과 사선 버팀, 석재 받침, 끊긴 판벽, 수면의 낮은 화물선 잔해가 장소를 설명한다. 후경은 무윤곽·저채도, 실제 전투면은 밝은 윗면과 어두운 윤곽을 유지한다.

부두 세 곳의 두께를 외형과 동일한 충돌 다각형으로 보강했다. 하부 적재 경사면은 양쪽 기본 보행으로 접근·복귀하며 중앙 수레를 100 높은 실제 지지면에 놓는다. 적 수·종류·정예·군집·증원은 유지했다. 기존 작은 shed를 지형에 맞춘 낮은 하역창과 인양대로 다시 그렸다. 석재 배면 기둥은 심부의 낙하 이음새 x3850에서 옮겨 시각적 관통 오해를 피한다.

네 진목 연결/양동행 이동·5개 기본 보행 구간·관찰창·필수 증언과 증거 수집·출구·물 경계는 보존한다. 목표 revision·기존 사건·진목 자원/임시 지급/실패 복구 런타임은 바꾸지 않았다. `voidEncounter` trigger x3370–4230/y3050, seam3850/3050, support `gallery-6:collision:0`, 물방울/함몰 벽도 그대로다. 낙하2.8초·암전1.8초·정적0.4초와 대사/UI/음향 코드 역시 변경하지 않았다.

## 실행 검증

- 신규 저작 재현/멱등성, 다른29장과 과거 모든 자산 불변, 목표·물·사건·기존 필수 route 불변.
- 두 동행 × 양방향 =4회 실제 기본 보행. 위치 준비/이동도 보충을 사용하는 **기하 검사**이며 정상 자원 완주가 아니다.
- 양쪽 지원면에서 A01 실제 발사2회. 전체 적을 남기고 기본 자원 비용을 사용해 실제 피해 확인. 준비된 위치의 사선 검사이며 전투 완주가 아니다.
- 기존 진목27개 바람/연결 실제 발사·착지 사례 통과. 이 기존 검사는 적 제거와 승리 판정 해제로 기하만 분리한다.
- 낙하/reload/checkpoint/event guard28항목 통과.
- 필수 조우 runtime12그룹 및 실제 desktop/mobile/Workshop 브라우저 회귀 통과. 낙하·시뮬레이션 동결·빠른 입력·중단·회전·BGM 복구·안전 복귀·READY reload 확인.
- Production App export/import/Continue/retry 집중 검사: 기준판 전투의 지형·유닛·목표·사건·round/session 그대로 Continue, 명시 retry는 새 지형, 이후 Continue도 새 지형 그대로 유지. DOM/storage는 테스트 대역이다.
- 두 HTML 빌드, 환경30장 오류0, 독립 PC/mobile 맵 브라우저 JS 오류0.
- 구현자 및 부모 별도 미술 검토: 전체도/하역 장면을 실제 픽셀로 봄. 사용자의 미술 승인·전투 합격과 다르다.

## 차단·미검증

공식 자료는 문화재청 「고려시대 조운선(마도1호선) 복원보고서」 https://www.cha.go.kr/cop/bbs/selectBoardArticle.do?bbsId=BBSMSTR_1021&nttId=32264 와 한국관광공사 화홍문 https://english.visitkorea.or.kr/svc/contents/contentsView.do?vcontsId=108749 를 찾았다. 접근 실패/다운로드 터널403으로 공식 사진의 실제 픽셀을 열지 못했다. 사진 기반 고증 확인 완료를 주장하지 않으며 이미지 파일을 게임에 복사하지 않았다.

`tests/act3-save-boundaries.mjs`는73행 `0 !== 1` 실패. 깨끗한 정확한 기준 d7c1f84에서도 동일 실패를 재현했다. 신규 Stage27 save 집중 검사는 별도로 통과했다. 전체 verify·정상 자원 전투 완주·전체 증원 실효 행동·성능·공개 Pages·encounter acceptance 최종 gate는 이번 시안에서 미실행이다. 이 시안을 최종 전투/배포 승인으로 취급하지 않는다.

## 재현

`node tools/map-forge/stage27-depot-revision.mjs`는 현재 campaign의27장에만 적용하는 멱등 authoring pass다. 일반 live save에 적용하지 않는다. 전체 상위 맵 생성기를 다시 실행해27장을 재생성했다면 최종 story/objective 저작 뒤 이 pass를 다시 적용해야 한다. 원래 runtime/approval fixture를 느슨하게 바꾸지 않았다. 승인 후 통합시 역사 manifest의 정확한 delta 등록은 별도 필요하다.
