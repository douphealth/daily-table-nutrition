// Direct tests of the built _worker.js (vision chain + recipe chain) with a scripted AI binding.
// These prove the orchestration (parallel checks, grace window, fallback, repair, validation, merge). They do NOT prove the
// accuracy of any real model: that needs a real Workers AI binding (see docs/VALIDATION.md).
// usage: node worker-test.mjs <siteFolder>
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import {pathToFileURL, fileURLToPath} from 'node:url';

const site = path.resolve(process.argv[2]);
const here = path.dirname(fileURLToPath(import.meta.url));
const tmp = path.join(here, '.worker-copy-test.mjs');
fs.copyFileSync(path.join(site, '_worker.js'), tmp);
const worker = (await import(pathToFileURL(tmp).href + '?t=' + Date.now())).default;

const GEMMA = '@cf/google/gemma-4-26b-a4b-it', SCOUT = '@cf/meta/llama-4-scout-17b-16e-instruct', MISTRAL = '@cf/mistralai/mistral-small-3.1-24b-instruct';
const HOST = 'app.test';
const realFetch = globalThis.fetch;
globalThis.fetch = async (url, init) => {
  if (String(url).includes('turnstile/v0/siteverify')) {
    const b = JSON.parse(init.body);
    // scripted Turnstile outcomes for the security scenarios: the token names the behaviour
    const J = o => new Response(JSON.stringify(o), {headers: {'Content-Type': 'application/json'}});
    if (b.response.startsWith('fail:')) return J({success: false, 'error-codes': [b.response.slice(5)]});
    if (b.response === 'host') return J({success: true, hostname: 'other.test', action: 'photo_ingredients'});
    if (b.response.startsWith('act:')) return J({success: true, hostname: HOST, action: b.response.slice(4)});
    if (b.response === 'http500') return new Response('boom', {status: 500});
    if (b.response === 'netdown') throw new TypeError('network down');
    if (b.response === 'garbled') return new Response('<html>not json</html>', {status: 200});
    return new Response(JSON.stringify({success: true, hostname: HOST, action: b.response === 'recipe' ? 'recipe_ingredients' : 'photo_ingredients'}), {headers: {'Content-Type': 'application/json'}});
  }
  return realFetch(url, init);
};
const img = await sharp({create: {width: 900, height: 700, channels: 3, background: '#d8c9a8'}}).jpeg({quality: 80}).toBuffer();
const IMAGE = 'data:image/jpeg;base64,' + img.toString('base64');

let ipN = 0;
const item = (name, o = {}) => ({name, form: 'raw', certainty: 'clear', evidence_kind: 'visual', evidence: 'Visible in the photo.', alternatives: [], ...o});
const obs = (items, o = {}) => ({scene: 'ingredients', quality: 'good', issues: [], items, ...o});
const chat = o => ({choices: [{message: {content: typeof o === 'string' ? o : JSON.stringify(o)}, finish_reason: 'stop'}]});
const sleep = ms => new Promise(r => setTimeout(r, ms));

// scripted AI: behaviours keyed by model id; every call is recorded
function makeAI(script) {
  const calls = [];
  return {calls, run: async (model, payload, options) => {
    calls.push({model, payload, options});
    const s = script[model]; if (!s) throw Object.assign(new Error('No such model ' + model), {code: '5007'});
    const step = Array.isArray(s) ? s[Math.min(calls.filter(c => c.model === model).length - 1, s.length - 1)] : s;
    if (step.delay) await sleep(step.delay);
    if (step.throw) throw step.throw instanceof Error ? step.throw : Object.assign(new Error(step.throw), step.code ? {code: step.code} : {});
    return typeof step.reply === 'function' ? step.reply(payload) : step.reply;
  }};
}
const baseEnv = ai => ({PHOTO_RECOGNITION_ENABLED: 'true', TURNSTILE_SITE_KEY: 'k', TURNSTILE_SECRET_KEY: 's', AI: ai, CF_VISION_TIMEOUT_MS: '1000', CF_VISION_GRACE_MS: '500', CF_VISION_DEADLINE_MS: '12000', CF_RECIPE_TIMEOUT_MS: '1000', CF_RECIPE_DEADLINE_MS: '12000'});
async function analyze(env, extra = {}) {
  const t0 = Date.now();
  const res = await worker.fetch(new Request(`https://${HOST}/api/vision/analyze`, {method: 'POST', headers: {'Content-Type': 'application/json', Origin: `https://${HOST}`, 'Sec-Fetch-Site': 'same-origin', 'CF-Connecting-IP': '9.9.9.' + (++ipN % 250)}, body: JSON.stringify({image: IMAGE, note: '', purpose: 'ingredients', token: 't', consent: true, ...extra})}), env);
  return {status: res.status, body: await res.json(), ms: Date.now() - t0};
}
async function status(env, p = '/api/vision/status') { const res = await worker.fetch(new Request(`https://${HOST}${p}`), env); return res.json(); }
const PLAN_OK = foods => ({status: 'recipe', style: 'salad', reason: 'ok', totalMinutes: 10, phases: [{action: 'prepare', foods, minutes: 5}, {action: 'toss', foods, minutes: 2}]});
const RECIPE_INPUT = {items: [{key: 'carrot', quantity: 120, unit: 'g'}, {key: 'cucumber', quantity: 160, unit: 'g'}], servings: 2, maxMinutes: 30, equipment: 'no-cook', allowWater: false, slot: 'lunch', allergens: [], excluded: [], patterns: [], strictLabels: true};
async function recipe(env, input = RECIPE_INPUT) {
  const res = await worker.fetch(new Request(`https://${HOST}/api/recipes/generate`, {method: 'POST', headers: {'Content-Type': 'application/json', Origin: `https://${HOST}`, 'Sec-Fetch-Site': 'same-origin', 'CF-Connecting-IP': '8.8.8.' + (++ipN % 250)}, body: JSON.stringify({input, token: 'recipe', consent: true, amountsConfirmed: true})}), env);
  return {status: res.status, body: await res.json()};
}

