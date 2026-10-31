"""Instrument a disposable QA profile-store.js; never run on a release checkout."""
import sys
from pathlib import Path
p=Path(sys.argv[1])/'shared/runtime/profile-store.js';s=p.read_text()
old="function assetSignature(text){let h=2166136261;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619);}return text.length+':'+(h>>>0).toString(16);}"
new="function assetSignature(text){const t=performance.now();try{let h=2166136261;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619);}return text.length+':'+(h>>>0).toString(16);}finally{if(globalThis.__qaHash)globalThis.__qaHash.push({kind:'hash',at:t,ms:performance.now()-t,length:text.length});}}"
assert s.count(old)==1;s=s.replace(old,new)
old="const assetText=JSON.stringify(asset);if(assetText!==row.text){"
new="const assetText=JSON.stringify(asset),eqAt=performance.now(),eq=assetText===row.text;if(globalThis.__qaHash)globalThis.__qaHash.push({kind:'equality',at:eqAt,ms:performance.now()-eqAt,length:assetText.length});if(!eq){"
assert s.count(old)==1;s=s.replace(old,new);p.write_text(s)
