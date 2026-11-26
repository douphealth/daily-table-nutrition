// 15.20 · a kitchen saved by an earlier release must always open.
//
// The app refuses a saved kitchen that names a food it does not know ("Saved kitchen data could not be read. It has not been overwritten…").
// That protects against corrupt data, but it also means a food KEY can never be retired without a migration:
//   · v16 (production on 2026-10-19/20, 270 foods) had "redOnion" and "tomatoCherry". This catalogue folds them into "onion" and "tomato"
//     so that they match the 84 collection recipes. Without this patch a kitchen saved under v16 with red onion or cherry tomatoes in it
//     would be unreadable here (measured the same way production 15.19.0 fails on any v16 food: work/tools/probe-rollback.mjs).
// Every way a kitchen enters the app (stored data, another tab, an imported backup, a household transfer) goes through ONE validator.
// The migration sits at its first line: retired keys are replaced by their successors everywhere they can appear, lists stay free of
// duplicates, a record that already exists under the current name wins, and two ingredient lines that become the same food are merged.
// A kitchen that names no retired food is returned untouched (one string search).
// work/tools/key-compat.mjs lists the keys of every earlier release that the new catalogue lacks; the build fails if one is not mapped here.
import fs from 'node:fs';
import path from 'node:path';
import {FOODS} from '../gen/catalog.mjs';

export const RETIRED = {redOnion: 'onion', tomatoCherry: 'tomato'};

const MIGRATE = `const DT_RETIRED_FOODS=${JSON.stringify(RETIRED)};function dtRetiredFoods(input){let raw;try{raw=JSON.stringify(input)}catch{return input}if(typeof raw!="string"||!Object.keys(DT_RETIRED_FOODS).some(k=>raw.includes('"'+k+'"')))return input;const now=v=>typeof v=="string"&&Object.hasOwn(DT_RETIRED_FOODS,v)?DT_RETIRED_FOODS[v]:v;const walk=node=>{if(Array.isArray(node)){let moved=false;const out=node.map(item=>{if(typeof item=="string"){const next=now(item);if(next!==item)moved=true;return next}const before=item&&typeof item=="object"&&!Array.isArray(item)?item.key:void 0;const next=walk(item);if(next&&typeof next=="object"&&!Array.isArray(next)&&next.key!==before)moved=true;return next});if(!moved)return out;if(out.every(item=>typeof item=="string"))return[...new Set(out)];const seen=new Map,merged=[];for(const item of out){const key=item&&typeof item=="object"&&!Array.isArray(item)&&typeof item.key=="string"?item.key:null;if(key===null){merged.push(item);continue}const first=seen.get(key);if(!first){seen.set(key,item);merged.push(item);continue}if(typeof first.quantity=="number"&&typeof item.quantity=="number"&&first.unit===item.unit)first.quantity+=item.quantity}return merged}if(node&&typeof node=="object"){const out={};for(const[k,v]of Object.entries(node)){const key=Object.hasOwn(DT_RETIRED_FOODS,k)?DT_RETIRED_FOODS[k]:k;if(key!==k&&Object.hasOwn(node,key))continue;out[key]=k==="key"&&typeof v=="string"?now(v):walk(v)}return out}return node};return walk(JSON.parse(raw))}`;

export default {
  title: 'kitchens saved by earlier releases always open: retired food keys are migrated at the one validator',
  apply(c) {
    const F = 'assets/chunks/chunk-2SEECAFP.js';
    const HEAD = 'function A(e,r){if(!e||typeof e!="object"||Array.isArray(e))throw Error("The backup does not contain a workspace.");';
    c.edit(F, HEAD, MIGRATE + HEAD + 'e=dtRetiredFoods(e);', {label: 'validator entry'});
    if (!/\bA as g\b/.test(c.read(F))) throw new Error('retired keys: the validator is no longer exported as g');
    // every successor is a food of this catalogue, and no retired key is still one
    const keys = new Set(FOODS.map(f => f.key));
    for (const [gone, now] of Object.entries(RETIRED)) { if (!keys.has(now)) throw new Error('retired keys: successor is not in the catalogue: ' + now); if (keys.has(gone)) throw new Error('retired keys: still in the catalogue: ' + gone); }
    // every food key any earlier release could have saved is either still a food or mapped (earlier releases pinned next to this pipeline)
    const here = path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, '$1'));
    const checked = [];
    for (const dir of ['v16', 'base-15.19.0', 'base-15.18.0', 'base-15.6.3', 'base-15.5.9', 'v14-baseline']) {
      const f = path.resolve(here, '..', '..', dir, 'assets', 'data.json');
      if (!fs.existsSync(f)) continue;
      const lost = Object.keys(JSON.parse(fs.readFileSync(f, 'utf8')).foodLabels).filter(k => !keys.has(k) && !Object.hasOwn(RETIRED, k));
      if (lost.length) throw new Error(`retired keys: ${dir} could save foods this catalogue neither has nor maps: ${lost.join(', ')}`);
      checked.push(dir);
    }
    c.note(`${Object.keys(RETIRED).length} retired keys mapped; every food key of ${checked.join(', ')} still opens`);
  }
};