const results = [];
const T = async (name, fn) => { const checks = []; const t = (c, m = '') => checks.push([!!c, m]); try { await fn(t); } catch (e) { checks.push([false, 'EXCEPTION ' + (e.stack || e).toString().split('\n').slice(0, 2).join(' | ')]); } const bad = checks.filter(c => !c[0]); results.push(!bad.length); console.log((bad.length ? 'FAIL ' : 'PASS ') + name + (bad.length ? '\n      ' + bad.map(b => '- ' + b[1]).join('\n      ') : '')); };

// ---------------------------------------------------------------------------------------------------------------------
await T('config: default chain is Gemma 4 -> Llama 4 Scout -> Mistral Small; legacy Moondream setting is ignored', async t => {
  const s = await status({...baseEnv(makeAI({})), CF_VISION_MODEL: '@cf/moondream/moondream3.1-9B-A2B'});
  t(s.enabled === true, 'enabled');
  t(JSON.stringify(s.models) === JSON.stringify(['gemma-4-26b-a4b-it', 'llama-4-scout-17b-16e-instruct', 'mistral-small-3.1-24b-instruct']), JSON.stringify(s.models));
  t(!JSON.stringify(s).includes('moondream'), 'no moondream in status');
  const custom = await status({...baseEnv(makeAI({})), CF_VISION_MODEL: '@cf/qwen/qwen3.8-27b'});
  t(custom.models[0] === 'qwen3.8-27b' && custom.models.length === 4, 'explicit model goes first: ' + custom.models);
});

await T('both checks answer: results merged, agreement marked, consensus reported', async t => {
  const ai = makeAI({
    [GEMMA]: {reply: chat(obs([item('tomato'), item('cucumber'), item('feta', {evidence_kind: 'label', evidence: 'Label reads feta.', form: 'packaged'}), item('olive oil', {form: 'packaged'})]))},
    [SCOUT]: {reply: chat(obs([item('Tomatoes'), item('cucumber'), item('red onion'), item('olive oil', {form: 'packaged'})]))}
  });
  const r = await analyze(baseEnv(ai));
  t(r.status === 200, 'status ' + r.status + JSON.stringify(r.body.error));
  const names = r.body.items.map(i => i.name + ':' + i.agreement);
  t(r.body.items.length === 5, 'union of 5 foods: ' + names);
  t(r.body.items.find(i => i.name === 'tomato')?.agreement === 'both', 'tomato/Tomatoes paired');
  t(r.body.items.find(i => i.name === 'feta')?.agreement === 'single' && r.body.items.find(i => i.name === 'red onion')?.agreement === 'single', 'single-check foods marked single');
  t(r.body.items[0].agreement === 'both', 'foods both checks saw come first');
  t(r.body.consensus && r.body.consensus.checks === 2 && r.body.consensus.agreed === 3 && r.body.consensus.single === 2, JSON.stringify(r.body.consensus));
  t(r.body.models.length === 2 && ai.calls.length === 2, 'both models asked once, in parallel');
  t(r.body.items.every(i => i.id && 'pantryKey' in i), 'items complete');
});

