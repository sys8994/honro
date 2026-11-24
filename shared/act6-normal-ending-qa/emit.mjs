import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const SHA=b=>createHash('sha256').update(b).digest('hex');
const here=p=>new URL(p,import.meta.url);
const moduleText=async (p,name)=>{
 const raw=await readFile(here('./'+p),'utf8');
 const kept=raw.replace(/^import .*;\r?\n/gm,'');
 assert(!/^import /m.test(kept));
 return 'const '+name+'=(()=>{'+kept.replaceAll('export function ','function ')+'\nreturn '+name+';})();\n';
};
export async function normal60EndingSource(){
 const stock=await readFile(here('../runtime/profile-store.js'),'utf8');
 assert.equal(SHA(stock),'84249ab3fc58605270e2b08ecdeec46e72cfb5b8d8c274ba609e6e504f2e7ee5');
 const cards={
   Wide:{asset:'dawn-pc.webp',mime:'image/webp',w:1672,h:941,sha256:'cb000c13e990325498c7996f423b6b459cc586d8ee4d20912b7a1db79944e25f'},
   Portrait:{asset:'dawn-mobile.webp',mime:'image/webp',w:941,h:1672,sha256:'56e249516f335f8762883a94715a49043aee8c4598847d27c90f15289f461a61'}
 };
 for(const p of Object.values(cards))assert.equal(SHA(await readFile(here('./'+p.asset))),p.sha256);
 const modules=[['gate-masonry.mjs','gateMasonry'],['gateway.mjs','gateShadow'],['native-cuts.mjs','createNativeEndingCuts'],['ending-dom.mjs','createEndingDOM'],
   ['writer-fixed.mjs','createFixedWriter'],['write-port.mjs','createEndingWritePort'],['stock-slot-60.mjs','create60StockSlot']];
 return (await Promise.all(modules.map(q=>moduleText(...q)))).join('')+
  'const stockSlot60Factory=(G,slot)=>{const globalThis={localStorage:slot};for(const k of ["HONRO_CORE","HONRO_EMBEDDED","HONRO_PREVIOUS_TERRAIN_ART","HONRO_PROJECT","HonroAct23V4","HonroCampaignMapRevision","HonroEquipment","HonroProgression","HonroStage33Restore"])globalThis[k]=G[k];\n'+stock+
  '\nreturn globalThis.HonroProfileStore;};\nconst STAGE60_ENDING_CSS='+JSON.stringify(await readFile(here('./ending-dom.css'),'utf8'))+
  ';\nconst normal60Cards='+JSON.stringify(cards)+';\n'+await readFile(here('./host.inc.js'),'utf8');
}
