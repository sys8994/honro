"""Suppress the trace's white transparency matte, never blur the silhouette."""
from pathlib import Path
import json
p=Path(__file__).resolve().parents[2]/'shared/assets/environment/act5/stage45-root-body.json';a=json.loads(p.read_text())
m={'#fdfcfc':'#332a3c','#fdfcfd':'#332a3c','#c3bbc2':'#a78aa3','#a997a4':'#a78aa3'}
def w(n):
 if n.get('fill')in m:n['fill']=m[n['fill']]
 for c in n.get('children',[]):w(c)
w(a['vector']['root']);p.write_text(json.dumps(a,separators=(',',':'))+'\n')
