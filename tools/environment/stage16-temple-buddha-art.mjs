import {compileSVG} from './build-act2-art.mjs';

// A separate outdoor stone landmark. Reference photographs were inspected from
// the National Institute of Korean History's Korea Heritage Service collection:
// https://contents.history.go.kr/mobile/eh/view.do?code=ganada&levelId=eh_r0130_0010
// Gwanchoksa: a broad face, elongated ears, a cylindrical crown and stone canopy.
// Yongmi-ri: the carved body remains part of a great, asymmetrical natural rock.
// Bukhansan Gugi-dong / Beopjusa: shallow robe relief follows the original stone.
// These are structural references, not traced images or added story canon.
export const STAGE16_BUDDHA_PREFIX='stage16:temple-stone-buddha-';
export const STAGE16_BUDDHA_ELEMENT='s16-buddha-stone-colossus';
const ASSET_ID=STAGE16_BUDDHA_PREFIX+'cliff-colossus';
const round=v=>Math.round(v*1000)/1000;
const path=(id,d,fill,stroke='',width=1)=>`<path id="${id}" d="${d}" fill="${fill}"${stroke?` stroke="${stroke}" stroke-width="${width}" stroke-linejoin="round" stroke-linecap="round"`:''}/>`;
const group=(id,body)=>`<g id="${id}">${body}</g>`;
const countNodes=node=>1+(node.children||[]).reduce((sum,child)=>sum+countNodes(child),0);

function groundAt(stage,x){
 const terrain=stage.terrains.find(t=>t.id==='act2-floor');
 if(!terrain)throw Error('Stage 16 stone Buddha needs the authored cavern floor');
 const hits=[];
 for(let i=0;i<terrain.points.length;i++){
  const a=terrain.points[i],b=terrain.points[(i+1)%terrain.points.length];
  if(Math.abs(b.x-a.x)>1e-9&&x>=Math.min(a.x,b.x)&&x<=Math.max(a.x,b.x))hits.push(a.y+(b.y-a.y)*(x-a.x)/(b.x-a.x));
 }
 if(!hits.length)throw Error('Stage 16 stone Buddha has no authored support');
 return{terrainId:terrain.id,x,y:Math.min(...hits)};
}

