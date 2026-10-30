# 읽기 버튼 행의 배경 제거

부모가처음story-scene만투명화하고story-guide의#0d2024를남긴누락이다.5987보존entry의실제14장R1guide(여정목표/상층주민구조·구조)에서별도사각행을재현했다.[실제전후](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/reading-action-rows-20261023/evidence/stage14-guide-before-after.jpg).안내창자체의#122c32f5와기존글자/버튼/초상화/본문폭은보존한다.버튼행만story/narration/guide/document에서background:none으로통일한다.문서paper의#c4b48f행도제거했다.

기존body-only스크롤계산에guide를포함하고버튼이옆칸인지아래행인지구분하며margin/gap을계산한다.프레임루프는추가하지않고생성/ResizeObserver에서만계산한다.568×320에서는기존34dvh가본문높이를0으로줄이는실제문제도확인했다.읽을공간을위해최대높이를min(max(34dvh,160px),현재viewport잔여높이)로보완했다.정상390짧은안내의창/본문/버튼rect는그대로다.본문만스크롤하고버튼은항상접근된다.

320×640/390×844/844×390/568×320에서현재story·narration·guide·기록4경로,짧음/긴문장scroll0/50/100%의64위치를확인했다.전체행배경rgba0,글자/버튼겹침0,본문높이최소21px,이전/확인·다음/넘기기touch통과.짧은가로긴guide는46px본문2줄을표시하고본문내스크롤로끝까지읽는다.[짧은가로사진](https://raw.githubusercontent.com/sys8994/honro/569e11123b2e077ef1f37aeaf92f44d131df73e5/game/docs/reading-action-rows-20261023/evidence/short-landscape-long.jpg),[전후raw](evidence/before.json),[최종64위치](evidence/after.json).긴문장은기존14장목표문구를반복한fixture이며원고수정이아니다.story의휘겸배치는같은목표문구를사용한layoutfixture로서실제인물대사라고주장하지않는다.

현재기록은text-only대사경로이며옛paper reader는생산JS에서생성하지않는다.paper CSS호환은별도390/568 DOMfixture2개로투명행·본문만스크롤·버튼/viewport접근을검사했다.이것을활성paper기능실행으로세지않는다.기존stage/maps/원고를바꾸거나reader를재도입하지않았다.

raw실행은스킬단위ea936eff+이단위미커밋소스/빌드다.[build](evidence/build.txt).스킬P0와분리커밋하며최종소스의두수정통합검사/보존영수증은스킬보고서후속기록에연결한다.원래probe의누락된hero.desc fixture참조를수정했고,최초버튼전용검사뒤실제사진에서본문0을발견해본문높이guard를추가했다.최종64검사는보완후모두통과했다.실기기/Safari/FPS·전체캠페인은미실행.master/Pages는부모담당이다.


최종 실행/빌드는 **`977eac64c38dc9e8c88a8bf1f0c64de2ec9142a1`**다. 이후 문서/검사 smoke 옵션만 바뀌며 생산 소스/생성물은 같다. 최종 소스에서390/568 안내의 짧음·긴본문 scroll0/50/100% **8위치와 paper CSS fixture2개**도 통과했다. [최종 smoke](evidence/final-smoke.json).390 짧은 안내의 panel/본문/버튼 rect와 panel background는5987과 exact이며 별도 행 색만 제거됐다. 최종 통합 entry·manifest·스킬 소스 exact 및 과거21 graph/7435파일 보존은 [스킬 통합 영수증](../skill-image-only-20261023/evidence/preservation-final.json)을 따른다.
