"""Remove color-trace white matte hidden behind native alpha, preserving geometry."""
from pathlib import Path
import json
p=Path(__file__).resolve().parents[2]/'shared/assets/environment/act5/stage43-foundation.json';a=json.loads(p.read_text())
def f(n):
 if n.get('fill')=='#fdfdfd':n['fill']='#273548'
 for c in n.get('children',[]):f(c)
f(a['vector']['root']);a['params']['matteCorrection']='white trace underpaint -> source-compatible #273548; paths and alpha unchanged';p.write_text(json.dumps(a,separators=(',',':'))+'\n')
