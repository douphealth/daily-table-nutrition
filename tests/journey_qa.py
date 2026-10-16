from fixture_support import *
import subprocess, traceback
GROUP=sys.argv[2] if len(sys.argv)>2 else 'flow'
checks=[]
def ok(name,test):
 if not test:raise AssertionError(name)
 checks.append({'name':name,'passed':True});print('PASS',name,flush=True)
def obs(rows,scene='ingredients',quality='good'):
 return {'version':'3.0.0','build':'15.5.1','scene':scene,'quality':quality,'issues':[],'items':[{'name':n,'form':f,'certainty':c,'evidence_kind':'visual' if c=='clear' else 'uncertain','evidence':'Simulated observation for UI testing; not an actual recognition result.','alternatives':[]} for n,f,c in rows]}
EXACT=obs([('Greek yogurt','packaged','clear'),('blueberries','raw','clear'),('walnuts','raw','clear')])
FIVE=obs([('broccoli','raw','clear'),('sweetcorn','raw','clear'),('tomato','raw','clear'),('carrot','raw','clear'),('eggs','raw','clear')])
class Journey(Fixture):
 def __init__(self,*args,**kwargs):
  self.recipes=[];self.recipe_pending=[];self.recipe_mode='success';super().__init__(*args,**kwargs)
 def route(self,r):
  if urlparse(r.request.url).path=='/api/recipes/generate':
   body=json.loads(r.request.post_data);self.recipes.append(body)
   if self.recipe_mode=='hold':self.recipe_pending.append(r);return
   if self.recipe_mode=='fail':r.fulfill(status=503,content_type='application/json',headers={'Access-Control-Allow-Origin':'*'},body=json.dumps({'error':{'code':'provider_busy','message':'Simulated service busy; no recipe saved.'}}));return
   reply=json.loads(subprocess.check_output(['node',str(ROOT.parent/'tests/plan-response.mjs')],input=json.dumps(body['input']),text=True))
   if self.recipe_mode=='extra':reply['plan']['phases'][-1]['foods'].append('oliveOil')
   r.fulfill(status=200,content_type='application/json',headers={'Access-Control-Allow-Origin':'*'},body=json.dumps(reply));return
  super().route(r)
 def scan(self,payload=OBS):
  self.select();self.analyze();self.release_security();self.release(payload);self.page.wait_for_timeout(220)
 def all(self):self.page.locator('[data-pj="all"]').click();self.page.wait_for_timeout(180)
 def ai(self):
  if self.page.locator('.pj-ai-option').count():self.page.locator('.pj-ai-option>summary').click()
  self.page.locator('[data-pj="create"]').click();self.page.wait_for_function('__challenge.action==="recipe_ingredients"');self.release_security();self.page.wait_for_timeout(300)
 def close(self):
  for r in self.recipe_pending:
   try:r.abort()
   except:pass
  self.recipe_pending=[];super().close()
