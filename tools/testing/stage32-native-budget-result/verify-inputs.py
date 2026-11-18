from pathlib import Path
import sys,json,hashlib
p=Path(sys.argv[1]);pins=json.load(open(Path(__file__).with_name('input-pins.json')))
for name,expected in pins['files'].items():assert hashlib.sha256((p/name).read_bytes()).hexdigest()==expected,name
print('Exact original artifact metadata and PNGs:',len(pins['files']))
