# SURFACE 제작 후보

공통Scene의entry/center실제캡처를직접보고,92world배우에비해1000world급암반면과넓은황토면의근거리재료규모가부족함을확인했다. 기존BODY·foundation·pine·실제지형을바꾸지않고,west4/central3/north4개역할군집과긴여백을설계했다. 한재료덩이는30~120world를목표로하며군집전체는여러돌/뿌리/흙형태를포함하므로더넓을수있다. 반복tile/동일폴리곤/노이즈로채우지않았다.

실제floor좌표guide와92배우표본,nearBODY및서쪽표면source를imagegen입력으로주고3구간고유그림을생성했다. 실제Inkscape1.4.4 native8에서는이끼olive가갈색에합쳐져반려하고16색으로다시추적했다. 원본과두trace의RAW는보존했다. native16에서olive색역할·회색돌·갈색뿌리를직접확인했다.

실제Inkscape path-intersection으로sourcealpha를floorTop..+160world밴드에등록했다. 밴드는canonicalfloor안쪽이며기하/충돌추가없다. source면적보존은west96%,central97%,north80%,north첫군집62%이다. 이접촉등록은의도된source편집손실이며무손실최적화로계산하지않는다. 실제소스에흰역할이없는fullcanvas#fdfdfd배경패스만XML로제거했고,등록RAW와후보양쪽에동일적용해밝은edge잔상을줄였다. 원본native색패스는불변이다.

색전용optimizer의0.0001후보들은통과했으나실제engine1x에서보호silhouette1px차이가생겨3개모두반려했다. 기존한도를바꾸지않고precision6로선택,동일engine1x/2x에서모든보호silhouette0px·보호RGBmax0.001954/255로통과했다. precision6는byte정밀도압축이며segment수는소폭늘어기하단순화성공으로표시하지않는다. source반투명edge의binaryalpha손실과양자화는별도기록했다.

3구간fullRAW/FINAL과root/moss200%를직접열어비교했다. 큰재료역할과세부형태가보존되고north첫군집은실제접촉선으로잘려좁아진모양이다. 일반플레이거리의합성가독성·모바일·전투상태는root의실제장면검수가남아있다. 이미지비교와자동검사는미술합격이나브라우저실제플레이를대신하지않는다.

최종JSON은world변환내장으로모두(0,0),scale1,anchor0,0이다. SURFACE/L1 prop으로nearBODY뒤,배우앞의가림없는지표순서에합성한다. 실제엔진pixel-centeralpha>=128표본깊이는west-0.20..117.95,central-0.19..73.67,north-0.25..111.54world이다. 음수는접촉선AA표본으로1sourcepixel보다작으며기하위로추가한지형이아니다. 정확한지리clip은native교집합원본이보존한다.

자동PNG/보고서는_local/reports/act2-redesign-20261109/surface-production,반려8색원본과자동중간파일은_local/archive/act2-redesign-20261109/surface-production에두었다. source/guide/현재nativeRAW/등록RAW/final/config/재현script는art에보존했다. 자세한배치·hash·한계는delivery.json.

## 공통 합성 재검수와 edge source 교정

최초 commonScene 합성에서 밝은sticker외곽이발견됐다. nonplayEnvironment=true/silhouetteUnderpaint=false를기존허용분기로설정했으나실제SURFACE는decoration/L1이라옵션전후1x픽셀차이0이었다. gameplay강제context에서만1961px차이가있었으므로underpaint만을원인으로확정하지않았다.

원본alpha>=128의실제RGB최대가west[162,161,163],central[155,157,157],north[156,155,155]인데native색pass에는최대228의밝은색이생겼다. west밝은1323px의95%가sourcealpha안쪽거리1px이하였고원본에흰재질이없었다. 해당비재료white-mixpass만west7/central7/north6개로분리해기존rootsoil색으로실제Inkscape union했다. graystone/olive/rootcore패스는보존했다. 새unionbase는보호층으로RAW/FINAL양쪽에동일사용하고기존precision6core곡선만검증했다. 원본nativeRAW/alpha불변,새source저작은각*-edge-authored/에분리했다.

실제기존L1과gameplaycontext양쪽의RAW/FINAL1x2x가모두기존한도통과,보호silhouette0px·보호RGBmax0.001794/255였다. 최종asset78,173/55,484/88,596B. 이전실패자료/기존최적화원문보고서는보존했다.

갱신된commonScene의entry/center/phone/overview(bundle7620f6...)를직접열어SURFACE흰sticker테두리가사라지고지표돌/뿌리/olive가남아있음을확인했다. 반면pine아래/구멍의밝은halo와BODY/foundation접합은별도결함/검수사항이다. 이SURFACE교정이전체장면미술·실제플레이·브라우저·배포합격을뜻하지않는다.
