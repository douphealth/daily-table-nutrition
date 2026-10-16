"""Validate images, data, Worker, links and source before creating the complete upload."""
from pathlib import Path
from urllib.parse import urljoin, urlparse, unquote
from bs4 import BeautifulSoup
import argparse, hashlib, json, re, subprocess, zipfile
ROOT=Path(__file__).resolve().parents[1];SITE=ROOT/'site';E=ROOT/'evidence';E.mkdir(exist_ok=True)
EXPECTED='1d7c49e27f223dc51c472e52afc5688de02a157b487e50a89a09506b4a877230'
hashbytes=lambda b:hashlib.sha256(b).hexdigest()
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('baseline',type=Path)
parser.add_argument('output',type=Path)
args=parser.parse_args()
assert hashbytes(args.baseline.read_bytes())==EXPECTED,'Incorrect baseline ZIP'
files={p.relative_to(SITE).as_posix():p for p in SITE.rglob('*') if p.is_file()}
with zipfile.ZipFile(args.baseline) as z:base={n:z.read(n) for n in z.namelist() if not n.endswith('/')}
assert len(files)==len(set(files))
image_ext={'.jpg','.jpeg','.png','.webp','.avif','.svg','.gif','.ico'}
images=[]
for name,b in base.items():
 if Path(name).suffix.lower() in image_ext:
  assert name in files and files[name].read_bytes()==b,'Original image changed: '+name
  images.append({'path':name,'bytes':len(b),'sha256':hashbytes(b)})
assert len(images)==645,'Unexpected baseline image count'
assert not any(p.suffix.lower() in {'.woff','.woff2','.otf','.ttf'} for p in files.values())
removed=sorted(set(base)-set(files));added=sorted(set(files)-set(base))
assert removed==sorted(['assets/chunks/photo-journey-RID4QPEM.js','assets/fonts/fraunces-latin-italic.woff2','assets/fonts/fraunces-latin.woff2','assets/fonts/inter-greek.woff2','assets/fonts/inter-latin.woff2']),removed
for name in ['_headers','_routes.json','_redirects']:
 assert base[name]==files[name].read_bytes(),name+' changed'
for name in ['assets/chunks/chunk-O3VEKXW7.js','assets/chunks/recipe-studio-ATRLWHA7.js']:
 assert base[name].decode().replace('15.5.0','15.5.1')==files[name].read_text(),name+' logic changed'
assert base['_worker.js'].decode().replace('15.5.0','15.5.1')==files['_worker.js'].read_text(),'Worker behavior changed'
before=json.loads(base['assets/data.json']);after=json.loads(files['assets/data.json'].read_text())
for key in before:
 if key not in ['build','version']:assert before[key]==after[key],key+' changed'
html={name:BeautifulSoup(p.read_text(),'html.parser') for name,p in files.items() if p.suffix=='.html'}
ids={name:{el.get('id') for el in soup.find_all(id=True)} for name,soup in html.items()}
checked=0;missing=[];fragments=[]
origin='https://daily-table.gearuptofit.com';hosts={'daily-table.gearuptofit.com','daily-table-nutrition.pages.dev'}
def check(source,ref):
 global checked
 if not ref or ref.startswith(('data:','mailto:','tel:','javascript:','blob:')) or '${' in ref:return
 u=urlparse(urljoin(origin+'/'+source,ref))
 if u.scheme not in ['http','https'] or u.hostname not in hosts or u.path.startswith('/api/'):return
 name=unquote(u.path).lstrip('/')
 if not name or name.endswith('/'):name+='index.html'
 if name not in files and name+'/index.html' in files:name+='/index.html'
 checked+=1
 if name not in files:missing.append({'source':source,'reference':ref,'path':name})
 elif u.fragment and name in ids and unquote(u.fragment) not in ids[name]:fragments.append({'source':source,'reference':ref})
for name,soup in html.items():
 for el in soup.find_all(True):
  for attr in ['src','href','poster','action']:
   if el.get(attr):check(name,el[attr])
  if el.get('srcset'):
   for part in el['srcset'].split(','):check(name,part.strip().split(' ')[0])
