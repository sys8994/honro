# 공유 벡터 환경 부품 01

[숲길 시안](https://sys8994.github.io/honro/game/art-studies/stage1-hybrid-vector-v1/) · [실제 SVG 도감](https://sys8994.github.io/honro/game/art-studies/stage1-hybrid-vector-v1/catalog.html) · [전체 보기](https://sys8994.github.io/honro/game/art-studies/stage1-hybrid-vector-v1/?view=overview)

이번 단위는 공유 부품 데이터, SVG/Canvas 조립 렌더러, 도감, 인스턴스 기반 숲길 예시다. 본게임 번들·활성 지형·전투·퀘스트·저장에는 연결하지 않는다. **미술 품질은 미승인**이다. 두 번째 부품판에서는 수관의 실제 빈 틈·수평 잎 층, 수피와 분기 옹이, 한옥의 하중 연결을 보강했다. 수관 가장자리와 긴 수피 면은 여전히 그래픽적이고 넓은 흙 사면도 단순하다. 기준 회화의 성숙한 한국 산림·자연스러운 부피 수준을 충족했다고 보지 않으며 다른 장으로 확대하지 않는다.

기존 수작업 SVG 시안은 `1935a106` 커밋에 남아 있다. 별도 벡터화 실험 브랜치는 합치지 않았다. 이 디렉터리의 `normal.png`, `overview.png`, `mobile.png` 및 이전 checks/scale-checks 기록은 그 이전 시안의 역사 자료다. 첫 공유 부품판은 `shared-kit-*`, 현재 미술 보강판은 `shared-kit-v2-*` 파일이다. 모바일·전체 구도 PNG는 첫 공유 부품판의 기록이며 이번에는 재촬영하지 않았다.

## 하나의 제작 원본

- `shared/assets/environment/vector-kit/registry.mjs`: 실제 경로 195개와 재질·팔레트의 단일 원본. 기반 암반 3, 일반 돌 3, 풀 2, 관목 2, 소나무 줄기 2/가지 3/수관 3/뿌리 2, 한옥 기둥/보/처마/석축 각 1, 흙 부품 2로 총 26개다. 미세 반복 잎·노이즈·필터·근경 래스터는 없다.
- `shared/assets/environment/vector-kit/compositions.mjs`: 보통 소나무·거목 소나무·한옥 쉼칸. 부품 ID, 제한된 균등 scale/rotation/mirror, socket 부착만 기록하며 경로를 복사하지 않는다.
- `shared/runtime/environment-vector-kit.mjs`: 공통 `compileScene`, `drawCanvas`, `svgBody`, `svgScene`. 두 출력이 같은 경로·paint·행렬과 조립 내부 그리는 순서를 사용한다. Canvas는 Path2D를 캐시하고 표시 영역 밖 부품을 생략한다. SVG 도감과 내보내기도 같은 클립과 그라디언트를 사용한다.
- `shared-kit/stage1.scene.mjs`: 6000×3000 world의 지형 프로파일과 29개 배치 인스턴스(조립 후 65개 부품). 지형 윤곽은 지도 데이터이고 장식 경로는 없다. 거목과 보통 나무가 동일한 줄기·가지·수관·뿌리 정의를 조립한다.
- `catalog.mjs`: 위 원본을 그대로 SVG로 출력하는 실제 부품 도감. 각 부품·조립 예시에 승인 설오 H=103.5를 함께 표시한다.
- `foreground.svg`: 공통 원본에서 생성한 내보내기 결과이며 편집 원본이 아니다. 숲길 페이지는 이 파일을 이미지로 로드하지 않고 Canvas에 벡터를 직접 그린다.

각 부품은 `id`, `family`, `material`, `bounds`, `foot`, `groundContacts`, `sockets`, `recommendedHeightH`, `scaleRange`, `rotationRange`, `use`를 가진다. 좌표는 게임과 같은 world 단위, 바닥 기준점은 `[0,0]`, 위쪽은 음수다. 공중 부품은 joint가 원점이고 `groundContacts: []`다. 소켓은 `{at:[x,y], angle}`이고 조립 시 부모의 전체 행렬을 상속한다. 미술 접점은 게임 충돌 판정을 만들지 않는다. `material`이 공통 재질 색을 참조한다. `wood:shade`처럼 다른 공유 재질의 색도 의미 토큰으로 참조하므로 처마 아래 목재와 기둥 받침돌이 같은 팔레트를 따른다. 인스턴스 `palette`는 `forest/cool/dry` 변형을 선택한다.

부품 변경은 registry 한 곳에서 한다. 인스턴스는 `{id, assetId, transform, palette, layer}`이며 `support:'surface'`는 지도와 동일한 cubic 표면에 원점을 붙인다. 조립 부품의 `attach:{instance,socket}`는 앞서 선언한 부모를 가리킨다. `compileScene(scene,{assets,compositions})` 옵션으로 편집 중인 데이터를 출력해 볼 수 있다. 비균등 `sx/sy`는 거부하고 scale/rotation은 정의된 범위로 제한한다. 매 프레임 무작위 변형은 없다. `paintOrder`는 한 조립 내부에만 적용하며, 소나무의 가지→상부 줄기→밑동→뿌리→잎 순서로 가림을 만든다. 지도 인스턴스 전체의 앞뒤 순서는 바꾸지 않는다. `clipToShape:null` 부품은 실제 빈 공간 사이로 잔가지가 드러날 수 있다.

물 재질 색상은 공유하지만 새 물 모션을 만들지 않았다. Canvas의 물 항목은 기존 `HonroEnvironmentArt.pool/waterfall`로 전달한다. 현재 숲길은 `water:[]`여서 물 모션은 이번 확인 대상이 아니며 SVG 정적 출력에는 물을 내보내지 않는다. 본게임 환경 체계와의 연결은 후속 범위다.

## 실행과 카메라

저장소 루트에서 정적 HTTP 서버로 이 디렉터리를 연다. 의존성 설치나 게임 빌드는 필요 없다. `node game/art-studies/stage1-hybrid-vector-v1/build.mjs`는 생성 `foreground.svg`와 승인 설오의 정지 SVG만 갱신한다.

원경은 기존 `shared/assets/environment/quiet-layered/far.webp`만 독립 이미지로 사용한다. Canvas는 원경/캐릭터 디코드를 기다리지 않고 지형을 그린다. 초기 모듈 로드 이후 첫 render부터 벡터가 보이며 idle RAF는 없다. 드래그·터치 팬, 휠·핀치 확대, 전체/근경/윤곽선과 키보드를 지원한다. 윤곽선은 예정 표면 참고 표시이며 실제 충돌/이동 검증이 아니다.

`seol-o-scale.svg`는 승인 `HONRO_PARTY.seol_o`와 기존 `HonroVectorRig.poseSVG(...,'idle',0)`의 출력이다. 크기 비교용이며 새 리그나 모션을 만들지 않았다. visible bbox 높이 467.02405에 맞춰 H=103.5 world를 유지한다. 근경은 짧은 화면 변의 12%, 최대 scale 1.25, 발 위치는 가로 36%·세로 70%다. 데스크톱 1440×960에서 115.2px, 모바일 390×844에서 46.8px다.

## 필요한 확인과 용량

현재 v2에서는 수관 세 변종을 서로 다른 네 수평 잎 무리와 실제 빈 틈으로 다시 저작하고, 4~7개 중간 명암 군집과 가는 곡선 받침 잔가지를 넣었다. 모든 경로는 registry의 실제 벡터 데이터이며 원경·참고 이미지를 삽입하거나 트레이싱하지 않았다. 각진 잎 단절부는 정적인 Q 곡선으로 정리했다. 수피는 넓고 좁은 긴 능선·분기 옹이로 보강하고 가지를 줄기 뒤로 그려 몸통을 관통하는 접합을 줄였다. 두 줄기에는 같은 바탕·수피 능선 색을 사용해 연결부의 명암 단절을 줄였다.

한옥은 같은 기둥 부품으로 앞뒤 프레임을 조립한다. 주두·장부 그늘·배흘림·받침돌, 무릎받침·대공, 처마 두께·어두운 아랫면·서까래와 제한된 기와 끝·용마루를 추가했다. 석축은 얕은 윗면과 어긋난 줄눈으로 고쳤다. 흙은 기존 골과 흙턱에 연속된 침식 명암과 부분 매몰 암반/접촉 그늘을 넣었으며 중앙 사면의 지도·배치 인스턴스는 바꾸지 않았다.

부품 도감·동일 근경·거목/한옥 조립 확대의 실제 캡처를 확인했다. 첫 캡처의 톱니처럼 각진 잎, 지나치게 굵은 수관 잔가지, 줄기 연결부의 명암 차이를 한 차례 다듬었다. 26개 부품·3개 조립 카드, 로컬 페이지 오류 0·HTTP 오류 0, 변경 모듈 문법 확인 3파일. 근경 H=103.5와 카메라는 그대로다. 전체 게임·이동·전투·스킬·저장 검증, 물 모션, 모바일/전체 보기 재촬영이나 별도 검수자는 실행하지 않았다.

첫 구조판의 공유 편집 증거는 `shared-kit-checks.json`에 보존했다. 그때 한 수관 정의의 색 변경이 보통 나무·거목의 SVG/Canvas 모두에 반영됐고 숲길의 다섯 사용처가 동일 정의를 참조했다. v2도 같은 공유 연결을 유지하며 `stage1.scene.mjs`는 이번에 변경하지 않았다.

| 파일 | raw bytes | gzip-9 bytes |
|---|---:|---:|
| registry.mjs | 55,139 | 23,052 |
| compositions.mjs | 4,657 | 1,187 |
| environment-vector-kit.mjs | 10,315 | 3,932 |
| stage1.scene.mjs | 3,661 | 1,083 |
| 위 4개 소스 결합본(개행 포함) | 73,775 | 29,040 |
| 생성 foreground.svg | 245,010 | 58,922 |
| study.js | 4,628 | 1,836 |
| catalog.mjs | 2,405 | 1,198 |
| 승인 설오 SVG | 18,771 | 5,823 |
| 기존 far.webp | 952,722 | 952,878 |

gzip은 `gzip.compress(..., compresslevel=9, mtime=0)` 실측이며 서버 압축 설정과 별개다. 원경은 복사/재압축하지 않았다. 경로 데이터 원본과 생성 SVG 모두 raw 250KB 이하다.

- [현재 v2 근경](evidence/shared-kit-v2-closeup.png)
- [현재 v2 실제 SVG 도감](evidence/shared-kit-v2-catalog.png)
- [현재 v2 거목·한옥 조립 확대](evidence/shared-kit-v2-assemblies.png)
- [v2 확인·용량·남은 한계](evidence/shared-kit-v2-checks.json)
- [첫 공유 부품판 전체 보기](evidence/shared-kit-overview.png) · [모바일](evidence/shared-kit-mobile.png)
- [첫 공유 부품판 공유 편집 증거](evidence/shared-kit-checks.json)
