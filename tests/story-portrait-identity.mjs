/** Production Native Canvas identity regression; not browser/layout evidence. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {guidanceRuntime,canvas} from './act2-guidance-helpers.mjs';
const g=await guidanceRuntime();
// Browsers fix context attributes on the first getContext call. Native Canvas
// otherwise reapplies Scene's alpha:false request and creates an opaque backing.
g.document.createElement=()=>{const cv=canvas(),ctx=cv.getContext('2d');cv.getContext=()=>ctx;return cv;};
vm.runInContext(await readFile('shared/runtime/portraits.js','utf8'),g);
g.HONRO_STORY_PORTRAITS=JSON.parse(await readFile('game/config/story-portraits.json','utf8'));
const hash=cv=>createHash('sha256').update(cv.toBuffer('image/png')).digest('hex');
const party=new Map(),rows=[],out='_local/reports/story-portrait-identity';
await mkdir(out,{recursive:true});
for(const [who,cls] of [['설오','archer'],['담허','mage'],['휘겸','knight'],['소단','occultist']]){
 const actor=g.HonroPortraits.storyActor(who,null),before=canvas(400,440),after=canvas(400,440);
 assert.equal(actor,null);g.HonroPortraits.draw(before,null,cls);g.HonroPortraits.draw(after,actor,cls);
 assert.equal(hash(before),hash(after),`${who}: party portrait unchanged`);party.set(who,hash(after));
}
const expected={'문탁':'civilian','백산':'ally_guard','생존자':'civilian','주막주인':'civilian','나무꾼':'woodcutter','연실':'ally_healer','춘례':'ally_healer','복만':'ally_porter'};
const sheet=canvas(1200,880),ctx=sheet.getContext('2d');ctx.fillStyle='#14262b';ctx.fillRect(0,0,1200,880);
let index=0;
for(const [who,kind] of Object.entries(expected)){
 const portrait=g.HONRO_STORY_PORTRAITS[who],original=JSON.stringify(portrait),actor=g.HonroPortraits.storyActor(who,null),cv=canvas(400,440);
 assert.equal(actor.name,who);assert.equal(actor.side,2);assert.equal(g.resolveRebuildCharacter(actor),null,`${who}: must not resolve to a companion`);
 assert.equal(g.HonroActorVisual.kind(actor),kind);assert(g.HonroPortraits.draw(cv,actor,portrait.class));
 assert.equal(cv.getContext('2d').getImageData(0,0,1,1).data[3],0,`${who}: transparent portrait corner`);
 const digest=hash(cv);assert(![...party.values()].includes(digest),`${who}: must not paint any companion`);
 assert.equal(JSON.stringify(portrait),original);const live={...actor,id:`live-${who}`,x:123,y:456,hp:17};
 assert.equal(g.HonroPortraits.storyActor(who,live),live,'live authored actor must retain identity');
 rows.push({who,kind,sha256:digest});
 const x=index%4*300,y=Math.floor(index/4)*440;ctx.fillStyle='#ead9b7';ctx.font='22px sans-serif';ctx.fillText(who,x+15,y+32);ctx.drawImage(cv,x+20,y+45,260,286);index++;
 await writeFile(`${out}/${who}.png`,cv.toBuffer('image/png'));
}
const unknown=g.HonroPortraits.storyActor('새 주민',null,{class:'knight'});
assert.equal(unknown,null,'unregistered class alone cannot invent an NPC identity');
assert.equal(g.HonroPortraits.storyActor('기록',null),null);
const story=await readFile('shared/runtime/story.js','utf8');
assert(story.includes('HonroPortraits.storyActor(who,actor)'));assert(story.includes("drawBust(node.querySelector('.story-portrait'),actor,cls,who,meta,npc)"));
await writeFile(`${out}/npc-contact-sheet.png`,sheet.toBuffer('image/png'));
await writeFile(`${out}/summary.json`,JSON.stringify({status:'passed',mode:'Production Native Canvas, no browser claim',partyUnchanged:[...party.keys()],rows},null,2)+'\n');
console.log('PASS: 8 absent NPC identities, 8 live actor identities, 4 unchanged companions, unknown NPC safe fallback, story wiring');
