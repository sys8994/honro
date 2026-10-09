# 잠운사 외부 거대 석불

2026-10-09. 사용자 추가 요청은 법당 밖의 거대하고 신비한 불상이다. 기존 실내 불단을 확대하지 않고, 암벽에 몸체가 이어지는 별도 후경 랜드마크를 추가한다. 법당·동행·적·발판은 앞에서 읽히고 충돌·동선·목표·편성·전투를 바꾸지 않는다. 붉은 눈이나 새 서사 설정을 추가하지 않는다.

## 현재 선택: 초기 천개형으로 정확 복원

06:03 UTC 사용자가 “그냥 처음이 낫다 그 모자같은거 쓴 모습. fallback 해줘”라고 요청했다. 최신 작업을 reset/revert하지 않고, `dbef41ce1eefc897afcf17ee0ed2a17ce27aebf9`의 초기 천개형 불상 asset과 저작 원문만 새 forward 변경으로 복원했다. 뒤에 추가된 문서·테스트·저장 기록은 보존한다. 불상의 둥근 얼굴·돌 천개·가사와79개 native vector node/path는 첫 최종판과 같다.

현재 campaign 전체 JSON도 초기 천개형과 같으며, 최신 revision3에 비해 불상 자산 하나만 바뀐다. 30장·다른539자산·배치·충돌·전투는 동일하다. 초기 전체/법당 근접 Native 이미지와 같은 카메라로 다시 캡처하여 두 PNG의 바이트 일치를 확인했다. source forward commit은 `613968f85d161c42a9d35cde015085c43ebbc00d`이며 양HTML 빌드·타입도 통과했으며 두 HTML도 첫 천개형과 바이트까지 같다. 새 이미지의 중복 Library 업로드 없이 기존 천개형2장을 재사용하고, 같은 복구 ZIP의 후속 버전으로 source·양HTML·검증 증거를 보존한다. 새 fallback 검사에서23개 변조 거부와 gameplay hash/실제 생성 전투 불변을 확인했다. 양HTML 빌드·타입 및 과거 미술 이력에 한정하며47라운드 플레이나 전체 aggregate를 다시 실행하지 않는다.

## 보존된 revision3: 마른 석재 얼굴과 미묘한 불안감

05:53 UTC 사용자 요청에 따라 아직 둥글던 볼 아래와 턱의 살집을 더 줄였다. 얼굴 바깥선은 광대 아래에서 안으로 들어가고, 턱은 길고 좁게 내려간다. 입 폭은 이전의 약58%로 축소하여 작은 무표정으로, 눈꺼풀은 미소처럼 휘지 않는 평평한 돌면으로 만들었다. 오른쪽 눈구멍과 볼 한 면만 조금 깊게 묻어 자세히 보면 비대칭인 낮은 대비를 유지한다. 목의 둥근 띠도 좁고 평평한 면으로 정리했다. 괴물 이빨·붉은 눈·새 균열·광원을 추가하지 않았다.

같은 67-node 불상 asset의 얼굴·목 형상만 바뀌었다. 몸체·어깨·가사·손·귀·육계와 기존 거대 스케일·배치는 유지한다. 미술 source는 `56e7af6efaeb4ddb658a5bdc79a2217a3c092660`에서 동결했다. canonical Native 얼굴/전체 시안을 직접 검수했고, 최종 2장은 `buddha-ascetic/final/`에 있다.

이전 revision2와 초기 천개형의 exact fixture를 보존한 채 새 asset-only 역사 계층을 더한다. 새 exact 검사에서 얼굴·목20개 path 변경, 기존67개 노드 순서,30장 전체,다른539자산,손·귀·육계·몸·bounds·충돌의 동일성 및20개 변조 거부를 확인했다. 실제 생성 전투의 전체 계약과47라운드 완주본의 gameplay project/runtime hash도 동일하다. 검증 범위는 30장·다른539개 자산·손·충돌·실제 생성 전투·gameplay hash 불변과 양HTML 빌드/타입으로 한정한다. 기존 47라운드 전투나 전체 게임 검사를 반복 실행한 결과로 세지 않는다. Library의 이전 v7과 기존 이미지들은 보존하며 새 PNG 2장 및 동일 복구 ZIP의 후속 버전으로 저장한다. 당시 revision3 전체project SHA-256은 `65f57e3661ff5ce7d7c490e37611a35d86684cb664b56e419a433e7c477056cd`다.

