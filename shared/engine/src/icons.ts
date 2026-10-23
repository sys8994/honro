// Shared UI/class/item symbols only; skill: IDs never dispatch to this table.
const P: Record<string, string> = {
    flame: 'M14 3c3 6-4 7-1 11 1-4 4-3 5-7 7 8 7 17-2 19-9 2-15-5-11-12 0 5 5 4 4 0-1-5 5-7 5-11Z',
    arrow: 'M5 27 26 6M17 6h9v9M5 18v9h9',
    sword: 'M8 22 23 4l5-1-1 5-18 16M4 18l10 10M3 29l5-6',
    snow: 'M16 2v28M4 9l24 14M4 23 28 9M12 5l4 4 4-4M12 27l4-4 4 4M4 14l6-1-1-6M23 25l-1-6 6-1',
    bolt: 'm18 2-13 17h10l-2 12 14-19H17Z',
    rune: 'M16 3 29 16 16 29 3 16ZM16 9l7 7-7 7-7-7ZM16 1v6M31 16h-6M16 25v6M1 16h6',
    target: 'M16 7a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM16 1v10M16 21v10M1 16h10M21 16h10',
    shield: 'M16 3 28 8v8c0 7-8 12-12 14C12 28 4 23 4 16V8ZM16 8v17M8 12h16',
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
// Skill identity is explicit: ready images and fixed-size neutral placeholders
// use the same markup. No historical skill SVG is generated or shipped here.
export function icon(name:string,cls='',size=24){
 const id=name.startsWith('skill:')?name.slice(6):'';
 if(id){
  const ready=(globalThis as any).HonroSkillImages?.readyURL(id)||'',item=(globalThis as any).HONRO_SKILL_ICON_MANIFEST?.icons?.[id],state=ready?'ready':item?.status==='ready'&&item.url?'available':'pending';
  return `<span class="skill-art" data-skill-icon="${id}" data-image-state="${state}" style="--art-size:${size}px" aria-hidden="true"><img ${ready?`src="${ready}"`:""} alt="" width="${size}" height="${size}" decoding="async"><span class="skill-art-pending"></span></span>`;
 }
 const path=MAP_PATHS[name]||P[name]||P.rune;
 return `<svg class="icon ${cls}" width="${size}" height="${size}" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="${path}"/></svg>`;
}
export const crest = `<svg viewBox="0 0 120 120" fill="none" aria-hidden="true"><circle cx="60" cy="60" r="42" stroke="currentColor" stroke-width=".8"/><circle cx="60" cy="60" r="34" stroke="currentColor" stroke-width=".5" stroke-dasharray="1 8"/><path d="M60 8 68 47 108 60 68 69 60 111 51 69 11 60 51 47Z" fill="currentColor" fill-opacity=".09" stroke="currentColor"/><path d="m60 36 5 19 19 5-19 5-5 19-5-19-19-5 19-5Z" fill="currentColor"/><path d="m28 91 14-20M88 28 76 44" stroke="currentColor" stroke-width="2"/></svg>`;
