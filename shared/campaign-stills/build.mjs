import {readFile} from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {selectEndingCue} from '../act6-ending-replan/cues.mjs';

export async function compileCampaignStills({root,emit,sharp}){
 const dir=path.join(root,'shared/campaign-stills');
 const data=JSON.parse(await readFile(path.join(dir,'content.json'),'utf8'));
 assert.ok([4,5].includes(data.opening.length),'Expected four or five opening stills');
 assert.deepEqual(Object.keys(data.endings).sort(),['10','20','30','40','50'],'Expected five pre-finale act endings');
 for(const [stage,cuts] of Object.entries(data.endings)){
  assert.equal(cuts.length,3,`Expected three stills for stage ${stage}`);
  assert.deepEqual(cuts.map(c=>c.role),['payoff','bridge','foreshadow'],`Ending order for stage ${stage}: payoff → bridge → foreshadow`);
  assert.equal(cuts.filter(c=>c.existing).length,1,`Retain one original image for stage ${stage}`);
 }
 const all=[...data.opening,...Object.values(data.endings).flat()], ids=new Set();
 assert.ok(data.opening.every(c=>!c.existing),'Opening cannot refer to legacy act cut data');
 for(const c of all){
  assert.ok(/^[a-z0-9][a-z0-9-]+$/.test(c.id)&&!ids.has(c.id),`Invalid or duplicate still id: ${c.id}`);
  ids.add(c.id);
  assert.ok(typeof c.alt==='string'&&c.alt.trim(),'Missing alt text: '+c.id);
  assert.ok(Array.isArray(c.beats)&&c.beats.length>0&&c.beats.every(x=>typeof x==='string'&&x.trim()),'Missing narration: '+c.id);
  assert.ok(Number.isFinite(c.duration)&&c.duration>0,'Invalid still duration: '+c.id);
  assert.ok(c.overrideArt===undefined||(c.existing&&c.overrideArt===true),'Invalid legacy art override: '+c.id);
  if(c.existing&&!c.overrideArt)continue;
  c.assets=Object.fromEntries(await Promise.all([['land',1920,1080],['port',1080,1920]].map(async ([side,width,height])=>{
   const bytes=await readFile(path.join(dir,'stills',`${c.id}-${side}.webp`));
   const m=await sharp(bytes).metadata();
   assert.equal(m.format,'webp',`Bad format: ${c.id} ${side}`);
   assert.equal(m.width,width,`Bad width: ${c.id} ${side}`);
   assert.equal(m.height,height,`Bad height: ${c.id} ${side}`);
   return [side,await emit('graphics',`campaign-still-${c.id}-${side}`,'webp',bytes)];
  })));
 }
 const shared=path.join(root,'shared/act6-ending-replan');
 const [player,css]=await Promise.all(['presentation.inc.js','presentation.css'].map(x=>readFile(path.join(shared,x),'utf8')));
 // Use the bundled Korean serif where mobile/Chromium do not have an OS Batang.
 const localizedCss=css+'\n.he-root[data-campaign-stills]{font-family:"Honro Serif","Noto Serif KR",Batang,serif}';
 return `const campaignStillsPlayer=${player.trim()};\nconst campaignStillsCueAt=${selectEndingCue};\nconst campaignStillsCss=${JSON.stringify(localizedCss)};\nconst campaignStillsData=${JSON.stringify(data)};\n`;
}
