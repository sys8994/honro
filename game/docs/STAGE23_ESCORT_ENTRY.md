# 23장 하역장 호송 · 최초 입장 및 역사 기준

## 동결 출처와 증거 범위

기준은 최종12를 포함한 master `7df220ba9de5a0eeee3432091f92cf285cbc86f6`, tree `2d961adc788f5d6cc17884b13c81f9ab6a0fcb96`다. 준비 문서의 과거 레벨 추정을 재사용하지 않고 이 소스의 실제 최초 완료·합류 보상 함수로 다시 계산했다.

`tests/stage23-escort-entry-helper.mjs`는 최신12의 `quarryEntryProfile`과 같은 입장 전 배분 방식을 쓰며, `stage18-bell-fullplay-helper.mjs`의 `campaignEntryReadiness(g,{through:22})`를 직접 재사용한다. 이 함수는 각 장의 전투를 생성하고 실제 `HonroProgression.complete/recruit`를 호출한다. 전투·목표를 정상 입력으로 수행하는 함수는 아니다. 따라서 결과의 정확한 이름은 **1–22장 최초 완료/합류 보상 장부 fixture**다. 1–22장 실제 연속 완주, 실제22 승리 저장, 실제23 진입 영상이라고 부르지 않는다.

모든 before 자료는 위 commit의 Git blob에서 읽었다. 실행 당시 runtime128파일과 campaign 원문이 그 blob과 같은지 capture 전후에 확인했고, 원문 campaign과 production runtime 프로젝트도 같았다. capture는 이미 존재하는 파일의 덮어쓰기를 거부했다. 이후 새 지도에 맞추어 before 자료나 과거 golden을 갱신하지 않는다.

- `tests/fixtures/stage23-escort-history-before.json`: 30지도·573개 기존 asset·순서·전역값·runtime128파일·기예/성장·기존 역사 fixture22파일의 해시. 향후 좁은 역투영을 위한 일부 runtime 원문도 포함한다. 이 원문은 역사 비교 자료이며 실행하지 않는다.
- `tests/fixtures/stage23-escort-history-stage23.json`: 원본23 전체지도, content/balance, 목표/NPC/배우/events, 실제 첫 전투 actor·지형 해시·성장 예산.
- `tests/fixtures/stage23-escort-history-entry-ledger.json`: 22행 보상 장부와 legal representative profile, 실제 선행 학습 기록, 능력6/0의 자원값.

세 파일의 SHA-256은 `tests/stage23-escort-entry.mjs`에 고정했다. 이 baseline은 새로운23 변경의 승인을 뜻하지 않는다. 새 history projection은 현재 지도·새 asset·허용 runtime 바이트를 먼저 정확히 검증하고 나서 이 baseline으로 돌아가야 한다. revision flag나 이름 prefix만 확인하고 새 자료를 지우는 방식은 허용하지 않는다. 기존12→30→18 history 계층은 그대로 유지한다.

## 보상 장부와 합법 대표 배분

보통 난이도. 네 동행 모두 XP **75,748**, 경지 **16**, 획득 수련 **33**이다. 기존 reward 경로의 합류 자동수련은 입장 전 `resetTalents`로 환급하고, 필요한 선행부터 `trainReason/train`으로 다시 배운다. 추가 포인트 지급은 없다. 이 환급·배분은 실제 전투가 만들어지기 전에만 한다.

|동행|장착4칸, 모두 rank1|장착 외 필수 선행, 모두 rank1|능력|소모/잔여 수련|
|---|---|---|---:|---:|
|설오|A01/A14/A11/A02|없음|6|9/24|
|담허|M01/M04/M11/M03|M06/M02|6|11/22|
|휘겸|S00/S03/S01/S04|S06|6|10/23|
|소단|O01/O04/O08/O11|O02/O03/O06/O07|6|13/20|

계획의 후보4슬롯은 전부 합법으로 확인했다. 추가 패시브0, SP03/M09 미습득·미장착이다. O11은 소단의 선택기예로 합법 장착했지만 NPC 선도·문서E를 대행할 수 없다. 기본기 비교는 동일 XP/능력/파티/4슬롯에서 A01/M01/S00/O01만 사용한다. 기본기 모두를 무기력 비용이라고 부르지 않는다. 특히 완전 축세 S00은 정상 MP 비용을 지불한다.

신규 canonical 전투에서 실제 나온 seed는 **19388**이다. 장 번호에 임의 공식을 적용하거나 생성 후 seed/rng를 덮어쓰지 않는다. seed는 난수 흐름 전체와 같다는 뜻이 아니므로 실제 trace는 당시 rng도 별도로 저장한다.

## 대표 능력6와 지형 능력0을 구분

|동행|대표 HP/MP|대표 이동|같은 XP·능력0 HP/MP|능력0 이동|기본 점프 비용|
|---|---:|---:|---:|---:|---:|
|설오|962/225|1886|815/186|1640|75|
|담허|1053/326|1909|870/240|1660|75|
|휘겸|1769/253|2223|1330/209|1750|75|
|소단|1240/381|1994|1000/287|1690|75|

