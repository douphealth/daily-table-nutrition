/**
 * The Daily Table v15.17: device-to-device household transfer, without a server.
 * A transfer is a user-controlled JSON file containing up to 12 kitchens.
 * All data is validated against the SAME workspace validator used by the app.
 * No migration, sharing, uploading or overwrite happens automatically.
 */
import {g as validateWorkspace} from './chunks/chunk-2SEECAFP.js?v=15.20.0';

export const TRANSFER_FORMAT = 'daily-table-household-transfer';
export const TRANSFER_VERSION = 1;
export const TRANSFER_LIMIT_BYTES = 6_000_000;
const PROFILE_KEY = 'dtable:profiles:v1';
const WORKSPACE_KEY = 'dtable:workspace:v2';
const profileId = id => id === 'default' || /^p-[a-z0-9-]{8,60}$/.test(id);
const own = (obj,key) => Object.prototype.hasOwnProperty.call(obj,key);

export function checkProfiles(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || value.version !== 1 ||
      !Array.isArray(value.profiles) || value.profiles.length < 1 || value.profiles.length > 12 ||
      typeof value.active !== 'string') throw Error('The household profile list is invalid.');
  const ids = new Set(), labels = new Set(), profiles = [];
  for (const item of value.profiles) {
    if (!item || typeof item !== 'object' || !profileId(item.id) || ids.has(item.id) ||
        typeof item.label !== 'string' || !item.label.trim() || item.label.length > 50 ||
        /[\u0000-\u001f]/.test(item.label)) throw Error('An invalid or duplicate kitchen profile was found.');
    ids.add(item.id);
    // Duplicate visible labels make a transfer ambiguous when choosing profiles.
    const lower = item.label.trim().toLocaleLowerCase('en-US');
    if (labels.has(lower)) throw Error('Two profiles have the same name. Rename one before transfer.');
    labels.add(lower);
    profiles.push({id:item.id,label:item.label.trim()});
  }
  if (!ids.has('default') || !ids.has(value.active)) throw Error('The default or active kitchen is missing.');
  return {version:1,active:value.active,profiles};
}

function workspaceKey(id) {return id === 'default' ? WORKSPACE_KEY : WORKSPACE_KEY + ':' + id;}
function listAppKeys(storage) {
  const keys=[];
  for (let i=0;i<storage.length;i++) {
    const key=storage.key(i);
    if (key === PROFILE_KEY || key === WORKSPACE_KEY || key.startsWith(WORKSPACE_KEY+':')) keys.push(key);
  }
  return keys;
}
function validateData(data) {
  if (!data || !Array.isArray(data.recipes) || !data.recipes.length ||
      !data.foodLabels || !Object.keys(data.foodLabels).length) throw Error('The local recipe catalog could not be validated.');
}
function validateWorkspaceJSON(raw,catalog,id) {
  if (raw == null) return null;
  if (typeof raw !== 'string' || raw.length > 1_000_000) throw Error('Kitchen '+id+' exceeds the 1 MB profile limit.');
  let state;
  try {state=JSON.parse(raw);}catch {throw Error('Kitchen '+id+' contains unreadable saved data.');}
  try {return validateWorkspace(state,catalog);}catch(error) {
    throw Error('Kitchen '+id+' failed validation: '+String(error.message || error));
  }
}

async function sha256(data) {
  if (!globalThis.crypto?.subtle) throw Error('Secure integrity checking is unavailable in this browser.');
  const bytes = new TextEncoder().encode(data);
  const digest = await crypto.subtle.digest('SHA-256',bytes);
  return Array.from(new Uint8Array(digest),v=>v.toString(16).padStart(2,'0')).join('');
}
function payloadCore(profiles,workspaces) {return {profiles,workspaces};}

export async function makeHouseholdTransfer(storage,catalog,createdAt=new Date().toISOString()) {
  validateData(catalog);
  const rawProfiles=storage.getItem(PROFILE_KEY);
  let input;
  if (rawProfiles == null) input={version:1,active:'default',profiles:[{id:'default',label:'Original kitchen'}]};
  else {try{input=JSON.parse(rawProfiles);}catch{throw Error('The saved profile list is unreadable. No transfer was created.');}}
  const profiles=checkProfiles(input), workspaces=Object.create(null);
  for (const profile of profiles.profiles) {
    const state=validateWorkspaceJSON(storage.getItem(workspaceKey(profile.id)),catalog,profile.label);
    workspaces[profile.id]=state;
  }
  const core=payloadCore(profiles,workspaces);
  const transfer={format:TRANSFER_FORMAT,version:TRANSFER_VERSION,createdAt,
    warning:'Private kitchen notes and family preferences. Store securely. Not cloud synchronization.',
    ...core,sha256:await sha256(JSON.stringify(core))};
  const json=JSON.stringify(transfer,null,2);
  if (new TextEncoder().encode(json).length>TRANSFER_LIMIT_BYTES)
    throw Error('The household transfer exceeds 6 MB. Export individual kitchens instead.');
  return {json,profileCount:profiles.profiles.length,savedCount:Object.values(workspaces).filter(Boolean).length,sha256:transfer.sha256};
}

