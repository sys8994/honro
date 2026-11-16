from pathlib import Path
from lxml import etree as E
import os,subprocess,json,sys
root=Path(__file__).resolve().parents[2];out=Path(sys.argv[1]).resolve();ns='{http://www.w3.org/2000/svg}'
for kind in ['color','alpha']:
 t=E.parse(str(out/f'{kind}-raw.svg'));acts=[]
 for i,p in enumerate(t.findall('.//'+ns+'path')):
  mid=f'lower-{i}';E.SubElement(p.getparent(),ns+'path',id=mid,d='M0 580L130 560L169 520L185 480L200 450H205V575.88H1970V450H1985L2010 490L2040 550L2172 580V724H0Z',style='fill:#000000');acts+=['select-clear',f'select-by-id:{p.get("id")},{mid}','path-intersection']
 src=out/f'{kind}-lower-input.svg';dest=out/f'{kind}-lower.svg';t.write(str(src));acts+=['select-clear','export-plain-svg',f'export-filename:{dest}','export-do'];p=subprocess.run(['/usr/bin/inkscape',str(src),'--batch-process','--actions='+';'.join(acts)],capture_output=True,text=True,env={**os.environ,'LD_PRELOAD':'/tmp/honro-inkscape-headless-init.so','INKSCAPE_PROFILE_DIR':str(out/'profile')});(out/f'{kind}-lower.log').write_text(p.stdout+p.stderr);p.check_returncode()
c={'id':'act5:stage43:foundation','semanticLayer':'BODY','bounds':{'x':-215,'y':709,'w':2586,'h':181},'anchor':{'x':0,'y':0},'foot':{'x':0,'y':890},'preserveCompounds':True,'transform':[1/.84,0,0,1/.82,-180/.84,5.5/.82]};(root/'art/stage43-edge/config.json').write_text(json.dumps(c,indent=2))
