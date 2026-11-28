# 1막 1장 〈연목 고갯길〉 제작 SOP

이 문서는 기존 혼로의 캠페인을 탑뷰로 옮긴 첫 장에서 실제 사용한 절차다. 입장, 도입, 수레와 생존자, 고개 출구, 전투 정산과 타이틀 복귀가 한 제품 안에서 이어진다. [게임](https://sys8994.github.io/honro/) · [검증 결과](VERIFICATION.md)

기준 문서는 [아트 바이블](ART_BIBLE_ACT1.md)이다. 미터 치수와 지면·발·문턱을 정하고, 도입 화면을 찍어 기준표와 비교한 뒤 개별 그림을 손본다. 이번 1장의 여섯 구도와 실측은 [전장 비교](ART_PASS_ACT1.md)에 있다.

## 1. 출발본과 저장을 고정한다

- 기존 혼로는 `cc81427699f40bebfe3716f4ed3bb5c2ca36ef8e`에서 원격 백업을 만들고 별도 체크아웃에서 포크했다. 원본 트리 식별자와 독립 보관본에서 복원한 다섯 파일의 해시를 기록했다. 새 제품의 저장 키는 `honro-topview-1-profile-v1`다. [복원 기록](evidence/backup.json) · [공통 코드 대응표](FORK_CONTRACT.md)
- 대화에 남은 분할 보관본 20개를 순서대로 합쳐 최초 인계 ZIP을 복원했다. 14,642,174바이트, SHA-256 `ad1ad22eccacc3e77e290ee799604e55046ca356fccfc83f2afa285695260a3b`. `00_START_HERE.md`부터 문서 01~08을 읽고 동봉 검증기로 페이로드 68개를 대조했다. 배경 제작 실험은 소스 `0f83eb650a355031a96d114873de6f856f3b02d7`에서 따로 재현했다. [실험 재현값](evidence/source-lab.json)
- 원본 ZIP을 보관하고 별도 개정본의 시작 문서·설계 문서·부트스트랩에 사용자가 정한 코드 계승 원칙을 반영했다. Library의 `honro-topview-act1-handoff-fork-20261128.zip`은 14,646,501바이트, SHA-256 `5e51f3199f9a3ed3bc28c1f317935549ef6fdd8bb7ee1fea74c09077174c02ee`이다.
- 원본 1장을 먼저 열어 설오 ID와 HP, 기예, 적 편성, 기승전결을 기록한다. 동일한 캠페인 로더·전투 엔진·턴·기예·피해·장비·성장·대사·오디오·메뉴를 포크에서도 호출한다. 새 장은 그 위에 장소, 접촉면, 카메라, 배우 이미지와 입력을 연결한다. [원본 1장](evidence/native-stage1.json) · [앱 설치 지점](../../../topview/src/install.mjs)

## 2. 장소를 만들고 실제 이동에 연결한다

1. Tiled에서 `topview/editable/yeonmok.tmj`를 연다. 지도 바깥은 1,920×1,056픽셀 직사각형이다. 내부 `Ground`는 96×48픽셀의 2:1 마름모 21열×45행으로 저작한다. 홀수 행을 반 칸 옮기고 가장자리 마름모만 자른다. 경로 탐색용 30×24 구획 및 지름 180인 게임 단위와 아트 타일을 구별한다. [편집 원본](../../../topview/editable/yeonmok.tmj) · [Tiled 화면](evidence/isometric/tiled.jpg)
2. `Stream and trails`에서 개울의 양쪽 기슭과 갈림길을 그린다. `Bridge decks`에는 서로 반대 대각선인 다리의 실제 통행 폭과 사당의 기초를 둔다. 컴파일러가 곡선 기슭에 잔굴곡을 주고, 통행을 막는 물 면에서 교량 발판을 뺀다. 렌더러도 같은 곡선을 쓴다. 자갈에서 얕은 물·깊은 물로 농도가 변하는 마스크를 쓴다. 일정한 밝기와 폭으로 기슭을 따라 그은 시안은 돌 수로처럼 보여 제외했다. [소스와 그림 비교](evidence/isometric/comparison.jpg) · [지도 컴파일](../../../topview/tools/compile-map.py)
3. 뿌리와 기초에 발점을 둔다. 풍경 소품은 수레를 포함해 총 85개, 배우·사건·출구·환경 좌표는 27개다. 소나무의 큰 수관과 줄기, 사당의 지붕과 벽, 다리의 앞 난간과 상판을 따로 그린다. 낮은 면은 발점으로, 수관과 처마는 지면에 투영한 앞끝으로 깊이를 정한다. 설오와 적은 같은 그리기 순서를 사용한다. 나란히 선 나무는 연결된 수관 전체를 한 번에 그려 세로 이음새를 없앴다. 그림자는 물체 알파 실루엣을 오른쪽 아래의 지면에 눕혀 시작 시 한 번 굽는다. [가림 레이어](../../../topview/src/canopy.mjs) · [그림자와 물가](../../../topview/src/ground.mjs)
4. 편집기에 연 복사본에서 마름모 (5,42)를 풀에서 물로 칠해 저장했다. 게임 좌표계의 (7,22) 구획에서 그림과 보행·화살 판정을 대조했다. [편집 전후 데이터](evidence/isometric/tiled.json) · [수정 전 게임](evidence/isometric/grass.jpg) · [수정 후 게임](evidence/isometric/water.jpg)

지도 컴파일에는 Python과 Shapely가 필요하다. 다음 명령은 저장소 루트에서 실행한다.

```sh
python3 -m pip install -r topview/tools/requirements.txt
python3 topview/tools/compile-map.py
python3 topview/tools/compile-map.py /path/to/copy/editable/yeonmok.tmj --output /tmp/edited-yeonmok.json
```

## 3. 배우와 소품 이미지를 만든다

- 소나무는 직전의 옆모습 시안을 제외했다. 앞쪽 가지가 줄기를 실제로 가리도록 Blender에서 두 수관의 3D 형태를 잡고, 위에서 비스듬히 내려다본 가이드를 이미지 생성에 사용했다. 결과를 게임용 최대 320픽셀로 줄이고, 사당·교량·산문·수레는 현행 치수표로 모형을 만든 뒤 지도 표시 크기의 두 배로 구워 둔다. 게임 안에서 배우·지붕·나무가 같은 시점으로 보이는지 먼저 확인한다. [시점 가이드](../../../topview/assets/source/pine-camera-study.jpg) · [사용한 생성 지시](../../../topview/editable/isometric-art.json) · [가림 보행 비교](evidence/isometric/depth-walk.jpg)

- 설오는 원본 전신 벡터의 비대칭 의상·활 손과 승인 초상을 기준으로 삼았다. 8방향 이동은 방향당 4프레임이다. 준비·놓기, 대기·회복·피격·퇴장은 별도 시트에서 읽는다. 남향 보행은 두 번의 생성에서 바탕이 남거나 앞발이 교대되지 않았다. 동봉 실험의 보폭 순서를 참조해 따로 생성한 네 프레임으로 교체했다. [원본 전신](../../../shared/assets/party/seol_o.svg) · [선택한 원본](../../../topview/assets/source) · [정면 보행과 사슴 후면 검토](evidence/pose-detail.jpg)
- 산개·멧돼지·사슴·까마귀·박쥐·원혼은 종류마다 5개 방위로 대기, 좌우 걸음, 공격 예고, 공격, 피격, 퇴장을 그렸다. 좌우 대칭인 세 방향은 반전한다. 설오의 활 손은 방향별로 그렸다. 짐승의 회복은 예고 자세를 재사용한다. 사슴 첫 원본에 짙은 배경이 남고 북향에서 얼굴이 드러나서 투명 원본과 뒤쪽 일곱 자세를 다시 제작했다. [생성 지시와 참조 입력](../../../topview/editable/art-requests.json) · [게임의 동작 선택 규칙](../../../topview/src/actors.mjs)
- 채택한 PNG에서 알파·빈 프레임을 검사하고 같은 시퀀스에는 하나의 배율과 발 기준점을 쓴다. 목적지까지 실제로 이동한 거리로 걸음 프레임을 진행한다. 준비·놓기와 피격·퇴장은 실제 발사·피격·사망 상태에 붙인다. 제작 도구와 게임은 같은 프레임 선택기를 쓴다. [동작 검사기](https://sys8994.github.io/honro//topview/motions.html)
- 원본 파일에서 런타임 이미지를 다시 만든 뒤 바이트를 비교한다. 별도 빈 폴더에서 배우 시트·수레·나무꾼·교량과 앞 난간 등 20개의 SHA-256이 전부 일치했다. 재생성의 기준은 보관한 원본 PNG다. [재패킹 해시](evidence/repacked-assets.json)

```sh
python3 topview/tools/pack-actors.py
python3 topview/tools/pack-poses.py
python3 topview/tools/pack-landscape.py
blender -b -t 3 --python-exit-code 1 -P topview/tools/render-structures.py
```

사슴 옆모습 교체에는 4열 2행의 투명 시트를 썼다. 30° 상공의 동일 정사영에서 뿔과 가까운 옆구리, 등과 먼 발이 함께 보이게 하고, 서기·보행 두 컷·준비·공격·피격·쓰러짐의 7컷을 같은 원화 스케일로 등록했다. 여덟 번째 예비 자세는 게임에서 사용하지 않는다. 설오처럼 원화 간격이 일정하지 않으면 사람마다 그려진 영역을 먼저 등록하고, 각 행의 맨 아랫부분을 확대해 양쪽 신발을 대조한다. [사슴 옆모습 원화](../../../topview/assets/source/stag-flank-elevated.png) · [설오 자세 등록](../../../topview/editable/pose-cells.json)

## 4. 기존 캠페인을 빌드하고 플레이한다

Node와 npm, Python 3, Shapely와 Pillow를 쓴다. 저장소 루트의 잠금 파일에 맞춰 의존성을 설치한다. 편집 소스와 정적 게임의 배포 경로를 분리한다.

```sh
npm ci
python3 -m pip install -r topview/tools/requirements.txt
python3 topview/tools/compile-map.py
node topview/build.mjs
npm --prefix game run typecheck
node --test topview/tests/*.test.mjs
python3 topview/tools/package.py /tmp/honro-yeonmok-release
python3 -m http.server 8000 --directory /tmp/honro-yeonmok-release
```

로컬 주소는 `http://127.0.0.1:8000/`이다. 패키지 도구에는 매번 빈 출력 디렉터리를 준다. 원본 캠페인 패킷과 기예·장비 아이콘, 장 음원, 전용 그래픽이 상대 경로로 들어간다. 타이틀에서 **길을 열다**를 누르고 오프닝 5컷을 본 뒤 쉼터에서 **스테이지 진입**을 누른다. PC에서는 지면 클릭으로 길을 찾고 방향키·WASD로 직접 움직인다. 화면 가장자리와 미니맵 클릭·드래그로 카메라를 옮기고, 적의 몸을 클릭해 정보를 연다. Shift를 누르고 방향키로 천천히 돌거나 Shift를 누른 채 한 지점을 클릭해 즉시 그쪽을 겨눈다. 터치에서는 발사 옆 **이동 잠금**과 스틱으로 제자리 조준한다. 발사 버튼을 누르고 있다 놓으면 화살이 나간다. 수레와 나무꾼을 지나 북동쪽 고개 끝에 도달하면 전투가 정산된다. [빌드](../../../topview/build.mjs) · [포장](../../../topview/tools/package.py)

## 5. 다음 장에 적용할 검수 순서

원본 입장·스토리·승패 조건을 먼저 대조한다. 이어 Tiled 편집 한 건, 실제 배우 보행과 무기, 예측과 실탄의 첫 충돌, 적 턴, 이어하기, 도착과 패배를 실제 진입점에서 확인한다. 마지막에 세로·가로 화면에서 지도 네 변을 탭해 실제로 해당 경계에 닿는지 좌표와 화면을 함께 확인한다. 이번 제작에서는 미니맵 가장자리를 눌러도 모바일 브라우저가 부모 요소를 선택해 시점이 움직이지 않는 경우를 이 방법으로 발견했다. 다음 장의 아트 생성 횟수와 비용, 실제 핸드폰의 프레임 유지율은 이 장에서 일반화하기 어렵다. [이번 실행값과 한계](VERIFICATION.md)
