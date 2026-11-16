"""Guard actual Inkscape positional arguments without launching a new trace."""
import ast
from pathlib import Path
source=ast.parse(Path('tools/stage43-edge/trace-continuous.py').read_text())
helper=next(node for node in source.body if isinstance(node,ast.FunctionDef) and node.name=='color_trace_action')
g={};exec(compile(ast.Module(body=[helper],type_ignores=[]),'trace-action-helper','exec'),g)
f=g['color_trace_action']
assert f({})=='16,false,true,false,4,0,0'
assert f({'HONRO_TRACE_COLORS':'8'})=='8,false,true,false,4,0,0'
assert f({'HONRO_TRACE_SMOOTH':'true','HONRO_TRACE_STACK':'false','HONRO_TRACE_CORNERS':'0.2','HONRO_TRACE_OPTIMIZE':'0.1'})=='16,true,false,false,4,0.2,0.1'
print('PASS: smoothing is argument 2; stacking is argument 3; explicit angular defaults')
