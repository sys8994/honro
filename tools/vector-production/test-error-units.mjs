import assert from'node:assert/strict';import{affineErrorToCSS,worldErrorToCSS}from'./error-units.mjs';
assert.equal(affineErrorToCSS({sourceErrorPx:.7,matrix:[2,0,0,2,0,0],maxZoom:1.25}).cssErrorBound,1.75);
assert.equal(affineErrorToCSS({sourceErrorPx:.7,matrix:[3,0,0,1.25,0,0],maxZoom:1.25}).cssErrorBound,2.6249999999999996);
assert.equal(affineErrorToCSS({sourceErrorPx:0,matrix:[3,0,0,1.25,0,0],maxZoom:1.25}).cssErrorBound,0);
assert.equal(worldErrorToCSS(.6,1.1),.66);assert.throws(()=>affineErrorToCSS({sourceErrorPx:.7,maxZoom:1}),/Explicit/);
console.log('PASS source-pixel/world/CSS units remain distinct; retained raw has zero simplification loss, not zero fitting error');