await T('request shapes: Gemma 4 and Llama 4 Scout get their own parameters', async t => {
  const ai = makeAI({[GEMMA]: {reply: chat(obs([item('tomato')]))}, [SCOUT]: {reply: chat(obs([item('tomato')]))}});
  await analyze(baseEnv(ai));
  const g = ai.calls.find(c => c.model === GEMMA).payload, s = ai.calls.find(c => c.model === SCOUT).payload;
  t(g.max_completion_tokens === 3600 && g.chat_template_kwargs?.enable_thinking === false && g.response_format?.type === 'json_schema', 'gemma payload');
  t(s.max_tokens === 3600 && !('max_completion_tokens' in s) && !s.chat_template_kwargs && s.response_format?.type === 'json_schema', 'scout payload');
  t(g.messages[1].content.some(p => p.type === 'image_url' && p.image_url.url.startsWith('data:image/jpeg;base64,')), 'image sent as a data URI');
  t(/complete list is better than a short one/.test(g.messages[1].content[0].text), 'recall-oriented instruction');
});

await T('slow primary: answer from the second check is returned after the grace window (no 60 s wait)', async t => {
  const ai = makeAI({[GEMMA]: {delay: 5000, reply: chat(obs([item('banana')]))}, [SCOUT]: {delay: 50, reply: chat(obs([item('carrot'), item('cucumber')]))}});
  const r = await analyze(baseEnv(ai));
  t(r.status === 200 && r.body.items.length === 2, 'status ' + r.status);
  t(r.ms < 2500, 'returned in ' + r.ms + ' ms');
  t(r.body.consensus === null && r.body.models.length === 1 && r.body.models[0].startsWith('llama-4'), 'single-model result is not presented as consensus');
});

await T('primary errors: the second check still delivers', async t => {
  const ai = makeAI({[GEMMA]: {throw: 'InferenceUpstreamError: boom'}, [SCOUT]: {reply: chat(obs([item('egg')]))}});
  const r = await analyze(baseEnv(ai));
  t(r.status === 200 && r.body.items[0].name === 'egg', 'status ' + r.status);
});

await T('both fail: the third model is tried and delivers', async t => {
  const ai = makeAI({[GEMMA]: {delay: 5000, reply: chat(obs([]))}, [SCOUT]: {throw: Object.assign(new Error('capacity'), {code: '3040'})}, [MISTRAL]: {reply: chat(obs([item('lemon')]))}});
  const r = await analyze(baseEnv(ai));
  t(r.status === 200 && r.body.items[0].name === 'lemon' && r.body.models[0].startsWith('mistral'), 'status ' + r.status + ' ' + JSON.stringify(r.body.models));
});

await T('all three time out: clear 504, honest message, attempts listed', async t => {
  const ai = makeAI({[GEMMA]: {delay: 5000, reply: {}}, [SCOUT]: {delay: 5000, reply: {}}, [MISTRAL]: {delay: 5000, reply: {}}});
  const r = await analyze(baseEnv(ai));
  t(r.status === 504 && r.body.error.code === 'analysis_timeout', r.status + ' ' + r.body.error?.code);
  t(/too slow/.test(r.body.error.message) && /Nothing was added/.test(r.body.error.message) && !/image size alone/.test(r.body.error.message), r.body.error.message);
  t(Array.isArray(r.body.error.attempts) && r.body.error.attempts.length === 3 && r.body.error.attempts.every(a => a.outcome === 'timeout'), JSON.stringify(r.body.error.attempts));
});

await T('capacity / quota on every model: 429 with a useful message', async t => {
  const busy = {throw: Object.assign(new Error('Capacity temporarily exceeded'), {code: '3040'})};
  const r = await analyze(baseEnv(makeAI({[GEMMA]: busy, [SCOUT]: busy, [MISTRAL]: busy})));
  t(r.status === 429 && r.body.error.code === 'provider_busy', r.status + ' ' + r.body.error?.code);
});

await T('paid-plan or unavailable models on every attempt: owner-actionable 503', async t => {
  const plan = {throw: Object.assign(new Error('5035: requires a Workers Paid plan'), {code: '5035'})};
  const r = await analyze(baseEnv(makeAI({[GEMMA]: plan, [SCOUT]: plan, [MISTRAL]: plan})));
  t(r.status === 503 && r.body.error.code === 'model_plan_required', r.status + ' ' + r.body.error?.code);
});