try:
 with sync_playwright() as pw:
  b=launch_browser(pw)
  if GROUP=='flow':
   f=Journey(b,width=390);p=f.page;f.scan(EXACT)
   ok('Recognition leaves every observation unconfirmed',p.locator('[data-food-selected]:checked').count()==0)
   ok('No recipe claimed before a human confirms food',p.locator('#pj-instant-recipe').count()==0)
   ok('Recognition makes no pantry writes',not f.state()['pantry'] and not f.state()['photoFoods'])
   f.all()
   ok('One bulk-confirm action reveals a complete collection recipe',p.locator('#pj-instant-recipe').get_attribute('data-recipe-id')=='blueberryYogurt')
   ok('Full method is visible without View/Search/Save clicks',p.locator('#pj-instant-recipe .pj-steps li').count()==2)
   ok('Recipe ingredient amounts shown immediately',p.locator('#pj-instant-recipe .pj-ing li').count()==3 and '170 g' in p.locator('#pj-instant-recipe').inner_text())
   ok('Reading matches still makes no pantry/recipe write',not f.state()['pantry'] and not f.state()['ownRecipes'])
   ok('Matching submits no additional AI request',len(f.calls)==1 and not f.recipes)
   p.locator('[data-pj-preview-portions]').fill('2');p.locator('[data-pj-preview-portions]').press('Tab');p.wait_for_timeout(120)
   ok('Immediate recipe portions scale actual ingredient amounts','340 g' in p.locator('#pj-instant-recipe').inner_text())
   before_recipe=p.locator('#pj-instant-recipe').get_attribute('data-recipe-id');p.locator('[data-pj="save-foods"]').click();p.wait_for_timeout(160)
   ok('Optional save adds all selected canonical foods',set(f.state()['pantry'])=={'yogurt','blueberries','walnuts'})
   ok('Save keeps selected foods checked',p.locator('[data-food-selected]:checked').count()==3)
   ok('Save keeps the recipe and portions on screen',p.locator('#pj-instant-recipe').get_attribute('data-recipe-id')==before_recipe and '340 g' in p.locator('#pj-instant-recipe').inner_text())
   ok('No manual input receives focus after saving',p.evaluate('document.activeElement.id')!='pantry-input')
   ok('Saved button prevents redundant saves',p.locator('[data-pj="save-foods"]').is_disabled())
   entries=list(f.persisted.items());f.close()
   f=Journey(b,entries=entries);ok('Saved selected foods survive a fresh document',set(f.state()['pantry'])=={'yogurt','blueberries','walnuts'});f.close()
   f=Journey(b,width=390);p=f.page;f.scan();f.all()
   ok('Bulk confirm does not select an uncertain food',p.locator('[data-food-selected]:checked').count()==2)
   ok('Exact local recipe is available without saving',p.locator('#pj-instant-recipe .pj-steps li').count()==2 and not f.state()['pantry'])
   p.locator('[data-pj="cook-existing"]').click();p.wait_for_timeout(100)
   ok('Local recipe enters real cook mode without a pantry-save detour',p.locator('#dt-cook-step').is_visible())
   ok('Starting cooking does not infer or deduct stock',not f.state()['pantry'])
   p.keyboard.press('Escape');p.locator('[data-pj-food]').nth(0).click();p.wait_for_timeout(120)
   ok('Individual selection refreshes recipe instantly',p.locator('[data-pj-food][aria-pressed="true"]').count()==1 and p.locator('#pj-instant-recipe').is_visible())
   ok('Keyboard focus remains on the toggled food',p.evaluate('!!document.activeElement.dataset.pjFood'))
   p.locator('[data-pj="none"]').click();p.wait_for_timeout(120)
   ok('Clear selection removes the recipe without writing stock',p.locator('#pj-instant-recipe').count()==0 and not f.state()['pantry'])
   f.close()
  elif GROUP=='safety':
   f=Journey(b);state=f.state();f.close();state['daily']['allergens']=['nuts'];state['servings']=2
   f=Journey(b,state=state);p=f.page;f.scan(EXACT);f.all()
   ok('Nut exclusion prevents confirming walnuts',p.locator('[data-pj-food][aria-label*="walnuts"]').get_attribute('aria-disabled')=='true')
   ok('Hard-excluded ingredients do not reach the recipe','Walnuts' not in p.locator('#pj-instant-recipe .pj-ing').inner_text())
   p.locator('[data-pj="save-foods"]').click();p.wait_for_timeout(140)
   ok('Save excludes blocked food and retains household portions','walnuts' not in f.state()['pantry'] and f.state()['servings']==2)
   f.close()
   f=Journey(b);p=f.page;f.scan();f.all();p.locator('[data-pj-food]').nth(2).click();p.wait_for_timeout(140)
   ok('Selected unknown food is not silently omitted',p.locator('#pj-instant-recipe').count()==0 and 'Identify' in p.locator('.pj-notice').inner_text())
   ok('Unidentified selection offers no exact AI request',p.locator('[data-pj="create"]').count()==0 and not f.recipes)
   p.locator('[data-pj="save-foods"]').click();p.wait_for_timeout(100)
   ok('Unknown selected food stays a note, not fake inventory',set(f.state()['pantry'])=={'tomato','cucumber'} and any(x['foodKey'] is None for x in f.state()['photoFoods']))
   f.close()
   for scene,quality in [('ingredients','unusable'),('non_food','good')]:
    f=Journey(b);p=f.page;f.scan(obs([],scene,quality))
    ok(scene+'/'+quality+' never yields confirmed food',not f.state()['pantry'] and p.locator('[data-food-selected]:checked').count()==0)
    ok(scene+'/'+quality+' never offers a recipe as recognized',p.locator('#pj-instant-recipe').count()==0 and p.locator('[data-pj="create"]').count()==0)
    f.close()
   f=Journey(b);p=f.page;f.scan(obs([('tomato','raw','clear')],'prepared_meal'));p.locator('[data-pj-food]').first.click();p.wait_for_timeout(140)
   ok('Prepared-dish observation is not an exact ingredient identity',p.locator('#pj-instant-recipe').count()==0)
   p.locator('[data-pj="save-foods"]').click();p.wait_for_timeout(140)
   ok('Prepared dish saves only a note',not f.state()['pantry'] and f.state()['photoFoods'][0]['foodKey'] is None)
   f.close()
   f=Journey(b);p=f.page;f.scan(EXACT);f.all();old=f.persisted[KEY];p.evaluate('window.__storageFail=true');p.locator('[data-pj="save-foods"]').click();p.wait_for_timeout(160)
   ok('Failed persistence keeps original durable kitchen intact',f.persisted[KEY]==old)
   ok('Failed persistence cannot claim durable saved success','session only' in p.locator('.pj-save-optional').inner_text())
   ok('Recipe stays usable after storage failure',p.locator('#pj-instant-recipe').is_visible())
   f.close()
  elif GROUP=='ai':
   f=Journey(b,width=390);p=f.page;f.scan(FIVE);f.all()
   ok('Five-food local skillet immediately uses all selected foods','skillet' in p.locator('#pj-instant-recipe h3').inner_text().lower() and p.locator('#pj-instant-recipe .pj-ing li').count()==5)
   ok('AI has not run merely because foods were selected',not f.recipes)
   if p.locator('.pj-ai-option').count():p.locator('.pj-ai-option>summary').click()
   ok('Proposed AI batch amounts are visible before consent',p.locator('.pj-batch-summary').is_visible())
   p.locator('[data-pj="create"]').click();p.wait_for_function('__challenge.action==="recipe_ingredients"');f.release_security();p.wait_for_timeout(300)
   print('AI STATUS',p.locator('#photo-journey').inner_text()[-2200:],flush=True)
   ok('Exactly one user-requested AI request uses the exact five foods',len(f.recipes)==1 and {i['key'] for i in f.recipes[0]['input']['items']}=={'broccoli','corn','tomato','carrot','egg'})
   ok('Recipe authorization remains separate from photo security',p.evaluate('__widgets[1].options.action')=='recipe_ingredients')
   ok('Full returned recipe is displayed without an import/save step',p.locator('#pj-result .pj-steps li').count()>=3)
   ok('Returned proposal is not yet a saved recipe',not f.state()['ownRecipes'])
   f.shot('ai-recipe-mobile.png','#pj-result')
   p.locator('[data-pj="save-cook"]').click();p.wait_for_timeout(200)
   ok('One Save and cook action uses the actual cooking interface',p.locator('#dt-cook-step').is_visible() and len(f.state()['ownRecipes'])==1)
   ok('All original selected identities remain in saved AI recipe',{i['key'] for i in f.state()['ownRecipes'][0]['ingredients']}=={'broccoli','corn','tomato','carrot','egg'})
   ok('AI recipe save never forces a pantry write',not f.state()['pantry'])
   f.close()
   for mode in ['hold','extra','fail']:
    f=Journey(b);p=f.page;f.recipe_mode=mode;f.scan(FIVE);f.all();f.ai()
    if mode=='hold':
     ok('In-flight request is held for stale-result check',len(f.recipe_pending)==1)
     p.locator('[data-pj-food]').nth(0).click();p.wait_for_timeout(180)
     ok('Changing a food cancels the active draft',p.locator('#pj-working').count()==0 and p.locator('#pj-result').count()==0)
     ok('Changed selection cannot save the stale recipe',not f.state()['ownRecipes'] and len(f.recipes)==1)
    else:
     ok(mode+' result cannot present a validated recipe',p.locator('#pj-result').count()==0 and not f.state()['ownRecipes'])
     ok(mode+' error retains confirmed foods for retry',p.locator('[data-pj-food][aria-pressed="true"]').count()==5)
    f.close()
  elif GROUP.startswith('layout'):
   widths=[320,390,430] if GROUP=='layout-mobile' else [768,1024,1440]
   for width in widths:
    for theme in ['light','dark']:
     f=Journey(b,width=width);p=f.page;f.scan(EXACT);f.all();p.evaluate('(v)=>document.documentElement.dataset.theme=v',theme);p.wait_for_timeout(100)
     ok(str(width)+'/'+theme+' no horizontal overflow',p.evaluate('document.documentElement.scrollWidth<=innerWidth+1'))
     ok(str(width)+'/'+theme+' method is expanded without a button',p.locator('#pj-instant-recipe .pj-steps').is_visible())
     ok(str(width)+'/'+theme+' controls have usable touch targets',p.locator('[data-pj-food]').first.bounding_box()['height']>=44)
     ok(str(width)+'/'+theme+' one optional save, after the actual recipe',p.locator('[data-pj="save-foods"]').count()==1 and p.evaluate('!!(document.querySelector("#pj-instant-recipe").compareDocumentPosition(document.querySelector("[data-pj=save-foods]"))&4)'))
     if theme=='light' and width in [390,1440]:
      f.shot('instant-recipe-'+str(width)+'.png','#photo-journey' if width==1440 else '#pj-instant-recipe')
     p.locator('.pj-alternatives>summary').click();p.locator('[data-pj-open]').first.click();p.wait_for_timeout(120)
     ok(str(width)+'/'+theme+' alternative recipe opens in place',p.evaluate('document.activeElement.id')=='pj-instant-recipe')
     f.close()
  elif GROUP=='pages':
   for route in ['index.html','pantry/index.html','recipes/index.html','today/index.html','weekly-plan/index.html','shopping-list/index.html','settings/index.html']:
    f=Journey(b,routepath=route,width=390);p=f.page
    ok(route+' still boots',p.evaluate('document.documentElement.dataset.appReady')=='true')
    ok(route+' fits phone width',p.evaluate('document.documentElement.scrollWidth<=innerWidth+1'))
    f.close()
  b.close()
 ok('No uncaught application errors',not errors)
except Exception:
 traceback.print_exc();print('ERRORS',errors,flush=True)
 try:
  f.page.screenshot(path=str(REPORT/('failure-'+GROUP+'.png')),full_page=False)
  (REPORT/('failure-'+GROUP+'.txt')).write_text(f.page.locator('body').inner_text())
 except:pass
 checks.append({'name':'suite completed','passed':False});
finally:
 (REPORT/('journey-'+GROUP+'.json')).write_text(json.dumps({'group':GROUP,'checks':checks,'errors':errors},indent=2))
if any(not c['passed'] for c in checks):sys.exit(1)
