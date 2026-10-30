// Merge nearly identical native palette neighbors only; geometric union, no redrawing.
import {readFileSync,writeFileSync} from 'node:fs';import {Path2D,PathOp,FillType} from '@napi-rs/canvas';
const [input,output]=process.argv.slice(2),text=readFileSync(input,'utf8'),groups=new Map(),map={'#365480':'#35537e','#34527b':'#35537e','#12213a':'#112038','#101d35':'#112038'};
for(const tag of text.matchAll(/<(?:[\w-]+:)?path\b[^>]*>/g)){const d=tag[0].match(/\bd="([^"]*)"/)[1],fill=tag[0].match(/fill:(#[0-9a-fA-F]{6})/)[1],color=map[fill]||fill;if(!groups.has(color))groups.set(color,new Path2D());const p=new Path2D(d);p.setFillType(FillType.Winding);groups.get(color).op(p,PathOp.Union);}
writeFileSync(output,JSON.stringify([...groups].map(([fill,p])=>({fill,d:p.toSVGString(),fillRule:p.getFillTypeString()}))));
