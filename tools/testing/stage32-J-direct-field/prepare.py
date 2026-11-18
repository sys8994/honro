from pathlib import Path
import hashlib,json
p=Path('stage32-J-direct-field');base=Path('stage32-offline-on-5b/production/shared/runtime/stage32-foundation-art.js').read_text();assert hashlib.sha256(base.encode()).hexdigest()=='6823eda0e8d3c5250396c857f09f96ee3eba8fbfba124af540d080a5a76d03c7'
a="function bitmap(c,cv){c.save();c.setTransform(1,0,0,1,0,0);c.drawImage(cv,0,0);c.restore();}"
b="""function bitmap(c,cv){
 if(cv.directField){c.save();c.setTransform(...cv.matrix);c.translate(-5500,-1950);c.scale(7.2,7.2);c.transform(...cv.directField.fieldTransform);for(const n of cv.directField.field){c.fillStyle=n.fill;c.fill(n.path);}c.restore();return;}
 c.save();c.setTransform(1,0,0,1,0,0);c.drawImage(cv,0,0);c.restore();
}"""
x=""" let q,cv;try{q=geometry(l.asset);cv=q&&material(c,field);}catch{return fallback('invalid-source');}
 if(!q||!cv)return fallback('invalid-source-or-device-pixel-cap');
 const transition=id===BODY&&!originalOnly&&canTransition(c,l,nativeBudget);"""
y=""" const transition=id===BODY&&!originalOnly&&canTransition(c,l,nativeBudget);
 const directEligible=route?.nativeLive===true&&route.sceneScale>1.05&&(id===FOUNDATION?nativeBudget:transition||(originalOnly&&inheritedReplacement));
 let q,cv;try{q=geometry(l.asset);if(q&&directEligible){const m=c.getTransform();cv={width:c.canvas.width,height:c.canvas.height,directField:geometry(field),matrix:[m.a,m.b,m.c,m.d,m.e,m.f]};if(!cv.directField)cv=null;}else cv=q&&material(c,field);}catch{return fallback('invalid-source');}
 if(!q||!cv)return fallback('invalid-source-or-device-pixel-cap');"""
assert base.count(a)==base.count(x)==1
s=base.replace(a,b).replace(x,y);assert s.replace(b,a).replace(y,x)==base
(p/'baseline.js').write_text(base);(p/'candidate.js').write_text(s)
(p/'contract.json').write_text(json.dumps({'baseSHA':hashlib.sha256(base.encode()).hexdigest(),'candidateSHA':hashlib.sha256(s.encode()).hexdigest(),'reverseExact':True,'scope':'Native admitted route only; direct original field primitives replace shared bitmap sampling. Cached path unchanged; AA differences not presumed safe.'},indent=2)+'\n')
proof=Path('stage32-offline-apron-reset/proof.cjs').read_text();(p/'proof.cjs').write_text(proof)
