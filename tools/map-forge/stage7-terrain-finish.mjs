import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const stable=x=>JSON.stringify(x,(k,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,v[k]])):v);
let dataPromise;
export function loadStage7TerrainFinish(){return dataPromise??=readFile(new URL('./stage7-terrain-finish.json',import.meta.url),'utf8').then(JSON.parse);}
export function finishStage7Body(original,data){
 if(data.revision!==1)throw Error('Unsupported Stage7 terrain finish');
 const hash=createHash('sha256').update(stable(original.symbols.source)).digest('hex');
 if(hash!==data.referenceSourceSha256)throw Error('Stage7 terrain finish authoritative source changed; review required');
 const foreground=original.root.children.filter(n=>n.tag==='use'&&n.symbol==='source'||/^site-crop-\d+$/.test(n.clipPath||''));
 const edges=original.root.children.filter(n=>/^site-edge-\d+$/.test(n.clipPath||''));
 if(foreground.length!==14||edges.length!==3||foreground[0].symbol!=='source')throw Error('Unexpected original Stage7 collage roles');
 const d=structuredClone(data),[x,y,w,h]=d.viewBox,envelope=d.clips['nonwalk-envelope'];
 if(envelope.length!==1)throw Error('Unexpected lower domain');
 const tokens=envelope[0].match(/[MLZ]|-?\d+(?:\.\d+)?/g),pts=[];
 for(let i=0;i<tokens.length;){const cmd=tokens[i++];if(cmd==='Z')break;if(!['M','L'].includes(cmd))throw Error('Unexpected lower domain command');pts.push([+tokens[i++],+tokens[i++]]);}
 if(pts.length<4||pts.at(-1)[1]!==y+h||pts.at(-2)[1]!==y+h)throw Error('Unclosed lower domain');
 const rim=[`M${x} ${y}L${x+w} ${y}`+pts.slice(0,-2).reverse().map(p=>'L'+p.join(' ')).join('')+'Z'];
 const lower=d.backing.filter(n=>n.clipPath==='nonwalk-envelope');if(lower.length!==1)throw Error('Expected one lower material');
 const other=d.backing.filter(n=>n!==lower[0]);
 const clips={...d.clips,...structuredClone(original.clips),'original-rim-domain':rim,[d.closure.clipId]:d.closure.clip};
 const symbols={...d.symbols,source:structuredClone(original.symbols.source)};
 const root={tag:'g',children:[d.closure.root,...other,{tag:'path',fill:'#43333a',d:'M8 991L18 992V1032H8Z'},structuredClone(foreground[0]),{tag:'path',fill:'#43333a',d:'M11 992.5L14.5 993L16 1000L16.8 1015L17 1031.9L11 1031.4Z'},d.join,lower[0],...structuredClone(foreground.slice(1)),{tag:'g',clipPath:'original-rim-domain',children:structuredClone(edges.filter(n=>n.clipPath!=='site-edge-0'))}]};
 root.children.push(...[{"tag":"path","fill":"#43333a","d":"M8 1031L124 1043Q84 1052 47 1080Q9 1112 -47 1134Q-11 1106 5 1070Q10 1052 8 1031Z"},{"tag":"path","fill":"#251d25","d":"M17 1031.6310344827587L23 1032.251724137931Q16 1057.551724137931 -53 1114.9017241379308Q7 1061.9310344827586 17 1031.6310344827587Z"},{"tag":"path","fill":"#342832","d":"M23 1032.251724137931L27 1032.6655172413793Q20 1057.9655172413793 -47 1112.6155172413794Q13 1062.551724137931 23 1032.251724137931Z"},{"tag":"path","fill":"#342832","d":"M43 1034.3206896551724L50 1035.044827586207Q43 1060.344827586207 -27 1105.994827586207Q33 1064.6206896551723 43 1034.3206896551724Z"},{"tag":"path","fill":"#251d25","d":"M50 1035.044827586207L76 1037.7344827586207Q69 1063.0344827586207 -20 1105.5344827586207Q40 1065.344827586207 50 1035.044827586207Z"},{"tag":"path","fill":"#342832","d":"M76 1037.7344827586207L80 1038.148275862069Q73 1063.448275862069 6 1094.248275862069Q66 1068.0344827586207 76 1037.7344827586207Z"},{"tag":"path","fill":"#342832","d":"M109 1041.148275862069L124 1042.7Q117 1068.0 39 1083.95Q99 1071.448275862069 109 1041.148275862069Z"}]);
 root.children.push({"tag":"path","fill":"#4d3841","d":"M-61.01109154 1194.55894477L-46.76894877 1167.53238252L-32.52683568 1140.50582028L-14.75741895 1120.04680956L-13.07585543 1121.50604409L-30.68011915 1141.74967099L-44.79871099 1168.56973415L-59.09675824 1195.69607934Z"});
 return {...structuredClone(original),viewBox:d.viewBox,clips,symbols,root};
}
