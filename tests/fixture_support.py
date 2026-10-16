"""In-memory Chromium harness. Real shipped HTML/CSS/JS, explicit local HTTP, storage,
security and provider fixtures. Browser navigation is blocked by environment policy.
No paid service call, Cloudflare deployment or native PWA/secure-context certification.
"""
from pathlib import Path
from urllib.parse import urlparse
import json, hashlib, mimetypes, sys, time, os, shutil
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright
ROOT=Path(sys.argv[1]) if len(sys.argv)>1 else Path(__file__).resolve().parents[1]/'site'
REPORT=ROOT.parent/'evidence';REPORT.mkdir(exist_ok=True)
KEY='dtable:workspace:v2'
OBS={'version':'3.0.0','build':'15.4.0','provider':'Local test fixture','model':'simulated-not-a-benchmark','scene':'ingredients','quality':'good','issues':[], 'items':[
 {'name':'tomato','form':'raw','certainty':'clear','evidence_kind':'visual','evidence':'Example observation supplied by the test harness.','alternatives':[]},
 {'name':'cucumber','form':'raw','certainty':'clear','evidence_kind':'visual','evidence':'Example observation supplied by the test harness.','alternatives':[]},
 {'name':'unidentified herb','form':'raw','certainty':'uncertain','evidence_kind':'uncertain','evidence':'Needs identification by the person using the app.','alternatives':[]}]}
results=[];errors=[]
def check(name,test):
 try:
  assert test, name
  results.append({'name':name,'status':'passed'});print('PASS',name,flush=True)
 except Exception as exc:
  results.append({'name':name,'status':'FAILED','error':str(exc)});raise

def launch_browser(playwright):
 """Use an explicit Chromium, a system Chromium, or the installed Playwright browser."""
 executable=os.environ.get('CHROMIUM_EXECUTABLE') or shutil.which('chromium') or shutil.which('chromium-browser')
 options={'headless':True}
 if executable:options['executable_path']=executable
 if hasattr(os,'geteuid') and os.geteuid()==0:options['args']=['--no-sandbox']
 return playwright.chromium.launch(**options)

