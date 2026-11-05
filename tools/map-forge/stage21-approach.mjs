/** Stage21 only: a low approach and a supported route to the existing shelter roof.
 * Reuses authored earth/stone planes and the market awning; no enemy/stat edits.
 */
import {readFile,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {foundationArt,supportedAwningArt} from './stage21-eupseong-art.mjs';
import {asset} from './act3-map-kit.mjs';
export function authorStage21Approach(project){
 const p=structuredClone(project),s=p.stages[20],t=s.terrains.find(t=>t.id==='a3-foundation');
 const points=t.points.filter(q=>q.x<1200||q.x>1620);
 const at=points.findIndex(q=>q.x>1620);
 points.splice(at,0,...[[1200,2694],[1350,2760],[1460,2760],[1620,2640]].map(([x,y])=>({x,y})));t.points=points;
 const top=points.slice(0,points.findIndex(q=>q.x===6400)+1).map(q=>[q.x,q.y]);
 const ground=x=>{for(let i=1;i<top.length;i++){const a=top[i-1],z=top[i];if(x>=a[0]&&x<=z[0])return a[1]+(z[1]-a[1])*(x-a[0])/(z[0]-a[0]);}return 2640;};
 // Keep the shelter's foot attached; shift its existing one-way roof by exactly
 // the same amount. The resident at1620 and all terrain east of it are fixed.
 const shelter=s.elements.find(e=>e.id==='cloth-shelter'),dy=ground(shelter.x)-shelter.y;
 shelter.y+=dy;for(const q of s.terrains.find(t=>t.id==='eup21-cloth-shelter-roof').points)q.y+=dy;
 const cart=s.elements.find(e=>e.id==='rescue-cart');cart.y=ground(cart.x);
 // Place an existing supported timber awning beside the hollow. Its feet stay
 // at the existing road, and the player can jump onto it or pass underneath.
 const awning=s.elements.find(e=>e.id==='market-entry-awning'),source=p.library.find(a=>a.id===awning.assetId);
 const id='eup21:approach-awning',topStep=[[1210,2550],[1320,2550]],a=asset(id,'수레 서쪽 차양 발판',supportedAwningArt(topStep,ground,{cloth:true,tone:'#879276'}),[],[1195,2495,145,ground(1320)-2495+10]);a.params.rearOnly=true;
 p.library=p.library.filter(x=>x.id!==id);p.library.push(a);
 s.elements=s.elements.filter(e=>e.id!=='approach-awning');s.elements.push({...awning,id:'approach-awning',assetId:id,x:0,y:0});
 const step=structuredClone(s.terrains.find(t=>t.id==='eup21-market-entry-awning'));step.id='eup21-approach-awning';step.name=step.id;step.points=step.points.map(q=>({x:q.x-2135,y:q.y-90}));
 s.terrains=s.terrains.filter(t=>t.id!==step.id);s.terrains.push(step);
 const f=asset('eup21:foundations','성문 접근 굴곡과 연결된 석축 기단',foundationArt(top,ground,{gateButtress:true}),[],[0,2220,6400,1430],'earth');
 const old=p.library.find(a=>a.id===f.id);Object.assign(old,{vector:f.vector});
 s.design.stage21Approach={revision:1,scope:'Fresh stage21 only. Hollow west of resident; existing one-way awning/roof alternative. Escort1620–2890 unchanged.',routes:['ground-hollow','awning-shelter-roof'],preserved:['enemies','rewards','cart680','escort','objectives']};
 return p;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const file=process.argv[2]||'shared/data/campaign.json',p=authorStage21Approach(JSON.parse(await readFile(file,'utf8')));await writeFile(file,JSON.stringify(p)+'\n');}
