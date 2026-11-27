(function(G){'use strict';
// Read-only material projections. Canonical terrain, editor assets and saved landmarks
// remain the owners of collision, chart orientation and campaign progress.
const domain=G.HonroTerrainDomain,materials=domain.materialLandmarks,cache=new WeakMap();
const path=(fill,d)=>({tag:'path',fill,d});
const group=children=>({tag:'g',children});
function vectorView(l,root,clips=l.asset.vector.clips,bounds=l.asset.bounds){
 const v=l.asset.vector;
 return {...l,asset:{...l.asset,bounds,vector:{...v,root,clips,viewBox:[bounds.x,bounds.y,bounds.w,bounds.h]}}};
}
function doldang(l){
 const v=l.asset.vector;
 if(!v?.clips?.stage7R7Facies||!v.root.children.some(c=>c.clipPath==='site-edge-1'))return l;
 // Two sides of the village are different exposures of the same purple-brown bed.
 // Keep the village's original centre, arches, foot stones and the approved deep facies.
 const banks=group([
  path('#342832','M-680 1039Q-651 1007-606 1004L-543 978Q-496 969-462 944L-368 925-290 928-229 918-150 924-91 907-24 911 14 906 83 923 119 1043 59 1181-10 1325-88 1347-131 1320-193 1285-263 1280-300 1236-361 1219-413 1161-475 1153-525 1096-581 1085-623 1052Z'),
  path('#4b3844','M-648 1025Q-584 1000-545 979L-462 944-368 925-291 930-227 918-149 925-91 907-22 912 42 916 53 973-18 986-72 1029-145 1040-200 1079-258 1088-316 1138-374 1140-335 1088-278 1053-202 1017-119 969-191 976-268 1005-374 1001-442 1037-502 1033-562 1051Z'),
  path('#614b56','M-539 982L-462 947-385 936-325 937-383 952-436 982-464 1004-504 1007ZM-276 1048Q-211 1010-177 1004L-117 974-72 971-141 1007-189 1038-230 1047-275 1072-302 1076Z'),
  path('#43333a','M-319 1187L-258 1146-188 1134-116 1086-26 1060 52 1006 65 1086-16 1152-75 1191-128 1260-199 1247-249 1215Z'),
  path('#251d25','M-502 1090L-416 1079-377 1056-292 1043-363 1066-408 1103-452 1120ZM-164 1304L-128 1253-85 1225-43 1172 17 1135-3 1183-56 1238-81 1300-93 1332Z'),
  path('#665823','M-630 1012Q-573 991-542 976L-463 941-386 929-353 920-289 923-225 913-152 919-95 902-52 906-10 902 25 907 26 916-26 917-69 915-99 920-160 931-228 924-283 936-363 932-397 944-461 954-534 987-590 1004Z'),
  path('#8b772b','M-462 943L-401 931-372 924-341 923-368 928-397 938-442 946ZM-160 920L-97 904-67 907-93 911-133 922Z'),
  path('#342832','M1378 890L1430 880 1499 887 1558 878 1641 882 1717 870 1774 879 1843 906 1901 910 1957 944 2028 960 2086 1004 2054 1028 1995 1043 1955 1085 1889 1092 1843 1131 1784 1134 1748 1176 1679 1201 1641 1247 1550 1281 1458 1263 1370 1178Z'),
  path('#4b3844','M1406 898L1500 889 1556 882 1645 886 1715 873 1774 883 1844 908 1901 916 1950 943 2008 960 1932 965 1890 949 1815 952 1752 931 1673 942 1609 967 1529 978 1471 1016 1399 1026Z'),
  path('#614b56','M1512 979L1595 963 1651 941 1730 931 1666 951 1623 980 1535 1002 1492 1029 1458 1039ZM1822 979L1887 973 1935 982 1904 986 1870 982 1822 996 1792 1012Z'),
  path('#43333a','M1398 1110L1469 1072 1530 1060 1596 1017 1642 1014 1708 980 1774 978 1712 1015 1653 1040 1607 1085 1527 1108 1486 1167 1422 1185Z'),
  path('#251d25','M1577 1249L1640 1191 1691 1162 1739 1111 1801 1094 1850 1059 1914 1047 1877 1071 1826 1116 1769 1134 1727 1180 1650 1221 1620 1245Z'),
  path('#665823','M1390 881L1433 878 1497 882 1560 874 1644 877 1716 866 1776 875 1846 901 1900 906 1958 940 2021 956 2061 980 2001 964 1952 950 1896 918 1841 913 1774 888 1714 880 1644 892 1559 886 1497 894 1427 890 1390 893Z'),
  path('#8b772b','M1495 883L1557 875 1614 879 1585 882 1550 881 1510 888ZM1700 870L1719 868 1749 873 1728 873Z')
 ]);
 const keep=v.root.children.filter(c=>!['site-edge-0','site-edge-1'].includes(c.clipPath));
 return vectorView(l,group([banks,...keep]),v.clips,{x:-685,y:0,w:2780,h:1570});
}
function harbour(l){
 const v=l.asset.vector;if(v?.root?.clipPath!=='portApron')return l;
 const coast='M-160 -140H3530V860L3345 911 3402 988 3316 1028 3344 1088 3293 1155 3338 1248 3238 1315 3271 1370 3168 1456 3235 1529 3115 1647 3126 1750 3055 1855 3160 2070V2450H-250V1990L-12 1828 74 1749 35 1656 99 1575 45 1517 107 1448 53 1358 125 1293 76 1237 119 1156 61 1093 80 1026 22 981 56 946-130 884Z';
 const interlock=group([
  path('#59636a','M-112 1148L-52 1106 23 1084 69 1041 114 1046 172 1024 223 1034 166 1062 129 1106 75 1115 26 1153-23 1166-80 1202Z'),
  path('#777e80','M-91 1143L-49 1118 23 1092 64 1056 107 1051 67 1071 34 1110-15 1120-53 1148Z'),
  path('#4d5962','M-78 1408L-19 1379 36 1326 83 1316 119 1267 165 1244 179 1218 195 1240 170 1275 138 1310 111 1368 56 1391 19 1432-23 1449Z'),
  path('#7c7770','M-15 1377L39 1330 89 1318 123 1274 151 1261 131 1295 101 1337 65 1346 38 1379Z'),
  path('#52616c','M-69 1713L-23 1649 48 1627 96 1576 168 1544 223 1547 174 1580 159 1625 113 1650 72 1715 21 1719-22 1750Z'),
  path('#737473','M-16 1661L38 1638 93 1588 147 1559 177 1556 129 1588 105 1620 60 1648 24 1655Z'),
  path('#55636c','M3165 1170L3204 1122 3250 1102 3281 1040 3327 1020 3372 964 3433 947 3472 961 3431 1002 3407 1049 3356 1081 3336 1125 3280 1142 3245 1190Z'),
  path('#7b7c77','M3233 1117L3272 1064 3292 1037 3332 1023 3356 989 3396 977 3364 1010 3342 1041 3308 1058 3278 1106Z'),
  path('#515e67','M3074 1621L3130 1565 3140 1526 3198 1480 3237 1402 3299 1379 3356 1331 3390 1354 3353 1405 3311 1430 3294 1494 3232 1536 3205 1594 3141 1614 3094 1659Z'),
  path('#7b7871','M3150 1533L3197 1486 3235 1411 3272 1397 3248 1431 3232 1481 3193 1509 3164 1556Z')
 ]);
 // The dark rock seen behind the apron already belongs to the coast foundation.
 return vectorView(l,group([{tag:'g',clipPath:'coastOverlap',children:[v.root]},interlock]),
  {...v.clips,coastOverlap:[coast]});
}
const pointFace=(fill,pairs)=>({fill,points:pairs.map(([x,y])=>({x,y}))});
function spine(l){
 const v=l.asset.visual,p=v?.[0]?.points?.[0];if(!p||v.length!==1)return l;
 const chart=p.x===3470&&p.y===-280?'N':p.x===-280&&p.y===-270?'L':p.x===-270&&p.y===3280?'C':null;
 if(!chart)return l;
 const transform=([x,y])=>chart==='L'?[y,3200-x]:chart==='C'?[3200-x,3000-y]:[x,y];
 // Behind the traversable wall. Interlock the tall spine with its own scree fans.
 const planes=[
 ['#393733',[[3410,-195],[3570,-230],[3635,-96],[3602,65],[3694,178],[3667,415],[3772,593],[3716,839],[3814,1028],[3762,1252],[3858,1428],[3792,1610],[3669,1759],[3711,1944],[3522,2156],[3470,2320],[3276,2462],[3152,2355],[3276,1862],[3355,1427],[3354,762]]],
 ['#4a443d',[[3506,-69],[3591,49],[3556,270],[3640,451],[3698,557],[3657,689],[3555,758],[3479,934],[3478,756],[3522,613],[3449,425]]],
 ['#534a41',[[3433,1032],[3538,908],[3552,814],[3654,728],[3705,652],[3678,811],[3754,1004],[3690,1077],[3590,1130],[3522,1235],[3441,1268]]],
 ['#423e38',[[3375,1470],[3464,1390],[3508,1244],[3645,1150],[3751,1076],[3712,1229],[3796,1428],[3714,1501],[3594,1610],[3518,1622],[3415,1742],[3326,1700]]],
 ['#50473e',[[3376,1803],[3521,1671],[3618,1644],[3705,1510],[3783,1455],[3749,1575],[3633,1751],[3655,1869],[3531,1987],[3433,2006],[3300,2154],[3251,2126]]],
 ['#403b37',[[3200,2334],[3338,2234],[3416,2087],[3516,2030],[3608,1954],[3537,2101],[3443,2183],[3409,2316],[3278,2434],[3191,2410]]]
 ];
 const faces=planes.map(([f,points])=>pointFace(f,points.map(transform)));
 const bb=l.asset.bounds,coords=faces.flatMap(f=>f.points),x=Math.min(bb.x,...coords.map(p=>p.x)),y=Math.min(bb.y,...coords.map(p=>p.y));
 const bounds={x,y,w:Math.max(bb.x+bb.w,...coords.map(p=>p.x))-x,h:Math.max(bb.y+bb.h,...coords.map(p=>p.y))-y};
 return {...l,asset:{...l.asset,bounds,visual:[...v,...faces]}};
}
// These small faces inherit each owner's coordinates and palette. Their contact-side
// silhouettes come from the original bank, retaining wall or temple component.
function banks(l,faces){
 const v=l.asset.vector;
 return vectorView(l,group([v.root,...faces.map(([color,d])=>path(color,d))]));
}
function naru(l){
 const faces=[
  ['#203537','M1675 487Q1703 467 1738 464L1752 447 1768 450 1781 477 1779 502 1796 515 1794 538 1810 552 1801 576 1819 588 1815 608 1848 632 1844 655 1828 666 1783 661 1746 671 1704 659 1664 650 1621 650 1650 620 1684 596 1657 562Z'],
  ['#314244','M1669 514Q1711 495 1733 477L1753 461 1766 464 1769 486 1754 498 1749 516 1725 521 1700 543 1664 549 1640 565 1614 563Z'],
  ['#283e40','M1708 572L1739 547 1755 543 1779 515 1791 522 1788 541 1799 553 1781 569 1774 587 1746 597 1722 616 1680 621 1651 636 1622 635 1662 605Z'],
  ['#42514c','M1723 488L1741 474 1755 468 1762 471 1748 481 1741 490 1723 497 1707 509ZM1754 552L1776 536 1784 536 1778 546 1767 550 1749 564 1733 568Z'],
  ['#374848','M1715 639L1759 613 1786 604 1803 585 1812 590 1800 606 1798 618 1778 624 1752 641 1732 643 1714 652 1696 652Z'],
  ['#1e3336','M1995 700L2043 686 2073 669 2100 668 2123 656 2149 661 2161 650 2173 669 2162 688 2184 704 2176 722 2194 738 2192 756 2214 780 2208 796 2161 800 2109 781 2070 781 2022 759 1988 757Z'],
  ['#324444','M1999 715L2032 710 2077 690 2104 687 2125 673 2150 674 2163 667 2156 682 2137 688 2121 702 2085 709 2056 722 2033 723 2016 732 1980 734Z'],
  ['#293c40','M2041 769L2097 742 2133 735 2163 710 2178 707 2171 725 2177 737 2150 751 2142 765 2112 766 2079 783 2046 783 2021 790Z']
 ];
 const rim=faces.map(([color,d],i)=>({...path(color,d),transform:[1,0,0,1,0,i<5?28:22]}));
 return vectorView(l,group([l.asset.vector.root,...rim]));
}
function hamletBeds(upper){
 if(upper)return [
  ['#363c43','M210 1496L331 1471 397 1475 449 1523 467 1549 415 1542 381 1525 313 1530 260 1548 146 1548Z'],
  ['#4b4e50','M308 1501L381 1488 415 1505 408 1520 374 1515 333 1520 301 1517ZM432 1532L460 1552 481 1586 450 1578 425 1554Z'],
  ['#2c333c','M295 1570Q366 1553 396 1565L460 1593 506 1595 548 1646 526 1662 469 1644 434 1619 380 1614 296 1622 228 1615Z'],
  ['#41464d','M483 1630L523 1641 556 1667 578 1705 542 1699 508 1676 472 1669 448 1648ZM569 1707L612 1744 658 1772 676 1812 632 1794 601 1762 567 1754 537 1720Z'],
  ['#373e47','M590 1819L655 1822 720 1852 755 1880 801 1902 826 1936 773 1929 725 1908 693 1881 624 1866 575 1859 546 1837Z']
 ];
 return [
  ['#373f48','M1925 4695L2104 4679 2229 4686 2292 4760 2330 4827 2305 4839 2245 4794 2208 4740 2090 4728 2020 4746 1932 4747 1879 4731Z'],
  ['#4b5157','M2011 4702L2084 4691 2145 4691 2140 4707 2095 4715 2045 4712 2010 4720ZM2156 4692L2220 4699 2252 4734 2202 4725 2150 4712Z'],
  ['#424951','M2254 4770L2295 4800 2326 4842 2366 4873 2400 4886 2391 4910 2337 4899 2308 4872 2285 4827 2255 4814Z'],
  ['#38414b','M2348 4921L2406 4885 2491 4871 2548 4876 2589 4868 2612 4844 2676 4798 2713 4765 2742 4759 2721 4807 2672 4844 2631 4909 2564 4922 2513 4939 2412 4939 2372 4953Z'],
  ['#494f55','M2434 4894L2481 4883 2526 4885 2516 4898 2473 4908 2426 4907ZM2541 4884L2589 4875 2616 4852 2641 4841 2623 4871 2591 4896 2549 4903Z'],
  ['#39424b','M2954 4703L3048 4687 3136 4693 3140 4760 3157 4819 3200 4847 3280 4858 3415 4842 3473 4849 3452 4877 3314 4898 3210 4884 3127 4854 3115 4807 3083 4754 2996 4749 2921 4764Z']
 ];
}
function canal(l){
 const v=l.asset.vector,rows=v.root.children.map(n=>{
  if(n.fill==='#728c7d')return {...n,fill:'#617b71',opacity:.60};
  if(n.fill==='#8ea397')return {...n,fill:'#7c968b',opacity:.66,d:'M-1780 4101Q-1080 4061 -665 4068Q-1120 4067 -1740 4108Z M-412 4061Q-96 4050 129 4059Q-121 4056 -381 4068Z M348 4069Q697 4070 1002 4096Q655 4078 390 4075Z M4930 4161Q5510 4088 6320 4138Q5530 4100 4990 4165Z M9060 3980Q10020 3910 10825 3929Q10070 3918 9130 3985Z'};
  if(n.fill==='#6c8b7e')return {...n,fill:'#648278',opacity:.64,d:'M-520 4241Q-199 4217 28 4224Q-218 4225 -479 4247Z M205 4227Q572 4224 788 4249Q466 4236 249 4234Z M5410 4350Q5780 4312 6240 4341Q5770 4320 5455 4355Z M8880 4140Q9480 4086 10410 4115Q9570 4096 8912 4147Z'};
  return n;
 });
 return vectorView(l,group(rows));
}
function quayFoot(l){
 return banks(l,[
  ['#414c44','M494 4244L508 4238 555 4237 567 4243 572 4252 486 4251Z'],
  ['#596454','M501 4242L548 4240 558 4244 514 4247 495 4246Z'],
  ['#425449','M1070 4245L1084 4238 1124 4240 1138 4249 1144 4299 1123 4288 1095 4277 1068 4262Z'],
  ['#647361','M1075 4245L1089 4241 1124 4244 1136 4251 1092 4255 1070 4251Z'],
  ['#344c43','M1093 4258L1125 4253 1134 4261 1137 4289 1120 4282 1119 4263 1094 4267Z']
 ]);
}
function forestBank(l){
 return banks(l,[
  ['#354d57','M-146 2433L-82 2395 8 2377 73 2343 120 2282 174 2277 223 2292 302 2283 326 2292 288 2329 238 2351 211 2394 155 2411 112 2457 48 2468 1 2501-63 2502-135 2531-188 2520Z'],
  ['#465d61','M-108 2432L-42 2409 23 2392 78 2362 123 2306 163 2293 211 2307 162 2315 127 2356 85 2386 18 2408-37 2438-92 2451Z'],
  ['#2b4352','M-66 2497L18 2461 60 2450 110 2419 161 2406 211 2367 255 2357 225 2387 204 2419 167 2434 143 2461 79 2476 41 2507-23 2518-75 2542-130 2533Z'],
  ['#555e4d','M107 2283L135 2274 168 2275 196 2282 227 2280 210 2288 185 2293 163 2286 137 2288 113 2300 90 2331 71 2346 90 2314ZM158 2314L171 2293 175 2296 168 2317 145 2341 137 2359 124 2371 137 2344Z']
 ]);
}
function mutedThicket(l){
 const v=l.asset.vector,colors={'#577a73':'#4d6e68','#587977':'#4d706d','#56715a':'#496652'};
 const tint=n=>n.children?{...n,children:n.children.map(tint)}:colors[n.fill]?{...n,fill:colors[n.fill]}:n;
 return vectorView(l,tint(v.root));
}
function headland(l,b){
 const v=l.asset.vector,gradient={...v.gradients};
 const wood={'#cc905e':'#967858','#9e6b49':'#80654e','#88593b':'#715243'};
 const shade=n=>{
  if(n.children)return {...n,children:n.children.map(shade)};
  const tint=wood[n.fill];if(!tint)return n;
  const name='rearTimber'+n.fill.slice(1);
  gradient[name]={type:'radial',cx:792,cy:736,r:540,stops:[{offset:0,color:tint,opacity:1},{offset:.67,color:tint,opacity:1},{offset:1,color:n.fill,opacity:1}]};
  return {...n,fill:'url(#'+name+')'};
 };
 const faces=[];
 // Shade only the lip of an actual path through each busy timber crossing.
 for(const [id,from,to] of [['approved37-lower-diagonal',1200,1458],['approved37-lower-road',1054,1284],['approved37-middle-road',1190,1416]]){
  const support=b.terrain.find(t=>t.id===id);
  if(!support)continue;
  const ridge=G.HONRO_CORE.poly(support);
  for(let i=1;i<ridge.length;i++){
   const a=ridge[i-1],z=ridge[i],left=Math.max(from,a.x),right=Math.min(to,z.x);
   if(right-left<12)continue;
   const y=x=>a.y+(x-a.x)*(z.y-a.y)/(z.x-a.x),y1=y(left),y2=y(right);
   faces.push(path('#667144','M'+left+' '+(y1+4)+'L'+right+' '+(y2+4)+' '+(right-11)+' '+(y2+9)+' '+(left+14)+' '+(y1+10)+'Z'));
  }
 }
 const revised=vectorView(l,group([shade(v.root),...faces]));revised.asset.vector.gradients=gradient;return revised;
}
function buriedVault(l){
 const v=l.asset.vector;
 if(!v.clips?.rockBody)return l;
 const beds=[
  ['#424641','M-338 -42L-210 -146-111 -157-26 -188 96 -174 199 -191 352 -165 440 -185 377 -153 256 -140 174 -110 48 -114-51 -77-173 -76-254 -28-307 -4Z'],
  ['#494c45','M-244 -34L-182 -67-85 -79-17 -115 43 -111 1 -94-63 -58-124 -55-203 -21Z'],
  ['#3d4340','M-317 172L-227 133-128 124-46 79 76 86 172 53 294 62 400 25 348 73 235 96 150 126 59 118-28 150-141 166-215 211-318 244Z'],
  ['#4d5047','M-271 291L-200 251-110 239-38 207 48 211 129 186 94 215 18 230-41 229-122 266-192 275-252 317Z'],
  ['#434741','M-297 390L-181 368-123 330 23 310 109 273 202 280 274 254 220 292 143 310 69 304-45 352-140 365-209 409-285 425Z']
 ];
 return vectorView(l,{...v.root,children:[...v.root.children,...beds.map(([f,d])=>path(f,d))]});
}
function westernFoot(l){
 const faces=[
  pointFace('#41443f',[[-790,2948],[-658,2875],[-522,2854],[-417,2795],[-242,2799],[-88,2729],[99,2736],[24,2779],[-124,2802],[-260,2864],[-388,2871],[-489,2932],[-631,2944],[-748,2995]]),
  pointFace('#4c4c44',[[-463,2938],[-348,2894],[-263,2890],[-169,2857],[-102,2858],[-137,2880],[-225,2905],[-320,2922],[-408,2960]]),
  pointFace('#3c403b',[[-636,3114],[-515,3063],[-435,3060],[-316,3017],[-188,3019],[-64,2972],[84,2974],[-24,3027],[-121,3040],[-247,3085],[-374,3088],[-488,3142],[-589,3150]])
 ];
 return {...l,asset:{...l.asset,visual:[...l.asset.visual,...faces]}};
}
function templeEave(l){
 // All points lie behind the existing sloped eastern face of the upper hall.
 const faces=[
  ['#414c49',[[7608,-615],[7718,-597],[7845,-671],[8008,-628],[8110,-661],[8152,-592],[8083,-487],[7977,-457],[7906,-348],[7777,-327],[7690,-210],[7521,-159],[7470,-86],[7531,-282]]],
  ['#49524c',[[7540,-200],[7674,-261],[7760,-369],[7842,-396],[7790,-339],[7750,-259],[7638,-191],[7573,-96],[7470,-39]]],
  ['#354340',[[7439,74],[7555,9],[7645,-100],[7768,-133],[7865,-227],[7961,-252],[7898,-164],[7800,-101],[7732,22],[7633,48],[7562,126],[7450,160],[7363,235]]],
  ['#47514c',[[7379,186],[7483,131],[7558,77],[7609,67],[7571,111],[7516,139],[7473,198],[7377,244],[7312,340]]],
  ['#384441',[[7201,518],[7312,419],[7369,318],[7463,286],[7533,216],[7635,191],[7585,265],[7508,311],[7450,386],[7370,412],[7296,514],[7190,593]]]
 ];
 return {...l,asset:{...l.asset,visual:[...l.asset.visual,...faces.map(([f,ps])=>pointFace(f,ps))]}};
}
function roofMortise(l){
 // Follow the last roof tile (6275,1820) down to the existing inclined rock return.
 const mortise=[
  pointFace('#343a35',[[6098,1789],[6163,1797],[6202,1789],[6231,1797],[6251,1796],[6276,1814],[6287,1826],[6278,1854],[6264,1868],[6212,1854],[6166,1842],[6124,1841]]),
  pointFace('#49453c',[[6111,1802],[6168,1808],[6204,1805],[6242,1815],[6263,1813],[6274,1826],[6259,1834],[6218,1828],[6176,1823],[6141,1821]]),
  pointFace('#635847',[[6140,1809],[6182,1811],[6232,1818],[6247,1823],[6221,1822],[6189,1817],[6155,1817]]),
  pointFace('#38362f',[[6188,1841],[6222,1844],[6252,1854],[6268,1851],[6257,1876],[6234,1901],[6223,1883],[6228,1868],[6191,1859]])
 ];
 return {...l,asset:{...l.asset,visual:[...l.asset.visual,...mortise]}};
}
function deepTail(l,b){
 // The maps share the east rock-cut projection. Six original face ends carry
 // the crop of the source plate; follow their own dip below the last playable road.
 const edge=b.width;
 const offsets=[[108,.06],[227,.19],[362,.23],[497,.40],[700,.54],[605,.62],[473,.64],[322,.79],[204,.83],[71,.96]];
 const tones=b.honroStage===59?{'#2e2432':.72,'#5a3b49':.48,'#352835':1.16}:{'#263849':.91,'#40596e':.53,'#293d55':1.04};
 const visual=l.asset.visual.map(f=>{
  const span=tones[f.fill];if(!span)return f;
  const index=f.points.findIndex((a,i)=>{const z=f.points[(i+1)%f.points.length];return a.x===edge&&z.x===edge&&a.y>3400&&z.y-a.y>200;});
  if(index<0)return f;
  const a=f.points[index],z=f.points[(index+1)%f.points.length],height=z.y-a.y;
  // The neighbouring coloured beds run up towards the east.
  const points=offsets.map(([dx,t])=>({x:edge-dx*span,y:a.y+height*t+dx*span*.23}));
  return {...f,points:[...f.points.slice(0,index+1),...points,...f.points.slice(index+1)]};
 });
 return {...l,asset:{...l.asset,visual}};
}
// The native compact refuge paints its solid in front of the back-landmark pass.
const hamletPaint=new WeakMap(),terrain=G.HonroScene.prototype.terrain;
G.HonroScene.prototype.terrain=function(c,t){
 const out=terrain.call(this,c,t),b=this.battle;
 if(b?.honroStage!==14||!b.honroCanonical||b.honroCustom!==false||b.honroMapOrigin!=='campaign'||
    (t.id!=='v14-upper-hamlet'&&t.id!=='v14-refuge-ground')||t.broken)return out;
 let paint=hamletPaint.get(t);
 if(!paint||paint.source!==t.vertices){
  const outline=new Path2D();
  G.HONRO_CORE.poly(t).forEach((p,i)=>i?outline.lineTo(p.x,p.y):outline.moveTo(p.x,p.y));outline.closePath();
  paint={source:t.vertices,outline,faces:hamletBeds(t.id==='v14-upper-hamlet').map(([color,d])=>[color,new Path2D(d)])};
  hamletPaint.set(t,paint);
 }
 c.save();c.clip(paint.outline);c.globalAlpha*=.62;
 for(const [color,face] of paint.faces){c.fillStyle=color;c.fill(face);}
 c.restore();return out;
};
const finishes={
 3:{'act1-site:3:body':naru},7:{'act1-site:7:body':doldang},
 23:{'stage23:yard-distant-canal':canal,'stage23:yard-gates-record-life':quayFoot},32:{'act4-handoff:32:body-joined':harbour},
 35:{'act4-handoff:35:body':forestBank,'act4-handoff:35:bamboo-thicket-west':mutedThicket},
 37:{'approved37:body':headland},
 53:{'m53-grey-bedrock':buriedVault,'m53-west-buried-foundation':westernFoot},
 54:{'g00-east-spine':spine},58:{'east-body':templeEave,'m58-tile-eaves':roofMortise},
 59:{'painted-coupled-bedrock':deepTail},60:{'painted-coupled-bedrock':deepTail}
};
domain.materialLandmarks=function(b){
 const source=materials(b),rules=finishes[b?.honroStage];
 if(!rules||!b.honroCanonical||b.honroCustom!==false||b.honroMapOrigin!=='campaign')return source;
 const old=cache.get(b);
 if(old?.source===source&&old.version===b.sceneVersion)return old.list;
 const list=source.map(l=>rules[l.asset?.id]?.(l,b)||l);
 cache.set(b,{source,version:b.sceneVersion,list});return list;
};
})(globalThis);
