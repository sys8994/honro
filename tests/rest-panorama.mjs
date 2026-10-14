/** Read-only rendering contracts; no browser/visual-quality claims. */
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const g=vm.createContext({atob:s=>Buffer.from(s,'base64').toString('binary')});
for(const f of ['shared/map/environment.js','shared/runtime/journey-art.js'])vm.runInContext(await readFile(f,'utf8'),g);
g.HONRO_ACT1_FAR_DATA={};const originals={};for(const [key,file]of [['mountains','act1-far.svg'],['gorge','act1-gorge.svg']]){originals[key]=(await readFile('shared/assets/environment/'+file,'utf8')).replace(/\bstroke="[^"]*"/g,'stroke="none"');g.HONRO_ACT1_FAR_DATA[key]='data:image/svg+xml;base64,'+Buffer.from(originals[key]).toString('base64');}
for(let stage=1;stage<=10;stage++){
 const expected=stage<6?'mountains':'gorge',svg=g.HonroJourneyArt.scene('forest','surface',stage),mood=g.HonroEnvironment.act1Mood(stage);
 assert(svg.includes(`data-rest-backdrop="${expected}"`));assert(!svg.includes('data-art-layer="distant-ink-mountains"'));assert(!svg.includes('<image '));
 for(const match of originals[expected].matchAll(/\sd="([^"]+)"/g))assert(svg.includes(match[0]),'approved SVG shape must not change');
 assert(svg.includes(`values="${g.HonroEnvironment.ACT1_FAR.saturation}"`));assert(svg.includes(`slope="${g.HonroEnvironment.ACT1_FAR.brightness[expected]}"`));assert(svg.includes(`fill="${mood.tint}" opacity="${mood.opacity}"`));
 const ids=[...svg.matchAll(/\sid="([^"]+)"/g)].map(m=>m[1]);assert.equal(ids.length,new Set(ids).size,'embedded definitions must be namespaced');for(const match of svg.matchAll(/url\(#([^\)]+)\)/g))assert(ids.includes(match[1]),'gradient/filter references resolve');
 assert.equal(svg.includes('data-art-layer="warehouse-approach"'),stage===8);
}
assert(!g.HonroJourneyArt.scene('cave','underground',14).includes('data-rest-backdrop'));
assert(!g.HonroJourneyArt.scene('forest','surface',21).includes('data-rest-backdrop'));
assert(g.HonroJourneyArt.scene('forest','surface').includes('data-art-layer="distant-ink-mountains"'),'unscoped atlas/legacy caller keeps original artwork');
console.log('PASS all ten Act1 scenes: exact approved SVG paths, no-outline embedded source, shared color/mood, unique definitions; stage8 place cue; other acts/atlas unchanged');
