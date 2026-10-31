/** Estuary-background-only RGB/alpha quality metrics; no terrain or actor policy. */
import assert from 'node:assert/strict';
export const ESTUARY_LIMITS=Object.freeze({rgbMeanAbsoluteError:2,rgbChannelP99:12,lumaSsim:0.98});
// SSIM on Rec.709 luma, 11x11 normalized Gaussian window (sigma=1.5), valid
// interior, population covariance, 8-bit C1=(.01*255)^2/C2=(.03*255)^2.
export function measureEstuaryRgba(a,b,w,h){
 assert(Number.isInteger(w)&&Number.isInteger(h)&&w>=11&&h>=11,'SSIM needs at least 11x11 pixels');
 assert.equal(a.length,w*h*4);assert.equal(b.length,a.length);
 const histogram=new Uint32Array(256),la=new Float64Array(w*h),lb=new Float64Array(w*h);let sum=0,alphaDifferent=0,maxRgb=0;
 for(let p=0;p<w*h;p++){const i=p*4;if(a[i+3]!==b[i+3])alphaDifferent++;for(let c=0;c<3;c++){const d=Math.abs(a[i+c]-b[i+c]);histogram[d]++;sum+=d;if(d>maxRgb)maxRgb=d;}la[p]=.2126*a[i]+.7152*a[i+1]+.0722*a[i+2];lb[p]=.2126*b[i]+.7152*b[i+1]+.0722*b[i+2];}
 const rgbChannels=w*h*3,target=Math.ceil(rgbChannels*.99);let cum=0,rgbP99=0;for(let i=0;i<256;i++){cum+=histogram[i];if(cum>=target){rgbP99=i;break;}}
 const weights=Array.from({length:11},(_,i)=>Math.exp(-((i-5)**2)/(2*1.5**2)));const norm=weights.reduce((x,y)=>x+y,0);for(let i=0;i<11;i++)weights[i]/=norm;
 const ha=new Float64Array(w*h),hb=new Float64Array(w*h),haa=new Float64Array(w*h),hbb=new Float64Array(w*h),hab=new Float64Array(w*h);
 for(let y=0;y<h;y++)for(let x=5;x<w-5;x++){let sa=0,sb=0,saa=0,sbb=0,sab=0;for(let k=-5;k<=5;k++){const i=y*w+x+k,u=la[i],v=lb[i],z=weights[k+5];sa+=z*u;sb+=z*v;saa+=z*u*u;sbb+=z*v*v;sab+=z*u*v;}const i=y*w+x;ha[i]=sa;hb[i]=sb;haa[i]=saa;hbb[i]=sbb;hab[i]=sab;}
 let ssim=0,n=0;const c1=(.01*255)**2,c2=(.03*255)**2;
 for(let y=5;y<h-5;y++)for(let x=5;x<w-5;x++){let ma=0,mb=0,aa=0,bb=0,ab=0;for(let k=-5;k<=5;k++){const i=(y+k)*w+x,z=weights[k+5];ma+=z*ha[i];mb+=z*hb[i];aa+=z*haa[i];bb+=z*hbb[i];ab+=z*hab[i];}const va=Math.max(0,aa-ma*ma),vb=Math.max(0,bb-mb*mb),cov=ab-ma*mb;ssim+=((2*ma*mb+c1)*(2*cov+c2))/((ma*ma+mb*mb+c1)*(va+vb+c2));n++;}
 return {rgbMeanAbsoluteError:sum/rgbChannels,rgbChannelP99:rgbP99,rgbMaxError:maxRgb,alphaDifferentPixels:alphaDifferent,lumaSsim:ssim/n,ssimWindowCount:n};
}
export function assertEstuaryQuality(m){assert.equal(m.alphaDifferentPixels,0,'alpha must be exactly equal');assert(m.rgbMeanAbsoluteError<=ESTUARY_LIMITS.rgbMeanAbsoluteError,'RGB MAE exceeds 2/255');assert(m.rgbChannelP99<=ESTUARY_LIMITS.rgbChannelP99,'RGB channel p99 exceeds 12/255');assert(m.lumaSsim>=ESTUARY_LIMITS.lumaSsim,'luma SSIM below .98');}
