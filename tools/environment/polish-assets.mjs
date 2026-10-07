import {readFile,writeFile} from 'node:fs/promises';
import {GRANITE_ASSET_IDS,graniteVisuals} from './granite-visuals.mjs';
// Authoring source for the reference trees and Act 1 granite. Preserve
// sockets, physical height, collision and instance scale; change visual planes.
const file=new URL('../../shared/data/elements.json',import.meta.url);
const library=JSON.parse(await readFile(file,'utf8'));
const shape=(points,fill)=>({type:'polygon',points:points.map(([x,y])=>({x,y})),fill,stroke:null,alpha:1});
const pine=library.find(a=>a.id==='ancient_pine');
pine.visual=[
 shape([[-25,0],[-17,-48],[-22,-142],[-12,-226],[-4,-282],[18,-346],[8,-410],[16,-430],[28,-361],[12,-279],[8,-214],[2,-126],[12,-45],[26,0]],'#393d33'),
 shape([[-17,-2],[-13,-126],[-4,-214],[5,-280],[18,-338],[11,-272],[3,-186],[-3,-90],[0,0]],'#60604a'),
 shape([[-12,-174],[-65,-209],[-99,-219],[-110,-239],[-82,-229],[-52,-223],[0,-188],[5,-267],[59,-308],[93,-315],[65,-293],[9,-251]],'#3e4135'),
 shape([[-112,-323],[-131,-339],[-111,-352],[-94,-369],[-59,-375],[-48,-390],[-22,-384],[6,-401],[35,-390],[47,-379],[69,-378],[80,-359],[63,-346],[25,-342],[-11,-345],[-57,-332]],'#32493e'),
 shape([[5,-297],[20,-314],[42,-325],[67,-320],[81,-330],[97,-316],[109,-310],[113,-293],[100,-280],[69,-277],[45,-285],[20,-280]],'#3c5142'),
 shape([[-130,-232],[-118,-253],[-96,-262],[-83,-278],[-53,-271],[-38,-259],[-12,-266],[5,-251],[14,-238],[-8,-224],[-31,-226],[-53,-219],[-82,-227],[-106,-222]],'#30473b'),
 shape([[-111,-350],[-91,-367],[-58,-372],[-47,-386],[-24,-380],[7,-396],[34,-387],[7,-379],[-35,-364],[-76,-359]],'#52634d'),
 shape([[-108,-253],[-84,-273],[-56,-267],[-39,-253],[-15,-260],[-7,-251],[-48,-246],[-78,-251]],'#4a5c47')
];
const dead=library.find(a=>a.id==='dead_pine');
dead.visual=[
 shape([[-20,0],[-11,-140],[0,-224],[-10,-303],[-2,-340],[7,-298],[12,-218],[3,-122],[15,0]],'#43463b'),
 shape([[2,-248],[-58,-267],[-105,-285],[-79,-257],[-1,-235]],'#43463b'),
 shape([[6,-189],[63,-208],[110,-225],[74,-194],[4,-178]],'#4c4d3d'),
 shape([[-6,-127],[-57,-146],[-105,-160],[-63,-136],[-7,-115]],'#484a3b'),
 shape([[-9,-4],[-2,-219],[3,-203],[0,0]],'#68634b')
];
for(const a of [pine,dead]){const pts=a.visual.flatMap(s=>s.points),xs=pts.map(p=>p.x),ys=pts.map(p=>p.y);a.reference.bounds={x:Math.min(...xs),y:Math.min(...ys),w:Math.max(...xs)-Math.min(...xs),h:Math.max(...ys)-Math.min(...ys)};}
await writeFile(file,JSON.stringify(library,null,2)+'\n');
const campaignFile=new URL('../../shared/data/campaign.json',import.meta.url);
const campaign=JSON.parse(await readFile(campaignFile,'utf8'));
for(const id of GRANITE_ASSET_IDS){
 const rock=campaign.library.find(a=>a.id===id);
 rock.visual=graniteVisuals(rock);
}
await writeFile(campaignFile,JSON.stringify(campaign,null,2)+'\n');
console.log('Rebuilt pine and granite planes; physical heights, collision and sockets preserved');
