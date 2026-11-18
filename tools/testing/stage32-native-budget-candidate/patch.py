from pathlib import Path
import hashlib,json
P=Path(__file__).parent;base=Path('stage32-lower-target-roi/candidate.js').read_text();assert hashlib.sha256(base.encode()).hexdigest()=='230bb60b279624b8f1cdf14ad948714de24a7447dec0a452d430a9e2c717b733'
insert='''const NATIVE_BUDGET_BYTES=48*1024*1024;
const nativeBudgetStats={plans:0,admitted:0,rejected:0,releases:0,last:null};
function nativeBudgetPreflight(c,l,route){
 if(route?.nativeLive!==true||!Number.isFinite(route.sceneScale)||route.sceneScale<=1.05)return false;
 const m=c.getTransform(),w=c.canvas.width,h=c.canvas.height;
 const paint=m.b===0&&m.c===0&&m.a>0&&m.d>0&&[m.a,m.d,m.e,m.f].every(Number.isFinite)&&c.globalAlpha===1&&(l.opacity??1)===1&&c.globalCompositeOperation==='source-over'&&(!c.filter||c.filter==='none')&&!c.shadowBlur&&!c.shadowOffsetX&&!c.shadowOffsetY;
 const y0=Math.max(0,Math.min(h,Math.floor(m.d*1716+m.f))),y1=Math.min(h,Math.ceil(m.d*1988.8+m.f)+2),rows=Math.max(0,y1-y0);
 const bytes=v=>v?v.width*v.height*4:0,current=[buffer,transitionWork,transitionColor,transitionBody,ssCanvas,lowMaskCanvas].reduce((n,v)=>n+bytes(v),0);
 // Reserve the 1x1 transition trio even before their lazy creation.
 const projected=w*h*4+(rows?w*rows*4:4)+8+(ssCanvas?4:0)+(lowMaskCanvas?4:0);
 const admitted=paint&&Number.isSafeInteger(w*h)&&w>0&&h>0&&w*h<=MAX_PIXELS&&projected<=NATIVE_BUDGET_BYTES&&!!G.document?.createElement;
 nativeBudgetStats.plans++;nativeBudgetStats.last={w,h,rows,current,projected,admitted,scope:'Post-cleanup helper-owned logical canvas bytes; not physical heap or preexisting peak'};
 if(!admitted){nativeBudgetStats.rejected++;return false;}
 const release=v=>{if(v&&(v.width!==1||v.height!==1)){v.width=1;v.height=1;nativeBudgetStats.releases++;}};
 for(const v of [ssCanvas,lowMaskCanvas,transitionColor,transitionBody])release(v);
 if(transitionWork&&(!rows||transitionWork.width!==w||transitionWork.height!==rows))release(transitionWork);
 if(buffer&&(buffer.width!==w||buffer.height!==h)){release(buffer);last=null;}
 counters.bytes=bytes(buffer);ssStats.scratchBytes=bytes(ssCanvas)+bytes(lowMaskCanvas);ssStats.readbackBytes=0;transitionMemory();nativeBudgetStats.admitted++;return true;
}
'''
s=base.replace('function canTransition(c,l){',insert+'function canTransition(c,l,nativeBudget=false){',1).replace('else if(w*h>MAX_TRANSITION_PIXELS)', 'else if(!nativeBudget&&w*h>MAX_TRANSITION_PIXELS)',1)
needle=' let q,cv;try{q=geometry(l.asset);cv=q&&material(c,field);}catch{return fallback(\'invalid-source\');}'
assert s.count(needle)==1
s=s.replace(needle," // Never clear the in-flight target during the originalOnly recursive pass.\n const nativeBudget=!originalOnly&&nativeBudgetPreflight(c,l,route);\n"+needle,1).replace('canTransition(c,l);','canTransition(c,l,nativeBudget);',1)
s=s.replace('stats:()=>({...counters,','stats:()=>({...counters,nativeBudget:{...nativeBudgetStats,limitBytes:NATIVE_BUDGET_BYTES},',1)
(P/'candidate.js').write_text(s)
# Removal and exact inverse guard.
r=s.replace('stats:()=>({...counters,nativeBudget:{...nativeBudgetStats,limitBytes:NATIVE_BUDGET_BYTES},','stats:()=>({...counters,',1).replace('canTransition(c,l,nativeBudget);','canTransition(c,l);',1).replace(" // Never clear the in-flight target during the originalOnly recursive pass.\n const nativeBudget=!originalOnly&&nativeBudgetPreflight(c,l,route);\n",'',1).replace('else if(!nativeBudget&&w*h>MAX_TRANSITION_PIXELS)','else if(w*h>MAX_TRANSITION_PIXELS)',1).replace(insert+'function canTransition(c,l,nativeBudget=false){','function canTransition(c,l){',1)
assert r==base
(P/'contract.json').write_text(json.dumps({'baseSHA256':hashlib.sha256(base.encode()).hexdigest(),'candidateSHA256':hashlib.sha256(s.encode()).hexdigest(),'inverseExact':True,'productionChanged':False},indent=2))
