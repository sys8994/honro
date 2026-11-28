# 1막 1장 〈연목 고갯길〉 제작 SOP

이 문서는 기존 혼로의 캠페인을 탑뷰로 옮긴 첫 장에서 실제 사용한 절차다. 입장, 도입, 수레와 생존자, 고개 출구, 전투 정산과 타이틀 복귀가 한 제품 안에서 이어진다. [게임](https://honro-yeonmok-topview.sys8994.chatgpt.site) · [검증 결과](VERIFICATION.md)

## 1. 출발본과 저장을 고정한다

- 기존 혼로는 `cc81427699f40bebfe3716f4ed3bb5c2ca36ef8e`에서 원격 백업을 만들고 별도 체크아웃에서 포크했다. 원본 트리 식별자와 독립 보관본에서 복원한 다섯 파일의 해시를 기록했다. 새 제품의 저장 키는 `honro-topview-1-profile-v1`다. [복원 기록](evidence/backup.json) · [공통 코드 대응표](FORK_CONTRACT.md)
- 대화에 남은 분할 보관본 20개를 순서대로 합쳐 최초 인계 ZIP을 복원했다. 14,642,174바이트, SHA-256 `ad1ad22eccacc3e77e290ee799604e55046ca356fccfc83f2afa285695260a3b`. `00_START_HERE.md`부터 문서 01~08을 읽고 동봉 검증기로 페이로드 68개를 대조했다. 배경 제작 실험은 소스 `0f83eb650a355031a96d114873de6f856f3b02d7`에서 따로 재현했다. [실험 재현값](evidence/source-lab.json)
- 원본 ZIP을 보관하고 별도 개정본의 시작 문서·설계 문서·부트스트랩에 사용자가 정한 코드 계승 원칙을 반영했다. Library의 `honro-topview-act1-handoff-fork-20261128.zip`은 14,643,628바이트, SHA-256 `f3f6ef3dc7743cee840cd09128d18434633eba26891209e8d94c692e31487fa4`이다.
- 원본 1장을 먼저 열어 설오 ID와 HP, 기예, 적 편성, 기승전결을 기록한다. 동일한 캠페인 로더·전투 엔진·턴·기예·피해·장비·성장·대사·오디오·메뉴를 포크에서도 호출한다. 새 장은 그 위에 장소, 접촉면, 카메라, 배우 이미지와 입력을 연결한다. [원본 1장](evidence/native-stage1.json) · [앱 설치 지점](../../../topview/src/install.mjs)

## 2. 장소를 만들고 실제 이동에 연결한다

1. Tiled에서 `topview/editable/yeonmok.tmj`를 연다. 타일셋 두 개와 이미지의 상대 위치를 유지한다. `Ground`의 30×24칸을 흙·풀·길·물·돌로 칠한다. 개울을 먼저 끊고 남쪽·북쪽 다리에 실제 보행 칸을 연다. 이번 장은 가로 교량을 따로 그려 양끝이 길에 닿도록 놓았다. 화면에 보이는 지면은 1,920×1,056픽셀 직사각형이다. [저작 지도](../../../topview/editable/yeonmok.tmj)
2. `Props` 81개와 `Ground decorations`의 교량 2개를 발점 기준으로 놓는다. 소나무 두 종류, 큰·작은 바위, 관목, 석등, 문과 교량을 앞·뒤로 겹쳐 배치했다. 동일 소품의 보행 차단·사격 차단·접촉 반경을 따로 설정한다. `Footprints (guide only)` 70개는 편집자용 표시다. 그리기는 실제 발점 순서를 따르고 다리의 앞 난간을 별도 레이어로 올린다. [타일셋과 소품 속성](../../../topview/editable/props.tsj) · [그리기와 가림](../../../topview/src/scene.mjs)
3. `Chapter 1`의 점 27개에 원본 배우 ID, 증원, 대사, 고개 출구와 북쪽 횡풍을 연결한다. 월드 한 칸은 180×180, 화면 한 칸은 64×44다. 물은 설오를 막고 화살은 통과시킨다. 바위는 둘을 모두 막는다. 카메라가 표시할 수 있는 최소 배율을 현재 뷰포트와 지면 크기로 계산한다. 가장자리 숲·암반은 실제 지도 안에 둔다. [공간 변환](../../../topview/src/space.mjs) · [충돌과 경로](../../../topview/src/terrain.mjs)
4. 지도 복사본을 GUI에서 수정하고 저장한 뒤 각각 컴파일한다. 이번에는 (7,22) 풀을 물로 바꿨다. 두 컴파일 결과에서 재질·통행 배열의 667번만 바뀌었다. 해당 칸의 보행과 화살, 제품에서 나온 화면을 확인하고 원본을 다시 연다. [편집 전후](evidence/tiled-change.json)

```sh
python3 topview/tools/compile-map.py
python3 topview/tools/compile-map.py /path/to/copy/editable/yeonmok.tmj --output /tmp/edited-yeonmok.json
```

## 3. 배우와 소품 이미지를 만든다

- 설오는 원본 전신 벡터의 비대칭 의상·활 손과 승인 초상을 기준으로 삼았다. 8방향 이동은 방향당 4프레임이다. 준비·놓기, 대기·회복·피격·퇴장은 별도 시트에서 읽는다. 남향 보행은 두 번의 생성에서 바탕이 남거나 앞발이 교대되지 않았다. 동봉 실험의 보폭 순서를 참조해 따로 생성한 네 프레임으로 교체했다. [원본 전신](../../../shared/assets/party/seol_o.svg) · [선택한 원본](../../../topview/assets/source) · [정면 보행과 사슴 후면 검토](evidence/pose-detail.jpg)
- 산개·멧돼지·사슴·까마귀·박쥐·원혼은 종류마다 5개 방위로 대기, 좌우 걸음, 공격 예고, 공격, 피격, 퇴장을 그렸다. 좌우 대칭인 세 방향은 반전한다. 설오의 활 손은 방향별로 그렸다. 짐승의 회복은 예고 자세를 재사용한다. 사슴 첫 원본에 짙은 배경이 남고 북향에서 얼굴이 드러나서 투명 원본과 뒤쪽 일곱 자세를 다시 제작했다. [생성 지시와 참조 입력](../../../topview/editable/art-requests.json) · [게임의 동작 선택 규칙](../../../topview/src/actors.mjs)
- 채택한 PNG에서 알파·빈 프레임을 검사하고 같은 시퀀스에는 하나의 배율과 발 기준점을 쓴다. 목적지까지 실제로 이동한 거리로 걸음 프레임을 진행한다. 준비·놓기와 피격·퇴장은 실제 발사·피격·사망 상태에 붙인다. 제작 도구와 게임은 같은 프레임 선택기를 쓴다. [동작 검사기](https://honro-yeonmok-topview.sys8994.chatgpt.site/topview/motions.html)
- 원본 파일에서 런타임 이미지를 다시 만든 뒤 바이트를 비교한다. 별도 빈 폴더에서 배우 시트·수레·나무꾼·교량과 앞 난간 등 20개의 SHA-256이 전부 일치했다. 재생성의 기준은 보관한 원본 PNG다. [재패킹 해시](evidence/repacked-assets.json)

```sh
python3 topview/tools/pack-actors.py
python3 topview/tools/pack-poses.py
```

## 4. 기존 캠페인을 빌드하고 플레이한다

Node와 npm, Python 3, 이미지 재패킹에는 Pillow를 쓴다. 저장소 루트의 잠금 파일에 맞춰 의존성을 설치한다. 편집 소스와 정적 게임의 배포 경로를 분리한다.

```sh
npm ci
python3 topview/tools/compile-map.py
node topview/build.mjs
npm --prefix game run typecheck
node --test topview/tests/*.test.mjs
python3 topview/tools/package.py /tmp/honro-yeonmok-release
python3 -m http.server 8000 --directory /tmp/honro-yeonmok-release
```

로컬 주소는 `http://127.0.0.1:8000/`이다. 패키지 도구에는 매번 빈 출력 디렉터리를 준다. 원본 캠페인 패킷과 기예·장비 아이콘, 장 음원, 전용 그래픽이 상대 경로로 들어간다. 타이틀의 **고갯길 들어가기**에서 시작한다. 방향키·WASD·스틱·지면 클릭으로 이동하고 **이동 잠금(L)**으로 제자리 조준한다. 발사 버튼을 누르고 있다 놓으면 화살이 나간다. 수레와 나무꾼을 지나 북동쪽 고개 끝에 도달하면 전투가 정산된다. [빌드](../../../topview/build.mjs) · [포장](../../../topview/tools/package.py)

## 5. 다음 장에 적용할 검수 순서

원본 입장·스토리·승패 조건을 먼저 대조한다. 이어 Tiled 편집 한 건, 실제 배우 보행과 무기, 예측과 실탄의 첫 충돌, 적 턴, 이어하기, 도착과 패배를 실제 진입점에서 확인한다. 마지막에 세로·가로 화면에서 지도 네 변을 탭해 실제로 해당 경계에 닿는지 좌표와 화면을 함께 확인한다. 이번 제작에서는 미니맵 가장자리를 눌러도 모바일 브라우저가 부모 요소를 선택해 시점이 움직이지 않는 경우를 이 방법으로 발견했다. 다음 장의 아트 생성 횟수와 비용, 실제 핸드폰의 프레임 유지율은 이 장에서 일반화하기 어렵다. [이번 실행값과 한계](VERIFICATION.md)
