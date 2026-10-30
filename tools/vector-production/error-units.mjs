/** Explicit coordinate-unit conversion; does not approve any optimized art. */
export function affineErrorToCSS({sourceErrorPx,matrix,maxZoom}){
 if(!(Number.isFinite(sourceErrorPx)&&sourceErrorPx>=0&&Number.isFinite(maxZoom)&&maxZoom>0&&matrix?.length===6&&matrix.every(Number.isFinite)))throw Error('Explicit source-pixel error, affine source→world matrix and maximum CSS zoom required');
 const[a,b,c,d]=matrix,q=a*a+b*b+c*c+d*d,det=a*d-b*c,sigma=Math.sqrt((q+Math.sqrt(Math.max(0,q*q-4*det*det)))/2);
 return {sourceErrorPx,maxWorldScale:sigma,maxZoom,worldErrorBound:sourceErrorPx*sigma,cssErrorBound:sourceErrorPx*sigma*maxZoom,scope:'Affine bound only. Nonlinear/piecewise warp needs its own maximum Jacobian or direct target-resolution pixel measurement.'};
}
export function worldErrorToCSS(worldError,maxZoom){if(!(worldError>=0&&Number.isFinite(worldError)&&maxZoom>0&&Number.isFinite(maxZoom)))throw Error('Finite world-error and CSS zoom required');return worldError*maxZoom;}
