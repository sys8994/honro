# 50장 연속 암벽 · 최종 후보 검수 중

기준 master `a088669bbecad0024a165a37cdf9ae960e2cccfe`, tree `8b03e6e14068443fc99444bd90af1ac7314cc255`와 동일 로컬 tree에서 작업한다. 50장만 변경하며 41장과 다른 장은 보존한다.

## 보존 및 변경

- near-import50 원본1774×887, 모든stage/content·다른asset·충돌·저장·카메라정책은 불변이다.
- 좌우/하단1px 늘림+gradient를 실제 Inkscape 암벽으로 교체한다. 원본 산문·계단·난간·아치·보행면을 보호한다. 하단 비보행 장식암면은 원본색경계로 제한 재설계하므로 원본전체픽셀불변이라고 주장하지 않는다.
- 원본sourceRGBA 색경계 y760..825 안에서 연속 seam을 찾고 모든4개 보행선52 source-px corridor와 건축 nativealpha를 보호한다. source x좌표는 authored1024 기준에1774/1024를 곱한다.
- 양끝80px은 실제 하단alpha−2px로 합류하며, 외부shape는 생성nativealpha를 따른다. 하늘/아치에는 새BODY를 그리지 않는다.
- 49장에서 검수한 bounded1024² single-alpha 합성을50에도 사용한다. 다른장분기동작은 유지한다. 기존 core validator한도를 늘리지 않는다.

## 제작과 최적화

시안v1/v2의 사각접합·거대한 평면·선반 같은 하단은 반려했고 보존했다. 최종v3는 원본중간크기암면을 참조해 제작했다. 생성원본PNG와native raw SVG는 로컬+소유자Library원본ZIP에 보존한다. 현재지원 문자열whole-file전송크기밖이므로 Git에는 포함하지 않으며 분할/인코딩우회를 하지 않았다. 재추적은 보존된PNG를 source/concept-v3.png, raw를 trace-v3/color-raw.svg에 복원하면 된다. Git의 optimized SVG+alpha로 이후 등록/컴파일을 재현할 수 있다.

- PNG SHA256 `2d608f6eeab97935abe3be68ae72dec8c5d8622df4fa0acab2fd151398bea5b6`,1024×1536.
- 실제 Inkscape1.4 8색 추적, raw108,068→epsilon0.35최적화54,955세그먼트,1,570,153→818,354bytes,3,133subpath유지. 768/1536px동일Inkscape 오차검사통과. 세부값은trace-v3 보고서.
- 생성본의상부는기존원본좌표에맞추고, 심부는800px이후에만 더깊게등록한다. 이등록은기존충돌이나원본을바꾸지않는다.
- 기존 path예산 내에서6개 depth-band로 nativeBoolean 분할. 등록후68,794선분은 직렬화전후동일,좌표3자리 상대표기의 최대오차0.000707source-unit. 1024px Inkscape비교 평균premultiplied오차0.00000228,16/255초과변화0. 최종JSON974,879bytes. 정량수치는미술승인/FPS증거가아니다.

## 검수 범위

- 모든원본asset/stages/content hash동일,보행327점 BODY침범0,보행색면968점보호,아치323점과상부하늘 및컴파일된BODY침범0.
- 6개화면비 metadata bounds는하단3926source-unit요구를4300까지포함한다. 실제유한실루엣밖은하늘/배경이며사각bounds전체암석채움을주장하지않는다.
- 합성oracle픽셀동일,중복alpha오류검출,transform/opacity/외부clip·예외해제회귀통과.
- Native 서쪽·동쪽 확대 및 극단 세로 최소 줌의 상부/하단 연속성을 확인했다. Native는실제브라우저조작이아니다.
- 아직 master통합,정식CI,Pages배포,실제공개입력검수 미완료.

남는한계: 심부암면은원본보다큰색면이며하단재질전환이완전히같지는않다. 원본의건축/계단색면은유지한다. 전체미션완주·실제모바일기기·Workshop실입력은이번렌더연결작업의미검수범위다.