js_count=0
for name,p in files.items():
 if p.suffix=='.css':
  for ref in re.findall(r'url\([\"\']?([^\)\"\']+)',p.read_text()):
   if not unquote(ref).startswith('#'):check(name,ref)
 if p.suffix=='.js':
  subprocess.run(['node','--check',str(p)],check=True,capture_output=True);js_count+=1
  for ref in re.findall(r'(?:from\s*|import\s*\(?)[\"\']([^\"\']+)[\"\']',p.read_text()):
   if ref.startswith(('./','../','/')):check(name,ref)
sw=(SITE/'sw.js').read_text();cache=json.loads(re.search(r'const FILES=(\[.*?\]);',sw).group(1))
for ref in cache:check('index.html',ref)
for ref in ['/assets/chunks/photo-journey-15.5.1.js','/assets/chunks/recipe-studio-ATRLWHA7.js']:assert ref in cache
assert all(not x.startswith('/api/') for x in cache)
assert "url.pathname.startsWith('/api/')" in sw
manifest=json.loads((SITE/'manifest.webmanifest').read_text())
for item in manifest.get('icons',[])+manifest.get('screenshots',[]):check('manifest.webmanifest',item['src'])
assert not missing,json.dumps(missing[:20],indent=2)
# Local-only testing and original API/security behavior must not expose credentials.
patterns=[r'sk-proj-[A-Za-z0-9_-]{30,}',r'ghp_[A-Za-z0-9]{30,}',r'-----BEGIN (?:RSA |EC )?PRIVATE KEY-----']
text_count=0
for name,p in files.items():
 if p.suffix in {'.html','.js','.css','.json','.xml','.webmanifest'}:
  text_count+=1
  assert not any(re.search(pattern,p.read_text()) for pattern in patterns),'Credential pattern in '+name
args.output.parent.mkdir(parents=True,exist_ok=True)
with zipfile.ZipFile(args.output,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
 for name,p in sorted(files.items()):z.write(p,name)
with zipfile.ZipFile(args.output) as z:
 assert z.testzip() is None
 assert set(z.namelist())==set(files)
 for name,p in files.items():assert z.read(name)==p.read_bytes(),name
receipt={'version':'15.5.1','baselineVersion':'15.5.0','baselineSHA256':EXPECTED,'deployment':args.output.name,
 'deploymentBytes':args.output.stat().st_size,'deploymentSHA256':hashbytes(args.output.read_bytes()),'files':len(files),'htmlPages':len(html),
 'imageFilesPreserved':len(images),'imageBytesPreserved':sum(x['bytes'] for x in images),'originalRecipes':len(after['recipes']),
 'localReferencesChecked':checked,'missingLocalPaths':missing,'dynamicFragmentsNotStaticallyProved':fragments,'javascriptSyntaxChecks':js_count,
 'serviceWorkerAssets':len(cache),'removedPaths':removed,'addedPaths':added,'changedPaths':[k for k in sorted(files.keys()&base.keys()) if files[k].read_bytes()!=base[k]],
 'zipCRC':'passed','zipByteComparison':'passed','narrowCredentialScanFiles':text_count,
 'workerAndSecurity':'Worker changed only build labels. Shared security and AI studio logic unchanged apart from build labels. API routing and HTTP security headers byte-identical.',
 'scope':'Local syntax, path, archive and content checks. Not live Cloudflare, native storage/PWA, recognition or food-quality proof.'}
(E/'structure-package.json').write_text(json.dumps(receipt,indent=2)+'\n')
(E/'image-preservation.json').write_text(json.dumps({'version':'15.5.1','baselineSHA256':EXPECTED,'count':len(images),'images':images},indent=2)+'\n')
print(json.dumps({k:v for k,v in receipt.items() if k not in ['changedPaths','dynamicFragmentsNotStaticallyProved']},indent=2))
print('JS-only dynamic fragment references (not statically certified):',len(fragments))