await T('tolerant parsing: code fences, <think> blocks, synonym forms, missing arrays, junk items', async t => {
  const messy = '<think>let me look</think>\nHere you go:\n```json\n' + JSON.stringify({scene: 'Ingredients', quality: 'GOOD', items: [
    {name: 'Carrot', form: 'fresh', certainty: 'high', evidence_kind: 'visual', evidence: 'Orange sticks.'},
    {name: 'chickpeas', form: 'tinned', certainty: 'clear', evidence_kind: 'visual', evidence: 'Open can.', alternatives: ['beans']},
    {name: '', form: 'raw'}, 'nonsense', {name: 'Pepper', form: 'sliced', certainty: 'maybe', evidence: ''}]}) + '\n```\nHope that helps!';
  const ai = makeAI({[GEMMA]: {reply: chat(messy)}});
  const r = await analyze({...baseEnv(ai), CF_VISION_MODE: 'single'});
  t(r.status === 200, 'status ' + r.status + ' ' + JSON.stringify(r.body.error));
  const by = n => r.body.items.find(i => i.name === n);
  t(r.body.scene === 'ingredients' && r.body.quality === 'good', 'enums normalised');
  t(by('Carrot')?.form === 'raw' && by('Carrot')?.certainty === 'clear', 'fresh->raw, high->clear');
  t(by('chickpeas')?.form === 'canned', 'tinned->canned');
  t(by('Pepper')?.certainty === 'uncertain' && by('Pepper')?.evidence_kind === 'uncertain', 'item without evidence downgraded, not invented');
  t(r.body.items.length === 3 && r.body.issues.some(x => /skipped/.test(x)), 'unreadable items dropped with a visible note');
  t(by('Carrot')?.pantryKey === 'carrot', 'pantry suggestion still comes from the strict rules');
});

await T('structured-output parameters rejected: retried once in plain mode, then succeeds', async t => {
  const ai = makeAI({[GEMMA]: [{throw: new Error('AiError: Invalid input: response_format is not supported')}, {reply: chat(obs([item('apple')]))}]});
  const r = await analyze({...baseEnv(ai), CF_VISION_MODE: 'single'});
  t(r.status === 200 && r.body.items[0].name === 'apple', 'status ' + r.status);
  t(ai.calls.length === 2 && ai.calls[0].payload.response_format && !ai.calls[1].payload.response_format, 'second call has no response_format');
  t(/conforms to this JSON Schema/.test(ai.calls[1].payload.messages[0].content), 'schema stated in the prompt instead');
});

await T('model returns unusable text on both variants: that model fails cleanly (falls back)', async t => {
  const ai = makeAI({[GEMMA]: {reply: chat('I cannot help with that.')}, [SCOUT]: {reply: chat(obs([item('rice', {form: 'dried'})]))}});
  const r = await analyze(baseEnv(ai));
  t(r.status === 200 && r.body.items[0].name === 'rice', 'status ' + r.status);
});

await T('single mode: only the first model is called unless it fails', async t => {
  const ai = makeAI({[GEMMA]: {reply: chat(obs([item('egg')]))}, [SCOUT]: {reply: chat(obs([item('lemon')]))}});
  const r = await analyze({...baseEnv(ai), CF_VISION_MODE: 'single'});
  t(r.status === 200 && ai.calls.length === 1 && r.body.consensus === null, 'one call');
  const ai2 = makeAI({[GEMMA]: {throw: 'down'}, [SCOUT]: {reply: chat(obs([item('lemon')]))}});
  const r2 = await analyze({...baseEnv(ai2), CF_VISION_MODE: 'single'});
  t(r2.status === 200 && ai2.calls.length === 2, 'falls back after failure');
});

await T('merge: preparation conflict and quality are handled conservatively', async t => {
  const ai = makeAI({
    [GEMMA]: {reply: chat(obs([item('egg', {form: 'raw'}), item('tomato')], {quality: 'good'}))},
    [SCOUT]: {reply: chat(obs([item('egg', {form: 'cooked'}), item('tomato')], {quality: 'limited', issues: ['Dim light.']}))}
  });
  const r = await analyze(baseEnv(ai));
  const egg = r.body.items.find(i => i.name === 'egg');
  t(egg?.certainty === 'uncertain' && /differ on preparation/.test(egg.evidence) && egg.pantryKey === null, JSON.stringify(egg));
  t(r.body.quality === 'limited' && r.body.issues.includes('Dim light.'), 'quality = the more cautious one');
  t(r.body.items.find(i => i.name === 'tomato')?.certainty === 'clear', 'agreeing clear item stays clear');
});

await T('merge: a food seen by only one check is kept, not dropped', async t => {
  const ai = makeAI({[GEMMA]: {reply: chat(obs([]  , {scene: 'unclear', quality: 'limited'}))}, [SCOUT]: {reply: chat(obs([item('spinach')]))}});
  const r = await analyze(baseEnv(ai));
  t(r.status === 200 && r.body.items.length === 1 && r.body.items[0].name === 'spinach' && r.body.scene === 'ingredients', JSON.stringify(r.body).slice(0, 200));
});

