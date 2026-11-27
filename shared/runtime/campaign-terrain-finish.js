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
const finishes={
 7:{'act1-site:7:body':doldang},32:{'act4-handoff:32:body-joined':harbour},54:{'g00-east-spine':spine}
};
domain.materialLandmarks=function(b){
 const source=materials(b),rules=finishes[b?.honroStage];
 if(!rules||!b.honroCanonical||b.honroCustom!==false||b.honroMapOrigin!=='campaign')return source;
 const old=cache.get(b);
 if(old?.source===source&&old.version===b.sceneVersion)return old.list;
 const list=source.map(l=>rules[l.asset?.id]?.(l)||l);
 cache.set(b,{source,version:b.sceneVersion,list});return list;
};
})(globalThis);