export async function inspectHouseholdTransfer(text,catalog) {
  validateData(catalog);
  if (typeof text !== 'string' || new TextEncoder().encode(text).length>TRANSFER_LIMIT_BYTES)
    throw Error('Only Daily Table household transfer files up to 6 MB can be used.');
  let data;
  try {data=JSON.parse(text);}catch{throw Error('The transfer file is not valid JSON.');}
  if (!data || data.format!==TRANSFER_FORMAT || data.version!==TRANSFER_VERSION)
    throw Error('This is not a supported household transfer file. Use Export all kitchens first.');
  const profiles=checkProfiles(data.profiles);
  if (!data.workspaces || typeof data.workspaces !== 'object' || Array.isArray(data.workspaces))
    throw Error('The transfer contains no kitchen data.');
  const ids=profiles.profiles.map(item=>item.id);
  if (Object.keys(data.workspaces).length!==ids.length ||
      Object.keys(data.workspaces).some(id=>!ids.includes(id)))
    throw Error('The transfer contains missing or unexpected kitchen profiles.');
  if (typeof data.sha256!=='string' || !/^[0-9a-f]{64}$/.test(data.sha256))
    throw Error('The household integrity record is missing.');
  const actual=await sha256(JSON.stringify(payloadCore(data.profiles,data.workspaces)));
  if (actual!==data.sha256) throw Error('The transfer failed its SHA-256 integrity check. No data was changed.');
  const workspaces=Object.create(null);
  for (const profile of profiles.profiles) {
    const state=data.workspaces[profile.id];
    if (state===null) {workspaces[profile.id]=null;continue;}
    if (!state || typeof state!=='object' || Array.isArray(state))
      throw Error('Invalid workspace for '+profile.label+'.');
    const raw=JSON.stringify(state);
    workspaces[profile.id]=validateWorkspaceJSON(raw,catalog,profile.label);
  }
  return {profiles,workspaces,sourceCreatedAt:typeof data.createdAt==='string'?data.createdAt:'Unknown',
    savedCount:Object.values(workspaces).filter(Boolean).length,sha256:data.sha256};
}

/**
 * Synchronous user-authorized replace after all validation and explicit UI
 * confirmation. Restores original app-owned values on a storage-write failure.
 */
export function restoreHouseholdTransfer(storage,verified,{userConfirmed=false}={}) {
  if (!userConfirmed) throw Error('Explicit confirmation is required before replacing kitchens.');
  if (!verified?.profiles || !verified?.workspaces) throw Error('The transfer has not been validated.');
  const keys=new Set([...listAppKeys(storage),PROFILE_KEY,
    ...verified.profiles.profiles.map(item=>workspaceKey(item.id))]);
  const before=new Map([...keys].map(k=>[k,storage.getItem(k)]));
  const desired=new Map([[PROFILE_KEY,JSON.stringify(verified.profiles)]]);
  for (const profile of verified.profiles.profiles) {
    const data=verified.workspaces[profile.id];
    desired.set(workspaceKey(profile.id),data===null?null:JSON.stringify(data));
  }
  try {
    // Remove obsolete workspace entries first to avoid hidden stale-profile data.
    for (const key of keys) if (key!==PROFILE_KEY && !desired.has(key)) storage.removeItem(key);
    for (const [key,value] of desired) {
      if (key===PROFILE_KEY) continue; // Switch active profile only after data writes complete.
      if (value===null) storage.removeItem(key); else storage.setItem(key,value);
    }
    storage.setItem(PROFILE_KEY,desired.get(PROFILE_KEY));
    for (const key of keys) if (storage.getItem(key)!==(desired.get(key)??null))
      throw Error('Storage read-back did not match the transfer.');
    return {restored:verified.profiles.profiles.length,saved:verified.savedCount};
  } catch (error) {
    let rollbackProblem=false;
    try {
      // Clear partially written values before restoring the previous snapshot.
      for (const key of keys) storage.removeItem(key);
      for (const [key,value] of before) if (value!==null) storage.setItem(key,value);
      for (const [key,value] of before) if (storage.getItem(key)!==value) rollbackProblem=true;
    } catch {rollbackProblem=true;}
    throw Error(rollbackProblem ?
      'Restore failed and browser storage could not be fully rolled back. Check existing kitchens before proceeding.' :
      'Restore failed. Original kitchens were restored: '+String(error.message||error));
  }
}
