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
 const root={tag:'g',children:[d.closure.root,...other,structuredClone(foreground[0]),d.join,lower[0],...structuredClone(foreground.slice(1)),{tag:'g',clipPath:'original-rim-domain',children:structuredClone(edges.filter(n=>n.clipPath!=='site-edge-0'))}]};
 return {...structuredClone(original),viewBox:d.viewBox,clips,symbols,root};
}
