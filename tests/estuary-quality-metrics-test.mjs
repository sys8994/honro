import assert from 'node:assert/strict';import{measureEstuaryRgba,assertEstuaryQuality}from'./estuary-quality-metrics.mjs';
const w=11,h=11,a=Buffer.alloc(w*h*4),b=Buffer.alloc(w*h*4);for(let i=0;i<a.length;i+=4){a[i]=a[i+1]=a[i+2]=100;a[i+3]=255;b[i]=b[i+1]=b[i+2]=101;b[i+3]=255;}
const same=measureEstuaryRgba(a,a,w,h);assert.equal(same.rgbMeanAbsoluteError,0);assert.equal(same.rgbChannelP99,0);assert.equal(same.alphaDifferentPixels,0);assert(Math.abs(same.lumaSsim-1)<1e-12);
const shifted=measureEstuaryRgba(a,b,w,h),c1=(.01*255)**2;assert.equal(shifted.rgbMeanAbsoluteError,1);assert.equal(shifted.rgbChannelP99,1);assert(Math.abs(shifted.lumaSsim-(2*100*101+c1)/(100**2+101**2+c1))<1e-10);
b[3]=254;assert.equal(measureEstuaryRgba(a,b,w,h).alphaDifferentPixels,1);
const good={alphaDifferentPixels:0,rgbMeanAbsoluteError:2,rgbChannelP99:12,lumaSsim:.98};assert.doesNotThrow(()=>assertEstuaryQuality(good));for(const bad of [{alphaDifferentPixels:1},{rgbMeanAbsoluteError:2.0001},{rgbChannelP99:13},{lumaSsim:.9799}])assert.throws(()=>assertEstuaryQuality({...good,...bad}));
assert.throws(()=>measureEstuaryRgba(a,b,10,11));assert.throws(()=>measureEstuaryRgba(a,Buffer.alloc(1),w,h));console.log('PASS estuary metric identity, analytic SSIM, alpha, dimensions and all exact threshold boundaries');
