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
 const right=p('#213d40',`M1774 668C1853 668 1949 677 2021 688L2105 687 2147 669 2097 710 2071 771 2040 827 2049 917 2008 969 1983 1044 1916 1092 1935 997 1960 916 1954 830 2008 747 2021 721 1925 730 1844 714 1774 716Z`);
 const strata=[
 p('#1b3538','M150 956C260 924 389 929 502 913L741 934 624 960 503 967 407 1017 327 1084 293 1063 349 996 247 1005Z'),
 p('#1c3639','M1016 1081L1172 1010 1334 986 1450 946 1663 936 1583 969 1413 1009 1300 1018 1227 1071 1091 1100Z'),
 p('#193235','M538 1245L698 1207 836 1239 925 1229 1000 1188 1114 1199 1007 1233 950 1279 816 1284 694 1254 599 1270Z'),
 p('#10282b','M-445 826L-408 891-393 1015-347 1094-329 1186-382 1125-425 1013-438 919Z'),
 p('#10282b','M2200 882L2180 960 2213 1051 2218 1164 2259 1230 2248 1116 2233 1045 2218 964Z')
 ];
 // Blend only inside the original opaque material overlap. The E band
 // silhouette/control points stay exact beyond the original source edge.
 const joinGradient=color=>({type:'linear',x1:1740,y1:0,x2:1774,y2:0,stops:[{offset:0,color,opacity:0},{offset:1,color,opacity:1}]});
 result.gradients={...result.gradients,naruJoinRim:joinGradient('#51533a'),naruJoinGrass:joinGradient('#70884a'),naruJoinRock:joinGradient('#213d40')};
 const rightRim=p('url(#naruJoinRim)',`M1740 631H1770C1792 631 1806 637 1834 638H${R}V646L2101 647 2055 645 1989 648 1903 645 1830 647C1808 647 1793 645 1770 647H1740Z`);
 const rightGrass=p('url(#naruJoinGrass)',`M1740 634H1770C1790 634 1808 640 1834 641L1903 640 1989 642 2055 640 2101 642 ${R} 641V644L2101 645 2055 643 1989 645 1903 643 1834 644C1808 644 1790 641 1770 641H1740Z`);
 // Closed narrow fill ribbons keep the timber finish explicit in material geometry.
 const woodGrain={tag:'g',children:[
 p('#3d493b','M550 588C552 608 548 629 552 650L550 680 551 680 553 650C549 629 553 608 551 588Z M562 615C559 635 564 647 561 668L562 668C565 647 560 635 563 615Z'),
 p('#3d493b','M696 589C698 611 692 630 695 651C697 670 694 692 696 718L697 718C695 692 698 670 696 651C693 630 699 611 697 589Z M707 620C706 638 711 645 708 661L709 661C712 645 707 638 708 620Z'),
 p('#3d493b','M491 565C494 586 488 602 491 624L492 624C489 602 495 586 492 565Z M499 610L498 643 499 643 500 610Z M908 603C911 621 908 640 912 657L913 657C909 640 912 621 909 603Z M918 636L916 671 917 671 919 636Z M1077 603C1075 616 1081 634 1077 648L1078 648C1082 634 1076 616 1078 603Z')
 ]};
 // The original raster's entire rows882..886 are exactly #142c2f;
 // side tails are equally solid below y723(left)/708(right). Cap only
 // synthetic AA closures in that nonwalkable solid-color area, after source.
 const seamBase=p('#142c2f','M-1 885H1775V889H-1Z M-1 723H2V887H-1Z M1772 708H1776V887H1772Z M1772 495H1776V631H1772Z M1772 647H1776V668H1772Z');
 const join={tag:'g',children:[seamBase,rightRim,rightGrass]};
 const rockJoin=p('url(#naruJoinRock)','M1740 668H1777V716H1740Z');
 // West: the walked floor (x<0 at y684) keeps the source's grass rim and
 // its dark under-rim instead of ending them at the source's x=0 cut. The
 // ribbons fade into the source over x0..30 and thin out before the floor end.
 result.gradients.naruWestGrass={type:'linear',x1:0,y1:0,x2:30,y2:0,stops:[{offset:0,color:'#738653',opacity:1},{offset:1,color:'#738653',opacity:0}]};
 result.gradients.naruWestRim={type:'linear',x1:0,y1:0,x2:30,y2:0,stops:[{offset:0,color:'#454e3d',opacity:1},{offset:1,color:'#454e3d',opacity:0}]};
 const westGrass=p('url(#naruWestGrass)',`M30 684H${L+14}C${L+8} 684 ${L+7} 687 ${L+16} 687.5L-300 688.5-250 691-190 689.5-130 692-70 690.5-20 692 0 691.8 30 692Z`);
 const westRim=p('url(#naruWestRim)',`M30 691.5L0 691.3-20 691.5-70 690-130 691.5-190 689-250 690.5-300 688${L+16} 687.5C${L+22} 689 ${L+30} 691-300 691.5L-250 694-190 692.5-130 695-70 693.5-20 694.8 0 694.5 30 694.5Z`);
 const westBand=p('#253c3e','M1 713.5L-30 714.2-80 714.6-24 717.2 1 721Z');
 // Cap the source's x=0 antialiased closure inside its own solid under-rim band.
 const westSeam=p('#253c3e','M-1.5 694.6H5V720.5H-1.5Z');
 const original=result.root.children.find(n=>n.tag==='use'&&n.symbol==='source');
 if(!original)throw Error('Expected untouched source use');
 result.root={tag:'g',children:[base,left,westBand,right,...strata,original,join,rockJoin,westSeam,westRim,westGrass,woodGrain]};
 for(const key of Object.keys(result.clips))if(key.startsWith('site-edge-'))delete result.clips[key];
 result.viewBox=[-1200,0,4174,4887];
 return result;
}

// Apply after the canonical path optimizer has validated and optimized the
// original collage. Do not weaken or skip its original SHA guard.
export function applyNaruBodyFinish(project){
 const art=project.library.find(a=>a.id==='act1-site:3:body');
 if(!art)throw Error('Missing canonical Naru BODY');
 if(art.params?.derivedPaintRevision)throw Error('Naru finish applied twice');
 art.vector=finishNaruBody(art.vector);
 const [x,y,w,h]=art.vector.viewBox;art.bounds={x,y,w,h};
 art.reference={...art.reference,bounds:{x,y,w,h},heightM:h/60};
 Object.assign(art.params,{paintBeyondTerrainDomain:true,omitTerrainClosureIds:['ferry-ground'],derivedPaintRevision:'naru-exterior-v1'});
 return project;
}
