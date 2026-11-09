# Foundation 제작 후보

near BODY v2와 실제nativepalette를 입력으로 받아 전체지질 그림을 생성하고, 별도imagegen 정리후 실제Inkscape1.4.4 native6색/smooth/speckle32로추적했다. source1536×1024의3:2와world15000×10000이동일하며균일변환9.765625다. worldViewBox[-4200,1200,15000,10000], 배치(0,0),scale1,anchor0,0. near BODY보다먼저그리는BODY다. 실제clip은near BODY와동일canonicalfloor fullpolygon이며카메라/지형/충돌은바꾸지않았다.

V1 trace의미세색반점을반려했다. V2 nativeRAW는32,454B/6paths/675segments/13subpaths/maxd7766이며원본이미지→traceRGB MAE3.15483/255,alpha0이다. 큰연결지층과희소한갈라짐을유지하되원본의미세명암은6색으로평탄화됐다. 전체와상부겹침/하단지층/좌측단층200%를직접열어확인했다. 소수의상부작은색섬은남아있다. 미술합격은판정하지않았다.

boundedoptimizer는실행했으나simplify/precision후보가raw675segments보다늘어rawfallback을선택했다. 23KBprecision4후보가있지만최적화성공으로표시하지않는다. 최종asset34,978B,SVG33,337B. 기존renderer1x실행validation0errors확인. 최종world clip은source사각형을실제canonical지형안쪽으로만보이게하는의도된패키징이며원본silhouette무손실최적화로계산하지않는다.

실제bounds계산으로대표5화면의overscan을포함했다. 390×844 최소zoom에서최대노출bottom11037.95,그림bottom11200으로162.05world여유다. 더극단적인세로화면은미검증이며canonicalbottom27200까지의미술을완성했다고하지않는다. root의실제합성접합/최소zoom·pan/브라우저검수가남아있다.

자동PNG/검사보고서는_local/reports/act2-redesign-20261109/foundation-production, 실패·비선택후보는_local/archive/act2-redesign-20261109/foundation-production에보존했다. source/guide/immutableRAW/final/config/재현script는art에보존했다. 상세hash/배치/범위는delivery.json.
