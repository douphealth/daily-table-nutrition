/**
 * The Daily Table 15.18: password-protected, portable household transfers.
 * All operations happen in the browser; no passwords or kitchen records are sent.
 * PBKDF2-HMAC-SHA256 / 250,000 rounds + AES-256-GCM (unique salt and IV).
 * This protects file confidentiality, not against password loss or device malware.
 */
export const ENCRYPTED_FORMAT = 'daily-table-household-encrypted';
export const ENCRYPTED_LIMIT_BYTES = 9_000_000;
const ROUNDS = 250_000;
const enc = new TextEncoder();
const dec = new TextDecoder('utf-8', {fatal:true});
const runtime = () => {
  const c=globalThis.crypto;
  if (!c?.subtle || !c.getRandomValues || !globalThis.isSecureContext && typeof window!=='undefined')
    throw Error('Password-protected transfers need a secure HTTPS browser with Web Crypto.');
  return c;
};
const b64 = bytes => {
  let value='';
  for(let i=0;i<bytes.length;i+=8192)
    value+=String.fromCharCode(...bytes.subarray(i,i+8192));
  return btoa(value);
};
const unb64 = (value,max) => {
  if (typeof value !== 'string' || !value || value.length>max || value.length%4===1 ||
      !/^[A-Za-z0-9+/]*={0,2}$/.test(value)) throw Error('Encrypted transfer has invalid encoded data.');
  const data=atob(value);
  return Uint8Array.from(data,c=>c.charCodeAt(0));
};
function validPassword(password) {
  if (typeof password!=='string' || password.length<12 || password.length>128 || /[\u0000-\u001f]/.test(password))
    throw Error('Use a password of 12–128 characters without control characters. Keep it safe; it cannot be recovered.');
}
const aad=enc.encode(ENCRYPTED_FORMAT+'|1|PBKDF2-SHA-256|AES-256-GCM|'+ROUNDS);
async function derive(password,salt) {
  const crypto=runtime();
  const key=await crypto.subtle.importKey('raw',enc.encode(password),'PBKDF2',false,['deriveKey']);
  return crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:ROUNDS,hash:'SHA-256'},key,
    {name:'AES-GCM',length:256},false,['encrypt','decrypt']);
}
export function isEncryptedTransfer(json) {
  if(typeof json!=='string' || json.length>ENCRYPTED_LIMIT_BYTES) return false;
  try{return JSON.parse(json)?.format===ENCRYPTED_FORMAT;}catch{return false;}
}
export async function encryptHouseholdTransfer(plainText,password) {
  validPassword(password);
  if(typeof plainText!=='string' || enc.encode(plainText).length>6_000_000)
    throw Error('The original transfer exceeds the 6 MB safety limit.');
  const crypto=runtime();
  const salt=crypto.getRandomValues(new Uint8Array(16));
  const iv=crypto.getRandomValues(new Uint8Array(12));
  const key=await derive(password,salt);
  const ciphertext=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:aad},key,enc.encode(plainText)));
  const out=JSON.stringify({format:ENCRYPTED_FORMAT,version:1,
    encryption:'AES-256-GCM',kdf:'PBKDF2-SHA-256',iterations:ROUNDS,
    salt:b64(salt),iv:b64(iv),ciphertext:b64(ciphertext)});
  if(enc.encode(out).length>ENCRYPTED_LIMIT_BYTES)throw Error('Encrypted transfer exceeds the 9 MB limit.');
  return out;
}
export async function decryptHouseholdTransfer(text,password) {
  validPassword(password);
  if(typeof text!=='string' || enc.encode(text).length>ENCRYPTED_LIMIT_BYTES)
    throw Error('Encrypted transfer must be a JSON file under 9 MB.');
  let item;
  try{item=JSON.parse(text);}catch{throw Error('This is not a valid encrypted household file.');}
  if(!item || item.format!==ENCRYPTED_FORMAT || item.version!==1 ||
     item.encryption!=='AES-256-GCM' || item.kdf!=='PBKDF2-SHA-256' || item.iterations!==ROUNDS)
    throw Error('This encrypted transfer format is unsupported.');
  const salt=unb64(item.salt,40), iv=unb64(item.iv,24), ciphertext=unb64(item.ciphertext,12_000_000);
  if(salt.length!==16 || iv.length!==12 || ciphertext.length<17 || ciphertext.length>6_000_016)
    throw Error('The encrypted transfer is malformed.');
  const key=await derive(password,salt);
  try {
    const raw=await runtime().subtle.decrypt({name:'AES-GCM',iv,additionalData:aad},key,ciphertext);
    if(raw.byteLength>6_000_000)throw Error('Decrypted transfer is too large.');
    return dec.decode(raw);
  } catch { throw Error('Could not unlock the transfer. Check the password and file integrity. Nothing has been changed.'); }
}