await T('safeguards unchanged: consent, origin and image rules still enforced', async t => {
  const ai = makeAI({[GEMMA]: {reply: chat(obs([item('egg')]))}});
  const noConsent = await analyze(baseEnv(ai), {consent: false});
  t(noConsent.status === 400 && noConsent.body.error.code === 'consent_required', noConsent.status);
  const cross = await worker.fetch(new Request(`https://${HOST}/api/vision/analyze`, {method: 'POST', headers: {'Content-Type': 'application/json', Origin: 'https://evil.test'}, body: '{}'}), baseEnv(ai));
  t(cross.status === 403, 'cross-origin ' + cross.status);
  const bad = await analyze(baseEnv(ai), {image: 'data:image/png;base64,AAAA'});
  t(bad.status === 400 && bad.body.error.code === 'invalid_image', bad.status);
  t(ai.calls.length === 0, 'no AI call without consent / valid origin / valid image');
});

await T('photo suggestions never carry quantities, nutrition or recipes (shape check)', async t => {
  const ai = makeAI({[GEMMA]: {reply: chat(obs([item('tomato')]))}});
  const r = await analyze({...baseEnv(ai), CF_VISION_MODE: 'single'});
  const keys = Object.keys(r.body.items[0]).sort().join(',');
  t(keys === 'alternatives,certainty,evidence,evidence_kind,form,id,name,pantryKey', keys);
});

// ---- recipes ---------------------------------------------------------------------------------------------------------
await T('recipe: AI is on by default when photo recognition is on; RECIPE_AI_ENABLED=false switches it off', async t => {
  const on = await status(baseEnv(makeAI({})), '/api/recipes/status');
  t(on.enabled === true && on.models.length === 2 && on.models[0] === 'gemma-4-26b-a4b-it', JSON.stringify(on));
  const off = await status({...baseEnv(makeAI({})), RECIPE_AI_ENABLED: 'false'}, '/api/recipes/status');
  t(off.enabled === false && off.missing.includes('RECIPE_AI_ENABLED'), JSON.stringify(off.missing));
});

await T('recipe: valid plan on the first try', async t => {
  const ai = makeAI({[GEMMA]: {reply: chat(PLAN_OK(['carrot', 'cucumber']))}});
  const r = await recipe(baseEnv(ai));
  t(r.status === 200 && r.body.plan.status === 'recipe' && r.body.attempts.length === 1, r.status + JSON.stringify(r.body.error));
  const p = ai.calls[0].payload;
  t(/healthiest preparation/.test(p.messages[0].content) && p.options === undefined && ai.calls[0].options?.rejectIfBusy === true, 'health goal in prompt, rejectIfBusy set');
});

await T('recipe: a plan that silently drops an ingredient is rejected, corrected once, and the correction is accepted', async t => {
  const drops = {...PLAN_OK(['carrot', 'cucumber']), phases: [{action: 'prepare', foods: ['carrot', 'cucumber'], minutes: 5}, {action: 'toss', foods: ['carrot'], minutes: 2}]};
  const ai = makeAI({[GEMMA]: [{reply: chat(drops)}, {reply: chat(PLAN_OK(['carrot', 'cucumber']))}]});
  const r = await recipe(baseEnv(ai));
  t(r.status === 200 && r.body.plan.phases.at(-1).foods.length === 2, 'status ' + r.status + JSON.stringify(r.body.error));
  t(ai.calls.length === 2 && ai.calls[1].payload.messages.length === 4, 'repair request carries the previous answer and the validator message');
  t(/Finish the dish with every selected ingredient/.test(ai.calls[1].payload.messages[3].content), ai.calls[1].payload.messages[3].content.slice(0, 160));
  t(r.body.attempts[0].outcome === 'invalid' && r.body.attempts[1].outcome === 'ok' && r.body.attempts[1].repair === true, JSON.stringify(r.body.attempts));
});

await T('recipe: primary times out, backup model delivers', async t => {
  const ai = makeAI({[GEMMA]: {delay: 5000, reply: chat({})}, [SCOUT]: {reply: chat(PLAN_OK(['carrot', 'cucumber']))}});
  const r = await recipe(baseEnv(ai));
  t(r.status === 200 && r.body.model.includes('llama-4'), 'status ' + r.status + ' ' + r.body.model);
});

await T('recipe: every AI attempt invalid (the reported failure) -> the app\'s verified rules build the method, clearly labelled', async t => {
  const bad = {reply: chat({status: 'recipe', style: 'salad', reason: 'ok', totalMinutes: 5, phases: [{action: 'toss', foods: ['carrot', 'bananas'], minutes: 2}]})};
  const ai = makeAI({[GEMMA]: bad, [SCOUT]: bad});
  const r = await recipe(baseEnv(ai));
  t(ai.calls.length === 4, 'two attempts per model were still made: ' + ai.calls.length);
  t(r.status === 200 && r.body.planner === true && r.body.model === 'app-planner' && r.body.plan.status === 'recipe', r.status + ' ' + JSON.stringify(r.body.error || r.body.model));
  t(r.body.plan.phases.at(-1).foods.length === 2 && /own verified rules/.test(r.body.notice), 'uses every food; the notice says it was rule-built');
  t(r.body.attempts.filter(a => a.outcome === 'invalid').length === 4 && r.body.attempts.at(-1).model === 'app-planner', JSON.stringify(r.body.attempts.map(a => a.model + ':' + a.outcome)));
});

