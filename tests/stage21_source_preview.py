"""Opt-in local browser source overlay; no release build or gate modification."""
import os,json
from urllib.parse import urlparse
from browser_support import ROOT

def install_source_preview(page):
 path=os.environ.get('HONRO_STAGE21_SOURCE_PREVIEW')
 if not path:return
 data=json.loads((ROOT/path).read_text())
 for file,body in data['patches'].items():
  page.route('**/'+file,lambda route,request,body=body,kind=('text/css' if file.endswith('.css') else 'text/javascript'):route.fulfill(status=200,content_type=kind,body=body))

def source_preview_metadata():
 path=os.environ.get('HONRO_STAGE21_SOURCE_PREVIEW')
 return json.loads((ROOT/path).read_text())['source'] if path else None
