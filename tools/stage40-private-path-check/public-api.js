// Public pressure test uses two fresh data objects, never registered author vectors.
()=>{
 const H=globalThis.HonroVectorArt;
 if(typeof H?.prepare!=='function')throw Error('actual public prepare missing');
 const proto={version:H.VERSION,viewBox:[0,0,128,128],root:{tag:'g',children:[{tag:'path',d:'M2 3h10v10h-10z',fill:'#123456'}]}};
 const x=structuredClone(proto),y=structuredClone(proto);
 const a=H.prepare(x).root.children[0].path,b=H.prepare(y).root.children[0].path;
 const c=document.createElement('canvas').getContext('2d'),check=(p,x,y)=>c.isPointInPath(p,x,y);
 const before=[check(a,5,6),check(b,5,6),check(a,45,46),check(b,45,46)];
 Object.freeze(a);a.addPath(new Path2D('M40 40h12v12h-12z'));
 const after=[check(a,5,6),check(b,5,6),check(a,45,46),check(b,45,46)];
 return {separate:a!==b,stablePerVector:a===H.prepare(x).root.children[0].path,before,after};
}
