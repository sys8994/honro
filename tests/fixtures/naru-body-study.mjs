// Isolated visual study. Not registered by the production map author.
// Original source paths, collision data, positions and source clips are unchanged.
export function naruBodyStudy(core,{palette=false,exterior=false}={}){
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
 const lower=p('#1b3538','M-240 1206L-118 1270 89 1304 331 1276 483 1301 696 1258 849 1202 1012 1167 1188 1140 1429 1048 1550 1052 1454 1104 1243 1161 1069 1218 948 1230 790 1302 621 1336 408 1364 186 1351-42 1350-191 1293Z');
 const join=p('#142c2f','M0 885H1774V889H0Z M0 510H2V887H0Z M1772 470H1774V887H1772Z');
 const original=result.root.children.find(n=>n.tag==='use'&&n.symbol==='source');
 if(!original)throw Error('Expected untouched source use');
 result.root={tag:'g',children:[base,left,right,lower,join,original]};
 for(const key of Object.keys(result.clips))if(key.startsWith('site-edge-'))delete result.clips[key];
 result.viewBox=[-1200,0,4174,4887];
 return result;
}