class Fixture:
 def __init__(self,browser,routepath='pantry/index.html',state=None,width=1440,query='',entries=None,now=None):
  self.ctx=browser.new_context(viewport={'width':width,'height':1000},device_scale_factor=1)
  self.page=self.ctx.new_page();self.page.set_default_timeout(8000);self.calls=[];self.requests=[];self.pending=[];self.mode='hold';self.fail_config=False;self.security_calls=[];self.security_mode='success'
  self.page.on('pageerror',lambda error:errors.append(str(error)))
  self.page.route('**/*',self.route)
  self.persisted=dict(entries if entries is not None else ([[KEY,json.dumps(state)]] if state else []))
  def persist(k,v):
   if v is None:self.persisted.pop(k,None)
   else:self.persisted[k]=v
  self.page.expose_function('fixturePersist',persist)
  self.page.expose_function('fixtureDigest',lambda values:list(hashlib.sha256(bytes(values)).digest()))
  self.page.evaluate('''(entries)=>{
   const store=new Map(entries);window.__fixtureStore=store;
   Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>store.get(k)??null,setItem:(k,v)=>{if(window.__storageFail)throw new DOMException('Quota exceeded','QuotaExceededError');store.set(k,String(v));window.fixturePersist(k,String(v));},removeItem:k=>{store.delete(k);window.fixturePersist(k,null);},clear:()=>store.clear(),key:i=>[...store.keys()][i]??null,get length(){return store.size;}}});
   Object.defineProperty(crypto,'subtle',{value:{digest:async(type,bytes)=>new Uint8Array(await window.fixtureDigest([...new Uint8Array(bytes)])).buffer}});
   window.confirm=()=>true;window.addEventListener('beforeunload',()=>{window.name=JSON.stringify([...store]);});
   window.__widgets=[];window.__removed=[];window.__resets=0;
   window.turnstile={render:(element,options)=>{window.__challenge=options;const id='fixture-'+window.__widgets.length;window.__widgets.push({id,options,element});element.textContent='SIMULATED security widget (test only)';return id;},remove:(id)=>{window.__removed.push(id)},reset:()=>{window.__resets++}};
  }''',entries if entries is not None else ([[KEY,json.dumps(state)]] if state else []))
  soup=BeautifulSoup((ROOT/routepath).read_text(),'html.parser')
  for el in soup.select('meta[http-equiv="Content-Security-Policy"]'):el.decompose()
  base=soup.new_tag('base',href='https://daily-table-fixture.test/');soup.head.insert(0,base)
  if query:soup.body['data-recipe-query']=query
  if now:
   from datetime import datetime
   self.page.clock.set_fixed_time(datetime.fromisoformat(now))
  self.page.set_content(str(soup),wait_until='load',timeout=15000)
  self.page.wait_for_function("document.documentElement.dataset.appReady === 'true'",timeout=15000)
 def route(self,route):
  u=urlparse(route.request.url);path=u.path;self.requests.append(path)
  hdr={'Access-Control-Allow-Origin':'*'}
  if path=='/api/vision/status':
   route.fulfill(status=200,content_type='application/json',headers=hdr,body=json.dumps({'version':'3.0.0','build':'15.4.0','enabled':not self.fail_config,'provider':'Local test fixture','model':'simulated-not-a-benchmark','siteKey':'fixture-public','missing':[]}));return
  if path=='/api/security/check':
   body=json.loads(route.request.post_data);self.security_calls.append(body)
   value={'version':'1.0.0','build':'15.4.0','ok':True,'hostname':'daily-table-fixture.test','action':body['action'],'noInference':True,'requestId':'test-security-id'} if self.security_mode=='success' else {'ok':False,'requestId':'test-security-fail','error':{'code':self.security_mode,'message':'Security failed'}}
   route.fulfill(status=200 if self.security_mode=='success' else 403,content_type='application/json',headers=hdr,body=json.dumps(value));return
  if path=='/api/recipes/status':
   route.fulfill(status=200,content_type='application/json',headers=hdr,body=json.dumps({'version':'1.0.0','build':'15.4.0','enabled':True,'siteKey':'fixture-public','provider':'Test fixture','model':'mock'}));return
  if path=='/api/vision/analyze':
   self.calls.append({'method':route.request.method,'url':path})
   if self.mode=='hold':self.pending.append(route);return
   if self.mode=='error':route.fulfill(status=429,content_type='application/json',headers=hdr,body=json.dumps({'error':{'message':'Test fixture: provider quota exhausted.'}}));return
   if self.mode=='malformed':route.fulfill(status=200,content_type='application/json',headers=hdr,body='{}');return
   route.fulfill(status=200,content_type='application/json',headers=hdr,body=json.dumps(OBS));return
  file=(ROOT/path.lstrip('/')).resolve()
  if u.hostname!='daily-table-fixture.test' or not file.is_relative_to(ROOT.resolve()) or not file.is_file():route.abort();return
  typ=mimetypes.guess_type(file.name)[0] or 'application/octet-stream'
  if file.suffix=='.js':typ='application/javascript'
  route.fulfill(status=200,headers=hdr,content_type=typ,body=file.read_bytes())
 def state(self):return self.page.evaluate('(k)=>JSON.parse(localStorage.getItem(k)||"null")',KEY)
 def select(self):
  if self.page.locator('#dt-photo-fold').count():self.page.locator('#dt-photo-fold').evaluate('(el)=>el.open=true')
  self.page.locator('#pantry-photo').set_input_files(str(Path(__file__).parent/'photo-fixture.jpg'))
  self.page.wait_for_function("!document.querySelector('#photo-preview-wrap').hidden")
 def analyze(self):
  
  if self.page.locator('#photo-consent').is_visible():self.page.locator('#photo-consent').check()
  self.page.locator('#photo-analyze').click()
  self.page.wait_for_function('!!window.__challenge')
 def release_security(self):self.page.evaluate("window.__challenge.callback('fixture-verification-token')")
 def release(self,payload=OBS):
  deadline=time.monotonic()+3
  while not self.pending and time.monotonic()<deadline:self.page.wait_for_timeout(20)
  assert self.pending, "No intercepted inference request arrived"
  self.pending.pop(0).fulfill(status=200,content_type='application/json',headers={'Access-Control-Allow-Origin':'*'},body=json.dumps(payload))
 def shot(self,name,selector=None):
  self.page.evaluate('''()=>{let el=document.getElementById('fixture-label');if(!el){el=document.createElement('div');el.id='fixture-label';el.textContent='LOCAL UI TEST / simulated security and AI response - not a recognition benchmark';el.style.cssText='position:fixed;top:0;left:0;right:0;z-index:9999;padding:6px 12px;background:#243c2e;color:white;font:11px system-ui;text-align:center';document.body.append(el);}}''')
  if selector:self.page.eval_on_selector(selector,"el=>window.scrollTo({top:Math.max(0,window.scrollY+el.getBoundingClientRect().top-110),behavior:'instant'})")
  self.page.screenshot(path=str(REPORT/name),full_page=False)
 def close(self):
  for route in self.pending:
   try:route.abort()
   except Exception:pass
  self.pending.clear();self.page.wait_for_timeout(40);self.ctx.close()
