/** Settings-only UI. No cloud writes, photo uploads, or background synchronization. */
import {makeHouseholdTransfer,inspectHouseholdTransfer,restoreHouseholdTransfer} from './household-transfer-core-15.19.0.js?v=15.20.0';
import {encryptHouseholdTransfer,decryptHouseholdTransfer,isEncryptedTransfer,ENCRYPTED_LIMIT_BYTES} from './household-crypto-15.19.0.js?v=15.20.0';

const $ = id=>document.getElementById(id);
const root=$('household-transfer');
if(root){
 const status=$('household-transfer-status'),preview=$('household-transfer-preview'),summary=$('household-transfer-summary');
 const restore=$('household-transfer-restore'),ack=$('household-transfer-ack'),picker=$('household-transfer-file');
 const exportPassword=$('household-transfer-export-password'), exportConfirm=$('household-transfer-export-confirm');
 const importPassword=$('household-transfer-import-password'),unlockPanel=$('household-transfer-unlock-panel');
 const unlockButton=$('household-transfer-unlock');
 let prepared=null,pendingEncrypted=null,sequence=0,catalogPromise=null;
 const say=(message,tone='info')=>{status.textContent=message;status.dataset.tone=tone;};
 async function catalog(){
   if(!catalogPromise)catalogPromise=fetch('/assets/data.json?v=15.20.0',{cache:'force-cache',credentials:'same-origin'})
     .then(response=>{if(!response.ok)throw Error('Could not load the local recipe catalog.');return response.json();})
     .catch(error=>{catalogPromise=null;throw error;});
   return catalogPromise;
 }
 function saveFile(text,name){
   const url=URL.createObjectURL(new Blob([text],{type:'application/json'}));
   const a=document.createElement('a');a.href=url;a.download=name;
   document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30_000);
 }
 async function exportAll(encrypted){
   const button=$(encrypted?'household-transfer-export':'household-transfer-export-plain');
   button.disabled=true;
   try{
     let password='';
     if(encrypted){
       password=exportPassword.value;
       if(password!==exportConfirm.value)throw Error('The two backup passwords must match.');
       if(password.length<12)throw Error('Choose a backup password of at least 12 characters.');
     }
     const archive=await makeHouseholdTransfer(localStorage,await catalog());
     const output=encrypted?await encryptHouseholdTransfer(archive.json,password):archive.json;
     const date=new Date().toISOString().slice(0,10);
     saveFile(output,'daily-table-all-kitchens-'+date+(encrypted?'-ENCRYPTED':'-READABLE')+'.json');
     say((encrypted?'Encrypted':'Readable JSON')+' download requested for '+archive.profileCount+
       ' profiles ('+archive.savedCount+' saved). '+(encrypted?'Keep your password safely; it cannot be recovered.':
         'This file contains readable private kitchen information. Keep it secure.'));
   }catch(error){say('Export could not complete: '+String(error.message||error),'error');}
   finally{button.disabled=false;exportPassword.value='';exportConfirm.value='';}
 }
 $('household-transfer-export').addEventListener('click',()=>exportAll(true));
 $('household-transfer-export-plain').addEventListener('click',()=>exportAll(false));
 function resetReview(){
   sequence++;prepared=null;pendingEncrypted=null;preview.hidden=true;unlockPanel.hidden=true;
   ack.checked=false;restore.disabled=true;importPassword.value='';
 }
 async function inspectPlain(text,current){
   const checked=await inspectHouseholdTransfer(text,await catalog());
   if(current!==sequence)return;
   prepared=checked;
   const names=checked.profiles.profiles.map(item=>item.label).join(', ');
   summary.textContent=checked.profiles.profiles.length+' profile(s), '+checked.savedCount+
     ' with saved data. Profiles: '+names+'. Active kitchen: '+
     checked.profiles.profiles.find(item=>item.id===checked.profiles.active).label+
     '. Created: '+checked.sourceCreatedAt+'.';
   unlockPanel.hidden=true;preview.hidden=false;ack.checked=false;restore.disabled=true;
   say('File integrity and all saved kitchens validated. No data has been changed.');
 }
 picker.addEventListener('change',async()=>{
   resetReview();
   const current=sequence,file=picker.files?.[0];
   try{
     if(!file)return;
     if(file.size>ENCRYPTED_LIMIT_BYTES)throw Error('The transfer exceeds the 9 MB limit.');
     say('Reading the selected file on this device. No kitchen will be replaced.');
     const raw=await file.text();
     if(current!==sequence)return;
     if(isEncryptedTransfer(raw)){
       pendingEncrypted=raw;unlockPanel.hidden=false;
       say('This is an encrypted household transfer. Enter its password to review the profiles. Nothing is saved yet.');
       importPassword.focus({preventScroll:true});
     }else await inspectPlain(raw,current);
   }catch(error){if(current===sequence)say('Transfer rejected: '+String(error.message||error)+'. Existing kitchens are unchanged.','error');}
   finally{picker.value='';}
 });
 async function unlock(){
   if(!pendingEncrypted)return;
   unlockButton.disabled=true;const current=sequence;
   try{
     const plain=await decryptHouseholdTransfer(pendingEncrypted,importPassword.value);
     if(current!==sequence)return;
     await inspectPlain(plain,current);
     if(current===sequence)pendingEncrypted=null;
   }catch(error){if(current===sequence)say(String(error.message||error),'error');}
   finally{importPassword.value='';unlockButton.disabled=false;}
 }
 unlockButton.addEventListener('click',unlock);
 importPassword.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();unlock();}});
 ack.addEventListener('change',()=>{restore.disabled=!prepared||!ack.checked;});
 $('household-transfer-cancel').addEventListener('click',()=>{
   resetReview();say('Transfer cancelled. Existing kitchens were not changed.');
 });
 restore.addEventListener('click',()=>{
   if(!prepared||!ack.checked)return;
   if(!window.confirm('Replace ALL kitchens in this browser with the validated transfer? Existing profiles, plans, stock and notes here will be replaced. Other devices are not affected.'))return;
   restore.disabled=true;
   try{const result=restoreHouseholdTransfer(localStorage,prepared,{userConfirmed:true});
     say('Restored '+result.restored+' kitchens. Reloading this browser.');window.location.reload();
   }catch(error){say(String(error.message||error),'error');restore.disabled=false;}
 });
 $('household-transfer-health').addEventListener('click',async event=>{
   const button=event.currentTarget;button.disabled=true;
   const output=$('household-transfer-health-result');output.hidden=false;
   output.textContent='Checking local components and configuration. No photo or AI generation request will be made.';
   const checks=[];
   try{const data=await catalog();checks.push('Recipe catalog: '+data.recipes.length+' recipes; '+Object.keys(data.foodLabels).length+' ingredient names.');
     const snapshot=await makeHouseholdTransfer(localStorage,data);
     checks.push('Kitchen integrity: '+snapshot.profileCount+' profiles validated; '+snapshot.savedCount+' with saved data.');
   }catch(error){checks.push('Local data needs attention: '+String(error.message||error));}
   checks.push('Password-protected backups: '+(globalThis.crypto?.subtle?'available in this browser.':'unavailable; use HTTPS.'));
   checks.push('Device storage: '+(navigator.storage?.estimate?'checking':'quota unavailable')+'.');
   try{if(navigator.storage?.estimate){const estimate=await navigator.storage.estimate();
     checks[checks.length-1]='Device storage: '+(estimate.usage?Math.round(estimate.usage/1048576*10)/10+' MB used; ':'')+
       (estimate.quota?Math.round(estimate.quota/1048576)+' MB estimated quota.':'quota unknown.');}}
   catch{checks.push('Storage estimate unavailable.');}
   checks.push('Offline: '+(navigator.serviceWorker?.controller?'service worker controls this tab':'service worker not controlling this tab yet')+'.');
   for(const [label,path] of [['Photo AI','/api/vision/status'],['Recipe AI','/api/recipes/status']]){
     try{const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),8000);
       let response;try{response=await fetch(path,{cache:'no-store',credentials:'same-origin',signal:controller.signal});}finally{clearTimeout(timeout);}
       if(!response.ok)throw Error('HTTP '+response.status);
       const info=await response.json();
       checks.push(label+': '+(info.enabled===true?'configured':'not configured')+' (build '+String(info.build||'unknown').slice(0,32)+'). NOT a real AI inference test.');
     }catch(error){checks.push(label+': status unavailable ('+String(error.message||error).slice(0,100)+').');}
   }
   output.replaceChildren(...checks.map(line=>{const p=document.createElement('p');p.textContent=line;return p;}));
   say('Read-only health check completed. No photo or recipe generation request was made.');button.disabled=false;
 });
}
