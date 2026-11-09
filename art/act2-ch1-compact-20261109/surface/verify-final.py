"""Same existing engine, same registered alpha, RAW versus chosen material.

Source clipping/background removal are source edits and are not silently counted
as optimization. Full scene/browser/playing and art approval remain separate.
"""
import importlib.util,json,subprocess,sys
from pathlib import Path
from PIL import Image,ImageDraw

base=Path(__file__).resolve().parent
root=Path.cwd()
tag=sys.argv[1] if len(sys.argv)>1 else 'candidate'
role=sys.argv[2] if len(sys.argv)>2 else None
out=root/'_local/reports/act2-redesign-20261109/surface-production'/('engine-'+tag)
out.mkdir(parents=True,exist_ok=True)
spec=importlib.util.spec_from_file_location('opt',root/'tools/vector-production/optimize-svg.py')
opt=importlib.util.module_from_spec(spec)
spec.loader.exec_module(opt)
results={}
for name in ['west','central','north']:
    config=json.loads((base/(name+'-optimization-config.json')).read_text())
    errors={}
    for scale in [1,2]:
        paths={}
        for label,filename in [('raw',name+'-preview-raw.asset.json'),('final',name+'-final.asset.json')]:
            png=out/(name+'-'+label+f'-{scale}x.png')
            run=subprocess.run(['node',str(base/'render-context.mjs') if role else 'tools/vector-production/render-asset.mjs',str((root/'_local/reports/act2-redesign-20261109/surface-production'/filename) if label=='raw' else (base/filename)),str(png),str(1774*scale)]+([role] if role else []),capture_output=True,text=True)
            if run.returncode:raise RuntimeError(run.stderr)
            paths[label]=png
        errors[str(scale)]=opt.compare(paths['raw'],paths['final'],scale,config)
        if scale==1:
            aa,bb=[Image.open(paths[label]).convert('RGBA')for label in ['raw','final']]
            view=Image.new('RGBA',(aa.width*2,aa.height),'white')
            view.alpha_composite(aa);view.alpha_composite(bb,(aa.width,0))
            view.convert('RGB').save(out/(name+'-comparison.png'))
    results[name]={'errors':errors,'pass':all(row['pass']for row in errors.values())}
report={'scope':__doc__,'visualStyleContext':role or 'legacy unwrapped context','results':results,'pass':all(row['pass']for row in results.values()),'limitsUnchanged':config['limits'],'sourceToTrace':'Separate report, not measured by this same-engine optimization test','actualPlay':'NOT RUN','browser':'NOT RUN','deployment':'NOT RUN'}
(out/'comparison.json').write_text(json.dumps(report,indent=2))
print(json.dumps(report))
sys.exit(0 if report['pass'] else 2)
