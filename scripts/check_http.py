"""Verify local static HTTP assets. Does not execute the Cloudflare Worker or any AI call."""
from pathlib import Path
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from urllib.parse import quote
from urllib.request import urlopen
import functools, json, threading
ROOT=Path(__file__).resolve().parents[1];SITE=ROOT/'site'
class Handler(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Handler,directory=str(SITE)))
thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
checks=0
try:
 for p in sorted(SITE.rglob('*')):
  if not p.is_file() or p.name.startswith('_'):continue
  path=p.relative_to(SITE).as_posix()
  with urlopen('http://127.0.0.1:'+str(server.server_port)+'/'+quote(path),timeout=10) as response:
   assert response.status==200 and response.read()==p.read_bytes(),path
  checks+=1
finally:
 server.shutdown();server.server_close();thread.join(timeout=5)
r={'version':'15.5.1','passed':checks,'failed':0,'scope':'Local static server byte comparison. Not a Cloudflare deployment, API, HTTPS, CSP or service-worker test.'}
(ROOT/'evidence/http-assets.json').write_text(json.dumps(r,indent=2));print(json.dumps(r))
