import {createCanvas,loadImage} from '@napi-rs/canvas';
import {readFileSync,writeFileSync} from 'node:fs';
const [source,output,widthText]=process.argv.slice(2),width=+widthText;
const text=readFileSync(source,'utf8'),vb=text.match(/viewBox="([^"]+)"/)[1].trim().split(/[ ,]+/).map(Number),height=Math.round(width*vb[3]/vb[2]);
const start=performance.now(),img=await loadImage(Buffer.from(text.replace(/<svg\b([^>]*)>/,(_,attrs)=>'<svg '+attrs.replace(/\b(?:width|height)="[^"]*"/g,'')+` width="${width}" height="${height}">`))),decodeMs=performance.now()-start,canvas=createCanvas(width,height),ctx=canvas.getContext('2d'),drawStart=performance.now();
ctx.drawImage(img,0,0,width,height);const drawMs=performance.now()-drawStart;
writeFileSync(output,canvas.toBuffer('image/png'));console.log(JSON.stringify({width,height,decodeMs,drawMs}));
