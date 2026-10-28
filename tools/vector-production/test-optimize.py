import importlib.util, tempfile
from pathlib import Path
from PIL import Image,ImageDraw
s=importlib.util.spec_from_file_location('opt',Path(__file__).with_name('optimize-svg.py'));o=importlib.util.module_from_spec(s);s.loader.exec_module(o)
with tempfile.TemporaryDirectory() as d:
 a=Path(d)/'a.png';b=Path(d)/'b.png';im=Image.new('RGBA',(100,100));ImageDraw.Draw(im).rectangle((10,10,80,80),fill='#345678');im.save(a);im.save(b)
 c={'protectedRects':[[0,0,100,100]],'sourcePalette':[[52,86,120]]}
 assert o.compare(a,b,1,c)['pass']
 moved=Image.new('RGBA',(100,100));ImageDraw.Draw(moved).rectangle((14,10,84,80),fill='#345678');moved.save(b)
 r=o.compare(a,b,1,c);assert not r['pass'] and r['silhouetteMaxOffsetPx']==4
 # Important small feature: low global mean cannot override a protected detail.
 im=Image.new('RGBA',(100,100),'white');ImageDraw.Draw(im).rectangle((40,40,42,42),fill='black');im.save(a);Image.new('RGBA',(100,100),'white').save(b)
 r=o.compare(a,b,1,{'protectedRects':[[35,35,15,15]],'sourcePalette':[[0,0,0],[255,255,255]]});assert r['rgbMAE255']<2 and not r['pass']
 svg=Path(d)/'counts.svg';svg.write_text('<svg><path d="M0 0l1 0 1 0 1 0z"/></svg>');r=o.stats(svg);assert r['segments']==4 and r['commands']==5
 print('PASS: identity, edge offset, small protected feature failure, implicit path command accounting')
