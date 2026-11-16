from pathlib import Path
import json
p=Path('shared/assets/environment/act5/stage44-upper-canopy.json');a=json.loads(p.read_text())
old=['#a4a7a0','#cba06f','#7d8681','#8e8752','#7b825e','#8b6c4a','#6b6a4b','#6b503a','#534835','#483a2d','#324532','#343127','#2b251d','#1b2a21','#14221c']
new=['#4c5147','#d8a772','#4c5147','#958f53','#76864f','#916948','#65644a','#6c4e38','#524635','#4a392c','#314b37','#352f27','#2c231c','#11211d','#0f1d19'];m=dict(zip(old,new))
def walk(n):
 if n.get('fill') in m:n['fill']=m[n['fill']]
 for c in n.get('children',[]):walk(c)
walk(a['vector']['root']);a['params'].update(nonplayEnvironment=True,silhouetteUnderpaint=False);p.write_text(json.dumps(a,separators=(',',':'))+'\n')
