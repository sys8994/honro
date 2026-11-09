"""Native property edit of proven full-canvas trace-white underpaint only.

Original source/trace/registered RAW/alpha unchanged. Core/contact paths and
all holes are preserved. Existing mid-wood color replaces nonmaterial white.
"""
import hashlib,json,os,subprocess,sys
from pathlib import Path
from xml.etree import ElementTree as E
import numpy as np
from PIL import Image

base=Path(__file__).resolve().parent
exe=Path(sys.argv[1]).resolve()
out=base/'edge-authored';out.mkdir(exist_ok=True)
ns='http://www.w3.org/2000/svg'
E.register_namespace('',ns)
image=np.asarray(Image.open(base/'source-v2.png').convert('RGBA'))
visible=image[:,:,:3][image[:,:,3]>=128]
maximum=visible.max(axis=0).tolist()
color='#57453b'
reports=[]
for label,source in [('native-color',base/'registered8/native-color.svg'),('final-color',base/'opt-color8-fixed/precision-6.svg')]:
    dest=out/(label+'.svg')
    if dest.exists():raise RuntimeError('Refuse to overwrite authored RAW '+str(dest))
    original=E.parse(source).getroot()
    paths={p.get('id'):p for p in original.iter()if p.tag.split('}')[-1]=='path'}
    white=paths.get('path8')
    if white is None or white.get('style')!='fill:#fefefe' or len(white.get('d',''))>100:
        raise RuntimeError('Only known full-canvas native white underpaint may change')
    env=dict(os.environ,INKSCAPE_PROFILE_DIR=str(out/(label+'-profile')))
    actions='select-by-id:path8;object-set-property:fill,'+color+';export-plain-svg;export-filename:'+str(dest)+';export-do'
    args=[str(exe),str(source.resolve()),'--batch-process','--actions='+actions]
    run=subprocess.run(args,env=env,capture_output=True,text=True,encoding='utf8',errors='replace',timeout=120)
    (out/(label+'.log')).write_text(json.dumps(args)+'\n'+run.stdout+run.stderr,encoding='utf8')
    if run.returncode:raise RuntimeError('Native property edit failed')
    current={p.get('id'):p for p in E.parse(dest).getroot().iter()if p.tag.split('}')[-1]=='path'}
    if current.keys()!=paths.keys():raise RuntimeError('Native edit changed path identities')
    for key,p in paths.items():
        if current[key].get('d')!=p.get('d'):raise RuntimeError('Native edit changed curve '+key)
        if key!='path8' and current[key].get('style')!=p.get('style'):raise RuntimeError('Native edit changed core paint '+key)
    if color not in current['path8'].get('style',''):raise RuntimeError('Expected source wood color')
    reports.append({'label':label,'source':str(source),'sha256Before':hashlib.sha256(source.read_bytes()).hexdigest(),'sha256After':hashlib.sha256(dest.read_bytes()).hexdigest(),'allPathDataIdentical':True,'allOtherStylesIdentical':True,'changedOnly':'path8 full-canvas white underpaint fill:#fefefe -> '+color})
record={'scope':'Intentional source edge-underpaint color authoring, not lossless optimization','nativeVersion':subprocess.check_output([str(exe),'--version'],text=True).strip(),'sourceVisibleRgbMaximum':maximum,'sourceVisibleOpaqueRgbMedian':np.median(image[:,:,:3][image[:,:,3]>=250],axis=0).tolist(),'replacementColorFromExistingCore':color,'onlyOutOfGamutSourceColor':'#fefefe','registeredAlphaUnchanged':'registered8/native-alpha.svg','originalSourceAndNativeRawPreserved':True,'footContactTransformHoles':'unchanged; no geometry edit','rows':reports}
(out/'authorship.json').write_text(json.dumps(record,indent=2)+'\n')
print(json.dumps(record))