지형 프로필은 `escortEntryProfile(g,{ordinaryStats:0})`, 정상 대표는 기본 `escortEntryProfile(g)`다. 같은 기예와 장부를 유지하고 일반 능력 투자만 다르다. 능력0의 소모/잔여는 설오3/30, 담허5/28, 휘겸4/29, 소단7/26이다. 지형 프로필로 이동을 통과했다고 능력6 정상 전투 승리로 세지 않는다. 반대로 높은 능력6 이동량만으로 기본 접속길을 합격시키지 않는다.

App의 정상 방어는 행동을 끝내며 최대HP4% 회복, `max(regen, 최대MP12%)` 회복, 최대HP12%의 최소 보호막을 준다. 각각 반올림하며 자원 최대치를 넘지 않는다. 대표에서 가능한 HP/MP 회복 상한과 보호막 최소치는 설오38/27/115, 담허42/39/126, 휘겸71/30/212, 소단50/46/149다. 가득 찬 입장에서는 실제 회복량0이다. entry 검사는 독립 복제 전투에서만 HP/MP를100 낮춘 명시적 fixture로 production `App.defend`의 회복 및 실제 행동 종료 호출을 확인한다. 이 인위적 감소를 정상 플레이 trace에 사용하지 않는다.

정상 입력 정책은 소모품 사용0, 외부 HP/MP/이동력/좌표 쓰기0, `recover` 호출0이다. 원래 입장 소모품 `{heal:3, focus:3, cleanse:2, ward:2}`를 삭제하거나 지급하지 않고 사용하지 않는다. 상부 선점·복귀는 실제 이동·도약·기예 비용과 행동 종료를 기록해야 한다. helper가 이 정책을 제공한다는 사실은 실제 fullplay가 이를 지켰다는 검수 결과가 아니다.

## 원본23의 좁은 보존 계약

원본 목표는 `dispatch-bundle → carrier-start → dock-mid → dock-exit`, NPC는 유일한 `act3-carrier`, 다음 장은24다. 일반E, 기존 보호/실패 규칙, 동행4명, 행동상한3, `honroWaterworksRevision:1`을 동결했다. 목표 전멸·전원 집결·추가 방어·직업E·제한시간은 없다. 새 화물 사건은 필수 목표가 아니다.

원본 초기22/정예5, 유한3+2+3=8, 기존 cap30이다. 최초 적 weight25, 유한 증원 reserve8.6, 총 weight33.6이다. 실제 부동소수 저장의 reserve는 `8.600000000000001`이다. 첫 생성 적의 `xpGranted`는 모두0이며 원본 일반94/정예150의 `xpBudget`도 동결했다.

23장 reward limit은 start75,748/end83,635/total7,887/combat3,155다. 성장 최고 경지30, XP cap372,860도 변하지 않는다. 새 편성의 수가 달라져도 총 combat budget3,155를 늘리지 않는다. 새 weight/reserve는 최종 편성으로 다시 명시하고 저장하며 원본33.6을 새 편성에 억지로 복사하지 않는다. 옛 저장의 cap30/weight/limit/이미 지급한 XP는 Continue 시 변하지 않아야 한다.

entry 검사는 CURRENT 엔진으로 원본23만 다시 컴파일하여 당시 actor·좌표·HP/MP·기예·목표·지형 해시·22/5·cap30·weight33.6을 비교한다. 역사 원문을 실행하지 않으며 임시 source references는 `finally`로 되돌린다. 이것은 old-entry 호환 검사일 뿐 실제 저장 export/import/Continue 검사와 다르다.

## 검사와 남은 증거

실행: `node tests/stage23-escort-entry.mjs`. 보고서: `_local/reports/stage23-escort/entry.json`.

검사는 실제 보상 장부 재계산, 합법 선행/수련/슬롯, 대표/지형 자원 분리, 원본 성장 예산, 명시적 App 방어, 기존29지도/573 asset/역사 fixture 보호를 다룬다. 설치·HTML/에셋 build·브라우저를 실행하지 않는다.

별도 독립 archive 실행도 XP/수련/대표 자원/원본 성장 값을 일치 확인했다. 이 entry 계약 자체는23 실제 보행·사격·승리·24 진입·Continue·신규 미술·브라우저·Pages를 합격시키지 않는다. 실제22 완료 저장, 정상23 대표 및 기본기 trace, 같은 실제 저장에서의 위치 선택 비교, 실제 App 저장 경계,24 연결은 다음 검수에서 각각 확보해야 한다.


## 최종 canonical 28 승격

최종28/정예6·유한8·cap36·행동cap3은 corrected71 실제 R20/4생존/24진입 후보와 동일하다. `stage23-escort-release-entry.mjs`는 그 실제 최초 export를 `stage23-escort-approved-entry.json`에 그대로 고정하고, 새 canonical 입장 전체 battle와 profile을 대조한다. 허용 차이는 `/battle/session`, `/profile/honroBattle/session` 두 문자열뿐이다. balance 메뉴 count28을 적용해도 HP/공격/기력/이동력/성장·XP 분모/개별 enemy budget/seed/목표/지형/배우가 재조정되지 않는다. 전체 전투 normal run은 이 동등성이 확인된 후보28 trace이며 새 canonical에서 추가 최적화나 배우·자원 조작을 하지 않는다.
