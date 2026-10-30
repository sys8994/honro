// Native geometry union for silhouette inspection; no hand authored art.
import {readFileSync,writeFileSync} from 'node:fs';import {Path2D,PathOp,FillType} from '@napi-rs/canvas';
const [input,output]=process.argv.slice(2),text=readFileSync(input,'utf8'),p=new Path2D();let count=0;
for(const tag of text.matchAll(/<(?:[\w-]+:)?path\b[^>]*>/g)){count++;const d=tag[0].match(/\bd="([^"]*)"/)[1],q=new Path2D(d);q.setFillType(tag[0].includes('evenodd')?FillType.EvenOdd:FillType.Winding);p.op(q,PathOp.Union);}
if(!count)throw Error('No native path elements found; namespace/parser mismatch must not produce a false empty asset');
writeFileSync(output,JSON.stringify({pathCount:count,d:p.toSVGString(),bounds:p.computeTightBounds(),fillRule:p.getFillTypeString()}));
