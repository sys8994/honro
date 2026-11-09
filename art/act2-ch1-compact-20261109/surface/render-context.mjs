/** Existing engine vector painter with its actual existing VisualStyle context.
 * Adds no renderer logic. 'before' removes only the two semantic opt-out flags.
 */
import {createCanvas,Path2D} from '@napi-rs/canvas';
import {readFileSync,writeFileSync} from 'node:fs';
import vm from 'node:vm';
const [file,png,widthText,role='gameplay',variant='after']=process.argv.slice(2);
const asset=JSON.parse(readFileSync(file));
if(variant==='before'){delete asset.params.nonplayEnvironment;delete asset.params.silhouetteUnderpaint;}
const runtime={Path2D};vm.createContext(runtime);
for(const path of ['shared/map/visual-style.js','shared/map/vector-art.js','shared/map/environment.js'])vm.runInContext(readFileSync(path,'utf8'),runtime);
const errors=[...runtime.HonroVectorArt.validate(asset.vector),...runtime.HonroEnvironment.validate({library:[asset],stages:[]})];
if(errors.length)throw Error(JSON.stringify(errors));
const width=+widthText,[x,y,w,h]=asset.vector.viewBox,height=Math.round(width*h/w),canvas=createCanvas(width,height),ctx=canvas.getContext('2d');
const scale=Math.min(width/w,height/h);ctx.translate((width-w*scale)/2,(height-h*scale)/2);ctx.scale(scale,scale);ctx.translate(-x,-y);
runtime.HonroVectorArt.draw(runtime.HonroVisualStyle.context(ctx,role),asset,{x:asset.anchor.x,y:asset.anchor.y});
writeFileSync(png,canvas.toBuffer('image/png'));
console.log(JSON.stringify({role,variant,width,height,validationErrors:0,nonplayEnvironment:asset.params.nonplayEnvironment,silhouetteUnderpaint:asset.params.silhouetteUnderpaint}));
