"""Map the actual native trace palette back to the canonical chapter palette."""
from pathlib import Path
import json
p=Path(__file__).resolve().parents[2]/'shared/assets/environment/act5/stage44-root-exterior.json';a=json.loads(p.read_text())
old=['#fcfcfc','#a6a59e','#cda475','#988a58','#7b8268','#8c6c4a','#706a48','#705b43','#6b503a','#554735','#334634','#46372a','#352d24','#2d261d','#14211b','#121e19']
new=['#352f27','#4c5147','#d8a772','#958f53','#76864f','#916948','#65644a','#6c4e38','#6c4e38','#524635','#314b37','#4a392c','#352f27','#2c231c','#11211d','#0f1d19'];mapping=dict(zip(old,new))
def walk(n):
 if n.get('fill') in mapping:n['fill']=mapping[n['fill']]
 for c in n.get('children',[]):walk(c)
walk(a['vector']['root']);p.write_text(json.dumps(a,separators=(',',':'))+'\n')