await T('recipe: infeasible settings are explained BEFORE any AI call (eggs + rice with water off), with a working fix', async t => {
  const ai = makeAI({[GEMMA]: {reply: chat(PLAN_OK(['egg', 'rice']))}});
  const input = {...RECIPE_INPUT, items: [{key: 'egg', quantity: 4, unit: 'piece'}, {key: 'rice', quantity: 150, unit: 'g'}], equipment: 'hob', allowWater: false, maxMinutes: 45};
  const r = await recipe(baseEnv(ai), input);
  t(r.status === 200 && r.body.plan.status === 'no_fit' && ai.calls.length === 0, 'no AI call: ' + ai.calls.length);
  t(r.body.blockers?.[0]?.code === 'water' && /Tick "Water may be used for cooking"/.test(r.body.blockers[0].message) && r.body.blockers[0].fix.allowWater === true, JSON.stringify(r.body.blockers?.[0]));
  const fixed = await recipe(baseEnv(makeAI({[GEMMA]: {reply: chat({})}})), {...input, allowWater: true});
  t(fixed.status === 200 && fixed.body.plan.status === 'recipe' && fixed.body.planner === true, 'after the fix a valid method exists (planner after an unusable AI answer): ' + fixed.status);
  t(fixed.body.plan.phases.some(p => p.action === 'cook-grain') && fixed.body.plan.phases.some(p => p.action === 'set-eggs'), 'rice cooked as a grain, eggs set');
});

await T('recipe: the AI is given the verified reference plan and may simply return it', async t => {
  const ai = makeAI({[GEMMA]: {reply: p => chat(JSON.parse(p.messages[1].content).referencePlan)}});
  const r = await recipe(baseEnv(ai));
  const sent = JSON.parse(ai.calls[0].payload.messages[1].content);
  t(sent.referencePlan?.status === 'recipe' && sent.referencePlan.phases.length >= 2, 'referencePlan sent');
  t(r.status === 200 && r.body.planner === false && r.body.attempts.length === 1, 'the AI answer was accepted, planner not used: ' + JSON.stringify(r.body.attempts));
});

await T('recipe: AI down on every model -> rule-built method (not an error), labelled', async t => {
  const ai = makeAI({[GEMMA]: {delay: 5000, reply: chat({})}, [SCOUT]: {throw: Object.assign(new Error('capacity'), {code: '3040'})}});
  const r = await recipe(baseEnv(ai));
  t(r.status === 200 && r.body.planner === true && r.body.plan.status === 'recipe', r.status + ' ' + JSON.stringify(r.body.error || ''));
});

await T('recipe: no_fit gets a second opinion; a recipe from the backup is accepted, two no_fits are reported as no_fit', async t => {
  const noFit = {status: 'no_fit', style: 'salad', reason: 'combination', totalMinutes: 0, phases: []};
  const ai = makeAI({[GEMMA]: {reply: chat(noFit)}, [SCOUT]: {reply: chat(PLAN_OK(['carrot', 'cucumber']))}});
  const r = await recipe(baseEnv(ai));
  t(r.status === 200 && r.body.plan.status === 'recipe', 'second opinion used: ' + r.status);
  const ai2 = makeAI({[GEMMA]: {reply: chat(noFit)}, [SCOUT]: {reply: chat(noFit)}});
  const r2 = await recipe(baseEnv(ai2));
  t(r2.status === 200 && r2.body.plan.status === 'recipe' && r2.body.planner === true, 'an over-cautious "no fit" from both models is overruled by a rule-built plan that passes every check');
});

await T('recipe: hard exclusions still stop the request before any AI call', async t => {
  const ai = makeAI({[GEMMA]: {reply: chat(PLAN_OK(['carrot', 'cucumber']))}});
  const r = await recipe(baseEnv(ai), {...RECIPE_INPUT, items: [{key: 'peanutButter', quantity: 30, unit: 'g'}, {key: 'carrot', quantity: 100, unit: 'g'}], allergens: ['peanuts']});
  t(r.status === 400 && r.body.error.code === 'recipe_input_invalid' && ai.calls.length === 0, r.status + ' calls=' + ai.calls.length);
});

