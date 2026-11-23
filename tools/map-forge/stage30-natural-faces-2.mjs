// Stage30 natural-face rework, step 2: ford mesa edge, outbank tooth (--shapes), river body + mesa diagonal (--water), art regeneration.
import {readFileSync,writeFileSync} from 'node:fs';
const {applyStage30FerryArt}=await import('../environment/stage30-ferry-art.mjs');
const F=new URL('../../shared/data/campaign.json',import.meta.url);
const p=JSON.parse(readFileSync(F,'utf8')),st=p.stages.find(s=>s.metadata?.stageId===30);
const P=a=>a.map(([x,y])=>({x,y})),T=id=>st.terrains.find(t=>t.id===id);
if(process.argv.includes('--shapes')){
 // West ford: its western closure ran as one straight diagonal (0,7200)->(1610,5430) under the map rock.
 const f=T('sf-west-ford'),n=f.points.length;if(!(f.points[n-1].x===0&&f.points[n-1].y===7200))throw Error('ford tail');
 f.points.push(...P([[160,7010],[330,6900],[470,6700],[660,6590],[800,6400],[980,6290],[1140,6080],[1300,5960],[1420,5720],[1530,5600]]));
 // Outbank screen: a broken rock tooth, not a tilted board (it still collapses as one piece).
 T('sf-outbank-screen').points=P([[6720,5330],[6770,5250],[6830,5150],[6900,5230],[6930,5340],[7010,5430],[7040,5560],[7150,5680],[7190,5820],[7300,5960],[7350,6120],[7280,6200],[7240,6320],[7070,6440],[7010,6330],[6920,6260],[6880,6120],[6780,6040],[6740,5900],[6640,5790],[6670,5680],[6650,5560],[6700,5450]]);
}
if(process.argv.includes('--water')){
 const w=st.materials.find(m=>m.id==='sf-main-river');if(JSON.stringify(w.surface)!=='[[6460,6580],[7210,6580]]')throw Error('river surface');
 // Same surface; the body follows the new bank walls down to a narrower bed instead of a box.
 w.points=[[6460,6580],[7210,6580],[7192,6600],[7134,6720],[7150,6880],[7118,7040],[7070,7200],[6600,7200],[6546,7060],[6494,6910],[6510,6770],[6472,6620]];
 w.bottom=[[6600,7200],[7070,7200]];
 const f=T('sf-west-ford'),i=f.points.findIndex(q=>q.x===-6000&&q.y===31200);if(i<0||f.points[i+1].x!==0||f.points[i+1].y!==7200)throw Error('mesa');
 f.points.splice(i+1,0,...P([[-5320,28900],[-4980,27600],[-4560,26300],[-4280,24600],[-3720,22700],[-3460,21100],[-2860,19300],[-2620,17600],[-2080,15800],[-1840,14200],[-1300,12400],[-1080,11000],[-640,9700],[-470,8600],[-120,7800]]));
}
applyStage30FerryArt(p);
writeFileSync(F,JSON.stringify(p)+'\n');console.log('ok');
