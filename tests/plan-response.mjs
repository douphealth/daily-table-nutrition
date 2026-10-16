import fs from 'node:fs';
import {validateRecipeInput,planRecipe,validateRecipePlan} from '../site/_worker.js';
const input=validateRecipeInput(JSON.parse(fs.readFileSync(0,'utf8')));
const pre=planRecipe(input);
if(pre.blockers?.length){console.log(JSON.stringify({error:{message:pre.blockers.map(x=>x.message).join(' ')},blockers:pre.blockers}));}
else {const plan=validateRecipePlan(pre.plan,input);console.log(JSON.stringify({version:'1.0.0',build:'15.5.1',model:'simulated test response - not live AI',plan,checks:{exactSelectedFoods:true}}));}
