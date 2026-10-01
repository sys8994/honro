import {SKILLS} from './data';
const P: Record<string, string> = {
    flame: 'M14 3c3 6-4 7-1 11 1-4 4-3 5-7 7 8 7 17-2 19-9 2-15-5-11-12 0 5 5 4 4 0-1-5 5-7 5-11Z',
    arrow: 'M5 27 26 6M17 6h9v9M5 18v9h9',
    sword: 'M8 22 23 4l5-1-1 5-18 16M4 18l10 10M3 29l5-6',
    meteor: 'M4 18 18 4M11 19 27 3M19 23 29 10M5 20a7 7 0 1 0 10 10 7 7 0 0 0-10-10Z',
    bounce: 'M3 25 11 9l10 13L29 6M5 29h12M21 3h9v10',
    snow: 'M16 2v28M4 9l24 14M4 23 28 9M12 5l4 4 4-4M12 27l4-4 4 4M4 14l6-1-1-6M23 25l-1-6 6-1',
    bolt: 'm18 2-13 17h10l-2 12 14-19H17Z',
    burst: 'M16 3v5M4 8l5 4M28 8l-5 4M3 22l6-3M29 22l-6-3M16 27v4M16 10l2 5 5 1-5 2-2 5-2-5-5-2 5-1Z',
    rune: 'M16 3 29 16 16 29 3 16ZM16 9l7 7-7 7-7-7ZM16 1v6M31 16h-6M16 25v6M1 16h6',
    vortex: 'M26 11c-5-12-23-7-22 5 0 12 18 16 24 5M22 14c-3-8-14-5-14 2 0 7 10 10 14 5M19 15c-2-3-6-1-5 2s5 3 6 0',
    wall: 'M4 29V12h24v17M3 12l5-7 4 7 4-9 5 9 5-7 3 7M4 21h24M12 12v9M22 12v9M17 21v8',
    trail: 'M2 24c7-10 12 9 18-1s12-8 10-14M10 18l3-8 3 9M21 15l3-12 4 9',
    crack: 'M5 4h22v24H5ZM18 4l-5 9 7 3-8 12M4 13h8M21 19h7',
    resonance: 'M16 11a5 5 0 1 0 0 10 5 5 0 0 0 0-10ZM8 7a13 13 0 0 0 0 18M24 7a13 13 0 0 1 0 18M4 3a19 19 0 0 0 0 26M28 3a19 19 0 0 1 0 26',
    pierce: 'M2 29 28 3M19 3h9v9M9 4l4 4M22 19l7 7M3 15l6 6M12 24l5 5',
    triple: 'M3 22 21 4M14 4h7v7M9 28 27 10M20 10h7v7M2 14 12 4M6 4h6v6',
    push: 'M2 16h20M15 9l7 7-7 7M27 3v26M3 7l5 3M3 25l5-3',
    bind: 'M7 8a5 5 0 0 1 9 3l-3 5a5 5 0 0 1-9-3ZM19 16a5 5 0 0 1 9 3l-3 5a5 5 0 0 1-9-3ZM11 18l9-5',
    timer: 'M12 3h8M16 3v4M16 8a10 10 0 1 0 0 20 10 10 0 0 0 0-20ZM16 12v7l5 3M26 7l3 3',
    pull: 'M29 16H7M14 9l-7 7 7 7M3 3v26M28 7l-5 3M28 25l-5-3',
    target: 'M16 7a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM16 1v10M16 21v10M1 16h10M21 16h10',
    rain: 'M5 3v25M1 23l4 5 4-5M16 7v21M12 23l4 5 4-5M27 3v25M23 23l4 5 4-5',
    return: 'M4 25c22 8 32-15 14-19H7M13 1 7 6l6 6M4 25l7 1',
    slam: 'M16 2v21M8 15l8 8 8-8M3 28l6-3M29 28l-6-3M16 28v3',
    spin: 'M27 12A12 12 0 0 0 5 8M1 7l4 1 2-5M5 20a12 12 0 0 0 22 4M31 25l-4-1-2 5M10 23l13-14',
    quake: 'M16 3v18M9 14l7 7 7-7M2 26l6-3 5 5 5-4 5 4 7-3',
    shield: 'M16 3 28 8v8c0 7-8 12-12 14C12 28 4 23 4 16V8ZM16 8v17M8 12h16',
    lift: 'M16 29V7M8 15l8-8 8 8M3 4h26',
    hook: 'M6 4h18v13a8 8 0 0 1-16 0v-4l5 5M24 4v4M6 4v4',
    crescent: 'M24 3C8 3 1 14 8 24c5 8 16 7 21 1C14 29 9 13 24 3Z',
    wave: 'M2 23c8-20 10 9 17-5s12-14 11-4M2 29h28',
    recall: 'M24 4a13 13 0 1 0 5 17M24 4h-8M24 4v8M11 23l10-12M16 11h5v5',
    potion: 'M11 3h10M12 3v8L6 22c-2 5 2 8 5 8h10c4 0 7-3 5-8l-6-11V3M8 21h16',
    play: 'M9 4 27 16 9 28Z', pause: 'M9 5v22M23 5v22', close: 'M7 7l18 18M25 7 7 25', chevron: 'M11 5l11 11-11 11', back: 'M21 5 10 16l11 11', map: 'M3 7l8-3 10 3 8-3v23l-8 3-10-3-8 3ZM11 4v23M21 7v23',
    star: 'm16 3 4 9 10 1-8 7 2 10-8-5-8 5 2-10-8-7 10-1Z', lock: 'M8 14v-4a8 8 0 0 1 16 0v4M5 14h22v16H5ZM16 20v5', check: 'M4 16l8 8L28 7', gear: 'M12 3h8l1 5 4 2 5-1 3 7-4 3-1 4 1 5-7 3-3-4h-4l-4 3-6-5 2-5-2-4-4-2 3-7 5 1 4-3ZM16 11a5 5 0 1 0 0 10 5 5 0 0 0 0-10Z',
    wind: 'M2 10h18c7 0 7-9 1-7M2 16h24c7 0 7 9 1 7M2 22h11c6 0 6 9 0 7', book: 'M3 5c5-2 9-1 13 2 4-3 8-4 13-2v22c-5-2-9-1-13 2-4-3-8-4-13-2ZM16 7v22', save: 'M5 3h18l5 5v22H5ZM10 3v10h13V3M10 30V19h13v11', volume: 'M3 12h7l8-7v22l-8-7H3ZM23 10c5 3 5 9 0 12M27 5c9 7 9 15 0 22', home: 'M3 15 16 3l13 12M7 12v17h18V12M13 29V18h6v11', zoom: 'M13 3a10 10 0 1 0 0 20 10 10 0 0 0 0-20ZM21 21l9 9M8 13h10M13 8v10'
};
const MAP_PATHS:Record<string,string>={
 funeral:'M3 23h26M6 23V12h20v11M3 12 8 6h16l5 6M11 7V3m10 4V3M11 15v5m10-5v5M3 27h26',
 hermitage:'M2 13 8 9l8-5 8 5 6 4M5 13h22M7 14v12m18-12v12M3 27h26M12 26V17h8v9M10 10h12',
 fortress:'M3 28V12h5V6h5v6h6V6h5v6h5v16M13 28V20q3-7 6 0v8M4 16h7m11 0h6',
 ferry:'M3 23h26l-6 5H9ZM15 22V3M15 5 25 17H15M3 30q4-4 8 0t8 0t8 0',
 gorge:'M2 7 9 24l7 5 7-5 7-17M2 7h6l5 13m17-13h-6l-5 13M9 9q9-9 16 0m-4-4 4 4-1-6',
 bridge:'M2 13q14 13 28 0M2 9v19m28-19v19M5 15v6m5-3v6m6-4v6m6-8v6m5-9v6M2 21q14 13 28 0',
 godtree:'M15 30V7m0 12L6 10 4 3m11 12 8-6 2-7M15 25l-6-7-6 1m12 5 9-7 6 1M10 30l5-5 7 5',
 guardian:'M7 7 16 3l9 4v15l-9 8-9-8ZM10 12l4 2m8-2-4 2M13 20h6m-3-6v4M2 4l4 7m24-7-4 7',
 brazier:'M4 18h24l-5 8H9ZM10 26l-3 5m15-5 3 5M12 16q-6-6 2-12 0 6 4 7-1-8 4-10 8 13 0 16',
 range:'M16 4a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10ZM8 23 5 30m19-7 3 7M16 14 29 1m-5 0h5v5'
};
// Player redesign icons are native SVG: ceramic gourds, measured brush geometry and wood stakes.
const GOURD='M12 2h8v4q4 2 3 6l-3 3q10 5 6 12-3 5-10 4-7 1-10-4-4-7 6-12l-3-3q-1-4 3-6ZM10 14l12 1m-6 0v12m0-9 4 1-1 6';
const STAKE='M12 2h8v24l-4 5-4-5ZM13 7h6m-5 4 4 2-4 3m-4 13H4m18 0h6';
const REDESIGN_PATHS:Record<string,string>={
 // Sword: a single edge, a broad cut, a turn, repeated cuts, a parry and a broken heart.
 S00:P.sword,
 S03:'M4 24Q11 3 29 7 18 10 4 24ZM9 26q12-2 19-12M4 29h6',
 S05:'M6 10A11 11 0 0 1 26 10M21 9l5 1 1-6M26 22A11 11 0 0 1 6 22M11 23l-5-1-1 6M12 18l8-5',
 S07:'M4 21Q8 8 17 3L9 20M11 25Q16 11 24 7L17 24M19 29Q24 18 29 14L24 28',
 S08:'M16 3 27 7v9q-1 8-11 13Q6 24 5 16V7ZM24 11H12m4-4-4 4 4 4M12 21l4 3 5-5',
 S02:'M16 8C5-5-4 13 16 29 36 13 27-5 16 8ZM17 8l-4 8 7 2-5 9',
 // Rush: leaping foot, gust, plunging mountain, breakthrough and a second footfall.
 S01:'M7 18 11 7l6 3-2 8 10 4v5H8l-4-5ZM18 5q10 2 10 11m-4-3 4 3 2-5M2 29h10',
 S06:'M3 9h17q8 0 6-6M2 16h25q6 0 2 7M4 23h11q7 0 4 6M9 5l4-2M8 28l-4 2',
 S04:'M16 2v16m-5-5 5 5 5-5M3 27l7-12 5 8 6-7 8 11M16 23l-3 4 5 2-2 2',
 S15:'M3 8l11 8L3 24m8-18 13 10-13 10M27 3l-3 7 6 6-6 6 3 7',
 S13:'M5 3h5v10l7 3v5H4V10ZM21 13h5v9l4 3v4H18v-8M13 6q9-3 12 3m-4-1 4 1 1-4',
 // Blade: crescent, inward current, piercing pressure, shielded fan and orbit.
 S09:'M8 3Q32 16 8 29 20 16 8 3ZM3 10l5 2m-6 7 5-1',
 S10:'M24 3Q12 7 13 16t11 13M29 8q-5 8 0 16M19 16H3m5-5-5 5 5 5',
 S11:'M2 16h28m-8-6 8 6-8 6M9 5v7m0 8v7M18 3v9m0 8v9M3 9h2m-2 14h2',
 S14:'M6 4Q30 16 6 28M10 6Q32 16 10 26M3 16h12m-5-5 5 5-5 5M24 4l-3 5m6 18-5-5',
 S12:'M3 15c1-12 20-17 25-5s-13 22-22 14M19 3q7 3 3 8M29 18q-1 9-9 8M9 29q-8-3-6-10M12 13q8-6 9 2t-9 4Z',
 SP01:'M4 25 16 4l12 21ZM16 4v14M4 25l12-7 12 7',SP02:P.shield,
 SP03:'M4 22q4-16 24-19-1 20-19 23M7 24 23 9m-11 6 6 1m-2-6 1 6M3 29h7',
 SP04:'M6 12a5 5 0 1 0 0 10 5 5 0 0 0 0-10ZM25 12a5 5 0 1 0 0 10 5 5 0 0 0 0-10ZM16 2a5 5 0 1 0 0 10 5 5 0 0 0 0-10ZM9 12l4-3m6 0 4 3M11 19h9',
 SP05:'M16 3 28 8v9q-2 8-12 13Q6 25 4 17V8ZM9 17l5 5 9-12M16 3v5',
 M01:'M6 4q17 12 0 24M3 9q10 7 0 14',M06:GOURD,M02:GOURD+'M3 4v7m-3-3h6',M04:GOURD+'M27 2l-3 5h5l-3 5',M13:GOURD+'M2 19v3m27-5v3m-2 8h4',M05:GOURD+'M3 2v12m-3-4 3 4 3-4',
 M03:'M5 3q23 13 0 26M8 6q17 10 0 20',M11:'M2 27 10 7l12 18 8-20M4 3h24M4 29h24',M12:'M3 26 12 3l17 23ZM12 3v23',M14:'M16 3a13 13 0 1 0 0 26 13 13 0 0 0 0-26Zm0 8a5 5 0 1 0 0 10 5 5 0 0 0 0-10Z',M15:'M16 2v28M2 16h28M6 6l20 20M6 26 26 6M10 3h12l7 7v12l-7 7H10l-7-7V10Z',
 M07:STAKE,M10:STAKE+'M2 16h7m-3-3v6',M08:STAKE+'M2 14h7m-3-3 3 3-3 3m24-3h-7m3-3-3 3 3 3',M09:STAKE+'M2 20V7h6m16 0h6v13M2 20l3-3m25 3-3-3',M99:STAKE+'M2 7v18m28-18v18M2 25l14 6 14-6',
 MP01:'M4 25q12-9 0-18m8 21q13-12 0-24m8 24q13-12 0-24',MP02:GOURD,MP03:'M26 7a12 12 0 1 0 2 16M26 7h-8m8 0v8',MP04:'M2 16q14-18 28 0-14 18-28 0ZM16 11a5 5 0 1 0 0 10 5 5 0 0 0 0-10Z',MP05:STAKE,
 A01:P.arrow,A14:P.target,A02:P.pierce,A06:P.return,A10:'M4 6q18 10 0 20M5 6v20M5 16h24m-6-5 6 5-6 5',A99:P.pierce+'M2 8h8m-4-4v8',A11:P.rain,A09:P.bounce,A13:P.target+'M3 29 12 20',A12:P.return,A15:P.rain,A05:P.push,A04:P.triple,A07:P.crack,A03:P.arrow+'M3 7h6m-6 6h4',A08:P.triple+'M3 3l7 7m14 14 5 5'
};
function skillPath(id:string){const sk=SKILLS[id];if(!sk)return {path:P.rune,extra:''};const i=Number(id.match(/(\d+)$/)?.[1])||1;let path=P[sk.icon]||P.rune;
 if(sk.cls==='occultist'&&!sk.passive){
 const spectral=['M6 29 8 11q8-16 16 0l2 18-6-5-4 5-4-5ZM12 12h1m6 0h1','M2 19h28M8 28V11q8-14 16 0v17m-19-9 5-4m-5 4 5 4','M5 28q-2-10 8-22m-5 3 5-3 2 6M21 3q9 9 2 21m-4-5 4 5 5-4','M3 29 27 3m-7 1 7-1-1 7M8 3v9m0 7v10m11-5 5 0','M7 9q15-14 20 3t-8 15M7 9h8M7 9V2M19 27l-4-3 4-5'];
 if(i<=5)path=spectral[i-1];
 else if(i<=10){path='M8 3 25 5l-3 24-17-2ZM10 10h10m-10 5h9m-11 6h10';}
 else if(i<=15){const summon=['M8 26q-4-14 4-21l9 3 3 18-8-4ZM13 11h1m5 0h1','M6 9h20l-3 17H9ZM9 3h14m-7 0v6m-7 4h14m-10 2v8m6-8v8m-3 3v5','M2 26 19 8l8 6-11 16M20 8l-4-5m8 8 6-1M5 6l9 4M2 13l7 3','M4 8 16 3l12 5v10q-1 9-12 13Q5 27 4 18ZM10 13l6-6 6 6-6 10ZM8 26h16','M3 29V7h26v22M1 7 7 3h18l6 4M10 28V13h12v15M15 12v-4'];path=summon[i-11];}
 }
 const distinct:Record<string,string>={M02:'M3 25 10 11l9 12 10-12M16 2q7 5 1 11-7-1-3-6-1 4 2-5M22 7h8v9',S04:'M5 28 21 7l7-4-3 8L8 29M3 20l11 11M6 4v9m16 8v10',S11:'M15 5 24 9v7q-1 7-9 12Q6 23 6 16V9Zm-2 7 2 8 2-8M3 8Q-1 23 10 30m-1-4 1 4-5-1M28 23Q35 8 23 2m1 4-1-4 5 1',S14:'M18 2C5 4 2 16 10 23c-3-9 1-15 8-21ZM30 10c-13 2-16 14-8 21-3-9 1-15 8-21Z'};if(distinct[id])path=distinct[id];
 // Five talismans retain the paper frame but show their separate effect at 32 px.
 const curses:Record<string,string>={
 O06:'M7 3 26 5 23 29 5 27ZM10 10 20 10 16 15 21 18 12 24 15 17 10 16Z',
 O07:'M7 3 26 5 23 29 5 27ZM10 12 15 16 10 20M21 12 16 16 21 20M15 16 16 24',
 O08:'M7 3 26 5 23 29 5 27ZM9 17Q16 8 23 17 16 26 9 17ZM14 17Q16 14 18 17 16 20 14 17Z',
 O09:'M7 3 26 5 23 29 5 27ZM10 12Q21 8 21 18 21 25 15 23 10 21 13 16 16 12 22 13M10 23 15 18',
 O10:'M7 3 26 5 23 29 5 27ZM16 9 16 20M16 18 9 24M16 18 23 24M16 21 12 27M16 21 20 28M12 12 16 9 20 12'
 };if(curses[id])path=curses[id];
 let extra='';
 if(sk.passive){const special:Record<string,string>={MP01:P.resonance,MP02:P.vortex,MP03:P.flame,MP04:P.snow,MP05:P.bolt,AP01:P.triple,AP02:P.pierce,AP03:P.wind,AP04:P.recall,AP05:P.target,SP01:P.pull,SP02:P.shield,SP03:P.wall,SP04:P.lift,SP05:P.star,OP01:P.vortex,OP02:P.bind,OP03:P.home,OP04:P.return,OP05:P.resonance};path=special[id]||path;extra='<path d="M3 26v5h26v-5" stroke-width=".8"/>';}
 if(sk.ultimate)extra='<circle cx="16" cy="16" r="14.5" stroke-width=".8" stroke-dasharray="2 3"/><path d="M2 2l4 1-3 3m27-4-4 1 3 3M2 30l4-1-3-3m27 4-4-1 3-3" stroke-width=".9"/>';
 else {const ordinal=((i-1)%5)+1;if(i>5||sk.passive)extra+=`<path d="${Array.from({length:Math.min(5,ordinal)},(_,n)=>`M${4+n*5.7} 30v-2`).join('')}" stroke-width="1.1"/>`;}
 if(sk.redesigned&&REDESIGN_PATHS[id])path=REDESIGN_PATHS[id];
 return {path,extra};}
export function icon(name:string,cls='',size=24){const spec=name.startsWith('skill:')?skillPath(name.slice(6)):{path:MAP_PATHS[name]||P[name]||P.rune,extra:''};return `<svg class="icon ${cls}" width="${size}" height="${size}" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="${spec.path}"/>${spec.extra}</svg>`;}
export const crest = `<svg viewBox="0 0 120 120" fill="none" aria-hidden="true"><circle cx="60" cy="60" r="42" stroke="currentColor" stroke-width=".8"/><circle cx="60" cy="60" r="34" stroke="currentColor" stroke-width=".5" stroke-dasharray="1 8"/><path d="M60 8 68 47 108 60 68 69 60 111 51 69 11 60 51 47Z" fill="currentColor" fill-opacity=".09" stroke="currentColor"/><path d="m60 36 5 19 19 5-19 5-5 19-5-19-19-5 19-5Z" fill="currentColor"/><path d="m28 91 14-20M88 28 76 44" stroke="currentColor" stroke-width="2"/></svg>`;
