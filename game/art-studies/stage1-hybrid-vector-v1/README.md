# 공유 벡터 환경 부품 01

[숲길 시안](https://sys8994.github.io/honro/game/art-studies/stage1-hybrid-vector-v1/) · [실제 SVG 도감](https://sys8994.github.io/honro/game/art-studies/stage1-hybrid-vector-v1/catalog.html) · [전체 보기](https://sys8994.github.io/honro/game/art-studies/stage1-hybrid-vector-v1/?view=overview)

이번 단위는 공유 부품 데이터, SVG/Canvas 조립 렌더러, 도감, 인스턴스 기반 숲길 예시다. 본게임 번들·활성 지형·전투·퀘스트·저장에는 연결하지 않는다. **미술 품질은 미승인**이다. 수관이 둥근 덩어리로 읽히고 넓은 흙 사면과 일부 접합이 단순하다. 기준 회화의 성숙한 한국 산림·자연스러운 부피 수준을 충족했다고 보지 않으며 다른 장으로 확대하지 않는다.

기존 수작업 SVG 시안은 `1935a106` 커밋에 남아 있다. 별도 벡터화 실험 브랜치는 합치지 않았다. 이 디렉터리의 `normal.png`, `overview.png`, `mobile.png` 및 이전 checks/scale-checks 기록은 그 이전 시안의 역사 자료다. 현재 공유 부품 결과는 아래 `shared-kit-*` 파일이다.

## 하나의 제작 원본

- `shared/assets/environment/vector-kit/registry.mjs`: 실제 경로 99개와 재질·팔레트의 단일 원본. 기반 암반 3, 일반 돌 3, 풀 2, 관목 2, 소나무 줄기 2/가지 3/수관 3/뿌리 2, 한옥 기둥/보/처마/석축 각 1, 흙 부품 2로 총 26개다. 미세 반복 잎·노이즈·필터·근경 래스터는 없다.
- `shared/assets/environment/vector-kit/compositions.mjs`: 보통 소나무·거목 소나무·한옥 쉼칸. 부품 ID, 제한된 균등 scale/rotation/mirror, socket 부착만 기록하며 경로를 복사하지 않는다.
- `shared/runtime/environment-vector-kit.mjs`: 공통 `compileScene`, `drawCanvas`, `svgBody`, `svgScene`. 두 출력이 같은 경로·paint·행렬을 사용한다. Canvas는 Path2D를 캐시하고 표시 영역 밖 부품을 생략한다. SVG 도감과 내보내기도 같은 클립과 그라디언트를 사용한다.
- `shared-kit/stage1.scene.mjs`: 6000×3000 world의 지형 프로파일과 29개 배치 인스턴스(조립 후 65개 부품). 지형 윤곽은 지도 데이터이고 장식 경로는 없다. 거목과 보통 나무가 동일한 줄기·가지·수관·뿌리 정의를 조립한다.
- `catalog.mjs`: 위 원본을 그대로 SVG로 출력하는 실제 부품 도감. 각 부품·조립 예시에 승인 설오 H=103.5를 함께 표시한다.
- `foreground.svg`: 공통 원본에서 생성한 내보내기 결과이며 편집 원본이 아니다. 숲길 페이지는 이 파일을 이미지로 로드하지 않고 Canvas에 벡터를 직접 그린다.

각 부품은 `id`, `family`, `material`, `bounds`, `foot`, `groundContacts`, `sockets`, `recommendedHeightH`, `scaleRange`, `rotationRange`, `use`를 가진다. 좌표는 게임과 같은 world 단위, 바닥 기준점은 `[0,0]`, 위쪽은 음수다. 공중 부품은 joint가 원점이고 `groundContacts: []`다. 소켓은 `{at:[x,y], angle}`이고 조립 시 부모의 전체 행렬을 상속한다. 미술 접점은 게임 충돌 판정을 만들지 않는다. `material`이 공통 재질 색을 참조하고 인스턴스 `palette`는 `forest/cool/dry` 변형을 선택한다.

부품 변경은 registry 한 곳에서 한다. 인스턴스는 `{id, assetId, transform, palette, layer}`이며 `support:'surface'`는 지도와 동일한 cubic 표면에 원점을 붙인다. 조립 부품의 `attach:{instance,socket}`는 앞서 선언한 부모를 가리킨다. `compileScene(scene,{assets,compositions})` 옵션으로 편집 중인 데이터를 출력해 볼 수 있다. 비균등 `sx/sy`는 거부하고 scale/rotation은 정의된 범위로 제한한다. 매 프레임 무작위 변형은 없다.

물 재질 색상은 공유하지만 새 물 모션을 만들지 않았다. Canvas의 물 항목은 기존 `HonroEnvironmentArt.pool/waterfall`로 전달한다. 현재 숲길은 `water:[]`여서 물 모션은 이번 확인 대상이 아니며 SVG 정적 출력에는 물을 내보내지 않는다. 본게임 환경 체계와의 연결은 후속 범위다.

## 실행과 카메라

저장소 루트에서 정적 HTTP 서버로 이 디렉터리를 연다. 의존성 설치나 게임 빌드는 필요 없다. `node game/art-studies/stage1-hybrid-vector-v1/build.mjs`는 생성 `foreground.svg`와 승인 설오의 정지 SVG만 갱신한다.

원경은 기존 `shared/assets/environment/quiet-layered/far.webp`만 독립 이미지로 사용한다. Canvas는 원경/캐릭터 디코드를 기다리지 않고 지형을 그린다. 초기 모듈 로드 이후 첫 render부터 벡터가 보이며 idle RAF는 없다. 드래그·터치 팬, 휠·핀치 확대, 전체/근경/윤곽선과 키보드를 지원한다. 윤곽선은 예정 표면 참고 표시이며 실제 충돌/이동 검증이 아니다.

`seol-o-scale.svg`는 승인 `HONRO_PARTY.seol_o`와 기존 `HonroVectorRig.poseSVG(...,'idle',0)`의 출력이다. 크기 비교용이며 새 리그나 모션을 만들지 않았다. visible bbox 높이 467.02405에 맞춰 H=103.5 world를 유지한다. 근경은 짧은 화면 변의 12%, 최대 scale 1.25, 발 위치는 가로 36%·세로 70%다. 데스크톱 1440×960에서 115.2px, 모바일 390×844에서 46.8px다.

## 필요한 확인과 용량

실제 도감·근경을 본 뒤 한 차례 핵심 수정했다. 상부 줄기 연결부의 넓은 단면을 줄이고 명암을 실루엣 안에 클립했으며, 길 띠를 돌·풀보다 먼저 그리도록 SVG와 Canvas를 함께 수정했다. 정상 배율·전체·모바일에서 불투명 지형 몸체가 하단까지 이어지는 것을 확인했다. 전체 보기의 넓은 흙 면은 부피 표현이 부족한 상태다.

한 정의(`pine.crown.a:0`)의 색을 메모리 복사본에서 한 번 바꿔 보통 나무·거목의 SVG와 Canvas에 모두 반영됨을 확인했다. 두 Canvas의 변경 픽셀은 각각 2,433/4,113개이며, 숲길의 다섯 사용처도 동일한 정의 객체를 참조한다. 원본 색을 실제 파일에 바꾸는 검사는 아니다. 문법 확인 7파일, 로컬 페이지 오류 0·HTTP 오류 0. 전체 게임·이동·전투·스킬·저장 검증이나 별도 검수자는 실행하지 않았다.

| 파일 | raw bytes | gzip-9 bytes |
|---|---:|---:|
| registry.mjs | 19,597 | 8,750 |
| compositions.mjs | 4,017 | 1,091 |
| environment-vector-kit.mjs | 9,857 | 3,732 |
| stage1.scene.mjs | 3,661 | 1,083 |
| 위 4개 소스 결합본(개행 포함) | 37,135 | 14,253 |
| 생성 foreground.svg | 85,969 | 12,353 |
| study.js | 4,628 | 1,836 |
| catalog.mjs | 2,405 | 1,198 |
| 승인 설오 SVG | 18,771 | 5,823 |
| 기존 far.webp | 952,722 | 952,878 |

gzip은 `gzip.compress(..., compresslevel=9, mtime=0)` 실측이며 서버 압축 설정과 별개다. 원경은 복사/재압축하지 않았다. 경로 데이터 원본과 생성 SVG 모두 raw 250KB 이하다.

- [현재 근경](evidence/shared-kit-closeup.png)
- [실제 SVG 도감](evidence/shared-kit-catalog.png)
- [현재 전체 보기](evidence/shared-kit-overview.png)
- [현재 모바일](evidence/shared-kit-mobile.png)
- [공유 편집·오류·용량 기록](evidence/shared-kit-checks.json)
