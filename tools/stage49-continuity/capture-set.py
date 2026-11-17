from pathlib import Path
import json,subprocess,os,sys
R=Path(__file__).resolve().parents[2];views=json.loads((R/'_local/stage49/views.json').read_text());out=Path(sys.argv[1]);rows=[]
for view in views:
 folder=out/view['id'];env={**os.environ,'HONRO_NATIVE_OUT':str(folder),'HONRO_REFERENCE_VIEWS':json.dumps([view])}
 subprocess.run(['node','--expose-gc','tools/stage49-continuity/capture.mjs'],cwd=R,env=env,check=True)
 report=json.loads((R/folder/'report.json').read_text());rows+=report['rows']
(R/out/'report.json').write_text(json.dumps({**report,'rows':rows},indent=2))
