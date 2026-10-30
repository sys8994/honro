#!/usr/bin/env python3
"""Import native SVG through validated compiler, compact inseparable compounds without Boolean operations."""
import importlib.util,json,sys
from pathlib import Path
s=importlib.util.spec_from_file_location('warp',Path(__file__).with_name('warp-native-curves.py'));w=importlib.util.module_from_spec(s);s.loader.exec_module(w)
svg,config,out=map(Path,sys.argv[1:4]);original=w.imp.split_path
# Oversized source compounds exist only in this in-memory authoring intermediate.
# The identity curve serializer enforces unchanged conservative hole groups and <60k.
w.imp.split_path=lambda d,label,can_split=True:[d]
try:src=w.imp.compile_svg(svg.read_text(),json.loads(config.read_text()))
finally:w.imp.split_path=original
x,y,W,H=src['vector']['viewBox'];cfg={'id':src['id'],'sourceTop':[[x,y],[x+W,y]],'targetTop':[[x,y],[x+W,y]],'depthScale':1,'decorativeOverhangMaxSourceUnits':1};asset,report=w.run(src,cfg);asset['params']['compactNativeImport']={'identityTransform':True,'sourceCoordinateGrid':.001,'noBooleanOperations':True,'strictFinalPathLimit':60000};out.write_text(json.dumps(asset,separators=(',',':')));out.with_suffix('.compact.json').write_text(json.dumps(report,indent=2));print(json.dumps(report))
