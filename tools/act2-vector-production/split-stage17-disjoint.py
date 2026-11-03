"""Register opaque disjoint RAW contours without changing their geometry or holes.

Only split bbox-disconnected components. Overlapping/nested contours stay in one
fill; runtime limits remain unchanged. Initial relative movetos become absolute
using the parsed current point; exact parsed path equality is mandatory.
"""
import copy, hashlib, json, re, sys, xml.etree.ElementTree as E
from pathlib import Path
from svgpathtools import parse_path
source, output = map(Path, sys.argv[1:3]); tree = E.parse(source); rows = []
for parent in list(tree.iter()):
 for element in list(parent):
  d = element.get('d', '')
  if not element.tag.endswith('path') or len(d) <= 240000: continue
  style = element.get('style', '')
  paint = dict(x.split(':', 1) for x in style.split(';') if ':' in x)
  assert paint.get('stroke', 'none') == 'none' and float(paint.get('fill-opacity', 1)) == 1 and float(paint.get('opacity', 1)) == 1
  texts = re.findall(r'[Mm][^Mm]*', d); subs = parse_path(d).continuous_subpaths()
  assert len(texts) == len(subs)
  boxes = [s.bbox() for s in subs]; parents = list(range(len(subs)))
  def root(i):
   while parents[i] != i: i = parents[i]
   return i
  for i, a in enumerate(boxes):
   for j, b in enumerate(boxes[:i]):
    if a[0] <= b[1] and b[0] <= a[1] and a[2] <= b[3] and b[2] <= a[3]: parents[root(i)] = root(j)
  groups = {}
  number = r'[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?'
  for i, (original, sub) in enumerate(zip(texts, subs)):
   prefix = re.match(r'[Mm]\s*('+number+r')[ ,]*('+number+r')', original); assert prefix
   tail = original[prefix.end():]
   if original[0] == 'm' and re.match(r'\s*[-+0-9.]', tail): tail = 'l'+tail
   rewritten = 'M'+repr(sub[0].start.real)+','+repr(sub[0].start.imag)+tail
   assert parse_path(rewritten) == sub, 'Contour changed'
   groups.setdefault(root(i), []).append(rewritten)
  index = list(parent).index(element); sizes = []
  for i, contours in enumerate(groups.values()):
   text = ' '.join(contours); assert len(text) <= 240000, 'Connected group still over runtime budget'
   clone = copy.deepcopy(element); clone.set('d', text); clone.set('id', element.get('id', 'path')+'-disjoint-'+str(i)); parent.insert(index+i, clone); sizes.append(len(text))
  parent.remove(element); rows.append({'originalChars':len(d), 'groupChars':sizes, 'bboxDisconnected':True, 'parsedContourEquality':True})
E.register_namespace('', 'http://www.w3.org/2000/svg'); tree.write(output, encoding='utf-8', xml_declaration=True)
output.with_suffix('.split.json').write_text(json.dumps({'sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'outputSha256':hashlib.sha256(output.read_bytes()).hexdigest(),'groups':rows,'limitsUnchanged':True},indent=2)+'\n')
print(output)
