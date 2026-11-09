"""Actual existing HonroVectorArt raw/final comparison; no artwork approval."""
import copy,hashlib,importlib.util,json,subprocess,sys
from pathlib import Path
from xml.etree import ElementTree as E
from PIL import Image,ImageDraw

base=Path(__file__).resolve().parent;root=Path.cwd();out=root/('_local/reports/act2-redesign-20261109/upper-pine-final'+('-'+'-'.join(sys.argv[1:]) if len(sys.argv)>1 else ''));out.mkdir(parents=True,exist_ok=True)
s=importlib.util.spec_from_file_location('native_clip',root/'tools/vector-production/import-native-clip.py');adapter=importlib.util.module_from_spec(s);s.loader.exec_module(adapter)
s=importlib.util.spec_from_file_location('optimizer',root/'tools/vector-production/optimize-svg.py');opt=importlib.util.module_from_spec(s);s.loader.exec_module(opt)
report=json.loads((root/'_local/reports/act2-redesign-20261109/upper-pine-production/opt-color8-fixed/report.json').read_text(encoding='utf8'));chosen=sys.argv[1] if len(sys.argv)>1 else 'precision-6';assert chosen and report['rawUnchanged']
source=base/'registered8/native-color.svg';selected=base/'opt-color8-fixed'/(chosen+'.svg');alpha=base/'registered8/native-alpha.svg';config=json.loads((base/'asset-source-config.json').read_text());metrics_config=json.loads((base/'optimization-config.json').read_text())
role=sys.argv[2] if len(sys.argv)>2 else None
if (base/'edge-authored/native-color.svg').exists():
    assert chosen=='precision-6','Source-authored edge currently validated only with precision6core'
    source=base/'edge-authored/native-color.svg';selected=base/'edge-authored/final-color.svg'
assets={}
for label,color in [('raw',source),('final',selected)]:
    asset=adapter.compile_native_clip(color,alpha,config);file=out/(label+'.asset.json');file.write_text(json.dumps(asset,separators=(',',':'))+'\n');assets[label]=file
results={};timings={}
for scale in[1,2]:
    for label,file in assets.items():
        png=out/(label+f'-{scale}x.png');r=subprocess.run(['node','art/act2-ch1-compact-20261109/surface/render-context.mjs' if role else 'tools/vector-production/render-asset.mjs',str(file),str(png),str(1774*scale)]+([role] if role else []),capture_output=True,text=True)
        if r.returncode:raise RuntimeError(r.stderr)
        timings[label+'-'+str(scale)]=json.loads(r.stdout)
    results[str(scale)]=opt.compare(out/f'raw-{scale}x.png',out/f'final-{scale}x.png',scale,metrics_config)
    aa,bb=[Image.open(out/(label+f'-{scale}x.png')).convert('RGBA')for label in ['raw','final']]
    sheet=Image.new('RGBA',(aa.width*2,aa.height+28),'white');sheet.alpha_composite(aa,(0,28));sheet.alpha_composite(bb,(aa.width,28));d=ImageDraw.Draw(sheet);d.text((8,6),'RAW - REGISTERED',fill='black');d.text((aa.width+8,6),'FINAL CANDIDATE - NOT ART APPROVAL',fill='black');sheet.convert('RGB').save(out/f'comparison-{scale}x.png')
    if scale==2:
        for name,box in [('contact',(1250,460,430,190)),('root',(700,650,450,190)),('fork-hole',(520,450,650,200))]:
            x,y,w,h=box;rect=(x*scale,y*scale,(x+w)*scale,(y+h)*scale);a,b=aa.crop(rect),bb.crop(rect);z=Image.new('RGBA',(a.width*2,a.height),'white');z.alpha_composite(a,(0,0));z.alpha_composite(b,(a.width,0));z.convert('RGB').save(out/(name+'-200pct.png'))
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
result={'scope':'Registered raw color/alpha versus chosen optimized color + SAME immutable registered alpha, through actual unchanged HonroVectorArt renderer at1x/2x. Not final scene/art/browser/play approval.','chosen':chosen,'visualStyleContext':role or 'legacy unwrapped context','optimizerChosenVerified':chosen==report['chosen'],'selectionReason':'More conservative candidate checked through actual engine; color-only optimizer selection may fail protected alpha boundary','rawColorSha256':sha(source),'finalColorSha256':sha(selected),'alphaSha256':sha(alpha),'sameAlphaBoth':True,'errors':results,'timings':timings,'qualityPass':all(r['pass']for r in results.values()),'limitsUnchanged':metrics_config['limits'],'visualApproval':'PENDING direct inspection','report':str(out/'comparison.json')}
(out/'comparison.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps({'qualityPass':result['qualityPass'],'errors':results,'report':result['report']}));sys.exit(0 if result['qualityPass'] else 2)