export function createStage16TempleStoneBuddha({supportY=5878.222222222223}={}){
 const top=1670,dy=round(top-supportY);
 const bounds={x:-1530,y:dy-105,w:3680,h:-dy+170};
 let body=`<defs>
  <linearGradient id="buddha-stone-mass" x1="-920" y1="920" x2="1530" y2="2920" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#465e60"/><stop offset=".44" stop-color="#3e585c"/><stop offset="1" stop-color="#233d48"/></linearGradient>
  <linearGradient id="buddha-face-stone" x1="-455" y1="355" x2="490" y2="955" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#75867c"/><stop offset=".48" stop-color="#657a73"/><stop offset="1" stop-color="#3d585a"/></linearGradient>
  <linearGradient id="buddha-lower-stone" x1="200" y1="2520" x2="370" y2="4160" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#334f56" stop-opacity="0"/><stop offset=".68" stop-color="#2e4952" stop-opacity=".68"/><stop offset="1" stop-color="#233d48" stop-opacity="1"/></linearGradient>
  <linearGradient id="buddha-crown-plane" x1="-610" y1="65" x2="620" y2="330" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#71827a"/><stop offset="1" stop-color="#3e585b"/></linearGradient>
  <linearGradient id="buddha-canopy-shadow" x1="0" y1="338" x2="0" y2="568" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#263f4a" stop-opacity=".56"/><stop offset=".58" stop-color="#304c51" stop-opacity=".20"/><stop offset="1" stop-color="#304c51" stop-opacity="0"/></linearGradient>
 </defs>`;
 let rock='';
 rock+=path('natural-rock-body','M-605 868Q-822 1047-985 1137L-1168 1418Q-1372 1775-1390 2080L-1270 2452Q-1432 2805-1492 3188L-1288 3595L-1020 4058Q-722 4204-359 4212L286 4158L900 3972L1285 3618L1512 3228L1835 2930L2098 2802L1975 2482L1745 2268L1600 1850Q1470 1510 1130 1336L642 1138L369 886Z','url(#buddha-stone-mass)');
 rock+=path('left-shoulder-broad-plane','M-611 903Q-836 1111-998 1194L-1107 1450Q-972 1724-789 1823L-583 2178L-461 2850L-1020 3695L-1174 3265L-1065 2810L-1142 2240L-1265 1945L-1154 1453Z','#4d6664');
 rock+=path('right-shoulder-turn','M359 916Q602 1064 918 1189L1203 1468Q1430 1643 1528 1889L1640 2232L1533 2391L1280 2068L1006 1801L862 1460Q700 1267 443 1203Z','#526a67');
 rock+=path('right-rock-return','M1200 1470Q1408 1682 1456 1958L1509 2350L1700 2541L1964 2720L1833 2898L1519 2947L1309 3114L1254 2774L1139 2570L1304 2269L1212 1900Z','#29444f');
 rock+=path('shoulder-chiseled-edge','M511 1047Q716 1135 926 1263L1114 1482Q1270 1658 1323 1833','none','#76887c',14);
 rock+=path('left-rock-deep-cleft','M-1040 1360L-969 1720L-827 1910L-719 2370L-772 2792L-596 3100L-783 3535L-718 3980L-904 3945L-1001 3500L-837 3060L-979 2720L-933 2300L-1038 1990L-1150 1670Z','#2b454f');
 rock+=path('right-rock-large-shadow','M1339 2390L1451 2691L1433 2931L1240 3231L1109 3510L902 3713L665 4100L886 3993L1313 3614L1520 3245L1835 2930L1682 2855L1540 2711Z','#243e48');
 body+=group('unbroken-natural-stone',rock);

 let robe='';
 robe+=path('robe-one-heavy-drape','M-457 946Q-436 1060-226 1155Q-321 1399-174 1666Q67 1993 551 2037L908 2043Q1103 2284 1165 2588L963 2731Q694 2570 328 2481L-93 2100Q-372 1778-426 1449L-721 1280Z','#4f6865');
 robe+=path('robe-turning-shadow','M-413 1137Q-462 1387-239 1724Q66 2041 509 2151L827 2230L1001 2566L827 2534Q486 2399 288 2275L-12 1967Q-317 1658-478 1405Z','#344f56');
 robe+=path('robe-main-fold','M-571 1118Q-656 1378-391 1734Q-36 2193 680 2292','none','#708279',21);
 robe+=path('robe-secondary-fold','M-660 1230Q-745 1607-298 2088Q-72 2330 292 2460','none','#5e766f',18);
 robe+=path('robe-chest-basin','M-255 1154Q86 1288 519 1168Q648 1299 730 1484Q575 1436 411 1450Q70 1465-174 1372Z','#58706b');
 robe+=path('robe-wide-neck-opening','M-256 1154Q113 1272 492 1158','none','#304b53',28);
 robe+=path('robe-heavy-right-sleeve','M731 1295Q1033 1457 1130 1766L1195 2114L1029 2292L751 2154L524 1866L492 1662Q570 1534 731 1295Z','#45615f');
 robe+=path('robe-sleeve-weight','M989 1488Q1152 1855 1030 2090Q936 2188 751 2154L1029 2292L1195 2114L1130 1766Z','#304c54');
 robe+=path('robe-sleeve-broad-carving','M790 1501Q735 1766 863 1978Q957 2091 1046 2074','none','#678075',21);
 // A single half-emerged palm gives the mass a human scale without competing
 // with the face. Fingers are broad relief, not tiny repeating decoration.
 robe+=path('one-hand-emerging-from-rock','M961 1913Q947 1825 1007 1756L1040 1613Q1053 1578 1081 1596L1101 1736L1129 1588Q1144 1557 1165 1595L1164 1753L1202 1634Q1222 1615 1236 1658L1219 1805L1251 1725Q1273 1716 1275 1758L1248 1916Q1240 1993 1172 2040L1088 2033Q1036 1986 961 1913Z','#61786e');
 robe+=path('palm-relief-shadow','M1101 1736L1119 1851Q1080 1870 1071 1937L1088 2033L1172 2040Q1240 1993 1248 1916L1258 1832L1218 1892Q1179 1940 1139 1910L1143 1807Z','#49635f');
 robe+=path('palm-crease','M1099 1911Q1117 1871 1154 1861','none','#36545a',13);
 robe+=path('worn-lower-body','M-361 2493Q118 2730 304 3043L531 3634L790 3901L650 4105L212 4170L-308 4184Q-185 3828-397 3530L-568 3135Z','#405c5e');
 robe+=path('lower-relief-fold','M-248 2654Q14 2941 105 3251L252 3680Q312 3864 445 3982','none','#56716b',25);
 body+=group('broad-shallow-robe-relief',robe);

 let neck='';
 neck+=path('massive-neck','M-366 858L-347 1049Q-165 1210 107 1198L386 1148L424 905L208 832Z','#58716b');
 neck+=path('neck-right-plane','M107 1198L386 1148L424 905L207 892L187 1052Z','#3e595b');
 neck+=path('neck-carved-bands','M-278 1040Q-39 1132 243 1072M-265 1091Q-60 1179 178 1136','none','#3c575a',16);
 neck+=path('neck-plane-catch','M-293 1009Q-68 1097 220 1044','none','#708278',13);
 body+=group('neck-three-dimensional-mass',neck);

 let head='';
 head+=path('left-long-ear','M-467 442Q-584 398-618 534L-603 812Q-585 1028-487 1070L-416 987L-405 683Z','#657b70');
 head+=path('left-ear-hollow','M-506 499Q-567 481-569 594L-554 826Q-542 918-497 965L-483 871Q-527 808-516 699L-471 618Z','#3d595b');
 head+=path('left-ear-fold','M-540 559Q-518 535-494 566L-483 649','none','#819082',13);
 head+=path('right-long-ear','M427 445Q528 405 558 520L554 796Q545 1004 447 1065L396 979L381 637Z','#4b6662');
 head+=path('right-ear-hollow','M465 516Q505 497 512 570L503 808Q489 918 451 966L444 874Q480 797 465 693L427 613Z','#304d53');
 head+=path('right-ear-catch','M509 528Q534 625 524 778','none','#657e72',12);
 head+=path('large-broad-face','M-446 338Q-294 279-66 294Q207 278 420 370L447 661Q437 878 306 1001Q141 1096-76 1084Q-281 1082-402 941Q-491 792-490 637Z','url(#buddha-face-stone)');
 head+=path('face-right-turning-plane','M204 324Q356 349 420 370L447 661Q437 878 306 1001Q175 1082 74 1088L171 1009Q297 869 297 726L286 528Z','#47615e');
 head+=path('face-left-wide-light-plane','M-443 380Q-328 343-181 349L-135 475L-208 663L-264 755L-204 938L-285 1006Q-405 932-448 790L-474 601Z','#74867a');
 head+=path('forehead-one-plane','M-383 387Q-119 302 237 374L268 481Q131 460 6 495Q-132 452-396 518Z','#6b8176');
 head+=path('left-brow-recess','M-402 541Q-297 466-173 491Q-101 505-58 560L-85 588Q-237 525-402 587Z','#405e5c');
 head+=path('right-brow-recess','M49 556Q121 490 239 511Q310 528 337 576L320 600Q196 553 83 601Z','#38565a');
 head+=path('left-upper-eyelid-stone','M-384 561Q-246 506-96 574Q-217 548-372 597Z','#7b8d80');
 head+=path('right-upper-eyelid-stone','M79 578Q207 534 318 584L315 611Q202 566 88 608Z','#6f8377');
 head+=path('left-quiet-eye-cut','M-378 602Q-246 560-98 606','none','#304f54',17);
 head+=path('right-quiet-eye-cut','M93 613Q202 578 316 619','none','#2d4b52',16);
 head+=path('nose-right-shadow','M-19 549L63 577Q53 700 120 762L75 812L-51 809L-75 769L-7 676Z','#405c59');
 head+=path('nose-front-plane','M-31 545Q-10 522 18 551L27 654L56 743Q23 779-50 766L-69 730L-39 642Z','#859183');
 head+=path('nose-wide-base','M-68 736Q-7 761 57 742L103 771L67 796L11 783L-37 791L-92 765Z','#5e786b');
 head+=path('nostril-cuts','M-75 770Q-54 754-34 778M33 779Q58 760 82 776','none','#355459',11);
 head+=path('broad-left-cheek','M-386 675L-264 630Q-207 639-185 659L-149 778L-225 853L-351 827L-405 750Z','#7a8b7c50');
 head+=path('lower-cheek-turn','M184 682Q245 644 283 698L289 839L219 917L116 919L152 817Z','#526e64');
 head+=path('upper-lip-plane','M-183 878Q-107 843-37 861L12 871Q57 848 144 880L190 912Q-16 893-183 915Z','#80907d');
 head+=path('closed-mouth-silent-cut','M-178 918Q-80 901-13 916Q70 902 169 924','none','#355258',15);
 head+=path('heavy-lower-lip','M-147 937Q-19 925 135 943Q54 982-44 974Q-105 970-147 937Z','#748775');
 head+=path('chin-broad-volume','M-224 978Q-23 1031 184 980L140 1046Q-66 1100-224 1018Z','#687f71');
 head+=path('urna-relief','M-60 415a24 22 0 1 0 48 0a24 22 0 1 0-48 0Z','#7e8e7e');
 // Broad weathering, rather than noise or crack counts, makes the right half
 // recede into the cliff while retaining the eye, nose, lips and long ears.
 head+=path('one-aged-cheek-wash','M304 622Q358 697 340 785L303 833L284 750L281 689Z','#304f5538');
 head+=path('forehead-worn-patch','M-332 366Q-216 315-125 359L-161 400L-250 394L-283 436L-354 424Z','#a2ab8e22');
 head+=path('canopy-cast-shadow','M-446 338Q-134 378 399 356L406 465L351 547Q56 497-76 545L-406 549Z','url(#buddha-canopy-shadow)');
 body+=group('great-stone-face',head);

 let crown='';
 crown+=path('cylindrical-stone-crown','M-443 119Q-33 19 400 160L394 380Q115 431-164 394L-451 365Z','url(#buddha-crown-plane)');
 crown+=path('crown-side-shadow','M190 107Q306 120 400 160L394 380L260 400L248 236Z','#405c5d');
 crown+=path('crown-bottom-rim','M-451 324Q-64 373 394 337L394 380Q88 427-451 365Z','#536d65');
 crown+=path('crown-worn-band','M-433 266Q-138 300 212 278','none','#879481',16);
 crown+=path('single-stone-canopy-volume','M-742 34Q-460 4-155 18L486 44L648 10L671 94L475 148Q-136 139-716 103Z','#334f57');
 crown+=path('canopy-upper-plane','M-742 34L-576-12L-164-28L452 15L648 10L595 51L445 79Q-205 62-742 65Z','#718278');
 crown+=path('canopy-broad-front-edge','M-742 65Q-161 82 445 79L595 51L587 96L460 116L-711 101Z','#5d756a');
 crown+=path('canopy-left-worn-catch','M-726 47Q-478 20-174 35L253 53','none','#94a18a',13);
 crown+=path('low-lotus-finial','M-199-22Q-187-78-123-87Q-52-93-19-46L23-27L-29 5L-152 1Z','#5e776c');
 crown+=path('finial-shadow','M-103-83Q-29-69-19-46L23-27L-29 5L-82-6Z','#415d5d');
 body+=group('one-low-korean-stone-canopy',crown);

 let blend='';
 blend+=path('unhewn-right-head-contact','M538 443L616 579L611 736L724 968L813 1130L995 1281L1091 1454L937 1366L772 1240L673 1091L596 984L548 816L572 679Z','#2b4650');
 blend+=path('right-shoulder-native-rock-overlap','M1144 1538L1329 1688L1482 1940L1534 2213L1663 2415L1496 2533L1396 2281L1405 2031L1322 1824Z','#34515a');
 blend+=path('one-shoulder-weathered-facet','M722 1113L823 1163L985 1315L1118 1518L1010 1450L879 1327L727 1271Z','#9ca98b20');
 blend+=path('right-unhewn-overlap','M1491 2558L1680 2710L1880 2805L1730 2990L1420 3177L1140 3558L930 3840L582 4158L295 4220L696 3818L816 3504L1160 3177L1178 2860Z','#2b4751');
 blend+=path('left-unhewn-overlap','M-1292 2637L-1112 2827L-1030 3113L-802 3350L-815 3720L-614 4174L-1020 4058L-1288 3595L-1492 3188Z','#304c54');
 blend+=path('broad-base-atmospheric-falloff','M-1263 2550Q-588 2350-49 2570L431 2700L893 2680L1440 2900L1236 3440L892 3840L303 4158L-358 4212L-1018 4060L-1275 3590Z','url(#buddha-lower-stone)');
 body+=group('natural-rock-blend',blend);
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${bounds.x} ${round(bounds.y)} ${bounds.w} ${round(bounds.h)}"><title>잠운사 법당 밖 암벽에 이어진 거대한 석불</title><g id="stone-colossus" transform="translate(0 ${dy})">${body}</g></svg>`;
 const vector=compileSVG(svg),nodeCount=countNodes(vector.root);
 if(nodeCount>100)throw Error(`Stone Buddha exceeded 100-node art budget (${nodeCount})`);
 return{id:ASSET_ID,name:'법당 밖 암벽에 반쯤 묻힌 잠운사 거대 석불',category:'architecture',environmentRole:'rock',visual:[],vector,collision:[],anchor:{x:0,y:0},sockets:[],tags:['stage16-stone-buddha','visual-only','editable-native-vector'],params:{artRevision:1,nodeCount,collisionSource:'none',referenceStyle:'Korean-colossal-stone-and-rock-carved-Buddhist-sculpture'},bounds,reference:{heightM:bounds.h/60,bounds:{...bounds},foot:{x:0,y:0},scaleRange:[1,1],backgroundRange:[1,1]}};
}