await T('selftest: invisible without the secret token; with it, reports each model, its speed and what it named', async t => {
  const ai = makeAI({[GEMMA]: {reply: chat(obs([item('tomato'), item('cucumber')]))}, [SCOUT]: {delay: 100, reply: chat(obs([item('tomato')]))}, [MISTRAL]: {throw: 'down'}});
  const env = {...baseEnv(ai), ASSETS: {fetch: async () => new Response(img, {headers: {'Content-Type': 'image/jpeg'}})}};
  const call = (e, headers = {}, qs = '') => worker.fetch(new Request(`https://${HOST}/api/vision/selftest${qs}`, {headers}), e);
  t((await call(env)).status === 404, 'no token configured -> 404 (same as any unknown API path)');
  const armed = {...env, VISION_SELFTEST_TOKEN: 'a-long-secret-token-123'};
  t((await call(armed, {'X-Selftest-Token': 'wrong-wrong-wrong-wrong'})).status === 404, 'wrong token -> 404');
  t((await call({...env, VISION_SELFTEST_TOKEN: 'short'}, {'X-Selftest-Token': 'short'})).status === 404, 'a short token is refused');
  t(ai.calls.length === 0, 'no AI call without the right token');
  const res = await call(armed, {'X-Selftest-Token': 'a-long-secret-token-123'});
  const b = await res.json();
  t(res.status === 200 && b.models.length === 3, 'status ' + res.status + ' models ' + b.models?.length);
  t(b.models.find(m => m.model.startsWith('gemma'))?.foods.join() === 'tomato (clear),cucumber (clear)', JSON.stringify(b.models[0]));
  t(b.models.find(m => m.model.startsWith('mistral'))?.outcome === 'unavailable' && b.models.every(m => typeof m.ms === 'number'), 'per-model outcome and timing');
  t(b.merged?.agreedByBoth.join() === 'tomato' && b.merged?.seenByOne.join() === 'cucumber', JSON.stringify(b.merged));
  t((await call(armed, {'X-Selftest-Token': 'a-long-secret-token-123'}, '?photo=../../etc/passwd')).status === 400, 'photo id is validated (no path traversal)');
});

