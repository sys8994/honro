# 2장 연결·엄호 위치 보완 검수

최종 런타임 소스: `324c1631d9a04b993057c4b8f10530df34b1fb23`. 기준 master `57ed06d770fc3a198d49eecb5db31891a5b8d7e8`. 이후 증거/검사 도구 문서 커밋은 런타임 동일. 설계는 [DESIGN.md](DESIGN.md), 캡처 출처는 [sources.json](evidence/sources.json).

계곡·상여 호송·공중 경고 이벤트는 유지했다. 기존 가지 5개의 떨어진 접속을 이어 상단/중단/하단 엄호 위치로 실제 이동할 수 있게 했다. 가지의 초기 평행 띠 명암을 접합부 굵기·단면 변화로 수정했다. 지상8체는 전위3·물길 단독1·동측 혼합3·출구 단독1. 공중4체, 유한 증원2+2, 행동 상한3, HP/성장 예산은 유지한다. 절벽 본체·바닥·원경·카메라·스토리·참가 캐릭터는 변경하지 않았다.

## 직접 연 이미지 검수

1. **전체 구조·지지:** `evidence/baseline`, `review1`의 overview/normal. 기존 떠 있는 가지를 확인하고 접속을 구현했다. 상단~하단의 단차를 유지하며 공중 빈 공간을 메우지 않았다.
2. **디테일·가독성:** `review2` joint/lower/roost/convoy 확대. 초기 가지의 긴 평행 띠를 발견해 굵기 변화와 내부 면을 다시 저작했다. 원경과 지형 대비, 바위/나무 접합, 캐릭터 보행면을 직접 확인했다. 이후 지상 적을 최종3/1/3/1로 다시 정리했다.
3. **카메라·상태:** `review3` normal/zoom/maxout/mobile-entry/mobile-upper/mobile-convoy/landscape-upper/landscape-convoy 및 정상 플레이의 upper-connected/middle-cover/airborne-warning/convoy-arrival. 데스크톱 최소줌0.2117647, 세로390×844, 가로844×390. 좁은 가로 화면은 기존 HUD 때문에 세로 시야가 좁으며 구간을 팬해서 본다. 이미지를 늘이거나 카메라 규칙을 바꾸지 않았다.
4. **최종 별도 종합:** 최종 소스324c1631의 `final-detail`과 `final-combat`, 같은 소스 `review3`를 다시 대조. 연결, 굵기, 사선, 산수 원경, 3/1/3/1 배치, 상여 도착, 모바일 배우 식별, 결과 창을 확인했다. 알려진 수정 범위의 차단 결함 없이 내부 검수를 마쳤다. 세 번이라는 횟수로 자동 통과시킨 것이 아니다.

## 실제 플레이·관련 검사

- `final-combat/combat.json`: 로컬 실제 Chromium/production Engine의 move/drop/fire/wait, 정상 적 AI·missionTick. 합법적인 1장 최초 보상 ledger를 준비한 새2장(연속 캠페인 완주 주장 아님), 경지1 설오 HP376, 기본 화살, 자원/좌표 리셋 없음. 상단 x990→중단 x1381 실제 이동. **16턴 승리, 설오254/376, 기력99, 상여1700/1700·x3340, 적0**, 화살12회·대기4회. 다섯 사건 모두 실행. 결과 창·완료 기록 저장·다음 쉼터 연결 확인. 키보드 수동 완주가 아닌 유한 실제 엔진 입력 검사다.
- `routes-shots.json`: 상/중/하 세 경로 실제 유한 이동, 낙하 피해0·invalid contact0. 각 자리에서 공중/출구 적에 실제 기본 화살 명중. 준비된 사격 포즈 검사는 별도이며 정상 완주로 둔갑시키지 않았다. 기본 shotSeeds가 놓치는 상단 사선은 직접 정한10도/85% 발사로 확인했다.
- `npm run build`, `npm run test:stage2-airborne`: 공중 경고→새 플레이어 대응→해제, 유한 증원 안전 경계, 구전투의 한정 위치 복구, 같은 전투 export/Continue 보존 통과.
- `HONRO_BASELINE=/tmp/stage2-master-baseline.json node tests/stage2-positioning.mjs`: **다른29장 및 공통 library가 기준 master와 정확히 동일**.
- `node tests/pre-image-terrain-restoration.mjs`: 2장 revision5 구전투만 새6으로 재시작, 성장/완료/장착/설정 보존, 같은 revision 유지. 기존3–10장 역사 비교 유지.
- `node tests/stage1-positioning.mjs`: 승인된1장 이동/실탄 회귀 통과.
- 기존 App 검사 harness는 삭제된 옛 bootstrap 문자열 때문에 실행 전 실패했으며 현행 lazy-loader bootstrap에 맞춰 검사 연결만 수정했다. 새 오른쪽 가지에서 공중 clone이 이미 안전하므로, 옛64px 복구 검사는 실제 이전 가지 fixture를 별도로 보존해 계속 검사한다.

## 범위와 한계

전체 지형 전면 재설계나 전30장 미술 합격이 아니다. 기존 절벽의 큰 명암면과 일부 바위의 단순한 조형은 유지했다. 상단 끝에서 계곡 바닥으로 직행 낙하하면 기존 낙하 피해가 있다. 이번 보장 경로는 위/중간/아래 엄호 자리 사이이며 지상으로의 무피해 자유 낙하를 보장하지 않는다. 시작 고지에서 그대로 엄호하는 기존 선택도 유지된다. 자동 입력의 고정 프레임 캡처에는 일시 피해 숫자가 남을 수 있어 정적 미술 캡처와 구분한다.

공개 사이트403 및 기존 Actions API Forbidden은 재시도·우회하지 않았다. 로컬 화면 검증이다. 1장 포함 master57ed06d의 Actions39519356821 success는 부모가 확인해 전달했다. 2장의 배포 결과는 master push와 구분해 별도로 기록한다.

Library 실제 화면 모음: `libfile_f2d691480e508191b56e0a19f4e342fe` (`file_0000000001fc82309f6f46f768634dfb`).
