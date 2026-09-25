import type {Profile} from './types';
import {rng} from './math';
import {MAP_NODES,isOpen} from './progression';
import {ATLAS_WIDTH as W,ATLAS_HEIGHT as H,ATLAS_REGIONS,HUBS} from './atlasLayout';
/** Layered cartographic artwork. Every route and landmark follows the authored geography. */
export function worldMapSVG(profile:Profile){
 const R=rng(16723);let s=`<svg viewBox="0 0 ${W} ${H}" class="world-art" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs>
 <linearGradient id="atlas-sea" x2=".6" y2="1"><stop stop-color="#13232d"/><stop offset="1" stop-color="#0b1a23"/></linearGradient>
 <linearGradient id="atlas-land" x2=".8" y2="1"><stop stop-color="#596064"/><stop offset=".4" stop-color="#444e4b"/><stop offset="1" stop-color="#343e37"/></linearGradient>
 <radialGradient id="atlas-lowland"><stop stop-color="#6a7057" stop-opacity=".52"/><stop offset="1" stop-color="#48504a" stop-opacity="0"/></radialGradient>
 <radialGradient id="atlas-ash"><stop stop-color="#5c4643"/><stop offset="1" stop-color="#3e4240" stop-opacity="0"/></radialGradient>
 <linearGradient id="atlas-river"><stop stop-color="#81a0aa"/><stop offset="1" stop-color="#477283"/></linearGradient>
 <pattern id="atlas-grain" width="31" height="27" patternUnits="userSpaceOnUse"><path d="M3 5h1m14 16h2m8-9h1" stroke="#d9d1b7" stroke-opacity=".11" stroke-width="1.3"/></pattern>
 <pattern id="atlas-sealines" width="120" height="82" patternUnits="userSpaceOnUse"><path d="M12 25q20-8 42 0m32 36q16-6 31-1" fill="none" stroke="#8caaac" stroke-opacity=".06" stroke-width="1.5"/></pattern>
 <path id="atlas-coast" d="M120 1760Q160 1430 520 1320L830 1060Q950 650 1340 660L1510 360Q1750 80 2070 115L2380 30 2660 75 2810 130Q3090 35 3360 95L3620 40Q3890 120 3980 390L4040 730 4140 1030Q4240 1380 4140 1660L4260 1910Q4320 2190 4220 2460L4310 2680 4110 2890 3740 2930Q3420 3020 3230 2770L3060 2440Q2910 2320 2640 2430L2400 2270Q2180 2370 1990 2280L1790 2460Q1630 2700 1410 2675L1110 2810 880 2740 570 2850 340 2690Q200 2560 250 2310L90 2090Z"/>
 <clipPath id="atlas-landclip"><use href="#atlas-coast"/></clipPath>
 </defs><rect width="${W}" height="${H}" fill="url(#atlas-sea)"/><rect width="${W}" height="${H}" fill="url(#atlas-sealines)"/>
 <use href="#atlas-coast" fill="none" stroke="#6c969c" stroke-width="60" opacity=".07"/><use href="#atlas-coast" fill="none" stroke="#7c9ba0" stroke-width="23" opacity=".1"/><use href="#atlas-coast" fill="url(#atlas-land)" stroke="#9aab9e" stroke-width="3"/>
 <g clip-path="url(#atlas-landclip)"><ellipse cx="1020" cy="2100" rx="1030" ry="850" fill="url(#atlas-lowland)"/><ellipse cx="3620" cy="2430" rx="800" ry="650" fill="url(#atlas-ash)"/>
 <path d="M1240 1270Q1670 1550 2010 1060T3140 340L3130 120 2300 130 1470 520Z" fill="#9ca7a0" opacity=".09"/>
 <path d="M2720 2180Q2900 1900 2770 1650L3280 1360 3330 2110 3220 2360Z" fill="#7b9ba1" opacity=".09"/>`;
 // Low-contrast contour bands establish relief without competing with route markers.
 for(let j=0;j<11;j++){const d=j*29;s+=`<path d="M${1170-d} ${1480+d}Q${1660-d} ${1130+d} ${1600+d} ${820-d}T${2180+d} ${600-d}Q${2780+d} ${960-d} ${3160+d} ${500-d}" fill="none" stroke="#b0b4a4" stroke-opacity=".07" stroke-width="2"/>`;}
 // Continuous watershed: highland spring -> waterfall valley -> trading river -> drowned delta.
 const river='M1830 850Q1740 1080 1700 1310T1745 1585Q1630 1850 1390 2070T1045 2365Q820 2560 590 2730';
 const delta='M1745 1585Q2140 1665 2510 1735Q2740 1540 2930 1630T3195 1800Q3380 2070 3100 2350';
 for(const d of [river,delta])s+=`<path d="${d}" fill="none" stroke="#152b34" stroke-width="48" opacity=".55"/><path d="${d}" fill="none" stroke="url(#atlas-river)" stroke-width="24" opacity=".9"/><path d="${d}" fill="none" stroke="#bdc9b6" stroke-width="2" opacity=".33"/>`;
 s+=`<path d="M2740 1550Q2650 1720 2690 1950M2870 1660Q3060 1830 2975 2070" stroke="#688c97" stroke-width="13" fill="none"/>
 <path d="M1678 1370l-10 70m22-85-8 90m23-82-7 88" stroke="#d4e0d4" stroke-width="5" opacity=".56"/>
 <path d="M3620 2280Q3850 2180 3995 2440T4050 2830M3590 2350Q3700 2630 3510 2810" fill="none" stroke="#251e24" stroke-width="27"/><path d="M3620 2280Q3850 2180 3995 2440T4050 2830M3590 2350Q3700 2630 3510 2810" fill="none" stroke="#a06851" stroke-width="9" opacity=".65"/>`;
 const mountain=(x:number,y:number,h:number,snow=false)=>{
  const w=h*.74;s+=`<path d="M${x-w} ${y+17}L${x-7} ${y-h} ${x+w} ${y+15} ${x+30} ${y+28} ${x-w} ${y+17}" fill="#303b3b" stroke="#929b89" stroke-opacity=".28" stroke-width="2"/>
  <path d="M${x-7} ${y-h}L${x+11} ${y-h*.50} ${x-12} ${y-h*.23} ${x+30} ${y+28} ${x+w} ${y+15}Z" fill="#798174" opacity=".29"/>
  <path d="M${x-7} ${y-h}l-25 ${h*.36} 23-13 20 10Z" fill="${snow?'#c4c7b6':'#999e86'}" opacity="${snow?.68:.3}"/>
  <path d="M${x-18} ${y-h*.45}l-24 35m10-11-23 34m${w+4}-17 21 21" stroke="#adad94" stroke-opacity=".14" stroke-width="2"/>`;
 };
 const excluded=(x:number,y:number,rad=75)=>MAP_NODES.some(n=>Math.hypot(n.x-x,n.y-y)<rad)||HUBS.some(n=>Math.hypot(n.x-x,n.y-y)<rad);
 // Mountain chains are attached to the watershed and the citadel ridge, not scattered triangles.
 for(let i=0;i<36;i++){const x=1300+i*46+R()*45,y=1220-i*21+Math.sin(i*.75)*125;if(!excluded(x,y,105))mountain(x,y,95+R()*135,i>13);}
 for(let i=0;i<24;i++){const x=3960+Math.sin(i*.71)*90,y=700+i*66;if(!excluded(x,y,110))mountain(x,y,100+R()*105,false);}
 for(let i=0;i<26;i++){const x=2120+R()*920,y=360+R()*540;if(!excluded(x,y,110))mountain(x,y,50+R()*90,true);}
 for(let i=0;i<15;i++){const x=3270+R()*790,y=2160+R()*600;if(!excluded(x,y,90))mountain(x,y,45+R()*90);}
 // Etched forests: staggered crowns, trunks and cast shadows.
 for(let i=0;i<255;i++){const x=380+R()*1150,y=1490+R()*1050;if(excluded(x,y,115))continue;const h=17+R()*33;s+=`<path d="M${x+7} ${y+6}l${h*.6} 10-21 6-13-8Z" fill="#14282b" opacity=".19"/><path d="M${x} ${y-h}l${-h*.42} ${h*.7}h7l-12 ${h*.42}h${h*.85}l-11-${h*.42}h6Z" fill="#2e443c" stroke="#a9b092" stroke-opacity=".17" stroke-width="1.4"/><path d="M${x} ${y}v9" stroke="#a7a285" stroke-opacity=".30"/>`;}
 // City fabric occupies the floodplain. Buildings are not the selectable nodes.
 for(let i=0;i<112;i++){const x=2520+R()*780,y=1490+R()*550;if(excluded(x,y,70))continue;const w=18+R()*24,h=16+R()*32;
 s+=`<path d="M${x} ${y}h${w}v${h}h-${w}Z" fill="#576b6d" stroke="#a3b1a2" stroke-opacity=".3"/><path d="M${x-3} ${y}l${w/2+3}-${h*.4} ${w/2+3} ${h*.4}Z" fill="#839087" opacity=".6"/><path d="M${x+w*.25} ${y+7}v${h*.5}m${w*.5}-${h*.5}v${h*.5}" stroke="#283f48" stroke-width="4"/>`;}
 // Citadel ramparts enclose a real center, with a drainage branch on the eastern side.
 s+=`<path d="M3110 600L3360 300 3720 330 3890 660 3810 1010 3560 1250 3210 1120Z" fill="#313e43" fill-opacity=".6" stroke="#1c2d34" stroke-width="24"/><path d="M3110 600L3360 300 3720 330 3890 660 3810 1010 3560 1250 3210 1120Z" fill="none" stroke="#a4a995" stroke-width="10" stroke-dasharray="24 7" opacity=".64"/>
 <path d="M3880 1150Q3890 850 3720 610" fill="none" stroke="#7a9ba3" stroke-width="11" opacity=".7"/>
 <rect width="${W}" height="${H}" fill="url(#atlas-grain)"/></g>`;
 // Routes follow mountain saddles, river bridges and the eastern pass.
 for(const n of MAP_NODES)for(const id of n.links){const to=MAP_NODES[id-1],dx=to.x-n.x,dy=to.y-n.y;let d=`M${n.x} ${n.y}C${n.x+dx*.35} ${n.y+dy*.13} ${to.x-dx*.24} ${to.y-dy*.20} ${to.x} ${to.y}`;
  if(n.id===24)d=`M3980 2530Q4140 2180 4140 1930T4090 1480Q4030 1210 3530 1120`;
  if(n.id===12)d='M2215 1180Q2370 1230 2380 1500T2510 1700';
  if(n.id===30)d='M3490 400Q3260 260 3180 370T3000 570';
  const done=!!profile.cleared[String(n.id)];s+=`<path d="${d}" fill="none" stroke="#192b2e" stroke-width="12" opacity=".65"/><path d="${d}" fill="none" stroke="${done?'#e7c89c':'#a39d86'}" stroke-width="${done?4:2.5}" stroke-dasharray="${done?'0':'9 10'}" opacity="${done?.94:.50}"/>`;
 }
 for(const d of ['M495 2240Q630 2150 790 2160','M495 2240Q370 2080 460 1910','M495 2240Q710 2320 810 2580'])s+=`<path d="${d}" fill="none" stroke="#d6bb8c" stroke-width="3" stroke-dasharray="5 10" opacity=".8"/>`;
 const keep=(x:number,y:number,size=1)=>{s+=`<g transform="translate(${x} ${y}) scale(${size})" stroke="#bbbda7" stroke-opacity=".65" stroke-width="2"><path d="M-67 26V-32h22v-42h25v-26h40v26h25v42h22v58Z" fill="#313f46"/><path d="M-72-33l16-18 17 18M-21-100l21-27 21 27M40-33l17-18 16 18" fill="#879184"/><path d="M-11 25v-30q11-20 22 0v30" fill="#192c35"/><path d="M-52-25v15m25-44v17m53-17v17m29 12v15M-6-81v18m15-18v18" stroke="#d3c496" stroke-width="5"/><path d="M-70 27h140" stroke="#242e34" stroke-width="9"/></g>`;};
 for(const id of [1,2,6,9,12,25,26,27,28,30]){const p=MAP_NODES[id-1];keep(p.x,p.y-18,[6,12,30].includes(id)?1.0:.55);}
 // The final tower is a distinctive vertical landmark, surrounded by broken satellite rings.
 s+=`<g transform="translate(2240 428)"><ellipse rx="144" ry="48" fill="none" stroke="#a9a7bc" stroke-width="2" stroke-dasharray="35 22" opacity=".6"/><path d="M-45 35-30-65-18-140 0-216 18-140 30-65 45 35Z" fill="#263440" stroke="#bec1c2" stroke-width="2.5"/><path d="M0-213 0 35 45 35 23-101Z" fill="#98a1a9" opacity=".2"/><path d="M-23-104h46M-33-36h66M0-160v130" stroke="#decfa6" stroke-width="3"/><circle cy="-117" r="24" fill="none" stroke="#cfb790" stroke-width="2"/><path d="M-12-116 0-134 12-116 0-99Z" fill="#e0cba1" opacity=".9"/></g>`;
 // Unique service landmarks: encampment, range and stone arena.
 s+=`<g transform="translate(495 2204)" stroke="#cfbb94" stroke-width="2"><path d="M-105 29-73-29-35 29ZM-25 28 20-56 67 28ZM51 35 90-11 126 35Z" fill="#6c6653"/><path d="M20-55 20 28 67 28" fill="#3e4d46"/><path d="M12 28v-20q8-16 16 0v20" fill="#253534"/><path d="M-30 58q35-22 77-4" fill="none"/><path d="M90-20v-67l46 9-46 14" fill="#b98965"/></g>
 <g transform="translate(460 1878)" fill="none" stroke="#bec5aa" stroke-width="3"><ellipse rx="44" ry="32" fill="#3b5553"/><ellipse rx="29" ry="22"/><ellipse rx="12" ry="9"/><path d="M-32 22-43 62M32 22l12 40M-86 13-9 0m-60-6-17 19 24 10"/><path d="M-70 69h146" stroke="#2b3d3f" stroke-width="10"/></g>
 <g transform="translate(810 2540)"><ellipse rx="104" ry="63" fill="#26363d" stroke="#a9a28f" stroke-width="17"/><ellipse rx="72" ry="38" fill="#606251" stroke="#bbc0ab" stroke-width="2"/>${Array.from({length:12},(_,i)=>{const a=i*Math.PI/6,x=Math.cos(a)*104,y=Math.sin(a)*63;return `<path d="M${x} ${y-16}v32" stroke="#c2b69a" stroke-width="5"/>`;}).join('')}</g>`;
 const label=(x:number,y:number,text:string,size=25)=>`<text x="${x}" y="${y}" text-anchor="middle" fill="#b4b9a7" opacity=".65" font-family="Georgia,serif" font-style="italic" font-size="${size}" letter-spacing="3">${text}</text>`;
 s+=label(785,2810,'서쪽 바다',27)+label(1230,2210,'에른 강',25)+label(1860,900,'K A L D E R',32)+label(3970,1570,'흑철 고개',25)+label(2890,2230,'침수 해안',25)+label(3860,2910,'불타는 지맥',22);
 s+=`<g transform="translate(320 490)" stroke="#aaae9f" opacity=".62"><circle r="89" fill="none" stroke-width="1.4"/><circle r="74" fill="none" stroke-width="1"/><path d="M0-116 13-14 116 0 13 14 0 116-13 14-116 0-13-14Z" fill="#ddd0ad" fill-opacity=".16" stroke-width="1.2"/><path d="M0-116V116M-116 0H116" stroke-width="1"/><text y="-137" text-anchor="middle" font-family="Georgia,serif" font-size="30" fill="#d4caad" stroke="none">N</text></g>
 <g transform="translate(220 700)"><text fill="#c5c6ae" font-family="Georgia,serif" font-size="38" letter-spacing="8">THE VEILED MARCHES</text><path d="M0 25h540" stroke="#a9ad9b" opacity=".4"/><text y="62" fill="#95a49e" font-family="system-ui,sans-serif" font-size="23" letter-spacing="4">장막 변경 원정도</text></g>
 </svg>`;
 return s;
}