/** Purely additive post-author pass. The revision-3 temple, its ten assets,
 * historical geometry and every gameplay field remain byte-for-byte intact.
 * L1-back is deliberate: the opaque authored cavern is also L1-back. Inserting
 * immediately after it gives the rock a continuous world anchor, while every
 * pre-existing hall, bridge, terrain and actor still draws in front of it. */
export function applyStage16TempleBuddha(project){
 const stage=project.stages.find(s=>s.metadata?.stageId===16);
 if(!stage||stage.design?.templeArt?.revision!==3)throw Error('Stone Buddha requires the completed revision-3 Stage 16 temple');
 const support=groundAt(stage,6960),asset=createStage16TempleStoneBuddha({supportY:support.y});
 const existing=project.library.findIndex(a=>a.id===ASSET_ID);
 if(existing<0)project.library.push(asset);else project.library[existing]=asset;
 stage.elements=stage.elements.filter(e=>e.id!==STAGE16_BUDDHA_ELEMENT);
 const rear=stage.elements.findIndex(e=>e.id==='s16-art-rear-cavern-courts');
 if(rear<0)throw Error('Stone Buddha requires the continuous Stage 16 rear cavern');
 stage.elements.splice(rear+1,0,{id:STAGE16_BUDDHA_ELEMENT,assetId:ASSET_ID,x:support.x,y:support.y,scale:1,rotation:0,snap:false,depthLayer:'L1',layer:'back',stage16Support:support});
 return project;
}
