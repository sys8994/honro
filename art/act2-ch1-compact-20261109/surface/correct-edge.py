"""Native source-authoring correction of proven white-mix edge passes only.

Visible source RGB maximum is measured from the original alpha>=128 pixels.
Native colors above that observed gamut are artificial white-edge mixtures;
actual stone/moss/root core paths stay unchanged. Source/trace RAW preserved.
The protected new base is the same actual native union in RAW and FINAL.
"""
import copy,hashlib,json,os,subprocess,sys
from pathlib import Path
from xml.etree import ElementTree as E
from PIL import Image
import numpy as np

base=Path(__file__).resolve().parent
exe=Path(sys.argv[1]).resolve()
ns='http://www.w3.org/2000/svg'
E.register_namespace('',ns)
soils={'west':'#816d58','central':'#756354','north':'#705c49'}
for name in ['west','central','north']:
    out=base/(name+'-edge-authored');out.mkdir(exist_ok=True)
    if (out/'native-color.svg').exists():raise RuntimeError('Refuse to overwrite authored RAW '+name)
    source=np.asarray(Image.open(base/(name+'-source-v1.png')).convert('RGBA'))
    maximum=source[:,:,:3][source[:,:,3]>=128].max(axis=0)
    raw=E.parse(base/(name+'-registered-trace16/native-color.svg')).getroot()
    final=E.parse(base/(name+'-selected-authored-color.svg')).getroot()  # immutable pre-edge precision6 proposal
    def paths(root):return [p for p in root.iter()if p.tag.split('}')[-1]=='path']
    def rgb(p):return np.array([int(p.get('style').split('#')[1][i:i+2],16)for i in [0,2,4]])
    bad=[p for p in paths(raw)if p.get('style')!='fill:#fdfdfd'and np.any(rgb(p)>maximum)]
    bad_styles=[p.get('style')for p in bad]
    if len(bad)not in [6,7]:raise RuntimeError('Unexpected edge-gamut classification '+name)
    root=E.Element('{'+ns+'}svg',{'width':'1774','height':'887','viewBox':'0 0 1774 887'})
    for i,p in enumerate(bad):
        q=copy.deepcopy(p);q.set('id','edge'+str(i));q.set('style','fill:'+soils[name]);root.append(q)
    inp=out/'union-input.svg';dest=out/'base-union.svg'
    E.ElementTree(root).write(inp,encoding='utf8',xml_declaration=True)
    action='select-by-id:'+','.join('edge'+str(i)for i in range(len(bad)))+';path-union;export-plain-svg;export-filename:'+str(dest)+';export-do'
    args=[str(exe),str(inp),'--batch-process','--actions='+action]
    env=dict(os.environ,INKSCAPE_PROFILE_DIR=str(out/'inkscape-profile'))
    run=subprocess.run(args,env=env,capture_output=True,text=True,encoding='utf8',errors='replace',timeout=120)
    (out/'native-union.log').write_text(json.dumps(args)+'\n'+run.stdout+run.stderr,encoding='utf8')
    ps=paths(E.parse(dest).getroot())
    if run.returncode or len(ps)!=1:raise RuntimeError('Native edge union failed '+name)
    union=copy.deepcopy(ps[0]);union.set('style','fill:'+soils[name]);union.set('id','source-authored-edge-base')
    for label,tree in [('native-color',raw),('final-color',final)]:
        result=E.Element('{'+ns+'}svg',{'width':'1774','height':'887','viewBox':'0 0 1774 887'})
        result.append(copy.deepcopy(union))
        for p in paths(tree):
            if p.get('style')not in bad_styles+['fill:#fdfdfd']:result.append(copy.deepcopy(p))
        E.ElementTree(result).write(out/(label+'.svg'),encoding='utf8',xml_declaration=True)
    report={'scope':'Intentional source edge-color correction, not lossless optimization','sourceVisibleRgbMaximum':maximum.tolist(),'sourceNoWhiteMaterial':True,'correctedEdgeStyles':bad_styles,'rootsoilColor':soils[name],'nativeUnion':True,'coreStylesPreserved':[p.get('style')for p in paths(raw)if p.get('style')not in bad_styles+['fill:#fdfdfd']],'sameUnionRawFinal':True,'alphaUnchanged':'../'+name+'-registered-trace16/native-alpha.svg','originalNativeRawPreserved':'../'+name+'-trace16/raw.svg'}
    (out/'authorship.json').write_text(json.dumps(report,indent=2))
    print(json.dumps({'id':name,'edgePasses':len(bad),'rawBytes':(out/'native-color.svg').stat().st_size,'finalBytes':(out/'final-color.svg').stat().st_size}),flush=True)
