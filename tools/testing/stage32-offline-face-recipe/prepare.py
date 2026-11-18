from pathlib import Path
import json,hashlib
p=Path('stage32-offline-face-recipe');s=Path('stage32-native-budget-candidate/candidate.js').read_text();recipe=json.load(open(p/'recipe.json'))['paths'];payload=[{k:r[k] for k in ['start','end','d']} for r in recipe]
coverage=(p/'coverage.svgpath').read_text()
code='const lowerCoverageD='+json.dumps(coverage)+';let lowerCoverage=null;\nconst offlineRecipe='+json.dumps(payload,separators=(',',':'))+';\nlet offlinePrepared=null;\n'+'''function lowerTargetROI(c,cv,q,l,b,route){
 const m=c.getTransform(),w=c.canvas.width,h=c.canvas.height,split=Math.max(0,Math.min(h,Math.floor(m.d*1716+m.f)));
 draw(c,l,b,true,route,true);if(split===h)return;
 if(!offlinePrepared)offlinePrepared=offlineRecipe.map(r=>({...r,path:new G.Path2D(r.d)}));
 c.save();c.setTransform(1,0,0,1,0,0);c.beginPath();c.rect(0,split,w,h-split);c.clip();c.setTransform(m);c.clip(q.apron);c.scale(2.2,2.2);
 if(!lowerCoverage)lowerCoverage=new G.Path2D(lowerCoverageD);c.save();c.clip(lowerCoverage);bitmap(c,cv);c.restore();
 const rgb=s=>[1,3,5].map(i=>parseInt(s.slice(i,i+2),16));
 for(const r of offlinePrepared){
  if(r.start===r.end)c.fillStyle=r.start;
  else{const g=c.createLinearGradient(0,780,0,900),a=rgb(r.start),b=rgb(r.end);for(const [t,v]of [[0,0],[.25,.15625],[.5,.5],[.75,.84375],[1,1]])g.addColorStop(t,'rgb('+a.map((q,j)=>Math.round(q+(b[j]-q)*v)).join(',')+')');c.fillStyle=g;}
  c.fill(r.path,'nonzero');
 }
 c.restore();
}
'''
a=s.index('function lowerTargetROI(');z=s.index('\nfunction draw(',a);s=s[:a]+code+s[z:];(p/'candidate.js').write_text(s);(p/'baseline.js').write_text(Path('stage32-native-budget-candidate/candidate.js').read_text());(p/'contract.json').write_text(json.dumps({'baselineSHA':hashlib.sha256((p/'baseline.js').read_bytes()).hexdigest(),'candidateSHA':hashlib.sha256(s.encode()).hexdigest(),'rows':len(recipe),'scope':'Test-only native lower final-visible vector recipe. Upper original clip unchanged geometry; new lower asset changes AA. No source or product registration modification.'},indent=2))
proof=Path('stage32-native-budget-candidate/proof.cjs').read_text().replace("'stage32-lower-target-roi/candidate.js'","__dirname+'/baseline.js'").replace('Native low-resolution no-op control only; both helper algorithms identical below cap. No Chrome high-DPR quality claim.','Native offline final-face lower recipe: not no-op; no actual Chrome claim.')
(p/'proof.cjs').write_text(proof)
