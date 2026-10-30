import sys,json,xml.etree.ElementTree as E
from pathlib import Path
sys.path.insert(0,'tools/vector-production');from native_edge_depth import verified_depth
P={e.get('id'):e for e in E.parse('art/stage35-bank-silhouette-v4/play-west-master.svg').getroot().iter()if e.tag.endswith('path')}
try:verified_depth(P['path2'],P['path5'],1773,-1,1.25)
except ValueError as e:rejected=str(e)
else:raise AssertionError('Original artificial source-bottom sample must be rejected')
rows=[verified_depth(P[pid],P['path5'],1770,-1,1.25)for pid in ['path5','path4','path3','path2']]
r={'scope':'source-only join sampling regression, no geometry mutation or visual approval','originalExportEdgeRejected':rejected,'verifiedInteriorColumns':rows};Path('art/stage35-bank-silhouette-v4/native-edge-depth-regression.json').write_text(json.dumps(r,indent=2));print(json.dumps({'rejectedOriginal':True,'verifiedLayers':len(rows)}))