## 이전 수정본: 천개 없는 길고 차분한 상호

사용자 피드백에 따라 초기 천개형의 둥근 볼·넓은 입·턱밑과 밝은 어깨면을 줄였다. 천개와 원통관은 완전히 제거하고, 낮고 둥근 육계와 세로로 흐르는 가사로 정리했다. 눈·입의 암부도 조금 얇게 해 잔잔한 표정을 유지한다. 전체 재설계가 아니라 같은 불상 자산의 미술만 수정했다.

- 주 참고: [한국학중앙연구원 경주 남산 삼릉계 마애석가여래좌상](https://encykorea.aks.ac.kr/Article/E0026558)의 정측면 얼굴·전체 사진을 직접 봤다.
- 비교 참고: [국사편찬위원회 서산 마애불 자료](https://contents.history.go.kr/mobile/kc/view.do?code=kc_age_10&levelId=kc_r100455). 이 상의 둥근 미소를 복제하지 않고 자연스러운 육계·암벽 일체감만 참고했다.
- 같은 asset ID, 배치, scale, bounds/reference, 손3개 형상과 큰 자연 암반 본체를 그대로 유지했다. 전체30장 JSON과 다른539개 자산의 값·순서는 정확히 같다. 충돌은 여전히 없다.
- 최종 Native 전체/얼굴 근접은 `buddha-refined-final/overview.png`, `buddha-refined-final/stone-buddha-face.png`다. 승인된 draft2와 canonical 재캡처 PNG가 바이트까지 일치한다. 이전 불상 없는4장과 천개형2장은 비교 기록으로 별도 보존한다.
- 양HTML 재생성·타입·환경·authoring이 통과했다. asset-only 두 번째 exact delta를 e5fdd37에서 별도로 고정했고 기존 첫 불상 delta는 바꾸지 않았다. 새17개 변조 거부·기존19개 변조 거부·실제 전투구조·기존16 역사·portable/실제R47 Continue가 모두 통과했다.
- 47라운드 전투를 다시 실행한 결과로 세지 않는다. gameplay project/runtime hash는 이전 완주본과 여전히 동일하며 실제 전투/저장 불변도 별도 통과했다. 동일 asset ID의 옛 렌더링 모양까지 고정된다는 주장은 하지 않는다.

이전 revision2 전체project SHA-256: `3c42a9b65a4841617813028c245aa81f0dcf3a5bd684f4a0d8091980cf669089`. 당시 runtime: `fca9bc6b03208c129454e9e7908e20a979a5095b7907cf8c019d20aa5baf4bad`.

## 보존된 초기 천개형의 레퍼런스와 조형

- [국사편찬위원회 우리역사넷의 고려 대형 불상](https://contents.history.go.kr/mobile/eh/view.do?code=ganada&levelId=eh_r0130_0010): 관촉사 은진미륵과 용미리 불상의 공식 사진을 직접 확인했다. 넓고 차분한 얼굴, 긴 귀, 절제된 수평 천개, 적은 큰 면으로 읽히는 입체감을 참고한다.
- [국가유산청 파주 용미리 마애이불입상](https://www.heritage.go.kr/heri/cul/culSelectDetail.do?ccbaCpno=1113403230000&pageNo=1_1_1_1&sngl=Y): 자연 암반에 조각된 몸통과 독립적으로 읽히는 머리의 관계를 참고한다.
- 북한산 마애불 사진도 비교하여 몸체가 원래 바위에 남아 있는 낮은 부조와 큰 명암 덩어리를 확인했다. 장식 수나 균열의 양을 완성도로 삼지 않는다.

사진을 게임 자산으로 사용하지 않는다. 공통 SVG→native vector 저작 체계로 새 형상을 만들며 기존10개 사찰 자산은 그대로 둔다. 작은 반복 불상·종교물 복제나 과도한 공포 표정은 피한다.

## 초기 천개형 구성과 검수

- 공식 사진 실제 열람·초기 구성안: 완료
- 법당 오른쪽 위 공동의 얼굴과 천개, 법당 옆으로 드러나는 큰 어깨·암반 몸체: Native 시안/최종 실제 Canvas 확인 완료
- rear-cavern 뒤층 위/대법당 앞층 아래의 순서에 추가하여 얼굴·어깨는 드러내고 건물과 전투 실루엣은 보존
- 신규 전용 자산의 collision은 빈 배열. 기존 map/actor/mission 및 기존529+10자산 값 불변을 확인했다. 신규79-node asset1개와 L1-back element1개만 추가했다
- 기존47라운드 정상 입력 승리·실제 Continue는 추가 전09cf792 기준으로 보존. 추가 뒤 gameplay project/runtime fingerprint의 동일성을 확인했다. 시각/저장 검사는 따로 수행한다
- 새 미술의 정확 delta는 기존4d17의 잠운사 delta를 덮어쓰지 않는 별도 최외곽 역사 계층으로 관리
- 최종 실제 Canvas 전체/근접 캡처와 양HTML 재생성·타입·환경·authoring·옛 snapshot 검사 완료. 전용 exact art delta는 source commit 후 고정하여 추가 검증한다. 별도 신규 PNG2장과 기존 동일 복구 ZIP의 버전으로 보존한다

브라우저 입력·성능·Pages는 기존 Chromium socket EPERM/원격 단일 writer 상태와 구분한다.

## 초기 천개형 화면과 영향 범위

- 얼굴 x≈6500–7410/y≈1960–2750, 낮은 천개 y≈1640–1820, 어깨와 한 손은 법당 오른편으로 이어진다. 큰 그늘·암반 접합만 보강하고 표정·광원·세부 균열은 늘리지 않았다.
- Native 최종 전체/근접 파일은 `_local/reports/stage16-temple/buddha-final/`이다. 임시 검토본과 canonical 재캡처의 PNG SHA-256이 정확히 일치한다.
- 불상 추가 전47라운드 완주와 실제 Continue의 전체project/runtime 해시는 달라지므로, 완주를 미술 추가 뒤 다시 실행한 것으로 주장하지 않는다. 실제 gameplay project `164bc145809ac88c35b1486d47a77f8217de9680f3938efe7e9c1298b287217b`와 gameplay runtime `a35992a4a3482875861dfb7efaf5799b083ba96aa19a26e8fa90b20a4aa7d773`는 모두 동일하다.
- 새 전체project SHA-256은 `26d78521f28525b53deb15f30a0f71573030c3ab296f36a053689bf6f94d7bdb`, runtime은 `c473f990281e43c47aecfaa30b9a0115a88e1af2e321865b0bacd456dc8237ad`다.

## 최종 보존 및 남은 경계

각 미술 단계의 Native 이미지는 별도 Library 이미지로 보존한다. 불상 없는4장, 초기 천개형2장과 두 차례 얼굴 수정본을 덮어쓰지 않았다. 현재 복원은 초기 천개형2장을 그대로 재사용한다. source·양HTML·정확역사·원본/수정 화면·47라운드 실제 기록·Continue 증거를 같은 복구 ZIP의 새 버전으로 보존한다. 이전 revision2에서는 독립 source archive의 양HTML 재생성/타입과 hash 일치도 확인했다. revision3과 현재 천개형 복원은 source의 양HTML 재생성/타입 및 한정 asset/battle 검증으로 마감한다.

Chromium의 socket EPERM으로 브라우저 입력·성능·Pages 직접 검수는 완료되지 않았다. 원격 push/master/Pages는 별도 단일 writer 대기이며 로컬 source/Native 검수와 구분한다.
