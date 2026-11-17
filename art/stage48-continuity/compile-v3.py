from pathlib import Path
import json,importlib.util
A=Path(__file__).resolve().parent;R=A.parents[1]
s=importlib.util.spec_from_file_location('native',R/'tools/vector-production/import-native-clip.py');m=importlib.util.module_from_spec(s);s.loader.exec_module(m)
a=m.compile_native_clip(A/'native-v3/color-partitioned.svg',A/'native-v3/alpha-raw.svg',{'id':'act5:stage48:continuous-body','name':'우물 아래 길 연속 암반','semanticLayer':'BODY','category':'rock','bounds':{'x':-1400,'y':-100,'w':4400,'h':5000},'anchor':{'x':0,'y':0},'foot':{'x':0,'y':655},'scaleRange':[1,8],'backgroundRange':[1,8],'transform':[3.426,0,0,3.43,-1300,-8],'params':{'silhouetteUnderpaint':False}})
json.dump(a,open(R/'shared/assets/environment/act5/stage48-continuous-body.json','w'),separators=(',',':'))
