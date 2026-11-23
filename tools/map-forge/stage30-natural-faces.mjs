// Stage30 natural-face rework, step 1 (applied 2026-11-23 to shared/data/campaign.json; kept as the authoring record).
// Walk tops are asserted unchanged; only sides/undersides/channel walls move. Rerunning on the reworked data throws by design.
import {readFileSync,writeFileSync} from 'node:fs';
import {applyStage30FerryArt} from '../environment/stage30-ferry-art.mjs';
const F=new URL('../../shared/data/campaign.json',import.meta.url);
const p=JSON.parse(readFileSync(F,'utf8')),st=p.stages.find(s=>s.metadata?.stageId===30);
const P=a=>a.map(([x,y])=>({x,y}));
const shapes={
 'sf-old-road-gather':[[9350,4300],[10170,4300],[10198,4360],[10186,4470],[10232,4590],[10214,4760],[10276,4930],[10258,5120],[10330,5320],[10316,5520],[10400,5760],[10384,5990],[10470,6260],[10500,6560],[10590,6880],[10660,7200],[10660,31200],[9500,31200],[9500,7200],[9468,6980],[9476,6720],[9440,6420],[9452,6100],[9410,5760],[9424,5420],[9378,5100],[9392,4860],[9356,4660]],
 'sf-east-outer-grade':[[8450,5500],[8660,5290],[8780,5140],[8920,5000],[9060,5000],[9200,4860],[9300,4730],[9322,4880],[9300,5060],[9326,5280],[9340,5560],[9322,5860],[9370,6180],[9398,6520],[9440,6860],[9500,7200],[9500,31200],[8450,31200],[8450,7200]],
 'sf-cape-west-buttress':[[2170,4980],[2580,4660],[3040,4640],[3040,4940],[2860,5010],[2700,5130],[2560,5160],[2440,5290],[2330,5330],[2240,5440],[2172,5420],[2150,5250],[2190,5120],[2160,5040]],
 'sf-cape-west-access':[[1550,5405],[1850,5240],[2170,4980],[2580,4660],[3040,4640],[3040,4712],[2800,4742],[2580,4756],[2380,4884],[2170,5074],[2000,5206],[1850,5334],[1700,5426],[1550,5478]],
 'sf-bank-inner':[[6100,4860],[6440,4820],[6750,4890],[7030,4870],[7300,4990],[7460,4860],[7790,4720],[8150,4790],[8450,4760],[8466,4880],[8440,5000],[8450,5100],[8250,5160],[7910,5230],[7650,5300],[7370,5392],[7100,5300],[6870,5250],[6560,5150],[6260,5120],[6150,5060],[6100,4980]],
 'sf-outbank-screen':[[6720,5330],[6780,5230],[6830,5150],[6880,5250],[6990,5490],[7120,5700],[7210,5880],[7350,6120],[7260,6260],[7070,6440],[6930,6230],[6820,6080],[6640,5790],[6690,5560]],
 'sf-return-tooth-1':[[4710,5670],[4840,5670],[4832,5700],[4800,5728],[4742,5734],[4716,5706]],
 'sf-return-tooth-2':[[4490,5820],[4710,5820],[4700,5852],[4660,5878],[4540,5884],[4498,5856]],
 'sf-return-tooth-3':[[4690,5970],[4830,5970],[4822,6000],[4790,6028],[4730,6032],[4696,6004]],
 'sf-east-quay-entry':[[6260,5470],[6730,5470],[6746,5530],[6700,5612],[6520,5642],[6330,5626],[6260,5600]],
};
const T=id=>st.terrains.find(t=>t.id===id);
for(const [id,pts] of Object.entries(shapes)){const t=T(id);const old=t.points;
 // the walk top must be unchanged: compare the first (maxWalk+2) points
 const k=Math.max(-1,...(t.properties?.honroWalkEdges||[]))+2;for(let i=0;i<k;i++)if(old[i].x!==pts[i][0]||old[i].y!==pts[i][1])throw Error(id+' walk point '+i+' changed');
 t.points=P(pts);}
// River channel walls below the waterline (water surface 6580): irregular, leaving the ferry lane free.
{const t=T('sf-west-ford'),i=t.points.findIndex(p=>p.x===6460&&p.y===7200);if(i<0)throw Error('ford');
 t.points.splice(i,2,...P([[6472,6620],[6510,6770],[6494,6910],[6546,7060],[6600,7200],[6600,31200]]));}
{const t=T('sf-east-recovery-shore'),n=t.points.length;const a=t.points[n-2],z=t.points[n-1];if(!(a.x===7210&&a.y===31200&&z.x===7210&&z.y===7200))throw Error('shore');
 t.points.splice(n-2,2,...P([[7070,31200],[7070,7200],[7118,7040],[7150,6880],[7134,6720],[7192,6600]]));}
applyStage30FerryArt(p);
writeFileSync(F,JSON.stringify(p)+'\n');console.log('reshaped',Object.keys(shapes).length+2);