fs.unlinkSync(tmp);
// ---- security layer (15.3.1, ported): one fail-closed verification for photo AND recipe requests, with specific reasons ------------------------------------------
const secCall = async (path, {method = 'POST', body, headers = {}, env} = {}) => {
  const res = await worker.fetch(new Request(`https://${HOST}${path}`, {method, headers: {'Content-Type': 'application/json', Origin: `https://${HOST}`, 'Sec-Fetch-Site': 'same-origin', 'CF-Connecting-IP': '7.7.7.' + (++ipN % 250), ...headers}, ...(body === undefined ? {} : {body: JSON.stringify(body)})}), env);
  return {status: res.status, body: await res.json()};
};
await T('security: a failed check stops the request BEFORE any AI call, with a specific reason', async t => {
  const cases = [['fail:timeout-or-duplicate', 403, 'verification_expired'], ['fail:invalid-input-secret', 503, 'verification_configuration'], ['fail:missing-input-secret', 503, 'verification_configuration'], ['fail:internal-error', 503, 'verification_unavailable'], ['fail:invalid-input-response', 403, 'verification_failed'], ['host', 403, 'verification_hostname'], ['act:recipe_ingredients', 403, 'verification_action'], ['http500', 503, 'verification_unavailable'], ['netdown', 503, 'verification_unavailable'], ['garbled', 503, 'verification_unavailable']];
  for (const [token, status, code] of cases) {
    const ai = makeAI({[GEMMA]: {reply: chat(obs([item('tomato')]))}, [SCOUT]: {reply: chat(obs([item('tomato')]))}});
    const r = await analyze(baseEnv(ai), {token});
    t(r.status === status && r.body.error?.code === code, `${token}: got ${r.status} ${r.body.error?.code}, wanted ${status} ${code}`);
    t(ai.calls.length === 0, `${token}: the AI was called ${ai.calls.length} times`);
  }
  const ai = makeAI({}); const r = await analyze({...baseEnv(ai), TURNSTILE_SECRET_KEY: undefined}, {token: 't'});
  t([403, 503].includes(r.status) && !ai.calls.length, 'no secret configured: closed, no AI call (' + r.status + ' ' + r.body.error?.code + ')');
  t(/owner|secret|site key/i.test((await analyze(baseEnv(makeAI({})), {token: 'fail:invalid-input-secret'})).body.error.message), 'the secret problem is explained for the owner');
});
await T('security: photo and recipe tokens are not interchangeable', async t => {
  const ai = makeAI({}); const r = await recipe(baseEnv(ai), RECIPE_INPUT);   // token "recipe" is accepted for the recipe action
  t(r.status === 200 || r.status === 503, 'sanity: a recipe token reaches the recipe endpoint (' + r.status + ')');
  const wrong = await worker.fetch(new Request(`https://${HOST}/api/recipes/generate`, {method: 'POST', headers: {'Content-Type': 'application/json', Origin: `https://${HOST}`, 'Sec-Fetch-Site': 'same-origin', 'CF-Connecting-IP': '6.6.6.' + (++ipN % 250)}, body: JSON.stringify({input: RECIPE_INPUT, token: 'act:photo_ingredients', consent: true, amountsConfirmed: true})}), baseEnv(makeAI({})));
  const body = await wrong.json();
  t(wrong.status === 403 && body.error?.code === 'verification_action', 'a PHOTO token cannot create a recipe: ' + wrong.status + ' ' + body.error?.code);
  const photoWithRecipe = await analyze(baseEnv(makeAI({})), {token: 'recipe'});
  t(photoWithRecipe.status === 403 && photoWithRecipe.body.error?.code === 'verification_action', 'a RECIPE token cannot analyze a photo: ' + photoWithRecipe.status);
});
await T('security: /api/security/check is a same-origin, rate-limited, no-inference diagnostic', async t => {
  const env = baseEnv(makeAI({}));
  t((await secCall('/api/security/check', {method: 'GET', env})).status === 405, 'GET refused');
  t((await secCall('/api/security/check', {body: {token: 't', action: 'photo_ingredients'}, headers: {Origin: 'https://evil.test'}, env})).body.error?.code === 'origin_denied', 'foreign origin refused');
  t((await secCall('/api/security/check', {body: {token: 't', action: 'photo_ingredients'}, headers: {'Sec-Fetch-Site': 'cross-site'}, env})).body.error?.code === 'origin_denied', 'cross-site refused');
  t((await secCall('/api/security/check', {body: {token: 't', action: 'photo_ingredients'}, headers: {'Content-Type': 'text/plain'}, env})).status === 415, 'non-JSON refused');
  const extra = await secCall('/api/security/check', {body: {token: 't', action: 'photo_ingredients', foods: ['tomato']}, env});
  t(extra.status === 400 && extra.body.error?.code === 'invalid_security_request', 'any other field (food data) is refused: ' + extra.status);
  const photo = await secCall('/api/security/check', {body: {token: 't', action: 'photo_ingredients', image: IMAGE}, env});
  t([400, 413].includes(photo.status) && photo.body.ok !== true, 'a photo is refused (too large for this endpoint): ' + photo.status);
  const noKeys = await secCall('/api/security/check', {body: {token: 't', action: 'photo_ingredients'}, env: {...env, TURNSTILE_SITE_KEY: undefined}});
  t(noKeys.status === 503 && noKeys.body.error?.code === 'verification_configuration', 'both keys are required: ' + noKeys.status);
  const ok = await secCall('/api/security/check', {body: {token: 't', action: 'photo_ingredients'}, env});
  t(ok.status === 200 && ok.body.ok === true && ok.body.noInference === true && ok.body.hostname === HOST && !JSON.stringify(ok.body).includes('"t"'), JSON.stringify(ok.body).slice(0, 200));
  const bad = await secCall('/api/security/check', {body: {token: 'fail:timeout-or-duplicate', action: 'photo_ingredients'}, env});
  t(bad.status === 403 && bad.body.ok === false && bad.body.error.code === 'verification_expired' && bad.body.noInference === true, JSON.stringify(bad.body).slice(0, 200));
  const unsupported = await secCall('/api/security/check', {body: {token: 't', action: 'delete_everything'}, env});
  t(unsupported.status === 403 && unsupported.body.error?.code === 'verification_action', 'only the two known actions are accepted');
  let limited = null;
  for (let i = 0; i < 9 && !limited; i++) { const r = await worker.fetch(new Request(`https://${HOST}/api/security/check`, {method: 'POST', headers: {'Content-Type': 'application/json', Origin: `https://${HOST}`, 'Sec-Fetch-Site': 'same-origin', 'CF-Connecting-IP': '5.5.5.5'}, body: JSON.stringify({token: 't', action: 'photo_ingredients'})}), env); if (r.status === 429) limited = await r.json(); }
  t(limited?.error?.code === 'security_rate_limited', 'one address is limited to a few diagnostics per minute');
});
await T('security: both status endpoints say where the diagnostic lives (and nothing secret)', async t => {
  const env = baseEnv(makeAI({}));
  const v = await status(env), r = await status(env, '/api/recipes/status');
  t(v.security?.diagnosticPath === '/api/security/check' && v.security.action === 'photo_ingredients' && v.security.hostname === HOST, JSON.stringify(v.security));
  t(r.security?.diagnosticPath === '/api/security/check' && r.security.action === 'recipe_ingredients', JSON.stringify(r.security));
  t(!JSON.stringify([v, r]).includes('"s"') && !/secret/i.test(JSON.stringify([v.security, r.security])), 'no secret in the status payloads');
});

const failed = results.filter(r => !r).length;
console.log(`\n${results.length - failed}/${results.length} worker scenarios passed`);
process.exit(failed ? 1 : 0);
