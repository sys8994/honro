# 묵종 청동 주조 미술 정리

## 적용 범위

- 원본 기준: `8dc6a24`, `stage18:bell-hollow-body` 하나.
- 활성 18·19장은 `sb-bell-body`가 같은 순수 SVG 벡터를 사용한다. 19장의 앵커는 18장의 200 하강 후 위치다.
- `act2:bell` / `act2-wedged-bell.svg`는 과거 지도·저장의 별도 에셋이다. 이번에는 바꾸지 않는다.
- 지형, 사격창의 opening/reveal, 지지귀, 앵커, 충돌, 스테이지·사건·목표·서사·성장·전투 수치는 변경하지 않는다. 신규 에셋이나 래스터를 추가하지 않는다.

## 조형과 원인

기존 비천상은 작은 화면에서 사람 모양의 평평한 장식으로 읽혔다. 종구는 서로 다른 곡률의 뒤쪽 띠, 양쪽 네모 조각, 일자 앞띠가 겹쳐 주조된 한 덩어리로 보이지 않았다. 몸통의 각진 고대비 명암 패치는 금속의 곡면보다 다면체를 강조했다.

- 어깨를 둥근 곡면으로 연결하고 청동의 넓은 명암을 연속시킨다.
- 당좌는 몸통과 같은 금속의 낮은 양각·동심 주조면으로 만든다.
- 비천상 대신 읽히지 않는 얕은 음각과 닫히지 않은 인장을 쓴다. 새 서사 문구를 추가하지 않는다.
- 곡선의 넓고 낮은 대비 녹청·주조 얼룩 세 군데만 둔다. 반복 노이즈·미세 균열은 쓰지 않는다.
- 종구의 앞면을 한 면으로 연결하고, 뒤쪽 주조 두께 → 안쪽벽 → 어둠의 관계를 정리한다.
- 실제 사격창의 투명 마스크와 경로 좌표는 그대로이며, 사각 테두리의 색 대비만 낮춘다. 오른쪽 지지귀와 실제 내부 발판을 가리지 않는다.

일반 범종의 용뉴·음통, 9유두 유곽, 당좌와 넓은 종신 비례를 참고했다. 직접 만든 벡터이며 사진을 내장하거나 트레이싱하지 않았다.
참고: [한국민족문화대백과사전, 상원사 동종](https://encykorea.aks.ac.kr/Article/E0027239).

## 재현과 통합

`node tools/environment/refine-stage18-bell-art.mjs`는 활성 campaign의 해당 asset.vector와 params.nodeCount만 다시 컴파일한다. `applyStage18BellArt`나 Stage18 전체 저작기를 실행하지 않는다. 별도 파일은 첫 인자로 지정할 수 있다.

- `node tests/stage18-bell-refinement.mjs`: 전후 단일 에셋 경계, 모든30맵·다른 에셋 불변, 전체 compiled18/19 비아트 상태,200하강과19정착 일치.
- `node --expose-gc tests/stage18-bell-refinement-native.mjs before`
- `node --expose-gc tests/stage18-bell-refinement-native.mjs final`

Native 캡처는 `_local/reports/bell-refinement/{before,final}/`에 남긴다. 같은 전체/하단 카메라를 사용하며 원본은 immutable before-asset fixture에서 가져온다. Native는 실제 공유 Scene/VectorArt를 실행하지만 브라우저 입력·정상 전투·브라우저 성능 검수를 대신하지 않는다.

이전 전역 역사 exact-hash 검사는 지도 아트 변경 전부터 알려진 불일치가 있다. 원래 fixture/hash/assert를 갱신하거나 느슨하게 만들지 않는다. 단일 에셋 계약과 기존 동작 회귀 결과를 구분하고 최종 통합 이후 Pages18/19 및 Workshop을 직접 확인해야 한다.

## 이번 후보의 검수 결과

- 최종 SVG SHA256: `1530ed9d5a674541f11479f7980faca4f4dfc2bdb9180bc829ba5588248e4a81`, native node61/상한240.
- 아트 단일 경계,30맵·나머지 library 불변,18/19 compiled 전체 비아트 상태,200하강·19정착 일치 통과.
- `tests/stage18-bell-refinement-resume.mjs`: 이전 그림/새 그림 각각 실제 App export/import/Continue에서 하강 중57.872 위치와 그림을 보존하고200에서 한 번 정착. 기존 저장 그림은 새 canonical 그림으로 강제교체하지 않는다. 하강 전제조건만 합성fixture이며 정상 완주가 아니다.
- `npm run build` 통과. Game/Workshop 두HTML에 최종 원본 SVG 문자열이 정확히 같은 것을 검사했다.
- 기존 `stage18-bell-runtime`, `stage18-bell-release-guidance` 통과.
- 다음4개 기존 실패는 수정 전 campaign을8dc6a24와 byte-exact하게 복원한 대조에서도 실패로그가 바이트 동일했다. 관련 fixture/assert를 바꾸지 않았다.
  - `stage18-bell-app-resume`: 과거 목표 안내문 기대값.
  - `stage18-bell-tactics`: 기존 대표 사격의 아군피해 검사.
  - `stage19-bell-authoring-preservation`: 기존 engine/build 소스hash 기대값.
  - `stage19-bell-marker-traversal`: 기존 투어가 요청하는 marker 부재.
- `_local/reports/bell-refinement/preexisting-failures.json`에 전후로그hash, `bundle-parity.json`에 HTMLhash, `before/final/report.json`에 동일카메라·SVGhash를 남겼다.
- 전체 verify·브라우저·정상 완주는 별도 검수 범위다. 기존 위 실패를 통과했다고 주장하지 않는다. Pages 최종 검수는 통합 담당자가 수행한다.
