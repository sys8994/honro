# Foundation 제작 후보

현재 납품은 placement revision2: world[-4500,1000,16500,11000], 균등1.1배 배치다. 지정5화면의최대지면노출11776까지덮고하단여유224world다. 이전배치기록은아래제작이력및placement-v1에보존했다.

near BODY v2와 실제nativepalette를 입력으로 받아 전체지질 그림을 생성하고, 별도imagegen 정리후 실제Inkscape1.4.4 native6색/smooth/speckle32로추적했다. source1536×1024의3:2와world15000×10000이동일하며균일변환9.765625다. worldViewBox[-4200,1200,15000,10000], 배치(0,0),scale1,anchor0,0. near BODY보다먼저그리는BODY다. 실제clip은near BODY와동일canonicalfloor fullpolygon이며카메라/지형/충돌은바꾸지않았다.

V1 trace의미세색반점을반려했다. V2 nativeRAW는32,454B/6paths/675segments/13subpaths/maxd7766이며원본이미지→traceRGB MAE3.15483/255,alpha0이다. 큰연결지층과희소한갈라짐을유지하되원본의미세명암은6색으로평탄화됐다. 전체와상부겹침/하단지층/좌측단층200%를직접열어확인했다. 소수의상부작은색섬은남아있다. 미술합격은판정하지않았다.

boundedoptimizer는실행했으나simplify/precision후보가raw675segments보다늘어rawfallback을선택했다. 23KBprecision4후보가있지만최적화성공으로표시하지않는다. 최종asset34,978B,SVG33,337B. 기존renderer1x실행validation0errors확인. 최종world clip은source사각형을실제canonical지형안쪽으로만보이게하는의도된패키징이며원본silhouette무손실최적화로계산하지않는다.

실제bounds계산으로대표5화면의overscan을포함했다. 390×844 최소zoom에서최대노출bottom11037.95,그림bottom11200으로162.05world여유다. 더극단적인세로화면은미검증이며canonicalbottom27200까지의미술을완성했다고하지않는다. root의실제합성접합/최소zoom·pan/브라우저검수가남아있다.

자동PNG/검사보고서는_local/reports/act2-redesign-20261109/foundation-production, 실패·비선택후보는_local/archive/act2-redesign-20261109/foundation-production에보존했다. source/guide/immutableRAW/final/config/재현script는art에보존했다. 상세hash/배치/범위는delivery.json.

## Placement revision2 —320×920 노출 보완

원래world[-4200,1200,15000,10000]는5개초기화면중390×844까지만확인했다. 추가320×920에서는공통readability최소zoom0.0568181818로고정되어focusbottom3440+화면반높이8096+overscan240=11776world까지노출된다. 원래sourcebottom11200보다576world깊어기존범위의한계가확인됐다.

원본1536×1024의3:2와동일비율로world[-4500,1000,16500,11000]에균등1.1배배치했다. 새변환은[10.7421875,0,0,10.7421875,-4500,1000], sourcebottom12000이다. 같은canonicalfloorclip·sourcecolor/alpha/nativepath·원본이미지·collision/anchor/foot은보존했고,변경은world배치와표시bounds뿐이다. 색최적화나새미술생성으로표시하지않는다. 이전config/finalasset/finalSVG/contract/delivery/review는placement-v1에hash와함께보존했다.

공통focus/minzoom/overscan으로지정5화면을재계산했다.1440×900 bottom5805,844×390 bottom5251.09,390×844 bottom11037.95,768×1024 bottom8213.33,320×920 bottom11776이다. 모든화면의지면노출은source안쪽이고최소하단여유224world,가로최소여유540world,지면상단최소여유538.16world다. 하늘영역은canonicalfloor밖이므로지질을채울대상이아니다. 더극단적인세로화면/editorzoom·canonicalbottom27200전체는범위완료로주장하지않는다.

기존renderer1536×1024기본실행validation0errors와path/color/clip동일성검사를수행했다. 단독preview를직접열어같은큰지층이유지됨을확인했다. 이수치/실행검사는root의nearBODY B접합·공통Scene5viewport최소zoom/pan·브라우저실제플레이를대신하지않는다. rootmanifest/package는수정하지않았다.
