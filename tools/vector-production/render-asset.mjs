import {createCanvas,Path2D} from '@napi-rs/canvas';
import {readFileSync,writeFileSync} from 'node:fs';
import vm from 'node:vm';
const [source,output,widthText]=process.argv.slice(2),asset=JSON.parse(readFileSync(source)),width=+widthText,[x,y,w,h]=asset.vector.viewBox,height=Math.round(width*h/w),runtime={Path2D};
vm.createContext(runtime);vm.runInContext(readFileSync(new URL('../../shared/map/vector-art.js',import.meta.url),'utf8'),runtime);vm.runInContext(readFileSync(new URL('../../shared/map/environment.js',import.meta.url),'utf8'),runtime);
const errors=[...runtime.HonroVectorArt.validate(asset.vector),...runtime.HonroEnvironment.validate({library:[asset],stages:[]})];if(errors.length)throw Error(JSON.stringify(errors));
const c=createCanvas(width,height),ctx=c.getContext('2d');const scale=Math.min(width/w,height/h);ctx.translate((width-w*scale)/2,(height-h*scale)/2);ctx.scale(scale,scale);ctx.translate(-x,-y);const start=performance.now();runtime.HonroVectorArt.draw(ctx,asset,{x:asset.anchor.x,y:asset.anchor.y});const firstDrawMs=performance.now()-start;writeFileSync(output,c.toBuffer('image/png'));const warm=performance.now();runtime.HonroVectorArt.draw(ctx,asset,{x:asset.anchor.x,y:asset.anchor.y});console.log(JSON.stringify({width,height,firstDrawMs,warmDrawMs:performance.now()-warm,validationErrors:errors.length}));
