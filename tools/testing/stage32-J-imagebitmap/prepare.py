from pathlib import Path
import hashlib,json
p=Path(__file__).parent
s=Path('stage32-offline-on-5b/production/shared/runtime/stage32-foundation-art.js').read_text();out=s;changes=[]
def change(a,b):
 global out
 assert out.count(a)==1,(a[:70],out.count(a));out=out.replace(a,b);changes.append({'before':a,'after':b})
change('let buffer=null,bufferContext=null,last=null;', '''let buffer=null,bufferContext=null,last=null;
let fieldImage=null;
const imageStats={created:0,closed:0,bytes:0,peakBytes:0,transferMs:0,closeMs:0,unsupported:0};
function imageSupported(){return typeof G.OffscreenCanvas==='function'&&typeof G.OffscreenCanvas.prototype.transferToImageBitmap==='function';}
function closeFieldImage(){if(fieldImage){const t=G.performance.now();fieldImage.close();imageStats.closeMs+=G.performance.now()-t;imageStats.closed++;fieldImage=null;imageStats.bytes=0;}}
''')
change('const projected=w*h*4+(rows?w*rows*4:4)+8+(ssCanvas?4:0)+(lowMaskCanvas?4:0);','const projected=w*h*(imageSupported()?8:4)+(rows?w*rows*4:4)+8+(ssCanvas?4:0)+(lowMaskCanvas?4:0);')
change('current=[buffer,transitionWork,transitionColor,transitionBody,ssCanvas,lowMaskCanvas].reduce((n,v)=>n+bytes(v),0);','current=[buffer,transitionWork,transitionColor,transitionBody,ssCanvas,lowMaskCanvas].reduce((n,v)=>n+bytes(v),0)+imageStats.bytes;')
change("if(buffer&&(buffer.width!==w||buffer.height!==h)){release(buffer);last=null;}","if(buffer&&(buffer.width!==w||buffer.height!==h)){closeFieldImage();release(buffer);last=null;}")
change('function material(c,asset){','function material(c,asset,wantImage=false){')
change("const style=G.HonroVisualStyle?.key?.()||'',key=[w,h,...matrix,style].join('|');", "const useImage=wantImage&&imageSupported();if(wantImage&&!useImage)imageStats.unsupported++;\n const style=G.HonroVisualStyle?.key?.()||'',key=[w,h,...matrix,style,useImage?'image':'canvas'].join('|');")
change('if(last?.context===c&&last.asset===asset&&last.key===key){counters.hits++;return buffer;}', 'if(last?.context===c&&last.asset===asset&&last.key===key){counters.hits++;return fieldImage||buffer;}\n closeFieldImage();last=null;')
change('last={context:c,asset,key};return buffer;', '''if(useImage){const t=G.performance.now();fieldImage=buffer.transferToImageBitmap();imageStats.transferMs+=G.performance.now()-t;imageStats.created++;imageStats.bytes=fieldImage.width*fieldImage.height*4;imageStats.peakBytes=Math.max(imageStats.peakBytes,imageStats.bytes);}
 last={context:c,asset,key};return fieldImage||buffer;''')
change('cv=q&&material(c,field);','cv=q&&material(c,field,nativeBudget||(originalOnly&&inheritedReplacement&&!!fieldImage));')
change('const replaceLiveSS=route?.nativeLive', "if(id===BODY&&!originalOnly&&!transition&&fieldImage&&cv===fieldImage){cv=material(c,field,false);if(!cv)return fallback('image-transition-unavailable');}\n const replaceLiveSS=route?.nativeLive")
change('stats:()=>({...counters,nativeBudget:', 'stats:()=>({...counters,imageBitmap:{...imageStats},nativeBudget:')
change('totalLogicalBytes:counters.bytes+transitionCounters.bytes+ssStats.scratchBytes','totalLogicalBytes:counters.bytes+transitionCounters.bytes+ssStats.scratchBytes+imageStats.bytes')
change('clear:()=>{for(const cv of [ssCanvas,lowMaskCanvas])','clear:()=>{closeFieldImage();for(const cv of [ssCanvas,lowMaskCanvas])')
r=out
for c in reversed(changes):
 assert r.count(c['after'])==1;r=r.replace(c['after'],c['before'])
assert r==s
(p/'baseline.js').write_text(s);(p/'candidate.js').write_text(out)
(p/'contract.json').write_text(json.dumps({'baselineSHA':hashlib.sha256(s.encode()).hexdigest(),'candidateSHA':hashlib.sha256(out.encode()).hexdigest(),'inverseExact':True,'changes':changes},indent=2))
print(hashlib.sha256(out.encode()).hexdigest())
