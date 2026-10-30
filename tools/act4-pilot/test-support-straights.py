import importlib.util, pathlib, math
spec=importlib.util.spec_from_file_location('straight',pathlib.Path(__file__).with_name('measure-support-straights.py'));m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
def ratio(ps):
 L,runs=m.measure(ps);return sum(r['length'] for r in runs if r['length']>=80)/L
assert ratio([(0,0),(200,0)])==1
assert ratio([(x,0) for x in range(201)])==1 # subdivision is not a loophole
assert ratio([(x,.1 if x%2 else -.1) for x in range(201)])>.99 # jitter is not a loophole
assert ratio([(x,25*math.sin(math.pi*x/100)) for x in range(201)])<.3 # broad visible bends are distinguished
assert m.pieces([(-10,50),(110,50)],100,100)==[[(0.,50.),(100.,50.)]]
print('PASS straight/subdivision/jitter/broad-bend/viewport-open-line fixtures; not artwork acceptance')
