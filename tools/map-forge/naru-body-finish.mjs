// Stage3 source-preserving exterior and material finish.
// Original source paths, collision data, positions and source clips are unchanged.
export function finishNaruBody(core,{palette=true,exterior=true}={}){
 const result=structuredClone(core);
 if(palette){
  const colors={'#a8aaa7':'#5e6958','#8a9460':'#687452','#8a7356':'#5e6958'};
  const visit=n=>{if(colors[n.fill])n.fill=colors[n.fill];for(const c of n.children||[])visit(c);};
  visit(result.symbols.source);
 }
 if(!exterior)return result;
 const p=(fill,d)=>({tag:'path',fill,d});
 // Top contact elevations and horizontal floor ends are the unchanged authored
 // ferry-ground extensions: -1200/3.23..0 at684;1774..1774+1200/3.23 at638.
 // Beyond those ends descend, without olive caps suggesting a false walkway.
 const L=-1200/3.23,R=1774+1200/3.23;
 const base=p('#142c2f',`M0 510 C-10 558-24 618-44 665L-44 684H${L}L${L} 704C-398 745-451 762-465 823L-480 922-518 978-564 1100-621 1176-650 1310-733 1432-765 1627-900 1812-1200 2080V4887H2974V2030L2735 1834 2589 1677 2498 1474 2420 1387 2370 1239 2291 1131 2255 969 2212 874 2186 734 ${R} 667V638H1813C1805 594 1782 541 1774 470V887H0Z`);
 const left=p('#213d40',`M0 692L${L} 692L-364 714-320 747-261 773-242 842-207 889-210 953-160 1028-86 1057-42 1145 22 1183 0 1086-56 1023-49 939-100 871-119 812-182 781-202 742-102 717 0 714Z`);
 const right=p('#213d40',`M1774 646H${R}L2147 669 2097 710 2071 771 2040 827 2049 917 2008 969 1983 1044 1916 1092 1935 997 1960 916 1954 830 2008 747 2021 703 1774 668Z`);
 const strata=[
 p('#1b3538','M150 956C260 924 389 929 502 913L741 934 624 960 503 967 407 1017 327 1084 293 1063 349 996 247 1005Z'),
 p('#1c3639','M1016 1081L1172 1010 1334 986 1450 946 1663 936 1583 969 1413 1009 1300 1018 1227 1071 1091 1100Z'),
 p('#193235','M538 1245L698 1207 836 1239 925 1229 1000 1188 1114 1199 1007 1233 950 1279 816 1284 694 1254 599 1270Z'),
 p('#10282b','M-445 826L-408 891-393 1015-347 1094-329 1186-382 1125-425 1013-438 919Z'),
 p('#10282b','M2200 882L2180 960 2213 1051 2218 1164 2259 1230 2248 1116 2233 1045 2218 964Z')
 ];
 const rightRim=p('#51533a',`M1772 638H${R}V646L2101 647 2055 645 1989 648 1903 645 1830 647 1772 645Z`);
 const woodGrain={tag:'g',children:[
 {tag:'path',fill:'none',stroke:'#3d493b',lineWidth:1.25,lineCap:'round',d:'M696 589C698 611 692 630 695 651C697 670 694 692 696 718 M707 620C706 638 711 645 708 661 M701 677C700 681 701 687 704 688C708 685 707 679 704 677Z'},
 {tag:'path',fill:'none',stroke:'#3d493b',lineWidth:1.1,lineCap:'round',d:'M491 565C494 586 488 602 491 624 M499 610L498 643 M908 603C911 621 908 640 912 657 M918 636L916 671 M1077 603C1075 616 1081 634 1077 648'}
 ]};
 // The original raster's entire rows882..886 are exactly #142c2f;
 // side tails are equally solid below y723(left)/708(right). Cap only
 // synthetic AA closures in that nonwalkable solid-color area, after source.
 const join=p('#142c2f','M-1 885H1775V889H-1Z M-1 723H2V887H-1Z M1772 708H1776V887H1772Z M1772 495H1776V631H1772Z M1772 648H1776V667H1772Z');
 const original=result.root.children.find(n=>n.tag==='use'&&n.symbol==='source');
 if(!original)throw Error('Expected untouched source use');
 result.root={tag:'g',children:[base,left,right,...strata,rightRim,original,join,woodGrain]};
 for(const key of Object.keys(result.clips))if(key.startsWith('site-edge-'))delete result.clips[key];
 result.viewBox=[-1200,0,4174,4887];
 return result;
}
